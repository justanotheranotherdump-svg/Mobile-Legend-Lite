// Original eight-bar instrumental composition, synthesized locally. No samples,
// external music, singing, or copied commercial melodies. MIDI note numbers.
export const SCORE = Object.freeze({
  chords: [
    [50, 57, 62, 65],
    [46, 53, 58, 62],
    [53, 60, 65, 69],
    [48, 55, 60, 64],
    [50, 57, 62, 65],
    [46, 53, 58, 62],
    [55, 59, 62, 67],
    [45, 52, 57, 61],
  ],
  melody: [
    74, 69, 77, 76, 74, 72, 69, 65, 70, 74, 77, 74, 72, 69, 67, 65, 69, 72, 77,
    79, 81, 77, 76, 72, 76, 79, 72, 74, 76, 72, 67, 64, 74, 77, 81, 79, 77, 74,
    72, 69, 70, 74, 77, 79, 77, 74, 70, 65, 71, 74, 79, 81, 79, 74, 71, 67, 73,
    76, 81, 79, 76, 73, 69, 73,
  ],
});
export const midiFrequency = (note) => 440 * 2 ** ((note - 69) / 12);
export const beatSeconds = (scene) => 60 / (scene === "training" ? 106 : 82);
export function tone(
  ctx,
  destination,
  { note, start, duration, gain = 0.08, type = "sine", pan = 0 },
  voices,
) {
  const oscillator = ctx.createOscillator(),
    envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = midiFrequency(note);
  const attack = Math.min(0.08, duration * 0.14),
    end = start + duration;
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(gain, start + attack);
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    Math.max(start + attack + 0.001, end),
  );
  oscillator.connect(envelope);
  let output = envelope;
  if (ctx.createStereoPanner) {
    output = ctx.createStereoPanner();
    output.pan.value = pan;
    envelope.connect(output);
  }
  output.connect(destination);
  voices?.add(oscillator);
  oscillator.onended = () => {
    voices?.delete(oscillator);
    oscillator.disconnect();
    envelope.disconnect();
    if (output !== envelope) output.disconnect();
  };
  oscillator.start(start);
  oscillator.stop(end + 0.02);
  return oscillator;
}
export function scheduleBeat(ctx, bus, scene, beat, start, voices) {
  const seconds = beatSeconds(scene),
    bar = Math.floor(beat / 4) % 8,
    chord = SCORE.chords[bar];
  let notes = 0;
  if (beat % 4 === 0)
    for (let i = 0; i < chord.length; i++) {
      tone(
        ctx,
        bus,
        {
          note: chord[i],
          start,
          duration: seconds * 3.8,
          gain: 0.026,
          type: "triangle",
          pan: (i - 1.5) * 0.35,
        },
        voices,
      );
      notes++;
    }
  const melody = SCORE.melody[(beat * 2) % SCORE.melody.length];
  tone(
    ctx,
    bus,
    {
      note: melody,
      start,
      duration: seconds * 0.85,
      gain: 0.11,
      type: "sine",
      pan: 0.15,
    },
    voices,
  );
  notes++;
  if (beat % 2 === 0) {
    tone(
      ctx,
      bus,
      {
        note: SCORE.melody[(beat * 2 + 1) % 64] + 12,
        start: start + seconds * 0.5,
        duration: seconds * 0.65,
        gain: 0.036,
        type: "sine",
        pan: -0.35,
      },
      voices,
    );
    notes++;
  }
  if (scene === "training") {
    tone(
      ctx,
      bus,
      {
        note: chord[0] - 12,
        start,
        duration: seconds * 0.7,
        gain: 0.095,
        type: "triangle",
        pan: 0,
      },
      voices,
    );
    notes++;
    tone(
      ctx,
      bus,
      {
        note: beat % 2 === 0 ? 33 : 45,
        start: start + seconds * 0.02,
        duration: 0.1,
        gain: 0.12,
        type: "sine",
      },
      voices,
    );
    notes++;
    tone(
      ctx,
      bus,
      {
        note: 88,
        start: start + seconds * 0.5,
        duration: 0.045,
        gain: 0.016,
        type: "triangle",
        pan: -0.4,
      },
      voices,
    );
    notes++;
  }
  return notes;
}
export async function renderMusicProof() {
  const Offline =
    globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!Offline) return null;
  const ctx = new Offline(2, 44100 * 3, 44100),
    gain = ctx.createGain();
  gain.gain.value = 0.45;
  gain.connect(ctx.destination);
  for (let b = 0; b < 4; b++)
    scheduleBeat(ctx, gain, "lobby", b, b * beatSeconds("lobby"));
  const buffer = await ctx.startRendering();
  let energy = 0,
    peak = 0;
  const data = buffer.getChannelData(0);
  for (const sample of data) {
    energy += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  return {
    samples: data.length,
    sampleRate: buffer.sampleRate,
    rms: Math.sqrt(energy / data.length),
    peak,
    channels: buffer.numberOfChannels,
  };
}
