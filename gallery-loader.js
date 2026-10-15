/* Gallery loading screen.
   Types "welcome to my world ⋆｡°.✩" while the images for the first screen load,
   then fades away once the typing is done AND those images are ready
   (or after 8 seconds at most, so nobody is ever stuck on it). */
(function () {
    const loader = document.querySelector('.gallery-loader');
    const typed = loader && loader.querySelector('.typed');
    if (!loader || !typed) return;

    const TEXT = Array.from('welcome to my world ⋆｡°.✩');   // typed one character at a time
    const TYPE_SPEED = 85;        // ms per letter
    const HOLD_AFTER = 450;       // pause once the sentence is complete
    const MAX_WAIT = 8000;        // never wait longer than this

    let typingDone = false, imagesDone = false, closed = false;

    let i = 0;
    (function typeNext() {
        typed.textContent = TEXT.slice(0, i).join('');
        if (i < TEXT.length) { i++; setTimeout(typeNext, TYPE_SPEED); }
        else setTimeout(function () { typingDone = true; maybeClose(); }, HOLD_AFTER);
    })();

    // wait until the gallery has drawn its first squares, then wait for those images
    function watchImages() {
        const imgs = Array.from(document.querySelectorAll('#gallery-world img'));
        if (!imgs.length) { requestAnimationFrame(watchImages); return; }
        const vw = window.innerWidth, vh = window.innerHeight;
        const onScreen = imgs.filter(function (img) {
            const r = img.parentElement.getBoundingClientRect();
            return r.right > 0 && r.left < vw && r.bottom > 0 && r.top < vh;
        });
        let left = onScreen.length;
        if (!left) { imagesDone = true; maybeClose(); return; }
        onScreen.forEach(function (img) {
            if (img.complete) { done(); return; }
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
        });
        function done() { if (--left <= 0) { imagesDone = true; maybeClose(); } }
    }
    requestAnimationFrame(watchImages);

    setTimeout(function () { typingDone = imagesDone = true; maybeClose(); }, MAX_WAIT);

    function maybeClose() {
        if (closed || !typingDone || !imagesDone) return;
        closed = true;
        loader.classList.add('is-done');
        setTimeout(function () { loader.remove(); }, 900);
    }
})();
