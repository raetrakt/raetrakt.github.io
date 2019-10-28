let bust;
let font;


function preload() {
  bust = loadModel('res/angelique_collapsed.obj');
	font = loadFont('res/NectoMono-Regular.otf');
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	textFont(font);
	textAlign(RIGHT);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

let rotation = 0;
let easedRotation = 0;
let lightDistance = 400;
let easing = 0.1;

function draw() {
	background(255);
  let delta = rotation - easedRotation;
  
  //fix for jump around the switch from rotation 359 to 0
  if (delta > 300) delta = 0;

  easedRotation += delta * easing;

  push();
  let xPos = sin(radians(easedRotation)) * lightDistance;
  let zPos = cos(radians(easedRotation)) * lightDistance;
	pointLight(255,255,255,0,xPos,zPos);
  push();
  translate(xPos,0,zPos);
  sphere(5);
  pop();
	ambientLight(40);

	translate(0, height / 3.5, 0);
	rotateX(PI);
	rotateY(PI);


	noStroke();
	ambientMaterial(250);
	//normalMaterial();

	bust.computeNormals();
	scale(450);
	model(bust);
  pop();


//TEXT
  fill(30);

  //translate(width / 2 - (width/50), height / 2 - (width/50), 0);
  textSize(height/80);

  text("Model by Geoffrey Marchal: https://www.blendswap.com/blend/21367", width / 2 - (height/50), height / 2 - (height/50));
  text("x: " + int(rotationX) + " y: " + int(rotationY) + " z: " + int(rotationZ), width / 2 - (height/50), height / 2 - ((height/50)*2));
  textSize(height/60);
  //text(int(rotX), - width / 2 + (width/10), height / 2 - (width/50));
  //text(int(rotationY), - width / 2 + (width/10), height / 2 - (width/50));


  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      // is mobile..
    rotation = rotationZ - 90;
  } else {
    rotation = mouseX;
  }
}
