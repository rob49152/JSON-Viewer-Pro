import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import CodeMirrorEditor from './CodeMirrorEditor.jsx';
import Tooltip from './Tooltip.jsx';

function ApiTester() {
  const { theme, editorTheme, indentSize } = useTheme();

  // Request state
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }]);
  const [requestBody, setRequestBody] = useState('');
  const [contentType, setContentType] = useState('application/json');

  // Response state
  const [response, setResponse] = useState(null);
  const [responseBody, setResponseBody] = useState('');
  const [responseHeaders, setResponseHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Performance metrics
  const [metrics, setMetrics] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [showHeaders, setShowHeaders] = useState(false);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const toggleHeader = (index) => {
    const newHeaders = [...headers];
    newHeaders[index].enabled = !newHeaders[index].enabled;
    setHeaders(newHeaders);
  };

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setResponseBody('');
    setResponseHeaders([]);
    setMetrics(null);

    const startTime = performance.now();
    let fetchStartTime, responseStartTime, responseEndTime;

    try {
      // Build headers object
      const headerObj = {};
      headers.forEach(h => {
        if (h.enabled && h.key.trim()) {
          headerObj[h.key.trim()] = h.value;
        }
      });

      // Add content-type for requests with body
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
        headerObj['Content-Type'] = contentType;
      }

      const options = {
        method,
        headers: headerObj,
        mode: 'cors'
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
        options.body = requestBody;
      }

      fetchStartTime = performance.now();
      const res = await fetch(url, options);
      responseStartTime = performance.now();

      // Get response headers
      const resHeaders = [];
      res.headers.forEach((value, key) => {
        resHeaders.push({ key, value });
      });
      setResponseHeaders(resHeaders);

      // Get response body
      const contentTypeHeader = res.headers.get('content-type') || '';
      let bodyText = await res.text();
      responseEndTime = performance.now();

      // Try to format JSON
      if (contentTypeHeader.includes('application/json') && bodyText) {
        try {
          const parsed = JSON.parse(bodyText);
          bodyText = JSON.stringify(parsed, null, indentSize);
        } catch {
          // Keep as-is if not valid JSON
        }
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });
      setResponseBody(bodyText);

      // Calculate metrics
      const totalTime = responseEndTime - startTime;
      const fetchTime = responseStartTime - fetchStartTime;
      const downloadTime = responseEndTime - responseStartTime;

      setMetrics({
        totalTime: totalTime.toFixed(2),
        fetchTime: fetchTime.toFixed(2),
        downloadTime: downloadTime.toFixed(2),
        size: new Blob([bodyText]).size,
        headersCount: resHeaders.length
      });

      // Add to history
      setHistory(prev => [{
        url,
        method,
        status: res.status,
        time: totalTime.toFixed(0),
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);

    } catch (err) {
      const endTime = performance.now();
      setError(err.message || 'Request failed');
      setMetrics({
        totalTime: (endTime - startTime).toFixed(2),
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, method, headers, requestBody, contentType, indentSize]);

  const loadFromHistory = (item) => {
    setUrl(item.url);
    setMethod(item.method);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(responseBody);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getMethodColor = (m) => {
    switch (m) {
      case 'GET': return '#28a745';
      case 'POST': return '#007bff';
      case 'PUT': return '#ffc107';
      case 'PATCH': return '#17a2b8';
      case 'DELETE': return '#dc3545';
      default: return theme.textMuted;
    }
  };

  return (
    <div className="d-flex" style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Left Panel - Request Builder */}
      <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="p-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-send me-2" style={{ color: theme.primary }}></i>
            <span className="fw-semibold">Request Builder</span>
          </div>
        </div>

        {/* URL Bar */}
        <div className="p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="input-group input-group-sm">
            <select
              className="form-select"
              style={{
                maxWidth: '100px',
                backgroundColor: editorTheme.editorBg,
                color: getMethodColor(method),
                borderColor: theme.border,
                fontWeight: 'bold'
              }}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              className="form-control"
              placeholder="Enter URL (e.g., https://api.example.com/data)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
              style={{
                backgroundColor: editorTheme.editorBg,
                color: editorTheme.editorText,
                borderColor: theme.border
              }}
            />
            <button
              className="btn btn-primary"
              onClick={sendRequest}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <><i className="bi bi-send-fill me-1"></i>Send</>
              )}
            </button>
          </div>
        </div>

        {/* Headers Section */}
        <div className="p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="small fw-semibold">
              <i className="bi bi-list-ul me-1"></i>
              Headers
            </span>
            <button className="btn btn-outline-success btn-sm" onClick={addHeader}>
              <i className="bi bi-plus"></i>
            </button>
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {headers.map((header, idx) => (
              <div key={idx} className="d-flex gap-1 mb-1 align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={header.enabled}
                  onChange={() => toggleHeader(idx)}
                />
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: editorTheme.editorBg,
                    color: editorTheme.editorText,
                    borderColor: theme.border,
                    opacity: header.enabled ? 1 : 0.5
                  }}
                />
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                  style={{
                    flex: 2,
                    backgroundColor: editorTheme.editorBg,
                    color: editorTheme.editorText,
                    borderColor: theme.border,
                    opacity: header.enabled ? 1 : 0.5
                  }}
                />
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeHeader(idx)}
                  disabled={headers.length === 1}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content Type (for POST/PUT/PATCH) */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-semibold">Content-Type:</span>
              <select
                className="form-select form-select-sm"
                style={{
                  width: 'auto',
                  backgroundColor: editorTheme.editorBg,
                  color: editorTheme.editorText,
                  borderColor: theme.border
                }}
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="application/json">application/json</option>
                <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                <option value="text/plain">text/plain</option>
                <option value="text/xml">text/xml</option>
              </select>
            </div>
          </div>
        )}

        {/* Request Body (for POST/PUT/PATCH) */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
            <div className="px-2 py-1" style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
              <span className="small fw-semibold">
                <i className="bi bi-code-slash me-1"></i>
                Request Body
              </span>
            </div>
            <div className="flex-grow-1" style={{ minHeight: 0 }}>
              <CodeMirrorEditor
                value={requestBody}
                onChange={setRequestBody}
              />
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && !['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="flex-grow-1 overflow-auto p-2" style={{ backgroundColor: editorTheme.editorBg }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-semibold text-muted">
                <i className="bi bi-clock-history me-1"></i>
                History
              </span>
              <button className="btn btn-link btn-sm p-0 text-muted" onClick={clearHistory}>
                Clear
              </button>
            </div>
            {history.map((item, idx) => (
              <div
                key={idx}
                className="d-flex align-items-center gap-2 p-1 rounded mb-1"
                style={{
                  backgroundColor: theme.surface,
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={() => loadFromHistory(item)}
              >
                <span style={{ color: getMethodColor(item.method), fontWeight: 'bold', minWidth: '50px' }}>
                  {item.method}
                </span>
                <span className={`badge ${item.status < 400 ? 'bg-success' : 'bg-danger'}`}>
                  {item.status}
                </span>
                <span className="text-truncate flex-grow-1" style={{ color: theme.textMuted }}>
                  {item.url}
                </span>
                <span className="text-muted">{item.time}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center Divider */}
      <div
        style={{
          width: '1px',
          backgroundColor: theme.border
        }}
      />

      {/* Right Panel - Response */}
      <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="p-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-inbox me-2" style={{ color: theme.primary }}></i>
            <span className="fw-semibold">Response</span>
          </div>
          {responseBody && (
            <Tooltip text="Copy Response" placement="top">
              <button className="btn btn-outline-secondary btn-sm" onClick={copyResponse}>
                <i className="bi bi-clipboard"></i>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Status & Metrics */}
        {(response || error || metrics) && (
          <div className="p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              {response && (
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${response.ok ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '14px' }}>
                    {response.status} {response.statusText}
                  </span>
                </div>
              )}
              {error && (
                <span className="badge bg-danger" style={{ fontSize: '14px' }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  {error}
                </span>
              )}
              {metrics && (
                <div className="d-flex flex-wrap gap-2" style={{ fontSize: '12px' }}>
                  <span className="badge bg-secondary">
                    <i className="bi bi-clock me-1"></i>
                    {metrics.totalTime} ms
                  </span>
                  {metrics.size !== undefined && (
                    <span className="badge bg-secondary">
                      <i className="bi bi-file-earmark me-1"></i>
                      {formatSize(metrics.size)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Detailed Metrics */}
            {metrics && !metrics.error && (
              <div className="mt-2 d-flex flex-wrap gap-2" style={{ fontSize: '11px' }}>
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted">Request:</span>
                  <span style={{ color: theme.primary }}>{metrics.fetchTime} ms</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted">Download:</span>
                  <span style={{ color: theme.primary }}>{metrics.downloadTime} ms</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted">Headers:</span>
                  <span style={{ color: theme.primary }}>{metrics.headersCount}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Response Headers */}
        {responseHeaders.length > 0 && (
          <div className="border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
            <button
              className="btn btn-link btn-sm w-100 text-start d-flex align-items-center justify-content-between p-2"
              onClick={() => setShowHeaders(!showHeaders)}
              style={{ color: theme.text, textDecoration: 'none' }}
            >
              <span className="small fw-semibold">
                <i className={`bi bi-chevron-${showHeaders ? 'down' : 'right'} me-1`}></i>
                Response Headers ({responseHeaders.length})
              </span>
            </button>
            {showHeaders && (
              <div className="px-2 pb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {responseHeaders.map((h, idx) => (
                  <div key={idx} className="d-flex gap-2" style={{ fontSize: '11px' }}>
                    <span style={{ color: theme.primary, minWidth: '150px' }}>{h.key}:</span>
                    <span className="text-muted text-break">{h.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Response Body */}
        <div className="flex-grow-1 overflow-hidden" style={{ backgroundColor: editorTheme.editorBg }}>
          {isLoading ? (
            <div className="h-100 d-flex align-items-center justify-content-center">
              <div className="text-center">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <p className="text-muted mb-0">Sending request...</p>
              </div>
            </div>
          ) : responseBody ? (
            <CodeMirrorEditor
              value={responseBody}
              onChange={() => {}}
            />
          ) : (
            <div className="h-100 d-flex align-items-center justify-content-center">
              <div className="text-center text-muted">
                <i className="bi bi-send display-4 d-block mb-3"></i>
                <p>Enter a URL and click Send to make a request</p>
                <p className="small">
                  <i className="bi bi-info-circle me-1"></i>
                  Note: Some APIs may block requests due to CORS policies
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiTester;
