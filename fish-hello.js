/* Goldfish greeting.
   Hovering over the dot fish (not the empty black around it) types out one word,
   picked at random from "hello", "hi", "hey", "um...", with a blinking cursor
   (like the "welcome to my world" loading screen). The word stays where it appeared,
   and disappears as soon as the mouse moves off the fish or the fish swims away from it. */
(function () {
    const wrap = document.querySelector('.fish-dots');
    const video = wrap && wrap.querySelector('video');
    if (!wrap || !video) return;

    // if the screen is too short for the fish to fit under the list, hide it
    function fitCheck() {
        wrap.classList.remove('no-room');
        if (window.innerWidth < 1024) return;          // phones: the page scrolls, so it always fits
        const r = video.getBoundingClientRect();
        if (r.height && r.bottom > window.innerHeight) wrap.classList.add('no-room');
    }
    window.addEventListener('resize', fitCheck);
    video.addEventListener('loadedmetadata', fitCheck);
    window.addEventListener('load', fitCheck);
    fitCheck();

    const WORDS = ['hello', 'hi', 'hey', 'um...'];
    const TYPE_SPEED = 85;      // ms per letter (same as the loading screen)
    const LEAVE_DELAY = 120;    // tiny grace period so it doesn't flicker between dots

    const label = document.createElement('div');
    label.className = 'fish-hello';
    label.innerHTML = '<span class="typed"></span><span class="caret"></span>';
    const typedEl = label.querySelector('.typed');
    wrap.appendChild(label);
    let lastWord = -1;
    function pickWord() {                       // random, never the same word twice in a row
        let i;
        do { i = Math.floor(Math.random() * WORDS.length); } while (i === lastWord && WORDS.length > 1);
        lastWord = i;
        return WORDS[i];
    }

    // small copy of the current video frame, used to find where the fish is
    const probe = document.createElement('canvas');
    const PW = 168, PH = 82;
    probe.width = PW; probe.height = PH;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    let canRead = true;

    // where the video picture actually sits inside its box (it keeps its proportions, anchored bottom-left)
    function pictureRect() {
        const r = video.getBoundingClientRect();
        const vw = video.videoWidth || 672, vh = video.videoHeight || 328;
        const s = Math.min(r.width / vw, r.height / vh);
        const w = vw * s, h = vh * s;
        return { left: r.left, top: r.bottom - h, width: w, height: h };
    }

    function readFrame() {
        if (!canRead || video.readyState < 2) return null;
        try {
            pctx.drawImage(video, 0, 0, PW, PH);
            return pctx.getImageData(0, 0, PW, PH).data;
        } catch (e) { canRead = false; return null; }   // e.g. when opened straight from the hard drive
    }

    function isOverFish(clientX, clientY) {
        const p = pictureRect();
        const u = (clientX - p.left) / p.width, v = (clientY - p.top) / p.height;
        if (u < 0 || u > 1 || v < 0 || v > 1) return false;
        const data = readFrame();
        if (!data) return true;                          // can't look at the picture: treat the whole video as the fish
        const cx = Math.floor(u * PW), cy = Math.floor(v * PH);
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {   // a little forgiving around the dots
            const x = cx + dx, y = cy + dy;
            if (x < 0 || y < 0 || x >= PW || y >= PH) continue;
            if (data[(y * PW + x) * 4] > 110) return true;
        }
        return false;
    }

    function fishBox() {
        const data = readFrame();
        if (!data) return null;
        let x0 = PW, x1 = -1, y0 = PH;
        for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
            if (data[(y * PW + x) * 4] > 110) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; }
        }
        return x1 < 0 ? null : { cx: (x0 + x1) / 2 / PW, top: y0 / PH };
    }

    let active = false, typed = 0, typeTimer = null, leaveTimer = null, lastX = 0, lastY = 0;

    function start() {
        clearTimeout(leaveTimer);
        if (active) return;
        active = true; typed = 0; typedEl.textContent = '';
        const word = pickWord();
        label.classList.add('is-visible');
        place();
        (function typeNext() {
            if (!active) return;
            if (typed <= word.length) { typedEl.textContent = word.slice(0, typed++); typeTimer = setTimeout(typeNext, TYPE_SPEED); }
        })();
        requestAnimationFrame(watch);
    }
    function stop() {
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(function () {
            active = false; clearTimeout(typeTimer);
            label.classList.remove('is-visible');
        }, LEAVE_DELAY);
    }

    // place the word once, just above the fish where you hovered; it stays there
    function place() {
        const p = pictureRect(), w = wrap.getBoundingClientRect();
        const box = fishBox();
        const y = box ? p.top + box.top * p.height : lastY - 10;     // just above the fish's top edge
        let left = lastX - w.left - label.offsetWidth / 2;            // centred on where you hovered
        left = Math.max(0, Math.min(left, w.width - label.offsetWidth));
        label.style.left = left + 'px';
        label.style.top = (y - w.top - label.offsetHeight - 6) + 'px';
    }

    // while it's showing, keep checking: if the fish swims away from under the mouse, hide it
    function watch() {
        if (!active) return;
        if (!touchOnly.matches && !isOverFish(lastX, lastY)) { hideNow(); return; }
        requestAnimationFrame(watch);
    }

    function hideNow() {
        clearTimeout(leaveTimer);
        active = false; clearTimeout(typeTimer);
        label.classList.remove('is-visible');
    }

    const touchOnly = window.matchMedia('(hover: none)');   // phones & tablets: tap instead of hover

    wrap.addEventListener('mousemove', function (e) {
        if (touchOnly.matches) return;
        lastX = e.clientX; lastY = e.clientY;
        if (isOverFish(e.clientX, e.clientY)) start(); else if (active) stop();
    });
    wrap.addEventListener('mouseleave', function () { if (active && !touchOnly.matches) hideNow(); });

    // phones (no hover): tap the fish to get a greeting; it goes away after a moment
    let tapTimer = null;
    wrap.addEventListener('click', function (e) {
        if (!touchOnly.matches) return;
        lastX = e.clientX; lastY = e.clientY;
        if (!isOverFish(lastX, lastY)) return;
        hideNow();
        start();
        clearTimeout(tapTimer);
        tapTimer = setTimeout(hideNow, 2500);
    });
})();
