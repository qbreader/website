const htmlTag = document.getElementsByTagName('html')[0];

let colorTheme = 'light';
if (window.localStorage.getItem('color-theme') === 'dark') {
  colorTheme = 'night';
} else if (window.localStorage.getItem('color-theme') === 'light') {
  colorTheme = 'light';
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // Get OS preferred color scheme
  colorTheme = 'night';
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  colorTheme = 'light';
}

htmlTag.setAttribute('data-bs-theme', colorTheme);
