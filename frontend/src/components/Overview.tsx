import React from 'react';
import { Search, Zap, ShieldCheck, Coins, Timer } from 'lucide-react';

interface OverviewProps {
  repoPath: string;
  scanResults: any;
  setActiveTab: (tab: string) => void;
  benchmarkRan: boolean;
  bestRecommendation: any;
}

export const Overview: React.FC<OverviewProps> = ({ 
  repoPath, 
  scanResults, 
  setActiveTab, 
  benchmarkRan,
  bestRecommendation
}) => {
  const fileCount = scanResults?.files?.length || 0;
  const callsCount = scanResults?.files?.reduce((acc: number, f: any) => acc + (f.calls?.length || 0), 0) || 0;

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Welcome Banner */}
        <div className="glass-panel" style={{ padding: '35px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <h2 className="gradient-title" style={{ fontSize: '2rem', marginBottom: '12px' }}>Find the Optimal AI Processing Strategy</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '800px' }}>
            Welcome to <strong>UnDocumented</strong>. We scan your codebase to analyze how your application is making AI API calls. The engine automatically benchmarks your prompt templates across multiple LLM providers and data processing strategies to identify the fastest, cheapest, and highest-quality configuration tailored to your actual usage.
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => setActiveTab('scanner')}>
              <Search size={18} />
              <span>Choose Project to Scan</span>
            </button>
            <button 
              className="btn-primary" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }} 
              onClick={() => setActiveTab('studio')}
            >
              <Zap size={18} style={{ color: 'var(--warning)' }} />
              <span>Ignite Benchmark</span>
            </button>
          </div>
        </div>

        {/* Status & Stats cards */}
        <div className="stat-cards-grid">
          <div className="glass-panel stat-card">
            <div className="stat-header">
              <span>Active Target</span>
              <Search size={16} style={{ color: 'var(--cyber-cyan)' }} />
            </div>
            <div className="stat-value" style={{ fontSize: '1.2rem', fontFamily: 'var(--mono-font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '6px' }}>
              {repoPath ? repoPath.split('/').pop() : 'None Selected'}
            </div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              {repoPath ? repoPath : 'Navigate to Scanner to input path'}
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-header">
              <span>Audited Files</span>
              <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            </div>
            <div className="stat-value">{fileCount}</div>
            <div className="stat-change up">
              <span>{callsCount} LLM calls detected</span>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-header">
              <span>Benchmark Status</span>
              <Zap size={16} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>
              {benchmarkRan ? 'Completed' : 'Pending Run'}
            </div>
            <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
              {benchmarkRan ? 'Ready for recommendations' : 'Launch Studio to run audit'}
            </div>
          </div>
        </div>

        {/* Current Recommendation Card or Quick Info */}
        {benchmarkRan && bestRecommendation ? (
          <div className="glass-panel recommend-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('analytics')}>
            <div className="recommend-header">
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '8px' }}>SUGGESTED STRATEGY</span>
                <h3 className="recommend-title" style={{ color: '#fff' }}>{bestRecommendation.title}</h3>
              </div>
              <div className="savings-badge-glow">
                -{bestRecommendation.costReduction}% Cost
              </div>
            </div>
            <p className="recommend-desc">{bestRecommendation.description}</p>
            <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={18} style={{ color: 'var(--cyber-cyan)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPEEDUP</div>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{bestRecommendation.speedup}x Faster</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={18} style={{ color: 'var(--cyber-pink)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SAVINGS</div>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{bestRecommendation.monthlySavings}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QUALITY PARITY</div>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{bestRecommendation.qualityParity}%</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--primary)' }} />
              <span>Audit Pipeline Stages</span>
            </h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { title: '1. Source Audit', desc: 'Analyzes files for nested imports and model schemas.', color: 'var(--cyber-cyan)' },
                { title: '2. Prompt Sanitizer', desc: 'Parses token payloads and templates dynamically.', color: 'var(--primary)' },
                { title: '3. Parity Benchmarking', desc: 'Runs concurrent mock pipelines to evaluate semantic gap.', color: 'var(--warning)' },
                { title: '4. Optimization', desc: 'Identifies the optimal provider/strategy combination and outputs recommendations.', color: 'var(--success)' }
              ].map((stage, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel" 
                  style={{ 
                    flex: '1', 
                    minWidth: '200px', 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <h4 style={{ color: stage.color, fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>{stage.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
