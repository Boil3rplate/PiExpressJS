import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { notify } from './notify.js';

const BASE_URL = 'http://localhost:8080';
const USER = 'admin';
const PASS = 'apples';

const jar = new CookieJar();
const client = wrapper(axios.create({ baseURL: BASE_URL, jar, withCredentials: true }));

async function login() {
    await client.post('/api/v2/auth/login', new URLSearchParams({ username: USER, password: PASS }));
}

async function getCompletedTorrents() {
    const res = await client.get('/api/v2/torrents/info', {
        params: { filter: 'completed' }
    });
    return res.data;
}

async function deleteTorrent(hash) {
    await client.post('/api/v2/torrents/delete', new URLSearchParams({
        hashes: hash,
        deleteFiles: 'false'
    }));
    console.log(`Removed torrent: ${hash}`);
}

export async function runAutoRemove() {
    await login();
    const torrents = await getCompletedTorrents();

    for (const t of torrents) {
        await notify(t.name + ` is ready to watch. :)`, "Enjoy :)");
        await deleteTorrent(t.hash);
    }
}

export async function getLatestAddedTorrent() {
    await login();
    const res = await client.get('/api/v2/torrents/info');
    const torrents = res.data;
    if (!torrents.length) return null;
    torrents.sort((a, b) => b.added_on - a.added_on);
    return torrents[0];
}