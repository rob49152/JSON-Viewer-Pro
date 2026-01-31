import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import CodeMirrorEditor from './CodeMirrorEditor.jsx';
import JsonTreeView from './JsonTreeView.jsx';
import DiffModal from './DiffModal.jsx';
import JsonGraphModal from './JsonGraphModal.jsx';
import TemplateModal from './TemplateModal.jsx';
import Tooltip from './Tooltip.jsx';
import { listTemplates, getTemplate } from '../services/templateApi.js';

// Calculate JSON path from cursor position
function getJsonPathAtCursor(jsonText, line, col) {
  if (!jsonText.trim()) return null;

  try {
    JSON.parse(jsonText); // Validate first
  } catch {
    return null;
  }

  // Convert line/col to offset
  const lines = jsonText.split('\n');
  let offset = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }
  offset += Math.min(col - 1, (lines[line - 1] || '').length);

  // Track path while scanning
  const path = [];
  let i = 0;

  const skipWhitespace = () => {
    while (i < jsonText.length && /\s/.test(jsonText[i])) i++;
  };

  const readString = () => {
    i++; // Skip opening quote
    let str = '';
    while (i < jsonText.length && jsonText[i] !== '"') {
      if (jsonText[i] === '\\' && i + 1 < jsonText.length) {
        i += 2;
        continue;
      }
      str += jsonText[i];
      i++;
    }
    i++; // Skip closing quote
    return str;
  };

  const scanValue = () => {
    skipWhitespace();
    if (i >= jsonText.length) return;

    if (jsonText[i] === '"') {
      // String value
      readString();
    } else if (jsonText[i] === '{') {
      // Object
      i++; // Skip {
      skipWhitespace();

      while (i < jsonText.length && jsonText[i] !== '}') {
        skipWhitespace();
        if (jsonText[i] === '"') {
          const key = readString();

          skipWhitespace();
          if (jsonText[i] === ':') i++; // Skip colon
          skipWhitespace();

          // Check if cursor is in this key's value
          const valueStartPos = i;
          path.push(key);

          scanValue();

          // If cursor was before this value ended, we found it
          if (offset >= valueStartPos && offset < i) {
            return; // Path is set
          }

          path.pop();

          skipWhitespace();
          if (jsonText[i] === ',') i++;
        } else {
          break;
        }
      }
      if (jsonText[i] === '}') i++;
    } else if (jsonText[i] === '[') {
      // Array
      i++; // Skip [
      skipWhitespace();

      let idx = 0;
      while (i < jsonText.length && jsonText[i] !== ']') {
        skipWhitespace();
        if (jsonText[i] === ']') break;

        const elemStart = i;
        path.push(idx);

        scanValue(true);

        if (offset >= elemStart && offset < i) {
          return; // Path is set
        }

        path.pop();
        idx++;

        skipWhitespace();
        if (jsonText[i] === ',') i++;
      }
      if (jsonText[i] === ']') i++;
    } else {
      // Primitive (number, boolean, null)
      while (i < jsonText.length && !/[\s,\}\]]/.test(jsonText[i])) {
        i++;
      }
    }
  };

  scanValue();

  if (path.length === 0) return '$';

  return '$' + path.map(p => {
    if (typeof p === 'number') return `[${p}]`;
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)) return `.${p}`;
    return `["${p.replace(/"/g, '\\"')}"]`;
  }).join('');
}

function ViewEditCompare({ onSendToDesigner1, onSendToDesigner2 }) {
  const { theme, indentSize } = useTheme();
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [leftError, setLeftError] = useState(null);
  const [rightError, setRightError] = useState(null);
  const [viewMode, setViewMode] = useState('code'); // 'code', 'tree'
  const [syncScroll, setSyncScroll] = useState(true);

  // Cursor position tracking
  const [leftCursor, setLeftCursor] = useState({ row: 1, col: 1 });
  const [rightCursor, setRightCursor] = useState({ row: 1, col: 1 });

  // JSON path tracking
  const [leftJsonPath, setLeftJsonPath] = useState(null);
  const [rightJsonPath, setRightJsonPath] = useState(null);

  // Update JSON path when cursor moves
  useEffect(() => {
    const path = getJsonPathAtCursor(leftJson, leftCursor.row, leftCursor.col);
    setLeftJsonPath(path);
  }, [leftJson, leftCursor]);

  useEffect(() => {
    const path = getJsonPathAtCursor(rightJson, rightCursor.row, rightCursor.col);
    setRightJsonPath(path);
  }, [rightJson, rightCursor]);

  // Minified state tracking for word-wrap
  const [leftMinified, setLeftMinified] = useState(false);
  const [rightMinified, setRightMinified] = useState(false);

  // Diff modal state
  const [showDiffModal, setShowDiffModal] = useState(false);

  // Graph modal state
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphJson, setGraphJson] = useState('');

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateMode, setTemplateMode] = useState('save'); // 'save' or 'load'
  const [templateSide, setTemplateSide] = useState('left');

  // Cross-panel tree view state
  const [rightShowsLeftTree, setRightShowsLeftTree] = useState(false);
  const [leftShowsRightTree, setLeftShowsRightTree] = useState(false);

  // Template list state
  const [templateList, setTemplateList] = useState([]);
  const [templateListLoading, setTemplateListLoading] = useState(false);

  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);
  const historyRef = useRef({
    left: { past: [], future: [] },
    right: { past: [], future: [] }
  });
  const isUndoRedoRef = useRef(false);

  useEffect(() => {
    return () => {
      isUndoRedoRef.current = false;
    };
  }, []);

  // Fetch template list on mount and periodically
  const fetchTemplateList = useCallback(async () => {
    setTemplateListLoading(true);
    try {
      const list = await listTemplates();
      // Only show json type templates
      const jsonTemplates = list.filter(t => t.type === 'json');
      setTemplateList(jsonTemplates);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setTemplateList([]);
    } finally {
      setTemplateListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplateList();
  }, [fetchTemplateList]);

  const loadTemplateToPanel = async (templateName, side) => {
    if (!templateName) return;
    try {
      const data = await getTemplate(templateName);
      const content = data.content;
      const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, indentSize);
      applySideValue(side, jsonString, { minified: false });
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  const handleLeftScroll = useCallback((scrollTop) => {
    if (syncScroll && rightEditorRef.current) {
      rightEditorRef.current.scrollTo(scrollTop);
    }
  }, [syncScroll]);

  const handleRightScroll = useCallback((scrollTop) => {
    if (syncScroll && leftEditorRef.current) {
      leftEditorRef.current.scrollTo(scrollTop);
    }
  }, [syncScroll]);

  const validateJson = useCallback((text, setError) => {
    if (!text.trim()) {
      setError(null);
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      setError(null);
      return parsed;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, []);

  const pushHistory = (side, currentValue) => {
    const bucket = historyRef.current[side];
    bucket.past.push(currentValue);
    if (bucket.past.length > 200) bucket.past.shift();
    bucket.future = [];
  };

  const applySideValue = (side, value, { push = true, minified } = {}) => {
    if (push && !isUndoRedoRef.current) {
      const currentValue = side === 'left' ? leftJson : rightJson;
      pushHistory(side, currentValue);
    }

    if (side === 'left') {
      setLeftJson(value);
      validateJson(value, setLeftError);
      if (typeof minified === 'boolean') setLeftMinified(minified);
    } else {
      setRightJson(value);
      validateJson(value, setRightError);
      if (typeof minified === 'boolean') setRightMinified(minified);
    }
  };

  const handleLeftChange = (value) => applySideValue('left', value);
  const handleRightChange = (value) => applySideValue('right', value);

  const undoSide = (side) => {
    const bucket = historyRef.current[side];
    if (bucket.past.length === 0) return;
    const currentValue = side === 'left' ? leftJson : rightJson;
    const previousValue = bucket.past.pop();
    bucket.future.unshift(currentValue);
    isUndoRedoRef.current = true;
    applySideValue(side, previousValue, { push: false });
    isUndoRedoRef.current = false;
  };

  const redoSide = (side) => {
    const bucket = historyRef.current[side];
    if (bucket.future.length === 0) return;
    const currentValue = side === 'left' ? leftJson : rightJson;
    const nextValue = bucket.future.shift();
    bucket.past.push(currentValue);
    isUndoRedoRef.current = true;
    applySideValue(side, nextValue, { push: false });
    isUndoRedoRef.current = false;
  };

  const formatJson = (side) => {
    try {
      const text = side === 'left' ? leftJson : rightJson;
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, indentSize);
      applySideValue(side, formatted, { minified: false });
    } catch (e) {
      // Error already shown
    }
  };

  const minifyJson = (side) => {
    try {
      const text = side === 'left' ? leftJson : rightJson;
      const parsed = JSON.parse(text);
      const minified = JSON.stringify(parsed);
      applySideValue(side, minified, { minified: true });
    } catch (e) {
      // Error already shown
    }
  };

  // Reset minified state when formatting
  const formatJsonWithReset = (side) => {
    formatJson(side);
    if (side === 'left') {
      setLeftMinified(false);
    } else {
      setRightMinified(false);
    }
  };

  // Open graph modal for a specific side
  const openGraphModal = (side) => {
    const json = side === 'left' ? leftJson : rightJson;
    setGraphJson(json);
    setShowGraphModal(true);
  };

  const copyToClipboard = async (side) => {
    const text = side === 'left' ? leftJson : rightJson;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const clearPanel = (side) => {
    applySideValue(side, '', { minified: false });
  };

  const handleFileUpload = (side, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (side === 'left') handleLeftChange(content);
        else handleRightChange(content);
      };
      reader.readAsText(file);
    }
  };

  const downloadJson = (side) => {
    const text = side === 'left' ? leftJson : rightJson;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${side}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const swapPanels = () => {
    const tempJson = leftJson;
    const tempError = leftError;
    applySideValue('left', rightJson, { minified: false });
    applySideValue('right', tempJson, { minified: false });
    setLeftError(rightError);
    setRightError(tempError);
  };

  const copyLeftToRight = () => {
    applySideValue('right', leftJson, { minified: false });
  };

  const copyRightToLeft = () => {
    applySideValue('left', rightJson, { minified: false });
  };

  const createNodeFromValue = (value, name = '') => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (Array.isArray(value)) {
      const childValue = value.length > 0 ? value[0] : null;
      const children = value.length > 0 ? [createNodeFromValue(childValue, '')] : [];
      return { id, name, nodeType: 'array', children };
    }
    if (value !== null && typeof value === 'object') {
      const children = Object.entries(value).map(([key, val]) => createNodeFromValue(val, key));
      return { id, name, nodeType: 'object', children };
    }
    if (typeof value === 'number') return { id, name, nodeType: 'number', value: 0 };
    if (typeof value === 'boolean') return { id, name, nodeType: 'boolean', value: false };
    if (value === null) return { id, name, nodeType: 'null', value: null };
    return { id, name, nodeType: 'string', value: '' };
  };

  const buildStructurePayload = (jsonText) => {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      const data = parsed.length > 0 ? [createNodeFromValue(parsed[0], '')] : [];
      return { rootType: 'array', data };
    }
    const data = Object.entries(parsed).map(([key, val]) => createNodeFromValue(val, key));
    return { rootType: 'object', data };
  };

  const sendStructureToDesigner = (side, target) => {
    const jsonText = side === 'left' ? leftJson : rightJson;
    if (!jsonText.trim()) return;
    try {
      const payload = buildStructurePayload(jsonText);
      const wrapped = { ...payload, token: Date.now() };
      if (target === 'designer1') onSendToDesigner1?.(wrapped);
      if (target === 'designer2') onSendToDesigner2?.(wrapped);
    } catch (e) {
      // invalid JSON; errors already shown in UI
    }
  };

  const openTemplateModal = (side, mode) => {
    setTemplateSide(side);
    setTemplateMode(mode);
    setShowTemplateModal(true);
  };

  const handleTemplateLoad = (content) => {
    // Content could be a string or an object
    const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, indentSize);
    applySideValue(templateSide, jsonString, { minified: false });
  };

  const loadSampleJson = (side) => {
    const sample = {
      "name": "JSON Viewer Pro",
      "version": "1.0.0",
      "features": [
        "View",
        "Edit",
        "Compare",
        "Format"
      ],
      "settings": {
        "theme": "dark",
        "fontSize": 14,
        "autoFormat": true
      },
      "statistics": {
        "users": 10000,
        "rating": 4.8,
        "active": true
      }
    };
    const formatted = JSON.stringify(sample, null, indentSize);
    if (side === 'left') {
      setLeftJson(formatted);
      setLeftError(null);
    } else {
      setRightJson(formatted);
      setRightError(null);
    }
  };

  // Built-in templates
  const loadBuiltInTemplate = (templateType, side) => {
    let template;
    switch (templateType) {
      case 'package':
        template = {
          name: "my-project",
          version: "1.0.0",
          description: "",
          main: "index.js",
          scripts: {
            start: "node index.js",
            test: "echo \"No tests\""
          },
          dependencies: {},
          devDependencies: {}
        };
        break;
      case 'config':
        template = {
          appName: "My App",
          debug: false,
          port: 3000,
          database: {
            host: "localhost",
            port: 5432,
            name: "mydb"
          },
          features: ["feature1", "feature2"]
        };
        break;
      case 'api':
        template = {
          success: true,
          status: 200,
          message: "OK",
          data: {
            id: 1,
            items: []
          },
          meta: {
            total: 0,
            page: 1,
            limit: 10
          }
        };
        break;
      default:
        return;
    }
    const formatted = JSON.stringify(template, null, indentSize);
    applySideValue(side, formatted, { minified: false });
  };

  const renderPanelToolbar = (side) => (
    <div className="d-flex flex-wrap gap-1 p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
      <div className="btn-group btn-group-sm">
        <Tooltip text="Format JSON" placement="top">
          <button className="btn btn-outline-primary btn-sm" onClick={() => formatJsonWithReset(side)}>
            <i className="bi bi-code-slash"></i>
          </button>
        </Tooltip>
        <Tooltip text="Minify JSON" placement="top">
          <button className="btn btn-outline-primary btn-sm" onClick={() => minifyJson(side)}>
            <i className="bi bi-arrows-collapse"></i>
          </button>
        </Tooltip>
      </div>

      <div className="btn-group btn-group-sm">
        <Tooltip text="Copy to Clipboard" placement="top">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => copyToClipboard(side)}>
            <i className="bi bi-clipboard"></i>
          </button>
        </Tooltip>
        <Tooltip text="Download JSON" placement="top">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadJson(side)}>
            <i className="bi bi-download"></i>
          </button>
        </Tooltip>
      </div>

      <Tooltip text="Upload JSON File" placement="top">
        <label className="btn btn-outline-info btn-sm mb-0">
          <i className="bi bi-upload"></i>
          <input
            type="file"
            accept=".json,.txt"
            className="d-none"
            onChange={(e) => handleFileUpload(side, e)}
          />
        </label>
      </Tooltip>

      <Tooltip text="Load Sample" placement="top">
        <button className="btn btn-outline-success btn-sm" onClick={() => loadSampleJson(side)}>
          <i className="bi bi-file-earmark-code"></i>
        </button>
      </Tooltip>

      <div className="btn-group btn-group-sm">
        <Tooltip text="Save as Template" placement="top">
          <button className="btn btn-outline-warning btn-sm" onClick={() => openTemplateModal(side, 'save')}>
            <i className="bi bi-floppy"></i>
          </button>
        </Tooltip>
        <Tooltip text="Import Template" placement="top">
          <button className="btn btn-outline-warning btn-sm" onClick={() => openTemplateModal(side, 'load')}>
            <i className="bi bi-filetype-json"></i>
          </button>
        </Tooltip>
      </div>

      <div className="btn-group btn-group-sm">
        <Tooltip text="Send structure to JSON Designer 1" placement="top">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => sendStructureToDesigner(side, 'designer1')}>
            <i className="bi bi-diagram-3"></i>
          </button>
        </Tooltip>
        <Tooltip text="Send structure to JSON Designer 2" placement="top">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => sendStructureToDesigner(side, 'designer2')}>
            <i className="bi bi-diagram-3-fill"></i>
          </button>
        </Tooltip>
      </div>

      <Tooltip text="View as Graph" placement="top">
        <button className="btn btn-outline-warning btn-sm" onClick={() => openGraphModal(side)}>
          <i className="bi bi-diagram-2"></i>
        </button>
      </Tooltip>

      <Tooltip text="Clear" placement="top">
        <button className="btn btn-outline-danger btn-sm" onClick={() => clearPanel(side)}>
          <i className="bi bi-trash"></i>
        </button>
      </Tooltip>

      {/* Templates Dropdown */}
      <div className="ms-auto dropdown">
        <button
          className="btn btn-outline-info btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="bi bi-file-earmark-text me-1"></i>
          Templates
        </button>
        <ul className="dropdown-menu dropdown-menu-end" style={{ backgroundColor: theme.surface, minWidth: '180px' }}>
          <li><h6 className="dropdown-header" style={{ color: theme.textMuted, fontSize: '10px' }}>BUILT-IN</h6></li>
          <li>
            <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadBuiltInTemplate('package', side)}>
              <i className="bi bi-box me-2"></i>package.json
            </button>
          </li>
          <li>
            <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadBuiltInTemplate('config', side)}>
              <i className="bi bi-gear me-2"></i>Config File
            </button>
          </li>
          <li>
            <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadBuiltInTemplate('api', side)}>
              <i className="bi bi-cloud me-2"></i>API Response
            </button>
          </li>
          {templateList.length > 0 && (
            <>
              <li><hr className="dropdown-divider" style={{ borderColor: theme.border }} /></li>
              <li className="d-flex align-items-center justify-content-between px-3">
                <h6 className="dropdown-header p-0 m-0" style={{ color: theme.textMuted, fontSize: '10px' }}>SAVED</h6>
                <button
                  className="btn btn-link btn-sm p-0"
                  onClick={(e) => { e.stopPropagation(); fetchTemplateList(); }}
                  disabled={templateListLoading}
                  style={{ color: theme.textMuted, fontSize: '10px' }}
                  title="Refresh"
                >
                  <i className={`bi bi-arrow-clockwise ${templateListLoading ? 'spin' : ''}`}></i>
                </button>
              </li>
              {templateList.map(t => (
                <li key={t.name}>
                  <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadTemplateToPanel(t.name, side)}>
                    <i className="bi bi-file-earmark-code me-2"></i>{t.name}
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>
    </div>
  );

  const renderCenterControls = () => (
    <div
      className="d-flex flex-column gap-2 p-2 justify-content-center align-items-center"
      style={{
        minWidth: '60px',
        backgroundColor: theme.surface,
        borderLeft: `1px solid ${theme.border}`,
        borderRight: `1px solid ${theme.border}`
      }}
    >
      {/* View Mode Toggle */}
      <div className="btn-group-vertical btn-group-sm mb-2">
        <Tooltip text="Code View" placement="left">
          <button
            className={`btn btn-sm ${viewMode === 'code' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('code')}
          >
            <i className="bi bi-code-square"></i>
          </button>
        </Tooltip>
        <Tooltip text="Tree View" placement="left">
          <button
            className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('tree')}
          >
            <i className="bi bi-diagram-3"></i>
          </button>
        </Tooltip>
        <Tooltip text="Compare (Diff)" placement="left">
          <button
            className={`btn btn-sm ${showDiffModal ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setShowDiffModal(!showDiffModal)}
          >
            <i className="bi bi-file-diff"></i>
          </button>
        </Tooltip>
      </div>

      {/* Cross-Panel Tree View */}
      <div className="btn-group-vertical btn-group-sm mb-2">
        <Tooltip text="Show Left as Tree in Right Panel" placement="left">
          <button
            className={`btn btn-sm ${rightShowsLeftTree ? 'btn-info' : 'btn-outline-secondary'}`}
            onClick={() => {
              setRightShowsLeftTree(!rightShowsLeftTree);
              if (!rightShowsLeftTree) setLeftShowsRightTree(false);
            }}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </Tooltip>
        <Tooltip text="Show Right as Tree in Left Panel" placement="left">
          <button
            className={`btn btn-sm ${leftShowsRightTree ? 'btn-info' : 'btn-outline-secondary'}`}
            onClick={() => {
              setLeftShowsRightTree(!leftShowsRightTree);
              if (!leftShowsRightTree) setRightShowsLeftTree(false);
            }}
          >
            <i className="bi bi-box-arrow-left"></i>
          </button>
        </Tooltip>
      </div>

      {/* Transfer Controls */}
      <div className="btn-group-vertical btn-group-sm mb-2">
        <Tooltip text="Swap Panels" placement="left">
          <button className="btn btn-outline-info btn-sm" onClick={swapPanels}>
            <i className="bi bi-arrow-left-right"></i>
          </button>
        </Tooltip>
        <Tooltip text="Copy Left → Right" placement="left">
          <button className="btn btn-outline-secondary btn-sm" onClick={copyLeftToRight}>
            <i className="bi bi-chevron-double-right"></i>
          </button>
        </Tooltip>
        <Tooltip text="Copy Right ← Left" placement="left">
          <button className="btn btn-outline-secondary btn-sm" onClick={copyRightToLeft}>
            <i className="bi bi-chevron-double-left"></i>
          </button>
        </Tooltip>
      </div>

      {/* Sync Scroll Toggle */}
      <Tooltip text={syncScroll ? "Disable Sync Scroll" : "Enable Sync Scroll"} placement="left">
        <button
          className={`btn btn-sm ${syncScroll ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => setSyncScroll(!syncScroll)}
        >
          <i className={`bi ${syncScroll ? 'bi-link-45deg' : 'bi-link'}`}></i>
        </button>
      </Tooltip>
    </div>
  );

  const renderPanel = (side, json, error, onChange) => {
    const editorRef = side === 'left' ? leftEditorRef : rightEditorRef;
    const onScrollHandler = side === 'left' ? handleLeftScroll : handleRightScroll;
    const cursorPos = side === 'left' ? leftCursor : rightCursor;
    const setCursorPos = side === 'left' ? setLeftCursor : setRightCursor;
    const isMinified = side === 'left' ? leftMinified : rightMinified;
    const jsonPath = side === 'left' ? leftJsonPath : rightJsonPath;

    // Determine what JSON to show in tree view (for cross-panel feature)
    const showCrossTree = (side === 'left' && leftShowsRightTree) || (side === 'right' && rightShowsLeftTree);
    const treeJson = showCrossTree
      ? (side === 'left' ? rightJson : leftJson)
      : json;
    const treeError = showCrossTree
      ? (side === 'left' ? rightError : leftError)
      : error;

    let parsedTreeJson = null;
    try {
      parsedTreeJson = treeJson.trim() ? JSON.parse(treeJson) : null;
    } catch (e) {
      // Error handled below
    }

    return (
      <div className="d-flex flex-column h-100" style={{ flex: 1 }}>
        {renderPanelToolbar(side)}

        {error && (
          <div className="alert alert-danger m-2 py-1 px-2 small mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            {error}
          </div>
        )}

        <div className="flex-grow-1 overflow-hidden">
          {viewMode === 'code' && !showCrossTree && (
            <CodeMirrorEditor
              ref={editorRef}
              value={json}
              onChange={onChange}
              onScroll={onScrollHandler}
              onCursorChange={setCursorPos}
              wordWrap={isMinified}
            />
          )}
          {viewMode === 'tree' && !showCrossTree && (
            <JsonTreeView
              data={parsedTreeJson}
              error={treeError}
            />
          )}
          {showCrossTree && (
            <div className="d-flex flex-column h-100">
              <div className="px-2 py-1 text-center small" style={{ backgroundColor: theme.info, color: '#fff' }}>
                <i className="bi bi-diagram-3 me-1"></i>
                Tree view of {side === 'left' ? 'Right' : 'Left'} Panel
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <JsonTreeView
                  data={parsedTreeJson}
                  error={treeError}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cursor Position Status Bar */}
        {viewMode === 'code' && !showCrossTree && (
          <div
            className="px-2 py-1 border-top d-flex align-items-center small"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.textMuted,
              fontSize: '11px',
              flexShrink: 0,
              gap: '8px'
            }}
          >
            <span style={{ minWidth: '90px' }}>
              Ln {cursorPos.row}, Col {cursorPos.col}
            </span>
            {jsonPath && (
              <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                <span
                  className="text-truncate"
                  style={{
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    color: theme.primary,
                    maxWidth: '100%'
                  }}
                  title={jsonPath}
                >
                  {jsonPath}
                </span>
                <button
                  className="btn btn-link btn-sm p-0 ms-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(jsonPath);
                    } catch (e) {
                      console.error('Failed to copy path:', e);
                    }
                  }}
                  title="Copy path"
                  style={{ color: theme.textMuted, fontSize: '11px' }}
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>
            )}
            <div className="ms-auto">
              {json && !error && (
                <span className="badge bg-success" style={{ fontSize: '10px' }}>Valid JSON</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="d-flex" style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
        {/* Left Panel */}
        <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          {renderPanel('left', leftJson, leftError, handleLeftChange)}
        </div>

        {/* Center Controls */}
        {renderCenterControls()}

        {/* Right Panel */}
        <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          {renderPanel('right', rightJson, rightError, handleRightChange)}
        </div>
      </div>

      {/* Diff Modal */}
      <DiffModal
        show={showDiffModal}
        onHide={() => setShowDiffModal(false)}
        leftJson={leftJson}
        rightJson={rightJson}
        leftError={leftError}
        rightError={rightError}
      />

      {/* Graph Modal */}
      <JsonGraphModal
        show={showGraphModal}
        onHide={() => setShowGraphModal(false)}
        json={graphJson}
      />

      {/* Template Modal */}
      <TemplateModal
        show={showTemplateModal}
        onHide={() => setShowTemplateModal(false)}
        mode={templateMode}
        onLoad={handleTemplateLoad}
        currentContent={templateSide === 'left' ? leftJson : rightJson}
        contentType="json"
      />
    </>
  );
}

export default ViewEditCompare;
