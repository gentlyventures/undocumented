import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Check, 
  Trash2, 
  UserPlus, 
  Edit, 
  Cpu, 
  HardDrive, 
  Database, 
  RefreshCw, 
  AlertTriangle,
  X,
  XCircle,
  Clock
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

interface TelemetryData {
  cpu_utilization: number;
  memory_utilization: number;
  active_gcs_bucket: string;
  db_connection: string;
  total_users: number;
  total_benchmark_runs: number;
  python_version: string;
  os_platform: string;
}

interface AdminCenterProps {
  apiOnline: boolean;
}

export const AdminCenter: React.FC<AdminCenterProps> = ({ apiOnline }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'telemetry'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create User Modal/Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newStatus, setNewStatus] = useState('approved');
  const [createError, setCreateError] = useState('');

  // Edit User Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editError, setEditError] = useState('');

  const fetchUsers = async () => {
    if (!apiOnline) {
      // Offline mock users
      setUsers([
        { id: 1, email: 'judges-dft-2026@google.com', name: 'Challenge Judge', role: 'judge', status: 'approved', created_at: '2026-06-05 10:00:00' },
        { id: 2, email: 'admin@undocumented.dev', name: 'Administrator', role: 'admin', status: 'approved', created_at: '2026-06-05 10:00:00' },
        { id: 3, email: 'pending-signup@gently.ventures', name: 'Pending Partner', role: 'user', status: 'pending', created_at: '2026-06-05 12:30:15' }
      ]);
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/admin/users'));
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        setError(data.detail || 'Failed to fetch users.');
      }
    } catch (err) {
      setError('Failed to contact backend API.');
    }
  };

  const fetchTelemetry = async () => {
    if (!apiOnline) {
      // Offline mock telemetry
      setTelemetry({
        cpu_utilization: 4.8,
        memory_utilization: 38.6,
        active_gcs_bucket: 'undocumented-persistent-vault-2026 (Simulation)',
        db_connection: 'sqlite3 // benchmark_history.db (Simulation Offline)',
        total_users: 3,
        total_benchmark_runs: 12,
        python_version: '3.12.3',
        os_platform: 'Darwin'
      });
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/admin/telemetry'));
      const data = await res.json();
      if (res.ok) {
        setTelemetry(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry data', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchUsers();
      await fetchTelemetry();
      setLoading(false);
    };
    initData();
  }, [apiOnline]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!apiOnline) {
      const newUserObj: User = {
        id: users.length + 1,
        email: newEmail,
        name: newName,
        role: newRole,
        status: newStatus,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      setUsers([...users, newUserObj]);
      setShowCreateModal(false);
      resetCreateForm();
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole,
          status: newStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        resetCreateForm();
        fetchUsers();
        fetchTelemetry();
      } else {
        setCreateError(data.detail || 'Failed to create user.');
      }
    } catch (err) {
      setCreateError('Network error connecting to API.');
    }
  };

  const resetCreateForm = () => {
    setNewEmail('');
    setNewName('');
    setNewPassword('');
    setNewRole('user');
    setNewStatus('approved');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');

    if (!apiOnline) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: editName, role: editRole, status: editStatus } : u));
      setEditingUser(null);
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${editingUser.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          status: editStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        setEditError(data.detail || 'Failed to update user.');
      }
    } catch (err) {
      setEditError('Network error connecting to API.');
    }
  };

  const handleStatusChange = async (userId: number, currentStatus: string, newStatus: string) => {
    console.log(`Updating user status: ${currentStatus} -> ${newStatus}`);
    if (!apiOnline) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    if (!apiOnline) {
      setUsers(users.filter(u => u.id !== userId));
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
        fetchTelemetry();
      } else {
        alert(data.detail || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Network error deleting user.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontWeight: 600 }}>
            <Check size={12} />
            <span>Approved</span>
          </span>
        );
      case 'suspended':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>
            <XCircle size={12} />
            <span>Suspended</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'var(--warning)', fontWeight: 600 }}>
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditError('');
  };

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'users' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            border: activeTab === 'users' ? '1px solid var(--border-light)' : 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Users size={16} />
          <span>User Management</span>
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'telemetry' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            border: activeTab === 'telemetry' ? '1px solid var(--border-light)' : 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: activeTab === 'telemetry' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Settings size={16} />
          <span>System Telemetry</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <RefreshCw className="animate-spin" size={24} />
          <span style={{ marginLeft: '10px' }}>Loading administrator console...</span>
        </div>
      ) : activeTab === 'users' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Registered User Directory</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Approve pending registrations, update accounts details, or revoke workspace access.
              </p>
            </div>
            <button
              onClick={() => { setCreateError(''); setShowCreateModal(true); }}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--warning))',
                border: 'none',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <UserPlus size={16} />
              <span>Create User</span>
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', padding: '12px 16px' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}

          {/* User List Panel */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>NAME</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>EMAIL</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>ROLE</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>STATUS</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>CREATED</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found in database.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{u.name}</td>
                        <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>{getStatusBadge(u.status)}</td>
                        <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.created_at}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {u.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(u.id, u.status, 'approved')}
                                title="Approve Registration"
                                style={{ background: 'rgba(16, 185, 129, 0.15)', border: 'none', color: 'var(--success)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <Check size={14} />
                              </button>
                            )}
                            
                            {u.status === 'approved' && u.role !== 'admin' && (
                              <button
                                onClick={() => handleStatusChange(u.id, u.status, 'suspended')}
                                title="Suspend Account"
                                style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <XCircle size={14} />
                              </button>
                            )}

                            {u.status === 'suspended' && (
                              <button
                                onClick={() => handleStatusChange(u.id, u.status, 'approved')}
                                title="Approve/Reactivate Account"
                                style={{ background: 'rgba(16, 185, 129, 0.15)', border: 'none', color: 'var(--success)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <Check size={14} />
                              </button>
                            )}

                            <button
                              onClick={() => startEdit(u)}
                              title="Edit User"
                              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              title="Delete User"
                              style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Telemetry Tab View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>System Metrics & Telemetry</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Real-time monitoring of resource allocation, database query bounds, and environment targets.
              </p>
            </div>
            <button
              onClick={fetchTelemetry}
              className="btn-copy"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {telemetry ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Utilization Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* CPU Card */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', margin: 0 }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)' }}>
                    <Cpu size={20} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CPU UTILIZATION</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{telemetry.cpu_utilization}%</span>
                    
                    {/* Utilization Bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ width: `${telemetry.cpu_utilization}%`, height: '100%', background: 'var(--cyber-cyan)', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                {/* RAM Card */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', margin: 0 }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <HardDrive size={20} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>VIRTUAL MEMORY</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{telemetry.memory_utilization}%</span>
                    
                    {/* Utilization Bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ width: `${telemetry.memory_utilization}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                {/* DB connection Card */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', margin: 0 }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                    <Database size={20} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>DATABASE PROFILE</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: '4px', wordBreak: 'break-all' }}>{telemetry.db_connection}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: Active (Online)</span>
                  </div>
                </div>

              </div>

              {/* Server Info Details Panel */}
              <div className="glass-panel" style={{ padding: '28px', margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Runtime Details</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ACTIVE GCS BUCKET</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{telemetry.active_gcs_bucket}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PYTHON BINARY TARGET</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>v{telemetry.python_version}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7errem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OS HOSTING ENVIRONMENT</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{telemetry.os_platform}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TOTAL BENCHMARK RUNS</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)' }}>{telemetry.total_benchmark_runs} runs</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>No telemetry diagnostics loaded.</div>
          )}
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '20px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Create Database User</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FULL NAME</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Judicial Analyst" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="analyst@google.com" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PASSWORD</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ROLE</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="user">User</option>
                    <option value="judge">Judge</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest (Read Only)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STATUS</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {createError && (
                <div style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.15)', borderRadius: '6px', padding: '8px 12px' }}>
                  {createError}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--primary), var(--warning))', border: 'none', justifyContent: 'center', marginTop: '10px' }}>
                <span>Create User</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '20px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Edit User: {editingUser.email}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FULL NAME</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ROLE</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="user">User</option>
                  <option value="judge">Judge</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest (Read Only)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STATUS</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {editError && (
                <div style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.15)', borderRadius: '6px', padding: '8px 12px' }}>
                  {editError}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--primary), var(--warning))', border: 'none', justifyContent: 'center', marginTop: '10px' }}>
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
