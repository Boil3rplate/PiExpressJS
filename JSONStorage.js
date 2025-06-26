import fs from 'fs';

export class JSONStorage {
    constructor(filename) {
        this.filename = filename;
    }

    save(data) {
        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync(this.filename, json);
    }

    read() {
        if (!fs.existsSync(this.filename)) return {};
        const raw = fs.readFileSync(this.filename);
        return JSON.parse(raw);
    }
}