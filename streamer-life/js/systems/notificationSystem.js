/* Notificações: sempre geradas por algo que aconteceu de verdade nos sistemas. */
'use strict';
(function (SL) {
  const N = SL.Notify = {};
  N.CATS = {
    social: { label: 'Redes', icon: 'connect', color: '#3b82f6' }, canal: { label: 'Canal', icon: 'live', color: '#8b5cf6' },
    dinheiro: { label: 'Dinheiro', icon: 'money', color: '#35d39a' }, carreira: { label: 'Carreira', icon: 'trophy', color: '#ffb547' },
    pessoas: { label: 'Pessoas', icon: 'users', color: '#ff8fc1' }, vida: { label: 'Vida', icon: 'heart', color: '#ff5a36' },
    sistema: { label: 'Sistema', icon: 'info', color: '#8b93a7' }, mundo: { label: 'Mundo', icon: 'trend', color: '#4cc3ff' },
  };
  N.push = n => {
    const G = SL.G; if (!G) return null;
    const item = { id: SL.U.uid('n'), t: G.time.t, cat: n.cat || 'sistema', title: n.title || '', text: n.text || '', icon: n.icon || (N.CATS[n.cat] || N.CATS.sistema).icon, app: n.app || null, args: n.args || null, read: false };
    G.notifs.push(item);
    SL.U.cap_list(G.notifs, 140);
    SL.bus.emit('notif', item);
    if (!n.silent && SL.UI && SL.UI.toast) SL.UI.toast(item, n.sound);
    return item;
  };
  N.unread = () => SL.G ? SL.G.notifs.filter(n => !n.read).length : 0;
  N.readAll = () => { if (SL.G) SL.G.notifs.forEach(n => { n.read = true; }); SL.bus.emit('notif'); };
  SL.notify = N.push;
})(window.SL);
