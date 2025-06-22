import asyncHandler from "../utils/asyncHandler";
import axios from "axios";
import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

const promptController = asyncHandler(async (req, res) => {
    const { prompt, id } = req.body;
    if (!prompt || !id) {
        return res.status(400).json({ error: "Missing prompt or id" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "OPENROUTER_API_KEY is not set" });
    }

    // 1. Send prompt to Mistral via OpenRouter
    const openrouterResponse = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "mistralai/mistral-7b-instruct-v0.1",
            messages: [
                {
                    role: "system",
                    content: `You are a strict JSON-generating assistant for file operations. Based on the user's natural language request, return a valid JSON object in exactly the following format:

{
  "action": "create" | "rename" | "append" | "delete",
  "filename": "string",
  "content": "string" // required for all actions except delete
}

Rules:
- Respond only with raw JSON. Do NOT include markdown, backticks, explanations, or any formatting outside the JSON.
- Use only double quotes for all strings. Escape all inner quotes with a backslash (e.g., \\"hello\\").
- All fields must be present and of correct type:
  - "filename" must include an extension (e.g., .ts, .js, .txt).
  - "content" must be included for "create", "rename", and "append".
  - For "delete", omit the "content" field entirely.
- If the user omits "content":
  - For "create": use "content": "happy to create this file"
  - For "rename": use "content": "oldfile_renamed" (choose a sensible new name if possible)
  - For "append": use "content": "appending this line" (or something general)

Examples:

Prompt: append console.log("hi") in hello.ts  
Response:
{
  "action": "append",
  "filename": "hello.ts",
  "content": "console.log(\\"hi\\")"
}

Prompt: create hello.ts  
Response:
{
  "action": "create",
  "filename": "hello.ts",
  "content": "happy to create this file"
}

Requirements:
- Do not infer extra behavior or return summaries.
- Do not leave any field undefined.
- Always return valid, machine-parseable JSON that works with JSON.parse()

This is your only task — return clean, strict JSON without any commentary.`
.trim(),
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );

    const aiReply = openrouterResponse.data.choices?.[0]?.message?.content?.trim();
    if (!aiReply) {
        return res.status(400).json({ error: "No content from model" });
    }
    console.log("AI  reply for ",id,'with json ' , aiReply)

    let parsed;
    try {
        parsed = JSON.parse(aiReply);
    } catch (e) {
        return res.status(400).json({ error: "Failed to parse model response as JSON", raw: aiReply });
    }

    const { action, filename, content } = parsed;

    // 2. Call the MCP server
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/mcp/filesystem-server.js"],
    });

    const client = new Client({ name: "web-client", version: "1.0.0" });
    await client.connect(transport);

    let result;
    try {
        if (action === "create") {
            const result = await client.callTool({
                name: "create_file",
                arguments: {
                    filename,
                    folderId: id,
                    content
                }
            });
        } else if (action === "rename") {
            const result = await client.callTool({
                name: "edit_file",
                arguments: {
                    filename,
                    folderId: id,
                    content
                }
            })
        } else if (action === "append") {
            const result = await client.callTool({
                name: "edit_file_content",
                arguments: {
                    filename,
                    folderId: id,
                    content
                }
            })
        } else if (action === "delete") {
            const result = await client.callTool({
                name: "delete_file",
                arguments: {
                    filename,
                    folderId: id
                }
            })
        } else {
            throw new Error(`Unknown action returned by model: ${action}`);
        }
    } catch (err: any) {
        await transport.close();
        return res.status(500).json({ error: err.message });
    }

    await transport.close();

    res.json({
        success: true,
        model_decision: parsed,
        result,
    });
});

export default promptController;
