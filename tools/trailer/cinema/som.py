#!/usr/bin/env python3
# Trilha do trailer curto de cinema: música original anos 80 a 110 BPM (Mi menor: Mim Dó Sol Ré),
# sintetizador em arpejo, baixo pulsando, caixa com eco "cortado", e o som da gravação (motor, chuva, bipes)
# no quadro exato. As falas entram por cima e a música abaixa quando alguém fala.
# uso (de dentro de tools/trailer):  python3 cinema/som.py  -> cinema/saida/trilha.wav
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
AQUI = os.path.dirname(os.path.abspath(__file__))
EV = os.environ.get('EVENTOS', os.path.join(AQUI, 'eventos'))
info = json.load(open(os.path.join(EV, '_trailer.json')))
BPM = info['bpm']; BEAT = 60 / BPM; BAR = 4 * BEAT; STEP = BEAT / 4
NBARS = sum(c['bars'] for c in info['cenas'])
DUR = NBARS * BAR
N = int((DUR + 0.5) * SR)
rng = np.random.default_rng(11)

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

# instrumentos e efeitos do trailer anterior (bumbo, chimbal, tons, pad, lead, riser, impacto, prato, whoosh, bipes, poça...)
src = open(os.path.join(AQUI, '..', 'som.py'), encoding='utf8').read()
exec(src[src.index('# ---------------- instrumentos'):src.index('# ---------------- música')])

BUS = ('bateria', 'baixo', 'pad', 'arp', 'lead', 'fx', 'sfx', 'motor', 'chuva', 'amb')
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

# ---------------- instrumentos novos (anos 80) ----------------
def bumbo80():
    t = tt(0.45); f = 48 + 125 * np.exp(-t * 34); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.0 * (np.sin(ph) * np.exp(-t * 7) + hp(noise(len(t)), 2000) * np.exp(-t * 300) * 0.35)) * 0.9
# caixa com eco "cortado" (gated reverb): corpo + chiado, e uma sala densa que para de repente
_ir = tt(0.26); _ir = np.vstack([noise(len(_ir)), noise(len(_ir))]) * np.clip((0.26 - _ir) / 0.03, 0, 1) * (0.6 + 0.4 * np.exp(-_ir * 6))
_ir = lp(_ir, 7000) / np.sqrt(len(_ir[0])) * 6
def caixa80(v=1.0):
    t = tt(0.32); n = len(t)
    corpo = (np.sin(2 * np.pi * 185 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t * 26)
    chiado = bp(noise(n), 1500, 9000) * np.exp(-t * 18)
    seco = corpo * 0.55 + chiado * 0.7
    sala = np.vstack([fftconvolve(seco, _ir[c])[:n + len(_ir[0])] for c in range(2)])
    out = np.zeros((2, sala.shape[1])); out[:, :n] += seco
    return (out + sala * 0.5) * 0.55 * v
def chimbal(aberto=False): return hat(aberto) * (1.25 if aberto else 1.0)
def tom80(f): t = tt(0.4); ph = 2 * np.pi * np.cumsum(f * (1 + 0.5 * np.exp(-t * 18))) / SR; return np.sin(ph) * np.exp(-t * 7) * 0.55 + bp(noise(len(t)), 1500, 5000) * np.exp(-t * 60) * 0.1
def prato80(): t = tt(3.2); return (hp(noise(len(t)), 5000) * np.exp(-t * 1.3) * 0.22 + bp(noise(len(t)), 3000, 7000) * np.exp(-t * 3) * 0.08)
def baixo_pulso(f, dur):
    # baixo de sintetizador em colcheias: serra com o filtro abrindo no ataque + um grave limpo embaixo
    t = tt(dur); s = 2 * ((t * f + 0.25) % 1) - 1; s2 = 2 * ((t * f * 1.004) % 1) - 1
    a = np.minimum(1, t / 0.004) * np.clip((dur - t) / 0.02, 0, 1)
    brilho = lp(s + s2, 2400) * np.exp(-t * 16) * 0.5 + lp(s + s2, 520) * 0.5
    return (brilho * 0.42 + np.sin(2 * np.pi * f * t) * 0.6) * a * 0.5
def arp(f, corte):
    # nota curtinha de pulso (o "pling" do arpejo)
    t = tt(STEP * 1.7); s = np.sign(np.sin(2 * np.pi * f * t)) * 0.6 + (2 * ((t * f * 2) % 1) - 1) * 0.25
    return lp(s, corte) * np.minimum(1, t / 0.003) * np.exp(-t * 11) * 0.16
def lead80(f, dur):
    # lead de serra dupla com vibrato que chega devagar (cara de solo de sintetizador)
    t = tt(dur + 0.25); vib = 1 + 0.007 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, np.maximum(0, t - 0.15) / 0.35)
    ph = np.cumsum(f * vib) / SR; s = (2 * (ph % 1) - 1) + (2 * ((ph * 1.006) % 1) - 1) * 0.8 + np.sin(2 * np.pi * ph * 0.5) * 0.4
    a = np.minimum(1, t / 0.02) * (0.75 + 0.25 * np.exp(-t * 3)) * np.clip((dur + 0.25 - t) / 0.25, 0, 1)
    return lp(s, 3200) * a * 0.075
def pad80(freqs, dur, corte=1600, ataque=0.5):
    x = pad(freqs, dur, corte); n = x.shape[1]; t = np.arange(n) / SR
    return x * np.minimum(1, t / ataque)
def swell(dur):
    # prato ao contrário (sobe até o tempo forte)
    t = tt(dur); return hp(noise(len(t)), 3500) * (t / dur) ** 3 * 0.35

# ---------------- harmonia ----------------
# Mim, Dó, Sol, Ré (um acorde por compasso)
PAD = {'Em': (164.81, 196.0, 246.94, 329.63), 'C': (130.81, 196.0, 261.63, 329.63), 'G': (146.83, 196.0, 246.94, 293.66), 'D': (146.83, 185.0, 220.0, 293.66)}
RAIZ = {'Em': 40, 'C': 36, 'G': 43, 'D': 38}
ARP = {'Em': (64, 67, 71, 76, 79), 'C': (60, 64, 67, 72, 76), 'G': (55, 59, 62, 67, 71), 'D': (62, 66, 69, 74, 78)}
ORDEM = (0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 1, 3, 2, 4, 3, 1)
CICLO = ('Em', 'C', 'G', 'D')
def acorde(bar): return CICLO[int(bar) % 4]
kicks = []

def tocar_pad(b0, b1, corte, g, ciclo=None):
    for b in range(b0, b1):
        ac = (ciclo or CICLO)[(b - b0) % 4] if ciclo else acorde(b)
        place('pad', pad80(PAD[ac], BAR, corte), bt(b), g, rev=0.45)
def tocar_arp(b0, b1, c0, c1, g):
    for b in range(b0, b1):
        ac = acorde(b)
        for s in range(16):
            k = ((b - b0) * 16 + s) / max(1, (b1 - b0) * 16); corte = c0 * (c1 / c0) ** k
            place('arp', arp(midi(ARP[ac][ORDEM[s]]), corte), bt(b, s), g * (1.0 if s % 4 == 0 else 0.8), pan=0.25 if s % 2 else -0.25, rev=0.15, dl=0.45)
def tocar_baixo(b0, b1, g, oitava=False):
    for b in range(b0, b1):
        f = midi(RAIZ[acorde(b)])
        for s in range(0, 16, 2): place('baixo', baixo_pulso(f * (2 if oitava and s % 4 == 2 else 1), STEP * 1.85), bt(b, s), g)
def bateria(b, estilo):
    if estilo == 'verso': K, S, H, A = (0, 8, 10), (4, 12), range(0, 16, 2), ()
    elif estilo == 'refrao': K, S, H, A = (0, 4, 8, 12), (4, 12), range(0, 16, 2), (2, 6, 10, 14)
    elif estilo == 'meio': K, S, H, A = (0, 8, 11), (8,), range(0, 16, 2), (6, 14)
    else: K, S, H, A = (0, 8), (), (), ()
    for s in K: place('bateria', bumbo80(), bt(b, s), 0.95); kicks.append(bt(b, s))
    for s in S: place('bateria', caixa80(1.15 if estilo == 'meio' else 1.0), bt(b, s), 1.0, rev=0.12)
    for s in H:
        if s not in A: place('bateria', chimbal(), bt(b, s), 0.42 if s % 4 else 0.3, pan=0.3)
    for s in A: place('bateria', chimbal(True), bt(b, s), 0.4, pan=-0.25)
def virada(b, s0=8):
    for i, s in enumerate(range(s0, 16)): place('bateria', tom80([240, 240, 190, 190, 150, 150, 115, 115][i % 8]), bt(b, s), 0.8, pan=0.4 - 0.1 * i, rev=0.2)

# ---------------- arranjo (compassos) ----------------
# 0-5: abertura sem música (diálogo); prato ao contrário entrando na cidade
place('fx', swell(BAR * 1.2), bt(5) - BAR * 1.2, 0.8)
place('pad', pad80(PAD['Em'], BAR * 1.6, 500, ataque=1.4), bt(3.4), 0.5, rev=0.6)
# 5-9: a cidade (pad, arpejo abrindo, baixo longo, pancada grave no título)
place('fx', impacto() * 0.55, bt(5), 1.0, rev=0.3)
tocar_pad(5, 9, 1300, 0.9)
tocar_arp(5, 9, 700, 2600, 0.9)
for b in range(5, 9): place('baixo', bass808(midi(RAIZ[acorde(b)]), BAR * 0.95) * 0.6, bt(b), 0.6)
for b in (7, 8):
    for s in (0, 8): place('bateria', lp(bumbo80(), 400), bt(b, s), 0.5); kicks.append(bt(b, s))
place('fx', riser(BAR), bt(8), 0.7); virada(8, 12)
# 9-19: o povo filma (bateria, baixo pulsando)
for b in range(9, 19): bateria(b, 'verso')
tocar_pad(9, 19, 1500, 0.55); tocar_arp(9, 19, 2600, 3400, 0.75); tocar_baixo(9, 19, 0.85)
place('fx', prato80(), bt(9), 1.0); place('fx', prato80(), bt(13), 0.7); place('fx', prato80(), bt(17), 0.7)
virada(18, 8)
# 19-21: pausa (a frase do motorista): só pad, baixo longo e o arpejo fechado; caixa acelerando no fim
tocar_pad(19, 21, 900, 0.55)
tocar_arp(19, 21, 900, 1400, 0.3)
for b in (19, 20): place('baixo', bass808(midi(RAIZ[acorde(b)]), BAR) * 0.6, bt(b), 0.55)
for i, s in enumerate([8, 10, 12, 13, 14, 14.5, 15, 15.5]): place('bateria', caixa80(0.35 + 0.08 * i), bt(20, s), 0.75)
place('fx', riser(BAR * 0.9), bt(20) + BAR * 0.1, 0.9)
# 21-33: refrão (tudo, com a melodia)
MEL = {'Em': [(0, 71, 3), (3, 74, 3), (6, 76, 4), (10, 74, 2), (12, 71, 4)], 'C': [(0, 72, 6), (6, 71, 2), (8, 67, 4), (12, 64, 4)],
       'G': [(0, 67, 3), (3, 71, 3), (6, 74, 4), (10, 79, 6)], 'D': [(0, 78, 8), (8, 76, 4), (12, 74, 4)]}
for b in range(21, 33):
    bateria(b, 'refrao')
    ac = acorde(b); notas = MEL[ac] if not (b == 32) else [(0, 78, 4), (4, 79, 4), (8, 81, 8)]
    for s, m, d in notas: place('lead', lead80(midi(m), d * STEP), bt(b, s), 1.0, pan=0.1, rev=0.25, dl=0.3)
tocar_pad(21, 33, 2400, 0.6); tocar_arp(21, 33, 3400, 4200, 0.6); tocar_baixo(21, 33, 0.9, oitava=True)
place('fx', impacto() * 0.8, bt(21), 1.0);
for b in (21, 25, 29): place('fx', prato80(), bt(b), 1.0)
virada(32, 8)
# 33-36: clímax (meio tempo, notas longas, subindo) e corte seco no 36
CLX = ('C', 'G', 'D')
for i, b in enumerate(range(33, 36)):
    ac = CLX[i]; place('pad', pad80(PAD[ac], BAR, 3000, ataque=0.05), bt(b), 0.75, rev=0.5)
    f = midi(RAIZ[ac])
    for s in range(0, 16, 2): place('baixo', baixo_pulso(f * (2 if s % 4 == 2 else 1), STEP * 1.85), bt(b, s), 0.9)
    for s in range(16): place('arp', arp(midi(ARP[ac][ORDEM[s]]) * 2, 4500), bt(b, s), 0.45, pan=0.25 if s % 2 else -0.25, dl=0.4)
    if b < 35: bateria(b, 'meio')
for s, m, d in [(0, 76, 8), (8, 79, 8)]: place('lead', lead80(midi(m), d * STEP), bt(33, s), 1.15, rev=0.35, dl=0.3)
for s, m, d in [(0, 79, 6), (6, 78, 2), (8, 74, 8)]: place('lead', lead80(midi(m), d * STEP), bt(34, s), 1.15, rev=0.35, dl=0.3)
place('lead', lead80(midi(78), 16 * STEP), bt(35), 1.2, rev=0.4, dl=0.3)
place('fx', impacto(), bt(33), 1.0); place('fx', prato80(), bt(33), 1.1); place('fx', prato80(), bt(34), 0.8)
for s in (0, 4, 8, 12): place('bateria', bumbo80(), bt(35, s), 0.95); kicks.append(bt(35, s))
for i, s in enumerate(range(16)): place('bateria', caixa80(0.3 + 0.045 * i), bt(35, s), 0.8)
place('fx', riser(BAR), bt(35), 1.0)
# 36-38,5: silêncio (só um fiapo de pad grave e o vento) para o "Vai com Deus"
place('pad', pad80(PAD['Em'], BAR * 2.3, 420, ataque=1.0), bt(36.1), 0.32, rev=0.7)
# 38,5-41: o cartaz (pancada, acorde grande, arpejo sumindo)
FIM = 38.5
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
# corte seco no compasso 36 (só o eco do reverb sobra)
c0 = int(bt(36) * SR); c1 = int(bt(FIM) * SR)
for k in ('bateria', 'baixo', 'arp', 'lead', 'fx'): bus[k][:, c0:c1] *= 0
send[:, c0 + int(0.05 * SR):c1] *= 0; eco[:, c0:c1] *= 0
bus['pad'][:, c0:c0 + int(0.02 * SR)] *= 0

# ---------------- ambiente da noite (abertura e final): grilos, cidade ao longe, vento ----------------
def ambiente(t0, dur, g):
    t = tt(dur); n = len(t); x = np.zeros((2, n))
    cidade = lp(noise(n), 180) * 0.06 + bp(noise(n), 300, 900) * 0.012 * (1 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
    x += np.vstack([cidade, cidade[::-1]])
    for k, (taxa, f, pan) in enumerate(((0.43, 4700, -0.6), (0.57, 5200, 0.5), (0.37, 4300, 0.1))):
        c = np.zeros(n); m = int(0.016 * SR); tl = np.arange(m) / SR
        for c0_ in np.arange(0.1 + k * 0.13, dur - 0.2, taxa):
            for q in range(3):
                i = int((c0_ + q * 0.028) * SR)
                if i + m < n: c[i:i + m] += np.sin(2 * np.pi * f * tl) * np.sin(np.pi * tl / 0.016)
        x += np.vstack([c * (1 - max(0, pan)), c * (1 + min(0, pan))]) * 0.022
    fade = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.8))
    place('amb', x * fade, t0, g)
ambiente(0, bt(5.3), 1.0)
ambiente(bt(36), bt(FIM + 0.3) - bt(36), 0.8)

# ---------------- sons da gravação (bipes, poça, lombada, motor, chuva) ----------------
REFRAO = (21, 33)
for c in info['cenas']:
    fp = os.path.join(EV, c['nome'] + '.json')
    if not os.path.exists(fp): continue
    ev = json.load(open(fp)); t_c = c['f0'] / 60
    for f, nome, args in ev['sons']:
        t = f / 60
        if nome == 'beep': place('sfx', bipe(bool(args and args[0])), t, 0.9); continue
        fn = EFEITO.get(nome)
        if fn and nome not in ('carimbo', 'boing', 'trombone'): place('sfx', fn(), t, 1.0, rev=0.15)
    for e in ev.get('sfx', []):
        fn = EFEITO.get(e['s'])
        if fn: place('fx' if e['s'] == 'impacto' else 'sfx', fn(), t_c + e['t'], 1.0, rev=0.2)
    # whoosh nos cortes do refrão
    if REFRAO[0] < c['bar0'] < REFRAO[1]: place('sfx', whoosh(0.4), t_c - 0.26, 0.4)
    if ev.get('motor') and ev.get('vel'):
        fr = np.array([v[0] for v in ev['vel']]) / 60; vel = np.array([v[1] for v in ev['vel']], float); sl = np.array([v[2] for v in ev['vel']], float)
        a, b = int(fr[0] * SR), min(N, int((fr[-1] + 1 / 60) * SR)); ts = np.arange(a, b) / SR
        v = np.interp(ts, fr, vel); s = np.interp(ts, fr, sl)
        f0 = (26 + v * 0.075) * (0.5 + 0.5 * s); ph = 2 * np.pi * np.cumsum(f0) / SR
        x = sum(np.sin(ph * h) / h ** 0.9 for h in range(1, 8)) + noise(len(ts)) * 0.15
        x = lp(x, 900) * (0.35 + 0.65 * np.minimum(1, v / 300))
        fade = np.minimum(1, np.minimum(np.arange(len(ts)), np.arange(len(ts))[::-1]) / (0.03 * SR))
        place('motor', x * fade * 0.16, ts[0], 1.0)
    if ev.get('chuva'):
        dur = c['n'] / 60; t = tt(dur); x = bp(noise(len(t)), 900, 7000) * 0.08
        for _ in range(int(dur * 25)): i = rng.integers(0, len(t) - 2000); x[i:i + 2000] += hp(noise(2000), 3000) * np.exp(-np.arange(2000) / 200) * 0.15
        place('chuva', x * np.minimum(1, np.minimum(t, dur - t) / 0.08), t_c, 1.0, pan=0.1)

# ---------------- eco (arpejo e lead) e reverb ----------------
D = int(STEP * 3 * SR); out = np.zeros_like(eco); em = lp(eco.mean(axis=0), 3500)  # eco de 3/16, indo e voltando entre os lados
for k in range(1, 6):
    g = 0.42 ** k; sh = D * k
    if sh >= N: break
    out[k % 2, sh:] += em[:N - sh] * g
ir_t = tt(2.4); ir = np.vstack([noise(len(ir_t)), noise(len(ir_t))]) * np.exp(-ir_t * 2.3); ir[:, :480] *= np.linspace(0, 1, 480)
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
rev = np.vstack([fftconvolve(send[c] + out[c] * 0.3, ir[c])[:N] for c in range(2)]) * 0.5

musica = bus['bateria'] * 0.5 + bus['baixo'] * 0.9 + bus['pad'] * 2.0 + bus['arp'] * 2.6 + bus['lead'] * 2.2 + out * 2.4 + rev * 0.8
efeitos = bus['fx'] * 0.9 + bus['sfx'] * 1.0 + bus['motor'] * 0.9 + bus['chuva'] * 0.5 + bus['amb'] * 1.0

# ---------------- falas (a música abaixa enquanto falam) ----------------
voz = np.zeros((2, N)); fala = np.zeros(N)
for v in info.get('vozes', []):
    arq = os.path.join(AQUI, 'voz', v['id'] + '.mp3')
    if not os.path.exists(arq): print('falta a fala', v['id']); continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', arq, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(float); x = hp(x, 90); x /= max(1e-9, np.abs(x).max())
    x = np.tanh(x * 2.2) / np.tanh(2.2)  # compressão leve: a fala fica mais cheia e na frente
    i = int(bt(v['bar']) * SR); j = min(N, i + len(x)); x = x[:j - i]
    voz[:, i:j] += x * 0.62
    fala[i:j] = np.maximum(fala[i:j], 1)
# envelope suave (sobe em 60 ms, solta em 400 ms)
blk = 64; nb = N // blk; env = np.zeros(nb); e = 0
fb = fala[:nb * blk].reshape(nb, blk).max(axis=1)
for k in range(nb):
    alvo = fb[k]; c = 1 - np.exp(-blk / SR / (0.06 if alvo > e else 0.4)); e += (alvo - e) * c; env[k] = e
env = np.repeat(env, blk); env = np.pad(env, (0, N - len(env)), 'edge')
vrev = np.vstack([fftconvolve(voz[c], ir[c])[:N] for c in range(2)]) * 0.06  # um pouco de sala na voz
mix = musica * 0.8 * (1 - 0.72 * env) + efeitos * (1 - 0.5 * env) + voz * 1.0 + vrev

mix = hp(mix, 25)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fim = int((DUR - 0.5) * SR); mix[:, fim:] *= np.linspace(1, 0, N - fim) ** 2
mix /= max(1e-9, np.abs(mix).max()) / 0.92
os.makedirs(os.path.join(AQUI, 'saida'), exist_ok=True)
wavfile.write(os.path.join(AQUI, 'saida', 'trilha.wav'), SR, (mix.T * 32767).astype(np.int16))
if os.environ.get('STEMS'):
    for nome, x in (('musica', musica), ('efeitos', efeitos), ('voz', voz)):
        wavfile.write(os.path.join(AQUI, 'saida', 'stem_' + nome + '.wav'), SR, (np.clip(x / max(1e-9, np.abs(mix).max()), -1, 1).T * 32767).astype(np.int16))
if os.environ.get('DEBUG'):
    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    for a, b in ((5, 9), (9, 19), (19, 21), (21, 33), (33, 36), (38.5, 41)):
        i, j = int(bt(a) * SR), int(bt(b) * SR)
        print('%5.1f-%-5.1f' % (a, b), ' '.join('%s %.1f' % (k, rms(bus[k][:, i:j])) for k in ('bateria', 'baixo', 'pad', 'arp', 'lead', 'fx', 'sfx', 'motor')), 'eco %.1f rev %.1f' % (rms(out[:, i:j]), rms(rev[:, i:j])))
print('trilha: %.2f s (%d compassos), %d bumbos' % (DUR, NBARS, len(kicks)))
