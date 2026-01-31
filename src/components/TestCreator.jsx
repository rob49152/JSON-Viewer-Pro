import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import Tooltip from './Tooltip.jsx';

function TestCreator() {
  const {
    theme,
    editorTheme,
    indentSize,
    treeIndent,
    treeRowHeight,
    treeHeight
  } = useTheme();

  const [data, setData] = useState([]);
  const [generatedJson, setGeneratedJson] = useState('');
  const [rootType, setRootType] = useState('object');
  const [dragOver, setDragOver] = useState(null);
  const dragIdRef = useRef(null);

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createNode = (type = 'string') => ({
    id: generateId(),
    name: '',
    nodeType: type,
    value: type === 'boolean' ? false : type === 'number' ? 0 : type === 'null' ? null : '',
    isOpen: true,
    children: type === 'object' || type === 'array' ? [] : undefined
  });

  const addNode = (type = 'string') => {
    const newNode = createNode(type);
    setData(prev => [...prev, newNode]);
  };

  const addChildNode = (parentId, type = 'string') => {
    const addChildToTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            isOpen: true,
            children: [...(node.children || []), createNode(type)]
          };
        }
        if (node.children) {
          return { ...node, children: addChildToTree(node.children) };
        }
        return node;
      });
    };
    setData(prev => addChildToTree(prev));
  };

  const updateNode = (nodeId, updates) => {
    const updateInTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, ...updates };
          if (updates.nodeType) {
            if (updates.nodeType === 'object' || updates.nodeType === 'array') {
              updatedNode.children = updatedNode.children || [];
              updatedNode.value = null;
            } else {
              delete updatedNode.children;
              if (updates.nodeType === 'boolean') updatedNode.value = false;
              else if (updates.nodeType === 'number') updatedNode.value = 0;
              else if (updates.nodeType === 'null') updatedNode.value = null;
              else updatedNode.value = '';
            }
          }
          return updatedNode;
        }
        if (node.children) {
          return { ...node, children: updateInTree(node.children) };
        }
        return node;
      });
    };
    setData(prev => updateInTree(prev));
  };

  const toggleNode = (nodeId) => {
    const toggleInTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleInTree(node.children) };
        }
        return node;
      });
    };
    setData(prev => toggleInTree(prev));
  };

  const deleteNode = (nodeId) => {
    const deleteFromTree = (nodes) => {
      return nodes
        .filter(node => node.id !== nodeId)
        .map(node => (node.children ? { ...node, children: deleteFromTree(node.children) } : node));
    };
    setData(prev => deleteFromTree(prev));
  };

  const assignNewIds = (node) => {
    node.id = generateId();
    if (node.children) {
      node.children.forEach(child => assignNewIds(child));
    }
  };

  const removeNodeById = (nodes, nodeId) => {
    let removedNode = null;
    const nextNodes = nodes
      .map(node => {
        if (node.id === nodeId) {
          removedNode = node;
          return null;
        }
        if (node.children) {
          const result = removeNodeById(node.children, nodeId);
          if (result.removedNode) removedNode = result.removedNode;
          return { ...node, children: result.nodes };
        }
        return node;
      })
      .filter(Boolean);

    return { nodes: nextNodes, removedNode };
  };

  const insertNodeAt = (nodes, parentId, index, nodeToInsert) => {
    if (parentId == null) {
      const next = [...nodes];
      next.splice(index, 0, nodeToInsert);
      return next;
    }

    return nodes.map(node => {
      if (node.id === parentId) {
        const children = [...(node.children || [])];
        children.splice(index, 0, nodeToInsert);
        return { ...node, isOpen: true, children };
      }
      if (node.children) {
        return { ...node, children: insertNodeAt(node.children, parentId, index, nodeToInsert) };
      }
      return node;
    });
  };

  const findParentAndIndex = (nodes, nodeId, parentId = null) => {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.id === nodeId) {
        return { parentId, index: i, node };
      }
      if (node.children) {
        const result = findParentAndIndex(node.children, nodeId, node.id);
        if (result) return result;
      }
    }
    return null;
  };

  const containsNodeId = (node, targetId) => {
    if (!node) return false;
    if (node.id === targetId) return true;
    if (!node.children) return false;
    return node.children.some(child => containsNodeId(child, targetId));
  };

  const handleDropOnNode = (targetId, position) => {
    if (!targetId) return;
    setData(prev => {
      const dragId = dragIdRef.current;
      if (!dragId || dragId === targetId) return prev;

      const targetInfo = findParentAndIndex(prev, targetId);
      if (!targetInfo) return prev;

      const { nodes: cleaned, removedNode } = removeNodeById(prev, dragId);
      if (!removedNode) return prev;

      if (containsNodeId(removedNode, targetId)) return prev;

      if (position === 'inside' && (targetInfo.node.nodeType === 'object' || targetInfo.node.nodeType === 'array')) {
        return insertNodeAt(cleaned, targetInfo.node.id, targetInfo.node.children?.length || 0, removedNode);
      }

      if (position === 'above') {
        return insertNodeAt(cleaned, targetInfo.parentId, targetInfo.index, removedNode);
      }

      return insertNodeAt(cleaned, targetInfo.parentId, targetInfo.index + 1, removedNode);
    });
  };

  const handleDropOnRoot = () => {
    setData(prev => {
      const dragId = dragIdRef.current;
      if (!dragId) return prev;

      const { nodes: cleaned, removedNode } = removeNodeById(prev, dragId);
      if (!removedNode) return prev;

      return insertNodeAt(cleaned, null, cleaned.length, removedNode);
    });
  };

  const duplicateNode = (nodeId) => {
    const duplicateInTree = (nodes) => {
      const result = [];
      for (const node of nodes) {
        result.push(node.children ? { ...node, children: duplicateInTree(node.children) } : node);
        if (node.id === nodeId) {
          const cloned = JSON.parse(JSON.stringify(node));
          assignNewIds(cloned);
          cloned.name = cloned.name ? `${cloned.name}_copy` : '';
          result.push(cloned);
        }
      }
      return result;
    };
    setData(prev => duplicateInTree(prev));
  };

  const buildJsonFromStructure = useCallback((nodes, parentType) => {
    if (parentType === 'array') {
      return nodes.map(node => {
        if (node.nodeType === 'object') return buildJsonFromStructure(node.children || [], 'object');
        if (node.nodeType === 'array') return buildJsonFromStructure(node.children || [], 'array');
        if (node.nodeType === 'number') return parseFloat(node.value) || 0;
        if (node.nodeType === 'boolean') return node.value === true || node.value === 'true';
        if (node.nodeType === 'null') return null;
        return node.value || '';
      });
    }

    const obj = {};
    nodes.forEach(node => {
      const key = node.name || `key_${node.id.slice(-4)}`;
      if (node.nodeType === 'object') obj[key] = buildJsonFromStructure(node.children || [], 'object');
      else if (node.nodeType === 'array') obj[key] = buildJsonFromStructure(node.children || [], 'array');
      else if (node.nodeType === 'number') obj[key] = parseFloat(node.value) || 0;
      else if (node.nodeType === 'boolean') obj[key] = node.value === true || node.value === 'true';
      else if (node.nodeType === 'null') obj[key] = null;
      else obj[key] = node.value || '';
    });
    return obj;
  }, []);

  useEffect(() => {
    try {
      const json = buildJsonFromStructure(data, rootType);
      setGeneratedJson(JSON.stringify(json, null, indentSize));
    } catch (e) {
      setGeneratedJson(`Error: ${e.message}`);
    }
  }, [data, rootType, indentSize, buildJsonFromStructure]);

  const copyGeneratedJson = async () => {
    try {
      await navigator.clipboard.writeText(generatedJson);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const downloadGeneratedJson = () => {
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'created.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearStructure = () => {
    setData([]);
    setGeneratedJson('');
  };

  const loadTemplate = (templateType) => {
    let template;
    switch (templateType) {
      case 'package':
        template = [
          { id: generateId(), name: 'name', nodeType: 'string', value: 'my-project' },
          { id: generateId(), name: 'version', nodeType: 'string', value: '1.0.0' },
          { id: generateId(), name: 'description', nodeType: 'string', value: '' },
          { id: generateId(), name: 'main', nodeType: 'string', value: 'index.js' },
          { id: generateId(), name: 'scripts', nodeType: 'object', children: [
            { id: generateId(), name: 'start', nodeType: 'string', value: 'node index.js' },
            { id: generateId(), name: 'test', nodeType: 'string', value: 'echo "No tests"' }
          ]},
          { id: generateId(), name: 'dependencies', nodeType: 'object', children: [] },
          { id: generateId(), name: 'devDependencies', nodeType: 'object', children: [] }
        ];
        setRootType('object');
        break;
      case 'config':
        template = [
          { id: generateId(), name: 'appName', nodeType: 'string', value: 'My App' },
          { id: generateId(), name: 'debug', nodeType: 'boolean', value: false },
          { id: generateId(), name: 'port', nodeType: 'number', value: 3000 },
          { id: generateId(), name: 'database', nodeType: 'object', children: [
            { id: generateId(), name: 'host', nodeType: 'string', value: 'localhost' },
            { id: generateId(), name: 'port', nodeType: 'number', value: 5432 },
            { id: generateId(), name: 'name', nodeType: 'string', value: 'mydb' }
          ]},
          { id: generateId(), name: 'features', nodeType: 'array', children: [
            { id: generateId(), name: '', nodeType: 'string', value: 'feature1' },
            { id: generateId(), name: '', nodeType: 'string', value: 'feature2' }
          ]}
        ];
        setRootType('object');
        break;
      case 'api':
        template = [
          { id: generateId(), name: 'success', nodeType: 'boolean', value: true },
          { id: generateId(), name: 'status', nodeType: 'number', value: 200 },
          { id: generateId(), name: 'message', nodeType: 'string', value: 'OK' },
          { id: generateId(), name: 'data', nodeType: 'object', children: [
            { id: generateId(), name: 'id', nodeType: 'number', value: 1 },
            { id: generateId(), name: 'items', nodeType: 'array', children: [] }
          ]},
          { id: generateId(), name: 'meta', nodeType: 'object', children: [
            { id: generateId(), name: 'total', nodeType: 'number', value: 0 },
            { id: generateId(), name: 'page', nodeType: 'number', value: 1 },
            { id: generateId(), name: 'limit', nodeType: 'number', value: 10 }
          ]}
        ];
        setRootType('object');
        break;
      default:
        template = [];
    }
    setData(template);
    setGeneratedJson('');
  };

  const renderNodes = (nodes, level = 0, parentType = rootType) => {
    return nodes.map(node => {
      const isContainer = node.nodeType === 'object' || node.nodeType === 'array';
      const isInArray = parentType === 'array';
      const paddingLeft = Math.max(0, treeIndent) * level;

      return (
        <div key={node.id}>
          <div
            className="d-flex align-items-center p-2 rounded"
            draggable
            onDragStart={(e) => {
              dragIdRef.current = node.id;
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
              dragIdRef.current = null;
              setDragOver(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const offset = e.clientY - rect.top;
              const upper = rect.height * 0.25;
              const lower = rect.height * 0.75;
              let position = 'below';
              if (offset < upper) position = 'above';
              else if (offset > lower) position = 'below';
              else position = isContainer ? 'inside' : 'below';
              setDragOver({ id: node.id, position });
            }}
            onDrop={(e) => {
              e.preventDefault();
              const position = dragOver?.id === node.id ? dragOver.position : 'below';
              setDragOver(null);
              handleDropOnNode(node.id, position);
            }}
            style={{
              height: `${treeRowHeight}px`,
              marginLeft: `${paddingLeft}px`,
              width: `calc(100% - ${paddingLeft}px)`,
              backgroundColor: dragOver?.id === node.id && dragOver.position === 'inside' ? `${theme.primary}20` : theme.surface,
              border: `1px solid ${dragOver?.id === node.id ? theme.primary : theme.border}`,
              borderTop: dragOver?.id === node.id && dragOver.position === 'above' ? `2px solid ${theme.primary}` : undefined,
              borderBottom: dragOver?.id === node.id && dragOver.position === 'below' ? `2px solid ${theme.primary}` : undefined,
              cursor: 'default',
              marginTop: dragOver?.id === node.id && dragOver.position === 'above' ? '10px' : undefined,
              marginBottom: dragOver?.id === node.id && dragOver.position === 'below' ? '10px' : '4px'
            }}
          >
            <span className="me-1" style={{ width: '20px', display: 'inline-flex', justifyContent: 'center' }}>
              {isContainer ? (
                <button
                  className="btn btn-sm p-0"
                  onClick={() => toggleNode(node.id)}
                  style={{ width: '20px', color: theme.text }}
                >
                  <i className={`bi bi-chevron-${node.isOpen ? 'down' : 'right'}`}></i>
                </button>
              ) : (
                <span style={{ width: '20px' }}></span>
              )}
            </span>

            <span className="me-2" style={{ color: theme.primary }}>
              {node.nodeType === 'object' && <i className="bi bi-braces"></i>}
              {node.nodeType === 'array' && (
                <span
                  style={{
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    fontSize: '0.75rem',
                    lineHeight: 1
                  }}
                >
                  []
                </span>
              )}
              {node.nodeType === 'string' && <i className="bi bi-fonts"></i>}
              {node.nodeType === 'number' && <i className="bi bi-123"></i>}
              {node.nodeType === 'boolean' && <i className="bi bi-toggle-on"></i>}
              {node.nodeType === 'null' && <i className="bi bi-dash-circle"></i>}
            </span>

            <span className="me-2 text-muted">
              <i className="bi bi-grip-vertical"></i>
            </span>

            {!isInArray && (
              <input
                type="text"
                className="form-control form-control-sm me-2"
                style={{
                  width: '100px',
                  backgroundColor: editorTheme.editorBg,
                  color: editorTheme.text,
                  borderColor: theme.border
                }}
                placeholder="key"
                value={node.name || ''}
                onChange={(e) => updateNode(node.id, { name: e.target.value })}
              />
            )}

            <select
              className="form-select form-select-sm me-2"
              style={{
                width: '90px',
                backgroundColor: editorTheme.editorBg,
                color: editorTheme.text,
                borderColor: theme.border
              }}
              value={node.nodeType}
              onChange={(e) => updateNode(node.id, { nodeType: e.target.value })}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="null">Null</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>

            {!isContainer && node.nodeType !== 'null' && (
              node.nodeType === 'boolean' ? (
                <select
                  className="form-select form-select-sm me-2"
                  style={{
                    width: '70px',
                    backgroundColor: editorTheme.editorBg,
                    color: editorTheme.text,
                    borderColor: theme.border
                  }}
                  value={String(node.value)}
                  onChange={(e) => updateNode(node.id, { value: e.target.value === 'true' })}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  type={node.nodeType === 'number' ? 'number' : 'text'}
                  className="form-control form-control-sm me-2 flex-grow-1"
                  style={{
                    backgroundColor: editorTheme.editorBg,
                    color: editorTheme.text,
                    borderColor: theme.border
                  }}
                  placeholder="value"
                  value={node.value ?? ''}
                  onChange={(e) => updateNode(node.id, { value: e.target.value })}
                />
              )
            )}

            {node.nodeType === 'null' && (
              <span className="text-muted me-2 flex-grow-1 small">null</span>
            )}

            {isContainer && (
              <span className="text-muted me-2 flex-grow-1 small">
                {node.children?.length || 0} items
              </span>
            )}

            <div className="btn-group btn-group-sm ms-auto">
              {isContainer && (
                <Tooltip text="Add Child" placement="top">
                  <button className="btn btn-outline-success btn-sm" onClick={() => addChildNode(node.id)}>
                    <i className="bi bi-plus"></i>
                  </button>
                </Tooltip>
              )}
              <Tooltip text="Duplicate" placement="top">
                <button className="btn btn-outline-info btn-sm" onClick={() => duplicateNode(node.id)}>
                  <i className="bi bi-files"></i>
                </button>
              </Tooltip>
              <Tooltip text="Delete" placement="top">
                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteNode(node.id)}>
                  <i className="bi bi-trash"></i>
                </button>
              </Tooltip>
            </div>
          </div>

          {isContainer && node.isOpen && node.children?.length > 0 && (
            <div>
              {renderNodes(node.children, level + 1, node.nodeType)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="d-flex" style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Left Panel - Structure Builder */}
      <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div className="p-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-diagram-2 me-2" style={{ color: theme.primary }}></i>
            <span className="fw-semibold">JSON Structure Builder (TEST)</span>
            <span className="badge bg-info ms-2" style={{ fontSize: '10px' }}>Standalone Tree</span>
          </div>
          <div className="d-flex gap-1 align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ width: '90px', backgroundColor: editorTheme.editorBg, color: editorTheme.text, borderColor: theme.border }}
              value={rootType}
              onChange={(e) => setRootType(e.target.value)}
            >
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>

            <div className="dropdown">
              <button className="btn btn-outline-info btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-file-earmark-text me-1"></i>
                Templates
              </button>
              <ul className="dropdown-menu" style={{ backgroundColor: theme.surface }}>
                <li>
                  <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadTemplate('package')}>
                    <i className="bi bi-box me-2"></i>package.json
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadTemplate('config')}>
                    <i className="bi bi-gear me-2"></i>Config File
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" style={{ color: theme.text }} onClick={() => loadTemplate('api')}>
                    <i className="bi bi-cloud me-2"></i>API Response
                  </button>
                </li>
              </ul>
            </div>

            <Tooltip text="Clear All" placement="top">
              <button className="btn btn-outline-danger btn-sm" onClick={clearStructure}>
                <i className="bi bi-trash"></i>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Add Root Property Button */}
        <div className="p-2 border-bottom" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex gap-1">
            <Tooltip text="Add String" placement="top">
              <button className="btn btn-outline-primary btn-sm" onClick={() => addNode('string')}>
                <i className="bi bi-fonts me-1"></i>String
              </button>
            </Tooltip>
            <Tooltip text="Add Number" placement="top">
              <button className="btn btn-outline-primary btn-sm" onClick={() => addNode('number')}>
                <i className="bi bi-123 me-1"></i>Number
              </button>
            </Tooltip>
            <Tooltip text="Add Boolean" placement="top">
              <button className="btn btn-outline-primary btn-sm" onClick={() => addNode('boolean')}>
                <i className="bi bi-toggle-on me-1"></i>Bool
              </button>
            </Tooltip>
            <Tooltip text="Add Object" placement="top">
              <button className="btn btn-outline-success btn-sm" onClick={() => addNode('object')}>
                <i className="bi bi-braces me-1"></i>Object
              </button>
            </Tooltip>
            <Tooltip text="Add Array" placement="top">
              <button className="btn btn-outline-success btn-sm" onClick={() => addNode('array')}>
                <i className="bi bi-brackets me-1"></i>Array
              </button>
            </Tooltip>
            <Tooltip text="Add Null" placement="top">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => addNode('null')}>
                <i className="bi bi-dash-circle me-1"></i>Null
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Structure Tree */}
        <div
          className="flex-grow-1 overflow-auto p-2"
          style={{ backgroundColor: theme.background, minHeight: 0, height: `${treeHeight}px` }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(null);
            handleDropOnRoot();
          }}
        >
          {data.length > 0 ? (
            <div>
              {renderNodes(data, 0, rootType)}
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox display-4 d-block mb-3"></i>
              <p>No properties added yet.</p>
              <p className="small">Click the buttons above to add properties, or select a template.</p>
            </div>
          )}
        </div>
      </div>

      {/* Center Controls */}
      <div
        className="d-flex flex-column gap-2 p-3 justify-content-center align-items-center"
        style={{
          minWidth: '60px',
          backgroundColor: theme.surface,
          borderLeft: `1px solid ${theme.border}`,
          borderRight: `1px solid ${theme.border}`
        }}
      >
        <i className="bi bi-lightning-charge" style={{ color: theme.primary }}></i>
        <span className="text-muted small text-center" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          Auto
        </span>
      </div>

      {/* Right Panel - Generated JSON */}
      <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div className="p-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-file-earmark-code me-2" style={{ color: theme.primary }}></i>
            <span className="fw-semibold">Generated JSON</span>
            <span className="badge bg-secondary ms-2" style={{ fontSize: '10px' }}>
              {rootType === 'object' ? '{ }' : '[ ]'}
            </span>
          </div>
          <div className="d-flex gap-1">
            <Tooltip text="Copy to Clipboard" placement="top">
              <button className="btn btn-outline-secondary btn-sm" onClick={copyGeneratedJson} disabled={!generatedJson}>
                <i className="bi bi-clipboard"></i>
              </button>
            </Tooltip>
            <Tooltip text="Download JSON" placement="top">
              <button className="btn btn-outline-secondary btn-sm" onClick={downloadGeneratedJson} disabled={!generatedJson}>
                <i className="bi bi-download"></i>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto" style={{ backgroundColor: editorTheme.editorBg }}>
          {generatedJson ? (
            <pre
              className="m-0 p-3 h-100"
              style={{
                color: editorTheme.editorText,
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {generatedJson}
            </pre>
          ) : (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
              <i className="bi bi-code-slash display-4 mb-3"></i>
              <p>Generated JSON will appear here</p>
              <p className="small">Build your structure on the left, then click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestCreator;