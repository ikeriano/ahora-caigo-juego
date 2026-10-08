# Genera mp3 con piper (voces GENÉRICAS de piper-voices, nunca clonación) para cada frase.
#  - presentador: es_ES "davefx" (ritmo de presentador)
#  - oponentes: voces genéricas distintas (sharvard M/F, carlfm, ald, daniela) con pequeños cambios de tono
# Carga cada modelo una sola vez y convierte a mp3 en paralelo.
import json, os, sys, subprocess, re, wave
from concurrent.futures import ThreadPoolExecutor
from piper import PiperVoice, SynthesisConfig
data = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
lines = data['lines'] if isinstance(data, dict) else data
VOCES = data.get('voces', {}) if isinstance(data, dict) else {}
TTS = '/workspace/tts/'
HOST = {'model': 'es_ES-davefx-medium', 'len': 0.86, 'pitch': 1.0}
idx_path = os.path.join(out, 'index.json')
idx = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
keep = {l['h'] for l in lines}
for f in os.listdir(out):
    if f.endswith('.mp3') and f[:-4] not in keep: os.remove(os.path.join(out, f))
idx = {k: v for k, v in idx.items() if k in keep}
def clean(t):
    t = t.replace('«', '').replace('»', '').replace('…', '... ')
    t = re.sub(r'¡¡', '¡', t); t = re.sub(r'!!', '!', t)
    return t
todo = [l for l in lines if not (l['h'] in idx and os.path.exists(os.path.join(out, l['h'] + '.mp3')))]
groups = {}
for l in todo: groups.setdefault(l.get('v') or '', []).append(l)
tmp = '/tmp/vozwav'; os.makedirs(tmp, exist_ok=True)
def encode(l, v):
    wav = os.path.join(tmp, l['h'] + '.wav'); mp3 = os.path.join(out, l['h'] + '.mp3')
    af = 'acompressor=threshold=-18dB:ratio=3:attack=5:release=60,treble=g=3,volume=1.6,alimiter=limit=0.95'
    if abs(v.get('pitch', 1) - 1) > 0.01: af = f"rubberband=pitch={v['pitch']}," + af
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', af, '-ac', '1', '-ar', '22050', '-b:a', '56k' if v is HOST else '48k', mp3], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], capture_output=True, text=True).stdout.strip())
    os.remove(wav); return l['h'], round(d, 2)
pool = ThreadPoolExecutor(4); futs = []
for vid, ls in groups.items():
    v = VOCES.get(vid) or HOST
    pv = PiperVoice.load(TTS + v['model'] + '.onnx')
    cfg = SynthesisConfig(speaker_id=v.get('spk'), length_scale=v['len'])
    for l in ls:
        wav = os.path.join(tmp, l['h'] + '.wav')
        with wave.open(wav, 'wb') as w:
            first = True
            for ch in pv.synthesize(clean(l['t']), cfg):
                if first: w.setnchannels(1); w.setsampwidth(2); w.setframerate(ch.sample_rate); first = False
                else: w.writeframes(b'\x00\x00' * int(ch.sample_rate * 0.12))
                w.writeframes(ch.audio_int16_bytes)
        futs.append(pool.submit(encode, l, v))
    print('voz', vid or 'presentador', len(ls), 'frases', flush=True)
for f in futs: h, d = f.result(); idx[h] = d
json.dump(idx, open(idx_path, 'w'))
print('voz:', len(futs), 'nuevas,', len(idx), 'en total')
