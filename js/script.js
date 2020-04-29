//preview images on landing page
document.querySelectorAll(".preview").forEach(function(el) {
    el.addEventListener('mouseenter', function() {
        let image = this.lastElementChild;
        image.style.transform = "translate(-50%,-50%) scale(" + (screen.availWidth/2400) + ")";
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
if (document.querySelector(".project-media") != null) {
    document.querySelector(".project-media").lastElementChild.style.marginBottom = "0px";
}


//write current year in copyright
if (document.querySelector(".copyright") != null) {
    let date = new Date();
    document.querySelector(".copyright").innerHTML = "<p>&copy; Fabian Pitzer " 
    + date.getFullYear() + "</p>";
}



//horizontal scrolling for galleries
if (document.querySelector(".images") != null) {

    let images = document.querySelector(".images");
    let scrollInput = 0;
    let easing = .18;
    let scrollSpeed = 150;

    //get scroll input
    window.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.deltaY > 0) scrollInput += scrollSpeed;
        else scrollInput -= scrollSpeed;

      }, { passive: false });

    //execute scrolling every x with easing
    setInterval(
        function scroll() {
            let easedScroll = (scrollInput * easing);
            images.scrollLeft += easedScroll;
            scrollInput -= easedScroll;
            scrollInput = parseInt(scrollInput); //whithout this line it floats when scrolling back
               
        }
    , 10);




 
}


//else layout breaks on resize
window.onresize = function(){ location.reload(); }


//gallery video fix aspect ratio
let videos = document.querySelectorAll(".image-container iframe");
videos.forEach(function(vid) {
    let vidHeight = vid.clientHeight;
    let vidWidth = vidHeight/9*16 + "px";
    vid.style.width = vidWidth;
});











