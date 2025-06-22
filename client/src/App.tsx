// === src/App.tsx ===
import { useState } from "react";
import axios from "axios";

export default function App() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) return;
    const formData = new FormData();
    formData.append("zip", zipFile);

    try {
      const res = await axios.post("http://localhost:4000/upload", formData);
      setFolderId(res.data.id);
    } catch (err: any) {
      alert("Upload failed");
    }
  };

  const handlePromptSubmit = async () => {
    if (!folderId || !prompt) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/prompt", {
        id: folderId,
        prompt,
      });
      setResponse(JSON.stringify(res.data, null, 2));
      setPrompt("");
    } catch (err: any) {
      setResponse("Error calling MCP");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!folderId) return;
    window.open(`/api/download/${folderId}`, "_blank");
  };

  const reset = () => {
    setFolderId(null);
    setPrompt("");
    setResponse("");
    setZipFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-2xl">
        {!folderId ? (
          <form onSubmit={handleZipUpload} className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Upload your ZIP folder</h2>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setZipFile(e.target.files?.[0] || null)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Upload ZIP
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI File Prompt</h2>
              <button
                onClick={reset}
                className="text-sm bg-red-100 px-3 py-1 rounded hover:bg-red-200"
              >
                Reset
              </button>
            </div>
            <textarea
              className="border p-2 rounded w-full h-24"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. create hello.txt file with 'Hello world' inside"
            />
            <button
              onClick={handlePromptSubmit}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {loading ? "Processing..." : "Submit Prompt"}
            </button>
            <button
              onClick={handleDownload}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Download Folder
            </button>
            <pre className="bg-gray-100 text-sm p-2 border rounded overflow-x-auto max-h-60">
              {response || "No output yet"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
