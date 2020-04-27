
//preview images
document.querySelectorAll(".preview").forEach(function(el) {
    el.addEventListener('mouseenter', function() {
        let image = this.lastElementChild;
        image.style.transform = "translate(-50%,-50%) scale(" + screen.width/2200 + ")";
        image.style.display = "block";

    });
    el.addEventListener('mouseleave', function() {
        let image = this.lastElementChild;
        image.style.display = "none";
    });
});


//change font on hover over clickable text
let prevFont;
let randomFont;
document.querySelectorAll(".clickable").forEach(function(el) {
    el.addEventListener('mouseenter', function() {
        while (prevFont === randomFont) {
            randomFont = "GlyphWorld" + Math.floor((Math.random() * 8) + 1) + ", serif";   
        }        
        let content = this.innerHTML;
        el.style.fontFamily = randomFont;
        prevFont = randomFont;
    })
    el.addEventListener('mouseleave', function() {
        el.style.fontFamily = "Glyph World AirLand";
    })
})

//removing the margin bottom from the last project item here
//because it didnt work in css with :last-child
document.querySelector(".project-media").lastElementChild.style.marginBottom = "0px";
