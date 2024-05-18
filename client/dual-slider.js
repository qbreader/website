const slidersToUpdate = [];

document.body.onmouseup = function () {
  for (let i = 0; i < slidersToUpdate.length; ++i) {
    if (slidersToUpdate[i].onchange) {
      slidersToUpdate[i].onchange();
    }
  }
  slidersToUpdate.length = 0;
};

$(document).ready(function () {
  $('#slider').slider({
    min: 2000,
    max: 2024,
    step: 1,
    values: [2010, 2024],
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

  // if (window.localStorage.getItem('minYear') && !location.pathname.startsWith('multiplayer')) {
  //     $('#slider').slider('values', 0, window.localStorage.getItem('minYear'));
  //     document.getElementById('year-range-a').textContent = window.localStorage.getItem('minYear');
  // }

  // if (window.localStorage.getItem('maxYear') && !location.pathname.startsWith('multiplayer')) {
  //     $('#slider').slider('values', 1, window.localStorage.getItem('maxYear'));
  //     document.getElementById('year-range-b').textContent = window.localStorage.getItem('maxYear');
  // }

  $('input.sliderValue').change(function () {
    const $this = $(this);
    $('#slider').slider('values', $this.data('index'), $this.val());
  });
});
