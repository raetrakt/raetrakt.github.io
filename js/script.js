
//preview images
document.querySelectorAll(".preview").forEach(function(el) {
    el.addEventListener('mouseenter', function() {
        let image = this.lastElementChild;
        image.style.transform = "translate(-50%,-50%) scale(" + screen.height/1300 + ")";
        image.style.display = "block";

    });
    el.addEventListener('mouseleave', function() {
        let image = this.lastElementChild;
        image.style.display = "none";
    });
});

//change font on hover over clickable text
document.querySelectorAll(".clickable").forEach(function(el) {
    el.addEventListener('mouseenter', function() {
        let randomFont = "GlyphWorld" + Math.floor((Math.random() * 8) + 1) + ", serif";   
        let content = this.innerHTML;
        el.style.fontFamily = randomFont;
        el.style.fontSize = "3vw";
    })
    el.addEventListener('mouseleave', function() {
        el.style.fontFamily = "Glyph World AirLand";
        el.style.fontSize = "3vw";
    })
})
