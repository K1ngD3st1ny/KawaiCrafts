import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const cwd = process.cwd();
    const distPath = path.resolve(cwd, 'dist');
    const publicPath = path.resolve(distPath, 'public');

    const listing = {
        cwd,
        filesInCwd: fs.readdirSync(cwd),
        distExists: fs.existsSync(distPath),
        publicExists: fs.existsSync(publicPath),
        filesInDist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
        filesInPublic: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : []
    };

    res.status(200).json(listing);
}
