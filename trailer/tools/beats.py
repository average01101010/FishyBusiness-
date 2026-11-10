"""Tempo, beats, bars and the loudness curve of the trailer's song, for the cut list (trailer/audio/music-edit-1.json).

    python trailer/tools/beats.py trailer/audio/suno/fjord-at-dawn.mp3 [--out trailer/audio/beats.json]

librosa's beat tracker on the whole song, the downbeats from the beat whose bar-position carries the most low-frequency onset
energy, the RMS loudness per beat (dB), and the places the loudness jumps (the sections: intro, build, drop, outro)."""
import sys, json, argparse
import numpy as np, librosa

ap = argparse.ArgumentParser(); ap.add_argument('song'); ap.add_argument('--out', default='trailer/audio/beats.json'); a = ap.parse_args()
y, sr = librosa.load(a.song, sr=22050, mono=True); dur = len(y) / sr
oenv = librosa.onset.onset_strength(y=y, sr=sr)
tempo, bt = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, units='time', tightness=120)
tempo = float(np.atleast_1d(tempo)[0]); bt = [float(x) for x in bt]
# the low end's onsets (kick, bass) per beat, to find which of the four beats in a bar is the one
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[fr < 150]), sr=sr)
lt = librosa.times_like(low, sr=sr); lowAt = [float(low[min(len(low) - 1, np.searchsorted(lt, b))]) for b in bt]
phase = int(np.argmax([sum(lowAt[i::4]) / max(1, len(lowAt[i::4])) for i in range(4)]))
bars = bt[phase::4]
rms = librosa.feature.rms(y=y, hop_length=512)[0]; rt = librosa.times_like(rms, sr=sr, hop_length=512)
def db_between(t0, t1):
    m = (rt >= t0) & (rt < t1); return float(20 * np.log10(max(1e-6, rms[m].mean()))) if m.any() else -120.0
beatdb = [round(db_between(b, (bt[i + 1] if i + 1 < len(bt) else dur)), 1) for i, b in enumerate(bt)]
bardb = [round(db_between(b, (bars[i + 1] if i + 1 < len(bars) else dur)), 1) for i, b in enumerate(bars)]
# section changes: a bar at least 3 dB louder or quieter than the one before
cuts = [{'t': round(bars[i], 3), 'bar': i, 'from': bardb[i - 1], 'to': bardb[i]} for i in range(1, len(bars)) if abs(bardb[i] - bardb[i - 1]) >= 3]
# the onset strength's peaks (hits): the strongest twelve
pk = librosa.util.peak_pick(oenv, pre_max=8, post_max=8, pre_avg=8, post_avg=8, delta=0.5, wait=10)
ot = librosa.times_like(oenv, sr=sr); hits = sorted(((float(oenv[i]), float(ot[i])) for i in pk), reverse=True)[:12]
out = {'song': a.song, 'dur': round(dur, 3), 'bpm': round(tempo, 2), 'beat_s': round(60 / tempo, 4), 'first_beat': round(bt[0], 3), 'downbeat_phase': phase,
       'beats': [round(b, 3) for b in bt], 'bars': [round(b, 3) for b in bars], 'beat_db': beatdb, 'bar_db': bardb, 'sections': cuts,
       'hits': [{'t': round(t, 3), 's': round(s, 2)} for s, t in sorted(hits, key=lambda q: q[1])],
       'silence_end': round(float(rt[np.where(20 * np.log10(np.maximum(rms, 1e-6)) > -45)[0][-1]]), 3)}
json.dump(out, open(a.out, 'w', encoding='utf-8'), indent=1)
print('varighet %.2fs, %.1f BPM (slag %.3fs), %d slag, %d takter, første slag %.2fs, lyd til %.2fs' % (dur, tempo, 60 / tempo, len(bt), len(bars), bt[0], out['silence_end']))
print('takter (s, dB):'); print(' '.join('%.2f:%.0f' % (b, d) for b, d in zip(bars, bardb)))
print('skifter:', cuts); print('treff:', out['hits'])
