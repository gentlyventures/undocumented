import os
import ast
import re
from typing import List, Dict, Any, Set

def get_node_str(node: ast.AST) -> str:
    """Helper to convert Name or Attribute AST nodes to their string representation."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        val_str = get_node_str(node.value)
        if val_str:
            return f"{val_str}.{node.attr}"
    return ""

class LLMASTVisitor(ast.NodeVisitor):
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.imports: List[Dict[str, Any]] = []
        self.call_sites: List[Dict[str, Any]] = []
        self.prompt_templates: List[Dict[str, Any]] = []
        self.configurations: List[Dict[str, Any]] = []
        self.imported_names: Dict[str, str] = {}
        self.client_variables: Dict[str, str] = {}
        
    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name_lower = alias.name.lower()
            local_name = alias.asname if alias.asname else alias.name
            
            # Map import name to canonical package
            if "openai" in name_lower:
                self.imported_names[local_name] = "openai"
            elif "anthropic" in name_lower:
                self.imported_names[local_name] = "anthropic"
            elif "google.generativeai" in name_lower or "generativeai" in name_lower:
                self.imported_names[local_name] = "google.generativeai"
            elif "langchain" in name_lower:
                self.imported_names[local_name] = "langchain"
                
            if any(p in name_lower for p in ["openai", "anthropic", "google.generativeai", "langchain"]):
                self.imports.append({
                    "line": node.lineno,
                    "name": alias.name
                })
        self.generic_visit(node)
        
    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            module_lower = node.module.lower()
            is_llm_module = any(p in module_lower for p in ["openai", "anthropic", "google.generativeai", "langchain"])
            
            for alias in node.names:
                local_name = alias.asname if alias.asname else alias.name
                fqn = f"{node.module}.{alias.name}"
                
                if "openai" in module_lower:
                    self.imported_names[local_name] = fqn
                elif "anthropic" in module_lower:
                    self.imported_names[local_name] = fqn
                elif "google.generativeai" in module_lower or "generativeai" in module_lower:
                    self.imported_names[local_name] = fqn
                elif "langchain" in module_lower:
                    self.imported_names[local_name] = fqn
                
                if is_llm_module:
                    self.imports.append({
                        "line": node.lineno,
                        "module": node.module,
                        "name": alias.name
                    })
        self.generic_visit(node)

    def _is_llm_client_init(self, node: ast.AST) -> str:
        """Check if a node is an LLM client instantiation (e.g. OpenAI(), Anthropic(), etc.)"""
        if not isinstance(node, ast.Call):
            return ""
            
        func_name = ""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            names = []
            curr = node.func
            while isinstance(curr, ast.Attribute):
                names.append(curr.attr)
                curr = curr.value
            if isinstance(curr, ast.Name):
                names.append(curr.id)
            func_name = ".".join(reversed(names))
            
        if not func_name:
            return ""
            
        func_lower = func_name.lower()
        parts = func_name.split('.')
        base_module = parts[0]
        
        resolved_base = self.imported_names.get(base_module, base_module)
        resolved_full = resolved_base
        if len(parts) > 1:
            resolved_full = resolved_base + "." + ".".join(parts[1:])
        
        resolved_lower = resolved_full.lower()
        
        if "openai" in resolved_lower:
            if any(x in resolved_lower for x in ["openai", "asyncopenai", "chatopenai", "openaiembeddings"]):
                return "openai"
        if "anthropic" in resolved_lower:
            if any(x in resolved_lower for x in ["anthropic", "asyncanthropic", "chatanthropic"]):
                return "anthropic"
        if "google.generativeai" in resolved_lower or "generativemodel" in resolved_lower or "generative_model" in resolved_lower:
            return "gemini"
        if "langchain" in resolved_lower:
            return "langchain"
            
        # Fallback to name matching
        if "openai" in func_lower:
            return "openai"
        elif "anthropic" in func_lower:
            return "anthropic"
        elif "generativemodel" in func_lower or "generative_model" in func_lower:
            return "gemini"
        elif "chatopenai" in func_lower or "chatanthropic" in func_lower or "langchain" in func_lower:
            return "langchain"
            
        return ""

    def visit_Assign(self, node: ast.Assign):
        # Trace client variable initializations
        provider = self._is_llm_client_init(node.value)
        if provider:
            for target in node.targets:
                target_str = get_node_str(target)
                if target_str:
                    self.client_variables[target_str] = provider
                    if "." in target_str:
                        self.client_variables[target_str.split(".")[-1]] = provider
                        
        for target in node.targets:
            if isinstance(target, ast.Name):
                var_name = target.id
                val_content = None
                
                if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                    val_content = node.value.value
                elif isinstance(node.value, ast.JoinedStr):
                    # Reconstruct f-string placeholders
                    parts = []
                    for val in node.value.values:
                        if isinstance(val, ast.Constant):
                            parts.append(str(val.value))
                        elif isinstance(val, ast.FormattedValue):
                            if isinstance(val.value, ast.Name):
                                parts.append(f"{{{val.value.id}}}")
                            else:
                                parts.append("{var}")
                    val_content = "".join(parts)
                
                if val_content:
                    var_lower = var_name.lower()
                    is_prompt_var = any(p in var_lower for p in ["prompt", "template", "sys_msg", "instruction", "query", "system_prompt"])
                    has_placeholders = "{" in val_content and "}" in val_content
                    
                    if is_prompt_var or has_placeholders:
                        self.prompt_templates.append({
                            "line": node.lineno,
                            "variable_name": var_name,
                            "content": val_content
                        })
        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign):
        if node.value:
            provider = self._is_llm_client_init(node.value)
            if provider:
                target_str = get_node_str(node.target)
                if target_str:
                    self.client_variables[target_str] = provider
                    if "." in target_str:
                        self.client_variables[target_str.split(".")[-1]] = provider
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Resolve the function name
        func_name = ""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            names = []
            curr = node.func
            while isinstance(curr, ast.Attribute):
                names.append(curr.attr)
                curr = curr.value
            if isinstance(curr, ast.Name):
                names.append(curr.id)
            func_name = ".".join(reversed(names))
            
        func_lower = func_name.lower()
        parts = func_name.split('.')
        base_module = parts[0] if parts else ""
        
        # Check if it is a client initialization or class constructor call
        is_client_init = False
        if parts:
            resolved_base = self.imported_names.get(base_module, base_module)
            resolved_full = resolved_base
            if len(parts) > 1:
                resolved_full = resolved_base + "." + ".".join(parts[1:])
            
            resolved_lower = resolved_full.lower()
            if any(c in resolved_lower for c in ["openai", "asyncopenai", "anthropic", "asyncanthropic", "generativemodel", "chatopenai", "chatanthropic", "openaiembeddings", "generative_model"]):
                if not any(x in parts for x in ["create", "generate_content", "invoke", "ainvoke", "complete"]):
                    is_client_init = True

        # Check if it is a completion/generation method
        is_completion_method = False
        if isinstance(node.func, ast.Attribute) and node.func.attr in ["create", "complete", "generate_content", "invoke", "ainvoke"]:
            is_completion_method = True
            
        is_llm = False
        if is_client_init:
            is_llm = True
        elif is_completion_method:
            # We ONLY flag this if it originates from a known LLM variable or module
            base_name = None
            curr = node.func
            while isinstance(curr, ast.Attribute):
                curr = curr.value
            if isinstance(curr, ast.Name):
                base_name = curr.id
                
            if base_name:
                # 1. Explicitly initialized client variable
                if base_name in self.client_variables:
                    is_llm = True
                # 2. Known import alias
                elif base_name in self.imported_names:
                    imported_val = self.imported_names[base_name]
                    if any(p in imported_val.lower() for p in ["openai", "anthropic", "google.generativeai", "langchain"]):
                        is_llm = True
                # 3. Common client variable name AND an LLM package is imported in this file
                elif base_name.lower() in ["client", "llm", "model", "openai_client", "anthropic_client", "gpt_client", "genai_client"]:
                    has_llm_imports = any(
                        any(p in val.lower() for p in ["openai", "anthropic", "google.generativeai", "langchain"])
                        for val in self.imported_names.values()
                    )
                    if has_llm_imports:
                        is_llm = True
            else:
                # E.g. ChatOpenAI(..).invoke(..)
                if isinstance(node.func.value, ast.Call):
                    if self._is_llm_client_init(node.func.value):
                        is_llm = True

        if is_llm:
            config = {}
            for kw in node.keywords:
                if not kw.arg:
                    continue
                val = None
                if isinstance(kw.value, ast.Constant):
                    val = kw.value.value
                elif isinstance(kw.value, ast.Name):
                    val = f"var:{kw.value.id}"
                else:
                    val = "<dynamic>"
                    
                if kw.arg in ["model", "model_name", "temperature", "max_tokens", "max_completion_tokens", "top_p", "api_key"]:
                    key_name = "model" if kw.arg == "model_name" else kw.arg
                    config[key_name] = val

            self.call_sites.append({
                "line": node.lineno,
                "function": func_name,
                "config": config
            })
            
            if config:
                self.configurations.append({
                    "line": node.lineno,
                    "function": func_name,
                    **config
                })
                
        self.generic_visit(node)

def generate_mock_payload_from_template(content: str) -> Dict[str, str]:
    """Extract placeholders like {placeholder} and construct suitable mock values."""
    placeholders = re.findall(r'\{([a-zA-Z0-9_]+)\}', content)
    payload = {}
    for p in placeholders:
        p_lower = p.lower()
        if "text" in p_lower or "body" in p_lower:
            payload[p] = "Enterprise LLM deployment requires evaluating cost, throughput, and quality. Processing pipelines can be restructured using async concurrent strategies or batch APIs."
        elif "query" in p_lower or "question" in p_lower:
            payload[p] = "What is the primary difference in cost between OpenAI Sequential and Batch strategies?"
        elif "context" in p_lower or "docs" in p_lower:
            payload[p] = "Documentation: Sequential baseline is stable but slow. Async Concurrent scales with semaphores. Batch API reduces cost by 50% but adds latency. Semantic Clustering optimizes template-based cache hits."
        elif "name" in p_lower:
            payload[p] = "EnterprisePipeline"
        elif "limit" in p_lower or "count" in p_lower:
            payload[p] = "10"
        else:
            payload[p] = f"simulated_{p}_val"
    return payload

def analyze_file(filepath: str, relative_path: str) -> Dict[str, Any]:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
            
        tree = ast.parse(code)
        visitor = LLMASTVisitor(relative_path)
        visitor.visit(tree)
        
        return {
            "file": relative_path,
            "imports": visitor.imports,
            "call_sites": visitor.call_sites,
            "prompt_templates": visitor.prompt_templates,
            "configurations": visitor.configurations,
            "success": True
        }
    except Exception as e:
        return {
            "file": relative_path,
            "success": False,
            "error": str(e)
        }

def extract_config(snippet: str) -> Dict[str, Any]:
    config = {}
    
    # Model pattern: either string literal OR identifier/variable
    model_str_match = re.search(r'\b(?:model|model_name|Model)\b\s*[:=]\s*[\'"`]([^\'"`]+)[\'"`]', snippet)
    if model_str_match:
        config["model"] = model_str_match.group(1)
    else:
        model_var_match = re.search(r'\b(?:model|model_name|Model)\b\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_.]*)', snippet)
        if model_var_match:
            var_name = model_var_match.group(1)
            if var_name.lower() not in ["null", "undefined", "true", "false"]:
                config["model"] = f"var:{var_name}"
        
    # Temperature pattern
    temp_match = re.search(r'\b(?:temperature|Temperature)\b\s*[:=]\s*([\d.]+)', snippet)
    if temp_match:
        try:
            config["temperature"] = float(temp_match.group(1))
        except ValueError:
            config["temperature"] = temp_match.group(1)
            
    # Max tokens pattern
    max_tokens_match = re.search(r'\b(?:max_tokens|max_completion_tokens|maxTokens|maxCompletionTokens)\b\s*[:=]\s*(\d+)', snippet)
    if max_tokens_match:
        try:
            config["max_tokens"] = int(max_tokens_match.group(1))
        except ValueError:
            config["max_tokens"] = max_tokens_match.group(1)
            
    # Top P pattern
    top_p_match = re.search(r'\b(?:top_p|topP)\b\s*[:=]\s*([\d.]+)', snippet)
    if top_p_match:
        try:
            config["top_p"] = float(top_p_match.group(1))
        except ValueError:
            config["top_p"] = top_p_match.group(1)
            
    # API key pattern
    api_key_match = re.search(r'\b(?:api_key|apiKey)\b\s*[:=]\s*[\'"`]([^\'"`]+)[\'"`]', snippet)
    if api_key_match:
        config["api_key"] = api_key_match.group(1)
        
    return config

def analyze_non_python_file(filepath: str, relative_path: str) -> Dict[str, Any]:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        imports = []
        call_sites = []
        configurations = []
        
        import_pattern = re.compile(
            r'(?:import\s+(?:[\w\s{},*]+)\s+from\s+[\'"]([^\'"]+)[\'"]|'
            r'import\s+[\'"]([^\'"]+)[\'"]|'
            r'require\([\'"]([^\'"]+)[\'"]\)|'
            r'^\s*[\'"]([^\'"]+)[\'"]\s*$)'
        )
        
        call_pattern = re.compile(
            r'(?:new\s+(OpenAI|Anthropic|GoogleGenAI)|'
            r'([\w_]+(?:\.[\w_]+)*(?:\.chat\.completions\.create|\.messages\.create|\.completions\.create|\.generateContent|\.GenerateContent|\.CreateChatCompletion|\.CreateCompletion|\.invoke|\.ainvoke|\.getGenerativeModel|\.Client)))\s*\('
        )
        
        for idx, line in enumerate(lines):
            line_no = idx + 1
            
            # Check for imports
            imp_match = import_pattern.search(line)
            if imp_match:
                pkg = next((g for g in imp_match.groups() if g is not None), None)
                if pkg:
                    lower_pkg = pkg.lower()
                    if any(k in lower_pkg for k in ["openai", "anthropic", "genai", "generativeai", "langchain"]):
                        imports.append({
                            "line": line_no,
                            "name": pkg
                        })
            
            # Check for call sites
            call_match = call_pattern.search(line)
            if call_match:
                func_name = next((g for g in call_match.groups() if g is not None), None)
                if func_name:
                    # Snip next 10 lines for config extraction
                    snippet_lines = lines[idx:idx+11]
                    snippet = "".join(snippet_lines)
                    config = extract_config(snippet)
                    
                    call_sites.append({
                        "line": line_no,
                        "function": func_name,
                        "config": config
                    })
                    
                    if config:
                        configurations.append({
                            "line": line_no,
                            "function": func_name,
                            **config
                        })
                        
        return {
            "file": relative_path,
            "imports": imports,
            "call_sites": call_sites,
            "prompt_templates": [],
            "configurations": configurations,
            "success": True
        }
    except Exception as e:
        return {
            "file": relative_path,
            "success": False,
            "error": str(e)
        }

def analyze_directory(directory_path: str) -> Dict[str, Any]:
    all_imports = []
    all_call_sites = []
    all_templates = []
    all_configs = []
    errors = []
    
    ignore_dirs = {".git", "venv", "env", "node_modules", "__pycache__", ".idea", ".vscode", "artifacts"}
    
    for root, dirs, files in os.walk(directory_path):
        # Modify dirs in-place to avoid traversing ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            is_py = file.endswith(".py")
            is_non_py = any(file.endswith(ext) for ext in [".js", ".ts", ".go", ".jsx", ".tsx"])
            
            if is_py or is_non_py:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, directory_path)
                
                if is_py:
                    res = analyze_file(full_path, rel_path)
                else:
                    res = analyze_non_python_file(full_path, rel_path)
                
                if res["success"]:
                    all_imports.extend([{**imp, "file": rel_path} for imp in res["imports"]])
                    all_call_sites.extend([{**cs, "file": rel_path} for cs in res["call_sites"]])
                    all_templates.extend([{**tmpl, "file": rel_path} for tmpl in res["prompt_templates"]])
                    all_configs.extend([{**cfg, "file": rel_path} for cfg in res["configurations"]])
                else:
                    errors.append({"file": rel_path, "error": res["error"]})
                    
    # Generate mock payloads for each detected template
    mock_payloads = []
    for tmpl in all_templates:
        filled_vals = generate_mock_payload_from_template(tmpl["content"])
        
        # Attempt to format it as a preview
        preview = tmpl["content"]
        try:
            preview = tmpl["content"].format(**filled_vals)
        except Exception:
            # Fallback if double curly braces or complex f-string formatting fails
            pass
            
        mock_payloads.append({
            "file": tmpl["file"],
            "line": tmpl["line"],
            "variable_name": tmpl["variable_name"],
            "template": tmpl["content"],
            "placeholders": filled_vals,
            "preview": preview
        })
        
    return {
        "imports": all_imports,
        "call_sites": all_call_sites,
        "prompt_templates": all_templates,
        "configurations": all_configs,
        "mock_payloads": mock_payloads,
        "errors": errors
    }
