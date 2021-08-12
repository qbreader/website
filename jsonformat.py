import json 
import os

directory = 'test'

for filename in os.listdir(directory):
    f = open(directory + '/' + filename)
    data = json.load(f)

    print(data)

    for i in range(len(data['tossups'])):
        if 'number' in data['tossups'][i]:
            del data['tossups'][i]['number']
        
        if 'question' in data['tossups'][i]:
            del data['tossups'][i]['question']
        if 'answer' in data['tossups'][i]:
            del data['tossups'][i]['answer']

        if 'answers' in data['bonuses'][i]:
            del data['bonuses'][i]['answers']
        if 'leadin' in data['bonuses'][i]:
            del data['bonuses'][i]['leadin']
        if 'parts' in data['bonuses'][i]:
            del data['bonuses'][i]['parts']
        if 'values' in data['bonuses'][i]:
            del data['bonuses'][i]['values']


    f = open(directory + '/' + filename, 'w')
    json.dump(data, f)

