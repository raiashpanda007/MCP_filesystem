import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import {config} from 'dotenv';
import axios from 'axios';
import Response from './web/utils/response';
import uploadFolder from './web/controllers/UploadFolder';
import promptController from './web/controllers/Prompt';

config();

const init = async () => {
    const app = express();
    app.use(express.json());
    const upload = multer({ storage: multer.memoryStorage() });

    const ASSETS_DIR = path.join(process.cwd(), 'assets');
    await fs.mkdir(ASSETS_DIR, { recursive: true });

    // 1️⃣ Upload Endpoint
    app.post('/upload', upload.single('zip'), uploadFolder)


    app.post('/prompt', promptController);

    app.listen(4000, () => console.log('✅ Server listening at http://localhost:4000'));

}

init().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});