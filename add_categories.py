import json

def get_subcategory(s):
        category = ''
        for key in subcat:
            works = True
            for word in key.split():
                if not word in s:
                    works = False
                    break
            if works:
                category = key 
                break

        return category

subcat = {
    "American Literature": "Literature",
    "British Literature": "Literature",
    "Classical Literature": "Literature",
    "European Literature": "Literature",
    "World Literature": "Literature",
    "Other Literature": "Literature",
    "Drama": "Literature",
    "Poetry": "Literature",
    "Long Fiction": "Literature",
    "Short Fiction": "Literature",
    "Misc Literature": "Literature",
    "American History": "History",
    "Ancient History": "History",
    "British History": "History",
    "European History": "History",
    "World History": "History",
    "Other History": "History",
    "Historiography": "History",
    "Archaeology": "History",
    "Biology": "Science",
    "Chemistry": "Science",
    "Physics": "Science",
    "Math": "Science",
    "Astronomy": "Science",
    "Computer Science": "Science",
    "Earth Science": "Science",
    "Engineering": "Science",
    "Other Science": "Science",
    "Painting": "Fine Arts",
    "Sculpture": "Fine Arts",
    "Music": "Fine Arts",
    "Other Arts": "Fine Arts",
    "Architecture": "Fine Arts",
    "Photography": "Fine Arts",
    "Film": "Fine Arts",
    "Jazz": "Fine Arts",
    "Opera": "Fine Arts",
    "Dance": "Fine Arts",
    "Religion": "Religion",
    "Mythology": "Mythology",
    "Philosophy": "Philosophy",
    "Economics": "Social Science",
    "Psychology": "Social Science",
    "Linguistics": "Social Science",
    "Sociology": "Social Science",
    "Anthropology": "Social Science",
    "Other Social Science": "Social Science",
    "Social Science": "Social Science",
    "Current Events": "Current Events",
    "Geography": "Geography",
    "Other Academic": "Other Academic",
    "Trash": "Trash",
}

f = open('categories.txt')
directory = 'output/'

for j in range(14):
    print(directory + str(j+1) + '.json')

    g = open(directory + str(j+1) + '.json')
    data = json.load(g)
    h = open(directory + str(j+1) + '.json', 'w')

    num_tu = len(data['tossups']) if 'tossups' in data else 0
    num_bonus = len(data['bonuses']) if 'bonuses' in data else 0

    print(num_tu, num_bonus)

    for i in range(num_tu):
        raw = f.readline().strip()
        cat = get_subcategory(raw)
        if len(cat) == 0:
            print(i, "tossup error finding the subcategory", raw)
        else: 
            data['tossups'][i]['subcategory'] = cat
            data['tossups'][i]['category'] = subcat[data['tossups'][i]['subcategory']]

    for i in range(num_bonus):
        raw = f.readline().strip()
        cat = get_subcategory(raw)
        if len(cat) == 0:
            print(i, "bonus error finding the subcategory", raw)
        else: 
            data['bonuses'][i]['subcategory'] = cat
            data['bonuses'][i]['category'] = subcat[data['bonuses'][i]['subcategory']]

    json.dump(data, h)
