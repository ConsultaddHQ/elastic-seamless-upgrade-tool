import os
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from prompts import BREAKING_CHANGES_PROMPT
from utils import extract_json_content_from_markdown

# Load API key from .env
load_dotenv()
API_KEY = os.getenv("VERTEX_AI_API_KEY")
if not API_KEY:
    raise ValueError("VERTEX_AI_API_KEY not set in environment variables.")
def fetch_webpage_text(url: str) -> str:
    """Fetch raw HTML text from a given URL."""
    response = requests.get(url, timeout=15)
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Convert generator to list first
    text_list = list(soup.stripped_strings)
    
    # Truncate to avoid huge token input
    return " ".join(text_list[:3000])


def build_prompt(html_text: str, url: str, version: str) -> str:
    """Insert inputs into prompt template."""
    return BREAKING_CHANGES_PROMPT.format(
        html_content=html_text,
        url=url,
        version=version
    )

def analyze_url(url: str, version: str):
    """Analyze Elasticsearch breaking changes page with Gemini."""
    html_text = fetch_webpage_text(url)
    prompt = build_prompt(html_text, url, version)

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",  # or "gemini-pro"
        temperature=0.2,
        max_output_tokens=100000,
        google_api_key=API_KEY,
    )

    response = llm.invoke(prompt)

    # Try parsing JSON
    try:
        print(response.content)
        json_data = extract_json_content_from_markdown(response.content)
        parsed = json.loads(json_data)
        return parsed
    except Exception:
        print("⚠️ Model did not return valid JSON. Raw output:")
        return None
