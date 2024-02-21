import random

def shuffle_file(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    random.shuffle(lines)

    with open(file_path, 'w') as file:
        file.writelines(lines)

file_path = 'transformed_data.txt'
shuffle_file(file_path)
