import asyncHandler from "../utils/asyncHandler";
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import Response from '../utils/response';


const ASSETS_DIR = path.join(process.cwd(), 'assets');
const uploadFolder = asyncHandler(async (req, res) => {
    if (!req.file)  return res.status(400).json(new Response(400, 'No file uploaded', null));
        const id = uuidv4();
        const folderPath = path.join(ASSETS_DIR, id);
        await fs.mkdir(folderPath, { recursive: true });

        const zip = new AdmZip(req.file.buffer);
        zip.extractAllTo(folderPath, true);

        res.json({ id, message: `Files extracted to ${folderPath}` });
})

export default uploadFolder;