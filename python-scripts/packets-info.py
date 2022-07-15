# Get info about all the pakcets in the database.

import os
import json

VERBOSE = False
DIRECTORY = '../packets/'
CATEGORIES = {
    'Current Events',
    'Fine Arts',
    'Geography',
    'History',
    'Literature',
    'Mythology',
    'Philosophy',
    'Religion',
    'Science',
    'Social Science'
}
SUBCATEGORIES = {
    'American History',
    'American Literature',
    'Ancient History',
    'Auditory Fine Arts',
    'Biology',
    'British Literature',
    'Chemistry',
    'Classical Literature',
    'Current Events',
    'Drama',
    'European History',
    'European Literature',
    'Geography',
    'Long Fiction',
    'Math',
    'Misc Literature',
    'Mythology',
    'Other Academic',
    'Other Fine Arts',
    'Other History',
    'Other Literature',
    'Other Science',
    'Philosophy',
    'Physics',
    'Poetry',
    'Religion',
    'Short Fiction',
    'Social Science',
    'Trash',
    'Visual Fine Arts',
    'World History',
    'World Literature'
}

def format_spacing(string, width):
    string = str(string)
    string = string.strip()
    return ' ' * (width - len(string)) + string

for dirpath in sorted(os.listdir(DIRECTORY)):
    if dirpath == '.DS_Store': continue
    print(dirpath + ":")

    for filename in sorted(os.listdir(DIRECTORY + dirpath), key=lambda x: int(x[:-5])):
        if filename == '.DS_Store': continue

        f = open(DIRECTORY + dirpath + '/' + filename)
        data = json.load(f)

        num_questions = {'tossups': 0, 'bonuses': 0}
        category_counter = {'tossups': 0, 'bonuses': 0}
        subcategory_counter = {'tossups': 0, 'bonuses': 0}
        missing_cats = {'tossups': set(CATEGORIES), 'bonuses': set(CATEGORIES)}
        missing_subcats = {'tossups': set(SUBCATEGORIES), 'bonuses': set(SUBCATEGORIES)}

        for mode in ['tossups', 'bonuses']:
            if mode not in data:
                continue

            num_questions[mode] = len(data[mode])
            for question in data[mode]:
                if 'category' in question:
                    category_counter[mode] += 1
                    if question['category'] in missing_cats[mode]:
                        missing_cats[mode].remove(question['category'])

                if 'subcategory' in question:
                    subcategory_counter[mode] += 1
                    if question['subcategory'] in missing_subcats[mode]:
                        missing_subcats[mode].remove(question['subcategory'])

        if VERBOSE or num_questions['tossups'] < 20 or num_questions['bonuses'] < 20 \
            or category_counter['tossups'] < num_questions['tossups'] or category_counter['bonuses'] < num_questions['bonuses'] \
            or subcategory_counter['tossups'] < category_counter['tossups'] or subcategory_counter['bonuses'] < category_counter['bonuses']:
            print('    ' + format_spacing(filename[:-5] + ':', 3), end=' ')
            print(format_spacing(num_questions["tossups"], 2), end='/')
            print(format_spacing(category_counter["tossups"], 2), end='/')
            print(format_spacing(subcategory_counter["tossups"], 2), end=' ')
            print('tossups', end=' ')

            print(format_spacing(num_questions["bonuses"], 2), end='/')
            print(format_spacing(category_counter["bonuses"], 2), end='/')
            print(format_spacing(subcategory_counter["bonuses"], 2), end=' ')
            print('bonuses')

            # print(f'missing categories: {missing_cats},', end=' ')
            # print(f'missing subcategories: {missing_subcats}')