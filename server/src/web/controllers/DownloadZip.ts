import asyncHandler from "../utils/asyncHandler";
import * as path from 'path'
import fs from 'fs/promises';
import AdmZip from "adm-zip";
const downloadZip = asyncHandler(async (req,res) =>{
     const folderId = req.params.id;
        if (!folderId) {
            return res.status(400).json({ error: 'Missing folder ID' });
        }

        const folderPath = path.join(process.cwd(), 'assets', folderId);
        try {
            const stats = await fs.stat(folderPath);
            if (!stats.isDirectory()) {
                return res.status(404).json({ error: 'Not a folder' });
            }
        } catch (err) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        const zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        const zipBuffer = zip.toBuffer();

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${folderId}.zip"`,
            'Content-Length': zipBuffer.length
        });

        res.send(zipBuffer);
    
})

export default downloadZip