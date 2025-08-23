import json
import os

def append_to_json_file(new_data: dict, file_path: str = "breaking.json"):
    """
    Append a new JSON object to an existing JSON array file.
    If the file does not exist, create it with a new array.
    """
    if os.path.exists(file_path):
        # Load existing data
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                existing_data = json.load(f)
                if not isinstance(existing_data, list):
                    print("⚠️ File exists but is not a JSON array. Overwriting.")
                    existing_data = []
            except json.JSONDecodeError:
                print("⚠️ File exists but is invalid JSON. Overwriting.")
                existing_data = []
    else:
        existing_data = []

    # Append new entry
    existing_data.append(new_data)

    # Save back to file
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    print(f"✅ Added data to {file_path}. Total entries: {len(existing_data)}")
