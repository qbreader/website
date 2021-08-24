import os
import re

names = []

for filename in os.listdir('packets'):
    if '.DS_Store' in filename:
        continue
    filename = re.sub('_', ' ', filename)
    names.append(filename)

names.sort()
for filename in names:
    print('<li>' + filename + '</li>')