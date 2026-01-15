import requests
import base64
import json

import os

# Valid key found in .env.local
API_KEY = os.getenv("HF_API_KEY")
API_URL = "https://router.huggingface.co/openai/clip-vit-base-patch32"

img_data = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "inputs": img_data,
    "parameters": {
        "candidate_labels": [
            "street dogs",
            "stray dogs on the street",
            "garbage on street",
            "pothole on road"
        ]
    }
}

try:
    print(f"Testing HF API Check...")
    r = requests.post(API_URL, headers=headers, json=payload, timeout=30)
    
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print("✅ SUCCESS! RAW CLIP OUTPUT:")
        print(json.dumps(data, indent=2))
        
        if isinstance(data, list) and len(data) > 0 and 'label' in data[0]:
             print("\nVERIFIED: Response is an Array of Objects!")
    else:
        print("❌ FAILED:")
        print(r.text)
        
except Exception as e:
    print("Exception:", e)
