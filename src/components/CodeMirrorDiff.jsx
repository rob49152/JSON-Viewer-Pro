import React, { useMemo } from 'react';
import { Differ, Viewer } from 'json-diff-kit';
import 'json-diff-kit/dist/viewer.css';
import { useTheme } from '../context/ThemeContext.jsx';

function CodeMirrorDiff({ leftJson, rightJson, leftError, rightError, height }) {
  const {
    theme,
    editorTheme,
    fontSize,
    diffArrayMethod,
    diffShowModifications,
    diffIndent,
    diffLineNumbers,
    diffHighlightInline,
    diffInlineMode,
    diffHideUnchanged
  } = useTheme();

  // Parse JSON strings to objects
  const leftObj = useMemo(() => {
    try {
      return JSON.parse(leftJson || '{}');
    } catch {
      return null;
    }
  }, [leftJson]);

  const rightObj = useMemo(() => {
    try {
      return JSON.parse(rightJson || '{}');
    } catch {
      return null;
    }
  }, [rightJson]);

  // Compute diff
  const diff = useMemo(() => {
    if (leftObj === null || rightObj === null) return null;
    const differ = new Differ({
      detectCircular: true,
      maxDepth: Infinity,
      showModifications: diffShowModifications,
      arrayDiffMethod: diffArrayMethod
    });
    return differ.diff(leftObj, rightObj);
  }, [leftObj, rightObj, diffShowModifications, diffArrayMethod]);

  // Generate dynamic CSS for theming
  const themeStyles = useMemo(() => `
    .json-diff-viewer {
      --json-diff-bg: ${editorTheme.editorBg};
      --json-diff-text: ${editorTheme.editorText};
      --json-diff-line-num: ${editorTheme.lineNumbers};
      --json-diff-border: ${editorTheme.border};
      --json-diff-add-bg: ${editorTheme.isDark ? 'rgba(40, 167, 69, 0.2)' : 'rgba(40, 167, 69, 0.15)'};
      --json-diff-remove-bg: ${editorTheme.isDark ? 'rgba(220, 53, 69, 0.2)' : 'rgba(220, 53, 69, 0.15)'};
      --json-diff-modify-bg: ${editorTheme.isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.15)'};
      --json-diff-key-color: ${editorTheme.syntax.key};
      --json-diff-string-color: ${editorTheme.syntax.string};
      --json-diff-number-color: ${editorTheme.syntax.number};
      --json-diff-boolean-color: ${editorTheme.syntax.boolean};
      --json-diff-null-color: ${editorTheme.syntax.null};
    }
    .json-diff-viewer .json-diff-viewer-wrapper {
      background-color: var(--json-diff-bg) !important;
      color: var(--json-diff-text) !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: ${fontSize}px !important;
    }
    .json-diff-viewer pre {
      font-size: ${fontSize}px !important;
      line-height: ${Math.round(fontSize * 1.4)}px !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
    }
    .json-diff-viewer table {
      background-color: var(--json-diff-bg) !important;
    }
    .json-diff-viewer td,
    .json-diff-viewer th {
      background-color: var(--json-diff-bg) !important;
      color: var(--json-diff-text) !important;
      border-color: var(--json-diff-border) !important;
    }
    .json-diff-viewer .line-number {
      color: var(--json-diff-line-num) !important;
      background-color: var(--json-diff-bg) !important;
      border-right: 1px solid var(--json-diff-border) !important;
    }
    .json-diff-viewer .line-add,
    .json-diff-viewer [class*="line-add"] {
      background-color: var(--json-diff-add-bg) !important;
    }
    .json-diff-viewer .line-remove,
    .json-diff-viewer [class*="line-remove"] {
      background-color: var(--json-diff-remove-bg) !important;
    }
    .json-diff-viewer .line-modify,
    .json-diff-viewer [class*="line-modify"] {
      background-color: var(--json-diff-modify-bg) !important;
    }
    .json-diff-viewer .key {
      color: var(--json-diff-key-color) !important;
    }
    .json-diff-viewer .string {
      color: var(--json-diff-string-color) !important;
    }
    .json-diff-viewer .number {
      color: var(--json-diff-number-color) !important;
    }
    .json-diff-viewer .boolean {
      color: var(--json-diff-boolean-color) !important;
    }
    .json-diff-viewer .null {
      color: var(--json-diff-null-color) !important;
    }
    .json-diff-viewer .segment-inline-diff-add {
      background-color: rgba(40, 167, 69, 0.4) !important;
    }
    .json-diff-viewer .segment-inline-diff-remove {
      background-color: rgba(220, 53, 69, 0.4) !important;
    }
  `, [editorTheme, fontSize]);

  if (leftError || rightError) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: editorTheme.editorBg }}>
        <div className="text-center text-muted">
          <i className="bi bi-file-diff display-4 mb-3 d-block"></i>
          <p>Both sides must contain valid JSON to compare</p>
        </div>
      </div>
    );
  }

  if (!leftJson?.trim() || !rightJson?.trim()) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: editorTheme.editorBg }}>
        <div className="text-center text-muted">
          <i className="bi bi-file-diff display-4 mb-3 d-block"></i>
          <p>Enter JSON in both panels to compare</p>
        </div>
      </div>
    );
  }

  if (leftObj === null || rightObj === null) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: editorTheme.editorBg }}>
        <div className="text-center text-muted">
          <i className="bi bi-file-diff display-4 mb-3 d-block"></i>
          <p>Both sides must contain valid JSON to compare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100" style={{ backgroundColor: editorTheme.editorBg, minHeight: 0 }}>
      <style>{themeStyles}</style>
      <div className="d-flex gap-3 p-2 border-bottom align-items-center" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <span className="badge bg-secondary">
          <i className="bi bi-columns-gap me-1"></i>
          Side-by-side diff
        </span>
      </div>
      <div
        className="flex-grow-1 json-diff-viewer"
        style={{
          minHeight: 0,
          overflow: 'auto',
          height: height ? `${height}px` : '100%',
          backgroundColor: editorTheme.editorBg
        }}
      >
        <Viewer
          key={`${diffIndent}-${diffLineNumbers}-${diffHighlightInline}-${diffInlineMode}-${diffHideUnchanged}-${diffArrayMethod}-${diffShowModifications}`}
          diff={diff}
          indent={diffIndent}
          lineNumbers={diffLineNumbers}
          highlightInlineDiff={diffHighlightInline}
          inlineDiffOptions={{
            mode: diffInlineMode,
            wordSeparator: ' '
          }}
          hideUnchangedLines={diffHideUnchanged}
          syntaxHighlight={{ theme: 'custom' }}
        />
      </div>
    </div>
  );
}

export default CodeMirrorDiff;
