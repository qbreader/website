import os
import json

directory = 'packets/2020-ikea/'
for j in range(24):
    print(directory + str(j+1) + '.json')
    g = open(directory + str(j+1) + '.json')
    data = json.load(g)

    if 'tossups' in data:
        for tu in data['tossups']:
            if 'category' not in tu:
                print(tu['answer_sanitized'])

    if 'bonuses' in data:
        for tu in data['bonuses']:
            if 'category' not in tu:
                print(tu['answers_sanitized'])
