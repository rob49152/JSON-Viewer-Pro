# JSON Viewer Application

A feature-rich JSON viewer, editor, and comparison tool built with React 18 and Vite.

## Overview

JSON Viewer is a single-page application that provides comprehensive tools for working with JSON data. It offers multiple viewing modes, a dual-panel interface for comparison, visual graph visualization, and a JSON builder—all wrapped in a customizable, theme-aware interface.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Express.js | Backend API server |
| Bootstrap 5 | CSS framework |
| Bootstrap Icons | Icon library |
| CodeMirror 6 | Code editor + merge diff |
| D3.js | Graph visualization |
| react-arborist | Tree drag-and-drop |

## Features

### 1. Dual-Panel JSON Viewer/Editor

The main interface provides two side-by-side panels for viewing and editing JSON:

- **Real-time validation** - Errors are highlighted as you type
- **Format JSON** - Pretty-print with configurable indentation (2, 3, or 4 spaces)
- **Minify JSON** - Compress to a single line with automatic word-wrap
- **File operations** - Upload, download, and copy to clipboard
- **Panel operations** - Swap panels, copy left-to-right or right-to-left
- **Synchronized scrolling** - Optional scroll sync between panels
- **Cursor position indicator** - Shows current line and column below each editor
- **JSON Path Display** - Shows the path (e.g., `$.users[0].name`) at cursor position with copy button

### 2. View Modes

#### Code View
A CodeMirror-based editor with line numbers. Features:
- Color-coded JSON elements (strings, numbers, booleans, null, keys)
- Bracket matching
- Code folding gutter
- Cursor row/column tracking displayed in status bar
- Word-wrap support for minified JSON

#### Tree View
A hierarchical, collapsible tree representation:
- Expand/collapse individual nodes or all at once
- Type indicators with icons (object, array, string, number, boolean, null)
- Search functionality with match highlighting
- Visual display of array lengths and object key counts

### 3. Diff View (Modal)

A draggable, resizable modal window for JSON comparison:
- Side-by-side diff using CodeMirror MergeView
- Theme-aware diff styling
- Position and size saved to localStorage

### 4. JSON Graph Visualization (Modal)

A JSON Crack-style tree visualization using D3.js:
- Horizontal tree layout flowing left-to-right
- Rectangular nodes with rounded corners displaying key:value pairs
- Color-coded by data type:
  - Purple for objects
  - Orange for arrays
  - Green for strings
  - Blue for numbers
  - Pink for booleans
  - Gray for null
- Type indicator badges inside each node ({ }, [ ], S, #, B, N)
- Smooth curved bezier connectors between nodes
- Interactive features:
  - Scroll to zoom
  - Drag to pan
- Dark theme background with color legend
- Draggable and resizable modal window
- Position and size saved to localStorage

### 5. Cross-Panel Tree View

Two buttons in the center controls allow viewing one panel's JSON as a tree in the opposite panel:
- **Show Left as Tree in Right** - Right panel displays tree view of left JSON
- **Show Right as Tree in Left** - Left panel displays tree view of right JSON

### 6. JSON Designer (Creator)

A visual builder for creating JSON structures from scratch using react-arborist:
- **Drag and drop** - Reorder nodes by dragging them
- **Collapsible nodes** - Expand/collapse object and array nodes
- Node-based interface with type selector
- Supported types: string, number, boolean, null, object, array
- Node operations: add child, duplicate, delete
- Built-in templates (package.json, config file, API response)
- Root type selector (Object or Array)
- Expand All / Collapse All buttons
- Live JSON generation in the output panel (auto-updates)
- Import structure from View/Edit/Compare (structure only)
- **Copy to Other Designer** - Select a node and copy it to the other Designer tab (appends, doesn't replace)

### 7. Template System

Save and load JSON templates with an Express.js backend:
- **Save as Template** - Save current JSON to the templates folder with name and description
- **Import Template** - Load a saved template from the server
- **Built-in Templates** - Quick access dropdown with:
  - package.json structure
  - Config File structure
  - API Response structure
- **Saved Templates** - User-saved templates listed in dropdown with refresh button
- Templates stored as JSON files in the `templates/` folder
- Separate template types for JSON and Designer structures

### 8. API Tester

A built-in HTTP client for testing APIs:
- **HTTP Methods** - GET, POST, PUT, PATCH, DELETE
- **Headers Management** - Add, remove, and toggle custom headers
- **Request Body** - CodeMirror editor for POST/PUT/PATCH with content-type selector
- **Content Types** - JSON, Form URL Encoded, Plain Text, XML
- **Response Display** - Status code, headers, and formatted body
- **Performance Metrics**:
  - Total time (end-to-end request duration)
  - Fetch time (time to first byte)
  - Download time (time to receive full response)
  - Response size in bytes
- **Request History** - Clickable list of previous requests

### 9. Theming System

Thirteen built-in themes with independent UI and editor theming:
- Light, Dark, Midnight Blue, Forest, Sunset, Ocean, Nord, Solarized Light, High Contrast, Dracula, Monokai, Gruvbox, Tokyo Night
- Customizable font size (10-24px)
- Customizable indentation
- Preferences persist in browser localStorage

## Project Structure

```
├── server/
│   ├── index.js               # Express server entry point
│   └── routes/
│       └── templates.js       # Template CRUD API routes
├── templates/                 # Saved JSON templates folder
├── src/
│   ├── index.jsx              # App entry point
│   ├── App.jsx                # Main shell with tab navigation
│   ├── components/
│   │   ├── ViewEditCompare.jsx    # Dual-panel main view
│   │   ├── CodeMirrorEditor.jsx   # CodeMirror editor for code view
│   │   ├── JsonTreeView.jsx       # Collapsible tree view
│   │   ├── CodeMirrorDiff.jsx     # CodeMirror MergeView diff
│   │   ├── DiffModal.jsx          # Draggable/resizable diff modal
│   │   ├── JsonGraphModal.jsx     # D3.js graph visualization modal
│   │   ├── JsonCreator.jsx        # Visual JSON builder
│   │   ├── ApiTester.jsx          # HTTP client for API testing
│   │   ├── TemplateModal.jsx      # Save/load template modal
│   │   ├── SettingsModal.jsx      # Settings panel
│   │   └── Tooltip.jsx            # Custom tooltip component
│   ├── services/
│   │   └── templateApi.js         # Template API client
│   ├── context/
│   │   └── ThemeContext.jsx       # Global theme/settings state
│   └── styles/
│       ├── App.css                # Main styles
│       └── themes.css             # Theme transitions
```

## Component Architecture

### App.jsx
The root component that:
- Wraps the app in `ThemeProvider` for global state
- Renders a compact navbar with tab navigation
- Switches between "View/Edit/Compare", "JSON Designer 1", "JSON Designer 2", and "API Tester" tabs
- Manages the settings modal
- Handles cross-tab communication (Designer to Designer copying)

### ViewEditCompare.jsx
The primary feature component managing:
- Left and right JSON states (`leftJson`, `rightJson`)
- Validation errors for each panel
- View mode switching (code/tree)
- Scroll synchronization between panels
- Cursor position tracking for both editors
- JSON path calculation and display at cursor position
- Minified state tracking for word-wrap
- Cross-panel tree view mode
- Diff modal and Graph modal integration
- Template save/load functionality with built-in templates dropdown

### CodeMirrorEditor.jsx
CodeMirror-based editor used in the code view:
- JSON syntax highlighting and bracket matching
- Folding gutter for collapsible structures
- Line numbers and cursor position tracking
- Word-wrap support for minified content

### DiffModal.jsx
Draggable and resizable modal window:
- Mouse drag on header to move
- Resize from edges and corners
- Position and size persisted to localStorage
- Contains CodeMirrorDiff component

### JsonGraphModal.jsx
D3.js-powered graph visualization modal:
- Converts JSON to nodes and links
- Force-directed layout simulation
- Draggable nodes
- Pan and zoom support
- Theme-aware coloring
- Draggable and resizable modal window

### JsonTreeView.jsx
Recursive tree renderer with:
- `expandedPaths` state tracking open nodes
- Search filtering with path matching
- Type-specific icons and styling
- Expand All / Collapse All controls

### CodeMirrorDiff.jsx
CodeMirror MergeView diff:
- Side-by-side comparison with change highlights
- Theme-aware diff styling

### JsonCreator.jsx
Node-based structure builder:
- Each node has a unique ID, key, value, type, and children
- Recursive rendering of nested structures
- `buildJsonFromStructure()` converts tree to JSON object
- Template system loads predefined structures

### ThemeContext.jsx
React Context providing:
- Theme definitions with color palettes and syntax colors
- Current theme, editor theme, font size, indent size
- `setTheme`, `setEditorTheme`, `setFontSize`, `setIndentSize` methods
- localStorage persistence for all preferences

## Data Flow

```
User Input (typing, file upload, paste)
         │
         ▼
┌─────────────────────────────┐
│   ViewEditCompare.jsx       │
│   (state: leftJson,         │
│    rightJson, viewMode)     │
└─────────────────────────────┘
         │
         ├──▶ CodeMirrorEditor (Code View)
         │    └── Syntax highlight, bracket matching & cursor tracking
         │
         ├──▶ JsonTreeView (Tree View)
         │    └── Parse → Recursive render
         │
         ├──▶ DiffModal (Comparison)
         │    └── CodeMirrorDiff → MergeView diff
         │
         └──▶ JsonGraphModal (Visualization)
              └── D3.js → Force-directed graph
```

## User Settings Persistence

Settings are stored in browser localStorage:

| Key | Description |
|-----|-------------|
| `jsonViewerTheme` | Selected UI theme name |
| `jsonViewerEditorTheme` | Selected editor theme name |
| `jsonViewerFontSize` | Font size in pixels |
| `jsonViewerIndentSize` | JSON indent spaces (2, 3, or 4) |
| `jsonViewerTreeIndent` | Tree indentation in pixels |
| `jsonViewerTreeRowHeight` | Tree row height in pixels |
| `jsonViewerTreeHeight` | Tree panel height in pixels |
| `jsonViewerDiffModalPosition` | Diff modal window position (x, y) |
| `jsonViewerDiffModalSize` | Diff modal window size (width, height) |
| `jsonViewerGraphModalPosition` | Graph modal window position (x, y) |
| `jsonViewerGraphModalSize` | Graph modal window size (width, height) |

## Running the Application

```bash
# Install dependencies
npm install

# Start development server (runs both Express backend and Vite frontend)
npm run dev

# Start only the backend server
npm run server

# Start only the frontend
npm run client

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server runs:
- **Express backend** on port 3001 (handles template API)
- **Vite frontend** on port 5173 (proxies `/api` requests to backend)

## API Endpoints

The Express backend provides a REST API for template management:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all templates with metadata |
| GET | `/api/templates/:name` | Get a specific template by name |
| POST | `/api/templates` | Save a new template |
| PUT | `/api/templates/:name` | Update an existing template |
| DELETE | `/api/templates/:name` | Delete a template |

Templates are stored as JSON files in the `templates/` folder with the structure:
```json
{
  "_templateType": "json|designer",
  "_description": "Optional description",
  "_savedAt": "ISO timestamp",
  "content": { ... }
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Insert spaces (in editor) |
| Ctrl+C | Copy selected text |
| Ctrl+V | Paste text |

## Browser Support

The application uses modern JavaScript features and should work in all current browsers:
- Chrome, Edge, Firefox, Safari (latest versions)
- Requires JavaScript enabled
- Uses localStorage for preferences
