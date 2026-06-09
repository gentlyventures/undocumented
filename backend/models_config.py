import os
import time
import asyncio
import random
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

# Model tier pricing and configurations
# input_cost_per_m and output_cost_per_m are in USD per 1,000,000 tokens
MODEL_CONFIGS = {
    "openai": {
        "low": {
            "name": "gpt-4o-mini",
            "input_cost_per_m": 0.15,
            "output_cost_per_m": 0.60,
            "base_latency": 0.15,
            "latency_per_token": 0.001
        },
        "medium": {
            "name": "gpt-4o",
            "input_cost_per_m": 2.50,
            "output_cost_per_m": 10.00,
            "base_latency": 0.35,
            "latency_per_token": 0.003
        },
        "high": {
            "name": "o1-mini",
            "input_cost_per_m": 3.00,
            "output_cost_per_m": 12.00,
            "base_latency": 1.20,
            "latency_per_token": 0.008
        }
    },
    "anthropic": {
        "low": {
            "name": "claude-3-haiku-20240307",
            "input_cost_per_m": 0.25,
            "output_cost_per_m": 1.25,
            "base_latency": 0.20,
            "latency_per_token": 0.0012
        },
        "medium": {
            "name": "claude-3-5-sonnet-20241022",
            "input_cost_per_m": 3.00,
            "output_cost_per_m": 15.00,
            "base_latency": 0.40,
            "latency_per_token": 0.004
        },
        "high": {
            "name": "claude-3-opus-20240229",
            "input_cost_per_m": 15.00,
            "output_cost_per_m": 75.00,
            "base_latency": 1.50,
            "latency_per_token": 0.012
        }
    },
    "gemini": {
        "low": {
            "name": "gemini-1.5-flash",
            "input_cost_per_m": 0.075,
            "output_cost_per_m": 0.30,
            "base_latency": 0.18,
            "latency_per_token": 0.0008
        },
        "medium": {
            "name": "gemini-1.5-pro",
            "input_cost_per_m": 1.25,
            "output_cost_per_m": 5.00,
            "base_latency": 0.45,
            "latency_per_token": 0.005
        },
        "high": {
            "name": "gemini-2.0-flash-thinking-exp",
            "input_cost_per_m": 2.00,
            "output_cost_per_m": 6.00,
            "base_latency": 1.00,
            "latency_per_token": 0.006
        }
    },
    "mistral": {
        "low": {
            "name": "mistral-small-latest",
            "input_cost_per_m": 1.00,
            "output_cost_per_m": 3.00,
            "base_latency": 0.22,
            "latency_per_token": 0.0015
        },
        "medium": {
            "name": "mistral-medium",
            "input_cost_per_m": 2.70,
            "output_cost_per_m": 8.10,
            "base_latency": 0.42,
            "latency_per_token": 0.004
        },
        "high": {
            "name": "mistral-large-latest",
            "input_cost_per_m": 2.00,
            "output_cost_per_m": 6.00,
            "base_latency": 0.80,
            "latency_per_token": 0.006
        }
    },
    "meta": {
        "low": {
            "name": "meta-llama/Llama-3-8B-Instruct",
            "input_cost_per_m": 0.05,
            "output_cost_per_m": 0.08,
            "base_latency": 0.12,
            "latency_per_token": 0.0006
        },
        "medium": {
            "name": "meta-llama/Llama-3-70B-Instruct",
            "input_cost_per_m": 0.59,
            "output_cost_per_m": 0.79,
            "base_latency": 0.30,
            "latency_per_token": 0.002
        },
        "high": {
            "name": "meta-llama/Llama-3-405B-Instruct",
            "input_cost_per_m": 2.66,
            "output_cost_per_m": 2.66,
            "base_latency": 0.75,
            "latency_per_token": 0.005
        }
    }
}

class LLMCallResponse(BaseModel):
    provider: str
    tier: str
    model_name: str
    prompt: str
    output: str
    input_tokens: int
    output_tokens: int
    cost: float
    latency: float
    simulated: bool
    success: bool
    error: Optional[str] = None

def estimate_tokens(text: str) -> int:
    """Estimate token count using tiktoken if available, otherwise heuristic."""
    try:
        import tiktoken
        # Default to cl100k_base which is standard for openai/many clients
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        # Fallback heuristic: approx 4 characters per token or 0.75 words per token
        words = len(text.split())
        chars = len(text)
        return max(1, int(max(words * 1.33, chars / 4.0)))

def generate_mock_output(prompt: str) -> str:
    """Generates a contextual, realistic mock output based on the user's prompt."""
    prompt_lower = prompt.lower()
    
    # If the user is asking for JSON
    if "json" in prompt_lower or "structured" in prompt_lower:
        if "analyze" in prompt_lower or "site" in prompt_lower:
            return (
                '{\n'
                '  "status": "success",\n'
                '  "detected_call_sites": [\n'
                '    {"file": "main.py", "line": 45, "client": "OpenAI", "model": "gpt-4o"},\n'
                '    {"file": "utils.py", "line": 112, "client": "Anthropic", "model": "claude-3-5-sonnet"}\n'
                '  ],\n'
                '  "summary": "Detected 2 model endpoints across 2 files."\n'
                '}'
            )
        return (
            '{\n'
            '  "response": "This is a simulated JSON response to mimic structured outputs.",\n'
            '  "confidence": 0.98,\n'
            '  "tokens_processed": 142,\n'
            '  "tags": ["simulation", "high-fidelity", "mock-data"]\n'
            '}'
        )
        
    # If the user is requesting code
    if "code" in prompt_lower or "python" in prompt_lower or "def " in prompt_lower or "class " in prompt_lower:
        return (
            '```python\n'
            '# High-fidelity simulated Python code response\n'
            'def process_enterprise_batch(requests, concurrency_limit=10):\n'
            '    import asyncio\n'
            '    semaphore = asyncio.Semaphore(concurrency_limit)\n'
            '    \n'
            '    async def worker(req):\n'
            '        async with semaphore:\n'
            '            return await execute_llm(req)\n'
            '            \n'
            '    return asyncio.gather(*[worker(r) for r in requests])\n'
            '```'
        )

    # General prompt scenarios
    sentences = [
        "Integrating low-latency model configurations optimizes throughput across enterprise pipelines.",
        "Simulating concurrent strategies helps engineers evaluate cost-performance trade-offs accurately.",
        "The distributed worker pool maintains stable task throughput under heavy API rate limits.",
        "Leveraging semantic grouping (clustering) reduces redundant LLM calls by caching regional parameters.",
        "Our high-fidelity fallback simulates real response payloads to test offline performance profiles."
    ]
    selected_sentences = random.sample(sentences, k=random.randint(2, 4))
    body = " ".join(selected_sentences)
    return f"Simulated Response: {body}\nProcessed Prompt: '{prompt[:60]}...'"

async def execute_llm_call(
    provider: str,
    tier: str,
    prompt: str,
    system_instruction: Optional[str] = None,
    simulate: bool = False,
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> LLMCallResponse:
    provider = provider.lower()
    tier = tier.lower()
    
    # Normalize inputs
    if provider not in MODEL_CONFIGS:
        provider = "openai"
    if tier not in MODEL_CONFIGS[provider]:
        tier = "medium"
        
    config = MODEL_CONFIGS[provider][tier]
    model_name = config["name"]
    
    # Determine if API keys are available for real execution
    api_key_env_vars = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "mistral": "MISTRAL_API_KEY"
    }
    
    # Check if key exists and simulate is False
    has_key = False
    env_var_name = api_key_env_vars.get(provider, "")
    if env_var_name:
        has_key = bool(os.environ.get(env_var_name))
        
    # We will simulate if explicitly requested, or if we don't have a key, or for meta (since it requires a 3rd party host key not standard)
    should_simulate = simulate or not has_key or provider == "meta"
    
    start_time = time.time()
    
    if should_simulate:
        # High-fidelity simulation logic
        input_tokens = estimate_tokens(prompt)
        if system_instruction:
            input_tokens += estimate_tokens(system_instruction)
            
        mock_output = generate_mock_output(prompt)
        output_tokens = estimate_tokens(mock_output)
        
        # Calculate simulated latency: base + output token scaling + a bit of random noise
        base_lat = config["base_latency"]
        scale_lat = config["latency_per_token"] * output_tokens
        noise = random.uniform(-0.1 * base_lat, 0.15 * base_lat)
        simulated_lat = max(0.05, base_lat + scale_lat + noise)
        
        # Sleep to simulate actual API waiting time
        await asyncio.sleep(simulated_lat)
        
        # Calculate cost in dollars (pricing is per 1M tokens)
        cost = (input_tokens * config["input_cost_per_m"] + output_tokens * config["output_cost_per_m"]) / 1000000.0
        
        elapsed = time.time() - start_time
        
        return LLMCallResponse(
            provider=provider,
            tier=tier,
            model_name=model_name,
            prompt=prompt,
            output=mock_output,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            latency=elapsed,
            simulated=True,
            success=True
        )
    else:
        # Real LLM Call Logic
        try:
            input_tokens = estimate_tokens(prompt)
            if provider == "openai":
                from openai import AsyncOpenAI
                client = AsyncOpenAI()
                
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                # Make Async Call
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=temperature,
                    max_completion_tokens=max_tokens if model_name.startswith("o1") else None,
                    max_tokens=max_tokens if not model_name.startswith("o1") else None
                )
                
                output = response.choices[0].message.content or ""
                in_tokens = response.usage.prompt_tokens if response.usage else input_tokens
                out_tokens = response.usage.completion_tokens if response.usage else estimate_tokens(output)
                
            elif provider == "anthropic":
                from anthropic import AsyncAnthropic
                client = AsyncAnthropic()
                
                kwargs = {
                    "model": model_name,
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                }
                if system_instruction:
                    kwargs["system"] = system_instruction
                    
                response = await client.messages.create(**kwargs)
                output = response.content[0].text
                in_tokens = response.usage.input_tokens
                out_tokens = response.usage.output_tokens
                
            elif provider == "gemini":
                from google import genai
                from google.genai import types
                from google.genai.errors import APIError
                
                client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))
                
                max_retries = 5
                base_delay = 1.0
                response = None
                
                for attempt in range(max_retries):
                    try:
                        response = await client.aio.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=temperature,
                                max_output_tokens=max_tokens
                            )
                        )
                        break
                    except APIError as e:
                        # Check if this error is a 429 quota exception
                        is_429 = False
                        if hasattr(e, 'code') and e.code == 429:
                            is_429 = True
                        elif hasattr(e, 'status_code') and e.status_code == 429:
                            is_429 = True
                        elif '429' in str(e) or 'quota' in str(e).lower() or 'exhausted' in str(e).lower():
                            is_429 = True
                            
                        if is_429 and attempt < max_retries - 1:
                            # Exponential backoff delay with random jitter
                            delay = base_delay * (2 ** attempt) + random.uniform(0.1, 1.0)
                            await asyncio.sleep(delay)
                            continue
                        raise e
                        
                output = response.text if response else ""

                # Estimate tokens
                in_tokens = estimate_tokens(prompt)
                out_tokens = estimate_tokens(output)
                
            elif provider == "mistral":
                import httpx
                # direct httpx request to mistral endpoints
                headers = {
                    "Authorization": f"Bearer {os.environ.get('MISTRAL_API_KEY')}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.mistral.ai/v1/chat/completions",
                        json=payload,
                        headers=headers,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    output = data["choices"][0]["message"]["content"]
                    in_tokens = data["usage"]["prompt_tokens"]
                    out_tokens = data["usage"]["completion_tokens"]
            else:
                raise ValueError(f"Provider {provider} not supported for real execution in config.")
            
            elapsed = time.time() - start_time
            cost = (in_tokens * config["input_cost_per_m"] + out_tokens * config["output_cost_per_m"]) / 1000000.0
            
            return LLMCallResponse(
                provider=provider,
                tier=tier,
                model_name=model_name,
                prompt=prompt,
                output=output,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                cost=cost,
                latency=elapsed,
                simulated=False,
                success=True
            )
            
        except Exception as e:
            elapsed = time.time() - start_time
            # Fallback to simulation on failure
            mock_output = generate_mock_output(prompt)
            in_toks = estimate_tokens(prompt)
            out_toks = estimate_tokens(mock_output)
            cost = (in_toks * config["input_cost_per_m"] + out_toks * config["output_cost_per_m"]) / 1000000.0
            
            return LLMCallResponse(
                provider=provider,
                tier=tier,
                model_name=model_name,
                prompt=prompt,
                output=mock_output,
                input_tokens=in_toks,
                output_tokens=out_toks,
                cost=cost,
                latency=elapsed,
                simulated=True,
                success=False,
                error=str(e)
            )
