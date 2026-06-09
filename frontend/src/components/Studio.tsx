import React, { useState, useRef, useEffect } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface StudioProps {
  apiOnline: boolean;
  demoMode: boolean;
  scanResults: any;
  onBenchmarkComplete: (results: any) => void;
}

export const Studio: React.FC<StudioProps> = ({
  apiOnline,
  demoMode,
  scanResults,
  onBenchmarkComplete
}) => {
  // Strategy state
  const [strategies, setStrategies] = useState<string[]>(['parallel_pool']);
  // Providers state
  const [providers, setProviders] = useState<string[]>(['openai', 'anthropic', 'google']);
  // Tier state
  const [tier, setTier] = useState<string>('fast');

  // Benchmarking running state
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 to 5
  const [logs, setLogs] = useState<{ id: number; time: string; type: 'system' | 'success' | 'active' | 'error'; text: string }[]>([]);
  
  // Real-time tickers
  const [tickerLatency, setTickerLatency] = useState<number>(0);
  const [tickerCost, setTickerCost] = useState<number>(0);
  const [tickerParity, setTickerParity] = useState<number>(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIdCounter = useRef(0);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text: string, type: 'system' | 'success' | 'active' | 'error' = 'system') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { id: logIdCounter.current++, time, type, text }]);
  };

  const toggleStrategy = (id: string) => {
    setStrategies(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleProvider = (id: string) => {
    setProviders(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleIgnite = async () => {
    if (providers.length === 0) {
      alert('Please select at least one LLM provider.');
      return;
    }
    if (strategies.length === 0) {
      alert('Please select at least one optimization strategy.');
      return;
    }

    setRunning(true);
    setLogs([]);
    setCurrentStep(1);
    setTickerLatency(2450); // Initial baseline latency
    setTickerCost(0.180);   // Initial baseline cost
    setTickerParity(0);

    logIdCounter.current = 0;
    addLog('🔥 UnDocumented Engine: Ignition optimization benchmark pipeline', 'system');
    addLog(`Strategy Configuration: ${strategies.join(', ')}`, 'system');
    addLog(`Model Target Tier: ${tier === 'fast' ? 'Fast/Cheap' : 'Intelligence/High-Parity'}`, 'system');
    addLog(`Target Providers: ${providers.join(', ')}`, 'system');

    // Determine if we should connect to the actual backend or run a simulator
    if (!demoMode && apiOnline) {
      try {
        const customPrompts = scanResults?.prompts?.map((p: any) => p.raw_prompt) || [];
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
          headers: {
            'Content-Type': 'application/json'
          },
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
              if (msgLower.includes('running sequential') || msgLower.includes('step 1/')) {
                setCurrentStep(1);
              } else if (msgLower.includes('worker') || msgLower.includes('concurrency')) {
                setCurrentStep(2);
              } else if (msgLower.includes('baseline') || msgLower.includes('baseline')) {
                setCurrentStep(3);
              } else if (msgLower.includes('scoring') || msgLower.includes('parity')) {
                setCurrentStep(4);
              }
            } else if (type === 'complete') {
              try {
                addLog('✨ Optimization benchmark completed successfully!', 'success');
                setCurrentStep(5);
                setRunning(false);

                const results = parsed.results || [];
                const mappedResults = results.map((r: any) => {
                  return {
                    name: r.name || `${r.provider} ${r.strategy}`,
                    latency: typeof r.latency === 'number' ? r.latency : Math.round((r.summary?.average_latency || 0) * 1000) || 200,
                    cost: typeof r.cost === 'number' ? r.cost : r.summary?.total_cost || 0.01,
                    parity: typeof r.parity === 'number' ? r.parity : Math.round((r.semantic_alignment || 0) * 100) || 95,
                    strategy: r.strategy || 'Parallel Pool',
                    provider: r.provider || 'Google',
                    tier: r.tier || 'low',
                    summary: r.summary || {}
                  };
                });

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

                onBenchmarkComplete(mappedResults);
              } catch {
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
              setRunning(false);
            }
          }
        }
      } catch (err: any) {
        addLog(`Real-time stream failed: ${err.message}. Running simulation...`, 'error');
        runSimulation();
      }
    } else {
      // Local simulator
      runSimulation();
    }
  };

  const runSimulation = async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Step 1: Scanner Extraction
    setCurrentStep(1);
    addLog('[Scanner] Parsing extracted prompt structures...', 'active');
    await delay(800);
    addLog('[Scanner] Extracted 3 templates successfully.', 'success');
    addLog('[Scanner] Identified variables: {{user_query}}, {{email_text}}, {{baseline_answer}}', 'system');
    
    // Step 2: Parallel Pool Setup
    setCurrentStep(2);
    addLog('[Engine] Initializing parallel worker pool...', 'active');
    await delay(1000);
    addLog('[Engine] Pool configured with Max Concurrent Workers = 8.', 'success');
    addLog('[Engine] Thread lock verified. Worker channels initialized.', 'system');

    // Step 3: Baseline Verification
    setCurrentStep(3);
    addLog('[Verifier] Evaluating baseline models sequentially...', 'active');
    await delay(1200);
    addLog('[Verifier] Sequential run finished.', 'success');
    
    // Determine baseline latency/cost depending on tier
    const isFast = tier === 'fast';
    const baseLatency = isFast ? 1200 : 2450;
    const baseCost = isFast ? 0.025 : 0.180;
    addLog(`[Verifier] Sequential Baseline (OpenAI GPT-4o): Latency = ${baseLatency}ms, Cost = $${baseCost} / 1K requests`, 'system');

    // Step 4: Parity Scoring
    setCurrentStep(4);
    addLog('[Auditor] Scoring optimized providers against baseline GPT-4o outputs...', 'active');
    
    // Build dynamic mock results
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
      },
      deepseek: {
        name: 'DeepSeek',
        baselineModel: 'DeepSeek Coder',
        optimizedModel: 'DeepSeek Coder',
        baseCost: 0.010,
        baseLatency: 1400
      }
    };

    // 1. Add baselines for selected providers
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

    // 2. Add selected strategies for selected providers
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
        } else if (sId === 'sliding_window') {
          stratName = 'Attention Sinks KV Pruning';
          latFactor = 0.70;
          costFactor = 0.65;
          parityScore = 97.5;
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

    // Find overall winner among optimized results to animate tickers
    const optimizedOnly = mockBenchmarkResults.filter(r => r.strategy !== 'Sequential');
    const winner = optimizedOnly.length > 0 ? 
      optimizedOnly.reduce((best, curr) => (curr.latency < best.latency ? curr : best), optimizedOnly[0]) : 
      mockBenchmarkResults[0];

    const finalLatency = winner.latency;
    const finalCost = winner.cost;
    const finalParity = winner.parity;

    // Animate tickers gradually down/up
    const ticks = 10;
    for (let i = 1; i <= ticks; i++) {
      await delay(250);
      setTickerLatency(Math.round(baseLatency - (i / ticks) * (baseLatency - finalLatency)));
      setTickerCost(Number((baseCost - (i / ticks) * (baseCost - finalCost)).toFixed(3)));
      setTickerParity(Math.round((i / ticks) * finalParity));
    }

    addLog(`[Auditor] Parity calculations complete. Max: ${finalParity}%.`, 'success');
    addLog(`[Auditor] Target provider speed ratios computed. Winner: ${winner.name}.`, 'system');

    // Step 5: Cost/Latency Estimation & Completion
    setCurrentStep(5);
    addLog('[Optimizer] Formulating recommendations config file...', 'active');
    await delay(800);
    addLog('✨ Optimization benchmark completed successfully!', 'success');
    setRunning(false);

    onBenchmarkComplete(mockBenchmarkResults);
  };

  const steps = [
    'Scanner Extraction',
    'Parallel Pool Setup',
    'Baseline Verification',
    'Parity Scoring',
    'Optimization Mapping'
  ];

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Studio Setup Grid */}
        <div className="studio-grid">
          
          {/* Strategies & Tiers */}
          <div className="glass-panel options-group" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3>Select Optimization Strategies</h3>
              <div className="options-list">
                {[
                  { id: 'parallel_pool', title: 'Parallel/Distributed Worker Pool', desc: 'Concurrently schedule LLM calls across workers' },
                  { id: 'structured_cache', title: 'Structured Output Schema & Cache', desc: 'Cache JSON schemas to save compilation tokens' },
                  { id: 'context_trim', title: 'Context Compression (Trim)', desc: 'Strip trailing comments and whitespace context' },
                  { id: 'caching', title: 'Stateful Semantic Caching', desc: 'Statefully cache semantically similar prompt responses' },
                  { id: 'pruning', title: 'Context-Aware Prompt Pruning', desc: 'Prune filler tokens to save input costs and reduce latency' },
                  { id: 'sliding_window', title: 'Attention Sinks KV Pruning', desc: 'Prune historical KV cache outside of attention sinks' },
                  { id: 'queue_batch', title: 'Dynamic Queue Batching', desc: 'Queue and micro-batch calls dynamic to arrival rates' }
                ].map(strat => (
                  <div 
                    key={strat.id} 
                    className={`checkbox-label ${strategies.includes(strat.id) ? 'selected' : ''}`}
                    onClick={() => toggleStrategy(strat.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="custom-checkbox">
                      {strategies.includes(strat.id) && <span className="checkmark">✓</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{strat.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{strat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Target Intelligence Tier</h3>
              <div className="radio-group">
                <div 
                  className={`radio-btn ${tier === 'fast' ? 'selected' : ''}`}
                  onClick={() => setTier('fast')}
                >
                  <div style={{ fontWeight: 'bold' }}>Fast & Efficient</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>GPT-4o mini, Gemini Flash, Claude Haiku</div>
                </div>
                <div 
                  className={`radio-btn ${tier === 'high' ? 'selected' : ''}`}
                  onClick={() => setTier('high')}
                >
                  <div style={{ fontWeight: 'bold' }}>Max Intelligence</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>GPT-4o, Claude Sonnet, Gemini Pro</div>
                </div>
              </div>
            </div>
          </div>

          {/* Providers Checklist */}
          <div className="glass-panel options-group">
            <h3>Target LLM Providers</h3>
            <div className="options-list" style={{ gap: '14px' }}>
              {[
                { id: 'openai', title: 'OpenAI (GPT Engine)', desc: 'Standard completions API targets' },
                { id: 'anthropic', title: 'Anthropic (Claude Engine)', desc: 'High accuracy message targets' },
                { id: 'google', title: 'Google Gemini (Vertex Engine)', desc: 'High concurrency and low price points' },
                { id: 'deepseek', title: 'DeepSeek (Coder Engine)', desc: 'Cost-efficient code completions' }
              ].map(prov => (
                <div 
                  key={prov.id} 
                  className={`checkbox-label ${providers.includes(prov.id) ? 'selected' : ''}`}
                  onClick={() => toggleProvider(prov.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="custom-checkbox">
                    {providers.includes(prov.id) && <span className="checkmark">✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{prov.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prov.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Ignite Optimization Benchmark Button */}
        <div className="ignite-container">
          <button 
            className="btn-ignite" 
            onClick={handleIgnite}
            disabled={running}
          >
            {running ? <RefreshCw className="checkmark" style={{ animation: 'spin 2s linear infinite' }} /> : <Zap size={20} />}
            <span>{running ? 'BENCHMARK RUNNING...' : 'IGNITE OPTIMIZATION BENCHMARK'}</span>
          </button>
        </div>

        {/* Live Stepper Tracker */}
        {(running || logs.length > 0) && (
          <>
            <div className="glass-panel" style={{ padding: '20px 30px' }}>
              <div className="stepper-container">
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
                {running && (
                  <div className="log-entry">
                    <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
                    <span className="log-active">Awaiting backend socket events...</span>
                    <span className="terminal-cursor" />
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
