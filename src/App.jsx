import React, { useState, useEffect } from 'react';
import ViewEditCompare from './components/ViewEditCompare.jsx';
import JsonCreator from './components/JsonCreator.jsx';
import ApiTester from './components/ApiTester.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';

function AppContent() {
  const [activeTab, setActiveTab] = useState('viewEditCompare');
  const [showSettings, setShowSettings] = useState(false);
  const { theme, themeName } = useTheme();
  const [designer1Import, setDesigner1Import] = useState(null);
  const [designer2Import, setDesigner2Import] = useState(null);
  const [designer1Append, setDesigner1Append] = useState(null);
  const [designer2Append, setDesigner2Append] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-bs-theme', theme.isDark ? 'dark' : 'light');
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if ((isCtrlOrCmd && key === 'r') || e.key === 'F5') {
        e.preventDefault();
        return;
      }

      if (isCtrlOrCmd && key === 'z' && !isEditable) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`app-container theme-${themeName}`} style={{ 
      height: '100vh',
      backgroundColor: theme.background,
      color: theme.text,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg border-bottom py-1" style={{ backgroundColor: theme.surface, flexShrink: 0, minHeight: '48px' }}>
        <div className="container-fluid">
          <span className="navbar-brand fw-bold d-flex align-items-center mb-0" style={{ color: theme.primary, fontSize: '1rem' }}>
            <i className="bi bi-braces-asterisk me-2 fs-5"></i>
            JSON Viewer Pro
          </span>
          
          {/* Main Tabs */}
          <ul className="nav nav-pills mx-auto">
            <li className="nav-item">
              <button
                className={`nav-link px-3 py-1 ${activeTab === 'viewEditCompare' ? 'active' : ''}`}
                onClick={() => setActiveTab('viewEditCompare')}
                style={activeTab === 'viewEditCompare' ? { backgroundColor: theme.primary } : { color: theme.text }}
              >
                <i className="bi bi-eye me-1"></i>
                View / Edit / Compare
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link px-3 py-1 ${activeTab === 'designer1' ? 'active' : ''}`}
                onClick={() => setActiveTab('designer1')}
                style={activeTab === 'designer1' ? { backgroundColor: theme.primary } : { color: theme.text }}
              >
                <i className="bi bi-plus-square me-1"></i>
                JSON Designer 1
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link px-3 py-1 ${activeTab === 'designer2' ? 'active' : ''}`}
                onClick={() => setActiveTab('designer2')}
                style={activeTab === 'designer2' ? { backgroundColor: theme.primary } : { color: theme.text }}
              >
                <i className="bi bi-plus-square me-1"></i>
                JSON Designer 2
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link px-3 py-1 ${activeTab === 'apiTester' ? 'active' : ''}`}
                onClick={() => setActiveTab('apiTester')}
                style={activeTab === 'apiTester' ? { backgroundColor: theme.primary } : { color: theme.text }}
              >
                <i className="bi bi-cloud-arrow-up me-1"></i>
                API Tester
              </button>
            </li>
          </ul>

          {/* Settings Button */}
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowSettings(true)}
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Settings"
          >
            <i className="bi bi-gear-fill"></i>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ display: activeTab === 'viewEditCompare' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <ViewEditCompare
            onSendToDesigner1={(payload) => {
              setDesigner1Import(payload);
              setActiveTab('designer1');
            }}
            onSendToDesigner2={(payload) => {
              setDesigner2Import(payload);
              setActiveTab('designer2');
            }}
          />
        </div>
        <div style={{ display: activeTab === 'designer1' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <JsonCreator
            importPayload={designer1Import}
            appendPayload={designer1Append}
            onCopyToOther={(payload) => {
              setDesigner2Append(payload);
              setActiveTab('designer2');
            }}
            copyButtonLabel="Copy to Designer 2"
          />
        </div>
        <div style={{ display: activeTab === 'designer2' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <JsonCreator
            importPayload={designer2Import}
            appendPayload={designer2Append}
            onCopyToOther={(payload) => {
              setDesigner1Append(payload);
              setActiveTab('designer1');
            }}
            copyButtonLabel="Copy to Designer 1"
          />
        </div>
        <div style={{ display: activeTab === 'apiTester' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <ApiTester />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal show={showSettings} onHide={() => setShowSettings(false)} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
