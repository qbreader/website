import os

directory = 'output'

for filename in os.listdir(directory):
    os.rename(directory + '/' + filename, directory + '/' + filename[21:])