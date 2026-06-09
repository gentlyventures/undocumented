import os
from openai import OpenAI

# Initialize OpenAI client for ticket analysis
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

SYSTEM_PROMPT = "You are a customer support ticket router agent."

def analyze_customer_ticket(ticket_text: str) -> str:
    template = "Analyze the sentiment and extract keywords for the following ticket: {ticket}. Suggest routing priority."
    prompt = template.format(ticket=ticket_text)
    
    # Call OpenAI Chat Completion
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=800
    )
    return response.choices[0].message.content
