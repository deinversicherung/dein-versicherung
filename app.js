document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const select = document.getElementById('screenSelect');
  const screen = document.getElementById('screen');
  if (!select || !screen) return;

  function normalizeToHtmlFile(nameOrFile) {
    const s = String(nameOrFile || '');
    return s.toLowerCase().endsWith('.html') ? s : (s + '.html');
  }

  function getRequestedFileFromUrl() {
    const url = new URL(window.location.href);

    // Case 1: redirect từ 404.html -> index.html?route=/repo/Drohnen-Versicherung.html
    const route = url.searchParams.get('route');
    if (route) {
      try {
        const u = new URL(route, window.location.origin);
        const last = u.pathname.split('/').pop() || '';
        if (last && last !== 'index.html' && last.toLowerCase().endsWith('.html')) return last;
      } catch (e) {}
    }

    // Case 2: truy cập trực tiếp /.../Drohnen-Versicherung.html
    const last = window.location.pathname.split('/').pop() || '';
    if (last && last !== 'index.html' && last.toLowerCase().endsWith('.html')) return last;

    return '';
  }

  function setUrlToFile(file) {
    // giữ cùng thư mục repo, chỉ đổi segment cuối
    const basePath = window.location.pathname.replace(/[^/]*$/, '');
    const newPath = basePath + file;
    window.history.pushState({ file }, '', newPath);
  }

  async function loadPageFile(file) {
    if (!file) {
      screen.innerHTML = '<p class="placeholder">Bitte wählen Sie oben eine Seite aus.</p>';
      return;
    }

    screen.innerHTML = `<p class="placeholder">Laden: pages/${file}</p>`;

    try {
      const res = await fetch(`pages/${file}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Die Seite pages/${file} konnte nicht geladen werden.`);
      const html = await res.text();
      screen.innerHTML = html;
    } catch (err) {
      console.error(err);
      screen.innerHTML = `<p class="placeholder">${err.message}</p>`;
    }
  }

  function setDropdownSelected(file) {
    const options = Array.from(select.options);
    const idx = options.findIndex(o => (o.value || '').toLowerCase() === (file || '').toLowerCase());
    if (idx >= 0) select.selectedIndex = idx;
  }

  // Load menu từ pages.json
  fetch('pages.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('pages.json konnte nicht geladen werden.');
      return r.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data.pages)) throw new Error('Ungültiges Format in pages.json.');

      data.pages.forEach(item => {
        const file = normalizeToHtmlFile(item);

        const opt = document.createElement('option');
        opt.value = file;

        const labelBase = String(item).replace(/\.html$/i, '');
        opt.textContent = labelBase
          .split('-')
          .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
          .join(' ');

        select.appendChild(opt);
      });

      // Nếu URL đang chỉ vào một file, auto load
      const initialFile = getRequestedFileFromUrl();
      if (initialFile) {
        setDropdownSelected(initialFile);
        loadPageFile(initialFile);

        // Nếu đang ở index.html?route=..., dọn URL về /TênFile.html
        const url = new URL(window.location.href);
        if (url.searchParams.get('route')) {
          setUrlToFile(initialFile);
          url.searchParams.delete('route');
        }
      } else {
        loadPageFile('');
      }
    })
    .catch(err => {
      console.error(err);
      screen.innerHTML = `<p class="placeholder">${err.message}</p>`;
    });

  // Dropdown change -> đổi URL + load nội dung
  select.addEventListener('change', function () {
    const file = select.value;
    if (!file) return;
    setUrlToFile(file);
    loadPageFile(file);
  });

  // Back/Forward
  window.addEventListener('popstate', function () {
    const file = getRequestedFileFromUrl();
    if (file) {
      setDropdownSelected(file);
      loadPageFile(file);
    } else {
      loadPageFile('');
    }
  });
});
