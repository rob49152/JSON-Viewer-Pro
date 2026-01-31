import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

function JsonDiff({ leftJson, rightJson, leftError, rightError }) {
  const { theme, editorTheme, fontSize } = useTheme();

  const diffResult = useMemo(() => {
    if (leftError || rightError) {
      return { error: true, message: 'Both sides must contain valid JSON to compare' };
    }

    if (!leftJson.trim() || !rightJson.trim()) {
      return { error: true, message: 'Enter JSON in both panels to compare' };
    }

    try {
      const leftObj = JSON.parse(leftJson);
      const rightObj = JSON.parse(rightJson);
      
      const leftLines = JSON.stringify(leftObj, null, 2).split('\n');
      const rightLines = JSON.stringify(rightObj, null, 2).split('\n');
      
      // Simple line-by-line diff
      const maxLines = Math.max(leftLines.length, rightLines.length);
      const diffLines = [];
      
      for (let i = 0; i < maxLines; i++) {
        const leftLine = leftLines[i] || '';
        const rightLine = rightLines[i] || '';
        
        if (leftLine === rightLine) {
          diffLines.push({ type: 'same', left: leftLine, right: rightLine, lineNum: i + 1 });
        } else if (!leftLine && rightLine) {
          diffLines.push({ type: 'added', left: '', right: rightLine, lineNum: i + 1 });
        } else if (leftLine && !rightLine) {
          diffLines.push({ type: 'removed', left: leftLine, right: '', lineNum: i + 1 });
        } else {
          diffLines.push({ type: 'modified', left: leftLine, right: rightLine, lineNum: i + 1 });
        }
      }
      
      // Calculate statistics
      const stats = {
        same: diffLines.filter(d => d.type === 'same').length,
        added: diffLines.filter(d => d.type === 'added').length,
        removed: diffLines.filter(d => d.type === 'removed').length,
        modified: diffLines.filter(d => d.type === 'modified').length
      };
      
      const isIdentical = stats.added === 0 && stats.removed === 0 && stats.modified === 0;
      
      return { error: false, diffLines, stats, isIdentical };
    } catch (e) {
      return { error: true, message: e.message };
    }
  }, [leftJson, rightJson, leftError, rightError]);

  const getLineStyle = (type) => {
    switch (type) {
      case 'added':
        return { backgroundColor: `${editorTheme.success}30`, borderLeft: `3px solid ${editorTheme.success}` };
      case 'removed':
        return { backgroundColor: `${editorTheme.danger}30`, borderLeft: `3px solid ${editorTheme.danger}` };
      case 'modified':
        return { backgroundColor: `${editorTheme.warning}30`, borderLeft: `3px solid ${editorTheme.warning}` };
      default:
        return { borderLeft: `3px solid transparent` };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'added': return <i className="bi bi-plus-circle-fill" style={{ color: editorTheme.success }}></i>;
      case 'removed': return <i className="bi bi-dash-circle-fill" style={{ color: editorTheme.danger }}></i>;
      case 'modified': return <i className="bi bi-pencil-fill" style={{ color: editorTheme.warning }}></i>;
      default: return <i className="bi bi-circle" style={{ color: editorTheme.textMuted }}></i>;
    }
  };

  if (diffResult.error) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: editorTheme.editorBg }}>
        <div className="text-center text-muted">
          <i className="bi bi-file-diff display-4 mb-3 d-block"></i>
          <p>{diffResult.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100" style={{ backgroundColor: editorTheme.editorBg }}>
      {/* Diff Stats Header */}
      <div className="d-flex gap-3 p-2 border-bottom align-items-center" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        {diffResult.isIdentical ? (
          <span className="badge bg-success">
            <i className="bi bi-check-circle-fill me-1"></i>
            Identical
          </span>
        ) : (
          <>
            <span className="badge" style={{ backgroundColor: editorTheme.success }}>
              <i className="bi bi-plus-circle me-1"></i>
              {diffResult.stats.added} Added
            </span>
            <span className="badge" style={{ backgroundColor: editorTheme.danger }}>
              <i className="bi bi-dash-circle me-1"></i>
              {diffResult.stats.removed} Removed
            </span>
            <span className="badge" style={{ backgroundColor: editorTheme.warning, color: '#000' }}>
              <i className="bi bi-pencil me-1"></i>
              {diffResult.stats.modified} Modified
            </span>
            <span className="badge bg-secondary">
              <i className="bi bi-circle me-1"></i>
              {diffResult.stats.same} Same
            </span>
          </>
        )}
      </div>

      {/* Diff Content */}
      <div className="flex-grow-1 overflow-auto">
        <div className="d-flex" style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", fontSize: `${fontSize}px` }}>
          {/* Left Side */}
          <div className="flex-grow-1" style={{ borderRight: `1px solid ${editorTheme.border}` }}>
            <div className="p-2 border-bottom text-center small fw-bold" style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.primary }}>
              Left Panel
            </div>
            {diffResult.diffLines.map((line, idx) => (
              <div
                key={`left-${idx}`}
                className="d-flex"
                style={{
                  ...getLineStyle(line.type === 'added' ? 'same' : line.type),
                  minHeight: '24px',
                  lineHeight: '24px'
                }}
              >
                <span 
                  className="text-end px-2 user-select-none"
                  style={{ 
                    minWidth: '40px', 
                    color: editorTheme.lineNumbers,
                    backgroundColor: editorTheme.editorBg,
                    borderRight: `1px solid ${editorTheme.border}`
                  }}
                >
                  {line.lineNum}
                </span>
                <span className="px-1" style={{ minWidth: '20px' }}>
                  {line.type !== 'added' && getTypeIcon(line.type)}
                </span>
                <pre className="m-0 flex-grow-1 px-1" style={{ color: editorTheme.editorText, whiteSpace: 'pre-wrap' }}>
                  {line.left}
                </pre>
              </div>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex-grow-1">
            <div className="p-2 border-bottom text-center small fw-bold" style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.primary }}>
              Right Panel
            </div>
            {diffResult.diffLines.map((line, idx) => (
              <div
                key={`right-${idx}`}
                className="d-flex"
                style={{
                  ...getLineStyle(line.type === 'removed' ? 'same' : line.type),
                  minHeight: '24px',
                  lineHeight: '24px'
                }}
              >
                <span 
                  className="text-end px-2 user-select-none"
                  style={{ 
                    minWidth: '40px', 
                    color: editorTheme.lineNumbers,
                    backgroundColor: editorTheme.editorBg,
                    borderRight: `1px solid ${editorTheme.border}`
                  }}
                >
                  {line.lineNum}
                </span>
                <span className="px-1" style={{ minWidth: '20px' }}>
                  {line.type !== 'removed' && getTypeIcon(line.type)}
                </span>
                <pre className="m-0 flex-grow-1 px-1" style={{ color: editorTheme.editorText, whiteSpace: 'pre-wrap' }}>
                  {line.right}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JsonDiff;
