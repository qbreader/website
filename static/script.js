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

if (localStorage.getItem('validSubcategories')===null)
    localStorage.setItem('validSubcategories','[]');
if (localStorage.getItem('validCategories')===null)
    localStorage.setItem('validCategories','[]');
var numSubcategories = 19;

//load the selected categories and subcategories
loadCategories();

function updateCategories() {
    let cat = document.getElementById('category-select').value;
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    if (validCategories.includes(cat)) {
        // remove cat:
        validCategories = validCategories.filter(a => a !== cat);
    } else {
        validCategories.push(cat);
    }

    localStorage.setItem('validCategories',JSON.stringify(validCategories));

    for (let i = 0; i < 12; i++) {
        let option = document.getElementById('category-select').getElementsByTagName('option')[i];
        option.innerHTML = (validCategories.includes(option.value) ? '[x] ' : '') + option.value;
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
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    if (validSubcategories.includes(subcat)) {
        // remove subcat:
        validSubcategories = validSubcategories.filter(a => a !== subcat);
    } else {
        validSubcategories.push(subcat);
    }
    localStorage.setItem('validSubcategories',JSON.stringify(validSubcategories));

    for (let i = 0; i < numSubcategories; i++) {
        let option = document.getElementById('subcategory-select').getElementsByTagName('option')[i];
        option.innerHTML = (validSubcategories.includes(option.value) ? '[x] ' : '') + option.value;
    }
}

function loadCategories() {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    for (let i = 0; i < 12; i++) {
        let option = document.getElementById('category-select').getElementsByTagName('option')[i];
        option.innerHTML = (validCategories.includes(option.value) ? '[x] ' : '') + option.value;
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

    for (let i = 0; i < numSubcategories; i++) {
        let option = document.getElementById('subcategory-select').getElementsByTagName('option')[i];
        option.innerHTML = (validSubcategories.includes(option.value) ? '[x] ' : '') + option.value;
    }
}

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

if (document.URL.substring(0, 30) === 'https://qbreader.herokuapp.com') {
    window.location.href = 'http://www.qbreader.org' + document.URL.substring(30);
}