/**
 * Variables and functions common to both tossups and bonuses
 */

/**
 * Array of categories.
 */
const all_categories = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]

/**
 * Array of all subcategories.
 * Indexed by their index in the all_categories array.
 * Categories that do not have any subcategories are not listed.
 */
const all_subcategories = [
    ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    ["American History", "Ancient History", "European History", "World History", "Other History"],
    ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"]
]

function updateCategory(cat) {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    if (validCategories.length === 0) { // selecting a category when no categories are currently selected
        validCategories.push(cat);

        let index = all_categories.indexOf(cat);
        document.querySelectorAll('#subcategories label').forEach(label => {
            if (!(index in all_subcategories) || !all_subcategories[index].includes(label.getAttribute('for'))) {
                label.classList.add('d-none');
                document.getElementById(label.getAttribute('for')).checked = false;
                validSubcategories = validSubcategories.filter(a => a !== label.getAttribute('for'));
            }
        });
    } else if (validCategories.includes(cat)) { // remove category
        validCategories = validCategories.filter(a => a !== cat);

        let index = all_categories.indexOf(cat);
        if (index in all_subcategories) { // remove all subcats associated with the category
            all_subcategories[index].forEach(subcat => {
                document.querySelector(`[for="${subcat}"]`).classList.add('d-none');
                document.getElementById(subcat).checked = false;
                validSubcategories = validSubcategories.filter(a => a !== subcat);
            });
        }

        if (validCategories.length === 0) {
            document.querySelectorAll('#subcategories label').forEach(label => {
                label.classList.remove('d-none');
            });
        }
    } else {
        validCategories.push(cat);

        let index = all_categories.indexOf(cat);
        if (index in all_subcategories) {
            all_subcategories[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.remove('d-none'));
        }
    }

    localStorage.setItem('validCategories', JSON.stringify(validCategories));
    localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
}


function updateSubcategory(subcat) {
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    if (validSubcategories.includes(subcat)) {
        // remove subcat:
        validSubcategories = validSubcategories.filter(a => a !== subcat);
    } else {
        validSubcategories.push(subcat);
    }

    localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
}

function loadCategories() {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));

    if (validCategories.length === 0) {
        validSubcategories.forEach(subcat => document.querySelector(`[for="${subcat}"]`).checked = true);
        return;
    }

    all_categories.forEach((cat, index) => {
        if (validCategories.includes(cat)) {
            document.getElementById(cat).checked = true;
            if (index in all_subcategories) {
                let total = 0;
                all_subcategories[index].forEach(subcat => {
                    if (validSubcategories && validSubcategories.includes(subcat)) {
                        total++;
                        document.querySelector(`[for="${subcat}"]`).checked = true;
                    } else {
                        document.querySelector(`[for="${subcat}"]`).classList.add('d-none');
                    }
                });
    
                if (total === 0) {
                    for (let j = 0; j < all_subcategories[index].length; j++) {
                        document.querySelector(`[for="${all_subcategories[index][j]}"]`).classList.remove('d-none');
                    }
                }
            }
        } else if (index in all_subcategories) {
            all_subcategories[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.add('d-none'));
        }
    });
}

/**
 * 
 * @param {JSON} question 
 * @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
 */
function isValidCategory(question) {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));

    if (validCategories.length === 0) return true;
    if (!validCategories.includes(question['category'])) return false;

    if ('subcategory' in question === false) return true;
    if (validSubcategories.includes(question['subcategory'])) return true;

    // check to see if none of the subcategories of the question are selected
    let index = all_categories.indexOf(question['category']);
    if (!(index in all_subcategories)) return true;

    for (let i = 0; i < all_subcategories[index].length; i++) {
        if (validSubcategories.includes(all_subcategories[index][i])) return false;
    }

    // if there are no subcategories selected in the field, then it is valid
    return true;
}

if (document.URL.substring(0, 30) === 'https://qbreader.herokuapp.com') {
    window.location.href = 'http://www.qbreader.org' + document.URL.substring(30);
}

if (localStorage.getItem('validSubcategories') === null)
    localStorage.setItem('validSubcategories', '[]');
if (localStorage.getItem('validCategories') === null)
    localStorage.setItem('validCategories', '[]');

//load the selected categories and subcategories
loadCategories();

document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        updateCategory(input.id);
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        updateSubcategory(input.id);
    });
});