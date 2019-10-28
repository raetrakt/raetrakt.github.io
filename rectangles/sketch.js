let font;

function preload() {
}

function setup() {
	createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  reset();


  strokeWeight(strokeW);


 	//colorSchemes, bg then fg
	colorSchemes[0] = [color(250, 240, 220), color(222, 10, 10)];
	colorSchemes[1] = [color(250, 250, 245), color(20, 10, 250)];
	colorSchemes[2] = [color(250, 250, 245), color(110, 15, 27)];


}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }

let strokeW;
let spacingX;
let spacingY;
let passeParToutX;
let passeParToutY;
let xDiv;
let yDiv;
let reroll;
let colorScheme;
let bgFGSwitch = false;
let fillRects = false;
let colorSchemes = [];
let rotations = [];

function draw() {
	//background(255, 250, 240);

	if (!bgFGSwitch) {
		background(colorSchemes[colorScheme][0]);
		stroke(colorSchemes[colorScheme][1]);

		if (fillRects) {
			fill(colorSchemes[colorScheme][1]);
			noStroke();
		} else {
			stroke(colorSchemes[colorScheme][1]);
			noFill();
		}

	} else {
		background(colorSchemes[colorScheme][1]);
		stroke(colorSchemes[colorScheme][0]);

		if (fillRects) {
			fill(colorSchemes[colorScheme][0]);
			noStroke();
		} else {
			stroke(colorSchemes[colorScheme][0]);
			noFill();
		}
	}





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
      let rectX = passeParToutX + ((width - passeParToutX*2)/xDiv)*(x + 1) - ((width - passeParToutX*2)/xDiv)/2;
      let rectY = passeParToutY + ((height - passeParToutY*2)/yDiv)*(y + 1) - ((height - passeParToutY*2)/yDiv)/2;
      push();
      translate(rectX, rectY);
      rotate(rotations[x + y*xDiv]);

      rect(0, 0, (width - passeParToutX)/xDiv - spacingX * 2, (height - passeParToutY)/yDiv - spacingY * 2);
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
		passeParToutY = width / 5;
		passeParToutX = width / 7;

  } else {
    xDiv = int(random(2,6));
    yDiv = int(random(2,6));
    strokeW = width / 80 * random(.8, 1.05);
    spacingX = (width / 25) / ((xDiv/2)*.6);
    spacingY = (width / 25) / ((yDiv/2)*1.9);
		passeParToutY = width / 40;
		passeParToutX = width / 5;

  }

	colorScheme = int(random(0, 3));
	if (random()>.5) {
		bgFGSwitch = !bgFGSwitch;
	}
	if (random()>.7) {
		fillRects = true;
	} else {
		fillRects = false;
	}
  rotations = [];
  reroll = true;
}

function mouseReleased() {
  reset();
}

function touchEnded() {
  reset();
}
