# folha de contato: 3 quadros (começo, meio, fim) de cada cena, para revisar
import sys, os
from PIL import Image, ImageDraw
PASTA = os.environ.get('PASTA', 'quadros'); cenas = sorted(os.listdir(PASTA)) if len(sys.argv) < 3 else sys.argv[2:]
W, H = 480, 270
sheet = Image.new('RGB', (W * 3, H * len(cenas)), 'black'); d = ImageDraw.Draw(sheet)
for r, c in enumerate(cenas):
    fs = sorted(os.listdir(os.path.join(PASTA, c)))
    for k, i in enumerate([8, len(fs) // 2, len(fs) - 6]):
        sheet.paste(Image.open(os.path.join(PASTA, c, fs[i])).resize((W, H)), (k * W, r * H))
    d.text((6, r * H + 4), c, fill='yellow')
sheet.save(sys.argv[1])
