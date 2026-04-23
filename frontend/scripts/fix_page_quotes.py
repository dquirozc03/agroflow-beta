import os

file_path = r'd:\PROJECTS\BETA\BETA LogiCapture 1.0\frontend\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace \" with "
fixed_content = content.replace('\\"', '"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("File fixed successfully.")
