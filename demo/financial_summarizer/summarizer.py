import os
from anthropic import Anthropic

# Initialize Anthropic client for financial news summaries
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", "mock-key"))

SYSTEM_PROMPT = "You are a financial news summarization assistant. Extract stock tickers and summarize in one sentence."

def summarize_news_bulletin(news_text: str) -> str:
    template = "Extract tickers and summarize this bulletin: {news}"
    prompt = template.format(news=news_text)
    
    # Call Anthropic Message API
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=150,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.0
    )
    return response.content[0].text
