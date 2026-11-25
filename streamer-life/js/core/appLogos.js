// Ícones dos apps no estilo dos apps de verdade (nov/2026, pedido do dono: "depois eu mudo").
// Desenhos simples feitos no código (SVG 48x48 com o fundo do ícone incluído), sem imagem externa.
(function () {
  'use strict';
  const SL = window.SL = window.SL || {};
  const R = (fill, extra) => `<rect width="48" height="48" rx="11" fill="${fill}"${extra || ''}/>`;
  const L = {
    // Twitch: balão roxo com dois traços
    twitch: R('#9146ff') + '<path d="M14 10 11 17v21h7v4h4l4-4h6l7-7V10z" fill="#fff"/><path d="M15 13h21v16l-4 4h-7l-4 4v-4h-6z" fill="#9146ff"/><rect x="22" y="18" width="3" height="8" fill="#fff"/><rect x="29" y="18" width="3" height="8" fill="#fff"/>',
    // OBS Studio: círculo com três "pás"
    pulso: R('#302e31') + '<circle cx="24" cy="24" r="15" fill="#fff"/><circle cx="24" cy="24" r="12.5" fill="#302e31"/><circle cx="24" cy="15.5" r="5" fill="#fff"/><circle cx="16.6" cy="28.3" r="5" fill="#fff"/><circle cx="31.4" cy="28.3" r="5" fill="#fff"/><circle cx="24" cy="15.5" r="3" fill="#302e31"/><circle cx="16.6" cy="28.3" r="3" fill="#302e31"/><circle cx="31.4" cy="28.3" r="3" fill="#302e31"/>',
    // YouTube: botão vermelho com o "play"
    vision: R('#fff') + '<rect x="6" y="12" width="36" height="24" rx="7" fill="#ff0000"/><path d="M20 18v12l10.5-6z" fill="#fff"/>',
    // TikTok: nota musical com sombras ciano e rosa
    clipz: R('#010101') + '<g transform="translate(-1.2 -1)"><path d="M26 10h5c.4 4 3 6.5 7 7v5c-2.7 0-5-.8-7-2.2V30a8 8 0 1 1-8-8v5a3 3 0 1 0 3 3z" fill="#25f4ee"/></g><g transform="translate(1.2 1)"><path d="M26 10h5c.4 4 3 6.5 7 7v5c-2.7 0-5-.8-7-2.2V30a8 8 0 1 1-8-8v5a3 3 0 1 0 3 3z" fill="#fe2c55"/></g><path d="M26 10h5c.4 4 3 6.5 7 7v5c-2.7 0-5-.8-7-2.2V30a8 8 0 1 1-8-8v5a3 3 0 1 0 3 3z" fill="#fff"/>',
    // Instagram: degradê com a câmera
    connect: '<defs><radialGradient id="igG" cx="0.3" cy="1.05" r="1.25"><stop offset="0" stop-color="#ffd776"/><stop offset=".25" stop-color="#f3a554"/><stop offset=".5" stop-color="#e1306c"/><stop offset=".75" stop-color="#c13584"/><stop offset="1" stop-color="#5851db"/></radialGradient></defs>' + R('url(#igG)') + '<rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="6.3" fill="none" stroke="#fff" stroke-width="3"/><circle cx="31.6" cy="16.4" r="1.9" fill="#fff"/>',
    // WhatsApp: balão com telefone
    mensagens: R('#25d366') + '<path d="M24 9.5a14.5 14.5 0 0 0-12.4 22L9.8 38.5l7.2-1.9A14.5 14.5 0 1 0 24 9.5z" fill="none" stroke="#fff" stroke-width="2.8" stroke-linejoin="round"/><path d="M18.6 17.2c.5-.6 1.3-.6 1.7 0l1.6 2.6c.3.5.2 1.1-.2 1.5l-.9.9c.9 2 2.4 3.6 4.4 4.6l.9-.9c.4-.4 1-.5 1.5-.2l2.6 1.6c.6.4.6 1.2 0 1.7l-1.3 1.2c-.8.7-2 .9-3 .4-3.6-1.7-6.4-4.5-8-8.1-.5-1-.3-2.2.4-3z" fill="#fff"/>',
    // Gmail: envelope com o "M" colorido
    parcerias: R('#fff') + '<path d="M8 16v19a2 2 0 0 0 2 2h5V22z" fill="#4285f4"/><path d="M40 16v19a2 2 0 0 1-2 2h-5V22z" fill="#34a853"/><path d="M33 22v15h0V22l7-6-1.5-3.5z" fill="#34a853"/><path d="M15 22 24 29l9-7v-8l-9 7-9-7z" fill="#ea4335"/><path d="M8 16l7 6v-8l-2.4-1.8C10.6 10.7 8 12 8 14.5z" fill="#c5221f"/><path d="M40 16l-7 6v-8l2.4-1.8c2-1.5 4.6-.2 4.6 2.3z" fill="#fbbc04"/>',
    // Mercado Livre: aperto de mãos no amarelo
    loja: R('#ffe600') + '<ellipse cx="24" cy="24" rx="16.5" ry="11.5" fill="#fff" stroke="#2d3277" stroke-width="2.2"/><path d="M11 23.5c3-1 5.5-3.5 9-3.5 2 0 3 1 4.5 1.8 1.6-.8 3.2-1.8 5-1.8 3.2 0 5.5 2.2 7.8 3.5" fill="none" stroke="#2d3277" stroke-width="2" stroke-linecap="round"/><path d="M17 25.5l3 3m-.5-5 4 4m0-4 3.5 3.5m-1-5 3 3" stroke="#2d3277" stroke-width="2" stroke-linecap="round"/>',
    // iFood: nome em branco no vermelho
    rango: R('#ea1d2c') + '<text x="24" y="29.5" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-style="italic" font-size="13.5" fill="#fff" letter-spacing="-.5">iFood</text>',
    // Steam: braço com a esfera
    steam: '<defs><linearGradient id="stG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4a"/><stop offset="1" stop-color="#0e74b1"/></linearGradient></defs>' + R('url(#stG)') + '<circle cx="30" cy="19" r="7.5" fill="none" stroke="#fff" stroke-width="3"/><circle cx="30" cy="19" r="3.3" fill="#fff"/><path d="M8 27l10 4" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="19.5" cy="31.5" r="4.6" fill="none" stroke="#fff" stroke-width="3"/><path d="M22.5 28 27 23" stroke="#fff" stroke-width="3"/>',
    // LinkedIn: "in"
    equipe: R('#0a66c2') + '<rect x="12" y="20" width="5.2" height="16" fill="#fff"/><circle cx="14.6" cy="14.2" r="3.1" fill="#fff"/><path d="M21.5 20h5v2.3c.9-1.5 2.7-2.7 5.2-2.7 4.3 0 5.3 2.8 5.3 6.6V36h-5.2v-8.6c0-2-.4-3.6-2.5-3.6s-2.7 1.6-2.7 3.6V36h-5.1z" fill="#fff"/>',
    // Udemy: "U" com o chapéu
    trabalho: R('#a435f0') + '<path d="M24 9 32 13.6 24 18.2 16 13.6z" fill="#fff"/><path d="M16.5 21.5h5v8c0 2.4 1 3.6 2.5 3.6s2.5-1.2 2.5-3.6v-8h5v8.4c0 5.3-3.4 8.1-7.5 8.1s-7.5-2.8-7.5-8.1z" fill="#fff"/>',
    // Maps: alfinete colorido no mapa
    mapa: R('#fff') + '<path d="M0 30 18 12h12L48 30v7a11 11 0 0 1-11 11H11A11 11 0 0 1 0 37z" fill="#e8f0e6"/><path d="M6 48 36 18" stroke="#fbbc04" stroke-width="5"/><path d="M24 7a10 10 0 0 0-10 10c0 7.5 10 19 10 19s10-11.5 10-19A10 10 0 0 0 24 7z" fill="#ea4335"/><circle cx="24" cy="17" r="3.8" fill="#a50e0e"/>',
  };
  SL.AppLogo = L;
  // pedaço de HTML usado em todo lugar que mostra o ícone de um app (área de trabalho, celular, Iniciar, live)
  SL.appTile = (id, a, size) => {
    const svg = L[id];
    if (svg) return { style: 'background:transparent;padding:0;box-shadow:none', inner: `<svg class="app-logo" viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">${svg.replace(/id="(\w+)"/g, 'id="$1_' + size + '"').replace(/url\(#(\w+)\)/g, 'url(#$1_' + size + ')')}</svg>` };
    return { style: `background:${a.color};${a.fg ? 'color:' + a.fg : ''}`, inner: SL.UI ? SL.UI.ic(a.icon, size) : '' };
  };
})();
