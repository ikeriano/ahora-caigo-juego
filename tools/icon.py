from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
S=1024
def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f,sz)
    return ImageFont.load_default()
def make(bg=True):
    im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if bg:
        for y in range(S):
            t=y/S; d.line([(0,y),(S,y)],fill=(int(4+20*t),int(12+30*t),int(60+80*(1-abs(t-.5)*2)),255))
    cx,cy,R=S//2,int(S*0.40),int(S*0.30)
    glow=Image.new('RGBA',(S,S),(0,0,0,0)); gd=ImageDraw.Draw(glow); gd.ellipse([cx-R-30,cy-R-30,cx+R+30,cy+R+30],fill=(255,140,20,170)); glow=glow.filter(ImageFilter.GaussianBlur(30)); im.alpha_composite(glow)
    d.ellipse([cx-R-22,cy-R-22,cx+R+22,cy+R+22],fill=(14,50,190,255))
    d.ellipse([cx-R,cy-R,cx+R,cy+R],fill=(40,44,56,255),outline=(245,130,20,255),width=26)
    d.line([(cx,cy-R+26),(cx,cy+R-26)],fill=(10,10,14,255),width=8)
    for sx in (-1,1):
        x=cx+sx*int(R*0.33); w=int(R*0.26)
        d.rounded_rectangle([x-w//2,cy-int(R*0.55),x+w//2,cy+int(R*0.12)],radius=w//2,fill=(255,200,30,255))
        d.rounded_rectangle([x-int(w*0.42),cy+int(R*0.2),x+int(w*0.42),cy+int(R*0.5)],radius=w//2,fill=(255,200,30,255))
    f=font(150)
    for txt,y in (('¡AHORA',int(S*0.70)),('CAIGO!',int(S*0.86))):
        w=d.textlength(txt,font=f); d.text((cx-w/2,y-80),txt,font=f,fill=(255,255,255,255),stroke_width=14,stroke_fill=(8,20,90,255))
    return im
os.makedirs('public',exist_ok=True)
full=make()
for n in (192,512): full.resize((n,n),Image.LANCZOS).save(f'public/icon-{n}.png')
full.save('tools/icon_1024.png')
make(False).save('tools/icon_fg_1024.png')
