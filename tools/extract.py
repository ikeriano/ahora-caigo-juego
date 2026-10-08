# Extrae disfraces y sonidos del .sb3 original a public/sb3 + manifest.json
import json, zipfile, io, os, subprocess, sys, hashlib
from PIL import Image
SB3='/home/box/agent-data/agents/4536762c-4e46-49df-94d2-5245f861fdb7/attachments/08c7eadf0442eaaa0a30db503e28abb927b8528632049af2cb1644b2d552d479.sb3'
OUT='public/sb3'
z=zipfile.ZipFile(SB3); p=json.loads(z.read('project.json'))
SKIP=lambda n: (n.startswith('Teclado') and n!='Teclado27')
man={'sprites':{},'sounds':{}}
done_img={}; done_snd={}
for t in p['targets']:
    n=t['name']
    if SKIP(n): continue
    cs=[]
    for c in t['costumes']:
        f=c['md5ext']; base=f.split('.')[0]
        if f not in done_img:
            im=Image.open(io.BytesIO(z.read(f))).convert('RGBA')
            res=c.get('bitmapResolution',1)
            if res==1: im=im.resize((im.size[0]*2,im.size[1]*2))
            im.save(f'{OUT}/img/{base}.webp','WEBP',quality=88,method=5)
            done_img[f]=im.size
        w,h=done_img[f]
        k=2/c.get('bitmapResolution',1)
        cs.append({'n':c['name'],'f':base,'w':w,'h':h,'cx':c['rotationCenterX']*k/1,'cy':c['rotationCenterY']*k/1})
    man['sprites'][n]={'x':t.get('x',0),'y':t.get('y',0),'size':t.get('size',100),'c':cs}
    for s in t.get('sounds',[]):
        f=s['md5ext']; base=f.split('.')[0]
        if f not in done_snd:
            open('/tmp/_s.'+s['dataFormat'],'wb').write(z.read(f))
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/_s.'+s['dataFormat'],'-b:a','112k',f'{OUT}/snd/{base}.mp3'],check=True)
            done_snd[f]=1
        man['sounds'].setdefault(s['name'],base)
        man['sprites'][n].setdefault('s',{})[s['name']]=base
json.dump(man,open(f'{OUT}/manifest.json','w'),ensure_ascii=False)
print(len(done_img),'imgs',len(done_snd),'snds')

# Paneles de pregunta sin la cuadrícula A-Z (arreglo del trabajador del modo Clásico)
from PIL import Image as _I
for _src,_md5 in (('principal_sin_teclado.png','a0679a8a8d108bcd880d62dd735de592'),('final_sin_teclado.png','f7792007b51412279cf3a3fdc32bbaea')):
    _I.open('/workspace/scratch-apk/src/panelfix/'+_src).save('public/sb3/img/'+_md5+'.webp',quality=90)
