const nameChangeTrigger = document.querySelector(".portrait");
const nameText = document.querySelector(".name-text");
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

let transitionTimeout;
let isReverting = false;
let currentTransitionIndex = 0;
let transitionStepDuration = 40; // Amount of time the change of one letter should take in ms

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

// Only add this functionality on desktop, because touch devices don't have hover
if (!window.matchMedia("(max-width: 767px)").matches) {
  nameChangeTrigger.addEventListener("mouseenter", () => {
    isReverting = false;
    startTransition();
  });

  nameChangeTrigger.addEventListener("mouseleave", () => {
    isReverting = true;
    startTransition();
  });
}
