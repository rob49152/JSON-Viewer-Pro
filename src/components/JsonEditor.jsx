import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const JsonEditor = forwardRef(function JsonEditor({ value, onChange, error, onScroll, scrollTop, onCursorChange, wordWrap = false, onUndo, onRedo }, ref) {
  const { editorTheme, fontSize } = useTheme();
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [cursorPosition, setCursorPosition] = useState({ row: 1, col: 1 });
  const [bracketMatch, setBracketMatch] = useState(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  // Calculate cursor position from selection
  const computeBracketMatch = useCallback((text, selectionStart) => {
    const brackets = new Set(['{', '}', '[', ']']);
    const getBracketAt = (pos) => {
      if (pos > 0 && brackets.has(text[pos - 1])) return { char: text[pos - 1], index: pos - 1 };
      if (brackets.has(text[pos])) return { char: text[pos], index: pos };
      return null;
    };

    const isInStringAt = (pos) => {
      let inString = false;
      let escape = false;
      for (let i = 0; i < pos; i += 1) {
        const ch = text[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === '\\') {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
        }
      }
      return inString;
    };

    const bracket = getBracketAt(selectionStart);
    if (!bracket) return null;
    if (isInStringAt(bracket.index)) return null;

    const isOpen = bracket.char === '{' || bracket.char === '[';
    const openChar = isOpen ? bracket.char : (bracket.char === '}' ? '{' : '[');
    const closeChar = isOpen ? (bracket.char === '{' ? '}' : ']') : bracket.char;

    if (isOpen) {
      let depth = 1;
      let inString = false;
      let escape = false;
      for (let i = bracket.index + 1; i < text.length; i += 1) {
        const ch = text[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === '\\') {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (ch === openChar) depth += 1;
        if (ch === closeChar) depth -= 1;
        if (depth === 0) return { open: bracket.index, close: i };
      }
      return null;
    }

    let depth = 1;
    let inString = false;
    let escape = false;
    for (let i = bracket.index - 1; i >= 0; i -= 1) {
      const ch = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === closeChar) depth += 1;
      if (ch === openChar) depth -= 1;
      if (depth === 0) return { open: i, close: bracket.index };
    }
    return null;
  }, []);

  const updateCursorPosition = useCallback((selectionStart) => {
    const textBeforeCursor = value.substring(0, selectionStart);
    const linesBeforeCursor = textBeforeCursor.split('\n');
    const row = linesBeforeCursor.length;
    const col = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
    const newPosition = { row, col };
    setCursorPosition(newPosition);
    setBracketMatch(computeBracketMatch(value, selectionStart));
    if (onCursorChange) {
      onCursorChange(newPosition);
    }
  }, [value, onCursorChange, computeBracketMatch]);

  const handleSelect = useCallback((e) => {
    updateCursorPosition(e.target.selectionStart);
  }, [updateCursorPosition]);

  const handleClick = useCallback((e) => {
    updateCursorPosition(e.target.selectionStart);
  }, [updateCursorPosition]);

  // Expose scrollTo method to parent
  useImperativeHandle(ref, () => ({
    scrollTo: (top) => {
      isScrollingRef.current = true;
      if (textareaRef.current) {
        textareaRef.current.scrollTop = top;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = top;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    },
    getScrollTop: () => textareaRef.current?.scrollTop || 0
  }));

  const handleScroll = useCallback((e) => {
    const scrollTopValue = e.target.scrollTop;
    const scrollLeft = e.target.scrollLeft;
    
    // Sync line numbers and highlight overlay
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTopValue;
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTopValue;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    
    // Notify parent for sync scroll between panels (only if not programmatic)
    if (onScroll && !isScrollingRef.current) {
      onScroll(scrollTopValue);
    }
  }, [onScroll]);

  const handleKeyDown = (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (isCtrlOrCmd && !e.shiftKey && key === 'z') {
      if (onUndo) {
        e.preventDefault();
        onUndo();
      }
      return;
    }

    if (isCtrlOrCmd && (key === 'y' || (e.shiftKey && key === 'z'))) {
      if (onRedo) {
        e.preventDefault();
        onRedo();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Syntax highlighting function
  const highlightJson = useCallback((text) => {
    if (!text) return '';
    
    // Escape HTML
    const escapeHtml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    let annotated = text;
    if (bracketMatch) {
      const { open, close } = bracketMatch;
      const START = '\uE000';
      const END = '\uE001';
      annotated = text
        .split('')
        .map((ch, idx) => ((idx === open || idx === close) ? `${START}${ch}${END}` : ch))
        .join('');
    }

    const escaped = escapeHtml(annotated);
    
    // Apply syntax highlighting with regex
    let highlighted = escaped
      // Strings (keys and values) - handle escaped quotes
      .replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
        return `<span class="json-string">${match}</span>`;
      })
      // Numbers (standalone, not inside strings)
      .replace(/(?<!["\w])(-?\d+\.?\d*(?:[eE][+-]?\d+)?)(?!["\w])/g, (match) => {
        return `<span class="json-number">${match}</span>`;
      })
      // Booleans
      .replace(/\b(true|false)\b/g, (match) => {
        return `<span class="json-boolean">${match}</span>`;
      })
      // Null
      .replace(/\bnull\b/g, (match) => {
        return `<span class="json-null">${match}</span>`;
      });

    // Now differentiate keys from string values
    // Keys are strings followed by a colon
    highlighted = highlighted.replace(
      /<span class="json-string">("(?:[^"\\]|\\.)*")<\/span>(\s*:)/g,
      '<span class="json-key">$1</span>$2'
    );

    const withBrackets = highlighted
      .replace(/\uE000/g, '<span class="json-bracket">')
      .replace(/\uE001/g, '</span>');

    return withBrackets;
  }, [bracketMatch]);

  const editorStyles = {
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: `${fontSize}px`,
    lineHeight: '1.5',
    padding: '10px',
    margin: 0,
    border: 'none',
    outline: 'none',
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    wordWrap: wordWrap ? 'break-word' : 'normal',
    overflowWrap: wordWrap ? 'break-word' : 'normal',
    wordBreak: wordWrap ? 'break-all' : 'normal',
    tabSize: 2
  };

  return (
    <div 
      ref={containerRef}
      className="d-flex h-100" 
      style={{ backgroundColor: editorTheme.editorBg, position: 'relative' }}
    >
      {/* Syntax Highlighting Styles */}
      <style>{`
        .json-key { color: ${editorTheme.syntax.key}; }
        .json-string { color: ${editorTheme.syntax.string}; }
        .json-number { color: ${editorTheme.syntax.number}; }
        .json-boolean { color: ${editorTheme.syntax.boolean}; }
        .json-null { color: ${editorTheme.syntax.null}; }
        .json-bracket { color: ${editorTheme.syntax.key}; background-color: rgba(13, 110, 253, 0.18); border-radius: 2px; }
        .json-editor-textarea::placeholder {
          color: ${editorTheme.textMuted};
          opacity: 0.6;
        }
      `}</style>

      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="text-end pe-2 user-select-none"
        style={{
          minWidth: '50px',
          backgroundColor: editorTheme.surface,
          color: editorTheme.lineNumbers,
          ...editorStyles,
          overflow: 'hidden',
          borderRight: `1px solid ${editorTheme.border}`,
          flexShrink: 0
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} style={{ height: `${fontSize * 1.5}px` }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Syntax Highlighted Overlay (behind textarea) */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          style={{
            ...editorStyles,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            color: editorTheme.editorText,
            overflow: 'auto',
            pointerEvents: 'none',
            zIndex: 1
          }}
          dangerouslySetInnerHTML={{ __html: highlightJson(value) || '<span style="opacity:0">.</span>' }}
        />

        {/* Transparent Textarea (on top for editing) */}
        <textarea
          ref={textareaRef}
          className="json-editor-textarea"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTimeout(() => updateCursorPosition(e.target.selectionStart), 0);
          }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onKeyUp={handleSelect}
          onClick={handleClick}
          onSelect={handleSelect}
          placeholder="Paste or type your JSON here..."
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            ...editorStyles,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            color: 'transparent',
            caretColor: editorTheme.editorText,
            resize: 'none',
            overflow: 'auto',
            zIndex: 2,
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
});

export default JsonEditor;
