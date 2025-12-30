document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const select = document.getElementById('screenSelect');
  const screen = document.getElementById('screen');
  if (!select || !screen) return;

  let pages = [];

  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (_) { return s; }
  }

  function getFileFromCurrentUrl() {
    // Ưu tiên route từ 404.html -> index.html?route=...
    const url = new URL(window.location.href);
    const route = url.searchParams.get('route');

    const pickLast = (pathname) => {
      const last = (pathname.split('/').pop() || '').trim();
      if (!last || last.toLowerCase() === 'index.html') return '';
      if (!last.toLowerCase().endsWith('.html')) return '';
      return safeDecode(last);
    };

    if (route) {
      try {
        const u = new URL(route, window.location.origin);
        const f = pickLast(u.pathname);
        if (f) return f;
      } catch (_) {}
    }

    return pickLast(window.location.pathname);
  }

  function setUrlToFile(file) {
    // đổi segment cuối của URL trong cùng thư mục repo
    const base = window.location.pathname.replace(/[^/]*$/, '');
    const nextPath = base + encodeURIComponent(file).replace(/%2F/g, '/');
    window.history.pushState({ file }, '', nextPath);
  }

  async function loadFragment(file) {
    if (!file) {
      screen.innerHTML = '<p class="placeholder">Bitte oben eine Seite auswählen.</p>';
      return;
    }

    screen.innerHTML = `<p class="placeholder">Laden: pages/${file}</p>`;

    try {
      const res = await fetch(`pages/${encodeURIComponent(file)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Inhalt konnte nicht geladen werden: pages/${file}`);
      const html = await res.text();
      screen.innerHTML = html;
    } catch (err) {
      console.error(err);
      screen.innerHTML = `<p class="placeholder">${err.message}</p>`;
    }
  }

  function fillDropdown() {
    // clear giữ option đầu
    while (select.options.length > 1) select.remove(1);

    const currentFile = getFileFromCurrentUrl();

    pages.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.file;
      opt.textContent = p.label;
      if (currentFile && p.file.toLowerCase() === currentFile.toLowerCase()) opt.selected = true;
      select.appendChild(opt);
    });

    if (currentFile) {
      // Nếu vào từ index.html?route=..., dọn query trên thanh địa chỉ
      const url = new URL(window.location.href);
      if (url.searchParams.get('route')) {
        setUrlToFile(currentFile);
      }
      loadFragment(currentFile);
    } else {
      loadFragment('');
    }
  }

  // Load pages.json
  fetch('pages.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('pages.json konnte nicht geladen werden.');
      return r.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data.pages)) throw new Error('Ungültiges pages.json-Format.');
      pages = data.pages.map(x => ({ label: x.label, file: x.file }));
      fillDropdown();
    })
    .catch(err => {
      console.error(err);
      screen.innerHTML = `<p class="placeholder">${err.message}</p>`;
    });

  // Dropdown change: đổi URL thật + load fragment
  select.addEventListener('change', function () {
    const file = select.value;
    if (!file) return;
    setUrlToFile(file);
    loadFragment(file);
  });

  // Back/Forward
  window.addEventListener('popstate', function () {
    const file = getFileFromCurrentUrl();
    if (file) {
      // đồng bộ dropdown
      for (const opt of select.options) {
        if ((opt.value || '').toLowerCase() === file.toLowerCase()) {
          opt.selected = true;
          break;
        }
      }
      loadFragment(file);
    } else {
      loadFragment('');
    }
  });
});
