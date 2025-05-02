const { animate, utils, stagger, eases } = anime;

// Function to detect if the screen width is for mobile
function isMobile() {
  const deviceWidth = document.documentElement.clientWidth;
  return deviceWidth <= 768;
}

// Function to apply rules based on screen width
function applyRules() {
  if (isMobile()) {
    // Rules for mobile
    animate('.line', {
      '--x-rot': [30, -30, 30],
      delay: (el, i) => i * 100, // Offset animation based on index
      duration: 3000,
      ease: 'inOutBack(1.2)',
      loop: true,
      loopDelay: 0,
    });
  } else {
    // Rules for desktop
    animate('.line', {
      '--x-rot': [30, -30, 30],
      delay: (el, i) => i * 150,
      duration: 3500,
      ease: 'inOutBack(1.15)',
      loop: true,
      loopDelay: 3500,
    });
  }
}

// Function to handle keypress events
function handleKeyPress(event) {
  if (event.key === 'w') {
    document.body.style.backgroundColor = 'white';
  } else if (event.key === 'b') {
    document.body.style.backgroundColor = 'black';
  }
}

// Add event listener for keypress
window.addEventListener('keydown', handleKeyPress);

// Apply rules on load
window.addEventListener('DOMContentLoaded', applyRules);

// Apply rules on resize
window.addEventListener('resize', applyRules);
