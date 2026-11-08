
from pathlib import Path

import torch


BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_DIR = BASE_DIR / "outputs" / "finetuned"


def generate_midi(
    model,
    tokenizer,
    device,
    max_new_tokens=2000,
    temperature=2.5,
    top_k=15,
    top_p=0.95,
    output_path=None,
):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if output_path is None:
        output_path = OUTPUT_DIR / "generated_piano.mid"
    else:
        output_path = Path(output_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Start generation with the REMI beginning-of-sequence token.
    bos_token_id = tokenizer["BOS_None"]

    input_ids = torch.tensor(
        [[bos_token_id]],
        dtype=torch.long,
        device=device,
    )

    print("Generating piano composition...")

    model.eval()

    with torch.inference_mode():
        generated = model.generate(
            input_ids=input_ids,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            pad_token_id=model.config.eos_token_id,
        )

    generated_ids = generated[0].tolist()

    print(f"Generated {len(generated_ids)} tokens.")
    print("Converting tokens to MIDI...")

    score = tokenizer.decode([generated_ids])
    score.dump_midi(output_path)

    print(f"MIDI saved to: {output_path}")

    return output_path


if __name__ == "__main__":
    from model import load_model

    model, tokenizer, device = load_model()

    generate_midi(
        model=model,
        tokenizer=tokenizer,
        device=device,
        max_new_tokens=256,  # Initial CPU test
        temperature=2.5,
        top_k=15,
        top_p=0.95,
    )
