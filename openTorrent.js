import path from "path";
import open from 'open';
import axios from "axios";
import fs from 'fs';

export const openTorrent = async (url) => {
    if (url.startsWith('magnet:')) {
        await open(url);
    } else if (url.startsWith('http')) {
        const filename = path.basename(new URL(url).pathname);
        const filepath = path.join(process.cwd(), filename);

        const res = await axios.get(url, { responseType: 'stream' });
        const writer = fs.createWriteStream(filepath);

        await new Promise((resolve, reject) => {
            res.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await open(filepath);
    } else {
        console.error('Unsupported URL:', url);
    }
};