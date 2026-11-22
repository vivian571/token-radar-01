// Token Launch Radar — renders window.RADAR: the board, its filters, and one detail view.
// No network: every byte the page shows comes from data.js beside it.
(function () {
  var R = window.RADAR;
  if (!R) { document.body.insertAdjacentHTML('beforeend', '<p style="padding:20px">Radar data (data.js) did not load.</p>'); return; }

  var params = new URLSearchParams(location.search);
  var rowsEl = document.getElementById('rows');
  var detailEl = document.getElementById('detail');
  var wrapEl = document.querySelector('.board-wrap');
  var watchlist = new Set(R.rows.filter(function (r) { return r.watchlist; }).map(function (r) { return r.slug; }));

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function money(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(v) {
    if (v === null || v === undefined) return '—';
    return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  }
  function age(v) {
    if (v === null || v === undefined) return '—';
    if (v < 365) return v + 'd';
    return (v / 365).toFixed(1) + 'y';
  }

  // Stats
  var implied = R.rows.map(function (r) { return r.implied_value_usd; }).sort(function (a, b) { return a - b; });
  var medianImplied = implied[Math.floor(implied.length / 2)];
  document.getElementById('asOf').textContent = R.as_of;
  document.getElementById('stats').innerHTML =
    '<div class="stat"><b>' + R.board_size + '</b><span>protocols ranked</span></div>' +
    '<div class="stat"><b>' + R.watchlist_size + '</b><span>watchlist covered</span></div>' +
    '<div class="stat"><b>' + R.early_size + '</b><span>early rows beyond the watchlist</span></div>' +
    '<div class="stat"><b>' + money(medianImplied) + '</b><span>median implied value</span></div>';
  document.getElementById('source').textContent = 'Data: ' + R.source + '. Model ' + R.model_version +
    ': implied = TVL × category ratio × growth × age. The snapshot is frozen; the radar re-scores it the same way on every run.';

  // Filter options, from the rows themselves.
  function fillSelect(id, values) {
    var el = document.getElementById(id);
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v; el.appendChild(o);
    });
  }
  fillSelect('category', Array.from(new Set(R.rows.map(function (r) { return r.category || 'Uncategorised'; }))).sort());
  fillSelect('chain', Array.from(new Set(R.rows.flatMap(function (r) { return r.chains; }))).sort());

  // Controls, seeded from the URL so a link opens one state of the page.
  var qEl = document.getElementById('q');
  var catEl = document.getElementById('category');
  var chainEl = document.getElementById('chain');
  var wlEl = document.getElementById('watchlistOnly');
  var sortEl = document.getElementById('sort');
  qEl.value = params.get('q') || '';
  catEl.value = params.get('category') || '';
  chainEl.value = params.get('chain') || '';
  wlEl.checked = params.get('watchlist') === '1';
  sortEl.value = params.get('sort') || 'rank';
  var selectedSlug = params.get('slug') || null;

  function filtered() {
    var q = qEl.value.trim().toLowerCase();
    var cat = catEl.value;
    var chain = chainEl.value;
    var list = R.rows.filter(function (r) {
      if (q && (r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0)) return false;
      if (cat && (r.category || 'Uncategorised') !== cat) return false;
      if (chain && r.chains.indexOf(chain) < 0) return false;
      if (wlEl.checked && !r.watchlist) return false;
      return true;
    });
    var sort = sortEl.value;
    if (sort === 'tvl') list.sort(function (a, b) { return b.tvl_usd - a.tvl_usd; });
    else if (sort === 'growth') list.sort(function (a, b) { return (b.change_7d ?? -1e9) - (a.change_7d ?? -1e9); });
    else if (sort === 'age') list.sort(function (a, b) { return (b.age_days ?? -1) - (a.age_days ?? -1); });
    else list.sort(function (a, b) { return a.rank - b.rank; });
    return list;
  }

  function render() {
    var list = filtered();
    document.getElementById('count').textContent =
      'Showing ' + list.length + ' of ' + R.rows.length + ' protocols · ' + R.watchlist_size + ' on the watchlist';
    rowsEl.innerHTML = list.map(function (r) {
      var cls = r.change_7d === null ? '' : (r.change_7d >= 0 ? 'pos' : 'neg');
      return '<tr data-slug="' + esc(r.slug) + '"' + (r.slug === selectedSlug ? ' class="selected"' : '') + '>' +
        '<td class="num rank">' + r.rank + '</td>' +
        '<td class="name">' + esc(r.name) + (r.watchlist ? '<span class="wl">watchlist</span>' : '') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 3).join(', ') || '—') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + cls + '">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + age(r.age_days) + '</td>' +
        '<td class="num"><strong>' + money(r.implied_value_usd) + '</strong></td></tr>';
    }).join('');
    renderDetail();
  }

  function renderDetail() {
    var r = R.rows.find(function (x) { return x.slug === selectedSlug; });
    if (!r) { detailEl.hidden = true; wrapEl.classList.remove('with-detail'); return; }
    detailEl.hidden = false;
    wrapEl.classList.add('with-detail');
    detailEl.innerHTML =
      '<button class="close" id="closeDetail">Close</button>' +
      '<h3>' + esc(r.name) + '</h3>' +
      '<p class="sub">Rank #' + r.rank + ' · ' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ') || 'no chain listed') + '</p>' +
      '<dl class="kv">' +
      '<dt>Implied value</dt><dd><strong>' + money(r.implied_value_usd) + '</strong></dd>' +
      '<dt>TVL</dt><dd>' + money(r.tvl_usd) + '</dd>' +
      '<dt>7-day change</dt><dd>' + pct(r.change_7d) + '</dd>' +
      '<dt>Tracked since</dt><dd>' + esc(r.listed_at || '—') + ' (' + age(r.age_days) + ')</dd>' +
      '<dt>Token recorded</dt><dd>none — pre-token</dd>' +
      '</dl>' +
      '<p class="math">' + money(r.tvl_usd) + ' TVL &times; ' + r.category_ratio.toFixed(3) +
      ' category ratio &times; ' + r.growth_multiplier.toFixed(2) + ' growth &times; ' +
      r.age_multiplier.toFixed(2) + ' age = <b>' + money(r.implied_value_usd) + '</b></p>' +
      '<h4>How to farm it</h4><ol>' +
      r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ol>';
    document.getElementById('closeDetail').addEventListener('click', function () {
      selectedSlug = null; syncUrl(); render();
    });
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (qEl.value.trim()) p.set('q', qEl.value.trim());
    if (catEl.value) p.set('category', catEl.value);
    if (chainEl.value) p.set('chain', chainEl.value);
    if (wlEl.checked) p.set('watchlist', '1');
    if (sortEl.value !== 'rank') p.set('sort', sortEl.value);
    if (selectedSlug) p.set('slug', selectedSlug);
    var s = p.toString();
    history.replaceState(null, '', s ? '?' + s : location.pathname);
  }

  rowsEl.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (!tr) return;
    selectedSlug = tr.getAttribute('data-slug');
    syncUrl(); render();
    detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  [qEl, catEl, chainEl, wlEl, sortEl].forEach(function (el) {
    el.addEventListener('input', function () { syncUrl(); render(); });
    el.addEventListener('change', function () { syncUrl(); render(); });
  });

  // Live-token view: the market's own values, never mixed into the ranked board.
  document.getElementById('liveRows').innerHTML = R.live.map(function (p) {
    var cls = p.change_7d === null ? '' : (p.change_7d >= 0 ? 'pos' : 'neg');
    return '<tr><td class="name">' + esc(p.name) + '</td><td>' + esc(p.category || '—') + '</td>' +
      '<td class="num">' + money(p.tvl_usd) + '</td>' +
      '<td class="num"><strong>' + money(p.mcap_usd) + '</strong></td>' +
      '<td class="num ' + cls + '">' + pct(p.change_7d) + '</td></tr>';
  }).join('');

  render();
})();
