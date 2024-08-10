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

    document.querySelectorAll('.couponcode').forEach(item => {
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
    
    
    

    
    