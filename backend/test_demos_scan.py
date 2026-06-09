import os
import sys
from analyzer import analyze_directory

def run_diagnostic():
    demo_dirs = ["customer_support_flow", "financial_summarizer", "educational_tutor", "compliance_guard", "script_sync", "ledger_audit"]
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    print("========================================")
    print("  DIAGNOSTIC CODEBASE SCANS VERIFICATION")
    print("========================================\n")
    
    for demo in demo_dirs:
        path = os.path.join(base_dir, "demo", demo)
        print(f"--- Scanning Demo Repository: {demo} ---")
        print(f"Path: {path}")
        
        result = analyze_directory(path)
        
        print(f"Success: {len(result.get('errors', [])) == 0}")
        print(f"Detected Imports: {[imp['name'] for imp in result.get('imports', [])]}")
        print(f"Detected Call Sites Count: {len(result.get('call_sites', []))}")
        for cs in result.get('call_sites', []):
            print(f"  - Line {cs['line']}: {cs['function']} (model: {cs['config'].get('model', 'None')})")
            
        print(f"Detected Prompt Templates Count: {len(result.get('prompt_templates', []))}")
        for pt in result.get('prompt_templates', []):
            print(f"  - Line {pt['line']}: {pt['variable_name']} -> {repr(pt['content'][:60])}...")
            
        print("-" * 40 + "\n")

if __name__ == "__main__":
    run_diagnostic()
