#!/usr/bin/env python3
# Prepara a narração do vídeo do YouTube "Novidades do BR Night Drive" (atualização de nov/2026).
#   voz/gXX.mp3  (falas geradas no ElevenLabs, projeto "BR Night Drive - YouTube Atualização (narração)", voz Jonas)
#   -> narra/final/gXX.wav (sem silêncio nas pontas, 5% mais rápida, volume igualado)
#   -> narra/falas.json: duração de cada fala e os pedaços de legenda com o tempo de cada um
# Também prepara as vozes do jogo que aparecem na gameplay (audio/*.mp3), para a legenda delas.
import json, os, re, subprocess
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
N = os.path.join(AQUI, 'narra'); F = os.path.join(N, 'final'); os.makedirs(F, exist_ok=True); VOZ = os.path.join(AQUI, 'voz')
SR = 48000
TEMPO = 1.05

TEXTO = {
 'g01': 'Saiu atualização do BR Night Drive! E dessa vez São Gambiarra ganhou voz, som, buraco... e muito mais confusão. Bora ver tudo?',
 'g02': 'Primeiro: a cidade agora tem som de verdade. No centro, aquele trânsito lá longe. Na roça, grilo e sapo... e a vaca só muge se tiver vaca de verdade por perto. Nada de mugido fantasma.',
 'g03': 'E os pedestres agora falam! Passou raspando? Ele reclama. Buzinou? Ele responde. Subiu na calçada? Aí é melhor nem ouvir.',
 'g04': 'E se você passar do ponto... bom. O seguro não cobre. E a roda que pisou na mancha ainda marca o asfalto. Realismo, meu amigo. Não tente isso em casa.',
 'g05': 'Falando em realismo: agora tem buraco. Muito buraco. Afinal, é uma cidade brasileira, né? A roda caiu, o carro treme. E tiramos uns cones das obras... porque ninguém conserta mesmo.',
 'g06': 'As casas ganharam a cara do Brasil: caixa d\'água azul, tanque na laje, cadeira de plástico pro churrasco... e pneu velho segurando a telha. Clássico.',
 'g07': 'A noite ficou mais escura e com mais clima. E o jogo agora segura os sessenta quadros por segundo sozinho, ajustando a imagem sem você nem perceber.',
 'g08': 'E na Rádio Gambiarra FM, o DJ Biruta agora toca música! Sete músicas feitas só pro jogo: xote, pagode, arrocha, batidão... e bossa nova quando chove.',
 'g09': 'E a rádio agora começa desligada, pra não te pegar de surpresa. Quer ouvir? É só apertar F.',
 'g10': 'No celular, o app de Fretes ganhou chat. O cliente escreve quando você aceita... e na entrega ele agradece. Às vezes até por áudio:',
 'g11': 'E no PegaAí acabou a farra: você responde o passageiro uma vez só. Nada de mandar "tô chegando" quinze vezes seguidas.',
 'g12': 'No carro, o barro agora marca só a roda que passou na terra. A derrapagem ganhou som novo, cantando pneu de verdade. E poste derrubado fica no chão, embaixo do carro, como manda a física.',
 'g13': 'E o barulho de carro passando ficou mais suave. Agora ele só aparece quando você tá voando, acima de oitenta e cinco.',
 'g14': 'Gostou? Então comenta aqui embaixo qual vai ser a próxima maluquice de São Gambiarra. Se inscreve, ativa o sininho... e até a próxima atualização! Vai com Deus... e cuidado com o buraco!',
}
# vozes do próprio jogo que tocam no vídeo (arquivo em audio/, quem fala, texto do jogo)
JOGO = {
 'ped_1': ('Pedestre', 'Ô, maluco! Olha por onde anda!'),
 'ped_7': ('Pedestre', 'Buzina pra tua avó, rapá!'),
 'ped_5': ('Pedestre', 'Sai da calçada, doido! Calçada é de gente!'),
 'dj_m1': ('DJ Biruta', 'E agora, pra arrastar o pé no asfalto: Trio Pé de Pano, com Xote do Pneu Furado! Segura o forró, motorista!'),
 'fr_ok1': ('Cliente do gás', 'Chegou o gás! Graças a Deus, que o feijão tava pela metade. Valeu demais, parceiro! Cinco estrelas!'),
}

def ler(path, filtros=''):
    cmd = ['ffmpeg', '-loglevel', 'error', '-i', path] + (['-af', filtros] if filtros else []) + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()
def grava(path, x):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', path], input=x.astype(np.float32).tobytes(), check=True)
def sil(n):  # vogais = sílabas (aproximação boa para o português)
    return max(1, len(re.findall(r'[aeiouáéíóúâêôãõà]+', n.lower())))
def pedacos(texto, maxc=46):
    # quebra nas pontuações e junta até ~46 letras por legenda; {trecho} nunca é quebrado
    prot = re.findall(r'\{([^}]*)\}', texto)
    for k, t in enumerate(prot): texto = texto.replace('{' + t + '}', '\x00%d\x00' % k)
    partes = [p.strip() for p in re.split(r'(?<=[.!?:…])\s+|(?<=\.\.\.)\s+|(?<=,)\s+', texto) if p.strip()]
    partes = [re.sub(r'\x00(\d+)\x00', lambda m: prot[int(m.group(1))], p) for p in partes]
    out = []
    for p in partes:
        if out and len(out[-1]) + 1 + len(p) <= maxc and not re.search(r'[.!?]$', out[-1]): out[-1] += ' ' + p
        else: out.append(p)
    # pedaço grande demais: quebra nas palavras
    res = []
    for p in out:
        while len(p) > maxc + 12:
            k = p.rfind(' ', 0, maxc); res.append(p[:k]); p = p[k + 1:]
        res.append(p)
    return res
def tempos(x, txt):
    # cada legenda ocupa o tempo DE FALA (sem contar as pausas) proporcional às sílabas;
    # a troca de legenda "gruda" na pausa mais próxima
    hop = int(0.01 * SR); en = np.array([np.sqrt((x[i:i + hop * 2] ** 2).mean()) for i in range(0, len(x) - hop * 2, hop)])
    voz = en > max(en.max() * 0.05, 0.004)
    pausas = []; i = 0
    while i < len(voz):
        if not voz[i]:
            j = i
            while j < len(voz) and not voz[j]: j += 1
            if (j - i) * 0.01 >= 0.12 and i > 0 and j < len(voz): pausas.append((i * 0.01, j * 0.01))
            i = j
        else: i += 1
    cum = np.cumsum(voz) * 0.01; falado = cum[-1]
    def real(tv):  # tempo de fala -> tempo real
        k = int(np.searchsorted(cum, tv)); return min(k * 0.01, len(x) / SR)
    dur = len(x) / SR; ps = pedacos(txt); sl = [sil(p) for p in ps]; tot = sum(sl)
    marcas = [0.0]; acc = 0
    for s_ in sl[:-1]:
        acc += s_; alvo = real(acc / tot * falado)
        # a pausa mais perto: a troca acontece no começo da próxima fala (fim da pausa)
        cand = [b for a, b in pausas if abs(b - alvo) < 0.7 or abs(a - alvo) < 0.7]
        t = min(cand, key=lambda b: abs(b - alvo)) if cand else alvo
        marcas.append(t if t > marcas[-1] + 0.3 else max(alvo, marcas[-1] + 0.3))
    marcas.append(dur)
    return [{'t0': round(marcas[k], 2), 't1': round(marcas[k + 1], 2), 'txt': ps[k]} for k in range(len(ps))]
# acertos feitos de ouvido/olho (início da legenda, em segundos dentro da fala)
AJUSTE = {}

saida = {}
for g, txt in TEXTO.items():
    x = ler(os.path.join(VOZ, g + '.mp3'),
            'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.12,areverse,atempo=%.3f' % TEMPO)
    x = x / max(1e-6, np.sqrt((x ** 2).mean())) * 0.08  # volume igual entre as falas (o mix acerta o resto)
    x = np.clip(x, -0.98, 0.98)
    grava(os.path.join(F, g + '.wav'), x)
    L = tempos(x, txt)
    for k, t0 in AJUSTE.get(g, {}).items(): L[k]['t0'] = t0; L[k - 1]['t1'] = t0
    saida[g] = {'dur': round(len(x) / SR, 3), 'quem': '', 'leg': L}
for k, (quem, txt) in JOGO.items():
    x = ler(os.path.join(RAIZ, 'audio', k + '.mp3'))
    saida[k] = {'dur': round(len(x) / SR, 3), 'quem': quem, 'leg': tempos(x, txt)}
json.dump(saida, open(os.path.join(N, 'falas.json'), 'w'), ensure_ascii=False, indent=1)
tot = sum(v['dur'] for k, v in saida.items() if k.startswith('g'))
print('narração: %d falas, %.1f s no total' % (len([k for k in saida if k.startswith('g')]), tot))
print(' '.join('%s %.2f' % (k, v['dur']) for k, v in saida.items()))
