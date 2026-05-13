export function showAlert (text, onClose) {
  const alertBox = document.getElementById('alert-box');
  const closeButton = alertBox.querySelector('.close-button');
  const alertBoxText = alertBox.querySelector('.alert-text');
  alertBoxText.textContent = text;
  alertBox.style.display = 'flex';
  alertBox.style.opacity = '1';
  closeButton.onclick = function () {
    alertBox.style.opacity = '0';
    alertBox.addEventListener('transitionend', () => {
      alertBox.style.display = 'none';
      onClose?.();
    }, { once: true });
  };
}
