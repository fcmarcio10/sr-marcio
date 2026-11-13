#!/usr/bin/env python3
# Trilha e mixagem da gameplay.
#   música original a 130 BPM (o mesmo andamento do paredão do jogo), por trecho:
#     abre   = abertura de cinema (pad, sub e impacto no logo)
#     rola   = hip-hop tranquilo (meio tempo, piano elétrico) para o passeio pela cidade
#     trampo = o mesmo groove com mais movimento (mecânicas, celular, oficina)
#     baile  = funk (o batidão do paredão) para eventos e racha
#     fecha  = funk com melodia, até o logo
#   + som original do jogo (saida/jogo.wav, feito pelo som_jogo.js)
#   + vozes do jogo que tocaram na gravação (audio/*.mp3, no quadro em que o celular tocou)
#   + narração (narra/final/gXX.wav)
#   A música e o jogo abaixam sozinhos quando alguém fala.
# uso: python3 mix.py   ->  saida/mix.wav
import json, os, subprocess
import numpy as np

AQ = os.path.abspath(os.environ.get('PASTA') or os.path.dirname(os.path.abspath(__file__)))  # PASTA: outra gravação (ex.: ../vertical)
RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
MUSICA = float(os.environ.get('MUSICA', '0.12'))  # volume da trilha (sem narração dá pra subir)
SR = 48000
L = json.load(open(os.path.join(AQ, 'eventos', '_linha.json')))
TOTAL = L['total']; N = int((TOTAL + 1.5) * SR)

# instrumentos do trailer (som.py): kick, clap, hat, tom, bass808, pad, stab, lead, riser, impacto, prato, whoosh...
SOMPY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'som.py')
src = open(SOMPY).read().split('# ---------------- música')[0]
src = src.replace("info = json.load(open(os.path.join(BASE, 'eventos', '_trailer.json')))", "info = {'bpm': 130, 'cenas': [{'bars': 1}]}")
G = {'__file__': SOMPY}; exec(src, G)
kick, clap, hat, tom, bass808, pad, stab, lead, riser, impacto, prato, whoosh = (G[k] for k in ('kick', 'clap', 'hat', 'tom', 'bass808', 'pad', 'stab', 'lead', 'riser', 'impacto', 'prato', 'whoosh'))
lp, hp, bp, tt, noise, midi = G['lp'], G['hp'], G['bp'], G['tt'], G['noise'], G['midi']
rng = np.random.default_rng(11)

BPM = 130; BEAT = 60 / BPM; BAR = 4 * BEAT; STEP = BEAT / 4
def media(x, k):  # média móvel rápida (soma acumulada)
    c = np.cumsum(np.concatenate([[0.0], x])); h = k // 2
    i0 = np.clip(np.arange(len(x)) - h, 0, len(x)); i1 = np.clip(np.arange(len(x)) + k - h, 0, len(x))
    return (c[i1] - c[i0]) / np.maximum(1, i1 - i0)
def ler(path, gan=1.0):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64) * gan
def poe(buf, sig, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= buf.shape[1]: return
    if i < 0: sig = sig[..., -i:]; i = 0
    j = min(buf.shape[1], i + sig.shape[-1]); s = sig[..., :j - i]
    if s.ndim == 1: s = np.vstack([s * (1 - max(0, pan)), s * (1 + min(0, pan))])
    buf[:, i:j] += s * g

# ---------------- instrumentos novos ----------------
def rhodes(freqs, dur):
    t = tt(dur + 0.6); x = np.zeros(len(t))
    for f in freqs:
        trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
        x += (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6) + 0.08 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 12)) * trem
    env = np.minimum(1, t / 0.006) * np.exp(-t * 0.9) * np.clip((dur + 0.6 - t) / 0.4, 0, 1)
    return lp(x * env, 2400) * 0.05
def caixa():  # caixa de hip-hop (corpo + ruído)
    t = tt(0.3); n = len(t)
    return (np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * 0.5 + bp(noise(n), 1200, 6000) * np.exp(-t * 18) * 0.7) * 0.6
def chocalho():
    t = tt(0.09); return bp(noise(len(t)), 5000, 11000) * np.sin(np.pi * np.minimum(1, t / 0.09)) * 0.13
def pop():  # "plim" de destaque na tela
    t = tt(0.25); f = 1180 * (1 + 0.5 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * 0.16
def tecla():  # clique de tecla
    t = tt(0.06); n = len(t)
    return (hp(noise(n), 2500) * np.exp(-t * 160) + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 90) * 0.4) * 0.22

# acordes em Lá menor: Am9 · Fmaj7 · Cmaj7 · G6 (piano) e as fundamentais (baixo)
ACS = [((220, 261.63, 329.63, 493.88), 55.0), ((174.61, 220, 261.63, 329.63), 43.65), ((261.63, 329.63, 392.0, 493.88), 65.41), ((196.0, 246.94, 293.66, 329.63), 49.0)]
def ac(barra): return ACS[int(barra) % 4]

mus = {k: np.zeros((2, N)) for k in ('bat', 'baixo', 'harm', 'mel', 'fx')}
kicks = []
def compasso(b, estilo):
    t0 = b * BAR; ch, raiz = ac(b)
    if estilo in ('rola', 'trampo'):
        # hip-hop em meio tempo: bumbo no 1 e no "e" do 2, caixa no 3
        for s in (0, 6, 10) if estilo == 'trampo' else (0, 10):
            poe(mus['bat'], kick() * 0.8, t0 + s * STEP, 0.85); kicks.append(t0 + s * STEP)
        poe(mus['bat'], caixa(), t0 + 8 * STEP, 0.75, 0.05)
        for s in range(0, 16, 2): poe(mus['bat'], hat(), t0 + s * STEP + (0.012 if s % 4 else 0), 0.30 if s % 4 else 0.22, 0.25)
        if estilo == 'trampo':
            for s in (3, 7, 11, 15): poe(mus['bat'], chocalho(), t0 + s * STEP, 0.8, -0.3)
            if b % 2: poe(mus['bat'], hat(), t0 + 14.5 * STEP, 0.22, 0.25)
        poe(mus['harm'], rhodes(ch, BAR * 0.95), t0, 1.0)
        # variação a cada 8 compassos: dedilhado no piano e chimbal aberto (não cansa no trecho longo)
        if estilo == 'trampo' and (b // 8) % 2 == 1:
            for k2, s2 in enumerate((0, 3, 6, 10, 12)): poe(mus['mel'], rhodes((ch[k2 % 4] * 2,), STEP * 2), t0 + s2 * STEP, 0.55, 0.2 if k2 % 2 else -0.2)
            poe(mus['bat'], hat(True), t0 + 14 * STEP, 0.25, -0.2)
        if estilo == 'trampo' and b % 8 == 7: poe(mus['bat'], tom(260), t0 + 13 * STEP, 0.3); poe(mus['bat'], tom(220), t0 + 14 * STEP, 0.3); poe(mus['bat'], tom(180), t0 + 15 * STEP, 0.3)
        poe(mus['baixo'], bass808(raiz, BAR * 0.45), t0, 0.7)
        poe(mus['baixo'], bass808(raiz * (1.5 if estilo == 'trampo' else 1), BAR * 0.25), t0 + 10 * STEP, 0.55)
    elif estilo in ('baile', 'fecha'):
        for s in range(16):
            if s in (0, 3, 7, 10): poe(mus['bat'], kick(), t0 + s * STEP, 0.9); kicks.append(t0 + s * STEP)
            if s in (4, 12): poe(mus['bat'], clap(), t0 + s * STEP, 0.7)
            if s % 2 == 0: poe(mus['bat'], hat(), t0 + s * STEP, 0.4 if s % 4 else 0.3, 0.25)
            if s in (2, 6, 9, 13, 15): poe(mus['bat'], tom(300 if s in (2, 9) else 240), t0 + s * STEP, 0.3, -0.35 if s % 2 else 0.35)
        for s, k in {0: 1, 6: 1.1892, 8: 0.8909, 14: 1.0595}.items(): poe(mus['baixo'], bass808(raiz * k, STEP * (6 if s == 0 else 2) * 0.95), t0 + s * STEP, 0.75)
        for s in (2, 10): poe(mus['harm'], stab(ch[2] * 2 if s == 2 else ch[1] * 2), t0 + s * STEP, 0.55, 0.3 if s == 2 else -0.3)
        if estilo == 'fecha':
            MEL = [[(0, 69, 3), (3, 72, 3), (6, 76, 2), (8, 74, 4), (12, 72, 2), (14, 69, 2)], [(0, 67, 3), (3, 69, 3), (6, 72, 2), (8, 76, 6), (14, 74, 2)]]
            for s, m, d in MEL[b % 2]: poe(mus['mel'], lead(midi(m), d * STEP), t0 + s * STEP, 0.6, 0.15)
    elif estilo == 'abre':
        if b % 2 == 0: poe(mus['harm'], pad(ch[:3], 2 * BAR, 900), t0, 0.9)
        poe(mus['baixo'], bass808(raiz, BAR * 0.9) * 0.6, t0, 0.5)
        for s in range(0, 16, 4): poe(mus['bat'], hat(), t0 + s * STEP, 0.14, 0.3)

# ---------------- trechos: cada cena tem um estilo; troca no compasso mais perto ----------------
trechos = []
for c in L['cenas']:
    a = c['f0'] / 60; e = (c['f0'] + c['n']) / 60; st = c.get('estilo') or 'trampo'
    if trechos and trechos[-1][2] == st: trechos[-1][1] = e
    else: trechos.append([a, e, st])
estilo_bar = {}
nb = int(TOTAL / BAR) + 2
for b in range(nb):
    tb = b * BAR + BAR / 2
    for a, e, st in trechos:
        if a <= tb < e: estilo_bar[b] = st
for b in range(nb):
    if b in estilo_bar and b * BAR < TOTAL - 0.2: compasso(b, estilo_bar[b])
# o bumbo empurra o piano e o baixo (balanço)
duck = np.ones(N)
for tk in kicks:
    i = int(tk * SR); j = min(N, i + int(0.25 * SR)); q = np.arange(j - i) / SR; duck[i:j] = np.minimum(duck[i:j], 1 - 0.4 * np.exp(-q * 14))
mus['harm'] *= duck; mus['baixo'] *= 0.65 + 0.35 * duck

# viradas: riser antes de trocar de trecho, prato e whoosh na troca; impacto no logo
for k, (a, e, st) in enumerate(trechos):
    if k == 0: continue
    poe(mus['fx'], riser(BAR * 0.9) * 0.8, a - BAR * 0.9, 0.7)
    poe(mus['fx'], prato(), a, 0.8)
    poe(mus['fx'], whoosh(0.7), a - 0.35, 0.6)
for c in L['cenas']:
    if c['nome'].endswith('logo'): poe(mus['fx'], impacto(), c['f0'] / 60, 1.1); poe(mus['fx'], prato(), c['f0'] / 60, 0.9)
# corte final: acorde longo no logo
fim = [c for c in L['cenas'] if c['nome'].endswith('logo')][-1:]
if fim:
    t = fim[0]['f0'] / 60; poe(mus['harm'], pad(ACS[0][0][:3], 3.2 * BAR, 1200), t, 1.0); poe(mus['baixo'], bass808(55, 2.2 * BAR) * 0.7, t, 0.7)

musica = mus['bat'] * 1.0 + mus['baixo'] * 0.9 + mus['harm'] * 1.0 + mus['mel'] * 0.8 + mus['fx'] * 0.8
# volume da trilha por cena (ex.: no paredão a música some e fica o som do jogo)
volc = np.ones(N)
for c in L['cenas']:
    v = c.get('musica');
    if v is not None: volc[int(c['f0'] / 60 * SR):int((c['f0'] + c['n']) / 60 * SR)] = v
volc = media(volc, int(0.25 * SR))
musica *= volc

# ---------------- vozes: narração e vozes do jogo ----------------
voz = np.zeros((2, N)); fx = np.zeros((2, N))
for fl in L['falas']:
    if fl['id'].startswith('g'): poe(voz, ler(os.path.join(AQ, 'narra', 'final', fl['id'] + '.wav'), 1.0 * fl.get('gan', 1)), fl['t'])
for c in L['cenas']:
    fp = os.path.join(AQ, 'eventos', c['nome'] + '.json')
    if not os.path.exists(fp): continue
    som = json.load(open(fp))['som']
    for i, (f, nm, a) in enumerate(som):
        if nm == 'VOZ':
            x = ler(os.path.join(RAIZ, 'audio', a[0] + '.mp3')); x = x / max(1e-6, np.sqrt((x ** 2).mean())) * 0.07
            para = next((g for g, n2, _ in som[i + 1:] if n2 == 'VOZ_PARA'), None)
            if para is not None: x = x[:, :int((para - f) / 60 * SR)]
            poe(voz, x, f / 60)
        elif nm == 'FX':
            poe(fx, {'pop': pop, 'tecla': tecla}.get(a[0], pop)(), f / 60, 1.0)
# envelope de fala (para abaixar a música e o jogo)
mono = np.abs(voz).mean(axis=0); k = int(0.03 * SR)
env = media(mono, k); env = env / max(1e-9, np.percentile(env[env > 1e-4], 95) if (env > 1e-4).any() else 1)
env = np.clip(env * 1.6, 0, 1)
# ataque rápido, soltura lenta
sm = np.zeros(N); a_, r_ = np.exp(-64 / (0.03 * SR)), np.exp(-64 / (0.5 * SR)); v = 0.0  # por bloco de 64 amostras
for i in range(0, N, 64):
    e = env[i]; v = a_ * v + (1 - a_) * e if e > v else r_ * v + (1 - r_) * e; sm[i:i + 64] = v
jogo = ler(os.path.join(AQ, 'saida', 'jogo.wav')) if os.path.exists(os.path.join(AQ, 'saida', 'jogo.wav')) else np.zeros((2, N))
jogo = np.pad(jogo, ((0, 0), (0, max(0, N - jogo.shape[1]))))[:, :N]
mix = musica * MUSICA * (1 - 0.8 * sm) + jogo * 0.75 * (1 - 0.7 * sm) + voz * 1.0 + fx * 0.9  # voz ~12 dB acima do fundo
if os.environ.get('STEMS'):
    fundo = musica * MUSICA * (1 - 0.8 * sm) + jogo * 0.75 * (1 - 0.7 * sm) + fx * 0.9
    for nome, st in (('st_voz', voz), ('st_fundo', fundo), ('st_mus', musica), ('st_jogo', jogo), ('st_env', np.vstack([sm, sm]))):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', os.path.join(AQ, 'saida', nome + '.wav')], input=st.T.astype(np.float32).tobytes(), check=True)
mix = hp(mix, 30)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
f0 = int((TOTAL - 0.6) * SR); mix[:, f0:] *= np.linspace(1, 0, N - f0) ** 1.5
mix /= max(1e-9, np.abs(mix).max()) / 0.95
os.makedirs(os.path.join(AQ, 'saida'), exist_ok=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', os.path.join(AQ, 'saida', 'mix.wav')], input=mix.T.astype(np.float32).tobytes(), check=True)
print('mix: %.1f s · trechos: %s' % (TOTAL, ' > '.join('%s(%.0fs)' % (st, e - a) for a, e, st in trechos)))
