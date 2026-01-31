import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext.jsx';

const STORAGE_KEY_POSITION = 'jsonViewerGraphModalPosition';
const STORAGE_KEY_SIZE = 'jsonViewerGraphModalSize';

const DEFAULT_POSITION = { x: null, y: null };
const MIN_SIZE = { width: 600, height: 400 };

function JsonGraphModal({ show, onHide, json }) {
  const {
    theme,
    graphNodeWidth,
    graphNodeHeight,
    graphNodeSpacingX,
    graphNodeSpacingY,
    graphModalWidthPercent,
    graphModalHeightPercent
  } = useTheme();

  // Calculate default size based on settings
  const DEFAULT_SIZE = {
    width: Math.round(window.innerWidth * graphModalWidthPercent / 100),
    height: Math.round(window.innerHeight * graphModalHeightPercent / 100)
  };
  const modalRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [error, setError] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSITION);
      return saved ? JSON.parse(saved) : DEFAULT_POSITION;
    } catch {
      return DEFAULT_POSITION;
    }
  });

  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SIZE);
      return saved ? JSON.parse(saved) : DEFAULT_SIZE;
    } catch {
      return DEFAULT_SIZE;
    }
  });

  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify(size));
  }, [size]);

  const getPosition = useCallback(() => {
    if (position.x !== null && position.y !== null) {
      return position;
    }
    return {
      x: Math.max(0, (window.innerWidth - size.width) / 2),
      y: Math.max(0, (window.innerHeight - size.height) / 2)
    };
  }, [position, size]);

  // Convert JSON to hierarchical tree structure
  const jsonToTree = useCallback((data, key = 'root', path = '$') => {
    const type = Array.isArray(data) ? 'array' : typeof data === 'object' && data !== null ? 'object' : typeof data;

    let displayValue = '';
    let children = [];

    if (type === 'object') {
      displayValue = `{${Object.keys(data).length}}`;
      children = Object.entries(data).map(([k, v], i) =>
        jsonToTree(v, k, `${path}.${k}`)
      );
    } else if (type === 'array') {
      displayValue = `[${data.length}]`;
      children = data.map((item, i) =>
        jsonToTree(item, `${i}`, `${path}[${i}]`)
      );
    } else if (data === null) {
      displayValue = 'null';
    } else if (type === 'string') {
      displayValue = data.length > 20 ? `"${data.substring(0, 17)}..."` : `"${data}"`;
    } else if (type === 'boolean') {
      displayValue = String(data);
    } else {
      displayValue = String(data);
    }

    return {
      key,
      value: displayValue,
      type,
      path,
      children: children.length > 0 ? children : undefined
    };
  }, []);

  // Get node colors based on type (JSON Crack style)
  const getTypeColor = useCallback((type) => {
    switch (type) {
      case 'object': return { bg: '#6366f1', border: '#4f46e5', text: '#fff' }; // Purple
      case 'array': return { bg: '#f59e0b', border: '#d97706', text: '#fff' };  // Orange
      case 'string': return { bg: '#10b981', border: '#059669', text: '#fff' }; // Green
      case 'number': return { bg: '#3b82f6', border: '#2563eb', text: '#fff' }; // Blue
      case 'boolean': return { bg: '#ec4899', border: '#db2777', text: '#fff' }; // Pink
      case 'null': return { bg: '#6b7280', border: '#4b5563', text: '#fff' };   // Gray
      default: return { bg: '#6b7280', border: '#4b5563', text: '#fff' };
    }
  }, []);

  // Create the tree visualization
  useEffect(() => {
    if (!show || !svgRef.current || !json) return;

    try {
      const parsed = JSON.parse(json);
      setError(null);
      const treeData = jsonToTree(parsed);

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const width = size.width - 2;
      const height = size.height - 60;

      // Create hierarchy
      const root = d3.hierarchy(treeData);

      // Calculate tree dimensions based on node count
      const nodeCount = root.descendants().length;
      const treeWidth = Math.max(width, nodeCount * 50);
      const treeHeight = Math.max(height, root.height * (graphNodeHeight + graphNodeSpacingY * 4) + 100);

      // Create tree layout (horizontal - left to right)
      const treeLayout = d3.tree()
        .nodeSize([graphNodeHeight + graphNodeSpacingY * 2, graphNodeWidth + graphNodeSpacingX])
        .separation((a, b) => a.parent === b.parent ? 1.2 : 1.5);

      treeLayout(root);

      // Create container group for zoom/pan
      const g = svg.append('g');

      // Zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Calculate bounds to center the tree
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      root.descendants().forEach(d => {
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
      });

      // Draw links (curved connectors)
      const linkGenerator = d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);

      g.append('g')
        .attr('fill', 'none')
        .attr('stroke', theme.border)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.5)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', d => {
          // Custom path for better looking connections
          const sourceX = d.source.y + graphNodeWidth / 2;
          const sourceY = d.source.x;
          const targetX = d.target.y - graphNodeWidth / 2;
          const targetY = d.target.x;
          const midX = (sourceX + targetX) / 2;

          return `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;
        });

      // Draw nodes
      const nodes = g.append('g')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.y - graphNodeWidth / 2},${d.x - graphNodeHeight / 2})`);

      // Node rectangles with rounded corners
      nodes.append('rect')
        .attr('width', graphNodeWidth)
        .attr('height', graphNodeHeight)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', d => getTypeColor(d.data.type).bg)
        .attr('stroke', d => getTypeColor(d.data.type).border)
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

      // Type indicator badge
      nodes.append('rect')
        .attr('x', 4)
        .attr('y', 4)
        .attr('width', d => {
          const typeText = d.data.type.charAt(0).toUpperCase();
          return typeText === 'O' || typeText === 'A' ? 20 : 16;
        })
        .attr('height', graphNodeHeight - 8)
        .attr('rx', 4)
        .attr('fill', 'rgba(0,0,0,0.2)');

      // Type indicator text
      nodes.append('text')
        .attr('x', d => {
          const typeText = d.data.type.charAt(0).toUpperCase();
          return typeText === 'O' || typeText === 'A' ? 14 : 12;
        })
        .attr('y', graphNodeHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(255,255,255,0.8)')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(d => {
          switch(d.data.type) {
            case 'object': return '{ }';
            case 'array': return '[ ]';
            case 'string': return 'S';
            case 'number': return '#';
            case 'boolean': return 'B';
            case 'null': return 'N';
            default: return '?';
          }
        });

      // Key text
      nodes.append('text')
        .attr('x', d => d.data.type === 'object' || d.data.type === 'array' ? 28 : 24)
        .attr('y', graphNodeHeight / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', d => getTypeColor(d.data.type).text)
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(d => {
          const maxKeyLen = 12;
          const key = d.data.key;
          return key.length > maxKeyLen ? key.substring(0, maxKeyLen - 1) + '…' : key;
        });

      // Colon separator (for non-container types)
      nodes.filter(d => d.data.type !== 'object' && d.data.type !== 'array')
        .append('text')
        .attr('x', d => {
          const keyLen = Math.min(d.data.key.length, 12);
          return 24 + keyLen * 6 + 4;
        })
        .attr('y', graphNodeHeight / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(255,255,255,0.6)')
        .attr('font-size', '11px')
        .text(':');

      // Value text
      nodes.append('text')
        .attr('x', graphNodeWidth - 8)
        .attr('y', graphNodeHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', d => getTypeColor(d.data.type).text)
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('opacity', 0.9)
        .text(d => {
          const maxLen = 15;
          const val = d.data.value;
          return val.length > maxLen ? val.substring(0, maxLen - 1) + '…' : val;
        });

      // Center the tree initially
      const centerX = width / 2;
      const centerY = height / 2;
      const treeMiddleX = (minY + maxY) / 2;
      const treeMiddleY = (minX + maxX) / 2;

      const initialScale = Math.min(
        0.9,
        (width - 100) / (maxY - minY + graphNodeWidth + 100),
        (height - 100) / (maxX - minX + graphNodeHeight + 100)
      );

      svg.call(
        zoom.transform,
        d3.zoomIdentity
          .translate(centerX - treeMiddleX * initialScale, centerY - treeMiddleY * initialScale)
          .scale(Math.max(0.4, initialScale))
      );

    } catch (e) {
      setError(e.message);
    }
  }, [show, json, size, theme, jsonToTree, getTypeColor, graphNodeWidth, graphNodeHeight, graphNodeSpacingX, graphNodeSpacingY]);

  // Drag handlers
  const handleDragStart = useCallback((e) => {
    if (e.target.closest('.modal-resize-handle')) return;
    e.preventDefault();
    const pos = getPosition();
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
    setIsDragging(true);
  }, [getPosition]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  }, [isDragging, size]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPosition();
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: pos.x,
      posY: pos.y
    };
    setResizeDirection(direction);
    setIsResizing(true);
  }, [getPosition, size]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - resizeStart.current.x;
    const deltaY = e.clientY - resizeStart.current.y;

    let newWidth = resizeStart.current.width;
    let newHeight = resizeStart.current.height;
    let newX = resizeStart.current.posX;
    let newY = resizeStart.current.posY;

    if (resizeDirection.includes('e')) {
      newWidth = Math.max(MIN_SIZE.width, resizeStart.current.width + deltaX);
    }
    if (resizeDirection.includes('w')) {
      const widthDelta = Math.min(deltaX, resizeStart.current.width - MIN_SIZE.width);
      newWidth = resizeStart.current.width - widthDelta;
      newX = resizeStart.current.posX + widthDelta;
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(MIN_SIZE.height, resizeStart.current.height + deltaY);
    }
    if (resizeDirection.includes('n')) {
      const heightDelta = Math.min(deltaY, resizeStart.current.height - MIN_SIZE.height);
      newHeight = resizeStart.current.height - heightDelta;
      newY = resizeStart.current.posY + heightDelta;
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  }, [isResizing, resizeDirection]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  if (!show) return null;

  const pos = getPosition();

  const resizeHandleStyle = {
    position: 'absolute',
    zIndex: 10
  };

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onHide}
      />

      <div
        ref={modalRef}
        className="position-fixed"
        style={{
          left: pos.x,
          top: pos.y,
          width: size.width,
          height: size.height,
          zIndex: 1055,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e1e2e',
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          userSelect: isDragging || isResizing ? 'none' : 'auto'
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2"
          style={{
            backgroundColor: '#181825',
            borderBottom: '1px solid #313244',
            cursor: 'move',
            flexShrink: 0
          }}
          onMouseDown={handleDragStart}
        >
          <div className="d-flex align-items-center">
            <i className="bi bi-diagram-3 me-2" style={{ color: '#89b4fa' }}></i>
            <span className="fw-semibold" style={{ color: '#cdd6f4' }}>JSON Graph</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Legend */}
            <div className="d-flex gap-2" style={{ fontSize: '10px' }}>
              <span className="d-flex align-items-center">
                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#6366f1', borderRadius: 3, marginRight: 4 }}></span>
                <span style={{ color: '#a6adc8' }}>Object</span>
              </span>
              <span className="d-flex align-items-center">
                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#f59e0b', borderRadius: 3, marginRight: 4 }}></span>
                <span style={{ color: '#a6adc8' }}>Array</span>
              </span>
              <span className="d-flex align-items-center">
                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 3, marginRight: 4 }}></span>
                <span style={{ color: '#a6adc8' }}>String</span>
              </span>
              <span className="d-flex align-items-center">
                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#3b82f6', borderRadius: 3, marginRight: 4 }}></span>
                <span style={{ color: '#a6adc8' }}>Number</span>
              </span>
              <span className="d-flex align-items-center">
                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#ec4899', borderRadius: 3, marginRight: 4 }}></span>
                <span style={{ color: '#a6adc8' }}>Boolean</span>
              </span>
              <span className="d-flex align-items-center">
                <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#6b7280', borderRadius: 3, marginRight: 4 }}></span>
                <span style={{ color: '#a6adc8' }}>Null</span>
              </span>
            </div>
            <button
              className="btn btn-sm"
              onClick={onHide}
              style={{ padding: '2px 8px', color: '#cdd6f4', border: '1px solid #313244' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', backgroundColor: '#1e1e2e' }}>
          {error ? (
            <div className="h-100 d-flex align-items-center justify-content-center">
              <div className="text-center" style={{ color: '#f38ba8' }}>
                <i className="bi bi-exclamation-triangle display-4 mb-3 d-block"></i>
                <p>Invalid JSON: {error}</p>
              </div>
            </div>
          ) : !json || !json.trim() ? (
            <div className="h-100 d-flex align-items-center justify-content-center">
              <div className="text-center" style={{ color: '#6c7086' }}>
                <i className="bi bi-diagram-3 display-4 mb-3 d-block"></i>
                <p>No JSON data to visualize</p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ cursor: 'grab', background: '#1e1e2e' }}
            />
          )}
        </div>

        {/* Zoom hint */}
        <div
          className="px-3 py-1 d-flex align-items-center justify-content-between"
          style={{
            backgroundColor: '#181825',
            borderTop: '1px solid #313244',
            fontSize: '10px',
            color: '#6c7086'
          }}
        >
          <span><i className="bi bi-mouse me-1"></i>Scroll to zoom • Drag to pan</span>
          <span><i className="bi bi-arrows-move me-1"></i>Drag header to move window</span>
        </div>

        {/* Resize Handles */}
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, top: 0, left: 0, width: 10, height: 10, cursor: 'nw-resize' }} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, top: 0, right: 0, width: 10, height: 10, cursor: 'ne-resize' }} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, bottom: 0, left: 0, width: 10, height: 10, cursor: 'sw-resize' }} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, bottom: 0, right: 0, width: 10, height: 10, cursor: 'se-resize' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, top: 0, left: 10, right: 10, height: 5, cursor: 'n-resize' }} onMouseDown={(e) => handleResizeStart(e, 'n')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, bottom: 0, left: 10, right: 10, height: 5, cursor: 's-resize' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, left: 0, top: 10, bottom: 10, width: 5, cursor: 'w-resize' }} onMouseDown={(e) => handleResizeStart(e, 'w')} />
        <div className="modal-resize-handle" style={{ ...resizeHandleStyle, right: 0, top: 10, bottom: 10, width: 5, cursor: 'e-resize' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
      </div>
    </>
  );
}

export default JsonGraphModal;
