// Offline export of editable draft masks. Does not modify the source image/app.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.dirname(require.resolve('../package.json'));
const directory = path.join(root, 'assets/muscle-map/male-anatomy-v1');
const atlas = JSON.parse(
  fs.readFileSync(path.join(directory, 'layers.json'), 'utf8'),
);
const source = fs.readFileSync(path.join(directory, atlas.source));
const hash = crypto.createHash('sha256').update(source).digest('hex');
if (hash !== atlas.sourceSha256)
  throw Error('Source changed: retrace/review masks before exporting');
const taxonomy = fs
  .readFileSync(path.join(root, 'lib/exercise-taxonomy.ts'), 'utf8')
  .split('] as const;')[0];
const ids = [...taxonomy.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
if (
  new Set(atlas.groups.map((g) => g.id)).size !== ids.length ||
  atlas.groups.length !== ids.length ||
  ids.some((id) => !atlas.groups.some((g) => g.id === id))
)
  throw Error('Atlas must match the current muscle taxonomy exactly');
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[char],
  );
function parts(group) {
  return group.regions
    .flatMap((region, index) => {
      if (
        !atlas.views[region.view] ||
        !/^[MLCQZmlcqz\d\s.,-]+$/.test(region.path) ||
        !region.path.endsWith('Z')
      )
        throw Error('Invalid path/view ' + group.id);
      const axis = atlas.views[region.view].mirrorAxis;
      const structure = region.structureId ?? group.id;
      if (
        !/^[a-z0-9-]+$/.test(structure) ||
        (region.side && !['left', 'right'].includes(region.side))
      )
        throw Error('Invalid structure/side ' + group.id);
      const attributes = `data-structure="${structure}" data-view="${region.view}" d="${region.path}"`;
      if (region.side)
        return [
          `<path id="${group.id}--${region.view}--${region.side}--${index}" data-side="${region.side}" ${attributes}/>`,
        ];
      const imageLeft = region.view === 'front' ? 'right' : 'left';
      const imageRight = region.view === 'front' ? 'left' : 'right';
      return [
        `<path id="${group.id}--${region.view}--${imageLeft}--${index}" data-side="${imageLeft}" ${attributes}/>`,
        `<path id="${group.id}--${region.view}--${imageRight}--${index}" data-side="${imageRight}" ${attributes} transform="translate(${2 * axis} 0) scale(-1 1)"/>`,
      ];
    })
    .join('\n');
}
const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${atlas.width}" height="${atlas.height}" viewBox="0 0 ${atlas.width} ${atlas.height}">`;
fs.mkdirSync(path.join(directory, 'masks'), { recursive: true });
fs.mkdirSync(path.join(directory, 'parts'), { recursive: true });
for (const group of atlas.groups) {
  const text = `${open}\n<title>${esc(group.label)} — editable draft mask</title>\n<g id="${group.id}" fill="currentColor">\n${parts(group)}\n</g>\n</svg>\n`;
  fs.writeFileSync(path.join(directory, 'masks', `${group.id}.svg`), text);
  const clipped = `${open}\n<title>${esc(group.label)} — source texture clipped by draft mask</title>\n<defs><clipPath id="region">${parts(group)}</clipPath></defs>\n<image href="../${atlas.source}" width="${atlas.width}" height="${atlas.height}" clip-path="url(#region)"/>\n</svg>\n`;
  fs.writeFileSync(path.join(directory, 'parts', `${group.id}.svg`), clipped);
}
const all = atlas.groups
  .map(
    (g) =>
      `<g id="${g.id}" data-muscle-id="${g.id}" fill="currentColor">${parts(g)}</g>`,
  )
  .join('\n');
fs.mkdirSync(path.join(directory, 'structures'), { recursive: true });
const structureIds = [
  ...new Set(
    atlas.groups.flatMap((group) =>
      group.regions.map((region) => region.structureId).filter(Boolean),
    ),
  ),
];
for (const id of structureIds) {
  const group = atlas.groups.find((group) =>
    group.regions.some((region) => region.structureId === id),
  );
  const subset = {
    ...group,
    regions: group.regions.filter((region) => region.structureId === id),
  };
  fs.writeFileSync(
    path.join(directory, 'structures', `${id}.svg`),
    `${open}\n<title>${esc(subset.regions[0].structureLabel)} — draft 2D structure</title>\n<g fill="currentColor">${parts(subset)}</g>\n</svg>\n`,
  );
}
fs.writeFileSync(
  path.join(directory, 'atlas.svg'),
  `${open}\n<title>CRESUM 17 muscle-group draft masks</title>\n${all}\n</svg>\n`,
);
const select = atlas.groups
  .map((g) => `<option value="${g.id}">${esc(g.label)}</option>`)
  .join('');
const markup = `<div id="cresum-mask-review" class="viz-dotted-background">
<style>
#cresum-mask-review{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171719;padding:12px;box-sizing:border-box}
#cresum-mask-review *{box-sizing:border-box}
#cresum-mask-review .mask-tool{max-width:760px;margin:auto;background:#fff;border-radius:24px;padding:18px;display:grid;gap:14px;color-scheme:light}
#cresum-mask-review .mask-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#cresum-mask-review button,#cresum-mask-review select{font:inherit;font-size:15px;min-height:44px;padding:10px 13px;border:0;border-radius:12px;background:#f2f2f7;color:#171719}
#cresum-mask-review button[aria-pressed="true"]{background:#0a84ff;color:#fff}
#cresum-mask-review select{max-width:100%;flex:1;min-width:150px}
#cresum-mask-review .mask-image{display:block;width:100%;height:auto;max-height:670px}
#cresum-mask-review .mask-status{font-size:13px;line-height:19px;color:#606067}
#cresum-mask-review .mask-title{font-size:20px;font-weight:600}
#cresum-mask-review input[type="range"]{max-width:220px;flex:1;min-width:100px}
#cresum-mask-review .mask-preview-layer{mix-blend-mode:multiply;fill:#b02d35;stroke:#8f292e;stroke-width:0.8}
</style>
<div class="mask-tool">
<div class="mask-title">CRESUM · Слои мышц</div>
<div class="mask-controls"><button type="button" data-step="-1" aria-label="Предыдущая группа">←</button><select aria-label="Мышечная группа">${select}</select><button type="button" data-step="1" aria-label="Следующая группа">→</button></div>
<div class="mask-controls"><label for="mask-structure">Видимая часть</label><select id="mask-structure" data-structure-select aria-label="Видимая анатомическая часть"><option value="all">Все видимые части</option></select></div>
<div class="mask-controls" aria-label="Ракурс"><button type="button" data-view="both" aria-pressed="true">Оба</button><button type="button" data-view="front" aria-pressed="false">Спереди</button><button type="button" data-view="back" aria-pressed="false">Сзади</button></div>
<div class="mask-controls"><button type="button" data-mode="selected" aria-pressed="true">Один слой</button><button type="button" data-mode="all" aria-pressed="false">Все слои</button><button type="button" data-mode="none" aria-pressed="false">Исходник</button><label>Прозрачность <input type="range" min="0.15" max="0.9" step="0.05" value="0.6" aria-label="Непрозрачность масок"/></label></div>
<svg class="mask-image" viewBox="0 0 ${atlas.width} ${atlas.height}" role="img" aria-label="Манекен и независимые черновые маски мышечных групп"><image href="${atlas.source}" width="${atlas.width}" height="${atlas.height}"/>${atlas.groups.map((g) => `<g data-layer="${g.id}" class="mask-preview-layer" opacity="0.6">${parts(g)}</g>`).join('')}</svg>
<div class="mask-status" aria-live="polite" data-status></div>
<div class="mask-status">Черновые контуры для проверки границ. Цвет служит проверке слоёв и не показывает тренировочную нагрузку.</div>
</div>
<script>
(()=>{const root=document.getElementById('cresum-mask-review');const groups=${JSON.stringify(atlas.groups.map((g) => ({ id: g.id, label: g.label, views: g.regions.map((r) => r.view), refined: !!g.traceStatus, structures: [...new Map(g.regions.filter((r) => r.structureId).map((r) => [r.structureId, { id: r.structureId, label: r.structureLabel }])).values()] })))};const views=${JSON.stringify(atlas.views)};const select=root.querySelector('select'),structure=root.querySelector('[data-structure-select]');let mode='selected',view='both';
function syncParts(){const group=groups.find(g=>g.id===select.value);structure.replaceChildren(new Option('Все видимые части','all'),...group.structures.map(part=>new Option(part.label,part.id)));structure.disabled=group.structures.length===0;}
function draw(){root.querySelectorAll('[data-layer]').forEach(layer=>{layer.style.display=mode==='none'||mode==='selected'&&layer.dataset.layer!==select.value?'none':'';layer.setAttribute('opacity',root.querySelector('input').value);layer.querySelectorAll('[data-structure]').forEach(path=>path.style.display=mode==='selected'&&structure.value!=='all'&&path.dataset.structure!==structure.value?'none':'');});root.querySelector('svg').setAttribute('viewBox',view==='both'?'0 0 ${atlas.width} ${atlas.height}':views[view].viewBox.join(' '));root.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));root.querySelectorAll('button[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));const group=groups.find(g=>g.id===select.value);root.querySelector('[data-status]').textContent=group.label+' · '+group.id+' · '+(select.selectedIndex+1)+' / '+groups.length+(group.refined?' · 2D-проход 2':' · Первый черновой контур')+(view!=='both'&&!group.views.includes(view)?' · Слой доступен в другом ракурсе':'');}
select.addEventListener('change',()=>{syncParts();draw();});structure.addEventListener('change',draw);root.querySelector('input').addEventListener('input',draw);root.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{select.selectedIndex=(select.selectedIndex+Number(button.dataset.step)+groups.length)%groups.length;syncParts();draw()}));root.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;draw()}));root.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;draw()}));syncParts();draw();})();
</script></div>`;
fs.writeFileSync(path.join(directory, 'viewer.html'), markup);
console.log(
  `Exported ${ids.length} masks; source sha256 ${hash}; all coordinates preserved (${atlas.width}×${atlas.height}).`,
);
