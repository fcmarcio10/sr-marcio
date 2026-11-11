// Depois de empacotar para Windows: grava o ícone e a versão dentro do "BR Night Drive.exe".
// (Usa o resedit, que é JavaScript puro — não precisa de Wine nem de Windows para rodar.)
const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

exports.default = async function afterPack(ctx) {
  if (ctx.electronPlatformName !== 'win32') return;
  const pkg = require('./package.json');
  const exe = path.join(ctx.appOutDir, pkg.build.productName + '.exe');
  const ver = pkg.version.split('.').map(Number);
  while (ver.length < 4) ver.push(0);

  const nt = ResEdit.NtExecutable.from(fs.readFileSync(exe), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(nt);

  // Ícone: substitui o grupo de ícones existente (o do Electron) pelo nosso
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'build', 'icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const gid = groups.length ? groups[0].id : 1, glang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, gid, glang, ico.icons.map(i => i.data));

  // Informações de versão (aparecem em Propriedades > Detalhes)
  const vis = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  const vi = vis.length ? vis[0] : ResEdit.Resource.VersionInfo.createEmpty();
  const lang = { lang: 1033, codepage: 1200 };
  vi.setFileVersion(ver[0], ver[1], ver[2], ver[3], 1033);
  vi.setProductVersion(ver[0], ver[1], ver[2], ver[3], 1033);
  vi.setStringValues(lang, {
    ProductName: pkg.build.productName,
    FileDescription: pkg.build.productName,
    CompanyName: pkg.author,
    LegalCopyright: '© ' + new Date().getFullYear() + ' ' + pkg.author,
    OriginalFilename: pkg.build.productName + '.exe',
    InternalName: pkg.name,
    FileVersion: pkg.version,
    ProductVersion: pkg.version,
  });
  vi.outputToResourceEntries(res.entries);

  res.outputResource(nt);
  fs.writeFileSync(exe, Buffer.from(nt.generate()));
  console.log('  • ícone e versão gravados em', path.basename(exe));

  // Licenças das bibliotecas (obrigatórias) vão para uma pasta "licencas", para não poluir a pasta do jogo
  const lic = path.join(ctx.appOutDir, 'licencas');
  fs.mkdirSync(lic, { recursive: true });
  for (const [from, to] of [['LICENSE.electron.txt', 'licenca-motor-do-app.txt'], ['LICENSES.chromium.html', 'licencas-navegador.html']]) {
    const f = path.join(ctx.appOutDir, from);
    if (fs.existsSync(f)) fs.renameSync(f, path.join(lic, to));
  }
};
