import { DEFAULT_MAX_YEAR, DEFAULT_MIN_YEAR, MIN_YEAR } from '../../quizbowl/constants.js';

document.querySelectorAll('span.default-min-year').forEach(element => {
  element.textContent = DEFAULT_MIN_YEAR;
});

document.querySelectorAll('span.default-max-year').forEach(element => {
  element.textContent = DEFAULT_MAX_YEAR;
});

const slidersToUpdate = [];

document.body.onmouseup = function () {
  for (let i = 0; i < slidersToUpdate.length; ++i) {
    if (slidersToUpdate[i].onchange) {
      slidersToUpdate[i].onchange();
    }
  }
  slidersToUpdate.length = 0;
};

$('#slider').slider({
  min: MIN_YEAR,
  max: DEFAULT_MAX_YEAR,
  step: 1,
  values: [DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR],
  slide: function (event, ui) {
    for (let i = 0; i < ui.values.length; ++i) {
      $(`span.sliderValue${i}`)[0].textContent = ui.values[i];
      if (!slidersToUpdate.includes($(`span.sliderValue${i}`)[0])) {
        slidersToUpdate.push($(`span.sliderValue${i}`)[0]);
      }
    }
  }
});

document.getElementById('slider').classList.remove('ui-widget-content');
document.getElementById('slider').classList.remove('ui-widget');

$('input.sliderValue').change(function () {
  const $this = $(this);
  $('#slider').slider('values', $this.data('index'), $this.val());
});
