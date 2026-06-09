import os
import google.generativeai as genai

# Initialize Google Gemini client
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "mock-key"))

SYSTEM_PROMPT = "You are a Socratic math tutor. Explain algebra problems step-by-step using questions."

def explain_math_problem(problem_text: str) -> str:
    template = "Help me solve this equation: {equation}"
    prompt = template.format(equation=problem_text)
    
    # Instantiate the model with system instruction
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT
    )
    
    # Call Gemini Content Generation
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.4,
            max_output_tokens=600
        )
    )
    return response.text
