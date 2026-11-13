#!/usr/bin/env python3
# Prepara a narração e as legendas do vídeo de anúncio (YouTube).
#   voz/gXX.mp3  (falas geradas no ElevenLabs, projeto "BR Night Drive - Anúncio YouTube (narração)", voz Jonas)
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
 'g01': 'Eu tô criando um GTA brasileiro. Só que não é no Rio, nem em São Paulo... é no Espírito Santo!',
 'g02': 'Mundo aberto, de madrugada, com buraco na pista, moqueca e muita resenha capixaba. O nome é BR Night Drive, e hoje eu vou te mostrar tudo o que já tá pronto.',
 'g03': 'A cidade se chama São Gambiarra. É inventada, mas quem é daqui vai sacar os nomes dos bairros: Centrão, Vila Sem Pressa, Feio Rosa, Jardim Cara-Pintada...',
 'g04': 'Tem a BR-101 e Pouco pra pisar fundo, a Terceira Ponte e Meia, a orla de Camburiso, o morro com viela e pagode na laje... e lá longe, a Fazenda Muuuito Longe.',
 'g05': 'Eu quis que tudo tivesse a nossa cara. Chuva que alaga a rua, lombada que raspa o rebaixado...',
 'g06': '...e pardal na avenida. Passou de oitenta? Flash, multa na hora. Igualzinho a vida real.',
 'g07': 'O seu ganha-pão é o celular: um Pera 15 Pro, operadora Moqueca Tel. Tem mapa, WhatsApp, app de corrida, fretes, racha e até banco.',
 'g08': 'Esse é o PegaAí, o nosso app de corrida. Fica online, aceita a corrida e vai buscar o passageiro.',
 'g09': 'Só que aqui cada batida conta. O passageiro reclama, a nota despenca... e o cara ainda manda áudio.',
 'g10': 'Pois é... até pra reclamar, o capixaba defende a moqueca!',
 'g11': 'Não quer passageiro? Pega entrega de moqueca, faz frete de caminhão... e o caminhão do gás vem com a musiquinha, claro.',
 'g12': 'E tem personagem. Esse é o Seu Zé, da oficina. Bateu? Ele conserta... e se faltar dinheiro, faz fiado. Uma vez só.',
 'g13': 'Esse é o Seu Biu, o caminhoneiro das bananas. Quando a carreta tomba, ele manda áudio no zap.',
 'g14': 'Aí é com você: vai até a BR, recolhe as caixas e ganha por cada uma.',
 'g15': 'Tem também o Banestresse, o banco que estressa. Atrasou a parcela? Os juros trabalham por você.',
 'g16': 'E do nada pinta evento na tela: noivo atrasado pro casamento, blitz da Lei Seca, arraiá fechando a rua, carro pedindo chupeta...',
 'g17': 'Depois das dez da noite, o Zé do Canecão chama pro racha. {Três... dois... um... VAI!}',
 'g18': 'Com o dinheiro, você monta o carro do seu jeito: pintura, roda, neon, rebaixado, aerofólio... e o paredão, que bota a rua inteira pra dançar.',
 'g19': 'O jogo ainda tá em desenvolvimento, e eu quero saber de você: o que não pode faltar num GTA capixaba? Comenta aí!',
 'g20': 'Se inscreve pra acompanhar tudo. BR Night Drive: em breve para Windows. Valeu, rapaziada!',
}
# vozes do próprio jogo que tocam na gameplay (arquivo em audio/, quem fala, texto do jogo)
JOGO = {
 'p_moqueca': ('Marcão', 'Rapá, tu pegou todo buraco de São Gambiarra. Minha moqueca chegou virada dentro da panela de barro. Moqueca é capixaba, o resto é peixada, mas a minha virou sopa!'),
 'biu_socorro': ('Seu Biu', 'Ô meu patrão, a carreta tombou! Tá banana pra todo lado, parece feira depois de terremoto! Me ajuda aqui, pelo amor de Deus, que eu pago cada caixa!'),
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
for k in ('g03', 'g04', 'g07', 'g16', 'g17'): print(k, saida[k]['dur'], [(l['t0'], l['txt']) for l in saida[k]['leg']])
