// Template API service for frontend

const API_BASE = '/api/templates';

export async function listTemplates() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to list templates');
  }
  return response.json();
}

export async function getTemplate(name) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(name)}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Template not found');
    }
    throw new Error('Failed to get template');
  }
  return response.json();
}

export async function saveTemplate(name, content, type = 'json', description = '') {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, content, type, description })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save template');
  }
  return response.json();
}

export async function updateTemplate(name, content, description) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, description })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update template');
  }
  return response.json();
}

export async function deleteTemplate(name) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete template');
  }
  return response.json();
}
