/**
 * Sorts a table by the values in a specified column.
 * @param {number} n - a zero-indexed column number to sort
 * @param {boolean} numeric - whether the column values represent numeric values
 * @param {string} tableId - the id of the table to sort
 * @param {number} headers - the number of headers of the table to skip (default 1)
 * @param {number} footers - the number of footers of the table to skip (default 0)
 */
export default function sortTable (n, numeric = false, tableId = 'table', headers = 1, footers = 0) {
  let rows; let switching; let i; let x; let y; let shouldSwitch; let dir; let switchcount = 0;
  const table = document.getElementById(tableId);
  switching = true;
  // Set the sorting direction to ascending for text;
  // Numerals are always sorted in the opposite order from text
  dir = 'asc';
  /* Make a loop that will continue until
      no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    // Loop through all table rows (except headers and footers)
    for (i = headers; i < rows.length - 1 - footers; i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
        one from current row and one from the next: */
      x = rows[i].children[n];
      y = rows[i + 1].children[n];
      /* Check if the two rows should switch place,
              based on the direction, asc or desc: */
      if (dir === 'asc') {
        if (numeric) {
          if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else {
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        }
      } else if (dir === 'desc') {
        if (numeric) {
          if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else {
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
              and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      // Each time a switch is done, increase this count by 1:
      switchcount++;
    } else {
      /* If no switching has been done AND the direction is "asc",
              set the direction to "desc" and run the while loop again. */
      if (switchcount === 0 && dir === 'asc') {
        dir = 'desc';
        switching = true;
      }
    }
  }
}
