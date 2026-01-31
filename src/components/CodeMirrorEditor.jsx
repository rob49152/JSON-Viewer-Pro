import React, { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useTheme } from '../context/ThemeContext.jsx';

const CodeMirrorEditor = forwardRef(function CodeMirrorEditor(
  { value, onChange, onScroll, onCursorChange, wordWrap = false },
  ref
) {
  const {
    editorTheme,
    fontSize,
    editorLineNumbers,
    editorBracketMatching,
    editorCodeFolding,
    editorHighlightActiveLine,
    editorLineHeight
  } = useTheme();
  const viewRef = useRef(null);
  const isScrollingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    scrollTo: (top) => {
      if (!viewRef.current) return;
      isScrollingRef.current = true;
      viewRef.current.scrollDOM.scrollTop = top;
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    },
    getScrollTop: () => viewRef.current?.scrollDOM.scrollTop || 0
  }));

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !onScroll) return;

    const handleScroll = () => {
      if (!isScrollingRef.current) {
        onScroll(view.scrollDOM.scrollTop);
      }
    };

    view.scrollDOM.addEventListener('scroll', handleScroll);
    return () => view.scrollDOM.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  const themeExtension = useMemo(() => {
    const syntax = HighlightStyle.define([
      { tag: tags.propertyName, color: editorTheme.syntax.key },
      { tag: tags.string, color: editorTheme.syntax.string },
      { tag: tags.number, color: editorTheme.syntax.number },
      { tag: tags.bool, color: editorTheme.syntax.boolean },
      { tag: tags.null, color: editorTheme.syntax.null }
    ]);

    const viewTheme = EditorView.theme({
      '&': {
        backgroundColor: editorTheme.editorBg,
        color: editorTheme.editorText,
        height: '100%'
      },
      '.cm-editor': {
        backgroundColor: editorTheme.editorBg
      },
      '.cm-scroller': {
        backgroundColor: editorTheme.editorBg
      },
      '.cm-content': {
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: `${editorLineHeight}`
      },
      '.cm-line': {
        lineHeight: `${editorLineHeight}`
      },
      '.cm-gutters': {
        backgroundColor: editorTheme.editorBg,
        color: editorTheme.lineNumbers,
        borderRight: `1px solid ${editorTheme.border}`
      },
      '.cm-activeLine': {
        backgroundColor: editorHighlightActiveLine ? `${editorTheme.primary}18` : 'transparent'
      },
      '.cm-activeLineGutter': {
        backgroundColor: editorHighlightActiveLine ? `${editorTheme.primary}24` : 'transparent'
      },
      '.cm-selectionBackground': {
        backgroundColor: `${editorTheme.primary}40`
      },
      '.cm-cursor': {
        borderLeftColor: editorTheme.editorText
      },
      '.cm-foldGutter span': {
        color: editorTheme.textMuted
      }
    }, { dark: editorTheme.isDark });

    return [viewTheme, syntaxHighlighting(syntax)];
  }, [editorTheme, fontSize, editorLineHeight, editorHighlightActiveLine]);

  const extensions = useMemo(() => {
    const base = [
      json(),
      indentOnInput(),
      ...themeExtension
    ];
    if (editorBracketMatching) base.push(bracketMatching());
    if (editorCodeFolding) base.push(foldGutter());
    if (wordWrap) base.push(EditorView.lineWrapping);
    return base;
  }, [themeExtension, wordWrap, editorBracketMatching, editorCodeFolding]);

  return (
    <div style={{ height: '100%', minHeight: 0, backgroundColor: editorTheme.editorBg }}>
      <CodeMirror
        key={`${editorTheme.name}-${editorTheme.editorBg}-${fontSize}-${editorLineHeight}-${wordWrap ? 'wrap' : 'nowrap'}-${editorLineNumbers}-${editorHighlightActiveLine}`}
        value={value}
        height="100%"
        style={{ height: '100%', minHeight: 0 }}
        onChange={(val) => onChange(val)}
        extensions={extensions}
        basicSetup={{
          lineNumbers: editorLineNumbers,
          highlightActiveLineGutter: editorHighlightActiveLine,
          highlightActiveLine: editorHighlightActiveLine,
          foldGutter: false,
          bracketMatching: false
        }}
        onUpdate={(viewUpdate) => {
          if (!onCursorChange) return;
          if (viewUpdate.selectionSet) {
            const head = viewUpdate.state.selection.main.head;
            const line = viewUpdate.state.doc.lineAt(head);
            onCursorChange({ row: line.number, col: head - line.from + 1 });
          }
        }}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
      />
    </div>
  );
});

export default CodeMirrorEditor;
