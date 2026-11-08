
from pathlib import Path
from metadata import extract_midi_metadata


BASE_DIR = Path(__file__).resolve().parents[2]

MIDI_PATH = (
    BASE_DIR
    / "outputs"
    / "finetuned"
    / "composition_1f015d75.mid"
)


if __name__ == "__main__":
    metadata = extract_midi_metadata(MIDI_PATH)

    print("\nMIDI Metadata")
    print("-" * 35)

    for key, value in metadata.items():
        print(f"{key}: {value}")
