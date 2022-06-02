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
    if (validCategories.length === 0) {
        document.querySelectorAll('#subcategories label').forEach(label => {
            label.classList.add('d-none');
        });
    }
    if (validCategories.includes(cat)) {
        // remove cat:
        validCategories = validCategories.filter(a => a !== cat);
        let index = all_categories.indexOf(cat);
        if (index in all_subcategories) {
            for (let i = 0; i < all_subcategories[index].length; i++) {
                document.querySelector(`[for="${all_subcategories[index][i]}"]`).classList.add('d-none');
                validSubcategories = validSubcategories.filter(a => a !== all_subcategories[index][i]);
            }
        }
    } else {
        validCategories.push(cat);
        let index = all_categories.indexOf(cat);
        if (index in all_subcategories) {
            for (let i = 0; i < all_subcategories[index].length; i++) {
                document.querySelector(`[for="${all_subcategories[index][i]}"]`).classList.remove('d-none');
            }
        }
    }

    if (validCategories.length === 0) {
        document.querySelectorAll('#subcategories label').forEach(label => {
            label.classList.remove('d-none');
        });
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

    for (let i = 0; i < all_categories.length; i++) {
        let option = document.getElementById(all_categories[i]);
        option.checked = validCategories.includes(option.id);
    }

    if (validCategories.length !== 0) {
        if (validSubcategories.length !== 0) {
            document.querySelectorAll('#subcategories label').forEach(label => {
                label.classList.add('d-none');
            });
        }

        for (let i in validCategories) {
            let cat = validCategories[i];
            let index = all_categories.indexOf(cat);
            if (index in all_subcategories) {
                let total = 0;
                for (let j = 0; j < all_subcategories[index].length; j++) {
                    document.querySelector(`[for="${all_subcategories[index][j]}"]`).classList.remove('d-none');
                    if (validSubcategories && validSubcategories.includes(all_subcategories[index][j])) {
                        total++;
                        document.getElementById(all_subcategories[index][j]).checked = true;
                    } else {
                        // document.querySelector(`[for="${all_subcategories[index][j]}"]`).classList.add('d-none');
                    }
                }

                if (total === 0) {
                    for (let j = 0; j < all_subcategories[index].length; j++) {
                        document.querySelector(`[for="${all_subcategories[index][j]}"]`).classList.remove('d-none');
                    }
                }
            }
        }
    }
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
    input.addEventListener('click', event => {
        updateCategory(input.id);
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', event => {
        updateSubcategory(input.id);
    });
});