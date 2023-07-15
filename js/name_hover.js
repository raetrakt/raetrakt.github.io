const nameButton = document.querySelector(".name-button");
const nameText = document.querySelector(".name-text");
const nameStates = [
  "FABIAN PITZER",
  "FABIA PITZER",
  "FABI PITZER",
  "FAB PITZER",
  "FA PITZER",
  "F PITZER",
  " PITZER",
  "PITZER",
  "PITZER.",
  "PITZER.X",
  "PITZER.XY",
  "PITZER.XYZ",
];
// Ensuring that the size of the button stays the same when text changes
window.addEventListener("load", () => {
  const initialWidth = nameText.getBoundingClientRect().width;
  nameButton.style.width = `${initialWidth}px`;
  nameText.style.display = "block";
});

let transitionTimeout;
let isReverting = false;
let currentTransitionIndex = 0;
// Amount of time the change of one letter should take in ms
let transitionStepDuration = 30;

nameButton.addEventListener("mouseenter", () => {
  isReverting = false;
  startTransition();
});

nameButton.addEventListener("mouseleave", () => {
  isReverting = true;
  startTransition();
});

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
