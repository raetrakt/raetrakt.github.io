function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	smooth();
	noFill();

}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

var a = 0;

function draw() {
	background(255);
	rotate(a, [0, 1, 1]);

	ellipse(0, 0, height / 2, height / 2, 50);
	rotateX(HALF_PI);
	ellipse(0, 0, height / 2, height / 2, 50);
	rotateY(HALF_PI);
	ellipse(0, 0, height / 2, height / 2, 50);
	a += PI / 120;

}
