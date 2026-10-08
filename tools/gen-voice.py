# Genera mp3 con piper (voz genérica es_ES "davefx", ritmo de presentador) para cada frase
import json, os, sys, subprocess, re
lines = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
MODEL = '/workspace/tts/es_ES-davefx-medium.onnx'
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
n = 0
for l in lines:
    mp3 = os.path.join(out, l['h'] + '.mp3')
    if l['h'] in idx and os.path.exists(mp3): continue
    wav = '/tmp/voz.wav'
    subprocess.run(['/workspace/.venv-asr/bin/piper', '-m', MODEL, '--length_scale', '0.86', '--sentence_silence', '0.12', '-f', wav], input=clean(l['t']).encode(), check=True, capture_output=True)
    # un poco más de energía: compresión suave + agudos
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'acompressor=threshold=-18dB:ratio=3:attack=5:release=60,treble=g=3,volume=1.6,alimiter=limit=0.95', '-ac', '1', '-ar', '22050', '-b:a', '56k', mp3], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], capture_output=True, text=True).stdout.strip())
    idx[l['h']] = round(d, 2); n += 1
json.dump(idx, open(idx_path, 'w'))
print('voz:', n, 'nuevas,', len(idx), 'en total')
