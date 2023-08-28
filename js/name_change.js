const nameElem = document.querySelector(".about-name");
const nameElemLine = document.querySelector(".about-title");
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
let transitionStepDuration = 90; // Amount of time the change of one letter should take in ms

function startTransition() {
  clearTimeout(transitionTimeout);

  function updateState() {
    nameElem.innerText = nameStates[currentTransitionIndex];

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

window.onload = function() {
  setTimeout(function() {startTransition()}, 1500); 
};

// Add hover functionality on desktop and a line break on mobile
if (!window.matchMedia("(max-width: 767px)").matches) {
  nameElemLine.addEventListener("mouseenter", () => {
    isReverting = true;
    startTransition();
  });

  nameElemLine.addEventListener("mouseleave", () => {
    isReverting = false;
    startTransition();
  });
} else {
  document.querySelector(".about-profession").innerText = `\nCREATIVE TECHNOLOGIST`
}
