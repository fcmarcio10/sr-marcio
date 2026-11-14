#!/usr/bin/env python3
# Prepara a narração do vídeo do YouTube "Estou criando um jogo de carro que se passa no Brasil".
#   voz/gXX.mp3  (falas geradas no ElevenLabs, projeto "BR Night Drive - YouTube Estou criando um jogo de carro (narração)", voz Jonas)
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
 'g01': 'Eu tô criando um jogo de carro que se passa no Brasil. De madrugada. Numa cidade onde o buraco tem nome, o cliente manda áudio reclamando... e o mecânico vende fiado.',
 'g02': 'O nome é BR Night Drive. É um jogo de mundo aberto, independente, feito do zero. E hoje eu vou te mostrar tudo o que ele já tem. Bora?',
 'g03': 'A cidade se chama São Gambiarra. É inventada e cheia de trocadilho. Tem avenida, BR, praia, morro, ponte... e uma fazenda lá longe.',
 'g04': 'Eu quis que dirigir fosse gostoso. O carro derrapa, faz drift, sente o peso. E a cidade reage: tem trânsito, pedestre atravessando e lombada em todo canto.',
 'g05': 'Quando chove, aí complica. A pista fica molhada, as poças espirram água e o carro escorrega de verdade. Freia antes, que aqui não tem milagre.',
 'g06': 'Lombada com carro rebaixado? Raspa. Faísca pra todo lado. E cada batida amassa o carro no lugar exato onde você bateu.',
 'g07': 'Mas rodar à toa não paga as contas. O seu ganha-pão tá no celular. Esse aqui é o PegaAí, o nosso aplicativo de corrida.',
 'g08': 'Você fica online, aceita a corrida, busca o passageiro e leva até o destino. Simples, né? Só que cada passageiro tem a sua personalidade.',
 'g09': 'Bateu o carro? Demorou demais? O cliente reclama na hora. E não é só texto não... ele manda áudio!',
 'g10': 'E tem gente de todo canto do Brasil. Olha esse mineiro:',
 'g11': 'E a gaúcha também não perdoou:',
 'g12': 'No fim, vem a avaliação. Cinco estrelas dá gorjeta. Uma estrela... dá vergonha. E ainda tem corrida pro aeroporto com hora marcada, cliente VIP que reclama de tudo e mudança com a geladeira na caçamba.',
 'g13': 'Não curte passageiro? Tem o app de fretes. Entrega de baú, guincho rebocando carro quebrado...',
 'g14': 'E, claro, o caminhão do gás. Com a musiquinha, do jeitinho que você conhece. Botijão de casa em casa, contra o relógio.',
 'g15': 'E a madrugada de São Gambiarra é imprevisível. A qualquer momento, acontece alguma coisa na cidade.',
 'g16': 'Esse é o Seu Biu, o caminhoneiro das bananas. Quando a carreta tomba, ele pede socorro no zap.',
 'g17': 'Aí você vai até lá, recolhe as caixas e ganha por cada uma. Só cuidado com as cascas, que escorrega. Sério... escorrega MESMO.',
 'g18': 'Tem carro quebrado no meio da rua precisando de uma chupeta, noivo atrasado pro próprio casamento, caroneiro na BR... Cada noite é uma história diferente.',
 'g19': 'E se você seguir a estrada até o fim, chega na Fazenda Muuuito Longe. Lá tem entrega na roça, estrada de terra... e o Rali da Vaca Atolada.',
 'g20': 'É um rali na lama, com vaca no meio do caminho. Quem atola, perde. Simples assim.',
 'g21': 'Agora, se você gosta de velocidade... tem racha. Arrancada na BR contra o Zé do Canecão, com aposta em dinheiro.',
 'g22': 'E tem percurso cronometrado pela cidade: passa pelas bandeiras, bate o tempo e leva a medalha de ouro.',
 'g23': 'Com o dinheiro, você vai pra garagem. Os carros são todos de zoeira, inspirados nos clássicos brasileiros: o Gou Quadrado, o Fuska, o Opalha, a Kombo, o Escorte...',
 'g24': 'E dá pra deixar do seu jeito: pintura, rodas, rebaixado, aerofólio, insulfilm, neon embaixo do carro... e paredão no porta-malas, que faz o povo dançar na calçada.',
 'g25': 'Mas o carro também cansa. O pneu gasta, o óleo acaba, a bateria arria se você esquecer o farol ligado... e a lataria vai amassando, batida por batida.',
 'g26': 'Pra isso tem a oficina do Seu Zé. Ele conserta, troca o óleo, faz tudo... e se faltar dinheiro, vende fiado. Mas olha o que acontece quando você demora pra pagar:',
 'g27': 'E se apertar mesmo, tem o banco Banestresse, com empréstimo aprovado na hora. Os juros? Ah, os juros a gente não comenta.',
 'g28': 'E pra não rodar no silêncio, tem a Rádio Gambiarra FM, cento e setenta e um vírgula um. O DJ Biruta fica no ar a noite inteira.',
 'g29': 'Ele dá previsão do tempo, zoa time de futebol, atende ouvinte... É a companhia da madrugada. E se cansar, é só desligar.',
 'g30': 'O celular é a central de tudo: o zap com os personagens, o PegaAí, os fretes, o mapa da cidade, o banco... e até papel de parede dá pra trocar.',
 'g31': 'E tudo que você faz conta. Você sobe de nível como motorista, libera corridas melhores e ganha conquistas... algumas bem engraçadas.',
 'g32': 'E isso é só o começo. Eu continuo trabalhando todo dia: deixando o jogo mais leve e mais bonito, colocando eventos novos na madrugada, mais carros, mais lugares e mais confusão pra você resolver.',
 'g33': 'BR Night Drive vai sair para Windows. Em breve.',
 'g34': 'E agora eu quero saber de você: que evento maluco deveria acontecer na madrugada de São Gambiarra? Comenta aí, que eu leio tudo... e a melhor ideia pode entrar no jogo!',
 'g35': 'Se curtiu, se inscreve no canal e ativa o sininho pra acompanhar o jogo. E manda esse vídeo pra aquele amigo que é apaixonado por carro. Valeu, e até a próxima! Vai com Deus... e devagar!',
}
# vozes do próprio jogo que tocam no vídeo (arquivo em audio/, quem fala, texto do jogo)
JOGO = {
 'xingo2': ('Passageira', 'Moço, eu pedi um carro, não um carrinho de bate-bate! Meu café tá todinho na minha blusa! Vou te denunciar pro PegaAí, viu!'),
 'p_uai': ('Passageiro mineiro', 'Uai, sô! Cê bateu esse trem três vezes e ainda quer cinco estrelas? Nem minha vó dirige assim, uai! Uma estrela, e olhe lá!'),
 'p_bah': ('Passageira gaúcha', 'Bah, tchê! Que barbaridade de corrida! Quase derramei o chimarrão inteiro no colo. Uma estrela pra ti, e olhe lá!'),
 'mudanca': ('Cliente da mudança', 'Minha geladeira chegou parecendo uma sanfona! Minha sogra vai me matar... e depois eu te mato! Brincadeira. Ou não.'),
 'ze_fiado': ('Seu Zé', 'Ô meu filho, cadê o meu dinheiro? A caderneta já tá com cheiro de mofo! Paga o fiado aí que eu sou amigo, mas não sou de ferro, bicho!'),
 'radio_03': ('DJ Biruta', 'Plantão do futebol! O Vasco ligou aqui pra rádio querendo ser vice também no nosso concurso de piadas. Calma, torcedor vascaíno, é brincadeira! Vice também sobe no pódio... ali do ladinho.'),
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
