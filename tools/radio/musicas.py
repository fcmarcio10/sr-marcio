# Músicas da Rádio Gambiarra FM: 8 faixas instrumentais compostas aqui no código (sintetizadas nota por nota),
# sem trecho de música de ninguém: são do jogo, livres de direitos.
# Uso (de dentro de tools/radio):  python3 musicas.py [nome]   ->  ../../audio/mus_<nome>.mp3 (mono, 24 kHz, 40 kbps)
#   PREVIA=1 python3 musicas.py   grava também previa/<nome>.wav (qualidade cheia, para ouvir)
import numpy as np, os, sys, subprocess
from scipy.signal import butter, sosfilt, fftconvolve

SR = 32000
AQ = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(AQ, '..', '..', 'audio')
TAU = 2 * np.pi

def mf(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, fc, o=2): return sosfilt(butter(o, min(fc, SR * 0.45) / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, f1, f2, o=2): return sosfilt(butter(o, [f1 / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], 'band', output='sos'), x)
def env(n, a=0.005, r=0.03):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)[:n]; e[-nr:] *= np.linspace(1, 0, nr)[-n:] if nr <= n else 1
    return e
RNGN = np.random.default_rng(7)
def ruido(n): return RNGN.standard_normal(n)

# ---------------- instrumentos ----------------
_cache = {}
def memo(k, fn):
    if k not in _cache: _cache[k] = fn()
    return _cache[k]

def kick(f0=150, f1=48, dur=0.36, v=1.0):
    def f():
        t = tt(dur); fr = f1 + (f0 - f1) * np.exp(-t * 28); ph = TAU * np.cumsum(fr) / SR
        return (np.sin(ph) * np.exp(-t * 7.5) + 0.25 * lp(ruido(len(t)), 3000) * np.exp(-t * 90)) * v
    return memo(('k', f0, f1, dur, v), f)
def caixa(tom=190, dur=0.18, v=1.0, brilho=5000):
    def f():
        t = tt(dur); n = bp(ruido(len(t)), 1200, brilho) * np.exp(-t * 22)
        return (0.75 * n + 0.45 * np.sin(TAU * tom * t) * np.exp(-t * 30)) * v
    return memo(('c', tom, dur, v, brilho), f)
def palma(v=1.0):
    def f():
        t = tt(0.2); n = bp(ruido(len(t)), 900, 3500); e = np.zeros(len(t))
        for d in (0, 0.011, 0.022): e += (t >= d) * np.exp(-np.maximum(t - d, 0) * (45 if d < 0.02 else 18))
        return n * e * 0.8 * v
    return memo(('p', v), f)
def chimbal(aberto=False, v=1.0):
    def f():
        d = 0.22 if aberto else 0.045; t = tt(d)
        return hp(ruido(len(t)), 7000) * np.exp(-t * (14 if aberto else 95)) * 0.5 * v
    return memo(('h', aberto, v), f)
def tom(fq=140, dur=0.3, v=1.0):
    def f():
        t = tt(dur); fr = fq * (1 + 0.5 * np.exp(-t * 30)); ph = TAU * np.cumsum(fr) / SR
        return np.sin(ph) * np.exp(-t * 9) * v
    return memo(('t', fq, dur, v), f)
def zabumba(v=1.0):  # pancada grave
    def f():
        t = tt(0.4); fr = 72 + 40 * np.exp(-t * 35); ph = TAU * np.cumsum(fr) / SR
        return (np.sin(ph) * np.exp(-t * 8) + 0.2 * lp(ruido(len(t)), 900) * np.exp(-t * 40)) * v
    return memo(('z', v), f)
def bacalhau(v=1.0):  # varinha no couro de baixo da zabumba
    def f():
        t = tt(0.06); return (bp(ruido(len(t)), 1500, 4500) * 0.6 + 0.4 * np.sin(TAU * 640 * t)) * np.exp(-t * 70) * v
    return memo(('b', v), f)
def triangulo(aberto, v=1.0):
    def f():
        d = 0.5 if aberto else 0.06; t = tt(d); s = np.zeros(len(t))
        for fq, a in ((4180, 1), (5650, 0.6), (7340, 0.45), (9100, 0.25)): s += a * np.sin(TAU * fq * t)
        return s * np.exp(-t * (6 if aberto else 70)) * 0.22 * v
    return memo(('tri', aberto, v), f)
def surdo(v=1.0, abafado=False):
    def f():
        t = tt(0.7); fr = 58 + 18 * np.exp(-t * 20); ph = TAU * np.cumsum(fr) / SR
        return np.sin(ph) * np.exp(-t * (12 if abafado else 4.5)) * v
    return memo(('s', v, abafado), f)
def pandeiro(forte=False, v=1.0):
    def f():
        t = tt(0.12); j = bp(ruido(len(t)), 5500, 11000) * np.exp(-t * 32) * 0.55
        pele = np.sin(TAU * 230 * t) * np.exp(-t * 45) * (0.6 if forte else 0.15)
        return (j + pele) * v
    return memo(('pd', forte, v), f)
def tamborim(v=1.0):
    def f():
        t = tt(0.07); return (np.sin(TAU * (820 - 900 * t) * t) * 0.7 + 0.3 * bp(ruido(len(t)), 2000, 6000)) * np.exp(-t * 55) * v
    return memo(('tb', v), f)
def ganza(v=1.0):
    def f():
        t = tt(0.06); return bp(ruido(len(t)), 4500, 10000) * np.exp(-t * 60) * 0.4 * v
    return memo(('g', v), f)
def aro(v=1.0):  # baqueta no aro (bossa)
    def f():
        t = tt(0.05); return (np.sin(TAU * 1700 * t) * 0.5 + bp(ruido(len(t)), 2500, 6000) * 0.5) * np.exp(-t * 90) * v
    return memo(('aro', v), f)
def agogo(alto, v=1.0):
    def f():
        fq = 1180 if alto else 880; t = tt(0.25); s = np.zeros(len(t))
        for k, a in ((1, 1), (2.76, 0.5), (5.4, 0.25)): s += a * np.sin(TAU * fq * k * t)
        return s * np.exp(-t * 16) * 0.25 * v
    return memo(('ag', alto, v), f)

def corda(f, dur, brilho=0.5, decai=1.0, pos=0.22, harm=18):  # violão, viola, cavaquinho, guitarra (cordas somadas)
    t = tt(dur); s = np.zeros(len(t)); K = int(min(harm, SR * 0.45 / f))
    for k in range(1, K + 1):
        a = abs(np.sin(np.pi * k * pos)) / k ** (1.35 - 0.6 * brilho)
        d = (1.0 + 0.32 * k * k * (1.15 - brilho)) * decai
        s += a * np.sin(TAU * f * k * (1 + 0.00035 * k * k) * t) * np.exp(-t * d)
    s += lp(ruido(len(t)), 5000) * np.exp(-t * 300) * 0.15
    return s * env(len(t), 0.001, 0.04)
def viola(f, dur):  # viola caipira: par de cordas em oitava
    return corda(f, dur, 0.72, 1.3) + 0.55 * corda(2 * f * 1.002, dur, 0.75, 1.6)
def cavaco(f, dur): return corda(f, dur, 0.85, 3.2, 0.18, 12)
def violao(f, dur): return corda(f, dur, 0.38, 1.1, 0.25)
def guitarra(f, dur):  # guitarra limpa com coro
    return 0.6 * corda(f, dur, 0.62, 1.4) + 0.4 * corda(f * 1.004, dur, 0.62, 1.4)
def baixo(f, dur, v=1.0):
    t = tt(dur); s = np.zeros(len(t))
    for k, a in ((1, 1), (2, 0.45), (3, 0.22), (4, 0.1), (5, 0.05)): s += a * np.sin(TAU * f * k * t) * np.exp(-t * (2.2 + k * 1.3))
    return np.tanh(1.4 * s) * env(len(t), 0.004, 0.05) * v
def sub808(f, dur, v=1.0):
    t = tt(dur); fr = f * (1 + 0.6 * np.exp(-t * 40)); ph = TAU * np.cumsum(fr) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t * 1.6)) * env(len(t), 0.002, 0.08) * 0.8 * v
def serrote(f, dur, harm=None, det=0.0):  # dente de serra somando harmônicos (sem chiado digital)
    t = tt(dur); s = np.zeros(len(t)); K = int(min(harm or 40, SR * 0.45 / f))
    for k in range(1, K + 1): s += np.sin(TAU * f * (1 + det) * k * t) / k
    return s
def sanfona(f, dur, v=1.0):
    t = tt(dur); s = np.zeros(len(t)); K = int(min(16, 5200 / f))
    for k in range(1, K + 1):
        a = (1.0 if k % 2 else 0.55) / k ** 0.9
        s += a * (np.sin(TAU * f * k * t) + 0.8 * np.sin(TAU * f * 1.0045 * k * t + 0.7))
    s *= 1 + 0.13 * np.sin(TAU * 5.6 * t)
    return lp(s, 3800) * env(len(t), 0.025, 0.07) * 0.32 * v
def sopro(f, dur, v=1.0, vib=0.006, brilho=1.0):  # sax/metal: harmônicos com envelope de filtro
    t = tt(dur); s = np.zeros(len(t)); K = int(min(18, SR * 0.4 / f))
    fv = f * (1 + vib * np.sin(TAU * 5.2 * t) * np.clip((t - 0.12) * 5, 0, 1)); ph = TAU * np.cumsum(fv) / SR
    ab = 0.25 + 0.75 * np.exp(-t * 6)
    for k in range(1, K + 1): s += np.sin(ph * k) / k * np.exp(-k * (1.2 - 0.7 * ab) / (2.2 * brilho))
    s += bp(ruido(len(t)), 1500, 4000) * 0.04
    return np.tanh(1.5 * s) * env(len(t), 0.03, 0.07) * 0.5 * v
def flauta(f, dur, v=1.0):
    t = tt(dur); fv = f * (1 + 0.005 * np.sin(TAU * 5 * t) * np.clip((t - 0.15) * 4, 0, 1)); ph = TAU * np.cumsum(fv) / SR
    s = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph) + bp(ruido(len(t)), 2000, 6000) * 0.05
    return s * env(len(t), 0.05, 0.08) * 0.5 * v
def rhodes(f, dur, v=1.0):
    t = tt(dur); I = 1.6 * np.exp(-t * 5)
    s = np.sin(TAU * f * t + I * np.sin(TAU * f * t)) + 0.25 * np.sin(TAU * 2 * f * t) * np.exp(-t * 3)
    return s * np.exp(-t * 1.1) * env(len(t), 0.003, 0.08) * 0.45 * v
def orgao(f, dur, v=1.0):
    t = tt(dur); s = np.zeros(len(t))
    for k, a in ((1, 1), (2, 0.6), (3, 0.35), (4, 0.25), (6, 0.12)): s += a * (np.sin(TAU * f * k * t) + np.sin(TAU * f * k * 1.003 * t))
    return s * (1 + 0.08 * np.sin(TAU * 6 * t)) * env(len(t), 0.02, 0.1) * 0.16 * v
def pad(f, dur, v=1.0):
    s = serrote(f, dur, 14, -0.003) + serrote(f, dur, 14, 0.004)
    return lp(s, 1500) * env(len(s), 0.25, 0.4) * 0.12 * v
def bipe(f, dur, v=1.0):  # sintetizador quadrado do funk
    t = tt(dur); s = np.zeros(len(t)); K = int(min(15, SR * 0.4 / f))
    for k in range(1, K + 1, 2): s += np.sin(TAU * f * k * t) / k
    return s * np.exp(-t * 7) * env(len(t), 0.002, 0.03) * 0.4 * v
def lead80(f, dur, v=1.0):
    t = tt(dur); fv = f * (1 + 0.006 * np.sin(TAU * 5.5 * t) * np.clip((t - 0.2) * 4, 0, 1)); ph = TAU * np.cumsum(fv) / SR
    s = np.zeros(len(t))
    for k in range(1, int(min(24, SR * 0.4 / f)) + 1): s += np.sin(ph * k) / k
    return lp(s, 2600) * env(len(t), 0.01, 0.1) * 0.3 * v

# ---------------- harmonia e melodia ----------------
NOTAS = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
TIPOS = {'': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'm7': (0, 3, 7, 10), 'maj7': (0, 4, 7, 11), '6': (0, 4, 7, 9), 'm6': (0, 3, 7, 9), '9': (0, 4, 7, 10, 14)}
def acorde(nome):
    r = nome[:2] if len(nome) > 1 and nome[1] in '#b' else nome[:1]
    return NOTAS[r], TIPOS[nome[len(r):]]
def notas_acorde(nome, oit=4):
    r, iv = acorde(nome); b = 12 * (oit + 1) + r
    return [b + i for i in iv]
ESCALA_MAIOR = (0, 2, 4, 5, 7, 9, 11)
ESCALA_MENOR = (0, 2, 3, 5, 7, 8, 10)
def escala(tom, menor=False, lo=55, hi=86):
    r = NOTAS[tom]; E = ESCALA_MENOR if menor else ESCALA_MAIOR
    return [m for m in range(lo, hi + 1) if (m - r) % 12 in E]

class Musica:
    def __init__(s, bpm, compassos, tempos=4, cauda=3.0):
        s.bpm, s.tc, s.tempos = bpm, 60.0 / bpm, tempos
        s.dur = compassos * tempos * s.tc
        s.N = int(SR * (s.dur + cauda)); s.seco = np.zeros(s.N); s.molhado = np.zeros(s.N)
        s.rng = np.random.default_rng(bpm * 31 + compassos)
    def t(s, comp, tempo=0.0): return (comp * s.tempos + tempo) * s.tc
    def poe(s, sig, seg, g=1.0, rev=0.0, hum=0.004):
        if seg < 0: return
        seg += s.rng.uniform(-hum, hum) if hum else 0  # pequena variação humana
        i = max(0, int(seg * SR)); n = min(len(sig), s.N - i)
        if n <= 0: return
        s.seco[i:i + n] += sig[:n] * g
        if rev: s.molhado[i:i + n] += sig[:n] * g * rev
    def mestre(s, alvo_db=-22.0, sala=0.9):
        n = int(SR * sala); t = np.arange(n) / SR
        ir = lp(RNGN.standard_normal(n), 5000) * np.exp(-t * 6.5 / sala); ir /= np.sqrt((ir ** 2).sum())
        x = s.seco + 0.35 * fftconvolve(s.molhado, ir)[:s.N]
        x = hp(x, 38)
        x /= np.abs(x).max() + 1e-9
        x = np.tanh(1.8 * x) / np.tanh(1.8)  # cola a mixagem (compressão suave)
        rms = np.sqrt((x ** 2).mean()); x *= 10 ** (alvo_db / 20) / rms
        x = np.tanh(x / 0.98) * 0.98 if np.abs(x).max() > 0.98 else x
        fim = int(SR * (s.dur + 2.2)); x = x[:fim]
        nf = int(SR * 2.4); x[-nf:] *= np.linspace(1, 0, nf) ** 1.6
        ni = int(SR * 0.02); x[:ni] *= np.linspace(0, 1, ni)
        return x

def frase(M, rng, prog, c0, ncomp, ritmo, inst, faixa, prev, g=1.0, rev=0.25, duas_vozes=None, esc=None, nota_dur=1.0):
    """Melodia de ncomp compassos começando em c0: nota do acorde no tempo forte, passo de escala no fraco.
    ritmo: lista de (tempo dentro da frase, duração em tempos)."""
    lo, hi = faixa; esc = [m for m in esc if lo <= m <= hi]
    out = []
    for (b, d) in ritmo:
        comp = c0 + int(b // M.tempos)
        if comp >= c0 + ncomp: break
        nome = prog[comp % len(prog)]
        forte = abs(b - round(b)) < 1e-6 and int(round(b)) % 2 == 0
        if forte or prev is None:
            cand = [m for m in esc if (m - acorde(nome)[0]) % 12 in [i % 12 for i in acorde(nome)[1]]]
            if prev is None: prev = cand[len(cand) // 2]
            cand.sort(key=lambda m: abs(m - prev) + rng.uniform(0, 3.5))
            m = cand[0]
        else:
            i = min(range(len(esc)), key=lambda k: abs(esc[k] - prev)); passo = int(rng.choice([-2, -1, -1, 1, 1, 2]))
            m = esc[max(0, min(len(esc) - 1, i + passo))]
        out.append((M.t(c0, b), d * M.tc * nota_dur, m)); prev = m
    for (seg, d, m) in out:
        M.poe(inst(mf(m), d + 0.06), seg, g, rev)
        if duas_vozes is not None:  # dueto em terças (música caipira)
            i = min(range(len(esc)), key=lambda k: abs(esc[k] - m)); m2 = esc[max(0, i - 2)]
            M.poe(inst(mf(m2), d + 0.06), seg + 0.004, g * duas_vozes, rev)
    return prev, out

def repete(M, notas, de_c, para_c, inst, g, rev=0.25, prog=None, desloca=0):
    """Repete uma frase já tocada em outro ponto (mesmo motivo, transposto pelo baixo do acorde)."""
    dt = M.t(para_c) - M.t(de_c)
    for (seg, d, m) in notas: M.poe(inst(mf(m + desloca), d + 0.06), seg + dt, g, rev)

def baixo_raiz(nome, oit=2): return mf(12 * (oit + 1) + acorde(nome)[0])
def quinta(nome, oit=2): return mf(12 * (oit + 1) + acorde(nome)[0] + 7)

# ---------------- as músicas ----------------
def xote():  # Trio Pé de Pano — Xote do Pneu Furado (forró, sanfona, zabumba e triângulo)
    M = Musica(104, 28); prog = ['G', 'C', 'D7', 'G', 'Em', 'C', 'D7', 'G']; rng = np.random.default_rng(11)
    esc = escala('G', lo=60, hi=88)
    for c in range(28):
        nome = prog[c % 8]; fim = c >= 27
        # zabumba: grave no 1 e no 2-e, bacalhau no contratempo
        M.poe(zabumba(0.9), M.t(c, 0)); M.poe(zabumba(0.6), M.t(c, 1.5)); M.poe(zabumba(0.8), M.t(c, 2)); M.poe(zabumba(0.55), M.t(c, 3.5))
        for b in (1, 3): M.poe(bacalhau(0.7), M.t(c, b))
        if not fim:
            for k in range(16): M.poe(triangulo(k % 4 == 2, 0.9 if k % 4 == 2 else 0.6), M.t(c, k / 4))
        # baixo e acordes de sanfona no contratempo
        M.poe(baixo(baixo_raiz(nome), 0.9 * M.tc, 0.7), M.t(c, 0)); M.poe(baixo(quinta(nome), 0.9 * M.tc, 0.55), M.t(c, 2))
        if c >= 2:
            for b in (1, 3):
                for m in notas_acorde(nome, 4): M.poe(sanfona(mf(m), 0.42 * M.tc, 0.32), M.t(c, b + 0.5), 1, 0.2)
    r1 = [(0, 1), (1, 0.5), (1.5, 0.5), (2, 1.5), (3.5, 0.5), (4, 1), (5, 1), (6, 2)]
    r2 = [(0, 0.5), (0.5, 0.5), (1, 0.5), (1.5, 0.5), (2, 1), (3, 1), (4, 0.75), (4.75, 0.75), (5.5, 0.5), (6, 2)]
    p = None; p, A = frase(M, rng, prog, 4, 2, r1, sanfona, (62, 81), p, 1.0, 0.3, esc=esc)
    for c in (6, 8, 10): p, _ = frase(M, rng, prog, c, 2, r1 if c != 10 else r2, sanfona, (62, 81), p, 1.0, 0.3, esc=esc)
    for c in (12, 14, 16, 18): p, _ = frase(M, rng, prog, c, 2, r2, sanfona, (67, 86), p, 1.0, 0.3, esc=esc)
    repete(M, A, 4, 20, sanfona, 1.0, 0.3)
    for c in (22, 24): p, _ = frase(M, rng, prog, c, 2, r1, sanfona, (62, 81), p, 1.0, 0.3, esc=esc)
    M.poe(sanfona(mf(67), 1.6), M.t(26, 0), 1, 0.4); M.poe(sanfona(mf(71), 1.6), M.t(26, 0), 0.8, 0.4); M.poe(sanfona(mf(74), 1.6), M.t(26, 0), 0.7, 0.4)
    M.poe(zabumba(1), M.t(27, 0)); M.poe(triangulo(True), M.t(27, 0))
    return M.mestre()

def funk():  # MC Rebaixado — Batidão da Lombada (tamborzão, 808 e bipe)
    M = Musica(130, 34); prog = ['Am', 'Am', 'F', 'G']; rng = np.random.default_rng(22)
    esc = escala('A', True, 64, 88)
    bumbo = [0, 3, 6, 8, 11, 14]; tamb = [2, 7, 10, 15]
    for c in range(34):
        nome = prog[c % 4]; intro = c < 2; fim = c == 33
        for k in range(16):
            tk = M.t(c, k / 4)
            if k in bumbo and not intro: M.poe(kick(160, 45, 0.4, 1.0), tk)
            if k in (4, 12): M.poe(palma(0.9), tk); M.poe(caixa(220, 0.12, 0.35), tk)
            if k in tamb: M.poe(tom(210 if k % 2 else 165, 0.18, 0.55), tk)
            if k % 2 == 0 and not intro: M.poe(chimbal(False, 0.4), tk)
            if k in bumbo and not intro and not fim: M.poe(sub808(baixo_raiz(nome, 1), 0.35, 0.9), tk)
        if fim: break
        if c >= 2 and c % 2 == 0:  # bipe: motivo curto que se repete (é o "chiclete" da música)
            for (b, m) in ((0, 0), (0.75, 3), (1.5, 0), (2.5, 7), (3, 5), (3.5, 3)):
                M.poe(bipe(mf(69 + m), 0.22), M.t(c, b), 0.55, 0.15)
        if 10 <= c < 26 and c % 4 == 0:
            for m in notas_acorde(nome, 4): M.poe(pad(mf(m), 4 * M.tc * 2), M.t(c, 0), 0.9, 0.3)
    r = [(0, 0.5), (0.75, 0.5), (1.5, 0.5), (2, 0.5), (3, 1), (4, 0.5), (4.5, 0.5), (5, 0.5), (5.75, 0.5), (6.5, 1.5)]
    p = None
    for c in range(10, 26, 2): p, _ = frase(M, rng, prog, c, 2, r, lead80, (64, 84), p, 0.7, 0.3, esc=esc, nota_dur=0.8)
    M.poe(kick(160, 40, 0.8, 1.2), M.t(33, 0)); M.poe(sub808(baixo_raiz('Am', 1), 1.6, 1.0), M.t(33, 0))
    return M.mestre(sala=0.6)

def moda():  # Zé Poeira & Toinho Lama — Moda da Vaca Atolada (viola caipira em dueto de terças e violão)
    M = Musica(92, 24); prog = ['D', 'D', 'A7', 'A7', 'A7', 'A7', 'D', 'D', 'G', 'G', 'D', 'D', 'A7', 'A7', 'D', 'D']; rng = np.random.default_rng(33)
    esc = escala('D', lo=62, hi=86)
    for c in range(24):
        nome = prog[c % 16]
        # violão: baixo no 1 e 3, acorde abafado no 2 e 4 (batida de toada)
        M.poe(violao(baixo_raiz(nome, 2), 0.9 * M.tc), M.t(c, 0), 0.9); M.poe(violao(quinta(nome, 2), 0.9 * M.tc), M.t(c, 2), 0.8)
        for b in (1, 3, 3.5):
            for i, m in enumerate(notas_acorde(nome, 3)): M.poe(violao(mf(m), 0.35), M.t(c, b) + i * 0.012, 0.32 if b != 3.5 else 0.2, 0.15)
        if c % 2 == 0: M.poe(ganza(0.4), M.t(c, 1)); M.poe(ganza(0.4), M.t(c, 3))
    r = [(0, 1.5), (1.5, 0.5), (2, 1), (3, 1), (4, 1.5), (5.5, 0.5), (6, 2)]
    r2 = [(0, 0.5), (0.5, 0.5), (1, 1), (2, 0.5), (2.5, 0.5), (3, 1), (4, 1), (5, 1), (6, 2)]
    p = None; p, A = frase(M, rng, prog, 2, 2, r, viola, (66, 81), p, 0.9, 0.3, duas_vozes=0.75, esc=esc)
    for c in (4, 6): p, _ = frase(M, rng, prog, c, 2, r, viola, (66, 81), p, 0.9, 0.3, duas_vozes=0.75, esc=esc)
    for c in (8, 10, 12, 14): p, _ = frase(M, rng, prog, c, 2, r2, viola, (69, 86), p, 0.9, 0.3, duas_vozes=0.75, esc=esc)
    repete(M, A, 2, 16, viola, 0.9); repete(M, A, 2, 16, viola, 0.65, desloca=-3)
    for c in (18, 20): p, _ = frase(M, rng, prog, c, 2, r, viola, (66, 81), p, 0.9, 0.3, duas_vozes=0.75, esc=esc)
    for m, g in ((62, 0.8), (66, 0.7), (69, 0.7), (74, 0.6)): M.poe(viola(mf(m), 3.0), M.t(22, 0), g, 0.4)
    return M.mestre()

def pagode():  # Grupo Fiado Pago — Pagode do Pastel de Vento (surdo, pandeiro, tamborim, cavaco e flauta)
    M = Musica(98, 26); prog = ['C', 'A7', 'Dm', 'G7', 'C', 'A7', 'Dm', 'G7']; rng = np.random.default_rng(44)
    esc = escala('C', lo=67, hi=91)
    teleco = [0, 3, 6, 8, 10, 13]  # teleco-teco do tamborim (em semicolcheias, 1 compasso)
    for c in range(26):
        nome = prog[c % 8]; fim = c == 25
        M.poe(surdo(0.45, True), M.t(c, 0)); M.poe(surdo(0.9), M.t(c, 1)); M.poe(surdo(0.4, True), M.t(c, 2)); M.poe(surdo(0.9), M.t(c, 3))
        if fim: break
        for k in range(16): M.poe(pandeiro(k % 4 == 0 or k % 4 == 3, 0.8 if k % 2 == 0 else 0.55), M.t(c, k / 4))
        if c >= 2:
            for k in teleco: M.poe(tamborim(0.6), M.t(c, k / 4))
        # cavaco: batida sincopada
        for k in (0, 3, 6, 8, 11, 14):
            for i, m in enumerate(notas_acorde(nome, 4)): M.poe(cavaco(mf(m), 0.22), M.t(c, k / 4) + i * 0.008, 0.28, 0.1)
        M.poe(baixo(baixo_raiz(nome), 0.5 * M.tc), M.t(c, 0), 0.8); M.poe(baixo(quinta(nome), 0.5 * M.tc), M.t(c, 1.5), 0.6)
        M.poe(baixo(baixo_raiz(nome), 0.5 * M.tc), M.t(c, 2), 0.7); M.poe(baixo(mf(12 * 3 + acorde(nome)[0] + acorde(nome)[1][1]), 0.5 * M.tc), M.t(c, 3), 0.55)
    r = [(0, 0.5), (0.5, 0.5), (1, 0.75), (1.75, 0.75), (2.5, 0.5), (3, 1), (4, 0.5), (4.5, 0.5), (5, 0.5), (5.5, 1), (6.5, 1.5)]
    r2 = [(0, 1), (1, 0.5), (1.5, 1), (2.5, 0.5), (3, 1), (4, 1), (5, 0.75), (5.75, 0.75), (6.5, 1.5)]
    p = None; p, A = frase(M, rng, prog, 2, 2, r, flauta, (72, 88), p, 0.8, 0.3, esc=esc)
    for c in (4, 6, 8): p, _ = frase(M, rng, prog, c, 2, r if c != 8 else r2, flauta, (72, 88), p, 0.8, 0.3, esc=esc)
    for c in (10, 12, 14, 16): p, _ = frase(M, rng, prog, c, 2, r2, cavaco, (67, 84), p, 0.9, 0.2, esc=esc, nota_dur=0.9)
    repete(M, A, 2, 18, flauta, 0.8)
    for c in (20, 22): p, _ = frase(M, rng, prog, c, 2, r, flauta, (72, 88), p, 0.8, 0.3, esc=esc)
    for m in notas_acorde('C', 4): M.poe(cavaco(mf(m), 1.2), M.t(24, 3.5), 0.4, 0.3)
    M.poe(surdo(1.0), M.t(25, 0)); M.poe(pandeiro(True, 1), M.t(25, 0))
    return M.mestre()

def neon():  # Os Faróis Altos — Neon na BR (anos 80: bumbo reto, baixo de serrote, arpejo e solo)
    M = Musica(105, 28); prog = ['Am', 'F', 'C', 'G']; rng = np.random.default_rng(55)
    esc = escala('A', True, 64, 88)
    for c in range(28):
        nome = prog[c % 4]; intro = c < 2; fim = c == 27
        for b in range(4):
            if not intro: M.poe(kick(140, 50, 0.32, 0.9), M.t(c, b))
            if b in (1, 3) and not intro: M.poe(caixa(200, 0.25, 0.9), M.t(c, b), 1, 0.6)
        if fim: break
        for k in range(8): M.poe(chimbal(k % 2 == 1, 0.35), M.t(c, k / 2))
        r0 = acorde(nome)[0]
        for k in range(8): M.poe(lp(serrote(mf(12 * 3 + r0), 0.5 * M.tc * 0.9, 20), 900) * env(int(SR * 0.5 * M.tc * 0.9), 0.003, 0.05) * 0.18, M.t(c, k / 2))
        if c % 2 == 0:
            for m in notas_acorde(nome, 4): M.poe(pad(mf(m), 8 * M.tc), M.t(c, 0), 1.0, 0.5)
        if c >= 4:
            arp = notas_acorde(nome, 5)
            for k in range(16): M.poe(lp(serrote(mf(arp[k % 3] + (12 if k % 8 >= 6 else 0)), 0.12, 16), 3000) * np.exp(-tt(0.12) * 18) * 0.09, M.t(c, k / 4), 1, 0.3)
    r = [(0, 1.5), (1.5, 0.5), (2, 1), (3, 1), (4, 2), (6, 2)]
    r2 = [(0, 0.5), (0.5, 0.5), (1, 1), (2, 0.5), (2.5, 1.5), (4, 1), (5, 1), (6, 2)]
    p = None; p, A = frase(M, rng, prog, 8, 2, r, lead80, (64, 84), p, 0.9, 0.45, esc=esc)
    for c in (10, 12, 14): p, _ = frase(M, rng, prog, c, 2, r, lead80, (64, 84), p, 0.9, 0.45, esc=esc)
    for c in (16, 18, 20, 22): p, _ = frase(M, rng, prog, c, 2, r2, lead80, (69, 88), p, 0.9, 0.45, esc=esc)
    repete(M, A, 8, 24, lead80, 0.9, 0.45)
    M.poe(kick(140, 40, 0.8, 1.1), M.t(27, 0)); M.poe(caixa(200, 0.6, 1), M.t(27, 0), 1, 0.8)
    for m in notas_acorde('Am', 4): M.poe(pad(mf(m), 2.5), M.t(27, 0), 1.2, 0.6)
    return M.mestre(sala=1.4)

def arrocha():  # Kelvin do Arrocha — Arrocha do Coração Rebaixado (teclado, guitarra e sax)
    M = Musica(140, 36); prog = ['Em', 'C', 'G', 'D']; rng = np.random.default_rng(66)
    esc = escala('G', lo=62, hi=86)
    for c in range(36):
        nome = prog[(c // 2) % 4]; fim = c == 35
        M.poe(kick(120, 48, 0.35, 0.85), M.t(c, 0))
        if c % 2 == 1: M.poe(kick(120, 48, 0.35, 0.6), M.t(c, 2.5))
        M.poe(caixa(230, 0.16, 0.55), M.t(c, 2), 1, 0.3)
        if fim: break
        for k in range(8): M.poe(ganza(0.5 if k % 2 else 0.3), M.t(c, k / 2))
        if c % 2 == 0:
            for m in notas_acorde(nome, 4): M.poe(orgao(mf(m), 8 * M.tc * 0.98), M.t(c, 0), 0.75, 0.3)
            M.poe(baixo(baixo_raiz(nome), 2.5 * M.tc), M.t(c, 0), 0.8); M.poe(baixo(quinta(nome), 1.2 * M.tc), M.t(c, 3), 0.6); M.poe(baixo(baixo_raiz(nome), 3 * M.tc), M.t(c, 4.5 / 1), 0.7)
        # guitarra dedilhada (arpejo de colcheias)
        arp = notas_acorde(nome, 4); arp = arp + [arp[1] + 12]
        for k in range(8): M.poe(guitarra(mf(arp[[0, 1, 2, 3, 2, 1, 2, 3][k]]), 0.6), M.t(c, k / 2), 0.3, 0.35)
    r = [(0, 2), (2, 1), (3, 1), (4, 3), (7, 1), (8, 2), (10, 1), (11, 1), (12, 4)]
    r2 = [(0, 1), (1, 1), (2, 2), (4, 1), (5, 1), (6, 2), (8, 1.5), (9.5, 0.5), (10, 2), (12, 4)]
    p = None; p, A = frase(M, rng, prog_dobro(prog), 4, 4, r, sopro, (62, 81), p, 0.85, 0.45, esc=esc)
    p, _ = frase(M, rng, prog_dobro(prog), 8, 4, r, sopro, (62, 81), p, 0.85, 0.45, esc=esc)
    for c in (12, 16): p, _ = frase(M, rng, prog_dobro(prog), c, 4, r2, sopro, (67, 86), p, 0.85, 0.45, esc=esc)
    repete(M, A, 4, 20, sopro, 0.85, 0.45)
    for c in (24, 28): p, _ = frase(M, rng, prog_dobro(prog), c, 4, r, sopro, (62, 81), p, 0.85, 0.45, esc=esc)
    M.poe(sopro(mf(64), 2.5), M.t(32, 0), 0.85, 0.5); M.poe(sopro(mf(71), 2.5), M.t(32, 0), 0.5, 0.5)
    for m in notas_acorde('Em', 4): M.poe(orgao(mf(m), 3.0), M.t(34, 0), 0.8, 0.4)
    M.poe(kick(120, 40, 0.8, 1), M.t(35, 0))
    return M.mestre(sala=1.3)
def prog_dobro(p): return [x for x in p for _ in (0, 1)]

def bossa():  # Quarteto Garoa Fina — Bossa da Garoa (violão de nylon, aro, baixo e rhodes)
    M = Musica(128, 32); prog = ['Dmaj7', 'Dmaj7', 'Bm7', 'Bm7', 'Em7', 'Em7', 'A7', 'A7', 'F#m7', 'F#m7', 'B7', 'B7', 'Em7', 'Em7', 'A7', 'A7']
    rng = np.random.default_rng(77); esc = escala('D', lo=66, hi=90)
    batida = [0, 3, 6, 10, 13]  # violão de bossa (2 compassos, em colcheias de semicolcheia)
    aro_b = [0, 3, 6, 10, 12]
    for c in range(32):
        nome = prog[c % 16]; fim = c == 31
        M.poe(baixo(baixo_raiz(nome), 1.4 * M.tc, 0.75), M.t(c, 0)); M.poe(baixo(quinta(nome), 1.4 * M.tc, 0.6), M.t(c, 2))
        if fim: break
        for k in range(8): M.poe(ganza(0.28 if k % 2 else 0.18), M.t(c, k / 2))
        meio = (c % 2) * 16
        for k in batida:
            kk = k - meio
            if 0 <= kk < 16:
                for i, m in enumerate(notas_acorde(nome, 3)[1:] + [notas_acorde(nome, 4)[0]]): M.poe(violao(mf(m), 0.45), M.t(c, kk / 4) + i * 0.006, 0.3, 0.3)
        for k in aro_b:
            kk = k - meio
            if 0 <= kk < 16: M.poe(aro(0.45), M.t(c, kk / 4))
        if c % 2 == 0 and c >= 2:
            for m in notas_acorde(nome, 4): M.poe(rhodes(mf(m), 3.0), M.t(c, 0), 0.55, 0.5)
    r = [(0, 1.5), (1.5, 1), (2.5, 1.5), (4, 1), (5, 1), (6, 2)]
    r2 = [(0, 0.5), (0.5, 1), (1.5, 0.5), (2, 2), (4, 0.5), (4.5, 0.5), (5, 1), (6, 2)]
    p = None; p, A = frase(M, rng, prog, 4, 2, r, flauta, (69, 88), p, 0.7, 0.5, esc=esc)
    for c in (6, 8, 10): p, _ = frase(M, rng, prog, c, 2, r, flauta, (69, 88), p, 0.7, 0.5, esc=esc)
    for c in (12, 14, 16, 18): p, _ = frase(M, rng, prog, c, 2, r2, rhodes, (66, 86), p, 0.9, 0.4, esc=esc)
    repete(M, A, 4, 20, flauta, 0.7, 0.5)
    for c in (22, 24, 26): p, _ = frase(M, rng, prog, c, 2, r, flauta, (69, 88), p, 0.7, 0.5, esc=esc)
    for m in notas_acorde('Dmaj7', 4) + [mf_n for mf_n in []]: M.poe(rhodes(mf(m), 4.0), M.t(30, 0), 0.7, 0.6)
    for i, m in enumerate(notas_acorde('Dmaj7', 3)): M.poe(violao(mf(m), 3.0), M.t(30, 0) + i * 0.03, 0.4, 0.5)
    return M.mestre(alvo_db=-23.0, sala=1.5)

def axe():  # Banda Botijão — Axé do Caminhão do Gás (surdos, agogô, metais e guitarra)
    M = Musica(140, 36); prog = ['D', 'G', 'A', 'D']; rng = np.random.default_rng(88)
    esc = escala('D', lo=66, hi=88)
    for c in range(36):
        nome = prog[c % 4]; fim = c == 35
        M.poe(surdo(0.9), M.t(c, 1)); M.poe(surdo(1.0), M.t(c, 3)); M.poe(surdo(0.5, True), M.t(c, 0)); M.poe(surdo(0.55, True), M.t(c, 2.5))
        M.poe(kick(130, 50, 0.3, 0.7), M.t(c, 0)); M.poe(kick(130, 50, 0.3, 0.6), M.t(c, 2))
        if fim: break
        for k in range(16):
            if k % 2 == 1: M.poe(caixa(320, 0.08, 0.35, 8000), M.t(c, k / 4))
        for (b, alto) in ((0, True), (0.75, False), (1.5, True), (2, False), (2.75, True), (3.5, False)): M.poe(agogo(alto, 0.6), M.t(c, b))
        M.poe(baixo(baixo_raiz(nome), 0.45 * M.tc), M.t(c, 0), 0.9); M.poe(baixo(baixo_raiz(nome), 0.45 * M.tc), M.t(c, 1.5), 0.7)
        M.poe(baixo(quinta(nome), 0.45 * M.tc), M.t(c, 2), 0.75); M.poe(baixo(mf(12 * 4 + acorde(nome)[0]), 0.45 * M.tc), M.t(c, 3.5), 0.6)
        if c >= 2:
            for b in (0.5, 1.5, 2.5, 3.5):
                for i, m in enumerate(notas_acorde(nome, 4)): M.poe(guitarra(mf(m), 0.18), M.t(c, b) + i * 0.007, 0.22, 0.15)
        if c >= 4 and c % 4 == 3 and c < 33:  # metais: "pá-pá-páá" no fim de cada volta
            for (b, d) in ((2, 0.4), (2.5, 0.4), (3, 1.0)):
                for m in notas_acorde(prog[(c + 1) % 4], 4): M.poe(sopro(mf(m), d * M.tc, 0.7, 0.0, 1.6), M.t(c, b), 0.55, 0.3)
    r = [(0, 0.5), (0.5, 0.5), (1, 1), (2, 0.5), (2.5, 0.5), (3, 1), (4, 0.5), (4.5, 0.5), (5, 0.5), (5.5, 0.5), (6, 2)]
    r2 = [(0, 1), (1, 1), (2, 1), (3, 1), (4, 0.5), (4.5, 0.5), (5, 1), (6, 2)]
    p = None; p, A = frase(M, rng, prog, 4, 2, r, lambda f, d: sopro(f, d, 1.0, 0.004, 1.4), (66, 84), p, 0.8, 0.3, esc=esc)
    for c in (6, 8, 10): p, _ = frase(M, rng, prog, c, 2, r, lambda f, d: sopro(f, d, 1.0, 0.004, 1.4), (66, 84), p, 0.8, 0.3, esc=esc)
    for c in (12, 14, 16, 18): p, _ = frase(M, rng, prog, c, 2, r2, guitarra, (69, 88), p, 0.8, 0.3, esc=esc)
    repete(M, A, 4, 20, lambda f, d: sopro(f, d, 1.0, 0.004, 1.4), 0.8)
    for c in (22, 24, 26, 28, 30): p, _ = frase(M, rng, prog, c, 2, r, lambda f, d: sopro(f, d, 1.0, 0.004, 1.4), (66, 84), p, 0.8, 0.3, esc=esc)
    for m in notas_acorde('D', 4): M.poe(sopro(mf(m), 2.2, 0.8, 0.006, 1.6), M.t(34, 0), 0.6, 0.4)
    M.poe(surdo(1.2), M.t(35, 0)); M.poe(kick(130, 40, 0.8, 1.0), M.t(35, 0))
    return M.mestre(sala=0.8)

MUSICAS = {'xote': xote, 'funk': funk, 'moda': moda, 'pagode': pagode, 'neon': neon, 'arrocha': arrocha, 'bossa': bossa}  # o axé saiu da rádio (pedido do dono)

if __name__ == '__main__':
    quais = sys.argv[1:] or list(MUSICAS)
    os.makedirs(os.path.join(AQ, 'previa'), exist_ok=True)
    for nome in quais:
        x = MUSICAS[nome]()
        wav = os.path.join(AQ, 'previa', nome + '.wav')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', wav], input=x.astype(np.float32).tobytes(), check=True)
        out = os.path.join(AUDIO, 'mus_' + nome + '.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '40k', out], check=True)
        if not os.environ.get('PREVIA'): os.remove(wav)
        print('%-8s %.1f s  %d KB  rms %.1f dB  pico %.2f' % (nome, len(x) / SR, os.path.getsize(out) // 1024, 20 * np.log10(np.sqrt((x ** 2).mean())), np.abs(x).max()))
