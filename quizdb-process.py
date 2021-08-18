import json
import os

def xyz(a):
    try:
        a['round'] = a['round'].split()[0]
        return 100*int(a['round']) + a['number']
    except:
        return -1 + a['number']

max_round = -1

f = open('quizdb.json')
data = json.load(f)['data']
data['tossups'].sort(key=xyz)
data['bonuses'].sort(key=xyz)

directory = 'output/'
os.mkdir(directory)

for a in data['tossups']:
    try:
        if int(a['round']) > max_round:
            max_round = int(a['round'])
    except:
        1+1

for i in range(max_round):
    g = open(directory + str(i+1) + '.json', 'w')
    output = {
        'tossups': [],
        'bonuses': []
    }
    for a in data['tossups']:
        if a['round'] == str(i+1) or a['round'] == '0' + str(i+1):
            b = {}
            b['question_sanitized'] = a['text']
            b['answer_sanitized'] = a['answer']
            if 'name' in a['subcategory']:
                b['subcategory'] = a['subcategory']['name']
            if 'name' in a['category']:
                b['category'] = a['category']['name']
            output['tossups'].append(b)

    for a in data['bonuses']:
        if a['round'] == str(i+1) or a['round'] == '0' + str(i+1):
            b = {}
            b['leadin_sanitized'] = a['leadin']
            b['answers_sanitized'] = a['answers']
            b['parts_sanitized'] = a['texts']
            if 'name' in a['subcategory']:
                b['subcategory'] = a['subcategory']['name']
            if 'name' in a['category']:
                b['category'] = a['category']['name']
            output['bonuses'].append(b)
    
    json.dump(output, g)