export function showAlert (text, onClose) {
  const alertModalElement = document.getElementById('alert-modal');
  const alertModalText = document.getElementById('alert-modal-text');
  const alertModal = bootstrap.Modal.getOrCreateInstance(alertModalElement);

  alertModalText.textContent = text;

  const hiddenHandler = () => {
    onClose?.();
  };

  alertModalElement.addEventListener('hidden.bs.modal', hiddenHandler, { once: true });
  alertModal.show();
}
