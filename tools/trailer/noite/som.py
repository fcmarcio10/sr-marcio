#!/usr/bin/env python3
# Trilha do trailer "Primeira noite": música original anos 80 a 110 BPM (Mi menor: Mim Dó Sol Ré), uma parte para
# cada pedaço da história, com corte seco e disco arranhando nas piadas; + o som original do jogo (saida/jogo.wav,
# feito pelo som_jogo.js: motor, musiquinha do gás, chuva, batidas, celular) + efeitos de comédia (carimbo, boing,
# trombone, calota) + as falas (voz/<id>.mp3). O DJ soa como rádio do carro; ligação e áudio de zap soam como telefone.
# A música e o jogo abaixam sozinhos quando alguém fala.
# uso (de dentro de tools/trailer/noite):  python3 som.py  ->  saida/trilha.wav
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
AQUI = os.path.dirname(os.path.abspath(__file__))
TRD = os.path.join(AQUI, '..')
EV = os.path.join(AQUI, 'eventos')
info = json.load(open(os.path.join(EV, '_linha.json')))
BPM = info['bpm']; BEAT = 60 / BPM; BAR = 4 * BEAT; STEP = BEAT / 4
NBARS = sum(c['bars'] for c in info['cenas'])
DUR = NBARS * BAR
N = int((DUR + 0.5) * SR)
rng = np.random.default_rng(23)

def filt(x, kind, f, order=2):
    if kind == 'band': sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'band', output='sos')
    else: sos = butter(order, f / (SR / 2), kind, output='sos')
    return sosfilt(sos, x, axis=-1)
lp = lambda x, f, o=2: filt(x, 'low', f, o)
hp = lambda x, f, o=2: filt(x, 'high', f, o)
bp = lambda x, lo, hi, o=2: filt(x, 'band', (lo, hi), o)
def tt(sec): return np.arange(int(sec * SR)) / SR
def noise(n): return rng.standard_normal(n)
def midi(m): return 440 * 2 ** ((m - 69) / 12)

# instrumentos e efeitos do primeiro trailer (bumbo, chimbal, pad, riser, impacto, whoosh, carimbo, boing, trombone...)
src = open(os.path.join(TRD, 'som.py'), encoding='utf8').read()
exec(src[src.index('# ---------------- instrumentos'):src.index('# ---------------- música')])

BUS = ('bateria', 'baixo', 'pad', 'arp', 'lead', 'fx', 'sfx', 'amb')
bus = {k: np.zeros((2, N)) for k in BUS}
send = np.zeros((2, N)); eco = np.zeros((2, N))
def bt(bar, step=0): return bar * BAR + step * STEP
def place(name, sig, t, g=1.0, pan=0.0, rev=0.0, dl=0.0):
    i = int(round(t * SR))
    if i >= N: return
    if i < 0: sig = sig[..., -i:]; i = 0
    j = min(N, i + sig.shape[-1]); s = sig[..., :j - i]
    if s.ndim == 1: s = np.vstack([s * (1 - max(0, pan)), s * (1 + min(0, pan))])
    bus[name][:, i:j] += s * g
    if rev: send[:, i:j] += s * g * rev
    if dl: eco[:, i:j] += s * g * dl

# instrumentos anos 80, harmonia e bateria do trailer de cinema (bumbo80, caixa80, baixo_pulso, arp, lead80, pad80...)
csrc = open(os.path.join(TRD, 'cinema', 'som.py'), encoding='utf8').read()
kicks = []
exec(csrc[csrc.index('# ---------------- instrumentos novos (anos 80)'):csrc.index('# ---------------- arranjo (compassos)')])
exec(csrc[csrc.index('def ambiente('):csrc.index('ambiente(0, bt(5.3), 1.0)')])
MEL = {'Em': [(0, 71, 3), (3, 74, 3), (6, 76, 4), (10, 74, 2), (12, 71, 4)], 'C': [(0, 72, 6), (6, 71, 2), (8, 67, 4), (12, 64, 4)],
       'G': [(0, 67, 3), (3, 71, 3), (6, 74, 4), (10, 79, 6)], 'D': [(0, 78, 8), (8, 76, 4), (12, 74, 4)]}
def melodia(b0, b1, g=1.0, fim=False):
    for b in range(b0, b1):
        notas = MEL[acorde(b)] if not (fim and b == b1 - 1) else [(0, 78, 4), (4, 79, 4), (8, 81, 8)]
        for s, m, d in notas: place('lead', lead80(midi(m), d * STEP), bt(b, s), g, pan=0.1, rev=0.25, dl=0.3)

def cena(nome): return next(c for c in info['cenas'] if c['nome'] == nome)
def tq(nome, f): return (cena(nome)['f0'] + f) / 60  # quadro de uma cena -> segundos do trailer

# ---------------- arranjo (compassos) ----------------
# 0-8: a chegada, sem música (só a noite); um fiapo de pad no fim
place('pad', pad80(PAD['Em'], BAR * 1.6, 500, ataque=1.4), bt(6.4), 0.42, rev=0.6)
place('fx', swell(BAR * 1.1), bt(8) - BAR * 1.1, 0.8)
# 8-12: a música entra com o título (pancada, pad, arpejo abrindo, grave longo)
place('fx', impacto() * 0.6, bt(8), 1.0, rev=0.3); place('fx', prato80(), bt(8), 0.9)
tocar_pad(8, 12, 1300, 0.9); tocar_arp(8, 12, 700, 2600, 0.9)
for b in range(8, 12): place('baixo', bass808(midi(RAIZ[acorde(b)]), BAR * 0.95) * 0.6, bt(b), 0.6)
for b in (10, 11):
    for s in (0, 8): place('bateria', lp(bumbo80(), 400), bt(b, s), 0.5); kicks.append(bt(b, s))
place('fx', riser(BAR), bt(11), 0.7); virada(11, 12)
# 12-20: primeira corrida (bateria, baixo pulsando); corta na batida e volta depois da bronca
for b in range(12, 20): bateria(b, 'verso')
tocar_pad(12, 20, 1500, 0.55); tocar_arp(12, 20, 2600, 3400, 0.75); tocar_baixo(12, 20, 0.85)
place('fx', prato80(), bt(12), 1.0); place('fx', prato80(), bt(16), 0.7)
virada(19, 8)
# 20-30: entrega do gás (refrão com a melodia, tudo correndo)
for b in range(20, 30): bateria(b, 'refrao')
melodia(20, 30)
tocar_pad(20, 30, 2400, 0.6); tocar_arp(20, 30, 3400, 4200, 0.6); tocar_baixo(20, 30, 0.9, oitava=True)
place('fx', impacto() * 0.7, bt(20), 1.0)
for b in (20, 24, 28): place('fx', prato80(), bt(b), 1.0)
virada(29, 8)
# 30-35: madrugada, áudio do Seu Biu (só pad, arpejo fechado e grave longo)
place('fx', prato80(), bt(30), 0.8)
tocar_pad(30, 35, 900, 0.55); tocar_arp(30, 35, 900, 1500, 0.35)
for b in range(30, 35): place('baixo', bass808(midi(RAIZ[acorde(b)]), BAR) * 0.6, bt(b), 0.5)
for i, s in enumerate([8, 10, 12, 13, 14, 14.5, 15, 15.5]): place('bateria', caixa80(0.35 + 0.08 * i), bt(34, s), 0.75)
place('fx', riser(BAR * 0.9), bt(34) + BAR * 0.1, 0.9)
# 35-38,5: a banana (bateria de volta, até o rodopio); 38,5-42: corte seco, carro parado e o novato tonto
for b in range(35, 39): bateria(b, 'verso')
tocar_pad(35, 39, 1800, 0.55); tocar_arp(35, 39, 2600, 3800, 0.7); tocar_baixo(35, 39, 0.9)
place('fx', prato80(), bt(35), 1.0)
for b in range(38, 42): place('pad', pad80(PAD[('Em', 'C', 'Em', 'D')[b - 38]], BAR, 650, ataque=0.6), bt(b), 0.45, rev=0.6)
# 42-50: chuva (meio tempo, notas longas)
for b in range(42, 50): bateria(b, 'meio')
tocar_pad(42, 50, 1500, 0.6); tocar_arp(42, 50, 1500, 2400, 0.55)
for b in range(42, 50): place('baixo', bass808(midi(RAIZ[acorde(b)]), BAR * 0.9) * 0.6, bt(b), 0.6)
place('fx', impacto() * 0.5, bt(42), 1.0); place('fx', prato80(), bt(42), 0.8); place('fx', prato80(), bt(46), 0.6)
# 50-54: amanhece (pad aberto, arpejo devagar, sem bateria)
tocar_pad(50, 54, 2000, 0.6); tocar_arp(50, 54, 1600, 2600, 0.4)
place('fx', swell(BAR), bt(53), 0.8); place('fx', riser(BAR), bt(53), 0.7)
# 54-60,5: um mês depois + o DJ encerrando (refrão final com a melodia)
for b in range(54, 60): bateria(b, 'refrao')
melodia(54, 60, 1.05, fim=True)
tocar_pad(54, 60, 2600, 0.6); tocar_arp(54, 60, 3400, 4400, 0.6); tocar_baixo(54, 60, 0.9, oitava=True)
place('fx', impacto(), bt(54), 1.0)
for b in (54, 56, 58): place('fx', prato80(), bt(b), 1.0)
# 60,5-63: o cartaz (pancada, acorde grande, arpejo sumindo)
FIM = 60.5
place('fx', impacto() * 1.1, bt(FIM), 1.0); place('fx', prato80(), bt(FIM), 1.2)
place('pad', pad80((82.41, 164.81, 246.94, 329.63, 369.99, 493.88), BAR * 2.5, 2600, ataque=0.03), bt(FIM), 1.0, rev=0.7)
place('baixo', bass808(41.2, BAR * 2.4) * 0.8, bt(FIM), 0.75)
place('bateria', caixa80(1.3), bt(FIM), 1.0, rev=0.3)
for k, s in enumerate(range(0, 40)):
    b = FIM + s / 16; place('arp', arp(midi(ARP['Em'][ORDEM[s % 16]]) * 2, 4000 - 70 * k), bt(b), 0.5 * (1 - k / 44), pan=0.25 if s % 2 else -0.25, dl=0.5)

# o pad e o baixo "respiram" com o bumbo
duck = np.ones(N)
for tk in kicks:
    i = int(tk * SR); j = min(N, i + int(0.28 * SR)); tl = np.arange(j - i) / SR; duck[i:j] = np.minimum(duck[i:j], 1 - 0.4 * np.exp(-tl * 12))
bus['pad'] *= duck; bus['baixo'] *= 0.7 + 0.3 * duck

# ---------------- piadas: disco arranhando e a música some ----------------
def corta(t0, t1, fica=0.0):
    a, b = int(t0 * SR), int(t1 * SR)
    for k in ('bateria', 'baixo', 'arp', 'lead', 'pad'):
        g = fica if k == 'pad' else 0.0
        bus[k][:, a:b] *= g
    eco[:, a:b] *= 0; send[:, a:b] *= 0.2
BATIDA = tq('06-batida', 53)
place('sfx', scratch(), BATIDA - 0.05, 1.0)
corta(BATIDA + 0.25, bt(17.95), 0.25)
PAROU = bt(38.5)
place('sfx', scratch(), PAROU - 0.1, 0.9)
corta(PAROU + 0.2, bt(42) - 0.02, 1.0)
# fim: sem virada antes do cartaz (corte seco no 60,5 para a pancada)
bus['bateria'][:, int(bt(60.4) * SR):int(bt(FIM) * SR)] *= 0

# ---------------- ambiente da noite (abertura) ----------------
ambiente(0, bt(8.3), 1.0)

# ---------------- efeitos de comédia e da gravação ----------------
GAGS = ('carimbo', 'boing', 'trombone', 'calota', 'lombada', 'whoosh', 'impacto', 'pneu', 'scratch')
for c in info['cenas']:
    fp = os.path.join(EV, c['nome'] + '.json')
    if not os.path.exists(fp): continue
    ev = json.load(open(fp)); t_c = c['f0'] / 60
    for f, nome, args in ev.get('sons', []):
        fn = EFEITO.get(nome)
        if fn and nome in GAGS: place('sfx', fn(), f / 60, 0.9 if nome != 'trombone' else 0.8, rev=0.12)
    for e in ev.get('sfx', []):
        fn = EFEITO.get(e['s'])
        if fn: place('fx' if e['s'] == 'impacto' else 'sfx', fn(), t_c + e['t'], 1.0, rev=0.2)
    # whoosh nos cortes das partes com bateria cheia
    if (20 < c['bar0'] < 30) or (54 < c['bar0'] < 60.5): place('sfx', whoosh(0.4), t_c - 0.26, 0.4)
# rodopio na banana: pneu cantando por cima do som do jogo
place('sfx', pneu(), tq('13-banana', 196), 0.8, rev=0.15)

# ---------------- eco (arpejo e lead) e reverb ----------------
D = int(STEP * 3 * SR); out = np.zeros_like(eco); em = lp(eco.mean(axis=0), 3500)
for k in range(1, 6):
    g = 0.42 ** k; sh = D * k
    if sh >= N: break
    out[k % 2, sh:] += em[:N - sh] * g
ir_t = tt(2.4); ir = np.vstack([noise(len(ir_t)), noise(len(ir_t))]) * np.exp(-ir_t * 2.3); ir[:, :480] *= np.linspace(0, 1, 480)
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
rev = np.vstack([fftconvolve(send[c] + out[c] * 0.3, ir[c])[:N] for c in range(2)]) * 0.5

musica = bus['bateria'] * 0.5 + bus['baixo'] * 0.9 + bus['pad'] * 2.0 + bus['arp'] * 2.6 + bus['lead'] * 2.2 + out * 2.4 + rev * 0.8
efeitos = bus['fx'] * 0.9 + bus['sfx'] * 1.0 + bus['amb'] * 1.0

# ---------------- som original do jogo ----------------
jogo = np.zeros((2, N))
jw = os.path.join(AQUI, 'saida', 'jogo.wav')
if os.path.exists(jw):
    sr_j, x = wavfile.read(jw); x = x.astype(float).T / 32768.0
    if x.ndim == 1: x = np.vstack([x, x])
    n = min(N, x.shape[1]); jogo[:, :n] = x[:, :n]
    jogo /= max(1e-9, np.sqrt(np.mean(jogo ** 2))) / 0.085  # nível parecido com o da música
else: print('AVISO: sem saida/jogo.wav (rode o som_jogo.js)')

# ---------------- falas ----------------
voz = np.zeros((2, N)); fala = np.zeros(N)
for v in info.get('falas', []):
    arq = os.path.join(AQUI, 'voz', v['id'] + '.mp3')
    if not os.path.exists(arq): print('falta a fala', v['id']); continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', arq, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(float); x = hp(x, 90); x /= max(1e-9, np.abs(x).max())
    fl = v.get('filtro')
    if fl == 'radio': x = bp(x, 260, 4200, 3); x = np.tanh(x * 3.0) / np.tanh(3.0) * 0.9
    elif fl == 'tel': x = bp(x, 380, 3300, 3); x = np.tanh(x * 3.4) / np.tanh(3.4) * 0.9
    else: x = np.tanh(x * 2.2) / np.tanh(2.2)  # compressão leve: a fala fica cheia e na frente
    x /= max(1e-9, np.abs(x).max())
    i = int(v['t'] * SR); j = min(N, i + len(x)); x = x[:j - i]
    voz[:, i:j] += x * (0.58 if fl else 0.62)
    fala[i:j] = np.maximum(fala[i:j], 1)
blk = 64; nb = N // blk; env = np.zeros(nb); e = 0
fb = fala[:nb * blk].reshape(nb, blk).max(axis=1)
for k in range(nb):
    alvo = fb[k]; c = 1 - np.exp(-blk / SR / (0.06 if alvo > e else 0.4)); e += (alvo - e) * c; env[k] = e
env = np.repeat(env, blk); env = np.pad(env, (0, N - len(env)), 'edge')
vrev = np.vstack([fftconvolve(voz[c], ir[c])[:N] for c in range(2)]) * 0.05

mix = musica * 0.78 * (1 - 0.7 * env) + efeitos * (1 - 0.45 * env) + jogo * (1 - 0.55 * env) + voz * 1.0 + vrev
mix = hp(mix, 25)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fim = int((DUR - 0.5) * SR); mix[:, fim:] *= np.linspace(1, 0, N - fim) ** 2
mix /= max(1e-9, np.abs(mix).max()) / 0.92
os.makedirs(os.path.join(AQUI, 'saida'), exist_ok=True)
wavfile.write(os.path.join(AQUI, 'saida', 'trilha.wav'), SR, (mix.T * 32767).astype(np.int16))
print('trilha: %.2f s (%d compassos), %d bumbos, %d falas' % (DUR, NBARS, len(kicks), len(info.get('falas', []))))
if os.environ.get('DEBUG'):
    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    on = env > 0.5
    for nome, x in (('musica', musica * 0.78 * (1 - 0.7 * env)), ('efeitos', efeitos * (1 - 0.45 * env)), ('jogo', jogo * (1 - 0.55 * env)), ('voz', voz)):
        print('%-8s com fala %6.1f dB | sem fala %6.1f dB' % (nome, rms(x[:, on]), rms(x[:, ~on])))
