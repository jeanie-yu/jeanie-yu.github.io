/* Left column (desktop): make the thin white lines exactly as wide as the
   longest line of the intro paragraph ("A graphic designer and RISD alumni, …").
   Measured in the browser, so it matches whatever font the visitor sees. */
(function () {
    const space = document.querySelector('.title-space');
    const intro = space && space.querySelector('.intro');
    if (!intro) return;

    function fit() {
        if (window.innerWidth < 1024) { space.style.width = ''; return; }
        let widest = 0;
        // the intro's words are separate pieces; their layout positions ignore the flip animation
        intro.querySelectorAll(':scope > span').forEach(function (s) {
            widest = Math.max(widest, s.offsetLeft + s.offsetWidth);
        });
        if (widest > 0) space.style.width = Math.ceil(widest) + 'px';
    }

    fit();
    window.addEventListener('load', fit);
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
