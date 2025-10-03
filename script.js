var body = document.querySelector('body');
var cursor = document.querySelector('.cursor-white');

body.addEventListener('mousemove', function (event) {
    cursor.style.top = event.clientY + 'px';
    cursor.style.left = event.clientX + 'px';
});

function changeCursorColor() {
    cursor.style.backgroundColor = "transparent";
    cursor.style.opacity = "100%";
    cursor.style.border = "2px solid white";
    cursor.style.width = "23px";
    cursor.style.height = "23px";
    cursor.style.transitionDuration = "0s";
}

function revertCursorColor() {
    cursor.style.backgroundColor = "white";
    cursor.style.width = "22px";
    cursor.style.height = "22px";
    cursor.style.transitionDuration = "0s";
}

window.onscroll = function() {

    document.getElementByClass('small-title-container').style.top = window.pageYOffset + 'px';
    
    };

    document.querySelectorAll('.card').forEach(item => {
        item.addEventListener('mousemove', event => {
            const tooltip = item.querySelector('.coupontooltip');
            const tooltipWidth = tooltip.clientWidth;
            const tooltipHeight = tooltip.clientHeight;
            const pageWidth = document.documentElement.scrollWidth;
            const pageHeight = document.documentElement.scrollHeight;
    
            let x = event.pageX + 10;
            let y = event.pageY + 10;
    
            if (x + tooltipWidth > pageWidth) {
                x = pageWidth - tooltipWidth - 5;
            }
    
            if (y + tooltipHeight > pageHeight) {
                y = pageHeight - tooltipHeight - 5;
            }
    
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
        });
    });
    
    
    

    
    
     // Create global tooltip
  const globalTip = document.createElement('div');
  globalTip.className = 'coupontooltip';
  document.body.appendChild(globalTip);

  // Track which card is active
  let active = null;

  // Mouse handlers
  function onEnterCard(e) {
    const card = e.currentTarget;
    const text = card.getAttribute('data-tooltip') || '';
    if (!text) return;
    active = card;
    globalTip.textContent = text;
    globalTip.style.visibility = 'visible';
  }

  function onLeaveCard() {
    active = null;
    globalTip.style.visibility = 'hidden';
  }

  function onMove(e) {
    if (!active) return;

    const tipW = globalTip.offsetWidth;
    const tipH = globalTip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Start near cursor with a small offset
    let x = e.clientX + 12;
    let y = e.clientY + 12;

    // Clamp to viewport so it never overflows
    if (x + tipW > vw) x = vw - tipW - 8;
    if (y + tipH > vh) y = vh - tipH - 8;

    globalTip.style.left = x + 'px';
    globalTip.style.top  = y + 'px';
  }

  // Attach to all cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', onEnterCard);
    card.addEventListener('mouseleave', onLeaveCard);
    card.addEventListener('mousemove', onMove);
  });

  // (Optional) Hide tooltip while scrolling to avoid jank
  let scrollHideTimer = null;
  window.addEventListener('scroll', () => {
    globalTip.style.visibility = 'hidden';
    clearTimeout(scrollHideTimer);
    scrollHideTimer = setTimeout(() => {
      if (active) globalTip.style.visibility = 'visible';
    }, 120);
  });