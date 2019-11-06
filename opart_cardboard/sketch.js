let circles = [];
let numberOfCircles = 80;
let extendedScreen;
let moveSpeed = .001;

let easedMouseX = 0;
let easedMouseY = 0;
let easing = .03;

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup();
}


function setup() {
  createCanvas(windowWidth, windowHeight);

  extendedScreen = width > height ? width/.8 : height/.8;

  for (i = 0; i < numberOfCircles; i++) {
    let blackOrWhite = i % 2 == 1 ? 'black' : 'white';
    circles.push(new Circle(blackOrWhite, extendedScreen - (extendedScreen/numberOfCircles) * i, createVector(width/2, height/2)));
  }

	easedMouseX = width/2;
	easedMouseY = height/2;

  noStroke();
}

function Circle(c, d, p) {
  this.fillColor = c;
  this.diameter = d;
  this.position = p;
}


function draw() {
  background(255);

  let deltaX = mouseX - easedMouseX;
  let deltaY = mouseY - easedMouseY;

  easedMouseX += deltaX * easing;
  easedMouseY += deltaY * easing;


  for (i = 0; i < circles.length - 1; i++) {
    c = circles[i+1];
    cBigger = circles[i];

    //REPLACE [circles.length - 1] with [i] and you get the behaviour i actually wanted, but its bugged
    let direction = createVector(easedMouseX - circles[circles.length - 1].position.x, easedMouseY - circles[circles.length - 1].position.y);

      let nextPosition = c.position.copy().add(direction.copy().mult(i).mult(moveSpeed));

      //if it will be still inside of boundary of bigger circle
      if (nextPosition.dist(cBigger.position) < (cBigger.diameter/2 - c.diameter/2)) {
        //move
        c.position = nextPosition;
      }

    fill(c.fillColor);
    ellipse(c.position.x, c.position.y, c.diameter, c.diameter);
  }
}
