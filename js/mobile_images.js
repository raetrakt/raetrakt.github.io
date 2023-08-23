// Get all elements with class 'project'
const projects = document.querySelectorAll('.project');

// Iterate through each project
projects.forEach(project => {
    // Get all 'img' elements within the project
    const images = Array.from(project.querySelectorAll('img'));

    // Get all 'project-text-paragraph' elements within the project
    const paragraphs = Array.from(project.querySelectorAll('.project-text-paragraph'));

    // Duplicate and insert each image after its corresponding paragraph
    images.forEach((image, index) => {
        const paragraph = paragraphs[index];
        const imageClone = image.cloneNode(true); // Create a copy of the image
        imageClone.classList.add('mobile-image'); // Add a class to the clone for later hiding
        paragraph.parentNode.insertBefore(imageClone, paragraph.nextSibling);
    });
});
