
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from model import load_model
from generation import generate_midi


@asynccontextmanager
async def lifespan(app: FastAPI):
    model, tokenizer, device = load_model()

    app.state.model = model
    app.state.tokenizer = tokenizer
    app.state.device = device

    yield


app = FastAPI(
    title="NOCTURNE API",
    description="API for symbolic piano music generation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
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
            output_path=f"../../outputs/finetuned/{filename}",
        )

        return FileResponse(
            path=output_path,
            media_type="audio/midi",
            filename=filename,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {error}",
        ) from error
