// Adding hover class to project that is closest to center of the screen
window.addEventListener('scroll', function () {
  var centerWindow = window.innerHeight / 2;

  document.querySelectorAll('.project').forEach(function(elem) {
    var rect = elem.getBoundingClientRect();
    var quarterImagesHeight = document.querySelector(".images").offsetHeight / 4;
    var elemCenter = rect.top + elem.offsetHeight / 2;
    var adjustedElemCenter = elemCenter - quarterImagesHeight;

    if (Math.abs(centerWindow - adjustedElemCenter) < elem.offsetHeight / 2) {
      elem.classList.add('hover');
    } else {
      elem.classList.remove('hover');
    }
  });
});
