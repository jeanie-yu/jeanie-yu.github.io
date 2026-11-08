/* Interactive flip book (used on if-then-else.html).
   Markup: <div class="book" data-src="projects/if-then-else-book/" data-pages="128"></div>
   Images in data-src: cover-front.webp, cover-back.webp, cover-spine.webp, page-001.webp …

   The book is a stack of leaves turning on the spine:
   leaf 0 = front cover, leaves 1…64 = interior sheets (front = odd page, back = even page),
   last leaf = back cover. `opened` = how many leaves lie on the left. */
(function () {
    const root = document.querySelector('.book');
    if (!root) return;

    const dir = root.dataset.src;
    const pageCount = parseInt(root.dataset.pages, 10);
    const PAGE_RATIO = 720 / 576;       // height / width of a page (8 x 10 in)
    const SPINE_RATIO = 48.96 / 576;    // spine width / page width, from the cover PDF
    const TURN_MS = 800;                // a page turn you click
    const AUTO_TURN_MS = 700;           // a page turn while it flips by itself
    const AUTO_PAUSE_MS = 450;          // rest between automatic turns
    const START_DELAY_MS = 1400;        // closed cover shown before it opens

    const pg = n => dir + 'page-' + String(n).padStart(3, '0') + '.webp';
    const faces = [[dir + 'cover-front.webp', null]];               // null = blank white inside cover
    for (let n = 1; n <= pageCount; n += 2) faces.push([pg(n), n + 1 <= pageCount ? pg(n + 1) : null]);
    faces.push([null, dir + 'cover-back.webp']);
    const N = faces.length;

    const flat = !(window.CSS && CSS.supports && CSS.supports('transform-style', 'preserve-3d'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- build ----------
    root.innerHTML = '';
    root.tabIndex = 0;
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'if / then / else book preview. Click the right page to turn forward, the left page to turn back.');
    if (flat) root.classList.add('book--flat');

    const el = (cls, parent) => { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; };
    const stage = el('book__stage', root);
    const body = el('book__body', stage);
    const spine = el('book__spine', body);
    ['front', 'back'].forEach(side => {
        const f = el('book__spine-face book__spine-face--' + side, spine);
        const img = document.createElement('img');
        img.src = dir + 'cover-spine.webp';
        img.alt = '';
        f.appendChild(img);
    });

    const leaves = faces.map((pair, i) => {
        const leaf = el('leaf', body);
        if (i === 0) leaf.classList.add('leaf--cover');
        if (i === N - 1) leaf.classList.add('leaf--cover-back');
        const parts = pair.map((src, s) => {
            const face = el('leaf__face leaf__face--' + (s ? 'back' : 'front'), leaf);
            let img = null;
            if (src) {
                img = document.createElement('img');
                img.alt = '';
                img.decoding = 'async';
                img.dataset.src = src;
                face.appendChild(img);
            }
            return { img, shade: el('leaf__shade', face) };
        });
        return { el: leaf, front: parts[0], back: parts[1] };
    });

    // ---------- sizing ----------
    function size() {
        const w = root.clientWidth || root.parentElement.clientWidth;
        const pw = Math.max(80, Math.min(w / 2, window.innerHeight * 0.74 / PAGE_RATIO));
        const ph = pw * PAGE_RATIO;
        const t = pw * SPINE_RATIO;
        root.style.setProperty('--pw', pw + 'px');
        root.style.setProperty('--ph', ph + 'px');
        root.style.setProperty('--t', t + 'px');
        render();
    }

    // ---------- state ----------
    let opened = 0;
    let turning = -1;     // leaf in motion
    let busy = false;

    // Both open pages lie on the same plane (so they are the same size and meet at the spine);
    // the book's thickness shows as the spine when it is closed.
    function place(i, angle) {               // angle 0 = lying right, 180 = lying left
        const leaf = leaves[i].el;
        if (flat) {
            leaf.style.transform = 'scaleX(' + Math.cos(angle * Math.PI / 180).toFixed(4) + ')';
            leaf.classList.toggle('is-flipped', angle > 90);
            leaf.style.zIndex = i === turning ? N + 1 : (angle > 90 ? i : N - i);
        } else {
            const lift = i === turning ? 0.5 : 0;   // keeps the moving page just above the one it leaves
            leaf.style.transform = 'rotateY(' + (-angle) + 'deg) translateZ(' + (angle > 90 ? -lift : lift) + 'px)';
        }
    }

    // only the top page of each side is drawn (plus the page under a turning one)
    function showAround(i) {
        leaves.forEach((l, k) => { l.el.style.display = k >= i - 1 && k <= i + 1 ? '' : 'none'; });
    }

    function load(i) {
        if (i < 0 || i >= N) return;
        [leaves[i].front.img, leaves[i].back.img].forEach(img => {
            if (img && !img.src) img.src = img.dataset.src;
        });
    }

    function render() {
        leaves.forEach((_, i) => place(i, i < opened ? 180 : 0));
        leaves.forEach((l, i) => { l.el.style.display = i === opened - 1 || i === opened ? '' : 'none'; });
        for (let i = opened - 4; i <= opened + 3; i++) load(i);   // this spread plus the ones either side
    }

    function setClosedState(n) {
        root.classList.toggle('is-closed-front', n === 0);
        root.classList.toggle('is-closed-back', n === N);
    }

    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function turn(dir, ms) {
        if (busy) return Promise.resolve(false);
        const i = dir > 0 ? opened : opened - 1;
        if (i < 0 || i >= N) return Promise.resolve(false);
        busy = true;
        turning = i;
        const target = opened + dir;
        load(i); load(i + dir); load(i + 2 * dir);
        showAround(i);

        ms = reduceMotion ? 1 : ms;
        root.style.setProperty('--turn', ms + 'ms');
        setClosedState(target);

        const under = [leaves[i + 1] && leaves[i + 1].front, leaves[i - 1] && leaves[i - 1].back].filter(Boolean);
        const from = dir > 0 ? 0 : 180, to = dir > 0 ? 180 : 0;

        return new Promise(resolve => {
            const start = performance.now();
            function frame() {
                // the same clock as `start` (a frame's own timestamp can lag behind it inside an iframe)
                const p = Math.max(0, Math.min(1, (performance.now() - start) / ms));
                const a = from + (to - from) * ease(p);
                place(i, a);
                const lift = Math.sin(a * Math.PI / 180);
                leaves[i].front.shade.style.opacity = a < 90 ? (a / 90) * 0.9 : 0;
                leaves[i].back.shade.style.opacity = a > 90 ? ((180 - a) / 90) * 0.9 : 0;
                under.forEach(f => { f.shade.style.opacity = (lift * 0.45).toFixed(3); });
                if (p < 1) return requestAnimationFrame(frame);
                [leaves[i].front, leaves[i].back].concat(under).forEach(f => { f.shade.style.opacity = 0; });
                opened = target;
                turning = -1;
                busy = false;
                render();
                resolve(true);
            }
            requestAnimationFrame(frame);
        });
    }

    // ---------- automatic flipping ----------
    // It flips by itself, pauses while the mouse is over the book (or for a few seconds after a tap),
    // and carries on from whatever page is open when the mouse leaves. It stops at the back cover.
    const auto = !reduceMotion;
    const TOUCH_IDLE_MS = 4000;
    let autoTimer = null;
    let touchTimer = null;
    let inView = false;
    let paused = false;

    let hovering = false;

    function pauseAuto() {
        paused = true;
        clearTimeout(autoTimer);
    }

    function resumeAuto(delay) {
        if (hovering) return;
        paused = false;
        autoStep(delay);
    }

    function autoStep(delay) {
        clearTimeout(autoTimer);
        if (!auto || paused || !inView || opened >= N) return;
        autoTimer = setTimeout(() => {
            if (paused || !inView || opened >= N || busy) return;
            turn(1, opened === 0 || opened === N - 1 ? TURN_MS + 300 : AUTO_TURN_MS)
                .then(() => autoStep(AUTO_PAUSE_MS));
        }, delay);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            if (inView && !busy) autoStep(opened === 0 ? START_DELAY_MS : AUTO_PAUSE_MS);
        }, { threshold: 0.35 }).observe(root);
    } else {
        inView = true;
        autoStep(START_DELAY_MS);
    }

    // ---------- interaction ----------
    function handle(dir) {
        pauseAuto();
        turn(dir, TURN_MS);
    }

    // phones and tablets have no hover: carry on after a few quiet seconds
    stage.addEventListener('pointerup', e => {
        if (e.pointerType === 'mouse') return;
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => resumeAuto(0), TOUCH_IDLE_MS);
    });
    root.addEventListener('keyup', () => {
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => resumeAuto(0), TOUCH_IDLE_MS);
    });

    // only the book itself counts, not the empty space around it
    const onBook = e => !!e.target.closest('.leaf, .book__spine');

    stage.addEventListener('click', e => {
        if (!onBook(e)) return;
        hideTip = true;
        tip && (tip.style.visibility = 'hidden');
        if (opened === 0) return handle(1);           // closed front cover: open it
        if (opened === N) return handle(-1);          // closed back cover: open it from the back
        const r = stage.getBoundingClientRect();
        handle(e.clientX < r.left + r.width / 2 ? -1 : 1);
    });

    root.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); handle(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); handle(-1); }
    });

    // Hovering the book pauses the flipping and shows a label (same style as the homepage
    // project labels, .coupontooltip from script.js) until the first click.
    const tip = document.querySelector('.coupontooltip');
    let hideTip = false;

    function setHover(on) {
        if (on === hovering) return;
        hovering = on;
        if (on) pauseAuto();
        else resumeAuto(AUTO_PAUSE_MS * 2);
    }

    stage.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const over = onBook(e);
        setHover(over);
        if (!tip) return;
        if (!over || hideTip) { tip.style.visibility = 'hidden'; return; }
        tip.textContent = 'click to flip the book';
        tip.style.visibility = 'visible';
        tip.style.left = Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8) + 'px';
        tip.style.top = Math.min(e.clientY + 12, window.innerHeight - tip.offsetHeight - 8) + 'px';
    });
    stage.addEventListener('pointerleave', e => {
        if (e.pointerType !== 'mouse') return;
        setHover(false);
        if (tip) tip.style.visibility = 'hidden';
    });

    // the site's white cursor dot would disappear on white pages
    const cursor = document.querySelector('.cursor-white');
    if (cursor) {
        stage.addEventListener('mouseenter', () => { cursor.style.mixBlendMode = 'difference'; });
        stage.addEventListener('mouseleave', () => { cursor.style.mixBlendMode = ''; });
    }

    // first layout and resizes jump straight into place instead of animating
    function settle() {
        root.classList.add('is-static');
        size();
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-static')));
    }

    setClosedState(0);
    settle();
    window.addEventListener('resize', settle);
})();
