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

