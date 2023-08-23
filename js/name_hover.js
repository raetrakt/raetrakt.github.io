const nameButton = document.querySelector(".name-button");
const nameText = document.querySelector(".name-text");
const nameTextMaxWidth = document.querySelector(".name-text-maxwidth");
const nameStates = [
  "PITZER.XYZ",
  "PITZER.XY",
  "PITZER.X",
  "PITZER.",
  "PITZER",
  " PITZER",
  "F PITZER",
  "FA PITZER",
  "FAB PITZER",
  "FABI PITZER",
  "FABIA PITZER",
  "FABIAN PITZER",
];

// Ensuring that the width of the button stays the maximum of the content
window.addEventListener("load", () => {
  const initialWidth = nameTextMaxWidth.getBoundingClientRect().width;
  nameButton.style.width = `${initialWidth}px`;
});

let transitionTimeout;
let isReverting = false;
let currentTransitionIndex = 0;
// Amount of time the change of one letter should take in ms
let transitionStepDuration = 40;

// Only add this functionality on desktop, because touch devices don't have hover
if (window.matchMedia("(max-width: 767px)").matches) {
  nameText.innerHTML = '<a href="index.html">PITZER.XYZ</a>';
} else {
  nameButton.addEventListener("mouseenter", () => {
    isReverting = false;
    startTransition();
  });
  
  nameButton.addEventListener("mouseleave", () => {
    isReverting = true;
    startTransition();
  });
}

// Touch approach didn't work because my stupid laptop has touch haha
// function isTouchDevice() {
//   return (
//     "ontouchstart" in window ||
//     navigator.maxTouchPoints > 0 ||
//     navigator.msMaxTouchPoints > 0
//   );
// }

function startTransition() {
  clearTimeout(transitionTimeout);

  function updateState() {
    nameText.innerText = nameStates[currentTransitionIndex];

    if (!isReverting) {
      if (currentTransitionIndex < nameStates.length - 1) {
        currentTransitionIndex++;
        transitionTimeout = setTimeout(updateState, transitionStepDuration);
      }
    } else {
      if (currentTransitionIndex > 0) {
        currentTransitionIndex--;
        transitionTimeout = setTimeout(updateState, transitionStepDuration);
      }
    }
  }

  updateState();
}
