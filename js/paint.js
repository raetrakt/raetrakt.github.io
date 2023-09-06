// Size of each grid cell in pixels
const cellSize = 6;

// Choose color for drawing
let color = "#ff8040";

// Use a unique prefix for each page's storage
const indexPrefix = "index_";
const aboutPrefix = "about_";

// Create the canvas element
const canvas = document.createElement("canvas");
canvas.classList.add("transparent-canvas");
document.body.appendChild(canvas);

// Create a floating div for the pencil icon
const pencilToggle = document.createElement("div");
pencilToggle.classList.add("pencil-toggle");
document.body.appendChild(pencilToggle);

// Get the canvas context and disable anti-aliasing
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// Variables to track the last drawn position
let isDrawing = false;
let lastCellX, lastCellY;

// Initialize the grid
let grid;
let numRows, numCols;

// Function to set canvas size
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = document.documentElement.scrollHeight * 1.01;

  // Calculate the number of rows and columns based on canvas size and cell size
  numRows = Math.ceil(canvas.height / cellSize);
  numCols = Math.ceil(canvas.width / cellSize);

  // Create a new grid with the updated size
  grid = Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => false)
  );
}

// Function to draw on the canvas using Bresenham's line algorithm
function draw(e) {
  if (isDrawing) {
    const x = e.pageX;
    const y = e.pageY;

    // Calculate the cell coordinates based on mouse position and scroll
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);

    // Ensure that the cell coordinates are within valid bounds
    if (cellX >= 0 && cellX < numCols && cellY >= 0 && cellY < numRows) {
      // If it's the first point, just draw a dot and update the grid
      if (lastCellX === undefined || lastCellY === undefined) {
        ctx.fillStyle = color;
        ctx.fillRect(cellX * cellSize, cellY * cellSize, cellSize, cellSize);
        grid[cellY][cellX] = true;
      } else {
        // Use Bresenham's line algorithm to draw a line between the last point and the current point
        const dx = Math.abs(cellX - lastCellX);
        const dy = Math.abs(cellY - lastCellY);
        const sx = lastCellX < cellX ? 1 : -1;
        const sy = lastCellY < cellY ? 1 : -1;
        let err = dx - dy;

        while (true) {
          // Draw a dot at the current position and update the grid
          ctx.fillStyle = color;
          ctx.fillRect(
            lastCellX * cellSize,
            lastCellY * cellSize,
            cellSize,
            cellSize
          );
          grid[lastCellY][lastCellX] = true;

          if (lastCellX === cellX && lastCellY === cellY) break;

          const e2 = 2 * err;
          if (e2 > -dy) {
            err -= dy;
            lastCellX += sx;
          }
          if (e2 < dx) {
            err += dx;
            lastCellY += sy;
          }
        }
      }

      // Update the last cell coordinates
      lastCellX = cellX;
      lastCellY = cellY;
    }
  }
}

// Event listeners for drawing
window.addEventListener("mousedown", (e) => {
  if (isPencilActive) {
    isDrawing = true;
  }
});

window.addEventListener("mousemove", draw);

window.addEventListener("mouseup", () => {
  isDrawing = false;

  // Reset the last cell coordinates
  lastCellX = undefined;
  lastCellY = undefined;

  saveDrawingData();
});

// Initial state of the floating div
let isPencilActive = false;

// Set size of button
pencilToggle.style.height = `${16 * cellSize}px`;
pencilToggle.style.width = `${16 * cellSize}px`;

// Function to toggle pencil mode
function togglePencilMode() {
  isPencilActive = !isPencilActive;

  // Toggle cursor style and canvas pointer events
  if (isPencilActive) {
    pencilToggle.style.backgroundImage = 'url("./images/other/cursor.svg")';
    document.body.style.cursor = `url("./images/other/pencil.svg") 8 30, crosshair`;
  } else {
    pencilToggle.style.backgroundImage = 'url("./images/other/pencil.svg")';
    document.body.style.cursor = "auto";
  }
}

// Event listener for clicking the floating div to toggle pencil mode
pencilToggle.addEventListener("click", togglePencilMode);

// Function to redraw the entire grid
function redrawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      if (grid[row][col]) {
        ctx.fillStyle = color;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Save drawing data to localStorage
function saveDrawingData() {
  // Use a unique prefix for each page's storage
  const prefix =
    window.location.pathname === "/about.html" ? aboutPrefix : indexPrefix;
  localStorage.setItem(`${prefix}drawingData`, JSON.stringify(grid));
}

// Load drawing data from localStorage when the page is loaded
function loadDrawingData() {
  // Use a unique prefix for each page's storage
  const prefix =
    window.location.pathname === "/about.html" ? aboutPrefix : indexPrefix;
  const savedData = localStorage.getItem(`${prefix}drawingData`);
  if (savedData) {
    grid = JSON.parse(savedData);
    redrawGrid();
  }
}

// Function to clear drawing data from localStorage
function clearDrawingData() {
  // Remove the drawing data for the index page
  localStorage.removeItem(`${indexPrefix}drawingData`);
  // Remove the drawing data for the about page
  localStorage.removeItem(`${aboutPrefix}drawingData`);
}

// Prepare canvas after page load
window.addEventListener("load", () => {
  // Set initial canvas size and grid
  setCanvasSize();
  // Call the loadDrawingData function when the page is loaded
  loadDrawingData();
});

// Update canvas size and grid when the window is resized
window.addEventListener("resize", () => {
    //Update size
    setCanvasSize();
    // Clear drawing data when the window is resized
    clearDrawingData();
  });
