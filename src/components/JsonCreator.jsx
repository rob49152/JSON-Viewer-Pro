import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Tree } from 'react-arborist';
import { useTheme } from '../context/ThemeContext.jsx';
import TemplateModal from './TemplateModal.jsx';
import Tooltip from './Tooltip.jsx';

function JsonCreator({ importPayload, appendPayload, onCopyToOther, copyButtonLabel = "Copy to Other" }) {
  const { theme, editorTheme, indentSize, treeIndent, treeRowHeight, treeHeight } = useTheme();
  const treeRef = useRef(null);
  const [data, setData] = useState([]);
  const [generatedJson, setGeneratedJson] = useState('');
  const [rootType, setRootType] = useState('object'); // 'object' or 'array'
  const [selectedId, setSelectedId] = useState(null);

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateMode, setTemplateMode] = useState('save');

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create a new node
  const createNode = (type = 'string') => ({
    id: generateId(),
    name: '', // key for objects
    nodeType: type,
    value: type === 'boolean' ? false : type === 'number' ? 0 : type === 'null' ? null : '',
    children: type === 'object' || type === 'array' ? [] : undefined
  });

  // Add node to root
  const addNode = (type = 'string') => {
    const newNode = createNode(type);
    setData(prev => [...prev, newNode]);
  };

  // Add child to a specific node
  const addChildNode = (parentId, type = 'string') => {
    const addChildToTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
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

  // Update a node
  const updateNode = (nodeId, updates) => {
    const updateInTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, ...updates };
          // Handle type changes
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

  // Delete a node
  const deleteNode = (nodeId) => {
    const deleteFromTree = (nodes) => {
      return nodes
        .filter(node => node.id !== nodeId)
        .map(node => {
          if (node.children) {
            return { ...node, children: deleteFromTree(node.children) };
          }
          return node;
        });
    };
    setData(prev => deleteFromTree(prev));
  };

  // Duplicate a node
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

  const assignNewIds = (node) => {
    node.id = generateId();
    if (node.children) {
      node.children.forEach(child => assignNewIds(child));
    }
  };

  // Handle drag and drop moves
  const onMove = ({ dragIds, parentId, index }) => {
    const moveNodes = (nodes, draggedNodes, targetParentId, targetIndex) => {
      // First, remove dragged nodes from their current positions
      const removeFromTree = (nodes) => {
        return nodes.reduce((acc, node) => {
          if (dragIds.includes(node.id)) {
            return acc;
          }
          const next = node.children
            ? { ...node, children: removeFromTree(node.children) }
            : node;
          acc.push(next);
          return acc;
        }, []);
      };

      // Find the dragged nodes
      const findNodes = (nodes, ids) => {
        let found = [];
        for (const node of nodes) {
          if (ids.includes(node.id)) {
            found.push(node);
          }
          if (node.children) {
            found = [...found, ...findNodes(node.children, ids)];
          }
        }
        return found;
      };

      const draggedNodesCopy = findNodes(nodes, dragIds);
      let cleanedTree = removeFromTree(nodes);

      // Insert at new position
      if (targetParentId === null) {
        // Moving to root
        cleanedTree.splice(targetIndex, 0, ...draggedNodesCopy);
        return cleanedTree;
      } else {
        // Moving into a parent
        const insertIntoParent = (nodes) => {
          return nodes.map(node => {
            if (node.id === targetParentId) {
              const newChildren = [...(node.children || [])];
              newChildren.splice(targetIndex, 0, ...draggedNodesCopy);
              return { ...node, children: newChildren };
            }
            if (node.children) {
              return { ...node, children: insertIntoParent(node.children) };
            }
            return node;
          });
        };
        return insertIntoParent(cleanedTree);
      }
    };

    setData(prev => moveNodes(prev, [], parentId, index));
  };

  // Build JSON from tree structure
  const buildJsonFromStructure = useCallback((nodes, parentType) => {
    if (parentType === 'array') {
      return nodes.map(node => {
        if (node.nodeType === 'object') {
          return buildJsonFromStructure(node.children || [], 'object');
        }
        if (node.nodeType === 'array') {
          return buildJsonFromStructure(node.children || [], 'array');
        }
        if (node.nodeType === 'number') {
          return parseFloat(node.value) || 0;
        }
        if (node.nodeType === 'boolean') {
          return node.value === true || node.value === 'true';
        }
        if (node.nodeType === 'null') {
          return null;
        }
        return node.value || '';
      });
    }

    // Object type
    const obj = {};
    nodes.forEach(node => {
      const key = node.name || `key_${node.id.slice(-4)}`;
      if (node.nodeType === 'object') {
        obj[key] = buildJsonFromStructure(node.children || [], 'object');
      } else if (node.nodeType === 'array') {
        obj[key] = buildJsonFromStructure(node.children || [], 'array');
      } else if (node.nodeType === 'number') {
        obj[key] = parseFloat(node.value) || 0;
      } else if (node.nodeType === 'boolean') {
        obj[key] = node.value === true || node.value === 'true';
      } else if (node.nodeType === 'null') {
        obj[key] = null;
      } else {
        obj[key] = node.value || '';
      }
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
    setSelectedId(null);
  };

  useEffect(() => {
    if (!importPayload || !importPayload.token) return;
    setData(Array.isArray(importPayload.data) ? importPayload.data : []);
    setRootType(importPayload.rootType === 'array' ? 'array' : 'object');
    setSelectedId(null);
  }, [importPayload]);

  // Handle appending nodes from other designer (doesn't replace, just adds)
  useEffect(() => {
    if (!appendPayload || !appendPayload.token) return;
    const nodesToAppend = Array.isArray(appendPayload.data) ? appendPayload.data : [];
    if (nodesToAppend.length > 0) {
      setData(prev => [...prev, ...nodesToAppend]);
    }
  }, [appendPayload]);

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

  const findNodeById = useCallback((nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return findNodeById(data, selectedId);
  }, [data, selectedId, findNodeById]);

  const selectedNodeHasChildren = useMemo(() => {
    return !!(selectedNode && selectedNode.children && selectedNode.children.length > 0);
  }, [selectedNode]);

  const handleCopyToOther = useCallback(() => {
    if (!selectedNode || !onCopyToOther) return;
    // Deep clone the selected node and assign new IDs
    const cloned = JSON.parse(JSON.stringify(selectedNode));
    assignNewIds(cloned);
    onCopyToOther({
      data: [cloned],
      rootType: 'object',
      token: Date.now()
    });
  }, [selectedNode, onCopyToOther]);

  const openTemplateModal = (mode) => {
    setTemplateMode(mode);
    setShowTemplateModal(true);
  };

  const getTemplateContent = () => {
    // Save both structure data and rootType
    return { data, rootType };
  };

  const handleTemplateLoad = (content) => {
    // Content should have data and rootType
    if (content && content.data) {
      // Assign new IDs to avoid conflicts
      const newData = JSON.parse(JSON.stringify(content.data));
      newData.forEach(node => assignNewIds(node));
      setData(newData);
      if (content.rootType) {
        setRootType(content.rootType);
      }
    }
    setSelectedId(null);
  };

  // Custom Node component for react-arborist
  const Node = ({ node, style, dragHandle }) => {
    const nodeData = node.data;
    const isContainer = nodeData.nodeType === 'object' || nodeData.nodeType === 'array';
    const showKey = true; // Always show key input for object items

    // Find parent to determine if we should show key
    const parentNode = node.parent;
    const isInArray = parentNode && parentNode.data?.nodeType === 'array';

    const indentPadding = Math.max(0, treeIndent) * node.level;
    const isInSelectedBranch = (() => {
      if (!selectedId || !selectedNodeHasChildren) return false;
      if (node.data.id === selectedId) return true;
      let current = node.parent;
      while (current) {
        if (current.data?.id === selectedId) return true;
        current = current.parent;
      }
      return false;
    })();

    return (
      <div
        ref={dragHandle}
        className="d-flex align-items-center p-2 rounded"
        onClick={() => {
          node.select();
          setSelectedId(node.data.id);
        }}
        onDoubleClick={() => node.isInternal && node.toggle()}
        style={{
          ...style,
          marginLeft: `${indentPadding}px`,
          width: `calc(100% - ${indentPadding}px)`,
          backgroundColor: isInSelectedBranch ? theme.surface : (node.isSelected ? `${theme.primary}20` : theme.surface),
          boxShadow: isInSelectedBranch ? 'inset 0 0 0 9999px rgba(255, 255, 255, 0.1)' : undefined,
          border: `1px solid ${node.isSelected ? theme.primary : theme.border}`,
          cursor: 'grab',
          marginBottom: '4px'
        }}
      >
        {/* Collapse/Expand Toggle (fixed column width) */}
        <span className="me-1" style={{ width: '20px', display: 'inline-flex', justifyContent: 'center' }}>
          {isContainer ? (
            <button
              className="btn btn-sm p-0"
              onClick={(e) => { e.stopPropagation(); node.toggle(); }}
              style={{ width: '20px', color: theme.text }}
            >
              <i className={`bi bi-chevron-${node.isOpen ? 'down' : 'right'}`}></i>
            </button>
          ) : (
            <span style={{ width: '20px' }}></span>
          )}
        </span>

        {/* Type Icon */}
        <span className="me-2" style={{ color: theme.primary }}>
          {nodeData.nodeType === 'object' && <i className="bi bi-braces"></i>}
          {nodeData.nodeType === 'array' && (
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
          {nodeData.nodeType === 'string' && <i className="bi bi-fonts"></i>}
          {nodeData.nodeType === 'number' && <i className="bi bi-123"></i>}
          {nodeData.nodeType === 'boolean' && <i className="bi bi-toggle-on"></i>}
          {nodeData.nodeType === 'null' && <i className="bi bi-dash-circle"></i>}
        </span>

        {/* Drag Handle Indicator */}
        <span className="me-2 text-muted" style={{ cursor: 'grab' }}>
          <i className="bi bi-grip-vertical"></i>
        </span>

        {/* Key Input (for objects, not arrays) */}
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
            value={nodeData.name || ''}
            onChange={(e) => { e.stopPropagation(); updateNode(nodeData.id, { name: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Type Selector */}
        <select
          className="form-select form-select-sm me-2"
          style={{
            width: '90px',
            backgroundColor: editorTheme.editorBg,
            color: editorTheme.text,
            borderColor: theme.border
          }}
          value={nodeData.nodeType}
          onChange={(e) => { e.stopPropagation(); updateNode(nodeData.id, { nodeType: e.target.value }); }}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="null">Null</option>
          <option value="object">Object</option>
          <option value="array">Array</option>
        </select>

        {/* Value Input */}
        {!isContainer && nodeData.nodeType !== 'null' && (
          <>
            {nodeData.nodeType === 'boolean' ? (
              <select
                className="form-select form-select-sm me-2"
                style={{
                  width: '70px',
                  backgroundColor: editorTheme.editorBg,
                  color: editorTheme.text,
                  borderColor: theme.border
                }}
                value={String(nodeData.value)}
                onChange={(e) => { e.stopPropagation(); updateNode(nodeData.id, { value: e.target.value === 'true' }); }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input
                type={nodeData.nodeType === 'number' ? 'number' : 'text'}
                className="form-control form-control-sm me-2 flex-grow-1"
                style={{
                  backgroundColor: editorTheme.editorBg,
                  color: editorTheme.text,
                  borderColor: theme.border
                }}
                placeholder="value"
                value={nodeData.value ?? ''}
                onChange={(e) => { e.stopPropagation(); updateNode(nodeData.id, { value: e.target.value }); }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </>
        )}

        {nodeData.nodeType === 'null' && (
          <span className="text-muted me-2 flex-grow-1 small">null</span>
        )}

        {isContainer && (
          <span className="text-muted me-2 flex-grow-1 small">
            {nodeData.children?.length || 0} items
          </span>
        )}

        {/* Action Buttons */}
        <div className="btn-group btn-group-sm ms-auto">
          {isContainer && (
            <Tooltip text="Add Child" placement="top">
              <button
                className="btn btn-outline-success btn-sm"
                onClick={(e) => { e.stopPropagation(); addChildNode(nodeData.id); }}
              >
                <i className="bi bi-plus"></i>
              </button>
            </Tooltip>
          )}
          <Tooltip text="Duplicate" placement="top">
            <button
              className="btn btn-outline-info btn-sm"
              onClick={(e) => { e.stopPropagation(); duplicateNode(nodeData.id); }}
            >
              <i className="bi bi-files"></i>
            </button>
          </Tooltip>
          <Tooltip text="Delete" placement="top">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={(e) => { e.stopPropagation(); deleteNode(nodeData.id); }}
            >
              <i className="bi bi-trash"></i>
            </button>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex" style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Left Panel - Structure Builder */}
      <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div className="p-2 border-bottom d-flex align-items-center justify-content-between" style={{ backgroundColor: theme.surface, borderColor: theme.border, flexShrink: 0 }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-diagram-2 me-2" style={{ color: theme.primary }}></i>
            <span className="fw-semibold">JSON Structure Builder</span>
            <span className="badge bg-info ms-2" style={{ fontSize: '10px' }}>Drag & Drop</span>
          </div>
          <div className="d-flex gap-1 align-items-center">
            {/* Root Type Selector */}
            <select
              className="form-select form-select-sm"
              style={{ width: '90px', backgroundColor: editorTheme.editorBg, color: editorTheme.text, borderColor: theme.border }}
              value={rootType}
              onChange={(e) => setRootType(e.target.value)}
            >
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>

            {/* Templates Dropdown */}
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
            <Tooltip text="Expand All" placement="top">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => treeRef.current?.openAll()}>
                <i className="bi bi-arrows-expand"></i>
              </button>
            </Tooltip>
            <Tooltip text="Collapse All" placement="top">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => treeRef.current?.closeAll()}>
                <i className="bi bi-arrows-collapse"></i>
              </button>
            </Tooltip>
            <div className="btn-group btn-group-sm">
              <Tooltip text="Save as Template" placement="top">
                <button className="btn btn-outline-warning btn-sm" onClick={() => openTemplateModal('save')}>
                  <i className="bi bi-floppy"></i>
                </button>
              </Tooltip>
              <Tooltip text="Import Template" placement="top">
                <button className="btn btn-outline-warning btn-sm" onClick={() => openTemplateModal('load')}>
                  <i className="bi bi-filetype-json"></i>
                </button>
              </Tooltip>
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
          <div className="d-flex gap-1 justify-content-between">
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
            {onCopyToOther && (
              <Tooltip text={copyButtonLabel} placement="top">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleCopyToOther}
                  disabled={!selectedId}
                  style={{ opacity: selectedId ? 1 : 0.5 }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  {copyButtonLabel}
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Structure Tree */}
        <div
          className="flex-grow-1 overflow-auto p-2"
          style={{ backgroundColor: editorTheme.editorBg, minHeight: 0, height: `${treeHeight}px` }}
        >
          {data.length > 0 ? (
            <Tree
              ref={treeRef}
              data={data}
              onMove={onMove}
              width="100%"
              height={treeHeight}
              indent={treeIndent}
              rowHeight={treeRowHeight}
              openByDefault={true}
              disableMultiSelection={true}
            >
              {Node}
            </Tree>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox display-4 d-block mb-3"></i>
              <p>No properties added yet.</p>
              <p className="small">Click the buttons above to add properties, or select a template.</p>
              <p className="small text-info">
                <i className="bi bi-info-circle me-1"></i>
                Drag and drop nodes to reorder them!
              </p>
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

        {/* Generated JSON Output */}
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

      {/* Template Modal */}
      <TemplateModal
        show={showTemplateModal}
        onHide={() => setShowTemplateModal(false)}
        mode={templateMode}
        onLoad={handleTemplateLoad}
        currentContent={getTemplateContent()}
        contentType="designer"
      />
    </div>
  );
}

export default JsonCreator;
