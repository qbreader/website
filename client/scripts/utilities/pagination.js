/**
 * Renders a Bootstrap pagination control into `container` and wires up click handlers.
 *
 * @param {HTMLElement} container - Element to render the pagination nav into.
 * @param {number} currentPage - The currently active page (1-indexed).
 * @param {number} totalPages - Total number of pages.
 * @param {(page: number) => void} onPageChange - Called with the new page number when the user navigates.
 */
export default function renderPagination (container, currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const shiftLength = window.screen.width > 992 ? 10 : 5;
  const shift = shiftLength * Math.floor((currentPage - 1) / shiftLength);
  const rangeStart = shift;
  const rangeEnd = Math.min(shift + shiftLength, totalPages);

  const pageLinks = Array(rangeEnd - rangeStart).fill().map((_, idx) => {
    const page = rangeStart + idx + 1;
    const isActive = page === currentPage;
    return `
      <li class="page-item">
        <a class="page-link ${isActive ? 'active' : ''}" href="#" data-page="${page}">${page}</a>
      </li>
    `;
  }).join('');

  container.innerHTML = `
    <nav aria-label="pagination">
      <ul class="pagination justify-content-center">
        <li class="page-item">
          <a class="page-link" href="#" aria-label="First" data-page="1">&laquo;</a>
        </li>
        <li class="page-item">
          <a class="page-link" href="#" aria-label="Previous" data-page="${Math.max(1, currentPage - 1)}">&lsaquo;</a>
        </li>
        ${pageLinks}
        <li class="page-item">
          <a class="page-link" href="#" aria-label="Next" data-page="${Math.min(totalPages, currentPage + 1)}">&rsaquo;</a>
        </li>
        <li class="page-item">
          <a class="page-link" href="#" aria-label="Last" data-page="${totalPages}">&raquo;</a>
        </li>
      </ul>
    </nav>
  `;

  for (const link of container.querySelectorAll('a.page-link')) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      const page = Number(this.dataset.page);
      if (page !== currentPage) {
        onPageChange(page);
      }
    });
  }
}
