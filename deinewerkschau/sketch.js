let logo;
let instruction;

let hue;
let fontWeight;
let lockedIn = false;

function setup() {
	createCanvas(windowWidth, windowHeight);
	logo = document.querySelector("h1");
	instruction = document.querySelector("h2");
}


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}


function draw() {
	clear();
	if (!lockedIn) {
		customize();
	} else {
		revealOthers();
	}
	drawCursor(mouseX, mouseY, hue, fontWeight);
}


function mouseClicked() {
	if (lockedIn) {
		console.log("test");		
		location.reload(true);
	}


	lockedIn = true;
}


function customize() {
	fontWeight = map(mouseX, 0, windowWidth, 100, 800);
	logo.style.fontVariationSettings = "\"wght\" " + fontWeight;
	instruction.style.fontVariationSettings = "\"wght\" " + fontWeight;
	

	hue = map(mouseY, 0, windowHeight, 0, 360);
	let currentColor = "hsl(" + hue + ", 60%, 50%)";
	logo.style.color = currentColor;
}


function drawCursor(x, y, cursorHue, fontw) {
	let mX = x;
	let mY = y;

	let size = 15;

	let thickness = 7 + map(fontw, 100, 800, -3, 2.5);
	strokeWeight(thickness);

	colorMode(HSL);
	let c = color(cursorHue, 60, 50);	
	stroke(c);


	strokeCap(SQUARE);
	line(mX, mY, mX+size*1.5, mY+size*1.5);
	strokeCap(PROJECT);
	line(mX, mY, mX, mY+size);
	line(mX, mY, mX+size, mY)
}


let revealProcess = 0;
let otherCursors = [];
let mouseLoc;

function revealOthers() {
	noStroke();
	dSize = 10 * revealProcess;

	if (revealProcess == 0) { 
		mouseLoc = createVector(mouseX, mouseY);
	}
	ellipse(mouseLoc.x, mouseLoc.y, dSize + 50);

	//add fake cursor
	if (revealProcess % 4 == 0 && revealProcess > 5) {
		let realCursorPos = createVector(mouseLoc.x, mouseLoc.y);
		let fakeCursorPos = realCursorPos.add(createVector(dSize/3, dSize/3).rotate(random(0, TWO_PI)))
		otherCursors.push([
			fakeCursorPos.x,
			fakeCursorPos.y,
			random(0, 360),
			random(100, 800)
		]);
		
	}

	//draw fake cursors
	for (i = 0; i < otherCursors.length; i++) {
		drawCursor(otherCursors[i][0], otherCursors[i][1], otherCursors[i][2], otherCursors[i][3])
	}

	revealProcess++;
}
