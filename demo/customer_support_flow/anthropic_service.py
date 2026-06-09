from anthropic import Anthropic, AsyncAnthropic

# Instantiate Anthropic clients for support translation and categorization
client = Anthropic(api_key="mock-key-for-ast")
async_client = AsyncAnthropic()

CLASSIFY_PROMPT = "Classify support query: {query}. Output JSON with category and language."

def classify_support_query(query_text: str):
    prompt = CLASSIFY_PROMPT.format(query=query_text)
    res = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    return res.content[0].text

async def classify_support_query_async(query_text: str):
    prompt = CLASSIFY_PROMPT.format(query=query_text)
    res = await async_client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )
    return res.content[0].text
