# Monta o Apagão: junta src/*.js, style.css, ui.html e as fontes (pegas do style.css do projeto) em dist/apagao.html (página única)
# e em tools/teste.html (a mesma coisa, com cabeçalho, para os testes).
import os, re, glob, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js = '\n'.join(open(f).read() for f in sorted(glob.glob(os.path.join(R, 'src', '*.js'))))
open(os.path.join(R, 'dist', 'apagao.js'), 'w').write(js)
subprocess.check_call(['node', '--check', os.path.join(R, 'dist', 'apagao.js')])
base = open(os.path.join(R, '..', 'style.css')).read()
faces = re.findall(r"@font-face\s*{[^}]*}", base)
keep = [f for f in faces if "'BRND Anton'" in f or ("'BRND Cond'" in f and 'weight: 700' in f) or ("'BRND Sans'" in f and ('weight: 500' in f or 'weight: 600' in f))]
css = '\n'.join(keep) + '\n' + open(os.path.join(R, 'style.css')).read()
body = open(os.path.join(R, 'ui.html')).read()
page = '<title>Apagão</title>\n<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + js + '\n</script>\n'
open(os.path.join(R, 'dist', 'apagao.html'), 'w').write(page)
open(os.path.join(R, 'tools', 'teste.html'), 'w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + page + '</body></html>')
os.remove(os.path.join(R, 'dist', 'apagao.js'))
print('ok: dist/apagao.html (%d KB)' % (len(page) // 1024))
