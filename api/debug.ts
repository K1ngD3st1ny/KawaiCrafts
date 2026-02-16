import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const cwd = process.cwd();
    const distPath = path.resolve(cwd, 'dist');
    const publicPath = path.resolve(distPath, 'public');

    const indexHtmlPath = path.resolve(publicPath, 'index.html');
    let indexHtmlContent = '';
    try {
        if (fs.existsSync(indexHtmlPath)) {
            indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8').substring(0, 500);
        }
    } catch (e) {
        indexHtmlContent = `Error reading file: ${e.message}`;
    }

    const listing = {
        env: process.env.NODE_ENV,
        cwd,
        filesInCwd: fs.readdirSync(cwd),
        distExists: fs.existsSync(distPath),
        publicExists: fs.existsSync(publicPath),
        filesInDist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
        filesInPublic: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : [],
        indexHtmlPreview: indexHtmlContent
    };

    res.status(200).json(listing);
}
