'use client';

export default function DashboardPage() {
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>FinVox</h1>
      <p style={{ color: '#94a3b8' }}>System is online. Restoring full interface...</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
        <h2 style={{ fontSize: '18px' }}>Status</h2>
        <p style={{ color: '#22c55e' }}>Build successful. Deploying updates.</p>
      </div>
    </div>
  );
}
