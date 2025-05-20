import re
import yaml
import requests

def extract_breaking_changes_map(md: str) -> dict:
    pattern = re.compile(r'^## (\d+\.\d+\.\d+)', re.MULTILINE)
    matches = list(pattern.finditer(md))

    version_map = {}

    for i, match in enumerate(matches):
        version = match.group(1)
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        version_map[version] = md[start:end].strip()

    return version_map

# Fetch the markdown from the GitHub raw URL
url = "https://raw.githubusercontent.com/elastic/elasticsearch/refs/heads/main/docs/release-notes/breaking-changes.md"
response = requests.get(url)
response.raise_for_status()  # Raises HTTPError if status != 200
markdown_content = response.text

# Extract and save
version_map = extract_breaking_changes_map(markdown_content)

# Save to YAML file
with open("breaking-changes.yaml", "w", encoding="utf-8") as f:
    yaml.dump(version_map, f, allow_unicode=True, sort_keys=True)

print("✅ breaking-changes.yaml created successfully.")
