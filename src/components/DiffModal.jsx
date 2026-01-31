import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import CodeMirrorDiff from './CodeMirrorDiff.jsx';

function DiffModal({ show, onHide, leftJson, rightJson, leftError, rightError }) {
  const { theme, diffModalWidthPercent, diffModalHeightPercent } = useTheme();

  if (!show) return null;

  // Calculate size based on percentages
  const width = Math.round(window.innerWidth * diffModalWidthPercent / 100);
  const height = Math.round(window.innerHeight * diffModalHeightPercent / 100);

  // Always center
  const left = Math.round((window.innerWidth - width) / 2);
  const top = Math.round((window.innerHeight - height) / 2);

  const contentHeight = Math.max(0, height - 46);

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        onClick={onHide}
      />

      {/* Modal */}
      <div
        className="position-fixed"
        style={{
          left,
          top,
          width,
          height,
          zIndex: 1055,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.background,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2"
          style={{
            backgroundColor: theme.surface,
            borderBottom: `1px solid ${theme.border}`,
            flexShrink: 0
          }}
        >
          <div className="d-flex align-items-center">
            <i className="bi bi-file-diff me-2" style={{ color: theme.primary }}></i>
            <span className="fw-semibold" style={{ color: theme.text }}>JSON Diff Comparison</span>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onHide}
            style={{ padding: '2px 8px' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <CodeMirrorDiff
            leftJson={leftJson}
            rightJson={rightJson}
            leftError={leftError}
            rightError={rightError}
            height={contentHeight}
          />
        </div>
      </div>
    </>
  );
}

export default DiffModal;
