/* Simulação do conteúdo transmitido/gravado: cada jogo gera momentos (gol, abate, susto...) que o chat comenta.
   k = { skill 0-1, perf 0-1.15, risky, focus, char (carisma 0-100) } */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const S = SL.GameSim = {};
  // momento: tipo, texto, intensidade 0-1, engraçado 0-1, bom?, texto de memória
  const M = (type, txt, int, o) => Object.assign({ type, txt, int, funny: 0, good: null, mt: null }, o || {});
  const TEAMS = ['Unidos da Várzea', 'Real Pastel', 'Atlético Chinelo', 'Esporte Clube Farofa', 'Grêmio da Esquina', 'Sport Bate-Bola', 'Ferroviário do Bairro', 'Cruzeiro do Sul FC', 'Mutantes FC', 'Botafogo do Morro'];
  const OPP = ['Rival_Pro', 'xX_Sniper_Xx', 'Zé_Cabeçada', 'MiraLaser', 'Dona_Treta', 'Capivara_Furiosa', 'ReiDoCombo', 'Tio_Bruto'];

  const sims = S.sims = {};
  sims.futebol = {
    init: s => { s.a = 0; s.b = 0; s.min = 0; s.teamA = U.pick(TEAMS); s.teamB = U.pick(TEAMS.filter(t => t !== s.teamA)); s.w = s.w || 0; s.l = s.l || 0; s.d = s.d || 0; },
    status: s => `${s.teamA} ${s.a} x ${s.b} ${s.teamB} · ${Math.min(90, s.min)}'`,
    answer: s => `${s.a}x${s.b}, ${Math.min(90, s.min)} minutos`,
    step: (s, k, out) => {
      if (s.min >= 90) {
        if (s.a > s.b) { s.w++; out.push(M('fim_vit', `Fim de jogo: vitória por ${s.a}x${s.b}`, 0.65, { good: true, mt: `você ganhou de ${s.a}x${s.b} do ${s.teamB}` })); }
        else if (s.a < s.b) { s.l++; out.push(M('fim_der', `Fim de jogo: derrota por ${s.a}x${s.b}`, 0.45, { good: false })); }
        else { s.d++; out.push(M('fim_emp', `Fim de jogo: empate em ${s.a}x${s.b}`, 0.3)); }
        sims.futebol.init(s); out.push(M('inicio', `Começa a partida: ${s.teamA} contra ${s.teamB}`, 0.15)); return;
      }
      s.min += U.ri(6, 11);
      const pa = 0.33 + k.skill * 0.15 + (k.risky ? 0.1 : 0) + (k.focus ? 0.05 : 0);
      if (U.chance(pa)) {
        if (U.chance(0.5)) out.push(M('chance', 'Contra-ataque perigoso!', 0.3));
        const pg = 0.22 + k.skill * 0.2 + (k.risky ? 0.08 : 0) - (1 - k.perf) * 0.12;
        if (U.chance(pg)) {
          s.a++;
          if (U.chance(0.12 + (k.risky ? 0.1 : 0))) out.push(M('golaco', `GOLAÇO de bicicleta! ${s.a}x${s.b}`, 0.95, { good: true, big: true, mt: 'você fez aquele golaço de bicicleta no FIFA' }));
          else out.push(M('gol', U.pick(['Gol de cabeça', 'Gol de fora da área', 'Gol de contra-ataque', 'Gol de pênalti', 'Gol de falta']) + `! ${s.a}x${s.b}`, 0.7, { good: true }));
        } else if (U.chance(0.55)) {
          const absurd = U.chance(0.16);
          out.push(M('perdeu', absurd ? 'Perdeu um gol sem goleiro!' : 'Chute pra fora, por pouco', absurd ? 0.7 : 0.42, { funny: absurd ? 0.85 : 0.3, good: false, mt: absurd ? 'você perdeu aquele gol sem goleiro' : null }));
        } else out.push(M('defesa', 'O goleiro adversário defende', 0.38, { good: false }));
      }
      const pb = 0.27 - k.skill * 0.12 - (k.focus ? 0.04 : 0) + (k.risky ? 0.05 : 0);
      if (U.chance(pb)) {
        if (U.chance(0.36 - k.skill * 0.14)) {
          s.b++;
          if (U.chance(0.13)) out.push(M('frango', `Frango do goleiro! ${s.a}x${s.b}`, 0.72, { funny: 0.9, good: false, mt: 'seu goleiro tomou aquele frango histórico' }));
          else out.push(M('gol_sofrido', `Gol do adversário: ${s.a}x${s.b}`, 0.55, { good: false }));
        } else out.push(M('defesa', 'Seu goleiro faz uma defesaça!', 0.45, { good: true }));
      }
      if (U.chance(0.05)) out.push(M('cartao', 'Cartão amarelo por carrinho', 0.25));
      if (U.chance(0.012)) out.push(M('bug', 'O jogador atravessou a trave (bug)', 0.6, { funny: 0.9, mt: 'o jogador atravessou a trave no FIFA' }));
    },
  };

  sims.br = {
    init: s => { s.phase = 'pouso'; s.alive = 100; s.kills = 0; s.wins = s.wins || 0; s.matches = (s.matches || 0) + 1; s.best = s.best || 100; s.t = 0; },
    status: s => s.phase === 'fim' ? `Partida encerrada · ${s.kills} abates` : `${s.alive} vivos · ${s.kills} abates · ${({ pouso: 'Pulando', loot: 'Saqueando', combate: 'Em combate' })[s.phase] || ''}`,
    answer: s => `${s.kills} abates, ${s.alive} vivos`,
    step: (s, k, out) => {
      s.t++;
      if (s.phase === 'fim') { sims.br.init(s); out.push(M('pouso', 'Nova partida: pulando do avião', 0.2)); return; }
      s.alive = Math.max(1, s.alive - U.ri(s.alive > 40 ? 6 : 2, s.alive > 40 ? 12 : 5));
      if (s.phase === 'pouso') { s.phase = 'loot'; return; }
      if (s.phase === 'loot') { if (U.chance(0.35)) out.push(M('loot', 'Achou arma lendária', 0.3, { good: true })); if (s.t > U.ri(2, 4)) s.phase = 'combate'; return; }
      if (U.chance(0.12)) out.push(M('zona', 'A zona está fechando', 0.25));
      if (s.alive <= 10 && !s.top10) { s.top10 = 1; out.push(M('top10', 'Entrou no top 10', 0.5)); }
      if (U.chance(0.48)) {
        const pw = 0.42 + k.skill * 0.33 - (1 - k.perf) * 0.2 - (s.alive < 10 ? 0.08 : 0) + (k.focus ? 0.05 : 0) + (k.risky ? U.rf(-0.15, 0.15) : 0);
        if (U.chance(pw)) {
          const n = U.chance(0.15 + (k.risky ? 0.1 : 0)) ? 3 : U.chance(0.3) ? 2 : 1;
          s.kills += n; s.alive = Math.max(1, s.alive - n);
          if (s.alive <= 3 && U.chance(0.5)) out.push(M('clutch', `Clutch! Venceu um contra três`, 0.9, { good: true, big: true, mt: 'você fez aquele clutch de um contra três no Fortnite' }));
          else if (n >= 3) out.push(M('multikill', `Abate triplo!`, 0.85, { good: true, big: true, mt: 'você fez aquele abate triplo no Fortnite' }));
          else out.push(M('kill', n === 2 ? U.pick(['Abate duplo na ponte', 'Abate duplo no telhado']) : U.pick(['Derrubou ', 'Mandou pro lobby: ', 'Headshot em ']) + U.pick(OPP), 0.5, { good: true }));
        } else {
          s.phase = 'fim'; s.best = Math.min(s.best, s.alive);
          if (U.chance(0.12)) out.push(M('morte_boba', 'Caiu do prédio sozinho', 0.7, { funny: 0.92, good: false, mt: 'você caiu do prédio sozinho no Fortnite' }));
          else out.push(M('morte', `Eliminado em ${s.alive}º lugar`, s.alive < 10 ? 0.55 : 0.4, { good: false }));
          return;
        }
      }
      if (s.alive <= 1) { s.wins++; s.phase = 'fim'; out.push(M('vitoria', `VITÓRIA! ${s.kills} abates`, 1, { good: true, big: true, mt: `você ganhou aquela partida com ${s.kills} abates` })); }
      if (U.chance(0.008)) out.push(M('bug', 'O carro saiu voando pelo mapa (bug)', 0.6, { funny: 0.9 }));
    },
  };

  sims.terror = {
    init: s => { s.ch = s.ch || 1; s.prog = s.prog || 0; s.deaths = s.deaths || 0; },
    status: s => `Capítulo ${s.ch} de 6 · ${Math.round(s.prog)}%`,
    answer: s => `capítulo ${s.ch}`,
    step: (s, k, out) => {
      s.prog += U.rf(3, 7) * (0.7 + k.skill * 0.5);
      if (U.chance(0.15)) out.push(M('jumpscare', 'SUSTO! Algo pulou na tela', 0.78, { funny: 0.75, big: U.chance(0.3), mt: 'você deu aquele grito com o susto do Resident Evil' }));
      else if (U.chance(0.1)) out.push(M('susto_falso', 'Era só um gato derrubando um vaso', 0.35, { funny: 0.5 }));
      if (U.chance(0.08)) {
        if (U.chance(0.55 + k.skill * 0.3)) out.push(M('perseguicao', 'Fugiu da criatura por um triz', 0.65, { good: true }));
        else { s.deaths++; s.prog = Math.max(0, s.prog - 15); out.push(M('morte', 'Pego pela criatura', 0.55, { funny: 0.45, good: false })); }
      }
      if (U.chance(0.1)) { s.prog += 8; out.push(M('puzzle', 'Resolveu o enigma da porta', 0.35, { good: true })); }
      if (s.prog >= 100) {
        if (s.ch >= 6) { out.push(M('vitoria', 'ZEROU o Resident Evil!', 1, { good: true, big: true, mt: 'você zerou o Resident Evil ao vivo' })); s.ch = 1; s.prog = 0; }
        else { s.ch++; s.prog = 0; out.push(M('capitulo', `Capítulo ${s.ch} começou`, 0.45, { good: true })); }
      }
    },
  };

  sims.corrida = {
    init: s => { s.pos = U.ri(6, 12); s.lap = 1; s.laps = 3; s.t = 0; s.wins = s.wins || 0; },
    status: s => `${s.pos}º de 12 · volta ${s.lap}/${s.laps}`,
    answer: s => `${s.pos}º lugar`,
    step: (s, k, out) => {
      s.t++;
      if (U.chance(0.32 + k.skill * 0.3 + (k.risky ? 0.12 : 0)) && s.pos > 1) { s.pos--; out.push(M('ultrapassagem', s.pos === 1 ? 'Assumiu a liderança!' : `Ultrapassou, agora em ${s.pos}º`, s.pos === 1 ? 0.7 : 0.4, { good: true })); }
      if (U.chance(0.1 - k.skill * 0.06 + (k.risky ? 0.08 : 0))) { s.pos = Math.min(12, s.pos + 2); out.push(M('batida', 'Bateu no muro!', 0.5, { funny: 0.6, good: false })); }
      if (U.chance(0.07)) out.push(M('volta_rapida', 'Volta mais rápida da corrida', 0.5, { good: true }));
      if (s.t % 2 === 0) s.lap++;
      if (s.lap > s.laps) {
        if (s.pos === 1) { s.wins++; out.push(M('vitoria_corrida', 'Venceu a corrida!', 0.9, { good: true, big: true, mt: 'você venceu aquela corrida de virada no Forza' })); }
        else if (s.pos <= 3) out.push(M('podio', `Terminou no pódio: ${s.pos}º`, 0.5, { good: true }));
        else out.push(M('lose', `Terminou em ${s.pos}º`, 0.3, { good: false }));
        sims.corrida.init(s);
      }
    },
  };

  sims.moba = {
    init: s => { s.k = 0; s.d = 0; s.t = 0; s.edge = 0; s.w = s.w || 0; s.l = s.l || 0; },
    status: s => `${s.k}/${s.d} · ${s.t * 2} min · ${s.edge >= 0 ? 'vantagem' : 'desvantagem'} de ${Math.abs(s.edge)} mil de ouro`,
    answer: s => `${s.k} abates e ${s.d} mortes`,
    step: (s, k, out) => {
      s.t++;
      if (U.chance(0.28)) { s.k++; s.edge += 1; out.push(M('abate', 'Pegou o abate no meio', 0.4, { good: true })); }
      if (U.chance(0.22 - k.skill * 0.1)) { s.d++; s.edge -= 1; out.push(M('morte', 'Morreu na rota de cima', 0.35, { good: false })); }
      if (U.chance(0.12)) { if (U.chance(0.45 + k.skill * 0.3)) { s.edge += 2; out.push(M('team_win', 'Luta de equipe vencida', 0.6, { good: true })); } else { s.edge -= 2; out.push(M('team_lose', 'Perdeu a luta de equipe', 0.5, { good: false })); } }
      if (U.chance(0.07)) { s.edge += 1; out.push(M('objetivo', 'Pegou o dragão', 0.45, { good: true })); }
      if (U.chance(0.05)) out.push(M('troll_aliado', 'Aliado entregou o jogo de propósito', 0.5, { funny: 0.75 }));
      if (U.chance(0.02 + (k.risky ? 0.03 : 0))) out.push(M('epic', 'Jogada épica: roubou o barão sozinho', 0.95, { good: true, big: true, mt: 'você roubou o barão sozinho no LoL' }));
      if (s.t >= 13) {
        const win = U.chance(U.clamp(0.5 + s.edge * 0.07 + k.skill * 0.1, 0.1, 0.92));
        if (win) { s.w++; out.push(M('vitoria', 'Vitória! Destruiu o núcleo inimigo', 0.85, { good: true, big: true })); } else { s.l++; out.push(M('lose', 'Derrota. O núcleo caiu', 0.5, { good: false })); }
        sims.moba.init(s);
      }
    },
  };

  sims.sandbox = {
    init: s => { s.proj = s.proj || U.pick(['castelo', 'fazenda automática', 'ponte gigante', 'casa na árvore', 'navio pirata']); s.prog = s.prog || 0; s.done = s.done || 0; },
    status: s => `Construindo: ${s.proj} (${Math.round(s.prog)}%)`,
    answer: s => `construindo um ${s.proj}`,
    step: (s, k, out) => {
      s.prog += U.rf(4, 9);
      if (U.chance(0.2)) out.push(M('construcao', `O ${s.proj} está tomando forma`, 0.22, { good: true }));
      if (U.chance(0.05)) out.push(M('diamante', 'Achou diamante na mina!', 0.7, { good: true }));
      if (U.chance(0.045)) { s.prog = Math.max(0, s.prog - 20); out.push(M('explosao', 'O bicho verde explodiu metade da construção', 0.72, { funny: 0.92, good: false, mt: 'o bicho verde explodiu seu ' + s.proj })); }
      if (U.chance(0.02)) out.push(M('morte_boba', 'Caiu na lava com tudo no inventário', 0.62, { funny: 0.85, good: false }));
      if (s.prog >= 100) { s.done++; out.push(M('projeto', `Terminou o ${s.proj}!`, 0.82, { good: true, big: true, mt: 'você terminou aquele ' + s.proj + ' na Minecraft' })); s.proj = U.pick(['castelo', 'fazenda automática', 'ponte gigante', 'casa na árvore', 'navio pirata', 'estádio']); s.prog = 0; }
    },
  };

  sims.luta = {
    init: s => { s.r = [0, 0]; s.opp = U.pick(OPP); s.loseStreak = s.loseStreak || 0; s.w = s.w || 0; },
    status: s => `Rounds ${s.r[0]} x ${s.r[1]} contra ${s.opp}`,
    answer: s => `${s.r[0]} a ${s.r[1]} nos rounds`,
    step: (s, k, out) => {
      if (U.chance(0.25)) out.push(M('combo', 'Combo de 40% da vida', 0.5, { good: true }));
      if (U.chance(0.5)) {
        if (U.chance(0.42 + k.skill * 0.3 + (k.focus ? 0.05 : 0))) {
          s.r[0]++;
          if (U.chance(0.06)) out.push(M('perfect', 'PERFECT! Sem tomar dano', 0.9, { good: true, big: true, mt: 'você deu aquele perfect no Street Fighter' }));
          else out.push(M('round_win', 'Round ganho', 0.35, { good: true }));
        } else { s.r[1]++; out.push(M('round_lose', 'Perdeu o round', 0.3, { good: false })); }
      }
      if (s.r[0] >= 2 || s.r[1] >= 2) {
        if (s.r[0] >= 2) { s.w++; s.loseStreak = 0; out.push(M('win', `Venceu ${s.opp}`, 0.65, { good: true })); }
        else { s.loseStreak++; out.push(M('lose', `Perdeu para ${s.opp}`, 0.4, { good: false })); if (s.loseStreak >= 2) out.push(M('rage', 'Quase jogou o controle longe', 0.55, { funny: 0.7 })); }
        sims.luta.init(s);
      }
    },
  };

  sims.xadrez = {
    init: s => { s.mv = 0; s.adv = 0; s.rating = s.rating || 1200; s.opp = U.pick(OPP); },
    status: s => `Lance ${s.mv} · ${s.adv > 0 ? 'vantagem' : s.adv < 0 ? 'desvantagem' : 'igual'} · rating ${s.rating}`,
    answer: s => s.adv > 0 ? 'tá ganhando' : s.adv < 0 ? 'tá perdendo' : 'tá equilibrado',
    step: (s, k, out) => {
      s.mv += U.ri(4, 7);
      if (s.mv < 8) { out.push(M('abertura', 'Abertura italiana', 0.15)); return; }
      if (U.chance(0.07 + (k.risky ? 0.06 : 0))) { s.adv += 2; out.push(M('sacrificio', 'Sacrificou a dama!', 0.82, { good: true, big: true, mt: 'você sacrificou a dama e ganhou no Chess.com' })); }
      if (U.chance(0.1 - k.skill * 0.06)) { s.adv -= 2; out.push(M('erro_xadrez', 'Deixou a torre de graça', 0.45, { funny: 0.45, good: false })); }
      s.adv += U.chance(0.5 + k.skill * 0.2) ? 0.5 : -0.5;
      if (s.mv > 45) {
        if (s.adv > 0.5 || U.chance(0.25)) { s.rating += 8; out.push(M('xeque_mate', U.pick(['Xeque-mate com o cavalo!', 'Mate de corredor no último segundo', 'Xeque-mate com a dama sacrificada', 'Mate do pastor em poucos lances', 'Xeque-mate com dois bispos', 'Virou uma partida perdida e deu mate']), 0.85, { good: true, big: true })); }
        else if (s.adv < -0.5) { s.rating -= 8; out.push(M('lose', 'Abandonou a partida', 0.4, { good: false })); }
        else out.push(M('fim_emp', 'Empate por repetição', 0.25));
        sims.xadrez.init(s);
      }
    },
  };

  sims.fazenda = {
    init: s => { s.dayN = s.dayN || 1; s.gold = s.gold || 500; },
    status: s => `Dia ${s.dayN} na fazenda · ${s.gold} moedas`,
    answer: s => `dia ${s.dayN} da fazenda`,
    step: (s, k, out) => {
      if (U.chance(0.3)) s.dayN++;
      if (U.chance(0.16)) { s.gold += U.ri(50, 300); out.push(M('colheita', 'Colheita de abóboras gigantes', 0.38, { good: true })); }
      if (U.chance(0.07)) out.push(M('animal', 'Nasceu um bezerrinho', 0.35, { good: true }));
      if (U.chance(0.03)) out.push(M('festival', 'Festival da colheita na vila', 0.55, { good: true, mt: 'você ganhou o festival da colheita na Stardew' }));
      if (U.chance(0.012)) out.push(M('bug', 'A galinha subiu no telhado e sumiu (bug)', 0.5, { funny: 0.85 }));
    },
  };

  sims.rpg = {
    init: s => { s.lvl = s.lvl || 1; s.boss = 0; s.area = s.area || 1; },
    status: s => s.boss ? `Missão de assalto ${s.area}` : `Nível ${s.lvl} · missão ${s.area}`,
    answer: s => `nível ${s.lvl}, área ${s.area}`,
    step: (s, k, out) => {
      if (s.boss) {
        if (U.chance(0.48 + k.skill * 0.35)) { s.boss = 0; s.area++; out.push(M('chefe_ok', 'Completou a missão!', 0.92, { good: true, big: true, mt: 'você fechou aquela missão no GTA 6' })); }
        else { s.boss = 0; out.push(M('morte', 'A missão deu errado desta vez', 0.55, { good: false })); }
        return;
      }
      if (U.chance(0.1)) { s.lvl++; out.push(M('level', `Subiu para o nível ${s.lvl}`, 0.3, { good: true })); }
      if (U.chance(0.06)) out.push(M('cena', 'Cena emocionante da história', 0.68, { mt: 'aquela cena que fez o chat chorar no GTA 6' }));
      if (U.chance(0.07)) { s.boss = 1; out.push(M('chefe', 'Começou uma missão de assalto!', 0.55)); }
    },
  };

  sims.retro = {
    init: s => { s.pb = s.pb || 1260; s.run = 0; s.tries = (s.tries || 0); s.split = 0; },
    status: s => `Tentativa ${s.tries} · recorde ${Math.floor(s.pb / 60)}:${String(s.pb % 60).padStart(2, '0')}`,
    answer: s => `tentativa ${s.tries}`,
    step: (s, k, out) => {
      if (!s.run) { s.run = 1; s.tries++; s.split = 0; out.push(M('run', 'Nova tentativa de speedrun', 0.2)); return; }
      s.split++;
      if (U.chance(0.18 - k.skill * 0.1)) { s.run = 0; out.push(M('erro_bobo', 'Empilhou errado e perdeu. Reset!', 0.55, { funny: 0.85, good: false })); return; }
      if (U.chance(0.25)) out.push(M('split_bom', 'Split no verde, ritmo de recorde', 0.45, { good: true }));
      if (s.split >= 5) {
        const time = s.pb + U.ri(-25, 30) - Math.round(k.skill * 15);
        s.run = 0;
        if (time < s.pb) { s.pb = time; out.push(M('recorde', 'NOVO RECORDE PESSOAL!', 1, { good: true, big: true, mt: 'você bateu aquele recorde no Tetris' })); }
        else out.push(M('lose', 'Terminou a run, sem recorde', 0.3));
      }
    },
  };

  sims.conversa = {
    init: s => { s.topic = 'o dia de hoje'; },
    status: s => `Assunto: ${s.topic}`,
    answer: s => `tá falando de ${s.topic}`,
    step: (s, k, out) => {
      if (U.chance(0.08)) s.topic = U.pick(['o dia de hoje', 'séries', 'comida', 'viagens', 'infância', 'planos para o canal', 'jogos antigos', 'histórias de escola', 'música']);
      if (U.chance(0.1)) {
        if (U.chance(0.25 + k.char / 120)) out.push(M('historia', `Contou uma história engraçada sobre ${s.topic}`, 0.55, { funny: 0.65, mt: 'você contou aquela história sobre ' + s.topic }));
        else out.push(M('historia_ruim', 'Uma história que não rendeu', 0.2));
      }
      if (U.chance(0.02)) out.push(M('desabafo', 'Um desabafo sincero com o chat', 0.5, { mt: 'você fez aquele desabafo sincero na live' }));
    },
  };

  sims.react = {
    init: s => { s.n = s.n || 0; },
    status: s => `Vídeo ${s.n + 1} da lista`,
    answer: s => `no vídeo ${s.n + 1}`,
    step: (s, k, out) => {
      if (U.chance(0.4)) {
        s.n++;
        const r = U.rand();
        if (r < 0.55) out.push(M('video_engracado', U.pick(['Cachorro tentando pegar o próprio rabo', 'Tombo épico no casamento', 'Gato derruba tudo da mesa', 'Bebê ri da tia espirrando']), 0.5, { funny: 0.72 }));
        else if (r < 0.75) out.push(M('video_absurdo', U.pick(['Homem cozinha macarrão no ferro de passar', 'Pessoa constrói piscina de gelatina', 'Desafio de comer pimenta que deu errado']), 0.5, { funny: 0.55 }));
        else out.push(M('video_triste', 'Cachorrinho reencontra o dono', 0.55, { mt: 'você chorou com o vídeo do cachorrinho' }));
      }
    },
  };

  S.make = gameId => {
    const g = D.gameById(gameId); const s = { game: gameId, sim: g.sim, last: [] };
    sims[g.sim].init(s); return s;
  };
  S.status = s => sims[s.sim].status(s);
  S.answer = s => sims[s.sim].answer(s);
  S.step = (s, k) => {
    const out = [];
    sims[s.sim].step(s, k, out);
    out.forEach(m => { m.sim = s.sim; m.game = s.game; m.at = SL.G ? SL.G.time.t : 0; m.clip = U.clamp(m.int * 0.6 + m.funny * 0.55 + (m.big ? 0.15 : 0), 0, 1); });
    s.last = out.concat(s.last).slice(0, 8);
    return out;
  };
  // gravação rápida (sem live): gera momentos para o material bruto
  S.recordRun = (gameId, minutes, k) => {
    const s = S.make(gameId); const all = [];
    for (let i = 0; i < minutes; i++) { const ms = S.step(s, k); ms.forEach(m => { m.off = i; all.push(m); }); }
    return all;
  };
})(window.SL);
