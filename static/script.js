/**
 * Variables and functions common to both tossups and bonuses
 */

const all_categories = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]
const all_subcategories = [
    ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    ["American History", "Ancient History", "European History", "World History", "Other History"],
    ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"],
    ["Religion"],
    ["Mythology"],
    ["Philosophy"],
    ["Social Science"],
    ["Current Events"],
    ["Geography"],
    ["Other Academic"],
    ["Trash"]
]

var validSubcategories = [];
var categories = new Array(12);
for (let i = 0; i < 12; i++) {
    categories[i] = false;
}
var numSubcategories = 19;


function updateCategories() {
    let cat = document.getElementById('category-select').value;
    if (validCategories.includes(cat)) {
        validCategories = validCategories.filter(a => a !== cat);
    } else {
        validCategories.push(cat);
    }

    for (let i = 0; i < 12; i++) {
        let option = document.getElementById('category-select').getElementsByTagName('option')[i];
        option.innerHTML = option.value + (validCategories.includes(option.value) ? ' [x]' : '');
    }

    // Add the subcat options to the subcat dropdown menu
    numSubcategories = 0;
    document.getElementById('subcategory-select').innerHTML = '';
    for (let i = 0; i < 12; i++) {
        if (validCategories.length === 0 || validCategories.includes(all_categories[i])) {
            // For each valid category, add all of the subcategories
            for (let j = 0; j < all_subcategories[i].length; j++) {
                let option = document.createElement('option');
                option.value = option.innerHTML = all_subcategories[i][j];
                document.getElementById('subcategory-select').appendChild(option);
                numSubcategories++;
            }
        }
    }

    // Create an empty option in subcategories to preserve spacing / size
    if (numSubcategories === 0) {
        let option = document.createElement('option');
        document.getElementById('subcategory-select').appendChild(option);
    }
}


function updateSubcategories() {
    let subcat = document.getElementById('subcategory-select').value;
    if (validSubcategories.includes(subcat)) {
        // remove subcat:
        validSubcategories = validSubcategories.filter(a => a !== subcat);
    } else {
        validSubcategories.push(subcat);
    }

    for (let i = 0; i < numSubcategories; i++) {
        let option = document.getElementById('subcategory-select').getElementsByTagName('option')[i];
        option.innerHTML = option.value + (validSubcategories.includes(option.value) ? ' [x]' : '');
    }
}


window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}