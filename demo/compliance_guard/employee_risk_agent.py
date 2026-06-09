import os
import google.generativeai as genai

# Initialize Google Gemini client for ComplianceGuard HR Agent
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "mock-key"))

SYSTEM_PROMPT = "You are an SME employee turnover risk analysis agent. You cross-reference performance logs and DISC profiles."

def assess_employee_turnover_risk(employee_id: str, logs: str, disc_profile: str) -> str:
    template = "Assess early turnover risk for employee {id}. DISC Profile: {disc}. Logs: {logs_content}. Suggest a mitigation training and development plan."
    prompt = template.format(id=employee_id, disc=disc_profile, logs_content=logs)
    
    # Instantiate the model with system instruction (using gemini-1.5-flash model tier)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT
    )
    
    # Call Gemini Content Generation
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,
            max_output_tokens=1000
        )
    )
    return response.text
