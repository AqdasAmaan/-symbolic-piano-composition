
from pathlib import Path

import pretty_midi


def extract_midi_metadata(midi_path):
    midi_path = Path(midi_path)

    if not midi_path.is_file():
        raise FileNotFoundError(f"MIDI file not found: {midi_path}")

    midi = pretty_midi.PrettyMIDI(str(midi_path))

    duration = midi.get_end_time()

    instruments = midi.instruments
    notes = [
        note
        for instrument in instruments
        for note in instrument.notes
    ]

    note_count = len(notes)

    # Calculate the duration-weighted average tempo.
    tempo_times, tempi = midi.get_tempo_changes()

    average_tempo = None

    if duration > 0 and len(tempi) > 0:
        weighted_tempo = 0.0

        for index, tempo in enumerate(tempi):
            segment_start = tempo_times[index]

            segment_end = (
                tempo_times[index + 1]
                if index + 1 < len(tempo_times)
                else duration
            )

            segment_duration = max(
                0.0,
                min(segment_end, duration) - segment_start
            )

            weighted_tempo += tempo * segment_duration

        average_tempo = round(weighted_tempo / duration, 2)

    # Determine the pitch range.
    pitch_range = None

    if notes:
        pitches = [note.pitch for note in notes]

        pitch_range = {
            "lowest": pretty_midi.note_number_to_name(min(pitches)),
            "highest": pretty_midi.note_number_to_name(max(pitches)),
        }

    # Calculate note density.
    note_density = (
        round(note_count / duration, 2)
        if duration > 0
        else 0.0
    )

    # Extract instrument names.
    instrument_names = [
        "Drums"
        if instrument.is_drum
        else pretty_midi.program_to_instrument_name(instrument.program)
        for instrument in instruments
    ]

    return {
        "filename": midi_path.name,
        "duration_seconds": round(duration, 2),
        "note_count": note_count,
        "instrument_count": len(instruments),
        "instruments": instrument_names,
        "average_tempo": average_tempo,
        "pitch_range": pitch_range,
        "note_density": note_density,
    }
