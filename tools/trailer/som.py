#!/usr/bin/env python3
# Trilha do trailer: funk de baile original a 130 BPM (o mesmo groove do paredão do jogo),
# com virada, drops, pausa e final, mais os efeitos sonoros no quadro exato em que aconteceram na gravação.
# uso: python3 som.py   -> saida/trilha_gta.wav   (lê eventos/_trailer.json e eventos/<cena>.json)
import json, glob, os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
BASE = os.path.dirname(os.path.abspath(__file__))
info = json.load(open(os.path.join(BASE, 'eventos', '_trailer.json')))
BPM = info['bpm']; BEAT = 60 / BPM; BAR = 4 * BEAT; STEP = BEAT / 4
NBARS = sum(c['bars'] for c in info['cenas'])
DUR = NBARS * BAR + 2.0
N = int(DUR * SR)
rng = np.random.default_rng(7)

bus = {k: np.zeros((2, N)) for k in ('bateria', 'baixo', 'pad', 'stab', 'lead', 'fx', 'sfx', 'motor', 'chuva')}
send = np.zeros((2, N))  # vai pro reverb

def bt(bar, step=0): return bar * BAR + step * STEP
def place(name, sig, t, g=1.0, pan=0.0, rev=0.0):
    i = int(round(t * SR))
    if i >= N: return
    if i < 0: sig = sig[..., -i:]; i = 0
    j = min(N, i + sig.shape[-1]); s = sig[..., :j - i]
    if s.ndim == 1: s = np.vstack([s * (1 - max(0, pan)), s * (1 + min(0, pan))])
    bus[name][:, i:j] += s * g
    if rev: send[:, i:j] += s * g * rev
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

# ---------------- instrumentos ----------------
def kick():
    t = tt(0.42); f = 46 + 110 * np.exp(-t * 30); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.8 * (np.sin(ph) * np.exp(-t * 6.5) + noise(len(t)) * np.exp(-t * 400) * 0.25)) * 0.95
def clap():
    t = tt(0.35); n = len(t); nz = noise(n); x = np.zeros(n)
    for k, o in enumerate([0, 0.009, 0.018, 0.027]):
        i = int(o * SR); e = np.zeros(n); e[i:] = np.exp(-(t[i:] - o) * (140 if k < 3 else 16)); x += nz * e
    return bp(x, 900, 3200) * 0.9 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.3
def hat(aberto=False):
    t = tt(0.32 if aberto else 0.06)
    return hp(noise(len(t)), 7000) * np.exp(-t * (9 if aberto else 70)) * 0.3
def tom(f):
    t = tt(0.18); ph = 2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t * 40))) / SR
    return np.sin(ph) * np.exp(-t * 22) * 0.5 + bp(noise(len(t)), 2000, 6000) * np.exp(-t * 90) * 0.12
def bass808(f, dur):
    t = tt(dur + 0.08); ph = 2 * np.pi * np.cumsum(f * (1 + 0.12 * np.exp(-t * 25))) / SR
    a = np.minimum(1, t / 0.005) * np.exp(-t * (1.3 / dur)) * np.clip((dur + 0.08 - t) / 0.06, 0, 1)
    return np.tanh(2.2 * (np.sin(ph) + 0.25 * np.sin(2 * ph)) * a) * 0.55
def saw(f, n, cents=0):
    t = np.arange(n) / SR; return 2 * ((t * f * 2 ** (cents / 1200) + rng.random()) % 1) - 1
def pad(freqs, dur, corte=1400):
    n = int((dur + 0.7) * SR); t = np.arange(n) / SR; L = np.zeros(n); R = np.zeros(n)
    for f in freqs:
        for c, pan in ((-9, -0.7), (0, 0), (9, 0.7)):
            s = saw(f, n, c); L += s * (1 - max(0, pan)); R += s * (1 + min(0, pan))
    a = np.minimum(1, t / 0.4) * np.clip((dur + 0.7 - t) / 0.7, 0, 1)
    return np.vstack([lp(L, corte), lp(R, corte)]) * a * 0.045
def stab(f):
    t = tt(0.22); tri = lambda ff: 2 * np.abs(2 * ((t * ff) % 1) - 1) - 1
    return (tri(f) + 0.5 * tri(f * 2) + 0.3 * tri(f * 1.5)) * np.exp(-t * 14) * 0.2
def lead(f, dur):
    t = tt(dur + 0.1); vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.15)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; x = lp(np.sign(np.sin(ph)) * 0.5 + np.sin(ph) * 0.5, 2600)
    return x * np.minimum(1, t / 0.01) * np.exp(-t * 1.1) * np.clip((dur + 0.1 - t) / 0.1, 0, 1) * 0.14
def riser(dur):
    t = tt(dur); k = t / dur; nz = noise(len(t)); x = np.zeros(len(t))
    bands = [(200, 500), (400, 1000), (800, 2000), (1600, 4000), (3200, 8000), (6000, 14000)]
    for i, (lo, hi) in enumerate(bands): x += bp(nz, lo, hi) * np.exp(-((k - i / (len(bands) - 1)) ** 2) / 0.04)
    ph = 2 * np.pi * np.cumsum(150 + 1400 * k ** 2) / SR
    return (x * 0.5 + np.sin(ph) * 0.22 * k) * k ** 1.6 * 0.5
def impacto():
    t = tt(2.6); ph = 2 * np.pi * np.cumsum(60 * np.exp(-t * 1.2) + 28) / SR
    x = np.sin(ph) * np.exp(-t * 1.6) + lp(noise(len(t)), 900) * np.exp(-t * 5) * 0.6 + hp(noise(len(t)), 3000) * np.exp(-t * 25) * 0.3
    return np.tanh(1.5 * x) * 0.85
def prato():
    t = tt(2.4); return hp(noise(len(t)), 4500) * np.exp(-t * 1.8) * 0.2
def whoosh(dur=0.5):
    t = tt(dur); k = t / dur; nz = noise(len(t)); x = np.zeros(len(t))
    for i, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500), (3500, 9000)]): x += bp(nz, lo, hi) * np.exp(-((k - i / 3) ** 2) / 0.05)
    return x * np.sin(np.pi * k) ** 1.5 * 0.45

# ---------------- efeitos ----------------
def bipe(final=False):
    t = tt(0.55 if final else 0.16); f = 1320 if final else 880
    return lp(np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t) * 0.6, 5000) * np.exp(-t * (3 if final else 18)) * 0.3
def grana():
    t = tt(0.6); n = len(t); x = np.zeros(n)
    for f, a, d in ((2093, 1, 8), (2637, 0.7, 9), (3136, 0.5, 10), (4186, 0.3, 14)): x += np.sin(2 * np.pi * f * t) * a * np.exp(-t * d)
    i = int(0.07 * SR); x[i:] += np.sin(2 * np.pi * 2794 * t[:n - i]) * 0.6 * np.exp(-t[:n - i] * 9)
    return (x + hp(noise(n), 5000) * np.exp(-t * 40) * 0.3) * 0.16
def porta():
    t = tt(0.35); return (np.sin(2 * np.pi * (70 + 50 * np.exp(-t * 30)) * t) * np.exp(-t * 14) + lp(noise(len(t)), 600) * np.exp(-t * 30) * 0.6) * 0.5
def chave():
    t = tt(0.5); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in ((523, 9, 0.5), (1213, 12, 0.4), (2310, 16, 0.3), (3870, 22, 0.2)))
    return (x + hp(noise(len(t)), 4000) * np.exp(-t * 30) * 0.5) * 0.28
def poca():
    t = tt(0.6); n = len(t)
    return (bp(noise(n), 600, 3500) * np.minimum(1, t / 0.01) * np.exp(-t * 6) + bp(noise(n), 3000, 8000) * np.exp(-t * 12) * 0.4) * 0.5
def ping():
    t = tt(0.45); n = len(t); x = np.zeros(n)
    for o, f in ((0, 1568), (0.11, 2093)): i = int(o * SR); x[i:] += np.sin(2 * np.pi * f * t[:n - i]) * np.exp(-t[:n - i] * 10)
    return x * 0.22
def congela():
    t = tt(1.2); n = len(t); boom = np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 3)
    clk = hp(noise(n), 2500) * np.exp(-t * 120) * 0.6; i = int(0.045 * SR); clk[i:] += hp(noise(n - i), 3000) * np.exp(-t[:n - i] * 150) * 0.4
    return (boom * 0.8 + clk) * 0.6
def pneu():
    t = tt(1.1); return bp(noise(len(t)), 1800, 3400) * (1 + 0.5 * np.sin(2 * np.pi * 31 * t)) * np.minimum(1, t / 0.03) * np.exp(-t * 2.2) * 0.3
def sino():
    t = tt(0.8); n = len(t); x = np.zeros(n)
    for o, f in ((0, 1047), (0.08, 1319), (0.16, 1568)): i = int(o * SR); x[i:] += np.sin(2 * np.pi * f * t[:n - i]) * np.exp(-t[:n - i] * 5)
    return x * 0.12
EFEITO = {'beep': None, 'grana': grana, 'chime': sino, 'thud': porta, 'wrench': chave, 'poca': poca, 'checkpoint': lambda: bipe() * 0.6,
          'ping': ping, 'congela': congela, 'impacto': impacto, 'pneu': pneu, 'whoosh': lambda: whoosh(0.8)}

# ---------------- música ----------------
ACORDES = [((220, 261.63, 329.63), 55.0), ((174.61, 220, 261.63), 43.65), ((261.63, 329.63, 392.0), 65.41), ((196.0, 246.94, 293.66), 49.0)]  # Lám Fá Dó Sol
def acorde(bar, por=1): return ACORDES[int(bar // por) % 4]
KICK = (0, 3, 7, 10)  # o mesmo bumbo do paredão do jogo
BAIXO = {0: 1, 6: 1.1892, 8: 0.8909, 14: 1.0595}  # notas do baixo (relativas à tônica do acorde), como no paredão
kicks = []
def batida(bar, cheio=True, aberto=False, perc=True, so_bumbo=False):
    for s in range(16):
        t = bt(bar, s)
        if s in KICK: place('bateria', kick(), t, 0.9); kicks.append(t)
        if so_bumbo: continue
        if s in (4, 12): place('bateria', clap(), t, 0.75, rev=0.25)
        if s % 2 == 0: place('bateria', hat(), t, 0.5 if s % 4 else 0.35, pan=0.25)
        if aberto and s == 14: place('bateria', hat(True), t, 0.45, pan=-0.2)
        if perc and s in (2, 6, 9, 13, 15): place('bateria', tom(300 if s in (2, 9) else 240), t, 0.35, pan=-0.35 if s % 2 else 0.35)
    if cheio:
        _, raiz = acorde(bar)
        for s, k in BAIXO.items(): place('baixo', bass808(raiz * k, STEP * (6 if s == 0 else 2) * 0.95), bt(bar, s), 0.85)
        ch, _ = acorde(bar)
        for s in (2, 10): place('stab', stab(ch[2] * 2 if s == 2 else ch[1] * 2), bt(bar, s), 0.8, pan=0.3 if s == 2 else -0.3, rev=0.35)

# ABERTURA (0-8): pad lento, chimbal suave na segunda metade, riser no compasso 7
for b in range(0, 8, 2):
    ch, raiz = acorde(b, 2)
    place('pad', pad(ch, 2 * BAR, 700 + 120 * b), bt(b), 1.0, rev=0.5)
    place('baixo', bass808(raiz, 2 * BAR) * 0.5, bt(b), 0.5)
for b in range(4, 8):
    for s in range(0, 16, 2): place('bateria', hat(), bt(b, s), 0.22 + 0.04 * (b - 4), pan=0.3)
place('fx', riser(BAR), bt(7), 0.8)
# VIRADA (8-12): a batida entra sem baixo; meio compasso de silêncio na contagem do racha
for b in range(8, 12):
    ch, _ = acorde(b); place('pad', pad(ch, BAR, 1600), bt(b), 0.7, rev=0.4)
    if b < 11: batida(b, cheio=False)
    else:
        for s in range(8):
            if s in KICK: place('bateria', kick(), bt(b, s), 0.9); kicks.append(bt(b, s))
            if s == 4: place('bateria', clap(), bt(b, s), 0.75)
place('fx', riser(BAR * 1.0), bt(11), 1.0)
# DROP 1 (12-20)
for b in range(12, 20):
    ch, _ = acorde(b); place('pad', pad(ch, BAR, 2200), bt(b), 0.55, rev=0.3); batida(b)
for b in (12, 16): place('fx', prato(), bt(b), 1.0)
place('fx', impacto(), bt(12), 1.0)
# PAUSA (20-26): só pad, bumbo no 1 e baixo longo; riser e caixa acelerando no fim
for b in range(20, 26, 2):
    ch, raiz = acorde(b - 20, 2); place('pad', pad(ch, 2 * BAR, 900), bt(b), 0.8, rev=0.6)
    place('baixo', bass808(raiz, 2 * BAR) * 0.6, bt(b), 0.55)
for b in range(20, 25): place('bateria', lp(kick(), 300), bt(b), 0.6); kicks.append(bt(b))
for i, s in enumerate(list(range(0, 8, 2)) + list(range(8, 12)) + [12, 12.5, 13, 13.5, 14, 14.5]): place('bateria', clap(), bt(25, s), 0.25 + 0.04 * i)
place('fx', riser(BAR * 0.92), bt(25), 1.1)
# DROP 2 (26-34): tudo, chimbal aberto e a melodia
MELODIA = [[(0, 69, 3), (3, 72, 3), (6, 76, 2), (8, 74, 4), (12, 72, 2), (14, 69, 2)], [(0, 67, 3), (3, 69, 3), (6, 72, 2), (8, 76, 6), (14, 74, 2)]]
for b in range(26, 34):
    ch, _ = acorde(b); place('pad', pad(ch, BAR, 2600), bt(b), 0.5, rev=0.3); batida(b, aberto=True)
    for s, m, d in MELODIA[(b - 26) % 2]: place('lead', lead(midi(m), d * STEP), bt(b, s), 0.9, pan=0.15, rev=0.3)
for b in (26, 30): place('fx', prato(), bt(b), 1.0)
place('fx', impacto(), bt(26), 1.0)
# FINAL (34-38): impacto, acorde longo e um último "stab" no fim
place('fx', impacto(), bt(34), 1.1); place('fx', prato(), bt(34), 1.0)
place('pad', pad(ACORDES[0][0], 3.6 * BAR, 1300), bt(34), 1.0, rev=0.7)
place('baixo', bass808(55, 2.5 * BAR) * 0.7, bt(34), 0.7)
place('stab', stab(880) + stab(659.25), bt(36), 1.0, rev=0.6)

# bombeia o pad e o baixo com o bumbo (balanço de funk)
duck = np.ones(N)
for tk in kicks:
    i = int(tk * SR); j = min(N, i + int(0.3 * SR)); tt_ = np.arange(j - i) / SR; duck[i:j] = np.minimum(duck[i:j], 1 - 0.55 * np.exp(-tt_ * 14))
bus['pad'] *= duck; bus['baixo'] *= 0.6 + 0.4 * duck

# "fita parando" no fim do drop 1 (últimos 2 tempos do compasso 19)
t0, t1 = bt(19, 8), bt(20)
mus_bus = ('bateria', 'baixo', 'pad', 'stab', 'lead')
i0, i1 = int(t0 * SR), int(t1 * SR); tl = np.arange(i1 - i0) / SR; T_ = t1 - t0
pos = (t0 + tl - tl ** 2 / (2 * T_)) * SR
for k in mus_bus:
    for c in range(2): bus[k][c, i0:i1] = np.interp(pos, np.arange(N), bus[k][c]) * (1 - tl / T_) ** 0.5
# meio compasso de silêncio antes do drop 2 (só o riser respira)
g0, g1 = int(bt(25, 12) * SR), int(bt(26) * SR)
for k in mus_bus: bus[k][:, g0:g1] *= np.linspace(1, 0, g1 - g0) ** 3

# ---------------- efeitos sincronizados com a gravação ----------------
cenas = info['cenas']; DROPS = [(12, 20), (26, 34)]
for c in cenas:
    fp = os.path.join(BASE, 'eventos', c['nome'] + '.json')
    if not os.path.exists(fp): continue
    ev = json.load(open(fp)); t_c = c['f0'] / 60
    # sons que o jogo tocou durante a gravação
    vistos = set()
    for f, nome, args in ev['sons']:
        t = f / 60
        if nome == 'beep': place('sfx', bipe(bool(args and args[0])), t, 1.0); continue
        if nome == 'chime' and (round(t, 2), 'grana') in vistos: continue
        fn = EFEITO.get(nome)
        if fn: place('sfx', fn(), t, 1.0, rev=0.15); vistos.add((round(t, 2), nome))
    # efeitos extras do roteiro
    for e in ev.get('sfx', []):
        fn = EFEITO.get(e['s'])
        if fn: place('sfx' if e['s'] != 'impacto' else 'fx', fn(), t_c + e['t'], 1.0, rev=0.2)
    # whoosh nos cortes dos drops
    if any(a <= c['bar0'] < b for a, b in DROPS) and c['bar0'] not in (12, 26):
        place('sfx', whoosh(0.45), t_c - 0.3, 0.55)
    # motor do Opalha (mais grave em câmera lenta)
    if ev.get('motor') and ev.get('vel'):
        fr = np.array([v[0] for v in ev['vel']]) / 60; vel = np.array([v[1] for v in ev['vel']], float); sl = np.array([v[2] for v in ev['vel']], float)
        a, b = int(fr[0] * SR), min(N, int((fr[-1] + 1 / 60) * SR)); ts = np.arange(a, b) / SR
        v = np.interp(ts, fr, vel); s = np.interp(ts, fr, sl)
        f0 = (26 + v * 0.075) * (0.5 + 0.5 * s); ph = 2 * np.pi * np.cumsum(f0) / SR
        x = sum(np.sin(ph * h) / h ** 0.9 for h in range(1, 8)) + noise(len(ts)) * 0.15
        x = lp(x, 900) * (0.35 + 0.65 * np.minimum(1, v / 300))
        fade = np.minimum(1, np.minimum(np.arange(len(ts)), np.arange(len(ts))[::-1]) / (0.03 * SR))
        place('motor', x * fade * 0.16, ts[0], 1.0)
    # chuva
    if ev.get('chuva'):
        dur = c['n'] / 60; t = tt(dur); x = bp(noise(len(t)), 900, 7000) * 0.08
        for _ in range(int(dur * 25)): i = rng.integers(0, len(t) - 2000); x[i:i + 2000] += hp(noise(2000), 3000) * np.exp(-np.arange(2000) / 200) * 0.15
        place('chuva', x * np.minimum(1, np.minimum(t, dur - t) / 0.08), t_c, 1.0, pan=0.1)

# ---------------- mixagem ----------------
ir_t = tt(2.2); ir = np.vstack([noise(len(ir_t)), noise(len(ir_t))]) * np.exp(-ir_t * 2.6); ir[:, :480] *= np.linspace(0, 1, 480)
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
rev = np.vstack([fftconvolve(send[c], ir[c])[:N] for c in range(2)]) * 0.5
mix = (bus['bateria'] * 1.0 + bus['baixo'] * 0.95 + bus['pad'] * 1.0 + bus['stab'] * 0.9 + bus['lead'] * 0.85 + bus['fx'] * 0.9
       + bus['sfx'] * 1.0 + bus['motor'] * 0.9 + bus['chuva'] * 0.5 + rev * 0.6)
mix = hp(mix, 25)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fim = int((NBARS * BAR - 0.4) * SR); mix[:, fim:] *= np.linspace(1, 0, N - fim)
mix /= max(1e-9, np.abs(mix).max()) / 0.92
os.makedirs(os.path.join(BASE, 'saida'), exist_ok=True)
wavfile.write(os.path.join(BASE, 'saida', 'trilha_gta.wav'), SR, (mix.T * 32767).astype(np.int16))
print('trilha: %.1f s, %d bumbos, cenas com efeitos: %d' % (DUR, len(kicks), sum(1 for c in cenas if os.path.exists(os.path.join(BASE, 'eventos', c['nome'] + '.json')))))
