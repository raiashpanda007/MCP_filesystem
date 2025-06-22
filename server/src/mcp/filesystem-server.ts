// === server/mcpServer.ts ===
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const server = new McpServer({
  name: "filesystem-server",
  version: "1.0.0",
  transport: new StdioServerTransport(),
});

const baseDir = path.resolve("src/assets");

const createFile = async (folderId: string, filename: string, content: string) => {
  const fullPath = path.join(baseDir, folderId, filename);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
  return `File \"${filename}\" created successfully in folder \"${folderId}\".`;
};

const editFile = async (folderId: string, oldFilename: string, newFilename: string) => {
  const oldPath = path.join(baseDir, folderId, oldFilename);
  const newPath = path.join(baseDir, folderId, newFilename);

  await fs.rename(oldPath, newPath);

  return `File renamed from "${oldFilename}" to "${newFilename}" successfully.`;
};

const editFileContent = async (folderId: string, filename: string, content: string) => {
  const fullPath = path.join(baseDir, folderId, filename);
  const existingContent = await fs.readFile(fullPath, "utf-8");
  const updatedContent = existingContent + "\n" + content;
  await fs.writeFile(fullPath, updatedContent);
  return `Content appended to file \"${filename}\".`;
};

const deleteFile = async (folderId: string, filename: string, ) => {
  const fullPath = path.join(baseDir, folderId, filename);
  await fs.unlink(fullPath);
  return `File \"${filename}\" deleted successfully.`;
};

server.registerTool("create_file", {
  title: "Create File",
  description: "Create a new file at specified path",
  inputSchema: { folderId: z.string(), filename: z.string(), content: z.string() }
},
  async ({ folderId, filename, content }) => {
    const ans = await createFile(folderId, filename, content);
    return {
      content: [
        { type: "text", text: ans }
      ]
    };
  }
);

server.registerTool("edit_file", {
  title: 'Edit File',
  description: "Edit a file at a specified path",
  inputSchema: { folderId: z.string(), filename: z.string(), content: z.string() }
},
  async ({ folderId, filename, content }) => {
    const ans = await editFile(folderId, filename, content);
    return {
      content: [
        { type: "text", text: ans }
      ]
    };
  });

server.registerTool("edit_file_content", {
  title: 'Edit File Content',
  description: "Edit a file content at a specified path",
  inputSchema: { folderId: z.string(), filename: z.string(), content: z.string() }
},
  async ({ folderId, filename, content }) => {
    const ans = await editFileContent(folderId, filename, content);
    return {
      content: [
        { type: "text", text: ans }
      ]
    };
  });

server.registerTool("delete_file", {
  title: 'Delete File',
  description: "Delete File ",
  inputSchema: { folderId: z.string(), filename: z.string() }
},
  async ({ folderId, filename }) => {
    const ans = await deleteFile(folderId, filename);
    return {
      content: [
        { type: "text", text: ans }
      ]
    };
  });

const transport = new StdioServerTransport();
const init = async () => {
  await server.connect(transport);
  await new Promise(()=>{})
};

init().catch((e) => {
  throw Error(e);
});