import os
import google.generativeai as genai

# Initialize Google Gemini client for ScriptSync continuity check
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "mock-key"))

SYSTEM_PROMPT = "You are a film production screenplay parsing and continuity checker agent. Maintain character wardrobe, makeup, and location detail anchors."

def audit_screenplay_continuity(screenplay_text: str, character_manifest: str) -> str:
    template = "Analyze the following screenplay scene. Verify continuity against character manifest: {manifest}. Screenplay Scene:\n{scene_text}\nOutput issues as JSON."
    prompt = template.format(manifest=character_manifest, scene_text=screenplay_text)
    
    # Instantiate the model with system instruction (using gemini-1.5-pro for long screenplay context)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        system_instruction=SYSTEM_PROMPT
    )
    
    # Call Gemini Content Generation
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=1500
        )
    )
    return response.text
