import os
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask

load_dotenv(Path(__file__).with_name(".env"))

from model import load_model  # noqa: E402
from generation import OUTPUT_DIR, generate_midi, warm_up  # noqa: E402

# Only one composition is generated at a time: the model is not built for
# concurrent generation, and overlapping runs just make each other slower.
generation_lock = Lock()


def get_allowed_origins():
    """Origins allowed to call the API from a browser (CORS).

    Set ALLOWED_ORIGINS to a comma-separated list, e.g.
    "https://my-app.example.com,http://192.168.1.20:5173".
    Not needed when the frontend is served by this app or reached through
    the Vite dev-server proxy, because those requests are same-origin.
    """
    raw = os.getenv("ALLOWED_ORIGINS", "")
    origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    return origins or [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def delete_file(path):
    try:
        Path(path).unlink(missing_ok=True)
    except OSError:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    model, tokenizer, device = load_model()

    app.state.model = model
    app.state.tokenizer = tokenizer
    app.state.device = device

    try:
        warm_up(model, tokenizer, device)
        print("Model warm-up complete.")
    except Exception as error:  # Never block startup on a warm-up failure.
        print(f"Model warm-up skipped: {error}")

    yield


app = FastAPI(
    title="NOCTURNE API",
    description="API for symbolic piano music generation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,  # The API uses no cookies.
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerationRequest(BaseModel):
    max_new_tokens: int = Field(default=256, ge=32, le=2000)
    temperature: float = Field(default=2.5, gt=0, le=5)
    top_k: int = Field(default=15, ge=1, le=100)
    top_p: float = Field(default=0.95, gt=0, le=1)



@app.get("/api/health")
def health_check(request: Request):
    model_loaded = (
        getattr(request.app.state, "model", None) is not None
        and getattr(request.app.state, "tokenizer", None) is not None
    )

    return {
        "status": "ready" if model_loaded else "not_ready",
        "backend": "online",
        "model_loaded": model_loaded,
        "device": (
            str(request.app.state.device)
            if model_loaded
            else None
        ),
    }


@app.post("/api/generate")
def generate_composition(request: GenerationRequest):
    if not generation_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail=(
                "Another composition is still being generated. "
                "Please try again in a moment."
            ),
        )

    try:
        filename = f"composition_{uuid4().hex[:8]}.mid"

        output_path = generate_midi(
            model=app.state.model,
            tokenizer=app.state.tokenizer,
            device=app.state.device,
            max_new_tokens=request.max_new_tokens,
            temperature=request.temperature,
            top_k=request.top_k,
            top_p=request.top_p,
            output_path=OUTPUT_DIR / filename,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {error}",
        ) from error
    finally:
        generation_lock.release()

    # The file is only needed for this response; delete it once sent so
    # the disk does not fill up over time.
    return FileResponse(
        path=output_path,
        media_type="audio/midi",
        filename=filename,
        background=BackgroundTask(delete_file, output_path),
    )


# Serve the built frontend from this same app (single-service deployment).
# Set FRONTEND_DIST to the frontend's "dist" folder. Mounted last so the
# /api routes above take priority.
frontend_dist = os.getenv("FRONTEND_DIST")

if frontend_dist and Path(frontend_dist).is_dir():
    app.mount(
        "/",
        StaticFiles(directory=frontend_dist, html=True),
        name="frontend",
    )