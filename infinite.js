// Infinite homepage canvas: the project grid repeats in every direction.
(function () {
  var viewport = document.querySelector('.infinite-viewport');
  if (!viewport) return;
  var world = viewport.querySelector('.infinite-world');
  var tile = world.querySelector('.archive-container');

  // Make 3 copies so a 2 x 2 block of tiles always covers the screen
  for (var i = 0; i < 3; i++) {
    var copy = tile.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
    world.appendChild(copy);
  }
  world.querySelectorAll('video').forEach(function (v) {
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  });

  var header = document.querySelector('.title-container');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var periodX = 1, periodY = 1;
  var x = 0, y = 0;               // how far we've travelled
  var vx = 0, vy = 0;             // momentum after a swipe
  var started = false;

  function gap() {
    return parseFloat(getComputedStyle(world).columnGap) || 0;
  }

  function measure() {
    var g = gap();
    periodX = tile.offsetWidth + g;
    periodY = tile.offsetHeight + g;
    if (!started && periodX > 1 && periodY > 1) {
      // Start where the old page started: left margin, first row under the header
      var left = window.innerWidth <= 768 ? window.innerWidth * 0.05 : 25;
      x = -left;
      y = -(header ? header.offsetHeight : 0);
      started = true;
    }
    render();
  }

  function wrap(v, p) { return ((v % p) + p) % p; }

  function render() {
    var tx = wrap(x, periodX);
    var ty = wrap(y, periodY);
    world.style.transform = 'translate3d(' + (-tx) + 'px,' + (-ty) + 'px,0)';
  }

  // Keep the project-name label in sync with whatever card is under the cursor
  var mouseX = -1, mouseY = -1, tipTimer = null;
  window.addEventListener('mousemove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });

  function nudgeTooltip() {
    var tip = document.querySelector('.coupontooltip');
    if (!tip) return;
    tip.style.visibility = 'hidden';
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      if (mouseX < 0) return;
      var el = document.elementFromPoint(mouseX, mouseY);
      var card = el && el.closest ? el.closest('.card') : null;
      if (card && card.getAttribute('data-tooltip')) {
        tip.textContent = card.getAttribute('data-tooltip');
        tip.style.visibility = 'visible';
      }
    }, 150);
  }

  function moveBy(dx, dy) {
    x += dx;
    y += dy;
    render();
    nudgeTooltip();
  }

  // Mouse wheel / trackpad
  window.addEventListener('wheel', function (e) {
    e.preventDefault();
    var scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    var dx = e.deltaX * scale;
    var dy = e.deltaY * scale;
    if (e.shiftKey && dx === 0) { dx = dy; dy = 0; }  // shift + wheel goes sideways
    vx = vy = 0;
    moveBy(dx, dy);
  }, { passive: false });

  // Drag / swipe with a little momentum
  var dragging = false, moved = false, lastX = 0, lastY = 0, lastT = 0, pointerId = null;

  viewport.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    moved = false;
    pointerId = e.pointerId;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vx = vy = 0;
  });

  window.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    var dx = lastX - e.clientX;
    var dy = lastY - e.clientY;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!moved) {
      moved = true;
      try { viewport.setPointerCapture(pointerId); } catch (err) {}
    }
    var now = performance.now();
    var dt = Math.max(now - lastT, 1);
    vx = dx / dt * 16; vy = dy / dt * 16;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    moveBy(dx, dy);
  });

  function endDrag(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    if (performance.now() - lastT > 80) vx = vy = 0;  // paused before letting go
    if (moved && !reduceMotion) requestAnimationFrame(glide);
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  function glide() {
    if (dragging) return;
    vx *= 0.94; vy *= 0.94;
    if (Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) { vx = vy = 0; return; }
    moveBy(vx, vy);
    requestAnimationFrame(glide);
  }

  // A drag shouldn't open a project
  viewport.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
  viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // Keyboard
  window.addEventListener('keydown', function (e) {
    var step = 80, page = window.innerHeight * 0.85;
    var map = {
      ArrowDown: [0, step], ArrowUp: [0, -step],
      ArrowRight: [step, 0], ArrowLeft: [-step, 0],
      PageDown: [0, page], PageUp: [0, -page], ' ': [0, e.shiftKey ? -page : page]
    };
    var d = map[e.key];
    if (!d) return;
    e.preventDefault();
    moveBy(d[0], d[1]);
  });

  // Re-measure as images load and when the window changes size
  if (window.ResizeObserver) new ResizeObserver(measure).observe(tile);
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
})();
