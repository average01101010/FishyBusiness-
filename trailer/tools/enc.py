"""The trailer's export settings in one place (10.11.2026, after the settings of a 4K vertical trailer that did well on TikTok):
H.264 CRF 13 preset slow, yuv420p tagged BT.709 limited range, AAC 320 kbit/s 48 kHz, MP4 with faststart; the sound at -14 LUFS and
at most -1.5 dBTP, then the whole mix turned down to 60 % (Jonas 10.11.2026), about -18.5 LUFS.

Browser screenshots are full-range RGB (PNG) or full-range BT.601 YCbCr (JPEG). Without the conversion and the tags a phone shows
the film grey or too dark, so every encode goes through video_args()."""
import os, re, json, shutil, subprocess

CRF = 13
def ffmpeg(): return shutil.which('ffmpeg') or os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')

def video_args(crf=CRF, preset='slow', scale='trunc(iw/2)*2:trunc(ih/2)*2'):
    """from full-range pictures to tagged BT.709 limited-range H.264"""
    vf = 'scale=%s:flags=lanczos+accurate_rnd+full_chroma_int:in_range=full:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709,format=yuv420p' % scale
    return ['-vf', vf, '-c:v', 'libx264', '-preset', preset, '-crf', str(crf), '-pix_fmt', 'yuv420p',
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
            '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv']

AUDIO = ['-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2']

def loudness(path, af=None):
    """integrated loudness (LUFS) and true peak (dBTP) of a sound file, after the filter chain `af` if one is given"""
    r = subprocess.run([ffmpeg(), '-hide_banner', '-nostats', '-i', path, '-af', (af + ',' if af else '') + 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    s = r.stderr[r.stderr.rfind('Summary:'):]
    i = re.search(r'I:\s*(-?[\d.]+) LUFS', s); p = re.search(r'Peak:\s*(-?[\d.]+) dBFS', s)
    if not i or not p: raise RuntimeError('ebur128 ga ingen måling av ' + path + ': ' + r.stderr[-300:])
    return float(i.group(1)), float(p.group(1))

# The voice (first take 10.11.2026): the lines of one take differed by 9 dB in level and their peaks stood 17-20 dB over their loudness, so
# the quietest line set the music's level (25 dB down) and the peaks held the whole mix at -27 LUFS. Each line is therefore first moved
# to the same loudness (VREF), then compressed 4:1 from 4 dB under it and limited 9 dB over it, so the lines are even and the mix can
# be lifted. The music still gets one fixed level for the whole film.
VREF = -20.0
def voice_af(gain_db=0.0):
    return 'highpass=f=70,volume=%.2fdB,acompressor=ratio=4:threshold=%.0fdB:attack=5:release=120:makeup=1,alimiter=limit=%.4f:attack=3:release=60:level=disabled' % (gain_db, VREF - 4, 10 ** ((VREF + 9) / 20))
VOICE_AF = voice_af()
DIP_AF = 'equalizer=f=2500:t=q:w=1.0:g=-3'

def master(song, dur, out, voice=None, lufs=-14.0, tp=-1.5, level=0.6, over=8.0, fade=0.0):
    """the film's sound as a 48 kHz stereo WAV: the song from its start at one fixed level (never ducked), the voice on top if there is
    one, the whole mix moved with one plain gain to `lufs` (less if the true peak would pass `tp`), then times `level`.

    voice: a list of {'file', 'at'} (seconds into the film). Each is high-passed at 70 Hz, moved to the same loudness, compressed (4:1) and limited (voice_af); the
    song gets a 3 dB dip round 2.5 kHz to leave it room, and is turned down only as far as it takes for the voice to lie `over` LU
    above it. fade: seconds of fade-out at the end of the film. Returns what was measured."""
    voice = voice or []; rep = {}
    ins = ['-i', song]; chain = []; mus = 'aresample=48000,aformat=channel_layouts=stereo'
    if voice:
        for v in voice: ins += ['-i', v['file']]
        vg = [VREF - loudness(v['file'], 'highpass=f=70')[0] for v in voice]; rep['voice_gain_db'] = [round(x, 1) for x in vg]
        vl = [loudness(v['file'], voice_af(g))[0] for v, g in zip(voice, vg)]; ml = loudness(song, DIP_AF)[0]
        g = min(0.0, min(vl) - over - ml); rep['music_gain_db'] = round(g, 2); rep['voice_lufs'] = [round(x, 1) for x in vl]; rep['music_lufs'] = round(ml, 1)
        mus += ',' + DIP_AF + ',volume=%.2fdB' % g
    chain.append('[0:a]%s[m]' % mus); mixin = '[m]'
    for k, v in enumerate(voice):
        ms = int(round(v['at'] * 1000))
        chain.append('[%d:a]aresample=48000,%s,aformat=channel_layouts=stereo,adelay=%d:all=1[v%d]' % (k + 1, voice_af(vg[k]), ms, k)); mixin += '[v%d]' % k
    tail = 'atrim=0:%.3f' % dur + (',afade=t=out:st=%.3f:d=%.3f' % (dur - fade, fade) if fade else '') + ',apad=whole_dur=%.3f' % dur
    chain.append(('%samix=inputs=%d:normalize=0:duration=longest,' % (mixin, len(voice) + 1) if voice else '[m]') + tail + '[o]')
    raw = out.replace('.wav', '-raw.wav')
    r = subprocess.run([ffmpeg(), '-y', '-loglevel', 'error'] + ins + ['-filter_complex', ';'.join(chain), '-map', '[o]', '-c:a', 'pcm_s24le', '-ar', '48000', raw])
    if r.returncode: raise RuntimeError('lydmiksen feilet')
    I, P = loudness(raw); g = min(lufs - I, tp - P); lin = 10 ** (g / 20) * level
    r = subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', raw, '-af', 'volume=%.6f' % lin, '-c:a', 'pcm_s24le', out])
    if r.returncode: raise RuntimeError('lydnivået feilet')
    os.remove(raw); I2, P2 = loudness(out)
    rep.update({'in_lufs': I, 'in_peak': P, 'gain_db': round(g, 2), 'peak_limited': tp - P < lufs - I, 'level': level, 'out_lufs': I2, 'out_peak': P2})
    json.dump(rep, open(out.replace('.wav', '.json'), 'w'), indent=1)
    return rep
