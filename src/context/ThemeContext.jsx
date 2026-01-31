import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  light: {
    name: 'Light',
    isDark: false,
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212529',
    textMuted: '#6c757d',
    border: '#dee2e6',
    editorBg: '#ffffff',
    editorText: '#212529',
    lineNumbers: '#6c757d',
    syntax: {
      key: '#881391',
      string: '#0a3069',
      number: '#0550ae',
      boolean: '#cf222e',
      null: '#6c757d'
    }
  },
  dark: {
    name: 'Dark',
    isDark: true,
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#e9ecef',
    textMuted: '#adb5bd',
    border: '#495057',
    editorBg: '#0f0f23',
    editorText: '#e9ecef',
    lineNumbers: '#6c757d',
    syntax: {
      key: '#ff79c6',
      string: '#50fa7b',
      number: '#bd93f9',
      boolean: '#ffb86c',
      null: '#6272a4'
    }
  },
  midnight: {
    name: 'Midnight Blue',
    isDark: true,
    primary: '#4c9aff',
    secondary: '#8993a4',
    success: '#36b37e',
    danger: '#ff5630',
    warning: '#ffab00',
    info: '#00b8d9',
    background: '#091e42',
    surface: '#172b4d',
    text: '#ebecf0',
    textMuted: '#97a0af',
    border: '#344563',
    editorBg: '#0d1b2a',
    editorText: '#ebecf0',
    lineNumbers: '#5e6c84',
    syntax: {
      key: '#4c9aff',
      string: '#36b37e',
      number: '#ff8b00',
      boolean: '#6554c0',
      null: '#5e6c84'
    }
  },
  forest: {
    name: 'Forest',
    isDark: true,
    primary: '#2ecc71',
    secondary: '#95a5a6',
    success: '#27ae60',
    danger: '#e74c3c',
    warning: '#f1c40f',
    info: '#3498db',
    background: '#1a2f1a',
    surface: '#243524',
    text: '#e8f5e9',
    textMuted: '#a5d6a7',
    border: '#2e7d32',
    editorBg: '#152015',
    editorText: '#e8f5e9',
    lineNumbers: '#66bb6a',
    syntax: {
      key: '#81c784',
      string: '#a5d6a7',
      number: '#fff59d',
      boolean: '#ce93d8',
      null: '#607d8b'
    }
  },
  sunset: {
    name: 'Sunset',
    isDark: true,
    primary: '#ff6b6b',
    secondary: '#a8a8a8',
    success: '#4ecdc4',
    danger: '#ff6b6b',
    warning: '#ffe66d',
    info: '#4ecdc4',
    background: '#2c1810',
    surface: '#3d251a',
    text: '#ffeedd',
    textMuted: '#c9a892',
    border: '#5c3d2e',
    editorBg: '#1f120c',
    editorText: '#ffeedd',
    lineNumbers: '#8b6952',
    syntax: {
      key: '#ff6b6b',
      string: '#4ecdc4',
      number: '#ffe66d',
      boolean: '#c44569',
      null: '#596275'
    }
  },
  ocean: {
    name: 'Ocean',
    isDark: true,
    primary: '#00cec9',
    secondary: '#81ecec',
    success: '#00b894',
    danger: '#d63031',
    warning: '#fdcb6e',
    info: '#74b9ff',
    background: '#0c1821',
    surface: '#1b2838',
    text: '#dfe6e9',
    textMuted: '#b2bec3',
    border: '#2d3436',
    editorBg: '#071018',
    editorText: '#dfe6e9',
    lineNumbers: '#636e72',
    syntax: {
      key: '#00cec9',
      string: '#55efc4',
      number: '#fdcb6e',
      boolean: '#a29bfe',
      null: '#636e72'
    }
  },
  nord: {
    name: 'Nord',
    isDark: true,
    primary: '#88c0d0',
    secondary: '#81a1c1',
    success: '#a3be8c',
    danger: '#bf616a',
    warning: '#ebcb8b',
    info: '#5e81ac',
    background: '#2e3440',
    surface: '#3b4252',
    text: '#eceff4',
    textMuted: '#d8dee9',
    border: '#4c566a',
    editorBg: '#242933',
    editorText: '#eceff4',
    lineNumbers: '#616e88',
    syntax: {
      key: '#8fbcbb',
      string: '#a3be8c',
      number: '#b48ead',
      boolean: '#d08770',
      null: '#616e88'
    }
  },
  solarizedLight: {
    name: 'Solarized Light',
    isDark: false,
    primary: '#268bd2',
    secondary: '#93a1a1',
    success: '#859900',
    danger: '#dc322f',
    warning: '#b58900',
    info: '#2aa198',
    background: '#fdf6e3',
    surface: '#eee8d5',
    text: '#657b83',
    textMuted: '#93a1a1',
    border: '#93a1a1',
    editorBg: '#fdf6e3',
    editorText: '#657b83',
    lineNumbers: '#93a1a1',
    syntax: {
      key: '#268bd2',
      string: '#2aa198',
      number: '#d33682',
      boolean: '#cb4b16',
      null: '#93a1a1'
    }
  },
  highContrast: {
    name: 'High Contrast',
    isDark: true,
    primary: '#00ff00',
    secondary: '#ffffff',
    success: '#00ff00',
    danger: '#ff0000',
    warning: '#ffff00',
    info: '#00ffff',
    background: '#000000',
    surface: '#0a0a0a',
    text: '#ffffff',
    textMuted: '#cccccc',
    border: '#ffffff',
    editorBg: '#000000',
    editorText: '#ffffff',
    lineNumbers: '#888888',
    syntax: {
      key: '#00ff00',
      string: '#00ffff',
      number: '#ff00ff',
      boolean: '#ffff00',
      null: '#808080'
    }
  },
  dracula: {
    name: 'Dracula',
    isDark: true,
    primary: '#bd93f9',
    secondary: '#6272a4',
    success: '#50fa7b',
    danger: '#ff5555',
    warning: '#f1fa8c',
    info: '#8be9fd',
    background: '#282a36',
    surface: '#1f2230',
    text: '#f8f8f2',
    textMuted: '#6272a4',
    border: '#44475a',
    editorBg: '#1e1f29',
    editorText: '#f8f8f2',
    lineNumbers: '#6272a4',
    syntax: {
      key: '#8be9fd',
      string: '#50fa7b',
      number: '#bd93f9',
      boolean: '#ffb86c',
      null: '#ff5555'
    }
  },
  monokai: {
    name: 'Monokai',
    isDark: true,
    primary: '#a6e22e',
    secondary: '#75715e',
    success: '#a6e22e',
    danger: '#f92672',
    warning: '#f4bf75',
    info: '#66d9ef',
    background: '#272822',
    surface: '#2d2e27',
    text: '#f8f8f2',
    textMuted: '#75715e',
    border: '#3e3d32',
    editorBg: '#1f201b',
    editorText: '#f8f8f2',
    lineNumbers: '#75715e',
    syntax: {
      key: '#66d9ef',
      string: '#e6db74',
      number: '#ae81ff',
      boolean: '#f92672',
      null: '#f4bf75'
    }
  },
  gruvbox: {
    name: 'Gruvbox',
    isDark: true,
    primary: '#fabd2f',
    secondary: '#928374',
    success: '#b8bb26',
    danger: '#fb4934',
    warning: '#fe8019',
    info: '#83a598',
    background: '#282828',
    surface: '#32302f',
    text: '#ebdbb2',
    textMuted: '#928374',
    border: '#504945',
    editorBg: '#1d2021',
    editorText: '#ebdbb2',
    lineNumbers: '#7c6f64',
    syntax: {
      key: '#83a598',
      string: '#b8bb26',
      number: '#d3869b',
      boolean: '#fe8019',
      null: '#928374'
    }
  },
  tokyoNight: {
    name: 'Tokyo Night',
    isDark: true,
    primary: '#7aa2f7',
    secondary: '#565f89',
    success: '#9ece6a',
    danger: '#f7768e',
    warning: '#e0af68',
    info: '#7dcfff',
    background: '#1a1b26',
    surface: '#1f2335',
    text: '#c0caf5',
    textMuted: '#565f89',
    border: '#3b4261',
    editorBg: '#16161e',
    editorText: '#c0caf5',
    lineNumbers: '#565f89',
    syntax: {
      key: '#7dcfff',
      string: '#9ece6a',
      number: '#bb9af7',
      boolean: '#ff9e64',
      null: '#565f89'
    }
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem('jsonViewerTheme');
    return saved || 'dark';
  });

  const [editorThemeName, setEditorThemeName] = useState(() => {
    const saved = localStorage.getItem('jsonViewerEditorTheme');
    return saved || 'same'; // 'same' means use the main theme
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('jsonViewerFontSize');
    return saved ? parseInt(saved) : 14;
  });

  const [indentSize, setIndentSize] = useState(() => {
    const saved = localStorage.getItem('jsonViewerIndentSize');
    return saved ? parseInt(saved) : 2;
  });

  const [treeIndent, setTreeIndent] = useState(() => {
    const saved = localStorage.getItem('jsonViewerTreeIndent');
    return saved ? parseInt(saved) : 24;
  });

  const [treeRowHeight, setTreeRowHeight] = useState(() => {
    const saved = localStorage.getItem('jsonViewerTreeRowHeight');
    return saved ? parseInt(saved) : 50;
  });

  const [treeHeight, setTreeHeight] = useState(() => {
    const saved = localStorage.getItem('jsonViewerTreeHeight');
    return saved ? parseInt(saved) : 600;
  });

  // Diff View settings
  const [diffArrayMethod, setDiffArrayMethod] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffArrayMethod');
    return saved || 'lcs';
  });

  const [diffShowModifications, setDiffShowModifications] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffShowModifications');
    return saved !== null ? saved === 'true' : true;
  });

  const [diffIndent, setDiffIndent] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffIndent');
    return saved ? parseInt(saved) : 2;
  });

  const [diffLineNumbers, setDiffLineNumbers] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffLineNumbers');
    return saved !== null ? saved === 'true' : true;
  });

  const [diffHighlightInline, setDiffHighlightInline] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffHighlightInline');
    return saved !== null ? saved === 'true' : true;
  });

  const [diffInlineMode, setDiffInlineMode] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffInlineMode');
    return saved || 'word';
  });

  const [diffHideUnchanged, setDiffHideUnchanged] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffHideUnchanged');
    return saved !== null ? saved === 'true' : false;
  });

  const [diffModalWidthPercent, setDiffModalWidthPercent] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffModalWidthPercent');
    return saved ? parseInt(saved) : 90;
  });

  const [diffModalHeightPercent, setDiffModalHeightPercent] = useState(() => {
    const saved = localStorage.getItem('jsonViewerDiffModalHeightPercent');
    return saved ? parseInt(saved) : 90;
  });

  // Editor settings
  const [editorLineNumbers, setEditorLineNumbers] = useState(() => {
    const saved = localStorage.getItem('jsonViewerEditorLineNumbers');
    return saved !== null ? saved === 'true' : true;
  });

  const [editorBracketMatching, setEditorBracketMatching] = useState(() => {
    const saved = localStorage.getItem('jsonViewerEditorBracketMatching');
    return saved !== null ? saved === 'true' : true;
  });

  const [editorCodeFolding, setEditorCodeFolding] = useState(() => {
    const saved = localStorage.getItem('jsonViewerEditorCodeFolding');
    return saved !== null ? saved === 'true' : true;
  });

  const [editorHighlightActiveLine, setEditorHighlightActiveLine] = useState(() => {
    const saved = localStorage.getItem('jsonViewerEditorHighlightActiveLine');
    return saved !== null ? saved === 'true' : true;
  });

  const [editorLineHeight, setEditorLineHeight] = useState(() => {
    const saved = localStorage.getItem('jsonViewerEditorLineHeight');
    return saved ? parseFloat(saved) : 1.5;
  });

  // Graph View settings
  const [graphNodeWidth, setGraphNodeWidth] = useState(() => {
    const saved = localStorage.getItem('jsonViewerGraphNodeWidth');
    return saved ? parseInt(saved) : 180;
  });

  const [graphNodeHeight, setGraphNodeHeight] = useState(() => {
    const saved = localStorage.getItem('jsonViewerGraphNodeHeight');
    return saved ? parseInt(saved) : 28;
  });

  const [graphNodeSpacingX, setGraphNodeSpacingX] = useState(() => {
    const saved = localStorage.getItem('jsonViewerGraphNodeSpacingX');
    return saved ? parseInt(saved) : 40;
  });

  const [graphNodeSpacingY, setGraphNodeSpacingY] = useState(() => {
    const saved = localStorage.getItem('jsonViewerGraphNodeSpacingY');
    return saved ? parseInt(saved) : 8;
  });

  const [graphModalWidthPercent, setGraphModalWidthPercent] = useState(() => {
    const saved = localStorage.getItem('jsonViewerGraphModalWidthPercent');
    return saved ? parseInt(saved) : 80;
  });

  const [graphModalHeightPercent, setGraphModalHeightPercent] = useState(() => {
    const saved = localStorage.getItem('jsonViewerGraphModalHeightPercent');
    return saved ? parseInt(saved) : 80;
  });

  useEffect(() => {
    localStorage.setItem('jsonViewerTheme', themeName);
  }, [themeName]);

  useEffect(() => {
    localStorage.setItem('jsonViewerEditorTheme', editorThemeName);
  }, [editorThemeName]);

  useEffect(() => {
    localStorage.setItem('jsonViewerFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('jsonViewerIndentSize', indentSize.toString());
  }, [indentSize]);

  useEffect(() => {
    localStorage.setItem('jsonViewerTreeIndent', treeIndent.toString());
  }, [treeIndent]);

  useEffect(() => {
    localStorage.setItem('jsonViewerTreeRowHeight', treeRowHeight.toString());
  }, [treeRowHeight]);

  useEffect(() => {
    localStorage.setItem('jsonViewerTreeHeight', treeHeight.toString());
  }, [treeHeight]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffArrayMethod', diffArrayMethod);
  }, [diffArrayMethod]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffShowModifications', diffShowModifications.toString());
  }, [diffShowModifications]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffIndent', diffIndent.toString());
  }, [diffIndent]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffLineNumbers', diffLineNumbers.toString());
  }, [diffLineNumbers]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffHighlightInline', diffHighlightInline.toString());
  }, [diffHighlightInline]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffInlineMode', diffInlineMode);
  }, [diffInlineMode]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffHideUnchanged', diffHideUnchanged.toString());
  }, [diffHideUnchanged]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffModalWidthPercent', diffModalWidthPercent.toString());
  }, [diffModalWidthPercent]);

  useEffect(() => {
    localStorage.setItem('jsonViewerDiffModalHeightPercent', diffModalHeightPercent.toString());
  }, [diffModalHeightPercent]);

  useEffect(() => {
    localStorage.setItem('jsonViewerEditorLineNumbers', editorLineNumbers.toString());
  }, [editorLineNumbers]);

  useEffect(() => {
    localStorage.setItem('jsonViewerEditorBracketMatching', editorBracketMatching.toString());
  }, [editorBracketMatching]);

  useEffect(() => {
    localStorage.setItem('jsonViewerEditorCodeFolding', editorCodeFolding.toString());
  }, [editorCodeFolding]);

  useEffect(() => {
    localStorage.setItem('jsonViewerEditorHighlightActiveLine', editorHighlightActiveLine.toString());
  }, [editorHighlightActiveLine]);

  useEffect(() => {
    localStorage.setItem('jsonViewerEditorLineHeight', editorLineHeight.toString());
  }, [editorLineHeight]);

  useEffect(() => {
    localStorage.setItem('jsonViewerGraphNodeWidth', graphNodeWidth.toString());
  }, [graphNodeWidth]);

  useEffect(() => {
    localStorage.setItem('jsonViewerGraphNodeHeight', graphNodeHeight.toString());
  }, [graphNodeHeight]);

  useEffect(() => {
    localStorage.setItem('jsonViewerGraphNodeSpacingX', graphNodeSpacingX.toString());
  }, [graphNodeSpacingX]);

  useEffect(() => {
    localStorage.setItem('jsonViewerGraphNodeSpacingY', graphNodeSpacingY.toString());
  }, [graphNodeSpacingY]);

  useEffect(() => {
    localStorage.setItem('jsonViewerGraphModalWidthPercent', graphModalWidthPercent.toString());
  }, [graphModalWidthPercent]);

  useEffect(() => {
    localStorage.setItem('jsonViewerGraphModalHeightPercent', graphModalHeightPercent.toString());
  }, [graphModalHeightPercent]);

  const theme = themes[themeName] || themes.dark;
  // If 'same', use main theme for editor, otherwise use selected editor theme
  const editorTheme = editorThemeName === 'same' 
    ? theme 
    : (themes[editorThemeName] || theme);

  const value = {
    theme,
    themeName,
    setThemeName,
    editorTheme,
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
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
