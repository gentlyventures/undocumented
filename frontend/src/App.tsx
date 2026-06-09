import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Overview } from './components/Overview';
import { Scanner } from './components/Scanner';
import { Studio } from './components/Studio';
import { Analytics } from './components/Analytics';
import { Devpost } from './components/Devpost';
import { LandingPage } from './components/LandingPage';
import { AdminCenter } from './components/AdminCenter';
import { getApiUrl } from './utils/api';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [repoPath, setRepoPath] = useState<string>('.');
  const [scanResults, setScanResults] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      // 0. Check URL query parameters for secure judge bypass token
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token === 'google-challenge-judge-bypass-2026') {
        const bypassJudge = {
          id: 777,
          email: 'google-challenge-judge@devpost.com',
          name: 'Challenge Judge (Secure Bypass)',
          role: 'judge',
          status: 'approved',
          token: 'secure_bypass_judge_token'
        };
        localStorage.setItem('ud_user', JSON.stringify(bypassJudge));
        setCurrentUser(bypassJudge);
        
        // Clean URL to hide token from address bar
        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
        return;
      }

      // 1. First check local storage session
      const stored = localStorage.getItem('ud_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
          return;
        } catch (e) {
          localStorage.removeItem('ud_user');
        }
      }

      // 2. Check Cloudflare Access session (via our cf-session endpoint)
      try {
        const res = await fetch(getApiUrl('/api/auth/cf-session'));
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.user) {
            localStorage.setItem('ud_user', JSON.stringify(data.user));
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Cloudflare session:', err);
      }
    };
    checkSession();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ud_user');
    setActiveTab('overview');
  };
  
  // Benchmarking states
  const [benchmarkRan, setBenchmarkRan] = useState<boolean>(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const [bestRecommendation, setBestRecommendation] = useState<any>(null);

  // Connection & Demo states
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(getApiUrl('/api/health'), { method: 'GET' });
        if (res.ok) {
          setApiOnline(true);
          setDemoMode(false); // Disable demo if API is online
        } else {
          setApiOnline(false);
        }
      } catch {
        setApiOnline(false);
        // Retain demoMode as true
      }
    };
    checkHealth();
  }, []);

  const handleBenchmarkComplete = (results: any[], shouldNavigate = true) => {
    setBenchmarkResults(results);
    setBenchmarkRan(true);

    // Dynamic Best Recommendation Calculation
    const baseline = results.find(r => r.strategy === 'Sequential' || r.name.toLowerCase().includes('baseline')) || {
      name: 'Baseline (GPT-4o Seq)',
      latency: 2450,
      cost: 0.180,
      parity: 100.0,
      strategy: 'Sequential',
      provider: 'OpenAI'
    };

    const optimizedOnly = results.filter(r => r.strategy !== 'Sequential' && !r.name.toLowerCase().includes('baseline'));
    
    if (optimizedOnly.length > 0) {
      // Find the winner (highest combined improvement score: Speedup * Savings * Parity)
      const winner = optimizedOnly.reduce((best, curr) => {
        const bestSpeedup = Math.max(1, baseline.latency / (best.latency || 1));
        const bestSavings = Math.max(0.01, (baseline.cost - best.cost) / (baseline.cost || 0.001));
        const bestScore = bestSpeedup * bestSavings * ((best.parity || 80) / 100);

        const currSpeedup = Math.max(1, baseline.latency / (curr.latency || 1));
        const currSavings = Math.max(0.01, (baseline.cost - curr.cost) / (baseline.cost || 0.001));
        const currScore = currSpeedup * currSavings * ((curr.parity || 80) / 100);

        return currScore > bestScore ? curr : best;
      }, optimizedOnly[0]);

      const speedup = (baseline.latency / (winner.latency || 1)).toFixed(1);
      const costReduction = Math.round(((baseline.cost - winner.cost) / (baseline.cost || 0.001)) * 100);
      const cleanWinnerModelName = winner.name.replace(/\([^)]*\)/g, '').trim();

      // Estimate monthly savings based on 1M requests (cost is per 1K requests in the model data)
      const baselineTotalCost = baseline.cost * 1000;
      const winnerTotalCost = winner.cost * 1000;
      const savingsVal = Math.max(0, baselineTotalCost - winnerTotalCost);
      const monthlySavings = `$${savingsVal.toFixed(2)} / 1M requests`;

      setBestRecommendation({
        title: `Replace ${baseline.provider} Sequential with ${cleanWinnerModelName} on ${winner.strategy}`,
        description: `We recommend replacing your current sequential ${baseline.provider} calls with a ${winner.strategy.toLowerCase()} using ${cleanWinnerModelName}. This setup unlocks a ${speedup}x speedup and ${costReduction}% cost reduction while maintaining ${winner.parity}% semantic quality parity.`,
        costReduction: costReduction,
        speedup: parseFloat(speedup),
        monthlySavings: monthlySavings,
        qualityParity: winner.parity
      });
    } else {
      setBestRecommendation({
        title: "Migrate to Parallelized LLM Worker Pool",
        description: "Your sequential LLM calls can be compressed and parallelized. We recommend adopting a distributed pool strategy to achieve a 10x+ latency drop.",
        costReduction: 75,
        speedup: 10,
        monthlySavings: "$110.00 / 1M requests",
        qualityParity: 97.5
      });
    }
    
    // Auto-navigate to analytics tab once complete if requested
    if (shouldNavigate) {
      setActiveTab('analytics');
    }
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Overview Dashboard', subtitle: 'UnDocumented project auditor & metrics' };
      case 'scanner':
        return { title: 'Repository Scanner', subtitle: 'Audit files and extract LLM calls statically' };
      case 'studio':
        return { title: 'Benchmark Studio', subtitle: 'Configure, run, and watch active optimization pipelines' };
      case 'analytics':
        return { title: 'Performance Analytics', subtitle: 'Compare latency, cost, and semantic parity matrices' };
      case 'devpost':
        return { title: 'Devpost Hub', subtitle: 'Submission details, inspiration, and building processes' };
      case 'admin':
        return { title: 'Admin Center', subtitle: 'Manage registered users and system telemetry' };
      default:
        return { title: 'Dashboard', subtitle: 'UnDocumented' };
    }
  };

  const header = getHeaderInfo();

  if (!currentUser) {
    return <LandingPage onLoginSuccess={(user) => setCurrentUser(user)} apiOnline={apiOnline} />;
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Shell */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        apiOnline={apiOnline}
        userRole={currentUser?.role}
        onLogout={handleLogout}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border-light)' }}>
          <div className="page-title">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{header.title}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{header.subtitle}</p>
          </div>
          
          {/* Descriptive Top-Right Telemetry Selector */}
          <div className="glass-panel" style={{ 
            padding: '6px 14px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            margin: 0,
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right', minWidth: '150px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: demoMode ? 'var(--primary)' : 'var(--success)' }}>
                {demoMode ? 'Simulation Sandbox Active' : 'Live API Telemetry Active'}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {demoMode ? 'Keyless mock execution' : 'Active endpoint connections'}
              </span>
            </div>
            
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }} title="Toggle between simulated sandbox and live API calls">
              <input 
                type="checkbox" 
                checked={!demoMode} 
                onChange={(e) => setDemoMode(!e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: !demoMode ? 'var(--success)' : '#2e303a',
                transition: '.4s',
                borderRadius: '34px',
                boxShadow: !demoMode ? '0 0 8px rgba(16, 185, 129, 0.25)' : 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '16px', width: '16px',
                  left: !demoMode ? '18px' : '4px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </header>

        {/* Tab view controller */}
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <Overview 
            repoPath={repoPath}
            scanResults={scanResults}
            setActiveTab={setActiveTab}
            benchmarkRan={benchmarkRan}
            bestRecommendation={bestRecommendation}
          />
        </div>

        <div style={{ display: activeTab === 'scanner' ? 'block' : 'none' }}>
          <Scanner 
            repoPath={repoPath}
            setRepoPath={setRepoPath}
            scanResults={scanResults}
            setScanResults={setScanResults}
            apiOnline={apiOnline}
            demoMode={demoMode}
            onBenchmarkComplete={handleBenchmarkComplete}
          />
        </div>

        <div style={{ display: activeTab === 'studio' ? 'block' : 'none' }}>
          <Studio 
            apiOnline={apiOnline}
            demoMode={demoMode}
            scanResults={scanResults}
            onBenchmarkComplete={handleBenchmarkComplete}
          />
        </div>

        <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
          <Analytics 
            benchmarkResults={benchmarkResults}
            bestRecommendation={bestRecommendation}
          />
        </div>

        <div style={{ display: activeTab === 'devpost' ? 'block' : 'none' }}>
          <Devpost />
        </div>

        <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
          <AdminCenter apiOnline={apiOnline} />
        </div>

      </main>

    </div>
  );
}

export default App;
