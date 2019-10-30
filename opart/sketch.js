//i think the core problem of this sketch is that when a circle collides with its boundaries, it doesnt slide along them, but gets stuck
//well, started off pretty clean but now..

let circles = [];
let numberOfCircles = 100;
let extendedScreen;
let moveSpeed = .5;

let easedMouseX = 0;
let easedMouseY = 0;
let easing = .7;


function setup() {
  createCanvas(windowWidth, windowHeight);

  extendedScreen = width > height ? width/.8 : height/.8;

  for (i = 0; i < numberOfCircles; i++) {
    let blackOrWhite = i % 2 == 0 ? 'black' : 'white';
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


    //circles.length - 1 in as index fixes the bug of it going crazy when reaching the point where the mouse is.
    //also i think the direction.mag() >  is needed
    //though now the circles dont move individually, as i intended
    let direction = createVector(easedMouseX - circles[circles.length - 1].position.x, easedMouseY - circles[circles.length - 1].position.y);

    //circles break if distance to mouse is 0 i think
    if (direction.mag() > 30) {

      let nextPosition = c.position.copy().add(direction.copy().normalize().mult(i).mult(moveSpeed));

      //if it will be still inside of boundary of bigger circle
      if (nextPosition.dist(cBigger.position) < (cBigger.diameter/2 - c.diameter/2)) {
        //move
        c.position = nextPosition;
      }



      //attempt of a fix that puts circles back into bounds, bc sometimes, at high move speeds, the circles jump out -
      //doesnt work for some reason
      if (c.position.dist(cBigger.position) > (cBigger.diameter/2 - c.diameter/2)) {
        print("this triggers");
        //attempt 1
        //let offBoundsDirection = createVector(cBigger.position, c.position);
        //c.position.add(offBoundsDirection.normalize().mult(c.position.dist(cBigger.position) - cBigger.diameter/2));
        //attempt 2
        let offBoundsVector = createVector(c.position.x - cBigger.position.x, c.position.y - cBigger.position.y);
        c.position = cBigger.position.copy().add(offBoundsVector.limit(cBigger.diameter/2 - c.diameter/2));
      }
    } else { //print("blocked because pos dist to mouse too short");
    }
    print(frameRate());

    fill(c.fillColor);
    ellipse(c.position.x, c.position.y, c.diameter, c.diameter);
    //print('test');
  }
}
