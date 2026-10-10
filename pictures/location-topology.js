(function () {
  var root = document.getElementById('az-topology');
  if (!root) return;
  var scopes = {
    h: { ids: 'h t bar g wg a wa r1 r2 b wb r3 r4 f wf r11', color: '#a855f7', bg: '#f3e8ff', title: 'BAR - Hospital', detail: 'Rooms 1, 2, 3, 4 and 11' },
    g: { ids: 'g wg a wa r1 r2 b wb r3 r4', color: '#16a34a', bg: '#dcfce7', title: 'Ground Floor Display', detail: 'Rooms 1, 2, 3 and 4' },
    a: { ids: 'a wa r1 r2', color: '#0d9488', bg: '#ccfbf1', title: 'Waiting Room A - Wing A', detail: 'Rooms 1 and 2' },
    b: { ids: 'b wb r3 r4', color: '#2563eb', bg: '#dbeafe', title: 'Waiting Room B - Wing B', detail: 'Rooms 3 and 4' },
    f: { ids: 'f wf r11', color: '#d97706', bg: '#fef3c7', title: 'Waiting Room 11 - First Floor', detail: 'Room 11' }
  };
  var selected = null;
  function render(key) {
    var s = scopes[key];
    root.querySelectorAll('[data-id]').forEach(function (node) {
      node.classList.remove('active', 'dim');
      node.style.removeProperty('--scope-bg');
      node.style.removeProperty('--scope-color');
      if (!s) return;
      if (s.ids.split(' ').indexOf(node.dataset.id) < 0) node.classList.add('dim');
      else {
        node.classList.add('active');
        node.style.setProperty('--scope-bg', s.bg);
        node.style.setProperty('--scope-color', s.color);
      }
    });
    root.querySelector('.heading').textContent = s ? s.title : 'Select a waiting-room monitor';
    root.querySelector('.detail').textContent = s ? 'Covered: ' + s.detail : 'Highlighted Rooms receive calls within the selected monitor scope.';
    root.querySelectorAll('[data-scope]').forEach(function (node) {
      node.setAttribute('aria-pressed', String(selected === node.dataset.scope));
    });
  }
  root.querySelectorAll('[data-scope]').forEach(function (node) {
    node.addEventListener('mouseenter', function () { if (!selected) render(node.dataset.scope); });
    node.addEventListener('mouseleave', function () { if (!selected) render(null); });
    node.addEventListener('focus', function () { if (!selected) render(node.dataset.scope); });
    node.addEventListener('blur', function () { if (!selected) render(null); });
    node.addEventListener('click', function () {
      selected = selected === node.dataset.scope ? null : node.dataset.scope;
      render(selected);
    });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); }
    });
  });
  root.addEventListener('mouseleave', function () { if (!selected) render(null); });
})();
