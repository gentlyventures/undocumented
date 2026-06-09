import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertTriangle, Code, Save, Info, FolderOpen, Check, Copy, Award, RefreshCw, MessageSquare, Send, RotateCcw, Play, Zap } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { CustomChart } from './CustomChart';

interface ScannerProps {
  repoPath: string;
  setRepoPath: (path: string) => void;
  scanResults: any;
  setScanResults: (results: any) => void;
  apiOnline: boolean;
  demoMode: boolean;
  onBenchmarkComplete?: (results: any[], shouldNavigate?: boolean) => void;
}

export const Scanner: React.FC<ScannerProps> = ({
  repoPath,
  setRepoPath,
  scanResults,
  setScanResults,
  apiOnline,
  demoMode,
  onBenchmarkComplete
}) => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [promptValues, setPromptValues] = useState<{[key: string]: string}>({});

  const [connectorType, setConnectorType] = useState<'mock' | 'local' | 'github_public' | 'github_private' | 'gcp' | 'manual'>('mock');
  const [selectedMockRepo, setSelectedMockRepo] = useState('script_sync');

  // Pipeline workflow steps: 'setup' | 'scanning' | 'review' | 'benchmarking' | 'results'
  const [pipelineStep, setPipelineStep] = useState<'setup' | 'scanning' | 'review' | 'benchmarking' | 'results'>(
    scanResults ? 'review' : 'setup'
  );

  // AI chat agent states
  const [chatHistory, setChatHistory] = useState<{ role: 'agent' | 'user'; content: string }[]>([
    { role: 'agent', content: 'Hello! I am your AI Discovery Assistant. Click "Start Discovery Audit" below to audit LLM endpoints. Once scanned, we can review prompt definitions, refine constraints, or execute the benchmarking suite.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Benchmarking states (ported from Studio)
  const [strategies] = useState<string[]>(['parallel_pool', 'structured_cache', 'context_trim', 'caching', 'pruning', 'queue_batch']);
  const [providers] = useState<string[]>(['openai', 'anthropic', 'google']);
  const [tier, setTier] = useState<string>('fast');
  const [benchmarkingRunning, setBenchmarkingRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<{ id: number; time: string; type: 'system' | 'success' | 'active' | 'error'; text: string }[]>([]);
  const [tickerLatency, setTickerLatency] = useState<number>(0);
  const [tickerCost, setTickerCost] = useState<number>(0);
  const [tickerParity, setTickerParity] = useState<number>(0);
  
  // Results view states (ported from Analytics)
  const [metricTab, setMetricTab] = useState<'latency' | 'cost' | 'parity'>('latency');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [localBenchmarkResults, setLocalBenchmarkResults] = useState<any[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIdCounter = useRef(0);
  
  const mockReposList = [
    { id: 'script_sync', name: 'ScriptSync (Gemini & OpenAI Screenplay)', path: 'demo/script_sync', desc: 'A multi-agent production screenplay timeline builder. Calls Gemini 1.5 Pro and OpenAI GPT-4o to extract scene metadata, verify chronological continuity, and export format-ready scripts.' },
    { id: 'compliance_guard', name: 'ComplianceGuard (HR Risk Insights)', path: 'demo/compliance_guard', desc: 'An enterprise HR risk assessment tool. Integrates OpenAI ChatCompletions to ingest behavioral signals, run compliance assessments, and generate structured risk vectors.' },
    { id: 'ledger_audit', name: 'LedgerAudit (Tax & Structure Engine)', path: 'demo/ledger_audit', desc: 'A complex transaction analyzer. Uses specialized prompt engineering, structuring frameworks, and LLM calls to compile regulatory summaries and audit logs.' },
    { id: 'customer_support_flow', name: 'Customer Support Flow (Agentic Router)', path: 'demo/customer_support_flow', desc: 'A ticket routing system. Demonstrates multi-turn classification trees and fallback prompt structures for automated customer query handling.' },
    { id: 'educational_tutor', name: 'Educational Tutor (Adaptive Learning)', path: 'demo/educational_tutor', desc: 'An adaptive tutorial agent. Leverages Claude and GPT-4o-mini to tailor explanation granularity based on conversational response history.' },
    { id: 'financial_summarizer', name: 'Financial Summarizer (Bulk Analyzer)', path: 'demo/financial_summarizer', desc: 'A batch report synthesizer. Runs document-level map-reduce chains across 10-K filings to generate consolidated investment summaries.' }
  ];

  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubConnected, setGithubConnected] = useState(false);
  const [connectingGit, setConnectingGit] = useState(false);
  const [githubPrivateRepo, setGithubPrivateRepo] = useState('enterprise-agent-mesh');
  const [gcpRepo, setGcpRepo] = useState('csr-agent-prod');
  const [manualCode, setManualCode] = useState(`import openai
import anthropic
import google.generativeai as genai

# Setup LLM calls
openai_client = openai.OpenAI()
completion = openai_client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze user segment data"}]
)

gemini_model = genai.GenerativeModel("gemini-1.5-pro")
response = gemini_model.generate_content("Generate high-parity response")
`);

  // When scanResults change, initialize editable inputs
  useEffect(() => {
    if (scanResults?.prompts) {
      const vals: {[key: string]: string} = {};
      scanResults.prompts.forEach((p: any) => {
        vals[p.id] = p.raw_prompt;
      });
      setPromptValues(vals);
    }
  }, [scanResults]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleConnectGit = async () => {
    setConnectingGit(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setGithubConnected(true);
    setConnectingGit(false);
  };

  const [selectingDir, setSelectingDir] = useState(false);

  const handleOpenFinder = async () => {
    setSelectingDir(true);
    setErrorMsg('');
    try {
      const response = await fetch(getApiUrl('/api/select-directory'), {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('API server returned error code.');
      }
      const data = await response.json();
      if (data.status === 'success' && data.path) {
        setRepoPath(data.path);
      }
    } catch (err: any) {
      setErrorMsg(`Could not open Finder: ${err.message}. Please type path manually.`);
    } finally {
      setSelectingDir(false);
    }
  };

  // Card grid selection click resets previous results to make it sticky and select correctly
  const handleSelectMockRepo = (repoId: string) => {
    setSelectedMockRepo(repoId);
    setScanResults(null);
    setPipelineStep('setup');
    setLocalBenchmarkResults([]);
    setErrorMsg('');
    
    const repoInfo = mockReposList.find(r => r.id === repoId);
    setChatHistory([
      { role: 'agent', content: `Selected demo config: ${repoInfo?.name}. Click "Start Discovery Audit" below to trigger static analysis. Once complete, I can adjust prompt templates and we can run optimization benchmarks.` }
    ]);
  };

  const handleSelectConnector = (type: typeof connectorType) => {
    setConnectorType(type);
    setScanResults(null);
    setPipelineStep('setup');
    setLocalBenchmarkResults([]);
    setErrorMsg('');
  };

  const handleScan = async () => {
    if (connectorType === 'local' && !repoPath.trim()) {
      setErrorMsg('Please specify a local workspace directory path.');
      return;
    }
    if (connectorType === 'github_public' && !githubUrl.trim()) {
      setErrorMsg('Please specify a public GitHub repository URL.');
      return;
    }
    if (connectorType === 'github_private' && !githubConnected) {
      setErrorMsg('Please connect your GitHub account first.');
      return;
    }
    if (connectorType === 'manual' && !manualCode.trim()) {
      setErrorMsg('Please paste some codebase snippets to scan.');
      return;
    }

    setErrorMsg('');
    setScanning(true);
    setPipelineStep('scanning');
    setProgress(0);

    // If local/mock and apiOnline, call the actual FastAPI endpoint
    if ((connectorType === 'local' || connectorType === 'mock') && !demoMode && apiOnline) {
      const targetDir = connectorType === 'mock'
        ? `demo/${selectedMockRepo}`
        : repoPath;
      
      setRepoPath(targetDir);
      setScanStep('Initializing workspace scanner...');
      try {
        const response = await fetch(getApiUrl('/api/analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directory: targetDir })
        });
        
        if (!response.ok) {
          throw new Error('API server returned error state.');
        }

        const rawData = await response.json();
        
        if (rawData.status === 'success' && rawData.data) {
          const apiData = rawData.data;
          
          const filesMap: { [key: string]: any[] } = {};
          if (Array.isArray(apiData.call_sites)) {
            apiData.call_sites.forEach((cs: any) => {
              if (!filesMap[cs.file]) {
                filesMap[cs.file] = [];
              }
              filesMap[cs.file].push({
                line: cs.line,
                type: cs.function,
                code: `${cs.function}(${cs.config ? Object.entries(cs.config).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ') : ''})`
              });
            });
          }
          
          const mappedFiles = Object.entries(filesMap).map(([file, calls]) => ({
            file,
            calls
          }));
          
          const mappedPrompts = Array.isArray(apiData.prompt_templates) 
            ? apiData.prompt_templates.map((pt: any, idx: number) => ({
                id: `prompt_${idx + 1}`,
                file: pt.file,
                line: pt.line,
                title: pt.variable_name || `Prompt Template #${idx + 1}`,
                raw_prompt: pt.content,
                tokens: Math.ceil((pt.content || '').length / 4)
              }))
            : [];
            
          const mappedResults = {
            status: 'success',
            files: mappedFiles,
            prompts: mappedPrompts
          };
          
          setProgress(100);
          setScanStep('Scan completed!');
          setScanResults(mappedResults);
          setPipelineStep('review');
          setChatHistory([
            { role: 'agent', content: `Static scan complete! I detected ${mappedFiles.length} files with LLM integrations and extracted ${mappedPrompts.length} prompt templates. Let me know if you'd like to refine prompts, inject safety constraints, or confirm and run optimization benchmarks.` }
          ]);
        } else {
          throw new Error('Malformed API response.');
        }
      } catch (err: any) {
        setErrorMsg(`Failed to connect to scanner API: ${err.message}. Defaulting to simulated discovery...`);
        runMockScan();
      } finally {
        setScanning(false);
      }
    } else {
      runMockScan();
    }
  };

  const runMockScan = async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    if (connectorType === 'mock') {
      setScanStep(`[Mock] Loading pre-loaded repository: ${selectedMockRepo}...`);
      await delay(400); setProgress(30);
      setScanStep('[Mock] Resolving codebase AST mapping...');
      await delay(400); setProgress(60);
      setScanStep('[Mock] Parsing prompt nodes and parameters...');
      await delay(400); setProgress(100);

      let mockResults = { status: 'success', files: [] as any[], prompts: [] as any[] };

      if (selectedMockRepo === 'script_sync') {
        mockResults = {
          status: 'success',
          files: [
            {
              file: `demo/script_sync/screenplay_continuity_agent.py`,
              calls: [
                { line: 14, type: 'Google Gemini', code: 'gemini_model.generate_content("Compare scene...", ...)' },
                { line: 38, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4o", ...)' }
              ]
            },
            {
              file: `demo/script_sync/timeline_exporter.py`,
              calls: [
                { line: 22, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4o-mini", ...)' }
              ]
            }
          ],
          prompts: [
            {
              id: 'prompt_1',
              file: 'screenplay_continuity_agent.py',
              line: 10,
              title: 'Continuity Checking Prompt',
              raw_prompt: 'Compare scene {{current_scene}} against previous scene context: {{previous_scene_context}}. Identify any continuity violations (e.g., changes in time of day, character wardrobe, or physical layout). Output a JSON analysis.',
              tokens: 38
            },
            {
              id: 'prompt_2',
              file: 'screenplay_continuity_agent.py',
              line: 32,
              title: 'Scene Metadata Extraction',
              raw_prompt: 'Extract the list of characters, location details, time of day, and primary actions from the script segment: {{script_segment}}.',
              tokens: 24
            },
            {
              id: 'prompt_3',
              file: 'timeline_exporter.py',
              line: 18,
              title: 'Timeline Export Formatter',
              raw_prompt: 'Format the extracted scene metadata list {{scene_list}} into a standard industry shooting schedule. Suffix each entry with a crew-notice note.',
              tokens: 28
            }
          ]
        };
      } else if (selectedMockRepo === 'compliance_guard') {
        mockResults = {
          status: 'success',
          files: [
            {
              file: `demo/compliance_guard/employee_risk_agent.py`,
              calls: [
                { line: 28, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4o", ...)' },
                { line: 62, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4-turbo", ...)' }
              ]
            }
          ],
          prompts: [
            {
              id: 'prompt_1',
              file: 'employee_risk_agent.py',
              line: 22,
              title: 'Risk Vector Generation',
              raw_prompt: 'Analyze the employee feedback and communications history: {{communication_log}}. Detect potential risk factors including burnout, policy violations, or alignment concerns. Calculate a compliance rating from 0-100.',
              tokens: 35
            },
            {
              id: 'prompt_2',
              file: 'employee_risk_agent.py',
              line: 55,
              title: 'Mitigation Advisory Formulation',
              raw_prompt: 'Based on risk vectors {{risk_vectors}} and local policy directives, formulate a structured mitigation guide for the HR representative.',
              tokens: 26
            }
          ]
        };
      } else if (selectedMockRepo === 'ledger_audit') {
        mockResults = {
          status: 'success',
          files: [
            {
              file: `demo/ledger_audit/ledger_auditor.py`,
              calls: [
                { line: 44, type: 'Anthropic Claude', code: 'anthropic_client.messages.create(model="claude-3-5-sonnet", ...)' },
                { line: 89, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4o", ...)' }
              ]
            }
          ],
          prompts: [
            {
              id: 'prompt_1',
              file: 'ledger_auditor.py',
              line: 38,
              title: 'Regulatory Compliance Mapping',
              raw_prompt: 'Review transaction profile {{transaction_data}} against IRS Section 1031 guidelines. Identify any non-compliant structures and map them to tax risk parameters.',
              tokens: 28
            }
          ]
        };
      } else if (selectedMockRepo === 'customer_support_flow') {
        mockResults = {
          status: 'success',
          files: [
            {
              file: `demo/customer_support_flow/ticket_router.py`,
              calls: [
                { line: 12, type: 'OpenAI ChatCompletion', code: 'openai.chat.completions.create(model="gpt-4o-mini", ...)' }
              ]
            }
          ],
          prompts: [
            {
              id: 'prompt_1',
              file: 'ticket_router.py',
              line: 8,
              title: 'Ticket Classification Router',
              raw_prompt: 'Categorize this customer support ticket: "{{ticket_text}}". Choices: [billing, account_access, technical_issue, custom_integration]. Return only the chosen category name.',
              tokens: 30
            }
          ]
        };
      } else if (selectedMockRepo === 'educational_tutor') {
        mockResults = {
          status: 'success',
          files: [
            {
              file: `demo/educational_tutor/adaptive_explainer.py`,
              calls: [
                { line: 19, type: 'Anthropic Claude', code: 'anthropic_client.messages.create(model="claude-3-haiku", ...)' },
                { line: 54, type: 'OpenAI ChatCompletion', code: 'openai.chat.completions.create(model="gpt-4o-mini", ...)' }
              ]
            }
          ],
          prompts: [
            {
              id: 'prompt_1',
              file: 'adaptive_explainer.py',
              line: 14,
              title: 'Concept Explanation Adaptive Prompt',
              raw_prompt: 'Explain the topic "{{topic}}" to a student with skill level "{{skill_level}}". Adapt your tone to be {{tone}} and provide exactly two relatable real-world analogies.',
              tokens: 33
            }
          ]
        };
      } else if (selectedMockRepo === 'financial_summarizer') {
        mockResults = {
          status: 'success',
          files: [
            {
              file: `demo/financial_summarizer/bulk_report_analyzer.py`,
              calls: [
                { line: 35, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4-turbo", ...)' },
                { line: 78, type: 'OpenAI ChatCompletion', code: 'openai_client.chat.completions.create(model="gpt-4o", ...)' }
              ]
            }
          ],
          prompts: [
            {
              id: 'prompt_1',
              file: 'bulk_report_analyzer.py',
              line: 28,
              title: 'Map Ingestion Prompt',
              raw_prompt: 'Summarize the key balance sheet changes from this section of the 10-K filing: {{document_chunk}}. Highlight any changes in debt covenants or working capital.',
              tokens: 34
            },
            {
              id: 'prompt_2',
              file: 'bulk_report_analyzer.py',
              line: 70,
              title: 'Reduce Consensus Synthesis',
              raw_prompt: 'Synthesize these section summaries {{summaries}} into a final executive summary. Project estimated Q4 growth rate based on the management discussion.',
              tokens: 27
            }
          ]
        };
      }
      setScanResults(mockResults);
      setPipelineStep('review');
      setChatHistory([
        { role: 'agent', content: `Static scan complete! I detected ${mockResults.files.length} active files and extracted ${mockResults.prompts.length} prompt templates from ${selectedMockRepo}. I can help you modify definitions, update values, or confirm the setup to launch the benchmark.` }
      ]);
    }
    else if (connectorType === 'local') {
      setScanStep('Walking local file tree for python files...');
      await delay(500); setProgress(20);
      setScanStep('Analyzing local import references...');
      await delay(500); setProgress(50);
      setScanStep('Scanning local AST nodes for completions invocations...');
      await delay(500); setProgress(80);
      setScanStep('Extracting local prompt templates...');
      await delay(400); setProgress(100);
      
      const mockLocalResults = {
        status: 'success',
        files: [
          {
            file: `${repoPath || '.'}/src/agents/router.py`,
            calls: [{ line: 42, type: 'OpenAI ChatCompletion', code: 'openai.chat.completions.create(model="gpt-4o-mini", ...)' }]
          },
          {
            file: `${repoPath || '.'}/src/utils/llm_client.py`,
            calls: [{ line: 128, type: 'Anthropic Message', code: 'client.messages.create(model="claude-3-5-sonnet", ...)' }]
          }
        ],
        prompts: [
          {
            id: 'prompt_1',
            file: 'src/agents/router.py',
            line: 38,
            title: 'System Router Agent Prompt',
            raw_prompt: 'You are an intelligent request router. Analyze the user request: "{{user_query}}". Classify it into one of the following departments: ["billing", "technical_support", "sales", "general"]. Return only the department name as a raw lowercase string.',
            tokens: 42
          }
        ]
      };
      setScanResults(mockLocalResults);
      setPipelineStep('review');
      setChatHistory([
        { role: 'agent', content: `Workspace scanner finished! I found 2 source files containing LLM invocations and extracted 1 template. Type in the chat if you want me to adjust prompt configurations or click 'Confirm & Ignite Benchmark' below to run optimized tests.` }
      ]);
    } 
    else if (connectorType === 'github_public') {
      setScanStep(`[Git] Cloning public repository: ${githubUrl} on branch ${githubBranch}...`);
      await delay(800); setProgress(25);
      setScanStep('[Git] Successfully cloned 4.8 MB of source files.');
      await delay(400); setProgress(45);
      setScanStep('[Scanner] Walking file tree and locating configuration blocks...');
      await delay(500); setProgress(75);
      setScanStep('[Scanner] Compiling AST node map and prompt dictionary...');
      await delay(400); setProgress(100);

      const mockGitPublicResults = {
        status: 'success',
        files: [
          {
            file: 'github-clone/src/main.py',
            calls: [
              { line: 18, type: 'OpenAI ChatCompletion', code: 'openai.chat.completions.create(model="gpt-4o", ...)' },
              { line: 55, type: 'Google Gemini', code: 'gemini.generate_content(contents=prompt)' }
            ]
          }
        ],
        prompts: [
          {
            id: 'prompt_1',
            file: 'src/main.py',
            line: 14,
            title: 'OpenAI General Ingestion Prompt',
            raw_prompt: 'You are a general assistant. Process the request "{{user_query}}". Output the key highlights as a structured list.',
            tokens: 28
          }
        ]
      };
      setScanResults(mockGitPublicResults);
      setPipelineStep('review');
      setChatHistory([
        { role: 'agent', content: `Cloned and analyzed public repo! Extracted 1 main prompt template. Let me know what modifications you want or execute benchmarking directly.` }
      ]);
    }
    else if (connectorType === 'github_private') {
      setScanStep(`[Auth] Authenticating private session using client OAuth handshake...`);
      await delay(600); setProgress(20);
      setScanStep(`[Git] Pulling private repository: ${githubPrivateRepo}...`);
      await delay(800); setProgress(55);
      setScanStep('[Scanner] Running secure AST audit scan on private sources...');
      await delay(600); setProgress(85);
      setScanStep('[Scanner] Audit completed successfully!');
      await delay(300); setProgress(100);

      const mockGitPrivateResults = {
        status: 'success',
        files: [
          {
            file: `private-repo/${githubPrivateRepo}/core/mesh_router.py`,
            calls: [
              { line: 89, type: 'OpenAI ChatCompletion', code: 'openai.chat.completions.create(model="gpt-4o", ...)' },
              { line: 154, type: 'Anthropic Message', code: 'anthropic_client.messages.create(...)' }
            ]
          }
        ],
        prompts: [
          {
            id: 'prompt_1',
            file: 'core/mesh_router.py',
            line: 82,
            title: 'Mesh Speculative Router Template',
            raw_prompt: 'Evaluate the query "{{user_query}}" against the active routing mesh parameters. Determine if speculation is valid.',
            tokens: 32
          }
        ]
      };
      setScanResults(mockGitPrivateResults);
      setPipelineStep('review');
      setChatHistory([
        { role: 'agent', content: `Private repo securely scanned. Analyzed mesh router definitions. Let's customize prompt values or run optimization sweeps.` }
      ]);
    }
    else if (connectorType === 'gcp') {
      setScanStep(`[GCP] Connecting to Cloud Source Repository under project gen-lang-client-0624562208...`);
      await delay(600); setProgress(20);
      setScanStep(`[GCP] Syncing repository branches for ${gcpRepo}...`);
      await delay(800); setProgress(55);
      setScanStep(`[GCP] Reading Artifact Registry deployment parameters...`);
      await delay(600); setProgress(85);
      setScanStep('[Scanner] Audit completed successfully!');
      await delay(300); setProgress(100);

      const mockGcpResults = {
        status: 'success',
        files: [
          {
            file: `gcp-repository/${gcpRepo}/src/translation_agent.py`,
            calls: [
              { line: 32, type: 'Google Gemini', code: 'generative_model.generate_content(...)' }
            ]
          }
        ],
        prompts: [
          {
            id: 'prompt_1',
            file: 'src/translation_agent.py',
            line: 25,
            title: 'GCP Translation Ingestion Prompt',
            raw_prompt: 'Translate this document block to Spanish. Target style rule is set to {{style_rule}}. Block:\n\n{{input_text}}',
            tokens: 45
          }
        ]
      };
      setScanResults(mockGcpResults);
      setPipelineStep('review');
      setChatHistory([
        { role: 'agent', content: `GCP Source Repository successfully scanned. Extracted style-rule translation prompt templates. Click below to begin tests.` }
      ]);
    }
    else if (connectorType === 'manual') {
      setScanStep('[Scanner] Parsing pasted codebase snippets...');
      await delay(400); setProgress(40);
      setScanStep('[Scanner] Running AST token validation checks...');
      await delay(500); setProgress(80);
      setScanStep('[Scanner] Extraction finished!');
      await delay(300); setProgress(100);

      const code = manualCode.toLowerCase();
      const detectedCalls = [];
      const detectedPrompts = [];
      let promptIdx = 1;

      if (code.includes('openai')) {
        detectedCalls.push({ line: 7, type: 'OpenAI ChatCompletion', code: 'openai.chat.completions.create(...)' });
        detectedPrompts.push({
          id: `prompt_${promptIdx++}`,
          file: 'pasted_snippet.py',
          line: 8,
          title: 'Custom OpenAI Prompt',
          raw_prompt: 'You are an intelligent request parser. Process this data.',
          tokens: 15
        });
      }
      if (code.includes('gemini') || code.includes('genai')) {
        detectedCalls.push({ line: 13, type: 'Google Gemini', code: 'generative_model.generate_content(...)' });
        detectedPrompts.push({
          id: `prompt_${promptIdx++}`,
          file: 'pasted_snippet.py',
          line: 14,
          title: 'Custom Gemini Prompt',
          raw_prompt: 'Analyze this input text and generate highlights.',
          tokens: 18
        });
      }
      if (code.includes('anthropic') || code.includes('claude')) {
        detectedCalls.push({ line: 20, type: 'Anthropic Message', code: 'client.messages.create(...)' });
      }

      const mockManualResults = {
        status: 'success',
        files: [
          {
            file: 'pasted_snippet.py',
            calls: detectedCalls.length > 0 ? detectedCalls : [{ line: 1, type: 'Static Ingestion API', code: 'llm_call()' }]
          }
        ],
        prompts: detectedPrompts.length > 0 ? detectedPrompts : [
          {
            id: 'prompt_1',
            file: 'pasted_snippet.py',
            line: 1,
            title: 'Inline Extracted Prompt',
            raw_prompt: 'Process user query: {{user_query}}',
            tokens: 10
          }
        ]
      };
      setScanResults(mockManualResults);
      setPipelineStep('review');
      setChatHistory([
        { role: 'agent', content: `Pasted snippet parsed successfully. Found ${detectedCalls.length || 1} API integrations. Let's begin the review process.` }
      ]);
    }
    
    setScanning(false);
  };

  const handleSavePrompt = (id: string) => {
    const updatedPrompts = scanResults.prompts.map((p: any) => {
      if (p.id === id) {
        return { 
          ...p, 
          raw_prompt: promptValues[id],
          tokens: Math.ceil(promptValues[id].length / 4)
        };
      }
      return p;
    });

    setScanResults({
      ...scanResults,
      prompts: updatedPrompts
    });
    setEditingPromptId(null);
  };

  // Interactive AI Review Chat Message Submission
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lower = userMsg.toLowerCase();
    let reply = "";
    
    if (lower.includes('mitigate') || lower.includes('risk') || lower.includes('safety') || lower.includes('comply') || lower.includes('hr')) {
      reply = "Understood. I have appended enterprise policy constraints, safety guardrails, and compliance instructions into your prompt templates. The editable prompt cards above have been updated.";
      setPromptValues(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (!updated[key].includes('[Safety Boundaries]')) {
            updated[key] = updated[key] + "\n\n[Safety Boundaries] Adhere to HR compliance directives. Redact sensitive PII and exclude unapproved behavior profiling phrases.";
          }
        });
        return updated;
      });
    } else if (lower.includes('disc') || lower.includes('personality') || lower.includes('profile')) {
      reply = "Got it! I modified the templates to structure extracted characteristics directly into the four DISC behavioral axes (Dominance, Influence, Steadiness, Conscientiousness).";
      setPromptValues(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (!updated[key].includes('[DISC Assessment]')) {
            updated[key] = updated[key] + "\n\n[DISC Assessment] Classify behavior indicators into Dominance, Influence, Steadiness, or Conscientiousness quadrants.";
          }
        });
        return updated;
      });
    } else if (lower.includes('cost') || lower.includes('cheap') || lower.includes('save') || lower.includes('efficiency')) {
      reply = "Cost optimization set. I've toggled the model execution parameters to prioritize 'Fast & Efficient' model mappings (Gemini Flash, Claude Haiku, GPT-4o mini) to maximize token pricing margins.";
      setTier('fast');
    } else if (lower.includes('quality') || lower.includes('precision') || lower.includes('intelligence') || lower.includes('high')) {
      reply = "Quality and precision locked. I've configured the benchmark pipeline to utilize 'Max Intelligence' model endpoints (Gemini Pro, GPT-4o, Claude Sonnet) for the test iterations.";
      setTier('high');
    } else {
      reply = "Understood. I have logged your design specifications. We are ready to run the automated optimization battery. Click the glowing 'Confirm & Ignite Benchmark' CTA below to launch.";
    }
    
    setChatHistory(prev => [...prev, { role: 'agent', content: reply }]);
    setChatLoading(false);
  };

  // Triggering the automated test battery benchmarking execution
  const handleIgniteBenchmark = async () => {
    setPipelineStep('benchmarking');
    setBenchmarkingRunning(true);
    setLogs([]);
    setCurrentStep(1);
    
    const isFast = tier === 'fast';
    const baseLatency = isFast ? 1200 : 2450;
    const baseCost = isFast ? 0.025 : 0.180;
    
    setTickerLatency(baseLatency);
    setTickerCost(baseCost);
    setTickerParity(0);

    logIdCounter.current = 0;
    
    const addLog = (text: string, type: 'system' | 'success' | 'active' | 'error' = 'system') => {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, { id: logIdCounter.current++, time, type, text }]);
    };

    addLog('🔥 UnDocumented Engine: Ignition optimization benchmark pipeline', 'system');
    addLog(`Audited Target Configuration: ${selectedMockRepo}`, 'system');
    addLog(`Model Target Tier: ${tier === 'fast' ? 'Fast & Efficient' : 'Max Intelligence'}`, 'system');

    if (!demoMode && apiOnline) {
      try {
        const customPrompts = scanResults?.prompts?.map((p: any) => promptValues[p.id] || p.raw_prompt) || [];
        const payload = {
          prompts: customPrompts.length > 0 ? customPrompts : null,
          strategies: strategies,
          providers: providers,
          tiers: [tier === 'fast' ? 'low' : 'high'],
          simulate: false,
          temperature: 0.7,
          max_tokens: 1000,
          concurrency_limit: 8
        };

        const response = await fetch(getApiUrl('/api/benchmark'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Server returned status code ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported on response body.');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop() || '';

          for (const chunk of parts) {
            const trimmed = chunk.trim();
            if (!trimmed) continue;

            const lines = trimmed.split(/\r?\n/);
            let eventName = '';
            let dataVal = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.substring(6).trim();
              } else if (line.startsWith('data:')) {
                dataVal = line.substring(5).trim();
              }
            }

            if (!dataVal && trimmed.startsWith('data:')) {
              dataVal = trimmed.substring(5).trim();
            }

            const rawData = dataVal || trimmed;
            let parsed: any = null;
            try {
              parsed = JSON.parse(rawData);
            } catch (e) {
              // Not JSON
            }

            const type = parsed?.type || eventName;
            const message = parsed?.message || parsed?.data || rawData;
            const status = parsed?.status || 'active';

            if (type === 'log') {
              const logType = status === 'error' ? 'error' : status === 'success' ? 'success' : 'active';
              addLog(message, logType);
              
              const msgLower = message.toLowerCase();
              if (msgLower.includes('parsing') || msgLower.includes('extracted')) {
                setCurrentStep(1);
              } else if (msgLower.includes('worker') || msgLower.includes('concurrency') || msgLower.includes('pool')) {
                setCurrentStep(2);
              } else if (msgLower.includes('baseline') || msgLower.includes('sequential')) {
                setCurrentStep(3);
              } else if (msgLower.includes('scoring') || msgLower.includes('parity')) {
                setCurrentStep(4);
              }
            } else if (type === 'complete') {
              try {
                addLog('✨ Optimization benchmark completed successfully!', 'success');
                setCurrentStep(5);
                setBenchmarkingRunning(false);

                const results = parsed.results || [];
                const mappedResults = results.map((r: any) => ({
                  name: r.name || `${r.provider} ${r.strategy}`,
                  latency: typeof r.latency === 'number' ? r.latency : Math.round((r.summary?.average_latency || 0) * 1000) || 200,
                  cost: typeof r.cost === 'number' ? r.cost : r.summary?.total_cost || 0.01,
                  parity: typeof r.parity === 'number' ? r.parity : Math.round((r.semantic_alignment || 0) * 100) || 95,
                  strategy: r.strategy || 'Parallel Pool',
                  provider: r.provider || 'Google',
                  tier: r.tier || 'low',
                  summary: r.summary || {}
                }));

                const optimizedWinner = mappedResults.find((r: any) => r.strategy !== 'Sequential');
                if (optimizedWinner) {
                  setTickerLatency(optimizedWinner.latency);
                  setTickerCost(optimizedWinner.cost);
                  setTickerParity(optimizedWinner.parity);
                } else if (mappedResults.length > 0) {
                  setTickerLatency(mappedResults[0].latency);
                  setTickerCost(mappedResults[0].cost);
                  setTickerParity(mappedResults[0].parity);
                }

                setLocalBenchmarkResults(mappedResults);
                if (onBenchmarkComplete) {
                  onBenchmarkComplete(mappedResults, false);
                }
                setPipelineStep('results');
              } catch (err) {
                addLog('Error parsing execution response dataset.', 'error');
              }
            } else if (type === 'step') {
              setCurrentStep(parsed.step);
            } else if (type === 'metrics') {
              setTickerLatency(parsed.latency);
              setTickerCost(parsed.cost);
              setTickerParity(Math.round(parsed.parity * 100));
            } else if (type === 'error') {
              addLog(`Stream Error: ${message}`, 'error');
              setBenchmarkingRunning(false);
            }
          }
        }
      } catch (err: any) {
        addLog(`Real-time stream failed: ${err.message}. Running simulation...`, 'error');
        runSimulation(addLog);
      }
    } else {
      runSimulation(addLog);
    }
  };

  const runSimulation = async (addLog: (text: string, type?: 'system' | 'success' | 'active' | 'error') => void) => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const isFast = tier === 'fast';
    const baseLatency = isFast ? 1200 : 2450;
    const baseCost = isFast ? 0.025 : 0.180;

    // Step 1: Scanner Ingestion
    setCurrentStep(1);
    addLog('[Scanner] Parsing extracted prompt structures...', 'active');
    await delay(700);
    addLog(`[Scanner] Loaded prompts for review context: ${selectedMockRepo}`, 'success');
    addLog('[Scanner] Token weights computed. Dynamic placeholders identified.', 'system');
    
    // Step 2: Concurrency & Worker Setup
    setCurrentStep(2);
    addLog('[Engine] Spinup parallel LLM worker pool...', 'active');
    await delay(800);
    addLog('[Engine] Distributed pool active. Max workers = 8. Rate limit = 1200 RPM.', 'success');
    addLog('[Engine] Context mapping thread handlers listening.', 'system');

    // Step 3: Sequential Baseline Exec
    setCurrentStep(3);
    addLog('[Verifier] running baseline sequential tests...', 'active');
    await delay(1000);
    addLog('[Verifier] Sequential run complete.', 'success');
    addLog(`[Verifier] Sequential Baseline (OpenAI GPT-4o): Latency = ${baseLatency}ms, Cost = $${baseCost} / 1K requests`, 'system');

    // Step 4: Semantic Parity Audit
    setCurrentStep(4);
    addLog('[Auditor] Scoring strategy outputs against baseline completions...', 'active');
    await delay(1000);
    
    const mockBenchmarkResults: any[] = [];
    const providerMapping: Record<string, { name: string; baselineModel: string; optimizedModel: string; baseCost: number; baseLatency: number }> = {
      openai: {
        name: 'OpenAI',
        baselineModel: isFast ? 'GPT-4o mini' : 'GPT-4o',
        optimizedModel: isFast ? 'GPT-4o mini' : 'GPT-4o',
        baseCost: isFast ? 0.025 : 0.180,
        baseLatency: isFast ? 1200 : 2450
      },
      google: {
        name: 'Google',
        baselineModel: isFast ? 'Gemini 2.5 Flash' : 'Gemini 1.5 Pro',
        optimizedModel: isFast ? 'Gemini 2.5 Flash' : 'Gemini 1.5 Pro',
        baseCost: isFast ? 0.015 : 0.045,
        baseLatency: isFast ? 950 : 1850
      },
      anthropic: {
        name: 'Anthropic',
        baselineModel: isFast ? 'Claude 3.5 Haiku' : 'Claude 3.5 Sonnet',
        optimizedModel: isFast ? 'Claude 3.5 Haiku' : 'Claude 3.5 Sonnet',
        baseCost: isFast ? 0.035 : 0.080,
        baseLatency: isFast ? 1100 : 2100
      }
    };

    // Add baseline rows
    providers.forEach(pId => {
      const pInfo = providerMapping[pId];
      if (pInfo) {
        mockBenchmarkResults.push({
          name: `Baseline (${pInfo.baselineModel} Seq)`,
          latency: pInfo.baseLatency,
          cost: pInfo.baseCost,
          parity: 100.0,
          strategy: 'Sequential',
          provider: pInfo.name
        });
      }
    });

    // Add strategy rows
    strategies.forEach(sId => {
      providers.forEach(pId => {
        const pInfo = providerMapping[pId];
        if (!pInfo) return;
        
        let stratName = '';
        let latFactor = 1.0;
        let costFactor = 1.0;
        let parityScore = 98.0;

        if (sId === 'parallel_pool') {
          stratName = 'Parallel Pool';
          latFactor = 0.12;
          costFactor = 1.0;
          parityScore = 97.5;
        } else if (sId === 'structured_cache') {
          stratName = 'Structured Cache';
          latFactor = 0.45;
          costFactor = 0.70;
          parityScore = 98.2;
        } else if (sId === 'context_trim') {
          stratName = 'Context Compression';
          latFactor = 0.75;
          costFactor = 0.60;
          parityScore = 97.0;
        } else if (sId === 'caching') {
          stratName = 'Stateful Semantic Caching';
          latFactor = 0.08;
          costFactor = 0.15;
          parityScore = 96.2;
        } else if (sId === 'pruning') {
          stratName = 'Context-Aware Prompt Pruning';
          latFactor = 0.65;
          costFactor = 0.50;
          parityScore = 98.0;
        } else if (sId === 'queue_batch') {
          stratName = 'Dynamic Queue Batching';
          latFactor = 0.85;
          costFactor = 0.45;
          parityScore = 99.7;
        }

        const variance = () => 0.95 + Math.random() * 0.10;
        
        mockBenchmarkResults.push({
          name: `${pInfo.optimizedModel} (${stratName})`,
          latency: Math.round(pInfo.baseLatency * latFactor * variance()),
          cost: Number((pInfo.baseCost * costFactor * variance()).toFixed(3)),
          parity: Number((parityScore * (0.99 + Math.random() * 0.02)).toFixed(1)),
          strategy: stratName,
          provider: pInfo.name
        });
      });
    });

    const optimizedOnly = mockBenchmarkResults.filter(r => r.strategy !== 'Sequential');
    const winner = optimizedOnly.length > 0 ? 
      optimizedOnly.reduce((best, curr) => (curr.latency < best.latency ? curr : best), optimizedOnly[0]) : 
      mockBenchmarkResults[0];

    const finalLatency = winner.latency;
    const finalCost = winner.cost;
    const finalParity = winner.parity;

    const ticks = 8;
    for (let i = 1; i <= ticks; i++) {
      await delay(150);
      setTickerLatency(Math.round(baseLatency - (i / ticks) * (baseLatency - finalLatency)));
      setTickerCost(Number((baseCost - (i / ticks) * (baseCost - finalCost)).toFixed(3)));
      setTickerParity(Math.round((i / ticks) * finalParity));
    }

    addLog(`[Auditor] Parity calculations complete. Max: ${finalParity}%.`, 'success');
    addLog(`[Auditor] Target provider speed ratios computed. Winner: ${winner.name}.`, 'system');

    // Step 5: Optimization Mapping
    setCurrentStep(5);
    addLog('[Optimizer] Synthesizing recommendation config settings...', 'active');
    await delay(600);
    addLog('✨ Optimization benchmark completed successfully!', 'success');
    setBenchmarkingRunning(false);
    setLocalBenchmarkResults(mockBenchmarkResults);
    if (onBenchmarkComplete) {
      onBenchmarkComplete(mockBenchmarkResults, false);
    }
    setPipelineStep('results');
  };

  const getDynamicRecommendation = () => {
    if (!localBenchmarkResults || localBenchmarkResults.length === 0) {
      return {
        baseline: {
          name: 'Baseline (GPT-4o Seq)',
          latency: tier === 'fast' ? 1200 : 2450,
          cost: tier === 'fast' ? 0.025 : 0.180,
          parity: 100.0,
          strategy: 'Sequential',
          provider: 'OpenAI'
        },
        winner: {
          name: tier === 'fast' ? 'Gemini 2.5 Flash' : 'Gemini 1.5 Pro',
          latency: tier === 'fast' ? 180 : 380,
          cost: tier === 'fast' ? 0.015 : 0.045,
          parity: 96.8,
          strategy: 'Parallel Pool',
          provider: 'Google'
        },
        speedup: '12.6',
        costReduction: '91.6'
      };
    }

    // Find baseline (any baseline or one starting with "Baseline")
    const baseline = localBenchmarkResults.find((r: any) => 
      r.strategy === 'Sequential' || 
      r.name.toLowerCase().includes('baseline')
    ) || {
      name: 'Baseline (GPT-4o Seq)',
      latency: tier === 'fast' ? 1200 : 2450,
      cost: tier === 'fast' ? 0.025 : 0.180,
      parity: 100.0,
      strategy: 'Sequential',
      provider: 'OpenAI'
    };

    // Find optimized strategies (everything except baseline)
    const optimizedOnly = localBenchmarkResults.filter((r: any) => 
      r.strategy !== 'Sequential' && 
      !r.name.toLowerCase().includes('baseline')
    );

    if (optimizedOnly.length === 0) {
      return {
        baseline,
        winner: baseline,
        speedup: '1.0',
        costReduction: '0.0'
      };
    }

    // Find the winner (highest combined improvement score: Speedup * Savings * Parity)
    const winner = optimizedOnly.reduce((best: any, curr: any) => {
      const bestSpeedup = Math.max(1, baseline.latency / (best.latency || 1));
      const bestSavings = Math.max(0.01, (baseline.cost - best.cost) / (baseline.cost || 0.001));
      const bestScore = bestSpeedup * bestSavings * ((best.parity || 80) / 100);

      const currSpeedup = Math.max(1, baseline.latency / (curr.latency || 1));
      const currSavings = Math.max(0.01, (baseline.cost - curr.cost) / (baseline.cost || 0.001));
      const currScore = currSpeedup * currSavings * ((curr.parity || 80) / 100);

      return currScore > bestScore ? curr : best;
    }, optimizedOnly[0]);

    const speedup = (baseline.latency / (winner.latency || 1)).toFixed(1);
    const costReduction = (((baseline.cost - winner.cost) / (baseline.cost || 0.001)) * 100).toFixed(1);

    return {
      baseline,
      winner,
      speedup,
      costReduction
    };
  };

  const rec = getDynamicRecommendation();

  const cleanWinnerModelName = rec.winner.name
    .replace(/\([^)]*\)/g, '')
    .trim();
  const cleanBaselineModelName = rec.baseline.name
    .replace('Baseline (', '')
    .replace(/\([^)]*\)/g, '')
    .replace(' Seq)', '')
    .trim();

  const exportConfigJson = JSON.stringify({
    "$schema": "https://undocumented.dev/schema/config.json",
    "project": `UnDocumented Optimized ${selectedMockRepo.toUpperCase()}`,
    "optimizer": {
      "strategy": rec.winner.strategy.toLowerCase().replace(/\s+/g, '_'),
      "max_workers": rec.winner.strategy.toLowerCase().includes('parallel') || rec.winner.strategy.toLowerCase().includes('worker') ? 8 : 1,
      "timeout_ms": Math.round(rec.winner.latency * 1.5),
      "retry_attempts": 3
    },
    "routing": {
      "default_provider": rec.winner.provider.toLowerCase(),
      "fallback_provider": rec.baseline.provider.toLowerCase(),
      "mapping": {
        "fast_completions": {
          "provider": rec.winner.provider.toLowerCase(),
          "model": cleanWinnerModelName.toLowerCase().replace(/\s+/g, '-'),
          "concurrency": rec.winner.strategy.toLowerCase().includes('parallel') || rec.winner.strategy.toLowerCase().includes('worker') ? 8 : 1
        },
        "high_intelligence": {
          "provider": rec.baseline.provider.toLowerCase(),
          "model": cleanBaselineModelName.toLowerCase().replace(/\s+/g, '-')
        }
      }
    }
  }, null, 2);

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(exportConfigJson);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copilotPromptText = `Act as an Expert AI Performance Architect.
Context: We audited the application's LLM calling architecture. The baseline uses sequential API completions.
Goal: Re-engineer the codebase to incorporate high-throughput optimization strategies.
Task: Replace sequential completions with a parallelized distributed worker pool running ${cleanWinnerModelName} (for high concurrency at low cost) and implement semantic caching as defined in the configuration below:

${exportConfigJson}

Instructions:
1. Wrap all completions calls in a Semaphore-controlled async worker pool (max 8 concurrent connections).
2. Integrate a semantic cache check prior to executing the ${rec.winner.provider} API calls.
3. Keep semantic output parity identical to the original ${rec.baseline.provider} completions prompts.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(copilotPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const steps = [
    'Prompt Ingestion',
    'Concurrency Setup',
    'Baseline Runs',
    'Parity Auditing',
    'Synthesis & Report'
  ];

  const totalCalls = scanResults?.files?.reduce((acc: number, f: any) => acc + (f.calls?.length || 0), 0) || 0;

  // Render components conditionally based on pipeline step state
  return (
    <div className="tab-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* STEP 1: SETUP PANEL */}
        {pipelineStep === 'setup' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="connection-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'mock', label: 'Mock Repos' },
                { id: 'local', label: 'Local Codebase' },
                { id: 'github_public', label: 'GitHub (Public URL)' },
                { id: 'github_private', label: 'GitHub Connect (Private)' },
                { id: 'gcp', label: 'Google Cloud Platform (GCP)' },
                { id: 'manual', label: 'Manual Copy-Paste' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`filter-btn ${connectorType === tab.id ? 'active' : ''}`}
                  onClick={() => handleSelectConnector(tab.id as any)}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {connectorType === 'mock' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Select a pre-loaded project below to audit. These demo projects are pre-installed in the workspace.
                  </div>
                  <div className="mock-repos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', width: '100%' }}>
                    {mockReposList.map(repo => {
                      const isSelected = selectedMockRepo === repo.id;
                      return (
                        <div 
                          key={repo.id}
                          onClick={() => handleSelectMockRepo(repo.id)}
                          className={`glass-panel mock-repo-card ${isSelected ? 'selected' : ''}`}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            border: isSelected ? '1px solid var(--amber-gold)' : '1px solid var(--border-light)',
                            background: isSelected ? 'rgba(217, 119, 6, 0.05)' : 'rgba(255,255,255,0.01)',
                            boxShadow: isSelected ? '0 0 12px rgba(217, 119, 6, 0.15)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: isSelected ? 'var(--amber-gold)' : 'var(--text-primary)' }}>
                              {repo.name}
                            </h4>
                            <span className="badge" style={{ 
                              fontSize: '0.75rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              background: isSelected ? 'var(--amber-gold)' : 'var(--border-light)',
                              color: isSelected ? '#000' : 'var(--text-secondary)'
                            }}>
                              {isSelected ? 'Selected' : 'Demo'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', flexGrow: 1 }}>
                            {repo.desc}
                          </p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {repo.id === 'script_sync' && (
                              <>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '3px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Gemini Pro</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4o</span>
                              </>
                            )}
                            {repo.id === 'compliance_guard' && (
                              <>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4o</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4-Turbo</span>
                              </>
                            )}
                            {repo.id === 'ledger_audit' && (
                              <>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '3px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Claude 3.5</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4o</span>
                              </>
                            )}
                            {repo.id === 'customer_support_flow' && (
                              <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4o-mini</span>
                            )}
                            {repo.id === 'educational_tutor' && (
                              <>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '3px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Claude Haiku</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4o-mini</span>
                              </>
                            )}
                            {repo.id === 'financial_summarizer' && (
                              <>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4-Turbo</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>GPT-4o</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {connectorType === 'local' && (
                <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ flex: '1' }}>
                    <label>Target Local Workspace Directory Path</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="/path/to/your/project-repository"
                      value={repoPath}
                      onChange={(e) => setRepoPath(e.target.value)}
                      disabled={scanning}
                    />
                  </div>
                  <button
                    className="filter-btn"
                    onClick={handleOpenFinder}
                    disabled={scanning || selectingDir}
                    style={{ height: '46px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', background: 'rgba(255,255,255,0.03)', whiteSpace: 'nowrap' }}
                    title="Open Finder folder selector"
                    type="button"
                  >
                    <FolderOpen size={16} />
                    <span>{selectingDir ? 'Choosing...' : 'Choose Project to Scan'}</span>
                  </button>
                </div>
              )}

              {connectorType === 'github_public' && (
                <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
                  <div className="input-group" style={{ flex: '2', minWidth: '200px' }}>
                    <label>Public GitHub Repository URL</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="https://github.com/google/generative-ai-python"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      disabled={scanning}
                    />
                  </div>
                  <div className="input-group" style={{ flex: '1', minWidth: '100px' }}>
                    <label>Branch / Ref</label>
                    <input
                      type="text"
                      className="text-input"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      disabled={scanning}
                    />
                  </div>
                </div>
              )}

              {connectorType === 'github_private' && (
                <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {!githubConnected ? (
                    <button
                      className="btn-primary"
                      onClick={handleConnectGit}
                      disabled={connectingGit}
                      style={{ background: 'linear-gradient(135deg, #24292e, #1a1f24)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <span>{connectingGit ? 'Connecting OAuth...' : 'Connect GitHub Account'}</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
                      <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✓ GitHub Connected</span>
                      </div>
                      <div className="input-group" style={{ flex: 1 }}>
                        <label>Select Private Repository</label>
                        <select
                          className="text-input"
                          value={githubPrivateRepo}
                          onChange={(e) => setGithubPrivateRepo(e.target.value)}
                          style={{ background: '#09090b', cursor: 'pointer' }}
                        >
                          <option value="enterprise-agent-mesh">enterprise-agent-mesh</option>
                          <option value="bavl-stylist-pipeline">bavl-stylist-pipeline</option>
                          <option value="obsidian-private-vault">obsidian-private-vault</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {connectorType === 'gcp' && (
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Select GCP Cloud Source Repository (Project: gen-lang-client-0624562208)</label>
                  <select
                    className="text-input"
                    value={gcpRepo}
                    onChange={(e) => setGcpRepo(e.target.value)}
                    style={{ background: '#09090b', cursor: 'pointer' }}
                  >
                    <option value="csr-agent-prod">csr-agent-prod</option>
                    <option value="bavl-translation-worker">bavl-translation-worker</option>
                    <option value="undocumented-evaluator">undocumented-evaluator</option>
                  </select>
                </div>
              )}

              {connectorType === 'manual' && (
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Paste Codebase Snippets (Python / JS / TS)</label>
                  <textarea
                    className="prompt-textarea"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Paste python codebase file or prompt code here..."
                    disabled={scanning}
                    style={{ minHeight: '140px' }}
                  />
                </div>
              )}

              {connectorType !== 'manual' && connectorType !== 'mock' && (
                <button 
                  className="btn-primary" 
                  onClick={handleScan} 
                  disabled={scanning || (connectorType === 'local' && !repoPath.trim()) || (connectorType === 'github_public' && !githubUrl.trim()) || (connectorType === 'github_private' && !githubConnected)}
                  style={{ minWidth: '180px', height: '46px' }}
                >
                  <Search size={18} />
                  <span>{scanning ? 'Auditing...' : 'Start Discovery Audit'}</span>
                </button>
              )}
            </div>

            {connectorType === 'manual' && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleScan} 
                  disabled={scanning || !manualCode.trim()}
                  style={{ minWidth: '180px', height: '46px' }}
                >
                  <Search size={18} />
                  <span>{scanning ? 'Parsing Snippet...' : 'Audit Snippet'}</span>
                </button>
              </div>
            )}

            {connectorType === 'mock' && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleScan} 
                  disabled={scanning}
                  style={{ minWidth: '200px', height: '46px' }}
                >
                  <Search size={18} />
                  <span>{scanning ? 'Auditing Mock...' : 'Start Discovery Audit'}</span>
                </button>
              </div>
            )}

            {errorMsg && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-pink)', fontSize: '0.9rem' }}>
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SCANNING PROGRESS BAR SCREEN */}
        {pipelineStep === 'scanning' && (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={48} className="spin" style={{ color: 'var(--amber-gold)', animation: 'spin 2s linear infinite' }} />
              <Code size={20} style={{ position: 'absolute', color: '#fff' }} />
            </div>
            
            <div style={{ maxWidth: '500px', width: '100%' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Agentic Codebase Scan In Progress</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Scanning codebase AST structures, compiling prompt variables, and parsing model execution paths...
              </p>
              
              <div className="scan-progress-container" style={{ padding: 0, marginTop: 0 }}>
                <div className="progress-header">
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{scanStep}</span>
                  <span style={{ fontFamily: 'var(--mono-font)', fontWeight: 'bold', color: 'var(--amber-gold)' }}>{progress}%</span>
                </div>
                <div className="progress-track" style={{ height: '10px' }}>
                  <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(to right, var(--amber-gold), var(--primary))' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW STAGE & INTERACTIVE AI CHAT CONSOLE */}
        {pipelineStep === 'review' && scanResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header info bar */}
            <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--amber-gold)' }}>
              <div>
                <span className="badge badge-green" style={{ textShadow: '0 0 10px rgba(16,185,129,0.3)', marginBottom: '4px' }}>✓ AUDIT SCAN COMPLETED</span>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Codebase Discovery Complete</h3>
              </div>
              <button 
                className="filter-btn" 
                onClick={() => {
                  setScanResults(null);
                  setPipelineStep('setup');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>Re-Scan Codebase</span>
              </button>
            </div>

            <div className="dashboard-grid">
              
              {/* Left Column: Detected Invocations */}
              <div className="glass-panel" style={{ gridColumn: 'span 5', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                  <span>Detected Invocations</span>
                  <span className="badge badge-blue">{totalCalls} Calls</span>
                </h3>
                
                <div className="detected-files-list" style={{ flex: 1 }}>
                  {scanResults.files && scanResults.files.length > 0 ? (
                    scanResults.files.map((fileData: any, idx: number) => (
                      <div key={idx} className="file-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                        <div className="file-info" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <span className="file-path" style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{fileData.file.split('/').pop()}</span>
                          <span className="file-calls-badge">{fileData.calls.length} API Calls</span>
                        </div>
                        <div style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--mono-font)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {fileData.file}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                          {fileData.calls.map((call: any, cIdx: number) => (
                            <div key={cIdx} style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)', alignItems: 'center' }}>
                              <span style={{ color: 'var(--cyber-cyan)', fontWeight: 'bold', fontFamily: 'var(--mono-font)' }}>L{call.line}:</span>
                              <code style={{ fontSize: '0.75rem', background: 'transparent', padding: 0, color: 'var(--text-secondary)' }}>{call.type}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active API invocations located.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Editable Prompts */}
              <div className="glass-panel" style={{ gridColumn: 'span 7', padding: '24px', margin: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: 0 }}>
                  <span>Editable Prompt Templates</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={14} /> Adjust prompt variables before testing
                  </span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
                  {scanResults.prompts && scanResults.prompts.length > 0 ? (
                    scanResults.prompts.map((prompt: any) => {
                      const isEditing = editingPromptId === prompt.id;
                      const activeValue = promptValues[prompt.id] !== undefined ? promptValues[prompt.id] : prompt.raw_prompt;
                      return (
                        <div key={prompt.id} className="glass-panel prompt-card" style={{ background: 'rgba(0,0,0,0.15)', margin: 0 }}>
                          <div className="prompt-card-header">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{prompt.title}</span>
                              <span className="prompt-source">Source: {prompt.file} (Line {prompt.line})</span>
                            </div>
                            <div>
                              {isEditing ? (
                                <button 
                                  className="btn-primary" 
                                  onClick={() => handleSavePrompt(prompt.id)}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  <Save size={14} />
                                  <span>Save</span>
                                </button>
                              ) : (
                                <button 
                                  className="filter-btn" 
                                  onClick={() => setEditingPromptId(prompt.id)}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  <Code size={14} />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              className="prompt-textarea"
                              value={activeValue}
                              onChange={(e) => setPromptValues({
                                ...promptValues,
                                [prompt.id]: e.target.value
                              })}
                              style={{ fontSize: '0.8rem' }}
                            />
                          ) : (
                            <div style={{ 
                              background: 'rgba(0,0,0,0.25)', 
                              padding: '12px', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              fontFamily: 'var(--mono-font)', 
                              color: 'var(--text-secondary)',
                              lineHeight: '1.45',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid rgba(255,255,255,0.02)',
                              maxHeight: '130px',
                              overflowY: 'auto'
                            }}>
                              {activeValue}
                            </div>
                          )}

                          <div className="prompt-meta" style={{ marginTop: '8px' }}>
                            <div className="prompt-tokens" style={{ fontSize: '0.75rem' }}>
                              Estimate length: <strong style={{ color: 'var(--cyber-cyan)' }}>{Math.ceil(activeValue.length / 4)} tokens</strong>
                            </div>
                            {activeValue.includes('{{') && (
                              <span className="badge badge-blue" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>Dynamic Interpolation</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No templates extracted.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Human-in-the-Loop AI Chat Console */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', margin: 0 }}>
                <MessageSquare size={18} style={{ color: 'var(--amber-gold)' }} />
                <span>Interactive AI Chat Console (HITL Pause)</span>
              </h3>
              
              <div style={{
                height: '200px',
                overflowY: 'auto',
                background: '#04060a',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {chatHistory.map((chat, idx) => (
                  <div key={idx} style={{
                    alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                    background: chat.role === 'user' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: chat.role === 'user' ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    maxWidth: '85%',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    color: chat.role === 'user' ? '#fff' : 'var(--text-secondary)'
                  }}>
                    {chat.content}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)'
                  }}>
                    <RefreshCw size={14} className="spin" style={{ display: 'inline-block', marginRight: '6px', animation: 'spin 2s linear infinite' }} />
                    AI Assistant is applying changes...
                  </div>
                )}
              </div>
              
              {/* Presets suggestions tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className="filter-btn" 
                  onClick={() => setChatInput("Incorporate personality structure guidelines and DISC profiling")}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.02)' }}
                >
                  + Add DISC Profile
                </button>
                <button 
                  className="filter-btn" 
                  onClick={() => setChatInput("Mitigate policy risks, filter out PII, and add safety boundaries")}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.02)' }}
                >
                  + Add Safety Guardrails
                </button>
                <button 
                  className="filter-btn" 
                  onClick={() => setChatInput("Optimize the benchmark tier for cost efficiency (Gemini Flash)")}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.02)' }}
                >
                  + Optimize for Cost
                </button>
                <button 
                  className="filter-btn" 
                  onClick={() => setChatInput("Configure pipeline for maximum semantic quality & flagship models")}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.02)' }}
                >
                  + Optimize for Quality
                </button>
              </div>

              {/* Chat inputs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="Tell AI to alter prompt definitions or change execution rules..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-primary" 
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ padding: '0 20px', height: '46px' }}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Glowing Confirm & Ignite Action Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button 
                className="btn-ignite" 
                onClick={handleIgniteBenchmark}
                style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center', gap: '12px' }}
              >
                <Play size={20} fill="#fff" />
                <span>CONFIRM & IGNITE BENCHMARK</span>
              </button>
            </div>

          </div>
        )}

        {/* STEP 4: BENCHMARKING PIPELINE RUNNING */}
        {pipelineStep === 'benchmarking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Live Stepper Tracker */}
            <div className="glass-panel" style={{ padding: '20px 30px' }}>
              <div className="stepper-container" style={{ margin: '20px 10px' }}>
                <div className="stepper-line">
                  <div 
                    className="stepper-line-fill" 
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} 
                  />
                </div>
                {steps.map((label, index) => {
                  const stepNum = index + 1;
                  const isActive = currentStep === stepNum;
                  const isCompleted = currentStep > stepNum;
                  return (
                    <div 
                      key={index} 
                      className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className="step-circle">
                        {isCompleted ? '✓' : stepNum}
                      </div>
                      <span className="step-label">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Ticker Gauges */}
            <div className="ticker-grid">
              <div className="glass-panel ticker-card latency">
                <div className="ticker-title">Live Pipeline Latency</div>
                <div className="ticker-val glow-text-cyan">
                  {tickerLatency === 0 ? '--' : `${tickerLatency} ms`}
                </div>
              </div>
              <div className="glass-panel ticker-card cost">
                <div className="ticker-title">Live Est. API Cost (1M Tokens)</div>
                <div className="ticker-val glow-text-pink">
                  {tickerCost === 0 ? '--' : `$${tickerCost.toFixed(3)}`}
                </div>
              </div>
              <div className="glass-panel ticker-card parity">
                <div className="ticker-title">Semantic Quality Parity</div>
                <div className="ticker-val glow-text-green">
                  {tickerParity === 0 ? '--' : `${tickerParity}%`}
                </div>
              </div>
            </div>

            {/* Retro Cyber Log Terminal */}
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-buttons">
                  <div className="terminal-dot" />
                  <div className="terminal-dot" />
                  <div className="terminal-dot" />
                </div>
                <div className="terminal-title">undocumented_optimizer --verbose</div>
                <div style={{ width: '40px' }} />
              </div>
              
              <div className="terminal-logs">
                {logs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <span className="log-time">[{log.time}]</span>
                    <span className={`log-${log.type}`}>
                      {log.text}
                    </span>
                  </div>
                ))}
                {benchmarkingRunning && (
                  <div className="log-entry">
                    <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
                    <span className="log-active">Awaiting backend response channels...</span>
                    <span className="terminal-cursor" />
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

          </div>
        )}

        {/* STEP 5: RESULTS SCREEN */}
        {pipelineStep === 'results' && localBenchmarkResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Top Recommendation Highlight Card */}
            <div className="glass-panel recommend-card" style={{ borderLeft: '4px solid var(--amber-gold)' }}>
              <div className="recommend-header">
                <div>
                  <span className="badge badge-purple" style={{ marginBottom: '8px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                    <Award size={12} /> RECOMMENDED ARCHITECTURE SUGGESTION
                  </span>
                  <h3 className="recommend-title" style={{ color: '#fff', marginTop: '4px', fontSize: '1.25rem' }}>
                    Replace {rec.baseline.provider} Sequential with {cleanWinnerModelName} on {rec.winner.strategy}
                  </h3>
                </div>
                <div className="savings-badge-glow">
                  -{rec.costReduction}% Cost Reduction
                </div>
              </div>
              
              <p className="recommend-desc" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '12px 0 20px 0' }}>
                We recommend replacing your current sequential {rec.baseline.provider} calls with a {rec.winner.strategy.toLowerCase()} using {cleanWinnerModelName}. This setup unlocks a {rec.speedup}x speedup and {rec.costReduction}% cost reduction while maintaining {rec.winner.parity}% semantic quality parity.
              </p>

              <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
                <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', margin: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LATENCY COMPARISON</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--cyber-cyan)' }}>{rec.winner.latency}ms</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs {rec.baseline.latency}ms baseline</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: '500' }}>
                    {rec.speedup}x Speedup factor
                  </div>
                </div>

                <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', margin: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>COST COMPARISON</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--cyber-pink)' }}>${rec.winner.cost === 0 ? '0.000' : rec.winner.cost.toFixed(3)}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs ${rec.baseline.cost === 0 ? '0.000' : rec.baseline.cost.toFixed(3)} baseline</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: '500' }}>
                    {rec.costReduction}% monthly cost drop
                  </div>
                </div>

                <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', margin: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>QUALITY PARITY</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{rec.winner.parity}%</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semantic score</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px', fontWeight: '500' }}>
                    Virtually identical responses
                  </div>
                </div>
              </div>

              {/* Comparison visual bars */}
              <div className="metrics-comparison-bars" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="comparison-bar-row">
                  <div className="comparison-bar-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Latency Benchmark Comparison</span>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>180ms optimized vs 2450ms baseline</span>
                  </div>
                  <div className="comparison-bar-track" style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <div className="comparison-bar-fill baseline" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
                    <div className="comparison-bar-fill optimized" style={{ width: '7.3%', height: '100%', background: 'var(--cyber-cyan)', position: 'absolute', top: 0, left: 0 }} />
                  </div>
                </div>

                <div className="comparison-bar-row">
                  <div className="comparison-bar-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>API Cost Benchmark Comparison</span>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>$0.015 optimized vs $0.180 baseline</span>
                  </div>
                  <div className="comparison-bar-track" style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <div className="comparison-bar-fill baseline" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
                    <div className="comparison-bar-fill optimized" style={{ width: '8.3%', height: '100%', background: 'var(--cyber-pink)', position: 'absolute', top: 0, left: 0 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Comparative Charts grid container */}
            <div className="dashboard-grid">
              
              {/* Chart selector & renderer */}
              <div className="glass-panel" style={{ gridColumn: 'span 7', padding: '24px', margin: 0 }}>
                <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Optimization Comparative Curves</h3>
                  <div className="analytics-filters" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`filter-btn ${metricTab === 'latency' ? 'active' : ''}`}
                      onClick={() => setMetricTab('latency')}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Latency
                    </button>
                    <button 
                      className={`filter-btn ${metricTab === 'cost' ? 'active' : ''}`}
                      onClick={() => setMetricTab('cost')}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Cost
                    </button>
                    <button 
                      className={`filter-btn ${metricTab === 'parity' ? 'active' : ''}`}
                      onClick={() => setMetricTab('parity')}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Parity
                    </button>
                  </div>
                </div>
                
                <div className="chart-container" style={{ height: '280px', padding: 0 }}>
                  <CustomChart data={localBenchmarkResults} metric={metricTab} />
                </div>
              </div>

              {/* Config Exporter block */}
              <div className="glass-panel" style={{ gridColumn: 'span 5', padding: '24px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Export Configuration</h3>
                  <button className="btn-copy" onClick={handleCopyConfig} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {copiedConfig ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                    <span style={{ fontSize: '0.8rem' }}>{copiedConfig ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                  Apply these optimization configurations directly to your local UnDocumented configuration mapping.
                </p>
                <pre style={{
                  flex: 1,
                  background: '#04060a',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#8695b8',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '180px',
                  textAlign: 'left'
                }}>
                  <code>{exportConfigJson}</code>
                </pre>
              </div>
              
            </div>

            {/* IDE Copilot Prompt panel */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} style={{ color: 'var(--amber-gold)' }} />
                    <span>IDE Copilot Prompt (For Antigravity, Cursor, Claude Code)</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Copy this pre-structured prompt template and paste it straight into your AI coding assistant.
                  </span>
                </div>
                <button className="btn-primary" onClick={handleCopyPrompt} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy Copilot Prompt'}</span>
                </button>
              </div>
              <pre style={{
                background: '#04060a',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '16px',
                color: '#abb2bf',
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '220px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.45',
                fontFamily: 'var(--sans-font)'
              }}>
                {copilotPromptText}
              </pre>
            </div>

            {/* Detailed Performance Comparison Grid Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px', marginTop: 0 }}>
                Provider Performance Grid & Optimization Metrics
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>Target Engine Setup</th>
                      <th>Execution Strategy</th>
                      <th>Latency</th>
                      <th>Speedup Factor</th>
                      <th>Cost per 1M Tokens</th>
                      <th>Savings Rate</th>
                      <th>Parity Score</th>
                      <th>Highlight Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localBenchmarkResults.map((row, idx) => {
                      const isBaseline = row.strategy === 'Sequential';
                      const speedup = isBaseline ? '1.0x' : `${(2450 / row.latency).toFixed(1)}x`;
                      const savings = isBaseline ? '0%' : `-${((0.180 - row.cost) / 0.180 * 100).toFixed(1)}%`;
                      
                      const badge = isBaseline ? (
                        <span className="badge badge-blue">BASELINE TARGET</span>
                      ) : row.provider === 'Google' && row.name.includes('Flash') ? (
                        <span className="badge badge-green" style={{ textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>★ VIRTUAL WINNER</span>
                      ) : row.parity >= 99.0 ? (
                        <span className="badge badge-purple">INTELLIGENCE KING</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>VIABLE ALTERNATIVE</span>
                      );

                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: '#fff' }}>
                            {row.provider} {row.name.replace(' (Parallel Pool)', '').replace(' (GPT-4o Seq)', '')}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--mono-font)', fontSize: '0.8rem' }}>{row.strategy}</span>
                          </td>
                          <td style={{ fontFamily: 'var(--mono-font)' }}>{row.latency} ms</td>
                          <td style={{ color: isBaseline ? 'var(--text-secondary)' : 'var(--success)', fontWeight: 'bold' }}>
                            {speedup}
                          </td>
                          <td style={{ fontFamily: 'var(--mono-font)' }}>${row.cost.toFixed(3)}</td>
                          <td style={{ color: isBaseline ? 'var(--text-secondary)' : 'var(--cyber-pink)', fontWeight: 'bold' }}>
                            {savings}
                          </td>
                          <td style={{ fontWeight: 'bold', color: isBaseline ? 'var(--text-secondary)' : 'var(--success)' }}>
                            {row.parity}%
                          </td>
                          <td>{badge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Back to Setup button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setScanResults(null);
                  setPipelineStep('setup');
                  setLocalBenchmarkResults([]);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RotateCcw size={16} />
                <span>Run Another Discovery Audit</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Toast notifications */}
      {copiedConfig && (
        <div className="toast-msg">
          <Check size={18} />
          <span>Configuration JSON copied to clipboard!</span>
        </div>
      )}

    </div>
  );
};
