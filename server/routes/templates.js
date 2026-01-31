import express from 'express';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const TEMPLATES_DIR = join(__dirname, '../../templates');

// Ensure templates directory exists
if (!existsSync(TEMPLATES_DIR)) {
  mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// GET /api/templates - List all templates
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const name = f.replace('.json', '');
        return { name, filename: f };
      });

    // Get metadata for each template
    const templatesWithMeta = await Promise.all(
      templates.map(async (t) => {
        try {
          const filePath = join(TEMPLATES_DIR, t.filename);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          return {
            ...t,
            type: data._templateType || 'json',
            description: data._description || '',
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime
          };
        } catch {
          return { ...t, type: 'json', description: '' };
        }
      })
    );

    res.json(templatesWithMeta);
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// GET /api/templates/:name - Get a specific template
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const filePath = join(TEMPLATES_DIR, `${name}.json`);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json(data);
  } catch (error) {
    console.error('Error reading template:', error);
    res.status(500).json({ error: 'Failed to read template' });
  }
});

// POST /api/templates - Save a new template
router.post('/', async (req, res) => {
  try {
    const { name, content, type = 'json', description = '' } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    // Sanitize filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = join(TEMPLATES_DIR, `${safeName}.json`);

    // Store template with metadata
    const templateData = {
      _templateType: type,
      _description: description,
      _savedAt: new Date().toISOString(),
      content: content
    };

    await fs.writeFile(filePath, JSON.stringify(templateData, null, 2), 'utf-8');

    res.json({
      success: true,
      name: safeName,
      message: `Template "${safeName}" saved successfully`
    });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// PUT /api/templates/:name - Update an existing template
router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { content, description } = req.body;
    const filePath = join(TEMPLATES_DIR, `${name}.json`);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Read existing data to preserve metadata
    const existingContent = await fs.readFile(filePath, 'utf-8');
    const existingData = JSON.parse(existingContent);

    const templateData = {
      ...existingData,
      _savedAt: new Date().toISOString(),
      content: content !== undefined ? content : existingData.content,
      _description: description !== undefined ? description : existingData._description
    };

    await fs.writeFile(filePath, JSON.stringify(templateData, null, 2), 'utf-8');

    res.json({
      success: true,
      message: `Template "${name}" updated successfully`
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:name - Delete a template
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const filePath = join(TEMPLATES_DIR, `${name}.json`);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: `Template "${name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
