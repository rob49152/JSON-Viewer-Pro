import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { listTemplates, getTemplate, saveTemplate, deleteTemplate } from '../services/templateApi.js';

function TemplateModal({ show, onHide, mode, onLoad, currentContent, contentType = 'json' }) {
  const { theme } = useTheme();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Save mode state
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  // Load mode state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  useEffect(() => {
    if (show) {
      fetchTemplates();
      setError(null);
      setSuccess(null);
      setTemplateName('');
      setDescription('');
      setSelectedTemplate(null);
      setPreviewContent(null);
    }
  }, [show]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const list = await listTemplates();
      // Filter by content type if needed
      const filtered = list.filter(t => t.type === contentType || t.type === 'json');
      setTemplates(filtered);
    } catch (err) {
      setError('Failed to load templates. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await saveTemplate(templateName.trim(), currentContent, contentType, description);
      setSuccess(`Template "${templateName}" saved successfully!`);
      setTemplateName('');
      setDescription('');
      fetchTemplates();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    setLoading(true);
    try {
      const data = await getTemplate(template.name);
      setPreviewContent(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = () => {
    if (selectedTemplate && previewContent !== null) {
      onLoad(previewContent);
      onHide();
    }
  };

  const handleDelete = async (templateName, e) => {
    e.stopPropagation();
    if (!confirm(`Delete template "${templateName}"?`)) return;

    setLoading(true);
    try {
      await deleteTemplate(templateName);
      setSuccess(`Template "${templateName}" deleted`);
      fetchTemplates();
      if (selectedTemplate?.name === templateName) {
        setSelectedTemplate(null);
        setPreviewContent(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} onClick={onHide}></div>
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1055 }}
        tabIndex="-1"
        onClick={onHide}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-content" style={{ backgroundColor: theme.surface, color: theme.text }}>
            <div className="modal-header py-2" style={{ borderColor: theme.border }}>
              <h5 className="modal-title d-flex align-items-center" style={{ fontSize: '1rem' }}>
                <i className={`bi ${mode === 'save' ? 'bi-floppy' : 'bi-folder-open'} me-2`} style={{ color: theme.primary }}></i>
                {mode === 'save' ? 'Save as Template' : 'Load Template'}
              </h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {error && (
                <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}

              {mode === 'save' && (
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Template Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
                  />
                  <small className="text-muted">Special characters will be replaced with underscores</small>

                  <label className="form-label mt-3" style={{ fontSize: '0.85rem' }}>Description (optional)</label>
                  <textarea
                    className="form-control"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of this template..."
                    rows={2}
                    style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
                  />
                </div>
              )}

              {/* Templates List */}
              <div className="mb-3">
                <label className="form-label d-flex justify-content-between align-items-center" style={{ fontSize: '0.85rem' }}>
                  <span>{mode === 'save' ? 'Existing Templates' : 'Available Templates'}</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={fetchTemplates}
                    disabled={loading}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </label>

                {loading && templates.length === 0 ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                    No templates saved yet
                  </div>
                ) : (
                  <div className="list-group" style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {templates.map(template => (
                      <div
                        key={template.name}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                          selectedTemplate?.name === template.name ? 'active' : ''
                        }`}
                        style={{
                          backgroundColor: selectedTemplate?.name === template.name ? theme.primary : theme.background,
                          color: selectedTemplate?.name === template.name ? '#fff' : theme.text,
                          borderColor: theme.border,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div>
                          <div className="fw-medium">{template.name}</div>
                          {template.description && (
                            <small className={selectedTemplate?.name === template.name ? 'text-white-50' : 'text-muted'}>
                              {template.description}
                            </small>
                          )}
                          <small className={`d-block ${selectedTemplate?.name === template.name ? 'text-white-50' : 'text-muted'}`}>
                            {formatDate(template.modifiedAt)}
                          </small>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => handleDelete(template.name, e)}
                          title="Delete template"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview for Load mode */}
              {mode === 'load' && previewContent !== null && (
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Preview</label>
                  <pre
                    className="p-2 rounded"
                    style={{
                      backgroundColor: theme.background,
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      maxHeight: '150px',
                      overflow: 'auto',
                      fontSize: '0.75rem'
                    }}
                  >
                    {typeof previewContent === 'string'
                      ? previewContent.substring(0, 500) + (previewContent.length > 500 ? '...' : '')
                      : JSON.stringify(previewContent, null, 2).substring(0, 500)
                    }
                  </pre>
                </div>
              )}
            </div>
            <div className="modal-footer py-2" style={{ borderColor: theme.border }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onHide}>
                Cancel
              </button>
              {mode === 'save' ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={loading || !templateName.trim()}
                >
                  <i className="bi bi-floppy me-1"></i>
                  Save Template
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleLoad}
                  disabled={loading || !selectedTemplate}
                >
                  <i className="bi bi-folder-open me-1"></i>
                  Load Template
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TemplateModal;
