import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from 'dotenv';
import cors from 'cors';
import uploadFolder from './web/controllers/UploadFolder';
import promptController from './web/controllers/Prompt';
import downloadZip from './web/controllers/DownloadZip';

config();

const init = async () => {
  const app = express();

  app.use(cors({ origin: '*', methods: ['GET', 'POST'], credentials: false }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });

  const ASSETS_DIR = path.join(process.cwd(), 'assets');
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  app.post('/upload', upload.single('zip'), uploadFolder);
  app.post('/prompt', promptController);
  app.get('/download/:id', downloadZip);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
};

init().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
