let bust;
let font;


function preload() {
  bust = loadModel('res/angelique_collapsed.obj');
	font = loadFont('res/NectoMono-Regular.otf');
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	textFont(font);
	textSize(width/10);
	textAlign(RIGHT);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

let rotX = 0;
let lightDistance = 500;

function draw() {
	background(255);

	fill(0);
	text("Model by Geoffrey Marchal: https://www.blendswap.com/blend/21367", width - 1, height - 50);

	pointLight(255,255,255,0,sin(rotX) * lightDistance,cos(rotX) * lightDistance);
	ambientLight(50);

	translate(0, height / 5, 0);
	rotateX(PI);
	rotateY(PI);


	noStroke();
	ambientMaterial(250);
	//normalMaterial();

	bust.computeNormals();
	scale(600);
	model(bust);

	rotX += accelerationX;
}
