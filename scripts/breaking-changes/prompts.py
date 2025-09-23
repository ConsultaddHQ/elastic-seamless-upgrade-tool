BREAKING_CHANGES_PROMPT = """
You are a highly accurate technical documentation parser.
Your task is to extract all **breaking changes** from the given Elasticsearch documentation HTML.

### Instructions:
1. Ignore navigation, boilerplate, or unrelated text.
2. Identify each **breaking change** and group them by category (e.g., Aggregations, Index compatibility, Scripted metrics).
3. For each change, extract:
   - "change": a short title of the breaking change
   - "details": a descriptive explanation from the docs
   - "impact": what users must do to mitigate it
4. Always include:
   - "version": the Elasticsearch version (provided separately)
   - "url": the page URL
   - "breaking_changes": array of categories and their changes
5. Output **only valid JSON**. No commentary, no markdown.

### JSON Schema:
{{
  "version": "{version}",
  "url": "{url}",
  "breaking_changes": [
    {{
      "category": "...",
      "changes": [
        {{
          "change": "...",
          "details": "...",
          "impact": "..."
        }}
      ]
    }}
  ]
}}

Now process the following HTML and return JSON only:

URL: {url}
Version: {version}
HTML: {html_content}
"""
