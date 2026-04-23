import os

backend_dir = r'd:\PROJECTS\BETA\BETA LogiCapture 1.0\backend'

def clean_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '\"' in content:
        print(f"Fixing {path}")
        fixed = content.replace('\"', '"')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)

for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith('.py'):
            clean_file(os.path.join(root, file))

print("Backend cleanup completed.")
