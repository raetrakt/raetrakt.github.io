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
document.querySelectorAll(".clickable").forEach(function(el) {
    el.addEventListener('mouseenter', function() {
               
        let font = randomFont();        
        el.style.fontFamily = font;

        let fontNumber = font.match(/\d/g)[0];        
        changeFavicon("img/favicons/" + fontNumber + ".ico");
    })
    el.addEventListener('mouseleave', function() {
        el.style.fontFamily = "Glyph World AirLand";
        changeFavicon("img/favicons/favicon.ico");
    })
})

let prevFont;
function randomFont() {
    let rFont;
    rFont = "GlyphWorld" + Math.floor((Math.random() * 8) + 1) + ", sans-serif";   
    while (prevFont === rFont) {
        rFont = "GlyphWorld" + Math.floor((Math.random() * 8) + 1) + ", sans-serif";   
    } 
    prevFont = rFont;
    return rFont;
}


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


//change favicon
function changeFavicon(src) {
    var link = document.createElement('link'),
        oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    
    if (oldLink) {
        document.head.removeChild(oldLink);
    }
    document.head.appendChild(link);
}


// //gallery video fix aspect ratio
// let videos = document.querySelectorAll(".image-container iframe");
// videos.forEach(function(vid) {
//     // let vidHeight = vid.clientHeight;
//     // let vidWidth = vidHeight/9*16 + "px";
//     let vidHeight = getComputedStyle(vid).height;
//     let vidWidth = parseInt(vidHeight)/9.*16 + "px";
//     vid.style.width = vidWidth;
// });



//mobile hint
if(screen.width <= 760) { 
    document.body.innerHTML = 
    `
    <meta 
     name='viewport' 
     content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' 
    />
    <div class="mobile" style="padding-top:10vw">
        <p class="changeontap">fabianpitzer.de</p>   
        <div style="position: absolute; top: 15vh;">     
        <p>Please view my portfolio on a desktop screen.</p>
        <p>Thank you!</p>
        </div>     
    </div>
    `;
    document.addEventListener('click', function(ev) {
        let pFontChange = document.querySelector(".changeontap");
        pFontChange.style.fontSize = "4.8vh";
        pFontChange.style.fontFamily = randomFont();
    });
}






