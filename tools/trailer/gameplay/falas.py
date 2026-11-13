#!/usr/bin/env python3
# Prepara a narração e as legendas da gameplay.
#   narra/gXXa.mp3 / gXXb.mp3  (as 2 versões geradas no ElevenLabs; narra/escolha.json diz qual usar)
#   -> narra/final/gXX.wav (sem silêncio nas pontas, 5% mais rápida, volume igualado)
#   -> narra/falas.json: duração de cada fala e os pedaços de legenda com o tempo de cada um
# Também prepara as vozes do jogo que aparecem na gameplay (audio/*.mp3), para a legenda delas.
import json, os, re, subprocess
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
N = os.path.join(AQUI, 'narra'); F = os.path.join(N, 'final'); os.makedirs(F, exist_ok=True)
SR = 48000
TEMPO = 1.05

TEXTO = {
 'g01': 'Qual foi, rapaziada! Hoje eu trouxe um jogo de mundo aberto que é a cara do Espírito Santo. É madrugada, tem buraco na pista, passageiro reclamando... e eu tô amarradão.',
 'g02': 'Bem-vindos a São Gambiarra. A cidade é inventada, mas repara nos nomes dos bairros: Centrão, Vila Sem Pressa, Feio Rosa, Jardim Cara-Pintada... Quem é capixaba já pegou a zoeira.',
 'g03': 'Tem a BR-101 e Pouco pra pisar fundo, ponte, porto, a orla de Camburiso... e o morro, com viela, pagode e churrasquinho na laje.',
 'g04': 'E quando chove? Papo reto: a rua vira lava-jato. O povo sai de guarda-chuva e cada poça é um banho de graça.',
 'g05': 'Na tela você tem o GPS, o velocímetro, o dinheiro e o seu nível de motorista. E o carro gasta pneu, óleo, bateria... e amassa de verdade quando bate.',
 'g06': 'Sai do meio, irmão!',
 'g07': 'Ih... derrubei o poste. A rua ficou no escuro, e o jogo ainda me zoa: a prefeitura agradece.',
 'g08': 'E fica esperto com o pardal: passou de oitenta na avenida... flash, e multa na hora.',
 'g09': 'Esse aqui é o celular do motorista. Um Pera 15 Pro, operadora Moqueca Tel 5G. Tá de caô? Tem mapa, WhatsApp, app de corrida, fretes, racha, carteira e conquistas.',
 'g10': 'No mapa é só tocar num lugar que o GPS traça a rota na hora.',
 'g11': 'Agora o trampo principal: o PegaAí. Fica online e não demora a pingar corrida. Olha o passageiro já mandando mensagem: "pode buzinar que eu desço". Clássico!',
 'g12': 'É só seguir o GPS, parar do lado e o passageiro entra. E já chega pedindo pagodinho no rádio, rapaz!',
 'g13': 'Só que o motorista aqui dirige... digamos, com emoção. Cada batida, o passageiro reclama, e a nota vai lá pro chão.',
 'g14': 'Chegou! Duas estrelas, dinheiro na conta... e ainda subi de nível: "Barbeiro em recuperação". Até o jogo tá me zoando!',
 'g15': 'Opa, chegou áudio do passageiro. Bora ouvir...',
 'g16': '"Moqueca é capixaba, o resto é peixada." Meu parceiro, até pra xingar o cara defende a moqueca!',
 'g17': 'Subindo de nível, libera corrida de aeroporto, de mudança, que quebra a geladeira se você bater... e o cliente VIP, aquele que quer o ar no 21. Nem 20, nem 22.',
 'g18': 'Quer um trampo sem passageiro reclamando? Para na frente de um comércio com marcador amarelo, aperta E e pega uma entrega. Moqueca capixaba, quentinha. Chegou no prazo, ganha bônus. É dentro!',
 'g19': 'Com caminhão, abre o app Fretes: cimento, mudança, botijão de gás, combustível pro posto, entulho e até reboque.',
 'g20': 'E o caminhão do gás vem com a musiquinha, claro. Se não tocar a musiquinha, nem é gás... é golpe.',
 'g21': 'Bateu? Oficina do Seu Zé. Ele olha o carro por cima dos óculos e já manda: "beijou o poste, foi?". E se faltar dinheiro, ele faz fiado... uma vez só.',
 'g22': 'No posto você abastece, lava o carro e ainda toma um cafezinho de 4 reais na conveniência. Isso que é vida.',
 'g23': 'Apertou? Tem o Banestresse, o banco que estressa: empréstimo em até 8 vezes. Atrasou a parcela? Os juros já tão trabalhando por você.',
 'g24': 'E a cidade não para. Do nada pinta convite na tela: noivo atrasado pro casamento! Aceita, pega o rapaz e voa pra igreja, que a noiva tá esperando.',
 'g25': 'Aí chega mensagem do Seu Biu, das bananas...',
 'g26': 'A carreta tombou na BR! Cada caixa que você recolhe é dinheiro no bolso. Só cuidado com a casca, que escorrega.',
 'g27': 'Tem blitz da Lei Seca também: para do lado do guarda, sopra o bafômetro... zero vírgula zero zero. Motorista exemplar, e ainda ganha bônus do seguro.',
 'g28': 'Arraiá fechando a rua, carro quebrado pedindo chupeta, gente pedindo carona no acostamento... É evento pra todo lado.',
 'g29': 'Depois das dez da noite, o Zé do Canecão chama pro racha. Aposta na hora, quem ganhar leva o dobro. {Três... dois... um... VAI!}',
 'g30': 'E pra quem gosta de desafio tem percurso cronometrado valendo medalha, e vaga pra estacionar. Baliza de ré vale mais!',
 'g31': 'E o dinheiro vai pra onde? Pra garagem! Fuska, Kombo, Santanão, Opalha... e dá pra mexer em tudo: pintura, roda, neon, rebaixado e aerofólio.',
 'g32': 'E o mais importante: o paredão. Liga o som e a rua inteira sai pra dançar. O vizinho que lute.',
 'g33': 'É isso, rapaziada. Corrida, frete, Seu Zé, Seu Biu, racha, buraco e muita resenha. Os cria tão como? Então bora rodar em São Gambiarra!',
 'g34': 'BR Night Drive. Rapaz... isso aqui tá de sacanagem!',
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
AJUSTE = {'g29': {3: 5.85}}

esc = json.load(open(os.path.join(N, 'escolha.json')))
saida = {}
for g, txt in TEXTO.items():
    x = ler(os.path.join(N, g + esc[g] + '.mp3'),
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
for k in ('g02', 'g16', 'p_moqueca'): print(k, saida[k]['dur'], [(l['t0'], l['txt']) for l in saida[k]['leg']])
