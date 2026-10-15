/* Gallery only: a trail of "⋆｡°.✩" symbols that follows behind the cursor.
   The normal cursor stays as it is.

   Every frame we compare the current mouse position (mouseX, mouseY) with the
   previous one (pmouseX, pmouseY). The distance between them = how fast you move:
   - one symbol is dropped per frame, so faster movement leaves bigger gaps between them
   - the faster you move, the farther each symbol is scattered sideways and drifts away
   Each symbol then fades out and disappears. Hidden on touch screens. */
(function () {
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

    const SYMBOLS = Array.from('⋆｡°.✩');
    const LIFE = 0.9;               // seconds a symbol stays before fully fading
    const MAX = 400;                // safety cap on symbols at once

    const canvas = document.createElement('canvas');
    canvas.className = 'gallery-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let dpr = 1;
    function resize() {
        dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    const font = getComputedStyle(document.body).fontFamily || 'Avenir, sans-serif';
    let mouseX = null, mouseY = null, pmouseX = null, pmouseY = null;
    window.addEventListener('mousemove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener('mouseleave', function () { mouseX = mouseY = pmouseX = pmouseY = null; });

    const particles = [];
    let next = 0, last = performance.now();

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (mouseX !== null && pmouseX !== null) {
            const dx = mouseX - pmouseX, dy = mouseY - pmouseY;
            const dist = Math.hypot(dx, dy);                 // distance moved since last frame
            if (dist > 0.8 && particles.length < MAX) {
                // perpendicular to the direction of movement
                const nx = -dy / (dist || 1), ny = dx / (dist || 1);
                const scatter = (Math.random() - 0.5) * dist * 1.2;      // faster → wider spread
                const drift = dist * (0.6 + Math.random() * 0.8);        // faster → drifts farther
                const side = Math.random() < 0.5 ? -1 : 1;
                particles.push({
                    ch: SYMBOLS[next++ % SYMBOLS.length],
                    x: mouseX + nx * scatter,
                    y: mouseY + ny * scatter,
                    vx: (nx * side * drift - dx * 0.5) ,
                    vy: (ny * side * drift - dy * 0.5) - 10,
                    age: 0,
                    size: 14 + Math.random() * 8
                });
            }
        }
        if (mouseX !== null) { pmouseX = mouseX; pmouseY = mouseY; }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += dt;
            if (p.age >= LIFE) { particles.splice(i, 1); continue; }
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= 0.94; p.vy *= 0.94;                       // slows down as it fades
            const t = p.age / LIFE;
            ctx.globalAlpha = 1 - t * t;                      // smooth fade out
            ctx.font = p.size + 'px ' + font;
            ctx.fillText(p.ch, p.x, p.y);
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
