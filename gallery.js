/* ==========================================================
   GALLERY — an endless square grid of every image on the site.
   The grid goes on forever in every direction; each square shows a
   randomly chosen image (the same square always shows the same image,
   and neighbouring squares never repeat each other).
   Only squares near the screen are kept on the page, so it stays smooth.
   Images are shown whole at their original proportions (never cropped).
   ========================================================== */
(function () {
    const IMAGES = window.GALLERY_IMAGES || [];
    const world = document.getElementById('gallery-world');
    const stage = document.getElementById('gallery');
    if (!IMAGES.length || !world) return;

    /* ---------- seeded random so the layout is the same on every visit ---------- */
    let seed = 20261012;
    function rand() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    }
    function between(a, b) { return a + rand() * (b - a); }

    /* ---------- square grid (same idea as the homepage tiles) ---------- */
    const isSmallScreen = window.innerWidth < 769;
    const CELL = isSmallScreen ? 150 : 260;   // square size
    const GAP = isSmallScreen ? 10 : 14;      // space between squares
    const STEP = CELL + GAP;
    const N = IMAGES.length;

    /* random but fixed order of images, so each square's image stays the same when you come back */
    const order = IMAGES.map(function (_, i) { return i; });
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
    /* the square in the centre of the screen when the gallery opens always shows this image */
    const CENTER_IMAGE = 'projects/herefornow16.jpg';
    const ci = IMAGES.findIndex(function (d) { return d[0] === CENTER_IMAGE; });
    if (ci >= 0) { const at = order.indexOf(ci); order[at] = order[0]; order[0] = ci; }
    /* each row is shifted by a different amount, so neighbours (left/right and above/below) are never the same image */
    const ROW_SHIFT = 37;

    /* no two images from the same project side by side: a square's neighbours (left/right, above/below
       and diagonal) sit at these distances in the order list, so shuffle until none of them share a project */
    (function separateProjects() {
        const OFFSETS = [1, ROW_SHIFT - 1, ROW_SHIFT, ROW_SHIFT + 1];
        const proj = function (k) { return IMAGES[order[((k % N) + N) % N]][3]; };
        function clashes(k) {
            let c = 0;
            for (const o of OFFSETS) {
                if (proj(k) === proj(k + o)) c++;
                if (proj(k) === proj(k - o)) c++;
            }
            return c;
        }
        for (let pass = 0; pass < 200; pass++) {
            let bad = 0;
            for (let k = 1; k < N; k++) {                    // order[0] stays: it's the centre image
                if (!clashes(k)) continue;
                bad++;
                for (let tries = 0; tries < 60; tries++) {
                    const j = 1 + Math.floor(rand() * (N - 1));
                    const before = clashes(k) + clashes(j);
                    let t = order[k]; order[k] = order[j]; order[j] = t;
                    if (clashes(k) + clashes(j) < before) break;
                    t = order[k]; order[k] = order[j]; order[j] = t;   // no better: swap back
                }
            }
            if (!bad) break;
        }
    })();
    function imageFor(col, row) {
        const k = ((col + row * ROW_SHIFT) % N + N) % N;
        return IMAGES[order[k]];
    }

    /* ---------- camera + smooth movement ---------- */
    let camX = -window.innerWidth / 2 + STEP * 0.5, camY = -window.innerHeight / 2 + STEP * 0.5;
    let targetX = camX, targetY = camY;
    let velX = 0, velY = 0;
    let dragging = false, moved = 0, lastX = 0, lastY = 0, lastT = 0;

    stage.addEventListener('wheel', function (e) {
        if (e.ctrlKey) return;                           // keep pinch / ctrl-zoom working
        e.preventDefault();
        const unit = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? window.innerHeight : 1);
        let dx = e.deltaX * unit, dy = e.deltaY * unit;
        if (e.shiftKey && !dx) { dx = dy; dy = 0; }      // shift + mouse wheel scrolls sideways
        targetX += dx; targetY += dy;
        velX = velY = 0;
    }, { passive: false });

    stage.addEventListener('pointerdown', function (e) {
        dragging = true; moved = 0;
        lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
        velX = velY = 0;
        stage.classList.add('is-dragging');
        stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        const now = performance.now(), dt = Math.max(1, now - lastT);
        moved += Math.abs(dx) + Math.abs(dy);
        targetX -= dx; targetY -= dy;
        velX = 0.8 * velX + 0.2 * (-dx / dt * 16);
        velY = 0.8 * velY + 0.2 * (-dy / dt * 16);
        lastX = e.clientX; lastY = e.clientY; lastT = now;
    });
    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove('is-dragging');
        if (performance.now() - lastT > 80) { velX = velY = 0; }   // stopped before letting go: no glide
        // a tap (not a drag) on an image opens its project
        if (moved < 6) {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const img = el && el.closest && el.closest('.g-item');
            if (img && img.dataset.href) window.location.href = img.dataset.href;
        }
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', function () { dragging = false; stage.classList.remove('is-dragging'); });

    window.addEventListener('keydown', function (e) {
        const step = 120;
        if (e.key === 'ArrowLeft') targetX -= step;
        else if (e.key === 'ArrowRight') targetX += step;
        else if (e.key === 'ArrowUp') targetY -= step;
        else if (e.key === 'ArrowDown') targetY += step;
    });

    /* ---------- only keep squares near the screen on the page ---------- */
    const live = new Map();
    const MARGIN = STEP;
    function render() {
        const vw = window.innerWidth, vh = window.innerHeight;
        const c0 = Math.floor((camX - MARGIN) / STEP), c1 = Math.floor((camX + vw + MARGIN) / STEP);
        const r0 = Math.floor((camY - MARGIN) / STEP), r1 = Math.floor((camY + vh + MARGIN) / STEP);
        const needed = new Set();
        for (let c = c0; c <= c1; c++) {
            for (let r = r0; r <= r1; r++) {
                const key = c + ',' + r;
                needed.add(key);
                if (!live.has(key)) live.set(key, makeCell(c, r));
            }
        }
        live.forEach(function (el, key) {
            if (!needed.has(key)) { el.remove(); live.delete(key); }
        });
        world.style.transform = 'translate3d(' + (-camX) + 'px,' + (-camY) + 'px,0)';
    }

    function makeCell(col, row) {
        const d = imageFor(col, row);
        const cell = document.createElement('div');
        cell.className = 'g-cell g-item' + (d[5] === 0 ? ' is-cover' : d[5] === 2 ? ' is-fit-height' : '');   // 0 full-bleed, 2 full height
        cell.dataset.href = d[3];
        cell.dataset.title = d[4];
        cell.style.left = (col * STEP) + 'px';
        cell.style.top = (row * STEP) + 'px';
        cell.style.width = CELL + 'px';
        cell.style.height = CELL + 'px';
        const img = document.createElement('img');
        img.alt = d[4];
        img.draggable = false;
        img.decoding = 'async';
        img.onload = function () { img.classList.add('is-loaded'); };
        if (d[6]) img.style.transform = 'scale(' + d[6] + ')';   // optional zoom, trims a black frame inside the image itself
        img.src = d[0];
        cell.appendChild(img);
        world.appendChild(cell);
        return cell;
    }

    function tick() {
        if (!dragging && (Math.abs(velX) > 0.05 || Math.abs(velY) > 0.05)) {
            targetX += velX; targetY += velY;              // glide after a flick
            velX *= 0.94; velY *= 0.94;
        }
        const ease = dragging ? 0.35 : 0.12;
        const nx = camX + (targetX - camX) * ease;
        const ny = camY + (targetY - camY) * ease;
        if (Math.abs(nx - camX) > 0.01 || Math.abs(ny - camY) > 0.01 || !tick.started) {
            camX = nx; camY = ny; tick.started = true;
            render();
        }
        requestAnimationFrame(tick);
    }
    window.addEventListener('resize', render);
    requestAnimationFrame(tick);

    /* ---------- hover: project name follows the cursor (same label style as the homepage) ---------- */
    const label = document.createElement('div');
    label.className = 'coupontooltip';
    document.body.appendChild(label);
    let hovering = null;
    stage.addEventListener('mouseover', function (e) {
        const el = e.target.closest && e.target.closest('.g-item');
        if (el === hovering) return;
        hovering = el;
        if (el && e.clientX > 0 && e.clientY > 0) {
            label.textContent = el.dataset.title;
            placeLabel(e);
            label.style.visibility = 'visible';
            if (window.changeCursorColor) window.changeCursorColor();
        } else {
            label.style.visibility = 'hidden';
            if (window.revertCursorColor) window.revertCursorColor();
        }
    });
    stage.addEventListener('mousemove', function (e) {
        if (!hovering) return;
        placeLabel(e);
    });
    function placeLabel(e) {
        let x = e.clientX + 12, y = e.clientY + 12;
        const w = label.offsetWidth, h = label.offsetHeight;
        if (x + w > window.innerWidth) x = window.innerWidth - w - 8;
        if (y + h > window.innerHeight) y = window.innerHeight - h - 8;
        label.style.left = x + 'px';
        label.style.top = y + 'px';
    }
    stage.addEventListener('mouseleave', function () {
        hovering = null; label.style.visibility = 'hidden';
        if (window.revertCursorColor) window.revertCursorColor();
    });
})();
