import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

function JsonTreeView({ data, error }) {
  const { theme, editorTheme, fontSize } = useTheme();
  const [expandedPaths, setExpandedPaths] = useState(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = useCallback((path) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    const paths = new Set(['root']);
    const collectPaths = (obj, path) => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const newPath = `${path}.${key}`;
          paths.add(newPath);
          collectPaths(obj[key], newPath);
        });
      }
    };
    if (data) collectPaths(data, 'root');
    setExpandedPaths(paths);
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['root']));
  }, []);

  const getValueType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueColor = (type) => {
    switch (type) {
      case 'string': return editorTheme.syntax.string;
      case 'number': return editorTheme.syntax.number;
      case 'boolean': return editorTheme.syntax.boolean;
      case 'null': return editorTheme.syntax.null;
      default: return editorTheme.text;
    }
  };

  const matchesSearch = (key, value) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (key && key.toLowerCase().includes(term)) return true;
    if (typeof value === 'string' && value.toLowerCase().includes(term)) return true;
    if (typeof value === 'number' && value.toString().includes(term)) return true;
    return false;
  };

  const renderValue = (value, key, path, depth = 0) => {
    const type = getValueType(value);
    const isExpanded = expandedPaths.has(path);
    const isObject = type === 'object' || type === 'array';
    const itemCount = isObject ? Object.keys(value || {}).length : 0;
    const matches = matchesSearch(key, value);

    const highlightStyle = searchTerm && matches ? {
      backgroundColor: `${editorTheme.warning}40`,
      borderRadius: '3px',
      padding: '0 2px'
    } : {};

    return (
      <div key={path} style={{ marginLeft: depth * 16 }}>
        <div
          className="d-flex align-items-center py-1 tree-node"
          style={{ 
            cursor: isObject ? 'pointer' : 'default',
            fontSize: `${fontSize}px`,
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
          }}
          onClick={() => isObject && toggleExpand(path)}
        >
          {/* Expand/Collapse Icon */}
          <span style={{ width: '16px', color: editorTheme.textMuted }}>
            {isObject && itemCount > 0 && (
              <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            )}
          </span>

          {/* Type Icon */}
          <span className="me-1" style={{ color: editorTheme.primary }}>
            {type === 'object' && <i className="bi bi-braces"></i>}
            {type === 'array' && <i className="bi bi-brackets"></i>}
            {type === 'string' && <i className="bi bi-quote"></i>}
            {type === 'number' && <i className="bi bi-hash"></i>}
            {type === 'boolean' && <i className="bi bi-toggle-on"></i>}
            {type === 'null' && <i className="bi bi-dash-circle"></i>}
          </span>

          {/* Key */}
          {key !== null && (
            <>
              <span style={{ color: editorTheme.syntax.key, ...highlightStyle }}>
                "{key}"
              </span>
              <span style={{ color: editorTheme.textMuted, margin: '0 4px' }}>:</span>
            </>
          )}

          {/* Value or Summary */}
          {isObject ? (
            <span style={{ color: editorTheme.textMuted }}>
              {type === 'array' ? `Array[${itemCount}]` : `Object{${itemCount}}`}
            </span>
          ) : (
            <span style={{ color: getValueColor(type), ...highlightStyle }}>
              {type === 'string' ? `"${value}"` : String(value)}
            </span>
          )}
        </div>

        {/* Children */}
        {isObject && isExpanded && value && (
          <div>
            {Object.entries(value).map(([k, v], idx) => (
              renderValue(v, type === 'array' ? idx : k, `${path}.${k}`, depth + 1)
            ))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: editorTheme.editorBg }}>
        <div className="text-center text-danger">
          <i className="bi bi-exclamation-triangle-fill display-4 mb-3 d-block"></i>
          <p>Invalid JSON - Cannot display tree view</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: editorTheme.editorBg }}>
        <div className="text-center text-muted">
          <i className="bi bi-diagram-3 display-4 mb-3 d-block"></i>
          <p>Enter valid JSON to see tree view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100" style={{ backgroundColor: editorTheme.editorBg }}>
      {/* Tree View Toolbar */}
      <div className="d-flex gap-2 p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <div className="input-group input-group-sm" style={{ maxWidth: '200px' }}>
          <span className="input-group-text" style={{ backgroundColor: editorTheme.editorBg, borderColor: theme.border, color: theme.textMuted }}>
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: editorTheme.editorBg, color: editorTheme.text, borderColor: theme.border }}
          />
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={expandAll}>
          <i className="bi bi-arrows-expand me-1"></i>
          Expand All
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={collapseAll}>
          <i className="bi bi-arrows-collapse me-1"></i>
          Collapse All
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-grow-1 overflow-auto p-2">
        {renderValue(data, null, 'root', 0)}
      </div>
    </div>
  );
}

export default JsonTreeView;
