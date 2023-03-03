function updateValues() {
    // Get slider values
    let parent = this.parentNode;
    let slides = parent.getElementsByTagName('input');
    let slide1 = parseFloat(slides[0].value);
    let slide2 = parseFloat(slides[1].value);
    // Neither slider will clip the other, so make sure we determine which is larger
    if (slide1 > slide2) {
        let tmp = slide2;
        slide2 = slide1;
        slide1 = tmp;

        slides[0].value = slide1;
        slides[1].value = slide2;
    }

    let displayElement = parent.getElementsByClassName('rangeValues')[0];
    displayElement.innerHTML = slide1 + ' - ' + slide2;
}

// Initialize Sliders
let sliderSections = document.getElementsByClassName('dual-slider');
for (let x = 0; x < sliderSections.length; x++) {
    let sliders = sliderSections[x].getElementsByTagName('input');
    for (let y = 0; y < sliders.length; y++) {
        if (sliders[y].type ==='range') {
            sliders[y].oninput = updateValues;
            // Manually trigger event first time to display values
            sliders[y].oninput();
        }
    }
}
