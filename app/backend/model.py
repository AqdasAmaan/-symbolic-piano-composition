
import os
from pathlib import Path

import torch
from dotenv import load_dotenv
from miditok import REMI
from transformers import AutoModelForCausalLM


BASE_DIR = Path(__file__).resolve().parents[2]
TOKENIZER_PATH = BASE_DIR / "configs" / "tokenizer.json"

load_dotenv(Path(__file__).with_name(".env"))


def load_model():
    model_path = os.getenv("MODEL_PATH")

    if not model_path:
        raise ValueError("MODEL_PATH is not configured in .env")

    model_path = Path(model_path)

    if not model_path.is_dir():
        raise FileNotFoundError(
            f"Model checkpoint not found: {model_path}"
        )

    if not TOKENIZER_PATH.is_file():
        raise FileNotFoundError(
            f"Tokenizer configuration not found: {TOKENIZER_PATH}"
        )

    device_setting = os.getenv("DEVICE", "auto").lower()

    if device_setting == "auto":
        device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
    elif device_setting == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA was requested but is unavailable.")
        device = torch.device("cuda")
    elif device_setting == "cpu":
        device = torch.device("cpu")
    else:
        raise ValueError(f"Unsupported DEVICE: {device_setting}")

    dtype = (
        torch.float16
        if device.type == "cuda"
        else torch.float32
    )

    print(f"Loading model from: {model_path}")
    print(f"Using device: {device}")

    tokenizer = REMI(params=TOKENIZER_PATH)

    model = AutoModelForCausalLM.from_pretrained(
        str(model_path),
        torch_dtype=dtype,
        local_files_only=True,
    )

    model.to(device)
    model.eval()

    model_vocab_size = model.config.vocab_size
    tokenizer_vocab_size = len(tokenizer)

    if model_vocab_size != tokenizer_vocab_size:
        raise ValueError(
            "Model and tokenizer vocabulary sizes do not match: "
            f"{model_vocab_size} != {tokenizer_vocab_size}"
        )

    print("Model loaded successfully.")
    print(f"Vocabulary size: {model_vocab_size}")

    return model, tokenizer, device
