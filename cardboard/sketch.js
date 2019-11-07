let circlesLeft = [];
let circlesRight = [];
let numberOfCircles = 20;
let extendedScreen;
let moveSpeed = .001;

let easedMouseXLeft = 0;
let easedMouseXRight = 0;
let easedMouseY = 0;
let easing = .05;

let stereoscopy = 50;

let leftHalf, rightHalf;
let centerX, centerY;




function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup();
}


function setup() {
  createCanvas(windowWidth, windowHeight);

  leftHalf = new Screenhalf(true);
  rightHalf = new Screenhalf(false);



  extendedScreen = width > height ? leftHalf.w/.45 : leftHalf.h/.45;
  for (side = 0; side < 2; side++) {



    for (i = 0; i < numberOfCircles; i++) {
      let blackOrWhite = i % 2 == 1 ? 'black' : 'white';
      if (side == 0) {
        circlesLeft.push(new Circle(blackOrWhite, extendedScreen - (extendedScreen/numberOfCircles) * i, createVector(0,0)));
      } else {
        circlesRight.push(new Circle(blackOrWhite, extendedScreen - (extendedScreen/numberOfCircles) * i, createVector(0,0)));
      }
    }

  }
  noStroke();

}

function Circle(c, d, p) {
  this.fillColor = c;
  this.diameter = d;
  this.position = p;
}

function Screenhalf(l) {
  l ? this.left = true : this.left =  false;
  this.w = width/2;
  this.h = height;
}


let newMouseXLeft = 0;
let newMouseXRight = 0;
let newMouseY = 0;

function draw() {
  background(255);
  translate(width/2, height/2);


  //let newMouseX  = map(rotationZ - centerX + 180, 0, 360, 0, width);
  //let newMouseY = map(rotationY - centerY + 180, -180, 180, 0, height);

  if (frameCount % 90 == 0) {
    randX = random(-width/5, width/5);
    newMouseXLeft = randX;
    newMouseXRight = randX;
    newMouseY = random(-height/2, height/2);
  }



  let deltaXLeft = newMouseXLeft - easedMouseXLeft;
  let deltaXRight = newMouseXRight - easedMouseXRight;
  let deltaY = newMouseY - easedMouseY;

  //console.log(mouseX + " " + mouseY);

  easedMouseXRight += deltaXRight * easing;
  easedMouseXLeft += deltaXLeft * easing;
  easedMouseY += deltaY * easing;

  for (side = 0; side < 2; side++){

    let circles;

    if (side == 0) {
      circles = circlesLeft;
    } else {
      circles = circlesRight;
    }

    push();
    translate(-width/4 * (side*2-1), 0);
    scale(.5);

    //ATTEMPT AT STEREOSCOPY

    easedMouseXLeft -= stereoscopy;
    easedMouseXRight += stereoscopy;

    if (frameCount % 90 == 0) console.log(easedMouseXLeft + " " + easedMouseXRight);



    for (i = 0; i < circles.length - 1; i++) {
      c = circles[i+1];
      cBigger = circles[i];

      let easedMouseX = (side == 0 ? easedMouseXLeft : easedMouseXRight);
      //console.log(easedMouseX);

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
    pop();

    easedMouseXLeft += stereoscopy;
    easedMouseXRight -= stereoscopy;

  }
}
