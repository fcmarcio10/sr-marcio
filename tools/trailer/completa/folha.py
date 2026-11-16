import sys, glob
from PIL import Image, ImageDraw
d, out, ini = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0
fs = sorted(glob.glob(d + '/*.jpg')); fs = [f for f in fs if int(f[-10:-4]) >= ini]
n = 20; sel = fs[::max(1, len(fs) // n)][:n]
W = Image.new('RGB', (5 * 400, 4 * 225))
for k, f in enumerate(sel):
    im = Image.open(f).resize((400, 225)); ImageDraw.Draw(im).text((4, 4), str(int(f[-10:-4]) / 60) + 's', fill='yellow'); W.paste(im, ((k % 5) * 400, (k // 5) * 225))
W.save(out)
