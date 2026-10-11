import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Aside caught error in component tree:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          maxWidth: '650px',
          margin: '3rem auto',
          background: 'rgba(23, 26, 35, 0.95)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
              Aside Protected View
            </h2>
          </div>
          <p style={{ color: '#9ca3af', lineHeight: 1.6, fontSize: '0.95rem' }}>
            An unexpected error occurred in this view, but your meeting notes, custom inputs, and companion settings are completely safe!
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            color: '#f87171',
            marginBottom: '1.5rem',
            overflowX: 'auto'
          }}>
            {String(this.state.error?.message || this.state.error || "Component render error")}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              background: '#df6951',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCcw size={15} />
            <span>Restore Meeting Screen</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
