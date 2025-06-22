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
You are a helpful assistant who receives user instructions and returns a JSON like this:
{
  "action": "create" | "edit" | "append" | "delete",
  "filename": "string",
  "content": "string (optional for delete)"
}
Do NOT explain anything. Just return pure JSON.
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
                    folderId: '1234',
                    content
                }
            });
        } else if (action === "edit") {
            const result = await client.callTool({
                name: "edit_file",
                arguments: {
                    filename,
                    folderId: '1234',
                    content
                }
            })
        } else if (action === "append") {
            const result = await client.callTool({
                name: "edit_file_content",
                arguments: {
                    filename,
                    folderId:'1234',
                    content
                }
            })
        } else if (action === "delete") {
            const result = await client.callTool({
                name: "delete_file",
                arguments: {
                    filename,
                    folderId:'12',
                    content
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
