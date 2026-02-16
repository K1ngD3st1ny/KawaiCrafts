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

    let serverIndexContent = '';
    const serverIndexPath = path.resolve(distPath, 'index.js');
    try {
        if (fs.existsSync(serverIndexPath)) {
            serverIndexContent = fs.readFileSync(serverIndexPath, 'utf-8').substring(0, 500);
        }
    } catch (e) {
        serverIndexContent = `Error reading file: ${e.message}`;
    }

    let packageJsonContent = '';
    const packageJsonPath = path.resolve(cwd, 'package.json');
    try {
        if (fs.existsSync(packageJsonPath)) {
            packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
        }
    } catch (e) {
        packageJsonContent = `Error reading file: ${e.message}`;
    }

    const distServerPath = path.resolve(cwd, 'dist-server');
    const listing = {
        env: process.env.NODE_ENV,
        cwd,
        packageJson: packageJsonContent,
        distPath,
        distServerPath,
        filesInCwd: fs.readdirSync(cwd),
        filesInDist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
        filesInDistServer: fs.existsSync(distServerPath) ? fs.readdirSync(distServerPath) : [],
        indexHtmlPreview: indexHtmlContent,
        serverIndexPreview: serverIndexContent
    };

    res.status(200).json(listing);
}
