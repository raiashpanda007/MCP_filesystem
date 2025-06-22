import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const fileSystemTools: Tool[] = [
  {
    name: 'create_file',
    description: 'Create a new file with content',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Replace file content',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files/directories',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', default: '.' },
      },
    },
  },
  {
    name: 'read_file',
    description: 'Read file content',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_directory',
    description: 'Make a new directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
];
