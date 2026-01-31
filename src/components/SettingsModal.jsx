import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

function SettingsModal({ show, onHide }) {
  const {
    theme,
    themeName,
    setThemeName,
    editorThemeName,
    setEditorThemeName,
    themes,
    fontSize,
    setFontSize,
    indentSize,
    setIndentSize,
    treeIndent,
    setTreeIndent,
    treeRowHeight,
    setTreeRowHeight,
    treeHeight,
    setTreeHeight,
    // Diff View settings
    diffArrayMethod,
    setDiffArrayMethod,
    diffShowModifications,
    setDiffShowModifications,
    diffIndent,
    setDiffIndent,
    diffLineNumbers,
    setDiffLineNumbers,
    diffHighlightInline,
    setDiffHighlightInline,
    diffInlineMode,
    setDiffInlineMode,
    diffHideUnchanged,
    setDiffHideUnchanged,
    diffModalWidthPercent,
    setDiffModalWidthPercent,
    diffModalHeightPercent,
    setDiffModalHeightPercent,
    // Editor settings
    editorLineNumbers,
    setEditorLineNumbers,
    editorBracketMatching,
    setEditorBracketMatching,
    editorCodeFolding,
    setEditorCodeFolding,
    editorHighlightActiveLine,
    setEditorHighlightActiveLine,
    editorLineHeight,
    setEditorLineHeight,
    // Graph View settings
    graphNodeWidth,
    setGraphNodeWidth,
    graphNodeHeight,
    setGraphNodeHeight,
    graphNodeSpacingX,
    setGraphNodeSpacingX,
    graphNodeSpacingY,
    setGraphNodeSpacingY,
    graphModalWidthPercent,
    setGraphModalWidthPercent,
    graphModalHeightPercent,
    setGraphModalHeightPercent
  } = useTheme();

  const [activeTab, setActiveTab] = useState('appearance');

  if (!show) return null;

  const themeList = Object.entries(themes);

  const tabStyle = (tabName) => ({
    color: activeTab === tabName ? theme.text : theme.textMuted,
    backgroundColor: activeTab === tabName ? theme.surface : 'transparent',
    borderColor: theme.border,
    fontSize: '0.85rem',
    padding: '0.4rem 0.6rem'
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onHide}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        onClick={onHide}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ backgroundColor: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, fontSize: '0.9rem' }}>
            <div className="modal-header py-2" style={{ borderColor: theme.border }}>
              <h6 className="modal-title d-flex align-items-center mb-0">
                <i className="bi bi-gear-fill me-2" style={{ color: theme.primary }}></i>
                Settings
              </h6>
              <button
                type="button"
                className="btn-close btn-sm"
                onClick={onHide}
                style={{ filter: theme.isDark ? 'invert(1)' : 'none' }}
              ></button>
            </div>
            <div className="modal-body py-2">
              {/* Tabs */}
              <div className="mb-2">
                <ul className="nav nav-tabs" style={{ borderColor: theme.border }}>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'appearance' ? 'active' : ''}`}
                      onClick={() => setActiveTab('appearance')}
                      style={tabStyle('appearance')}
                    >
                      Appearance
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'editor' ? 'active' : ''}`}
                      onClick={() => setActiveTab('editor')}
                      style={tabStyle('editor')}
                    >
                      Editor
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'tree' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tree')}
                      style={tabStyle('tree')}
                    >
                      Tree View
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'diff' ? 'active' : ''}`}
                      onClick={() => setActiveTab('diff')}
                      style={tabStyle('diff')}
                    >
                      Diff View
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'graph' ? 'active' : ''}`}
                      onClick={() => setActiveTab('graph')}
                      style={tabStyle('graph')}
                    >
                      Graph View
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'shortcuts' ? 'active' : ''}`}
                      onClick={() => setActiveTab('shortcuts')}
                      style={tabStyle('shortcuts')}
                    >
                      Shortcuts
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
                      onClick={() => setActiveTab('about')}
                      style={tabStyle('about')}
                    >
                      About
                    </button>
                  </li>
                </ul>
              </div>

              {activeTab === 'appearance' && (
                <>
                  {/* UI Theme Selection */}
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-palette me-2" style={{ color: theme.primary }}></i>
                      UI Theme
                    </h6>
                    <div className="row g-2">
                      {themeList.map(([key, themeOption]) => (
                        <div key={key} className="col-6 col-md-4 col-lg-3">
                          <button
                            className={`btn w-100 p-0 ${themeName === key ? 'border-primary border-2' : ''}`}
                            onClick={() => setThemeName(key)}
                            style={{
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: `2px solid ${themeName === key ? theme.primary : theme.border}`
                            }}
                          >
                            <div
                              className="p-2"
                              style={{
                                backgroundColor: themeOption.background,
                                minHeight: '40px'
                              }}
                            >
                              <div style={{ height: '3px', width: '70%', backgroundColor: themeOption.surface, borderRadius: '2px', marginBottom: '2px' }}></div>
                              <div style={{ height: '3px', width: '50%', backgroundColor: themeOption.primary, borderRadius: '2px' }}></div>
                            </div>
                            <div
                              className="py-1 px-2 text-center"
                              style={{
                                backgroundColor: themeOption.surface,
                                color: themeOption.text,
                                borderTop: `1px solid ${themeOption.border}`,
                                fontSize: '0.75rem'
                              }}
                            >
                              {themeOption.name}
                              {themeName === key && <i className="bi bi-check-circle-fill ms-1" style={{ color: theme.primary }}></i>}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editor Theme Selection */}
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-code-square me-2" style={{ color: theme.primary }}></i>
                      Editor Theme
                    </h6>
                    <div className="row g-2">
                      <div className="col-6 col-md-4 col-lg-3">
                        <button
                          className={`btn w-100 p-0 ${editorThemeName === 'same' ? 'border-primary border-2' : ''}`}
                          onClick={() => setEditorThemeName('same')}
                          style={{
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: `2px solid ${editorThemeName === 'same' ? theme.primary : theme.border}`
                          }}
                        >
                          <div className="p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: theme.background, minHeight: '40px' }}>
                            <i className="bi bi-link-45deg" style={{ fontSize: '20px', color: theme.primary }}></i>
                          </div>
                          <div className="py-1 px-2 text-center" style={{ backgroundColor: theme.surface, color: theme.text, borderTop: `1px solid ${theme.border}`, fontSize: '0.75rem' }}>
                            Same as UI
                            {editorThemeName === 'same' && <i className="bi bi-check-circle-fill ms-1" style={{ color: theme.primary }}></i>}
                          </div>
                        </button>
                      </div>
                      {themeList.map(([key, themeOption]) => (
                        <div key={key} className="col-6 col-md-4 col-lg-3">
                          <button
                            className={`btn w-100 p-0 ${editorThemeName === key ? 'border-primary border-2' : ''}`}
                            onClick={() => setEditorThemeName(key)}
                            style={{
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: `2px solid ${editorThemeName === key ? theme.primary : theme.border}`
                            }}
                          >
                            <div className="p-2" style={{ backgroundColor: themeOption.editorBg, minHeight: '40px' }}>
                              <div className="d-flex gap-1 mb-1">
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: themeOption.syntax.key }}></div>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: themeOption.syntax.string }}></div>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: themeOption.syntax.number }}></div>
                              </div>
                              <div style={{ height: '2px', width: '60%', backgroundColor: themeOption.syntax.key, borderRadius: '2px', marginBottom: '2px' }}></div>
                              <div style={{ height: '2px', width: '80%', backgroundColor: themeOption.syntax.string, borderRadius: '2px' }}></div>
                            </div>
                            <div className="py-1 px-2 text-center" style={{ backgroundColor: themeOption.surface, color: themeOption.text, borderTop: `1px solid ${themeOption.border}`, fontSize: '0.75rem' }}>
                              {themeOption.name}
                              {editorThemeName === key && <i className="bi bi-check-circle-fill ms-1" style={{ color: theme.primary }}></i>}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'editor' && (
                <>
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-type me-2" style={{ color: theme.primary }}></i>
                      Font Size: {fontSize}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="10"
                      max="24"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>10px</span>
                      <span>24px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-distribute-vertical me-2" style={{ color: theme.primary }}></i>
                      Line Height: {editorLineHeight.toFixed(1)}
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="1.2"
                      max="2.0"
                      step="0.1"
                      value={editorLineHeight}
                      onChange={(e) => setEditorLineHeight(parseFloat(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>1.2</span>
                      <span>2.0</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-text-indent-left me-2" style={{ color: theme.primary }}></i>
                      Indent Size
                    </h6>
                    <div className="btn-group btn-group-sm w-100">
                      {[2, 3, 4].map((size) => (
                        <button
                          key={size}
                          className={`btn ${indentSize === size ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setIndentSize(size)}
                        >
                          {size} spaces
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-toggles me-2" style={{ color: theme.primary }}></i>
                      Display Options
                    </h6>

                    <div className="form-check form-switch mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editorLineNumbers"
                        checked={editorLineNumbers}
                        onChange={(e) => setEditorLineNumbers(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="editorLineNumbers" style={{ fontSize: '0.85rem' }}>
                        Show Line Numbers
                      </label>
                    </div>

                    <div className="form-check form-switch mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editorBracketMatching"
                        checked={editorBracketMatching}
                        onChange={(e) => setEditorBracketMatching(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="editorBracketMatching" style={{ fontSize: '0.85rem' }}>
                        Bracket Matching
                      </label>
                    </div>

                    <div className="form-check form-switch mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editorCodeFolding"
                        checked={editorCodeFolding}
                        onChange={(e) => setEditorCodeFolding(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="editorCodeFolding" style={{ fontSize: '0.85rem' }}>
                        Code Folding
                      </label>
                    </div>

                    <div className="form-check form-switch mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editorHighlightActiveLine"
                        checked={editorHighlightActiveLine}
                        onChange={(e) => setEditorHighlightActiveLine(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="editorHighlightActiveLine" style={{ fontSize: '0.85rem' }}>
                        Highlight Active Line
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'tree' && (
                <>
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-diagram-3 me-2" style={{ color: theme.primary }}></i>
                      Tree Indent: {treeIndent}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="8"
                      max="48"
                      step="2"
                      value={treeIndent}
                      onChange={(e) => setTreeIndent(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>8px</span>
                      <span>48px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-list-ul me-2" style={{ color: theme.primary }}></i>
                      Row Height: {treeRowHeight}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="32"
                      max="72"
                      step="2"
                      value={treeRowHeight}
                      onChange={(e) => setTreeRowHeight(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>32px</span>
                      <span>72px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-arrows-vertical me-2" style={{ color: theme.primary }}></i>
                      Tree Height: {treeHeight}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="300"
                      max="900"
                      step="50"
                      value={treeHeight}
                      onChange={(e) => setTreeHeight(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>300px</span>
                      <span>900px</span>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'diff' && (
                <>
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-list-columns me-2" style={{ color: theme.primary }}></i>
                      Array Diff Method
                    </h6>
                    <div className="btn-group btn-group-sm w-100">
                      <button
                        className={`btn ${diffArrayMethod === 'lcs' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setDiffArrayMethod('lcs')}
                      >
                        LCS (Recommended)
                      </button>
                      <button
                        className={`btn ${diffArrayMethod === 'normal' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setDiffArrayMethod('normal')}
                      >
                        Normal
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-text-indent-left me-2" style={{ color: theme.primary }}></i>
                      Indent Size
                    </h6>
                    <div className="btn-group btn-group-sm w-100">
                      {[2, 3, 4].map((size) => (
                        <button
                          key={size}
                          className={`btn ${diffIndent === size ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setDiffIndent(size)}
                        >
                          {size} spaces
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-highlighter me-2" style={{ color: theme.primary }}></i>
                      Inline Diff Mode
                    </h6>
                    <div className="btn-group btn-group-sm w-100">
                      <button
                        className={`btn ${diffInlineMode === 'word' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setDiffInlineMode('word')}
                      >
                        Word
                      </button>
                      <button
                        className={`btn ${diffInlineMode === 'char' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setDiffInlineMode('char')}
                      >
                        Character
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-toggles me-2" style={{ color: theme.primary }}></i>
                      Display Options
                    </h6>

                    <div className="form-check form-switch mb-1">
                      <input className="form-check-input" type="checkbox" id="diffShowModifications" checked={diffShowModifications} onChange={(e) => setDiffShowModifications(e.target.checked)} />
                      <label className="form-check-label" htmlFor="diffShowModifications" style={{ fontSize: '0.85rem' }}>Show Modifications</label>
                    </div>

                    <div className="form-check form-switch mb-1">
                      <input className="form-check-input" type="checkbox" id="diffLineNumbers" checked={diffLineNumbers} onChange={(e) => setDiffLineNumbers(e.target.checked)} />
                      <label className="form-check-label" htmlFor="diffLineNumbers" style={{ fontSize: '0.85rem' }}>Show Line Numbers</label>
                    </div>

                    <div className="form-check form-switch mb-1">
                      <input className="form-check-input" type="checkbox" id="diffHighlightInline" checked={diffHighlightInline} onChange={(e) => setDiffHighlightInline(e.target.checked)} />
                      <label className="form-check-label" htmlFor="diffHighlightInline" style={{ fontSize: '0.85rem' }}>Highlight Inline Diff</label>
                    </div>

                    <div className="form-check form-switch mb-1">
                      <input className="form-check-input" type="checkbox" id="diffHideUnchanged" checked={diffHideUnchanged} onChange={(e) => setDiffHideUnchanged(e.target.checked)} />
                      <label className="form-check-label" htmlFor="diffHideUnchanged" style={{ fontSize: '0.85rem' }}>Hide Unchanged Lines</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-aspect-ratio me-2" style={{ color: theme.primary }}></i>
                      Modal Size
                    </h6>

                    <div className="mb-2">
                      <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                        <span>Width: {diffModalWidthPercent}%</span>
                      </label>
                      <input type="range" className="form-range" min="50" max="100" step="5" value={diffModalWidthPercent} onChange={(e) => setDiffModalWidthPercent(parseInt(e.target.value))} />
                    </div>

                    <div className="mb-2">
                      <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                        <span>Height: {diffModalHeightPercent}%</span>
                      </label>
                      <input type="range" className="form-range" min="50" max="100" step="5" value={diffModalHeightPercent} onChange={(e) => setDiffModalHeightPercent(parseInt(e.target.value))} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'graph' && (
                <>
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-arrows-angle-expand me-2" style={{ color: theme.primary }}></i>
                      Node Width: {graphNodeWidth}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="120"
                      max="280"
                      step="10"
                      value={graphNodeWidth}
                      onChange={(e) => setGraphNodeWidth(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>120px</span>
                      <span>280px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-arrows-vertical me-2" style={{ color: theme.primary }}></i>
                      Node Height: {graphNodeHeight}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="20"
                      max="48"
                      step="2"
                      value={graphNodeHeight}
                      onChange={(e) => setGraphNodeHeight(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>20px</span>
                      <span>48px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-arrows me-2" style={{ color: theme.primary }}></i>
                      Horizontal Spacing: {graphNodeSpacingX}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="20"
                      max="100"
                      step="5"
                      value={graphNodeSpacingX}
                      onChange={(e) => setGraphNodeSpacingX(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>20px</span>
                      <span>100px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-distribute-vertical me-2" style={{ color: theme.primary }}></i>
                      Vertical Spacing: {graphNodeSpacingY}px
                    </h6>
                    <input
                      type="range"
                      className="form-range"
                      min="4"
                      max="24"
                      step="2"
                      value={graphNodeSpacingY}
                      onChange={(e) => setGraphNodeSpacingY(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>4px</span>
                      <span>24px</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-aspect-ratio me-2" style={{ color: theme.primary }}></i>
                      Default Modal Size
                    </h6>

                    <div className="mb-2">
                      <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                        <span>Width: {graphModalWidthPercent}%</span>
                      </label>
                      <input type="range" className="form-range" min="50" max="100" step="5" value={graphModalWidthPercent} onChange={(e) => setGraphModalWidthPercent(parseInt(e.target.value))} />
                    </div>

                    <div className="mb-2">
                      <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                        <span>Height: {graphModalHeightPercent}%</span>
                      </label>
                      <input type="range" className="form-range" min="50" max="100" step="5" value={graphModalHeightPercent} onChange={(e) => setGraphModalHeightPercent(parseInt(e.target.value))} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'shortcuts' && (
                <div className="mb-2">
                  <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-keyboard me-2" style={{ color: theme.primary }}></i>
                    Keyboard Shortcuts
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm mb-0" style={{ color: theme.text, fontSize: '0.85rem' }}>
                      <tbody>
                        <tr style={{ borderColor: theme.border }}>
                          <td><kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>Ctrl</kbd> + <kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>S</kbd></td>
                          <td>Format JSON</td>
                        </tr>
                        <tr style={{ borderColor: theme.border }}>
                          <td><kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>Ctrl</kbd> + <kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>M</kbd></td>
                          <td>Minify JSON</td>
                        </tr>
                        <tr style={{ borderColor: theme.border }}>
                          <td><kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>Ctrl</kbd> + <kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>D</kbd></td>
                          <td>Toggle Diff View</td>
                        </tr>
                        <tr style={{ borderColor: theme.border }}>
                          <td><kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>Ctrl</kbd> + <kbd style={{ backgroundColor: theme.surface, fontSize: '0.75rem' }}>T</kbd></td>
                          <td>Toggle Tree View</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="mb-2">
                  <div className="text-center mb-3">
                    <i className="bi bi-braces-asterisk display-4" style={{ color: theme.primary }}></i>
                    <h5 className="mt-2 mb-1">JSON Viewer Pro</h5>
                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>A feature-rich JSON viewer, editor, and comparison tool</p>
                  </div>

                  <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-stack me-2" style={{ color: theme.primary }}></i>
                    Tech Stack
                  </h6>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>React 18</strong> <span className="text-muted">UI Framework</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>Vite</strong> <span className="text-muted">Build Tool</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>Express.js</strong> <span className="text-muted">Backend API</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>CodeMirror 6</strong> <span className="text-muted">Editor</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>D3.js</strong> <span className="text-muted">Tree Graph</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>Bootstrap 5</strong> <span className="text-muted">CSS</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>json-diff-kit</strong> <span className="text-muted">Diff View</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded" style={{ backgroundColor: theme.background, fontSize: '0.8rem' }}>
                        <strong>react-arborist</strong> <span className="text-muted">Tree DnD</span>
                      </div>
                    </div>
                  </div>

                  <h6 className="d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-star me-2" style={{ color: theme.primary }}></i>
                    Features
                  </h6>
                  <ul className="list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Dual-panel JSON editor with real-time validation</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Tree view with search and expand/collapse</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Side-by-side diff comparison</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>JSON Crack-style tree graph visualization</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>JSON Designer with drag-and-drop</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Template system with server storage</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Built-in API Tester (HTTP client)</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>JSON Path display at cursor position</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>13 built-in themes</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Format, minify, copy, upload, download</li>
                    <li className="mb-1"><i className="bi bi-check2 me-2" style={{ color: theme.primary }}></i>Synchronized scrolling</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer py-2" style={{ borderColor: theme.border }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={onHide}>
                <i className="bi bi-check-lg me-1"></i>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsModal;
