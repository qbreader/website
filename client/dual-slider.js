const slidersToUpdate = [];

document.body.onmouseup = function() {
    for (let i = 0; i < slidersToUpdate.length; ++i) {
        if (slidersToUpdate[i].onchange) {
            slidersToUpdate[i].onchange();
        }
    }
    slidersToUpdate.length = 0;
};

$(document).ready(function() {
    $('#slider').slider({
        min: 2000,
        max: 2023,
        step: 1,
        values: [2010, 2023],
        slide: function(event, ui) {
            for (let i = 0; i < ui.values.length; ++i) {
                $(`span.sliderValue${i}`)[0].innerHTML = ui.values[i];
                if (!slidersToUpdate.includes($(`span.sliderValue${i}`)[0])) {
                    slidersToUpdate.push($(`span.sliderValue${i}`)[0]);
                }
            }
        }
    });

    document.getElementById('slider').classList.remove('ui-widget-content');
    document.getElementById('slider').classList.remove('ui-widget');

    $('input.sliderValue').change(function() {
        let $this = $(this);
        $('#slider').slider('values', $this.data('index'), $this.val());
    });
});
