document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const select = document.getElementById('screenSelect');
  const screen = document.getElementById('screen');

  if (!select || !screen) return;

  fetch('pages.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('pages.json konnte nicht geladen werden.');
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data.pages)) {
        throw new Error('Ungültiges Format. Erwartet wird: { "pages": [...] }');
      }

      data.pages.forEach(name => {
        const raw = String(name);
        const file = raw.toLowerCase().endsWith('.html') ? raw : `${raw}.html`;

        const option = document.createElement('option');
        option.value = file;

        const labelBase = raw.replace(/\.html$/i, '');
        option.textContent = labelBase
          .split('-')
          .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
          .join(' ');

        select.appendChild(option);
      });

      select.addEventListener('change', function () {
        const file = select.value;
        if (!file) return;

        screen.innerHTML = `<div class="placeholder">Laden: pages/${file}</div>`;

        fetch(`pages/${file}`, { cache: 'no-store' })
          .then(r => {
            if (!r.ok) throw new Error(`Die Seite pages/${file} konnte nicht geladen werden.`);
            return r.text();
          })
          .then(html => {
            screen.innerHTML = html;
          })
          .catch(err => {
            console.error(err);
            screen.innerHTML = `<div class="placeholder">${err.message}</div>`;
          });
      });
    })
    .catch(err => {
      console.error(err);
      screen.innerHTML = `<div class="placeholder">${err.message}</div>`;
    });
});
