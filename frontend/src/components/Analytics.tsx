import React, { useState } from 'react';
import { CustomChart } from './CustomChart';
import { Check, Copy, Zap, Award } from 'lucide-react';

interface AnalyticsProps {
  benchmarkResults: any[];
  bestRecommendation: any;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  benchmarkResults,
  bestRecommendation
}) => {
  const [metricTab, setMetricTab] = useState<'latency' | 'cost' | 'parity'>('latency');
  const [copiedConfig, setCopiedConfig] = useState(false);

  if (!benchmarkResults || benchmarkResults.length === 0) {
    return (
      <div className="tab-content">
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Zap size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Analytics Data Pending</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            Please select your strategies in the <strong>Benchmark Studio</strong> and click <strong>Ignite Optimization Benchmark</strong> to generate performance comparison grids.
          </p>
        </div>
      </div>
    );
  }

  // Filter out baseline if we want to display comparison or keep them all
  const displayResults = benchmarkResults;

  // Format configuration JSON for copy
  const exportConfigJson = JSON.stringify({
    "$schema": "https://undocumented.dev/schema/config.json",
    "project": "UnDocumented Optimized Deploy",
    "optimizer": {
      "strategy": "parallel_pool",
      "max_workers": 8,
      "timeout_ms": 5000,
      "retry_attempts": 3
    },
    "routing": {
      "default_provider": "google",
      "fallback_provider": "openai",
      "mapping": {
        "fast_completions": {
          "provider": "google",
          "model": "gemini-2.5-flash",
          "concurrency": 8
        },
        "high_intelligence": {
          "provider": "openai",
          "model": "gpt-4o-mini"
        }
      }
    }
  }, null, 2);

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(exportConfigJson);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

        {/* Top Recommendation Highlight Card */}
        {bestRecommendation && (
          <div className="glass-panel recommend-card">
            <div className="recommend-header">
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '8px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  <Award size={12} /> RECOMMENDED ARCHITECTURE SUGGESTION
                </span>
                <h3 className="recommend-title" style={{ color: '#fff', marginTop: '4px' }}>
                  {bestRecommendation.title}
                </h3>
              </div>
              <div className="savings-badge-glow">
                -{bestRecommendation.costReduction}% Cost Reduction
              </div>
            </div>
            
            <p className="recommend-desc">{bestRecommendation.description}</p>

            <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
              <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LATENCY COMPARISON</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--cyber-cyan)' }}>180ms</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs 2,450ms baseline</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: '500' }}>
                  12.6x Speedup factor
                </div>
              </div>

              <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>COST COMPARISON</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--cyber-pink)' }}>$0.015</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs $0.180 baseline</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: '500' }}>
                  91.6% monthly cost drop
                </div>
              </div>

              <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>QUALITY PARITY</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>96.8%</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semantic score</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px', fontWeight: '500' }}>
                  Virtually identical responses
                </div>
              </div>
            </div>

            {/* Comparison visual bars */}
            <div className="metrics-comparison-bars">
              <div className="comparison-bar-row">
                <div className="comparison-bar-info">
                  <span>Latency Benchmark Comparison</span>
                  <span style={{ fontWeight: 'bold' }}>180ms optimized vs 2450ms baseline</span>
                </div>
                <div className="comparison-bar-track">
                  <div className="comparison-bar-fill baseline" style={{ width: '100%' }} />
                  <div className="comparison-bar-fill optimized" style={{ width: '7%' }} />
                </div>
              </div>

              <div className="comparison-bar-row">
                <div className="comparison-bar-info">
                  <span>API Cost Benchmark Comparison</span>
                  <span style={{ fontWeight: 'bold' }}>$0.015 optimized vs $0.180 baseline</span>
                </div>
                <div className="comparison-bar-track">
                  <div className="comparison-bar-fill baseline" style={{ width: '100%' }} />
                  <div className="comparison-bar-fill optimized" style={{ width: '8.3%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparative Charts grid container */}
        <div className="dashboard-grid">
          
          {/* Chart selector & renderer */}
          <div className="glass-panel" style={{ gridColumn: 'span 7', padding: '24px' }}>
            <div className="chart-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Optimization Comparative Curves</h3>
              <div className="analytics-filters">
                <button 
                  className={`filter-btn ${metricTab === 'latency' ? 'active' : ''}`}
                  onClick={() => setMetricTab('latency')}
                >
                  Latency (ms)
                </button>
                <button 
                  className={`filter-btn ${metricTab === 'cost' ? 'active' : ''}`}
                  onClick={() => setMetricTab('cost')}
                >
                  Cost ($/1M Tx)
                </button>
                <button 
                  className={`filter-btn ${metricTab === 'parity' ? 'active' : ''}`}
                  onClick={() => setMetricTab('parity')}
                >
                  Parity (%)
                </button>
              </div>
            </div>
            
            <div className="chart-container">
              <CustomChart data={displayResults} metric={metricTab} />
            </div>
          </div>

          {/* Config Exporter block */}
          <div className="glass-panel" style={{ gridColumn: 'span 5', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Export Configuration</h3>
              <button className="btn-copy" onClick={handleCopyConfig}>
                {copiedConfig ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span>{copiedConfig ? 'Copied!' : 'Copy Code'}</span>
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
              maxHeight: '220px',
              textAlign: 'left'
            }}>
              <code>{exportConfigJson}</code>
            </pre>
          </div>
          
        </div>

        {/* Detailed Provider Performance Grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '10px' }}>
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
                {benchmarkResults.map((row, idx) => {
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

      </div>
      
      {/* Toast popup */}
      {copiedConfig && (
        <div className="toast-msg">
          <Check size={18} />
          <span>Configuration JSON copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};
