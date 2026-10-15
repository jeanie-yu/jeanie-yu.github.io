/* Desktop: start the first image / video of a project level with the line
   under the project name (works even when a long name wraps to two lines). */
(function () {
    const h2 = document.querySelector('.project-description h2');
    const first = document.querySelector('.project-images img, .project-images video');
    if (!h2 || !first) return;
    const original = first.style.marginTop;   // the page's own spacing, used on phones

    function align() {
        if (window.innerWidth < 1024) { first.style.marginTop = original; return; }
        first.style.setProperty('margin-top', '0px', 'important');
        const line = h2.getBoundingClientRect().bottom - 1;            // the line under the name
        const top = first.getBoundingClientRect().top + window.scrollY;   // position on the page (the name column is fixed)
        // some pages ask for their first image a little higher (data-first-nudge="-20" on .project-images)
        const nudge = parseFloat(first.closest('.project-images').dataset.firstNudge || 0);
        first.style.setProperty('margin-top', (line - top + nudge) + 'px', 'important');
    }

    align();
    window.addEventListener('load', align);
    window.addEventListener('resize', align);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
})();
