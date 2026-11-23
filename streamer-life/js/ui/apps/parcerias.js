/* App Parcerias: propostas de marcas (aceitar, negociar, recusar), contratos ativos e loja do canal. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  const SP = () => SL.Sponsors;
  SL.Apps.parcerias = {
    title: 'Parcerias', icon: 'brief', color: 'linear-gradient(135deg,#c084fc,#ff5a36)', pc: true, phone: true, w: 900, h: 640,
    watch: ['offers', 'money', 'tick:day'],
    badge: () => SL.G.offers.length,
    render(el, ctx) {
      const st = ctx.st; st.tab = st.tab || 'propostas';
      const tabs = [['propostas', 'Propostas'], ['contratos', 'Contratos'], ['loja', 'Loja do canal']];
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('brief', 16)} Parcerias</h2><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}${k === 'propostas' && SL.G.offers.length ? ' <span class="badge">' + SL.G.offers.length + '</span>' : ''}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
    },
    propostas() {
      const G = SL.G; const mgr = SL.Rel.manager(); const r = SP().reach();
      const head = `<div class="card small">${mgr ? `${ic('team', 14)} Seu empresário <b>${esc(mgr.name)}</b> negocia valores ${mgr.pers === 'agressiva' ? 'bem mais altos (e traz marcas arriscadas)' : 'mais altos'} e fica com ${Math.round(mgr.cut * 100)}%.` : 'Sem empresário: as marcas te procuram direto. Contrate um no app Equipe para propostas melhores.'} Hoje você tem ${U.num(r.followers)} seguidores e média de ${r.avgV.toFixed(1).replace('.', ',')} pessoas nas lives.</div>`;
      if (!G.offers.length) return head + `<div class="empty">${ic('brief', 36)}<p>Nenhuma proposta agora. Marcas aparecem conforme seu alcance e credibilidade crescem.</p></div>`;
      return head + G.offers.map(o => { const b = D.brandById(o.brand); const cf = SP().conflict(o); return `<div class="card col" style="border-left:3px solid ${b.color}"><div class="row"><b class="grow">${esc(b.name)}</b><span class="tag">${esc(b.cat)}</span>${b.ethics < 0.3 ? '<span class="tag bad">o público não gosta</span>' : ''}</div>
        <div class="row wrap"><div class="stat"><b class="ok">${U.money0(o.value)}</b><span>Valor (metade adiantado)</span></div><div class="stat"><b>${o.days} dias</b><span>Prazo para entregar</span></div><div class="stat"><b>${SL.Clock.ago(o.t)}</b><span>Expira ${SL.Clock.fmtDay(SL.Clock.day(o.expires))}</span></div></div>
        <div class="small"><b>Exigências:</b> ${o.deliv.map(d => d.n + 'x ' + SP().KIND[d.k].toLowerCase() + (d.k === 'live' ? ' (mín. ' + d.minV + ' pessoas no momento)' : '')).join(' · ')}</div>
        <div class="tiny muted">Exclusividade no ramo "${esc(o.excl)}" durante o contrato. Descumprir: devolve o adiantamento + 20% de multa e perde credibilidade.</div>
        ${cf ? `<div class="tiny warn">Conflito: você já tem contrato com ${esc(D.brandById(cf.brand).name)} no mesmo ramo.</div>` : ''}
        <div class="row wrap"><button class="btn sm primary" data-act="ok" data-v="${o.id}" ${cf ? 'disabled' : ''}>Aceitar</button>${o.neg ? '' : [10, 20, 30].map(p => `<button class="btn sm" data-act="neg" data-v="${o.id}" data-p="${p}">Pedir +${p}%</button>`).join('')}<button class="btn sm ghost" data-act="no" data-v="${o.id}">Recusar</button></div></div>`; }).join('');
    },
    contratos() {
      const G = SL.G; const act = G.contracts.filter(c => c.state === 'ativo'); const old = G.contracts.filter(c => c.state !== 'ativo').slice().reverse();
      const day = SL.Clock.day();
      return `${act.length ? act.map(c => { const b = D.brandById(c.brand); return `<div class="card col" style="border-left:3px solid ${b.color}"><div class="row"><b class="grow">${esc(b.name)}</b><span class="tag ${c.deadline - day <= 2 ? 'bad' : 'warn'}">${c.deadline - day} dias restantes</span></div>${c.deliv.map(d => `<div class="attr" style="grid-template-columns:170px 1fr 40px">${SP().KIND[d.k]}<div class="bar"><i style="width:${d.done / d.n * 100}%;background:var(--ok)"></i></div><b>${d.done}/${d.n}</b></div>`).join('')}<div class="tiny muted">${c.deliv.some(d => d.k === 'live') ? 'Menção: botão "Mencionar patrocinador" durante a live. ' : ''}${c.deliv.some(d => d.k === 'video') ? 'Vídeo: marque a publi no passo "Publicar". ' : ''}${c.deliv.some(d => d.k === 'post') ? 'Post: use o botão abaixo.' : ''}</div>${c.deliv.some(d => d.k === 'post' && d.done < d.n) ? `<button class="btn sm" data-act="post" data-v="${c.id}">${ic('connect', 14)} Postar publi no Connect</button>` : ''}<div class="small">Recebido: ${U.money(c.paid)} de ${U.money(c.value * (1 - c.cut))}</div></div>`; }).join('') : '<div class="empty">Nenhum contrato ativo.</div>'}
        ${old.length ? `<div class="card"><h3>Histórico</h3><div class="list">${old.map(c => `<div class="li small"><b class="grow">${esc(D.brandById(c.brand).name)}</b><span class="tag ${c.state === 'cumprido' ? 'ok' : 'bad'}">${c.state}</span><span class="mono">${U.money0(c.paid)}</span></div>`).join('')}</div></div>` : ''}`;
    },
    loja() {
      const G = SL.G; const fans = SP().fans(); const pr = G.ch.merch.products;
      return `<div class="card small">Fãs engajados (estimativa): <b>${U.int(fans)}</b>. Produtos vendem por encomenda: sem estoque, o lucro por peça cai na sua conta todo dia.</div><div class="shop-grid">${D.merch.map(m => { const on = pr[m.id]; return `<div class="prod ${on ? 'owned' : ''}"><div class="pa">${ic('bag', 36)}</div><b>${esc(m.name)}</b><div class="tiny muted">Preço ${U.money0(m.price)} · custo ${U.money0(m.unit)} + frete · lucro ~${U.money0(m.price - m.unit - 8)} por peça</div>${on ? `<div class="small">Vendidos: <b>${on.sold}</b> · lucro ${U.money0(on.rev)}</div><span class="tag ok">à venda</span>` : `<div class="tiny muted">Precisa de ${U.int(m.minFans)} fãs</div><button class="btn sm primary" data-act="launch" data-v="${m.id}" ${fans < m.minFans ? 'disabled' : ''}>Lançar (R$ 800 de arte e loja)</button>`}</div>`; }).join('')}</div>`;
    },
    act(a, ds, ctx) {
      const st = ctx.st;
      if (a === 'tab') { st.tab = ds.t; return ctx.render(); }
      if (a === 'ok') { const e = SP().accept(ds.v); if (e) return e; return ctx.render(); }
      if (a === 'neg') { const r = SP().negotiate(ds.v, +ds.p / 100); UI.toast({ title: r.ok ? 'Negociação aceita' : 'Negociação', text: r.text, icon: 'brief', cat: 'carreira' }, r.ok ? 'success' : null); return ctx.render(); }
      if (a === 'no') { SP().decline(ds.v); return ctx.render(); }
      if (a === 'launch') { const e = SP().launch(ds.v); if (e) return e; return ctx.render(); }
      if (a === 'post') { const c = SL.G.contracts.find(x => x.id === ds.v); const b = D.brandById(c.brand); const e = SL.Social.post({ kind: 'texto', text: '#publi Tô usando ' + b.prod + ' e recomendo! Link no perfil.', eng: 0.8, risk: b.ethics < 0.3 ? 0.25 : 0 }); if (e) return e; SP().deliver(c.id, 'post', {}); if (b.ethics < 0.3) SL.Rep.mod({ confianca: -1 }); return ctx.render(); }
    },
  };
})(window.SL);
