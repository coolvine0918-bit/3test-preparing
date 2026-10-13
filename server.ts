import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleGrade,
  handleHint,
  handleAppsScriptSubmit,
  handleAppsScriptFetch,
} from './src/server/apiRouter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API endpoints
app.post('/api/grade', handleGrade);
app.post('/api/hint', handleHint);
app.post('/api/apps-script/submit', handleAppsScriptSubmit);
app.post('/api/apps-script/fetch', handleAppsScriptFetch);

// Serve static frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
