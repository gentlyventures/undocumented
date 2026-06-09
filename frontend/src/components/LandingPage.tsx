import React, { useState } from 'react';
import { 
  Activity, 
  Award, 
  Search, 
  Lock, 
  ArrowRight, 
  Cpu, 
  Server, 
  CheckCircle2
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface LandingPageProps {
  onLoginSuccess: (user: any) => void;
  apiOnline: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, apiOnline }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('judges-dft-2026@google.com');
  const [password, setPassword] = useState('bavl-agents-unleashed');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTrackInfo, setActiveTrackInfo] = useState<'track2' | 'track3'>('track2');

  const handlePortalAccess = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setShowLoginModal(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isRegistering) {
      try {
        const res = await fetch(getApiUrl('/api/auth/signup'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: username, password })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg('Registration successful! Your account is pending administrator approval.');
          setName('');
          // Switch back to login view but prefill email
          setIsRegistering(false);
        } else {
          setErrorMsg(data.detail || 'Signup failed. Please try again.');
        }
      } catch (err) {
        setErrorMsg('Network error. Is the FastAPI backend running?');
      }
    } else {
      try {
        const res = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: username, password })
        });
        const data = await res.json();
        if (res.ok) {
          setErrorMsg('');
          localStorage.setItem('ud_user', JSON.stringify(data.user));
          onLoginSuccess(data.user);
        } else {
          setErrorMsg(data.detail || 'Invalid email or password.');
        }
      } catch (err) {
        // Fallback for simulation mode when backend is offline
        if (!apiOnline && username === 'judges-dft-2026@google.com' && password === 'bavl-agents-unleashed') {
          const fakeJudge = {
            id: 1,
            email: 'judges-dft-2026@google.com',
            name: 'Challenge Judge (Offline)',
            role: 'judge',
            status: 'approved',
            token: 'simulated_judge_token'
          };
          localStorage.setItem('ud_user', JSON.stringify(fakeJudge));
          onLoginSuccess(fakeJudge);
        } else {
          setErrorMsg('Network error. Is the FastAPI backend running?');
        }
      }
    }
  };

  const bypassLogin = () => {
    const guestUser = {
      id: 0,
      email: 'guest@undocumented.dev',
      name: 'Challenge Guest',
      role: 'guest',
      status: 'approved',
      token: 'guest_session_token'
    };
    localStorage.setItem('ud_user', JSON.stringify(guestUser));
    onLoginSuccess(guestUser);
  };

  return (
    <div className="landing-page-container">
      
      {/* Decorative Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Header Bar */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, var(--primary), var(--warning))',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', boxShadow: '0 0 20px rgba(217, 119, 6, 0.25)'
            }}>UD</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>UnDocumented</span>
          </div>

          <div className="landing-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: apiOnline ? 'var(--success)' : 'var(--warning)' }} />
              <span>FastAPI Backend: {apiOnline ? 'Online' : 'Simulation Only'}</span>
            </div>
            <button 
              className="btn-primary" 
              onClick={handlePortalAccess}
              style={{
                padding: '8px 20px',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, var(--primary), var(--warning))',
                border: 'none',
                boxShadow: '0 0 15px rgba(217, 119, 6, 0.15)'
              }}
            >
              <Lock size={14} />
              <span>Judges Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <div className="landing-main-layout">
        
        {/* Hero Banner Section */}
        <section className="landing-hero" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: '40px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            borderRadius: '99px',
            padding: '6px 16px',
            fontSize: '0.8rem',
            color: 'var(--warning)',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            <Award size={14} />
            <span>GOOGLE FOR STARTUPS AI AGENTS CHALLENGE ENTRY</span>
          </div>

          <h1 className="gradient-title landing-title" style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: '1.15',
            letterSpacing: '-1px',
            margin: 0,
            maxWidth: '900px'
          }}>
            Optimize and Refactor Your LLM Calling Agents Autonomously
          </h1>

          <p className="landing-desc" style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            maxWidth: '780px',
            margin: 0
          }}>
            UnDocumented statically analyzes repository AST profiles, extracts prompt configurations, and runs multi-strategy benchmarking batteries to discover the optimal cost-speed trade-offs on Google Cloud.
          </p>

          <div className="landing-cta-container" style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button 
              className="btn-primary" 
              onClick={handlePortalAccess}
              style={{ padding: '14px 28px', fontSize: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--warning))' }}
            >
              <span>Enter Judges Portal</span>
              <ArrowRight size={18} />
            </button>
            <a 
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                fontSize: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                color: '#fff',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <span>Read Documentation</span>
            </a>
          </div>
        </section>

        {/* Feature Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)' }}>
              <Search size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>AST Code Scanning</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Static abstract syntax tree analyzer parsing python imports and client signatures. Discovers prompt structures, parameters, and variable templates automatically with zero execution overhead.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <Activity size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Multi-Strategy Benchmarker</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Evaluates codebases across 7 complex execution architectures: Async Concurrent, Stateful Caching, Hybrid Model Cascading, Context Pruning, and Dynamic Queue Batching.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>ADK Multi-Agent Loop</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Built using Google’s Agent Development Kit (ADK). Scanner, Benchmarker, and Optimizer agents exchange structured state files to complete the optimization loop autonomously.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <Server size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>FastMCP Interoperability</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Exposes repository scanner and benchmark tools as standard Model Context Protocol (MCP) utilities. Allows LLMs inside Cursor, Antigravity, or Claude Code to trigger optimizations natively.
            </p>
          </div>

        </section>

        {/* Track Alignment Details */}
        <section id="challenge-details" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 10px 0' }}>Challenge Track Alignment Matrix</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                UnDocumented was specifically engineered to address the core requirements of the optimization and enterprise readiness tracks.
              </p>
            </div>

            {/* Toggle Track Tabs */}
            <div className="landing-track-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button 
                onClick={() => setActiveTrackInfo('track2')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '99px',
                  border: activeTrackInfo === 'track2' ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: activeTrackInfo === 'track2' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(255,255,255,0.02)',
                  color: activeTrackInfo === 'track2' ? 'var(--warning)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Track 2: Optimize (Existing Agents)
              </button>
              <button 
                onClick={() => setActiveTrackInfo('track3')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '99px',
                  border: activeTrackInfo === 'track3' ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: activeTrackInfo === 'track3' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(255,255,255,0.02)',
                  color: activeTrackInfo === 'track3' ? 'var(--warning)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Track 3: Refactor (Enterprise Ready)
              </button>
            </div>

            {/* Track Info Display */}
            <div className="glass-panel" style={{ padding: '30px', margin: 0 }}>
              {activeTrackInfo === 'track2' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--warning)' }}>Applying Rigorous Engineering to Agent Sandboxes</h3>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>TRACK 2 OPTIMIZE</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    In production, LLM agents often fail under extreme variables (sudden demand pricing surges, rate limit exhaustions). UnDocumented evaluates agent templates under simulated or live load using **Agent Simulation** techniques, charting failures and cost metrics to help developers refactor systems before public launch.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Agent Simulation Testing</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Generates synthetic customer prompts to test rate limiters and token thresholds.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Agent Observability Traces</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Visualizes average latencies and semantic output gaps across 7 optimization strategies.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Agent Optimizer Rules</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Autonomously outputs refined configuration templates and Semaphore worker wraps.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--warning)' }}>Meeting Enterprise and Ecosystem Mandates</h3>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>TRACK 3 REFACTOR</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    UnDocumented migrated its legacy modules into a cloud-native runtime powered exclusively by Google Cloud and Google Gemini.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--cyber-cyan)' }}>B2B Focus</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Targeted at commercial developers and enterprise organizations executing multi-provider LLM integrations.</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--cyber-cyan)' }}>Cloud-Native Runtime</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Built for Google Cloud Run, supporting scale-to-zero configurations and dynamic GCS bucket mappings.</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--cyber-cyan)' }}>Gemini Intelligence</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Powered by Gemini 1.5 Pro (long-context code ingestion) and Gemini 1.5 Flash (high-throughput benchmarking).</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--cyber-cyan)' }}>A2A Interoperability</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>Exposes its capabilities via a standardized Model Context Protocol (MCP) server for cross-agent discovery.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p>© 2026 Gently Ventures & Bavl. Developed by bavl-unleashed-cto agent panel. Google for Startups AI Agents Challenge.</p>
        </div>
      </footer>

      {/* LOGIN/SIGNUP MODAL */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel auth-modal-panel" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '35px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            margin: 0
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <div style={{
                  width: '42px', height: '42px',
                  background: 'linear-gradient(135deg, var(--primary), var(--warning))',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', boxShadow: '0 0 20px rgba(217, 119, 6, 0.3)'
                }}>UD</div>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                {isRegistering ? 'Judges Registration' : 'Judges Portal Access'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {isRegistering 
                  ? 'Create a new account to access the agent workspace.' 
                  : 'Log in to inspect the UnDocumented codebase audit dashboard.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isRegistering && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FULL NAME</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--warning)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="name@example.com"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--warning)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PASSWORD</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--warning)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                />
              </div>

              {errorMsg && (
                <div style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.15)', borderRadius: '6px', padding: '10px 12px' }}>
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', padding: '10px 12px' }}>
                  {successMsg}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{
                  padding: '12px',
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, var(--primary), var(--warning))',
                  border: 'none',
                  marginTop: '8px',
                  justifyContent: 'center'
                }}
              >
                <span>{isRegistering ? 'Create Account' : 'Authorize & Enter Portal'}</span>
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <button 
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setIsRegistering(!isRegistering);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--warning)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                {isRegistering ? 'Back to Login' : 'Need an account? Sign Up'}
              </button>
              
              {!isRegistering && (
                <button 
                  onClick={bypassLogin}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    textAlign: 'center'
                  }}
                >
                  Quick Bypass (Authorize Guest Mode)
                </button>
              )}
              
              <button 
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

