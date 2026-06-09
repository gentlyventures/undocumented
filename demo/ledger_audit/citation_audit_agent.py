import os
from openai import OpenAI
import google.generativeai as genai

# NVIDIA NIM / Groq Llama 3 connection
openai_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY", "mock-groq-key")
)

# Google Gemini client configuration for LedgerAudit citation verifier
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "mock-gemini-key"))

SYSTEM_PROMPT = "You are an AI Search Citation Auditing Agent. Detect search citation gaps in LLM search responses."

def audit_domain_citation(domain: str, llm_search_response: str) -> str:
    template = "Audit visibility of domain: {domain_name}. Identify citation gaps in the search text:\n{search_text}\nSuggest content edits to improve AIO/GEO visibility."
    prompt = template.format(domain_name=domain, search_text=llm_search_response)
    
    # Query Groq/Llama 3 for citation assessment
    llama_response = openai_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=800
    )
    
    # Query Gemini 1.5 Flash to verify and summarize suggestions
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction="You are a marketing strategist summarizing citation gaps."
    )
    
    gemini_prompt = f"Verify these recommendations: {llama_response.choices[0].message.content}"
    gemini_response = model.generate_content(
        gemini_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.5,
            max_output_tokens=600
        )
    )
    
    return gemini_response.text
