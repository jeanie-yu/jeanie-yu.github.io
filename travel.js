/* About Me — travel photo strip.
   - Keeps moving on its own (upward by default, like scrolling down a page), never stops on hover.
   - Scrolling flips the direction: scroll down → strip runs upward,
     scroll up → strip runs downward. Each scroll also gives it a short push.
   - On phones it is a steady sideways carousel, always moving left to right.
   - Photos are shuffled into a random order on every visit,
     then copied once so the loop is seamless. */
(function () {
    const strip = document.querySelector('.travel-strip');
    const track = document.querySelector('.travel-track');
    if (!strip || !track) return;

    /* shuffle the photos into a random order on every visit */
    const photos = Array.from(track.children);
    for (let i = photos.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        const t = photos[i]; photos[i] = photos[k]; photos[k] = t;
    }
    photos.forEach(function (el) { track.appendChild(el); });

    Array.from(track.children).forEach(function (el) {
        const copy = el.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
    });

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = 40;          // pixels per second when cruising
    let direction = -1;        // -1 = moving up (like scrolling down a page), 1 = moving down
    let push = 0;              // extra speed from scrolling, fades out
    let offset = 0;
    let last = performance.now();

    function onScrollInput(delta) {
        if (!delta) return;
        direction = delta > 0 ? -1 : 1;                 // opposite to the scroll
        push += Math.min(Math.abs(delta), 120) * 2 * direction;
    }

    window.addEventListener('wheel', function (e) {
        onScrollInput(e.deltaY);
        // desktop: keep the About page itself perfectly still (no scroll, no trackpad bounce)
        if (window.innerWidth >= 1024 && !e.ctrlKey) e.preventDefault();
    }, { passive: false });

    let touchY = null;
    window.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
        if (touchY === null) return;
        const y = e.touches[0].clientY;
        onScrollInput(touchY - y);                      // finger up = scrolling down
        touchY = y;
    }, { passive: true });
    window.addEventListener('touchend', function () { touchY = null; }, { passive: true });

    // phones: the strip runs sideways instead of up and down
    const phone = window.matchMedia('(max-width: 1023px)');
    phone.addEventListener && phone.addEventListener('change', function () { offset = 0; });

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const sideways = phone.matches;
        const half = (sideways ? track.scrollWidth : track.scrollHeight) / 2;
        if (half > 0) {
            if (sideways) { push = 0; direction = 1; }   // phones: steady left-to-right carousel
            offset += (direction * SPEED + push) * dt;
            push *= Math.pow(0.04, dt);                  // push fades within about a second
            offset = ((offset % half) + half) % half;    // wrap for a seamless loop
            track.style.transform = sideways
                ? 'translate3d(' + (offset - half) + 'px,0,0)'
                : 'translate3d(0,' + (offset - half) + 'px,0)';
        }
        requestAnimationFrame(frame);
    }
    if (reduceMotion) {
        track.style.transform = 'translate3d(0,0,0)';
    } else {
        requestAnimationFrame(frame);
    }
})();
