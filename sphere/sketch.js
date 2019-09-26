function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	smooth();
	noFill();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight, WEBGL);
}


function draw() {
	background(255);

	var x = map(mouseX, 0, width, -PI ,PI);
	var y = map(mouseY, 0, height, -PI, PI);

	rotateY(x);
	rotate(-y, [cos(x), 0, sin(x)]);

	ellipse(0, 0, height / 2, height / 2, 50);
	rotateX(HALF_PI);
	ellipse(0, 0, height / 2, height / 2, 50);
	rotateY(HALF_PI);
	ellipse(0, 0, height / 2, height / 2, 50);

}
