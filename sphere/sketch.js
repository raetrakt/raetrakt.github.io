//problems:
//https://discourse.processing.org/t/3d-rotations-rotating-around-the-screen-axes/14239/15

//sometimes the font background is white, sometimes the glyphs have a transparent background

//outer spheres disappear when type is enabled

//	for (i = 0; i < 1; i++) { in drawSphere() makes the sketch crash


let easing = 0.03;
let easedX = 0;
let easedY = 0;
let lastXY = [];

let sphereSize;
let textS;

let letters = " HELP PLEASE "
let font;

function preload() {
	font = loadFont("./resources/AOMono-Black.otf");
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	smooth();
	sphereSize = height / 2;
	textS = height / 17;
	textFont(font);
	textAlign(CENTER, CENTER);
	textSize(textS);
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight, WEBGL);
}

function draw() {
	background(255);

 	//control rotation with mouse
	let x = map(mouseX, 0, width, -PI ,PI);
	let y = map(mouseY, 0 , height, -HALF_PI, HALF_PI);

	//ease x and y value
	easedX += (x - easedX) * easing;
	easedY += (y - easedY) * easing;

	//save xy for other spheres
	lastXY.push([easedX, easedY]);

	//rotate and draw spheres
	let amount = 4; //4
	let delay = 10; //10
	let sizeDifference = 100;

	for (i = 0; i < amount; i++) {
		let current = (amount * delay) - (i * delay);
		if (lastXY.length > current) {
			push();
			rotateXY(lastXY[current][0], lastXY[current][1]);
			drawSphere(sphereSize + i * sizeDifference);
			pop();
		}
	}

	//limit saved positions list
	if (lastXY.length > amount * delay) {
		lastXY.shift();
	}

}


//this rotate function tries to rotate so that the mouse movement
//always controls the centermost point of the sphere
function rotateXY(x, y) {
	rotateY(x);
	rotate(-y, [cos(x), 0, sin(x)]);
}


function drawSphere(radius) {

	fill(0);
	for (i = 0; i < 8; i++) {
		push();
		rotateY(i * QUARTER_PI);
		for (j = 0; j < letters.length; j++) {
			let rot = map(j, 0, letters.length-1, HALF_PI, -HALF_PI);
			push();
			rotateX(rot);
			translate(-textS / 3, 0, radius / 2);
			text(letters.charAt(j), 0, 0);
			pop();
		}
		pop();
	}

	noFill();
	ellipse(0, 0, radius, radius, 50);
	rotateX(HALF_PI);
	ellipse(0, 0, radius, radius, 50);
	rotateY(HALF_PI);
	ellipse(0, 0, radius, radius, 50);
}
