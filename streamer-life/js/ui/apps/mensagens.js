/* App Mensagens: conversas com amigos, família, criadores, marcas e fãs; respostas com opções. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $$ = UI.$$, ic = UI.ic, esc = U.esc;
  const avatarFor = id => { const d = SL.Rel.def(id); return d && d.look ? d.look : null; };

  SL.Apps.mensagens = {
    title: 'Mensagens', short: 'Mensagens', icon: 'chat', color: 'linear-gradient(135deg,#35d39a,#1f8f63)', pc: true, phone: true, w: 860, h: 620,
    watch: ['dm', 'rel'],
    badge: () => SL.Social.unreadDMs(),
    render(el, ctx) {
      const G = SL.G; const st = ctx.st;
      if (ctx.args && ctx.args.thread && !st.used) { st.used = 1; st.th = ctx.args.thread; }
      const threads = Object.values(G.dms).sort((a, b) => b.last - a.last);
      const th = st.th && G.dms[st.th];
      if (th && th.unread) { th.unread = 0; SL.bus.emit('notif'); }
      const contacts = Object.keys(G.rel).filter(id => G.rel[id].met && SL.Rel.def(id) && !G.dms[id]);
      const phone = ctx.mode === 'phone';
      const list = `<div class="list threads">${threads.map(t => `<div class="li ${st.th === t.id ? 'on' : ''}" data-act="th" data-v="${esc(t.id)}">${avatarFor(t.id) ? `<canvas data-lk="${esc(t.id)}" style="width:34px;height:34px;border-radius:50%"></canvas>` : `<span class="ava" style="width:34px;height:34px;font-size:14px;background:${t.id.startsWith('brand_') ? (D.brandById(t.id.slice(6)) || {}).color || '#475069' : '#475069'}">${esc(t.name[0] === '@' ? t.name[1].toUpperCase() : t.name[0])}</span>`}<div class="grow" style="min-width:0"><b class="small ellipsis" style="display:block">${esc(t.name)}</b><div class="tiny muted ellipsis">${esc((t.msgs[t.msgs.length - 1] || {}).text || '')}</div></div>${t.unread ? `<span class="badge">${t.unread}</span>` : ''}</div>`).join('')}
        ${contacts.length ? `<div class="li upper" style="padding-top:14px">Contatos</div>${contacts.map(id => `<div class="li" data-act="th" data-v="${id}"><canvas data-lk="${id}" style="width:30px;height:30px;border-radius:50%"></canvas><span class="small grow">${esc(SL.Rel.def(id).name)}</span><span class="tiny muted">${esc(SL.Rel.STAGES[G.rel[id].stage] || '')}</span></div>`).join('')}` : ''}</div>`;
      let conv = '<div class="empty">' + ic('chat', 36) + '<p>Escolha uma conversa.</p></div>';
      if (st.th) {
        const t = th || { id: st.th, name: (SL.Rel.def(st.th) || {}).name || st.th, msgs: [] };
        const isPerson = !!SL.Rel.def(t.id) && G.rel[t.id];
        conv = `<div class="convo-head">${phone ? `<button class="ibtn" data-act="back">${ic('left', 16)}</button>` : ''}${avatarFor(t.id) ? `<canvas data-lk="${esc(t.id)}" style="width:38px;height:38px;border-radius:50%"></canvas>` : ''}<div class="grow"><b>${esc(t.name)}</b>${isPerson ? `<div class="tiny muted">${esc(SL.Rel.STAGES[G.rel[t.id].stage] || '')}</div>` : ''}</div>${isPerson ? `<button class="btn sm" data-act="talk" data-v="${esc(t.id)}">${ic('chat', 14)} Conversar</button>` : ''}</div>
          <div class="convo">${t.msgs.map(m => `<div class="bubble ${m.from === 'me' ? 'me' : 'them'}">${esc(m.text)}<time>${SL.Clock.fmtStamp(m.t)}</time></div>${m.opts && !m.done ? `<div class="opts">${m.opts.map(o => `<button class="btn sm" data-act="opt" data-m="${m.id}" data-o="${o.id}">${esc(o.label)}</button>`).join('')}</div>` : ''}`).join('') || '<div class="small muted">Nenhuma mensagem ainda. Use "Conversar" para mandar algo.</div>'}</div>`;
      }
      el.innerHTML = `<div class="app">${phone ? `<div class="app-head"><h2>${ic('chat', 16)} Mensagens</h2></div><div class="app-body">${st.th ? conv : list}</div>` : `<div class="app-split"><aside>${list}</aside><section>${conv}</section></div>`}</div>`;
      $$('canvas[data-lk]', el).forEach(cv => { const l = avatarFor(cv.dataset.lk); if (l) SL.Avatar.toCanvas(cv, l, { scale: 1 }); });
      const sec = el.querySelector('.app-split > section, .app-body'); if (sec && st.th) sec.scrollTop = sec.scrollHeight;
    },
    act(a, ds, ctx) {
      const st = ctx.st;
      if (a === 'th') { st.th = ds.v; return ctx.render(); }
      if (a === 'back') { st.th = null; return ctx.render(); }
      if (a === 'opt') { SL.Rel.onDmOption(st.th, ds.m, ds.o); setTimeout(() => ctx.render(), 450); return ctx.render(); }
      if (a === 'talk') { SL.HUD.talk(ds.v, 'msg'); }
    },
  };
})(window.SL);
