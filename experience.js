// The Experience — vanilla JS port of the v2.1.3 prototype.
// Pointer-prediction field, three acts with chips, the lens, the glyph, the returned question.
// Nothing typed here leaves the browser: no requests, no storage.
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  var field = document.getElementById('field');
  var glyphC = document.getElementById('glyph');
  var lensBox = document.getElementById('lens');
  var under = document.getElementById('under');
  var dragChip = document.getElementById('drag-chip');
  var progress = document.getElementById('progress');
  var moveEl = document.getElementById('move');
  var textEl = document.getElementById('difficult');
  var qEl = document.getElementById('question') || document.querySelector('.question');
  var regenBtn = document.getElementById('regen');
  if (!field || !glyphC) return;

  var fx = field.getContext('2d');
  var gx = glyphC.getContext('2d');

  var actColors = {
    threshold: ['157,191,255', '255,141,120'],
    loop: ['157,191,255', '214,228,255'],
    under: ['213,151,86', '255,141,120'],
    futures: ['255,141,120', '141,124,255'],
    'return': ['255,141,120', '214,228,255']
  };
  var palettes = [['#9dbfff', '#d6e4ff'], ['#8d7cff', '#ff8d78'], ['#d59756', '#ffd0c4'], ['#87b8a0', '#d6e4ff'], ['#ff8d78', '#9dbfff']];
  var questions = ['Who is speaking?', 'Who is forming whom?', 'Can we still be alone?', 'What are we to each other?', 'What remains human?', 'Whose values ship?', 'What can we still check?', 'Who is deciding?'];

  var answers = {}, qi = 3;
  var act = 'threshold', textLen = 0, lensUsed = false, moved = false, burst = 0, rot = 0, t = 0;
  var W = window.innerWidth, H = window.innerHeight;
  var mouse = { x: W / 2, y: H / 2 }, pred = { x: W / 2, y: H / 2 };
  var trails = { a: [], p: [] };

  // --- Field canvas -------------------------------------------------------
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    var D = Math.min(window.devicePixelRatio || 1, 1.5);
    field.width = W * D; field.height = H * D;
    fx.setTransform(D, 0, 0, D, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function onMove(e) {
    var prev = mouse;
    mouse = { x: e.clientX, y: e.clientY };
    var vx = mouse.x - prev.x, vy = mouse.y - prev.y;
    var h = Math.max(2.5, 8 - Math.hypot(vx, vy) * .08);
    pred = { x: Math.max(0, Math.min(W, mouse.x + vx * h)), y: Math.max(0, Math.min(H, mouse.y + vy * h)) };
    trails.a.push({ x: mouse.x, y: mouse.y }); trails.p.push({ x: pred.x, y: pred.y });
    if (trails.a.length > 75) trails.a.shift();
    if (trails.p.length > 75) trails.p.shift();
    if (!moved && moveEl) { moved = true; moveEl.textContent = 'The system has begun to predict where you are going.'; }
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      var v = es.filter(function (e) { return e.isIntersecting; })
                .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (v) act = v.target.getAttribute('data-act');
    }, { rootMargin: '-35% 0px -35% 0px', threshold: [.05, .25, .5, .75] });
    Array.prototype.forEach.call(document.querySelectorAll('[data-act]'), function (s) { io.observe(s); });
  }

  function line(pts, color, w) {
    if (pts.length < 2) return;
    fx.beginPath(); fx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) fx.lineTo(pts[i].x, pts[i].y);
    fx.strokeStyle = color; fx.lineWidth = w; fx.lineCap = 'round'; fx.stroke();
  }

  function setLens(px, py) {
    if (under) under.style.clipPath = 'circle(90px at ' + px + '% ' + py + '%)';
  }

  // --- Glyph --------------------------------------------------------------
  function drawGlyph() {
    var entry = answers.entry, change = answers.change;
    var pal = palettes[(entry == null ? 0 : entry) % palettes.length];
    var loops = 2 + (change == null ? 2 : change) * 1.3;
    var arms = 3 + (entry == null ? 1 : entry);
    var amp = 10 + Math.min(34, textLen * .4);
    var scale = 1 + burst * .22;
    gx.clearRect(0, 0, 700, 700);
    gx.save(); gx.translate(350, 350); gx.rotate(rot + burst * .5); gx.scale(scale, scale);
    for (var k = 0; k < arms; k++) {
      gx.beginPath();
      for (var i = 0; i < 260; i++) {
        var q = i / 259 * Math.PI * 2 * loops;
        var r = 52 + i * .72 + k * 10 + Math.sin(q * 2 + k) * amp;
        var x = Math.cos(q + k * .35) * r, y = Math.sin(q) * r * .63;
        if (i === 0) gx.moveTo(x, y); else gx.lineTo(x, y);
      }
      var col = k % 2 ? pal[1] : pal[0];
      gx.strokeStyle = col + Math.round(120 + burst * 120).toString(16).padStart(2, '0');
      gx.lineWidth = 2.2 - k * .2; gx.shadowBlur = 8 + burst * 30; gx.shadowColor = col;
      gx.stroke();
    }
    gx.restore();
  }

  // --- Main loop ----------------------------------------------------------
  function loop() {
    t += .006;
    fx.clearRect(0, 0, W, H);
    var c = actColors[act] || actColors.threshold, a = c[0], b = c[1];
    var g = fx.createRadialGradient(pred.x, pred.y, 0, pred.x, pred.y, Math.max(W, H) * .55);
    g.addColorStop(0, 'rgba(' + a + ',.16)'); g.addColorStop(.45, 'rgba(' + b + ',.045)'); g.addColorStop(1, 'rgba(3,4,7,0)');
    fx.fillStyle = g; fx.fillRect(0, 0, W, H);
    if (!reduce) {
      line(trails.p, 'rgba(' + a + ',.42)', 1.2);
      line(trails.a, 'rgba(' + b + ',.68)', 1.6);
    }
    if (!lensUsed && !reduce) setLens(50 + Math.sin(t * 14) * 30, 50 + Math.cos(t * 10) * 26);
    if (burst > .02) { burst = reduce ? 0 : burst * .93; drawGlyph(); }
    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);
  drawGlyph();

  // --- Act I: chips and text ----------------------------------------------
  function answer(key, i) { rot += Math.PI / 5; burst = 1; answers[key] = i; drawGlyph(); }
  function chips(key, list, accent) {
    var box = document.querySelector('[data-chips="' + key + '"]');
    if (!box) return;
    list.forEach(function (label, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = label;
      b.style.setProperty('--accent', accent); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        answer(key, i);
      });
      box.appendChild(b);
    });
  }
  chips('entry', ['after the thought', 'while the question forms', 'before I notice', 'without my choosing'], '#8d7cff');
  chips('change', ['my pace', 'my standards', 'my patience', 'my relationships', 'I do not know yet'], '#9dbfff');
  if (textEl) textEl.addEventListener('input', function (e) { textLen = e.target.value.length; burst = Math.max(burst, .25); });

  // --- Act II: the lens -----------------------------------------------------
  function lensAt(px, py) {
    setLens(px, py);
    if (!lensUsed) { lensUsed = true; if (dragChip) dragChip.style.opacity = '0'; }
  }
  var lensPos = { x: 50, y: 50 };
  if (lensBox) {
    var onLens = function (e) {
      var r = lensBox.getBoundingClientRect();
      lensPos = { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
      lensAt(lensPos.x, lensPos.y);
    };
    lensBox.addEventListener('pointermove', onLens);
    lensBox.addEventListener('pointerdown', onLens);
    lensBox.addEventListener('keydown', function (e) {
      var step = 6, k = e.key;
      if (k === 'ArrowLeft') lensPos.x -= step; else if (k === 'ArrowRight') lensPos.x += step;
      else if (k === 'ArrowUp') lensPos.y -= step; else if (k === 'ArrowDown') lensPos.y += step;
      else return;
      e.preventDefault();
      lensPos.x = Math.max(0, Math.min(100, lensPos.x)); lensPos.y = Math.max(0, Math.min(100, lensPos.y));
      lensAt(lensPos.x, lensPos.y);
    });
  }

  // --- The return -----------------------------------------------------------
  function showQ() { if (qEl) qEl.textContent = questions[qi]; }
  if (regenBtn) regenBtn.addEventListener('click', function () {
    rot += Math.PI / 5; burst = 1; qi = (qi + 1) % questions.length; showQ(); drawGlyph();
  });
  showQ();

  // --- Reduced motion / touch -----------------------------------------------
  if (reduce) setLens(50, 50);
  if (coarse && moveEl) moveEl.textContent = 'Touch and move.';
})();
