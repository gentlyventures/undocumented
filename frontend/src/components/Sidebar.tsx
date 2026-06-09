import React from 'react';
import { 
  Activity, 
  Search, 
  Zap, 
  BarChart3, 
  Award,
  Settings,
  LogOut,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  apiOnline: boolean;
  userRole?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  apiOnline,
  userRole,
  onLogout
}) => {
  
  const groups = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'overview', name: 'Overview', desc: 'Dashboard & status overview', icon: Activity }
      ]
    },
    {
      title: 'UNIFIED ORCHESTRATION',
      items: [
        { id: 'scanner', name: 'Repository Scanner', desc: 'Flagship End-to-End Engine (All-in-One)', icon: Search }
      ]
    },
    {
      title: 'ISOLATED PLAYGROUNDS',
      items: [
        { id: 'studio', name: 'Benchmark Studio', desc: 'Manual prompt runner sandbox', icon: Zap },
        { id: 'analytics', name: 'Performance Analytics', desc: 'Interactive charts sandbox', icon: BarChart3 }
      ]
    },
    {
      title: 'SUBMISSION',
      items: [
        { id: 'devpost', name: 'Devpost Hub', desc: 'Official hackathon materials', icon: Award }
      ]
    }
  ];

  if (userRole === 'admin') {
    groups.push({
      title: 'ADMINISTRATION',
      items: [
        { id: 'admin', name: 'Admin Center', desc: 'Manage users and platform telemetry', icon: Settings }
      ]
    });
  }

  return (
    <div className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">UD</div>
        <div className="logo-text">UnDocumented</div>
      </div>

      <nav className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {groups.map((group) => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ 
              fontSize: '0.65rem', 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              letterSpacing: '1.5px', 
              paddingLeft: '16px',
              marginBottom: '2px'
            }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0, color: isActive ? 'var(--warning)' : 'inherit' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-secondary)' }}>{item.name}</span>
                      <span style={{ fontSize: '0.68rem', color: isActive ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)', fontWeight: 400 }}>{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <BookOpen size={14} />
            <span>Public Documentation</span>
          </a>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f87171',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}
          
          <div className="system-status">
            <div className={`status-dot ${apiOnline ? '' : 'loading'}`} />
            <span>FastAPI: {apiOnline ? 'Online (8000)' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

