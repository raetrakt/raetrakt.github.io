const images = document.querySelector(".images");
const header = document.querySelector(".header");
const content = document.querySelector(".content");
const firstSection = document.querySelector(".section");

let initialHeaderHeight;
let headerHeight;
let contentPadding;

window.addEventListener("scroll", function () {
  var centerWindow = window.innerHeight / 2;

  // Enlarge images closest to center of screen by adding hover class
  document.querySelectorAll(".project").forEach(function (elem) {
    var rect = elem.getBoundingClientRect();
    var quarterImagesHeight = images.offsetHeight / 4;
    var elemCenter = rect.top + elem.offsetHeight / 2;
    var adjustedElemCenter = elemCenter - quarterImagesHeight;

    if (Math.abs(centerWindow - adjustedElemCenter) < elem.offsetHeight / 2) {
      elem.classList.add("hover");
    } else {
      elem.classList.remove("hover");
    }
  });

  // Make header sticky
  if (window.scrollY > parseFloat(contentPadding) * 0.6) {
    header.classList.add("sticky");
    header.style.paddingTop = parseFloat(contentPadding) * 0.4 + "px";
    firstSection.style.marginTop = initialHeaderHeight;
  } else {
    header.classList.remove("sticky");
    header.style.paddingTop = 0;
    firstSection.style.marginTop = 0;
  }

  // Add border on bottom of sticky header as soon as first border is crossed
  let stickyHeader = document.querySelector(".sticky");
  let stickyHeaderHeight = stickyHeader
    ? getComputedStyle(stickyHeader).getPropertyValue("height")
    : null;

  if (
    window.scrollY >
    firstSection.offsetTop - parseFloat(stickyHeaderHeight)
  ) {
    header.classList.add("sticky-border");
  } else {
    header.classList.remove("sticky-border");
  }
});

// Update size metrics on resize to get values for mobile and desktop
function updateHeaderValues() {
  initialHeaderHeight = getComputedStyle(header).getPropertyValue("--initial-height");
  headerHeight = getComputedStyle(header).getPropertyValue("height");
  contentPadding = getComputedStyle(content).getPropertyValue("padding");
}

updateHeaderValues(); // Initial call
window.addEventListener("resize", updateHeaderValues);
