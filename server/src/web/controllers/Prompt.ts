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
                    content: `
You are a strict JSON-only assistant for file operations. Based on the user's natural language instructions, return a valid JSON object in the following format:

{
  "action": "create" | "rename" | "append" | "delete",
  "filename": "string",
  "content": "string" // required for all actions except delete
}

Rules:
- Only return raw JSON — no explanations, no markdown, no backticks.
- Use double quotes for all strings.
- Escape all inner quotes properly (e.g., \").
- If the user forgets to provide file content only and only if the user forgets to add than add these else no need to just keep the users content:
  - For "create", default to: "content": "happy to create this file"
  - For "rename" (renaming), default to: "content": "oldfile_renamed" (you can choose a better name based on context)
- Do not leave any fields undefined.
- Always validate that the output is parseable JSON.
- Even in case of rename please parse the new name in "content" key of the returning json

Never include any commentary or formatting outside the JSON.

        `.trim(),
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
