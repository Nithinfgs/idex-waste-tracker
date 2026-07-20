import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, FileText, AlertTriangle } from 'lucide-react';

export default function LicenseViewer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="card" 
      style={{ 
        marginTop: '16px', 
        border: '1.5px solid var(--color-border)', 
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        overflow: 'hidden'
      }}
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: isOpen ? 'rgba(62, 107, 95, 0.06)' : '#FFFFFF',
          transition: 'background-color 150ms ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--color-primary)" />
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Software License & Legal Terms
            </h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
              SPDX: LicenseRef-Proprietary-Bloom-NithinSelvaraj-2026
            </span>
          </div>
        </div>

        <button 
          type="button"
          style={{ 
            fontSize: '0.72rem', 
            fontWeight: 700,
            padding: '4px 10px', 
            borderRadius: '8px', 
            backgroundColor: 'var(--color-primary)', 
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          {isOpen ? 'Close' : 'View License'}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isOpen && (
        <div 
          style={{ 
            padding: '14px', 
            borderTop: '1px solid var(--color-border)', 
            backgroundColor: '#FAFAFA',
            fontSize: '0.75rem',
            lineHeight: '1.45',
            color: 'var(--color-text-primary)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', padding: '8px 10px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div><strong>SPDX Identifier:</strong> <code style={{ color: 'var(--color-primary)', fontWeight: 700 }}>LicenseRef-Proprietary-Bloom-NithinSelvaraj-2026</code></div>
            <div><strong>Classification Code:</strong> <code>BLOOM-PNC-2026-v1.0</code></div>
            <div><strong>Copyright Tracking Ref:</strong> <code>CR-BLOOM-2026-TN-NITHIN</code></div>
            <div><strong>Sole Author & Owner:</strong> <strong>Nithin Selvaraj</strong></div>
          </div>

          <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px', marginBottom: '4px' }}>
            1. Permissive Non-Commercial Use
          </h5>
          <p style={{ marginBottom: '8px' }}>
            Permission is granted for any individual or educational institution to inspect, execute, and evaluate this platform for non-commercial educational and audit evaluation purposes.
          </p>

          <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px', marginBottom: '4px' }}>
            2. Anti-Plagiarism & Feature Protection
          </h5>
          <p style={{ marginBottom: '8px' }}>
            Direct copying, cloning, rebranding, or replicating similar features, technical implementations, or the unique combined workflow (school meal logging + predictive analytics + farmer GPS dispatch + compost buyer network + automated audit report generator) is strictly prohibited.
          </p>

          <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px', marginBottom: '4px' }}>
            3. Mandatory Submission Clause
          </h5>
          <p style={{ marginBottom: '8px' }}>
            Any rip-off, copy, or derivative version of this application <strong>CANNOT be submitted or presented in any competition, hackathon, or showcase on behalf of other people or teams WITHOUT Nithin Selvaraj being an active, named team member</strong> of that submission.
          </p>

          <div style={{ display: 'flex', gap: '8px', padding: '10px', backgroundColor: '#FFEBEE', borderRadius: '8px', border: '1px solid #FFCDD2', marginTop: '10px' }}>
            <AlertTriangle size={16} color="#C62828" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.68rem', color: '#C62828', margin: 0, fontWeight: 600 }}>
              Unauthorized submissions or feature plagiarism will trigger immediate competition disqualification filings, platform DMCA takedowns, and relevant legal actions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
