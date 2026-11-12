# Junta index.html + style.css + game.js numa página única (dist/) e numa cópia para os testes.
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(R, 'index.html')).read(); css = open(os.path.join(R, 'style.css')).read(); js = open(os.path.join(R, 'game.js')).read()
body = html[html.index('<body>') + 6:html.index('<script src="game.js"></script>')]
css = css.replace(":root {\n", ":root {\n  color-scheme: dark;\n", 1)
page = '<title>BR Night Drive</title>\n<style>\n' + css + '\n</style>\n' + body + '<script>\n' + js + '\n</script>\n'
os.makedirs(os.path.join(R, 'dist'), exist_ok=True)
open(os.path.join(R, 'dist', 'br-night-drive.html'), 'w').write(page)
open(os.path.join(R, 'tools', 'tests', 'wrapped.html'), 'w').write('<!doctype html><html><head><meta charset="utf-8"></head><body>\n' + page + '</body></html>')
