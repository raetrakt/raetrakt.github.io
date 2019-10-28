let font;

function preload() {
}

function setup() {
	createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  reset();

  stroke(230, 10, 10);
  strokeWeight(strokeW);
  noFill();
}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }

let strokeW;
let spacingX;
let spacingY;
let passeParTout;
let xDiv;
let yDiv;
let reroll;
let rotations = [];

function draw() {
	background(255, 250, 240);


    if (reroll) {
      rotations = [];
      for (i = 0; i < (xDiv + 1)*(yDiv + 1); i++) {
        let rotation = random(-.1,.1);
        rotations.push(rotation);
      }
      print(rotations);
    }

  for (y = 0; y < yDiv; y++){
    for (x = 0; x < xDiv; x++){
      let rectX = passeParTout + ((width - passeParTout*2)/xDiv)*(x + 1) - ((width - passeParTout*2)/xDiv)/2;
      let rectY = passeParTout + ((height - passeParTout*2)/yDiv)*(y + 1) - ((height - passeParTout*2)/yDiv)/2;
      push();
      translate(rectX, rectY);
      rotate(rotations[x + y*x]);

      rect(0, 0, (width - passeParTout)/xDiv - spacingX * 2, (height - passeParTout)/yDiv - spacingY * 2);
      pop();
    }
  }

  reroll = false;
}

function reset() {

  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      // is mobile..
    xDiv = int(random(2,5));
    yDiv = int(random(2,7));
    strokeW = width / 40 * random(.95, 1.05);
    spacingX = (width / 22) / ((xDiv/2)*.7);
    spacingY = (width / 22) / ((yDiv/2)*.7);
  } else {
    xDiv = int(random(2,6));
    yDiv = int(random(2,6));
    strokeW = width / 80 * random(.95, 1.05);
    spacingX = (width / 25) / ((xDiv/2)*.7);
    spacingY = (width / 25) / ((yDiv/2)*.7);
  }


  passeParTout = width / 7;

  rotations = [];
  reroll = true;
}

function mouseReleased() {
  reset();
}

function touchEnded() {
  reset();
}
