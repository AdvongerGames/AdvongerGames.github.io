(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageVeils = new Map([
    ['the-great-exhibition.html', 'veil--gold'],
    ['realms-of-madness.html', 'veil--ripple'],
    ['observe.html', 'veil--crt'],
    ['open-the-gates.html', 'veil--gate'],
    ['the-atelier.html', 'veil--paint'],
    ['index.html', 'veil--archive'],
    ['', 'veil--archive'],
  ]);

  const ensureVeil = () => {
    let veil = document.getElementById('veil');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'veil';
      veil.className = 'veil';
      document.body.appendChild(veil);
    }
    return veil;
  };

  const addArrivalShade = () => {
    if (reducedMotion || document.querySelector('.arrive-shade')) return;
    const shade = document.createElement('div');
    shade.className = 'arrive-shade';
    document.body.appendChild(shade);
    shade.addEventListener('animationend', () => shade.remove(), { once: true });
  };

  const pageName = url => url.pathname.split('/').pop();
  const isPageNavigation = url => {
    if (url.origin !== location.origin) return false;
    const name = pageName(url);
    return name === '' || name.endsWith('.html');
  };

  const isSamePageHash = url => (
    url.origin === location.origin &&
    url.pathname === location.pathname &&
    url.search === location.search &&
    url.hash
  );

  const isArchivePage = url => {
    const name = pageName(url);
    return name === '' || name === 'index.html';
  };

  const currentPageVeil = () => pageVeils.get(pageName(location)) || 'veil--archive';

  const veilFor = (url, trigger) => {
    if (trigger?.dataset?.veil) return trigger.dataset.veil;
    if (isArchivePage(url)) return currentPageVeil();
    return pageVeils.get(pageName(url)) || 'veil--archive';
  };

  const delayFor = veilClass => {
    if (reducedMotion) return 0;
    /* the CRT line needs its full expand-and-collapse before the cut */
    return veilClass === 'veil--crt' ? 760 : 840;
  };

  const leaveFor = (href, veilClass) => {
    if (window.__archiveLeaving) return;
    window.__archiveLeaving = true;
    const veil = ensureVeil();
    veil.className = `veil ${veilClass} active`;
    setTimeout(() => {
      location.href = href;
    }, delayFor(veilClass));
  };

  window.ArchiveTransitions = { leaveFor, veilFor };

  addEventListener('pageshow', () => {
    window.__archiveLeaving = false;
    const veil = document.getElementById('veil');
    if (veil) veil.className = 'veil';
  });

  document.addEventListener('DOMContentLoaded', () => {
    ensureVeil();
    addArrivalShade();

    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;

      const url = new URL(link.getAttribute('href'), location.href);
      if (!isPageNavigation(url) || isSamePageHash(url)) return;

      e.preventDefault();
      leaveFor(url.href, veilFor(url, link));
    });
  });
})();
