// https://pvigier.github.io/2020/12/12/procedural-death-animation-with-falling-sand-automata.html

export async function startSimulation(imagePathOrArray) {
  // normalize fragments list
  const fragments = Array.isArray(imagePathOrArray) ? imagePathOrArray.slice() : [imagePathOrArray];
  const PAUSE_AFTER_PILE = 6000; // ms to wait before erasing after full pile
  const PAUSE_AFTER_CLEAR = 1000; // ms to wait before spawning new pile

  const img = await loadImage(fragments[0]);
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const width = img.width;
  const height = Math.floor((width * 16) / 9);
  canvas.width = width;
  canvas.height = height;

  // control flags
  let spawningEnabled = true; // periodicSpawner checks this; clicking disables spawning
  let translating = false; // set when full-canvas translation begins

  // start erosion on click: stop spawning and begin carrying away top layers
  canvas.addEventListener('click', () => {
    if (!translating) startErosion();
  });

  // Create an empty integer grid; the first fragment will be a visible paused sprite
  const size = width * height;
  const grid = new Uint32Array(size); // all zeros -> empty

  // Reusable ImageData and fast 32-bit view over its buffer for bulk copy
  const frame = ctx.createImageData(width, height);
  const frameU32 = new Uint32Array(frame.data.buffer);

  // new: alpha threshold to remove semi-transparent halos
  const ALPHA_THRESHOLD = 240;

  // Adaptive steps per frame to make large images progress faster
  const stepsPerFrame = Math.min(16, Math.max(1, Math.floor((width * height) / 200000)));
  const bottomBase = (height - 1) * width;
  let hitFloor = false;
  // NOTE: `speed` and `acc` control the cellular automaton (settled pixels) step rate
  // (how many CA steps run per animation frame). They do NOT affect the smooth
  // sprite fall velocity (that's driven by `gravity` below). Keep `acc` at 0 to
  // disable CA acceleration.
  let speed = 0; // fractional "steps per frame" that accelerates (CA only)
  const acc = 0; // acceleration per animation frame (CA only)
  const maxSteps = 10000; // safety cap
  let animating = false;

  // Sprite-based fragments (each fragment is a textured sprite that falls smoothly)
  // sprite = { tmpCanvas, w, h, pixels32: Uint32Array, x: float, y: float, vy: float, vx: float }
  const sprites = [];
  const gravity = 0.6; // base gravity applied each frame to sprite.vy
  // Multiply gravity by this to slow/speed sprite falling. 1 = normal speed.
  // Set to e.g. 0.5 for half-speed, 0.25 for quarter-speed.
  let spriteFallMultiplier = 0.1;
  // Expose a tiny helper for debugging / quick tuning from the browser console:
  // call setSandFallMultiplier(0.5) to slow to half speed.
  try {
    window.setSandFallMultiplier = (v) => {
      spriteFallMultiplier = Number(v) || 0;
    };
  } catch (e) {}

  // Remove initial paused sprite; draw an empty initial frame instead
  // draw empty initial frame so canvas isn't blank
  frameU32.set(grid);
  ctx.putImageData(frame, 0, 0);

  function bottomHit() {
    const base = bottomBase;
    for (let x = 0; x < width; x++) {
      if (grid[base + x] !== 0) return true;
    }
    return false;
  }

  function stepOnce() {
    // iterate top-to-bottom (from bottom-1 to 0), left-to-right
    for (let y = height - 2; y >= 0; y--) {
      const rowBase = y * width;
      const nextRowBase = (y + 1) * width;
      for (let x = 0; x < width; x++) {
        const idx = rowBase + x;
        const val = grid[idx];
        if (val === 0) continue; // empty
        // try straight down
        const downIdx = nextRowBase + x;
        if (grid[downIdx] === 0) {
          grid[downIdx] = val;
          grid[idx] = 0;
          continue;
        }
        // try diagonal left or right (random preference)
        if (x > 0 && x < width - 1) {
          if ((Math.random() < 0.5 && grid[downIdx - 1] === 0) || grid[downIdx + 1] !== 0) {
            // move left-down if empty
            if (grid[downIdx - 1] === 0) {
              grid[downIdx - 1] = val;
              grid[idx] = 0;
            }
          } else {
            // move right-down if empty
            if (grid[downIdx + 1] === 0) {
              grid[downIdx + 1] = val;
              grid[idx] = 0;
            }
          }
        } else if (x > 0) {
          // only left available
          if (grid[downIdx - 1] === 0) {
            grid[downIdx - 1] = val;
            grid[idx] = 0;
          }
        } else if (x < width - 1) {
          // only right available
          if (grid[downIdx + 1] === 0) {
            grid[downIdx + 1] = val;
            grid[idx] = 0;
          }
        }
      }
    }
  }

  function step() {
    // 1) update sprite physics (smooth float motion)
    for (let si = sprites.length - 1; si >= 0; si--) {
      const s = sprites[si];
      // update velocities and positions (include horizontal movement)
      // apply spriteFallMultiplier to slow/speed sprite falling
      s.vy += gravity * spriteFallMultiplier;
      s.y += s.vy;
      if (s.vx) s.x += s.vx;

      // if sprite has entirely left the canvas horizontally, remove it (carried away)
      if (s.x + s.w < 0 || s.x > width) {
        sprites.splice(si, 1);
        continue;
      }

      // compute stamp candidate coords (rounded to pixel grid for exact match)
      const stampX = Math.round(s.x);
      const stampY = Math.round(s.y);

      // If sprite has reached bottom -> stamp
      if (stampY + s.h >= height) {
        // clamp position so it doesn't stamp outside
        const clampedY = Math.min(height - s.h, stampY);
        stampSpriteToGrid(s, stampX, clampedY);
        sprites.splice(si, 1);
        continue;
      }

      // Collision detection with settled grid:
      // check if any opaque sprite pixel has a non-zero grid cell directly below it
      // we test using integer positions based on current float position rounded for stamping.
      let collided = false;
      // bounds check for X direction
      if (stampX < -s.w || stampX > width) {
        // entirely off-canvas X; skip collision (will eventually fall out)
      } else {
        const px0 = stampX;
        const py0 = stampY;
        const pW = s.w;
        const pH = s.h;
        const spritePixels = s.pixels32;
        // iterate columns; stop early if collision found
        for (let col = 0; col < pW && !collided; col++) {
          const gx = px0 + col;
          if (gx < 0 || gx >= width) continue;
          // for this column, check rows from bottom to top -> faster detect
          for (let row = pH - 1; row >= 0; row--) {
            const spIdx = row * pW + col;
            const spColor = spritePixels[spIdx];
            if (spColor === 0) continue; // transparent pixel
            const gridYBelow = py0 + row + 1;

            // NEW GUARD: if the pixel (or the cell below it) is still above the canvas,
            // don't treat it as a collision. This avoids negative indexing into grid.
            if (gridYBelow < 0) continue;

            if (gridYBelow >= height) {
              // would hit bottom -> collide
              collided = true;
              break;
            }
            const giBelow = gridYBelow * width + gx;
            if (grid[giBelow] !== 0) {
              // To ensure we only stamp when sprite has visually passed into overlap,
              // require that the float position has moved at least halfway into the next pixel.
              // compute the float offset inside the stampY cell for the row we tested:
              const floatRowGlobal = s.y + row;
              const fractional = floatRowGlobal - Math.floor(floatRowGlobal);
              if (fractional >= 0.4) {
                collided = true;
                break;
              }
              // otherwise, don't collide yet
            }
          }
        }
      }

      if (collided) {
        // Before stamping, draw sprite at the exact integer coords it will be stamped to,
        // so visual position on screen matches the exact grid cells we write to.
        const stampX2 = Math.round(s.x);
        const stampY2 = Math.round(s.y);
        // clamp
        const finalX = Math.min(Math.max(-s.w, stampX2), width - 1);
        const finalY = Math.min(Math.max(0, stampY2), height - s.h);
        // render grid + sprite at integer pos to canvas so the user sees the exact alignment
        frameU32.set(grid);
        ctx.putImageData(frame, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(s.tmpCanvas, finalX, finalY);

        // now stamp into grid at same coords
        stampSpriteToGrid(s, finalX, finalY);
        sprites.splice(si, 1);

        // update image immediately to reflect stamp
        frameU32.set(grid);
        ctx.putImageData(frame, 0, 0);
      }
    }

    // 2) run cellular automaton steps for settled pixels
    let stepsToRun;
    if (!hitFloor) {
      speed += acc;
      stepsToRun = Math.min(maxSteps, Math.max(1, Math.floor(speed)));
    } else {
      stepsToRun = stepsPerFrame;
    }

    for (let i = 0; i < stepsToRun; i++) {
      stepOnce();
      if (!hitFloor && bottomHit()) {
        hitFloor = true; // stop accelerating after first contact
        break;
      }
    }
  }

  // Start erosion: stop spawning and begin extracting top layers into sprites
  function startErosion() {
    // disable periodic spawning and start the translate-down animation
    spawningEnabled = false;
    translating = true;
    // stop main loop if running; loop() will detect translating and exit
    // perform a snapshot-based translation so the whole canvas appears to move down
    startTranslateDown();
  }

  function erasePileTopDown() {
    return new Promise((resolve) => {
      translating = true;
      const ERASE_SPEED = 2;
      let clearedY = 0;

      function tick() {
        ctx.clearRect(0, 0, width, clearedY + ERASE_SPEED);
        for (let y = clearedY; y < clearedY + ERASE_SPEED && y < height; y++) {
          grid.fill(0, y * width, (y + 1) * width);
        }
        frameU32.set(grid);
        ctx.putImageData(frame, 0, 0);

        clearedY += ERASE_SPEED;
        if (clearedY < height) requestAnimationFrame(tick);
        else {
          translating = false;
          sprites.length = 0;
          grid.fill(0);
          frameU32.set(grid, 0);
          ctx.putImageData(frame, 0, 0);
          if (!animating) loop();
          resolve();
        }
      }

      tick();
    });
  }

  // stamps sprite pixels into the integer grid at (sx, sy).
  // sprite.pixels32 uses 0 for transparent pixels.
  function stampSpriteToGrid(sprite, sx, sy) {
    const pW = sprite.w;
    const pH = sprite.h;
    const pix = sprite.pixels32;
    for (let ry = 0; ry < pH; ry++) {
      const gy = sy + ry;
      if (gy < 0 || gy >= height) continue;
      const giBase = gy * width;
      const siBase = ry * pW;
      for (let rx = 0; rx < pW; rx++) {
        const gx = sx + rx;
        if (gx < 0 || gx >= width) continue;
        const sColor = pix[siBase + rx];
        if (sColor !== 0) {
          grid[giBase + gx] = sColor;
        }
      }
    }
  }

  function draw() {
    // bulk copy grid into frame pixel buffer and blit
    frameU32.set(grid);
    ctx.putImageData(frame, 0, 0);

    // overlay sprites (draw with fractional positions for smooth motion)
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < sprites.length; i++) {
      const s = sprites[i];
      // draw with float positions - this produces smooth movement
      ctx.drawImage(s.tmpCanvas, s.x, s.y);
    }
  }

  function loop() {
    animating = true;
    if (translating) {
      // if we're doing the full-canvas translate, stop the main loop
      animating = false;
      return;
    }
    step();
    // Only draw if there are sprites or the CA changed; step() may have already drawn when stamping,
    // but drawing here keeps continuous smooth sprites update.
    draw();
    requestAnimationFrame(loop);
  }

  function getPileTopY() {
    for (let y = 0; y < height; y++) {
      const rowBase = y * width;
      for (let x = 0; x < width; x++) {
        if (grid[rowBase + x] !== 0) return y;
      }
    }
    return height; // empty
  }

  // spawn a sprite from fragment path; sprite keeps a tmpCanvas (pixel-art) to draw & stamp
  async function addFragmentFromPath(path) {
    try {
      const fragImg = await loadImage(path);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = Math.min(fragImg.width, width);
      tmpCanvas.height = Math.min(fragImg.height, height);
      const tctx = tmpCanvas.getContext('2d');
      tctx.drawImage(fragImg, 0, 0, tmpCanvas.width, tmpCanvas.height);

      // NEW: threshold alpha to 0 or 255 and write back to tmpCanvas
      const imageData = tctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
      const fragData = imageData.data;
      for (let i = 0; i < fragData.length; i += 4) {
        fragData[i + 3] = fragData[i + 3] >= ALPHA_THRESHOLD ? 255 : 0;
      }
      tctx.putImageData(imageData, 0, 0);

      const offsetX = Math.floor((width - tmpCanvas.width) / 2);
      // spawn above the visible area so the fragment falls into view
      // INCREASED OFFSCREEN MARGIN: make sure the fragment starts fully unseen
      const OFFSCREEN_MARGIN = Math.min(Math.max(8, Math.floor(tmpCanvas.height * 0.25)), 400);
      const offsetY = -tmpCanvas.height - OFFSCREEN_MARGIN;

      // prepare 32-bit pixel array for fast stamping (0 = transparent)
      const pW = tmpCanvas.width;
      const pH = tmpCanvas.height;
      const pixels32 = new Uint32Array(pW * pH);
      for (let y = 0; y < pH; y++) {
        const baseFrag = y * pW;
        for (let x = 0; x < pW; x++) {
          const fi = (baseFrag + x) * 4;
          const a = fragData[fi + 3];
          if (a === 0) {
            pixels32[baseFrag + x] = 0;
            continue;
          }
          const r = fragData[fi];
          const g = fragData[fi + 1];
          const b = fragData[fi + 2];
          const color = r | (g << 8) | (b << 16) | (a << 24);
          pixels32[baseFrag + x] = color;
        }
      }

      // create sprite object: start centered horizontally, above canvas
      const sprite = {
        tmpCanvas,
        w: pW,
        h: pH,
        pixels32,
        x: offsetX,
        y: offsetY,
        vy: 0,
        vx: 0, // path-based fragments don't get horizontal drift by default
      };

      sprites.push(sprite);

      // ensure animation loop is running once the first sprite is added
      if (!animating) {
        loop();
      }
    } catch (e) {
      // fail silently for missing fragments
      console.warn('Failed to load fragment:', path, e);
    }
  }

  // automatic loop: periodically spawn a random fragment (never the same twice in a row)
  (async function periodicSpawner() {
    let lastIndex = -1;
    while (true) {
      if (fragments.length > 0) {
        if (spawningEnabled) {
          let idx;
          if (fragments.length === 1) idx = 0;
          else {
            do {
              idx = Math.floor(Math.random() * fragments.length);
            } while (idx === lastIndex);
          }
          lastIndex = idx;
          const path = fragments[idx];

          // check pile height before spawning
          const pileTopY = getPileTopY();
          const fragImg = await loadImage(path);
          const fragHeight = Math.min(fragImg.height, height);

          if (pileTopY - fragHeight < 0) {
            // pile full: wait before erasing
            await new Promise((r) => setTimeout(r, PAUSE_AFTER_PILE));
            await erasePileTopDown();
            await new Promise((r) => setTimeout(r, PAUSE_AFTER_CLEAR));
            continue;
          }

          await addFragmentFromPath(path);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  })();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}
