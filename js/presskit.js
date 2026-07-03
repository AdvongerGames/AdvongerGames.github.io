/* ============================================================
   ADVONGER GAMES - press kit behaviour
   Expects window.PRESSKIT = {
     game:    'Observe',
     zipName: 'observe-presskit',
     groups:  [{ title: 'Screenshots', files: ['path/one.jpg', ...] }, ...]
   }
   ============================================================ */
(() => {
  const cfg = window.PRESSKIT;
  if (!cfg) return;

  const basename = p => p.split('/').pop();

  /* ---- asset grids ---- */
  const wrap = document.getElementById('pk-asset-groups');
  if (wrap) {
    cfg.groups.forEach(group => {
      const sec = document.createElement('div');
      sec.className = 'pk-group';
      const h = document.createElement('h3');
      h.textContent = group.title + ' ';
      const count = document.createElement('span');
      count.className = 'pk-count';
      count.textContent = group.files.length + (group.files.length === 1 ? ' file' : ' files');
      h.appendChild(count);
      sec.appendChild(h);

      const grid = document.createElement('div');
      grid.className = 'pk-assets';
      group.files.forEach(path => {
        const url = encodeURI(path);
        const name = basename(path);
        const card = document.createElement('figure');
        card.className = 'pk-asset';
        card.innerHTML = `
          <a class="pk-thumb" href="${url}" target="_blank" rel="noopener" title="Open full size">
            <img src="${url}" loading="lazy" alt="${cfg.game} press asset: ${name}">
          </a>
          <figcaption>
            <span class="pk-fname" title="${name}">${name}</span>
            <a class="pk-dl" href="${url}" download>Download</a>
          </figcaption>`;
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  /* ---- copy-to-clipboard for marketing copy ---- */
  document.querySelectorAll('.pk-copybtn').forEach(btn => {
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      const source = document.getElementById(btn.dataset.copy);
      if (!source) return;
      const text = source.innerText.trim();
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied ✓';
      } catch {
        /* clipboard unavailable: select the text so Ctrl+C works */
        const range = document.createRange();
        range.selectNodeContents(source);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        btn.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { btn.textContent = original; }, 2200);
    });
  });

  /* ---- download everything as one zip ---- */
  const zipBtn = document.getElementById('pk-zip');
  if (!zipBtn) return;
  const idleLabel = zipBtn.textContent;
  let busy = false;

  const loadJSZip = () => new Promise((resolve, reject) => {
    if (window.JSZip) return resolve(window.JSZip);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload = () => resolve(window.JSZip);
    s.onerror = () => reject(new Error('Could not load the ZIP library'));
    document.head.appendChild(s);
  });

  zipBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      const root = zip.folder(cfg.zipName);
      const jobs = [];
      cfg.groups.forEach(g => g.files.forEach(f => jobs.push({ folder: g.title, path: f })));

      let done = 0;
      zipBtn.textContent = `Fetching assets… 0 / ${jobs.length}`;
      for (const job of jobs) {
        const resp = await fetch(encodeURI(job.path));
        if (!resp.ok) throw new Error('Failed to fetch ' + job.path);
        root.folder(job.folder).file(basename(job.path), await resp.blob());
        zipBtn.textContent = `Fetching assets… ${++done} / ${jobs.length}`;
      }

      zipBtn.textContent = 'Packing ZIP…';
      /* images are already compressed - store them for speed */
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = cfg.zipName + '.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      zipBtn.textContent = 'Done - check your downloads';
    } catch (err) {
      console.error(err);
      zipBtn.textContent = 'ZIP failed - use the links below';
    }
    setTimeout(() => { zipBtn.textContent = idleLabel; busy = false; }, 4000);
  });
})();
