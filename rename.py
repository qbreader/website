import os

directory = '2021-pace'

for filename in os.listdir(directory):
    os.rename(directory + '/' + filename, directory + '/' + filename[6:])