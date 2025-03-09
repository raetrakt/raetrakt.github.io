const nameElem = document.querySelector('.name-button');
const nameElemText = document.querySelector('.name-text');
const nameStates = [
  'FABIAN PITZER',
  'FABIA PITZER',
  'FABI PITZER',
  'FAB PITZER',
  'FA PITZER',
  'F PITZER',
  ' PITZER',
  'PITZER',
  'PITZER.',
  'PITZER.X',
  'PITZER.XY',
  'PITZER.XYZ',
];

let transitionTimeout;
let isReverting = false;
let currentTransitionIndex = nameStates.length - 1;
let transitionStepDuration = 90; // Amount of time the change of one letter should take in ms
let timeUntilAutoChange = 15000;
let timeSpentOnFullName = 3000;

function startTransition() {
  clearTimeout(transitionTimeout);

  function updateState() {
    nameElemText.innerText = nameStates[currentTransitionIndex];
    // Add current state of transition to HTML title
    document.title = nameStates[currentTransitionIndex];

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

// Add hover functionality on desktop
if (!window.matchMedia('(max-width: 767px)').matches) {
  nameElem.addEventListener('mouseenter', () => {
    isReverting = true;
    startTransition();
  });

  nameElem.addEventListener('mouseleave', () => {
    isReverting = false;
    startTransition();
  });
}

// Trigger Transition automatically after delay
setInterval(() => {
  isReverting = true;
  startTransition();
  setTimeout(() => {
    isReverting = false;
    startTransition();
  }, timeSpentOnFullName);
}, timeUntilAutoChange); // Time of overall loop
