// t100: músicas na rádio (apresentação do DJ + faixa, ouvinte pedindo música, bossa só com chuva),
// falas novas de passageiro, pedestre falando (voz + balão) e chat do app de Fretes (pedido, resposta única, agradecimento).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; Settings.msgMode = 'texto'; VoicePlayer.stop(); });
  const ok = [];
  // ---------- rádio ----------
  const r = await p.evaluate(() => {
    const out = {};
    out.clips = RADIO_MUSICAS.every((m) => VOICE_CLIPS[m.clip] && VOICE_CLIPS[m.clip].dur > 50) && RADIO_APRESENTA.every((a) => VOICE_CLIPS[a.clip]) && RADIO_DEPOIS.every((a) => VOICE_CLIPS[a.clip]);
    out.durs = RADIO_MUSICAS.map((m) => Math.round(VOICE_CLIPS[m.clip].dur));
    Weather.rain = 0; Radio.semMusica = 2; Radio.mbag = [];
    const blocos = []; for (let i = 0; i < 30; i++) blocos.push(Radio.monta().map((x) => x.clip));
    out.semChuvaBossa = blocos.some((B) => B.includes('mus_bossa'));
    out.musicasTocadas = [...new Set(blocos.flat().filter((c) => c.startsWith('mus_')))].length;
    out.introAntes = blocos.filter((B) => B.some((c) => c.startsWith('mus_'))).every((B) => { const i = B.findIndex((c) => c.startsWith('mus_')); return i > 0 && (B[i - 1].startsWith('dj_m') || RADIO_VINHETAS.some((v) => v.clip === B[i - 1])); });
    out.blocos = blocos.slice(0, 6).map((B) => B.join('>'));
    // ouvinte pede o forró: Thaís > DJ apresenta > xote
    Radio.semMusica = 0; Radio.bag = [RADIO.find((x) => x.clip === 'radio_thais')]; Radio.mbag = RADIO_MUSICAS.slice();
    const _r = Math.random; Math.random = () => 0.9; out.pedido = Radio.monta().map((x) => x.clip).join('>'); Math.random = _r;
    // com chuva a bossa entra
    Weather.rain = 0.6; Radio.mbag = [RADIO_MUSICAS.find((m) => m.clip === 'mus_bossa')]; out.chuvaBossa = Radio.proxMusica() && true; Weather.rain = 0;
    // tocando a faixa: letreiro mostra a música e a banda
    Settings.radioOff = false; Settings.radio = 70; Radio.stop(); Radio.fila = []; Radio.play(radioFaixa(RADIO_MUSICAS[0]), 0);
    out.letreiro = [$('hr-tag').textContent, $('hr-who').textContent, Radio.cur && Radio.cur.text];
    Radio.stop();
    return out;
  });
  console.log('rádio:', JSON.stringify(r, null, 0));
  ok.push(r.clips, !r.semChuvaBossa, r.musicasTocadas >= 6, r.introAntes, r.pedido === 'radio_thais>dj_m1>mus_xote' || r.pedido.startsWith('radio_thais>dj_m1>mus_xote'), r.chuvaBossa, r.letreiro[0] === 'Tocando agora' && r.letreiro[1] === 'Trio Pé de Pano');
  // ---------- passageiros ----------
  const pa = await p.evaluate(() => {
    const novos = ['p_pastel', 'p_bolo', 'p_novela', 'p_galinha', 'p_entrevista', 'p_vip3', 'p_top4', 'p_top5', 'p_top6'];
    return { linhas: novos.every((c) => VOICE_LINES.find((l) => l.clip === c) && VOICE_CLIPS[c]), meio: PG_MEIO.length, top: PG_TOP.length };
  });
  console.log('passageiros:', JSON.stringify(pa)); ok.push(pa.linhas, pa.meio >= 5, pa.top >= 12);
  // ---------- pedestre ----------
  const pe = await p.evaluate(() => {
    const an = Animals.list.find((a) => a.type === 'person');
    player.place(an.x + 40, an.y, 0); Cam.x = an.x; Cam.y = an.y;
    PedVoz.t = 0; const f1 = PedVoz.fala(an, 'susto'); const f2 = PedVoz.fala(an, 'susto'); // a segunda espera o intervalo
    return { f1, f2, fala: an.fala, clip: PedVoz.ultimo, temVoz: !!VOICE_CLIPS[PedVoz.ultimo], todas: Object.values(PED_FALAS).flat().every((F) => VOICE_CLIPS[F[0]]) };
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'ped_fala.png' });
  console.log('pedestre:', JSON.stringify(pe)); ok.push(pe.f1 === true, pe.f2 === false, pe.temVoz, pe.todas);
  // ---------- chat do app de Fretes ----------
  await p.evaluate(() => { Profile.owned.gas = true; Profile.current = 'gas'; player.setCar('gas'); Act.delivery = null; startJob(genJob('gas')); });
  await p.waitForTimeout(5500);
  const f = await p.evaluate(() => { const d = Act.delivery, c = frFind(d.fid); return { cliente: d.cliente, msgs: c ? c.msgs.map((m) => m.body) : null, unread: frUnread() }; });
  console.log('frete aceito:', JSON.stringify(f)); ok.push(f.msgs && f.msgs.length === 1 && f.unread === 1);
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => Phone.go('fretes')); await p.click('[data-frtab="msgs"]'); await p.waitForTimeout(150);
  await p.click('#phone-body [data-frchat]'); await p.waitForTimeout(150);
  const q0 = await p.evaluate(() => document.querySelectorAll('#phone-body [data-frq]').length);
  await p.click('#phone-body [data-frq="0"]'); await p.waitForTimeout(150);
  const q1 = await p.evaluate(() => [document.querySelectorAll('#phone-body [data-frq]').length, (document.querySelector('#phone-body .pgc-closed') || {}).textContent]);
  console.log('responder:', q0, '→', q1); ok.push(q0 === 3 && q1[0] === 0 && /já respondeu/.test(q1[1]));
  await p.evaluate(() => { const d = Act.delivery; d.stage = 'deliver'; d.t = 1; d.hits = 0; finishDelivery(); });
  await p.waitForTimeout(7500);
  await p.evaluate(() => Phone.render()); await p.waitForTimeout(150);
  await (await p.$('.phone')).screenshot({ path: 'fr_chat.png' });
  const g = await p.evaluate(() => { const c = frChats()[0]; return { msgs: c.msgs.map((m) => (m.me ? 'EU: ' : 'ELE: ') + m.body + (m.voice ? ' [áudio ' + m.voice.clip + ']' : '')), fechado: (document.querySelector('#phone-body .pgc-closed') || {}).textContent }; });
  console.log('entregue:', JSON.stringify(g)); ok.push(g.msgs.length >= 3 && g.msgs[g.msgs.length - 1].startsWith('ELE') && /encerrado/.test(g.fechado));
  await p.keyboard.press('KeyQ');
  console.log(ok.every(Boolean) ? 'OK: músicas, falas, pedestre e chat dos fretes' : 'FALHOU: ' + JSON.stringify(ok));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
