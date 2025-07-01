import dotenv from 'dotenv';
import express from 'express';
import { findTorrent } from './src/findTorrent.js';
import { runAutoRemove, getLatestAddedTorrent } from './src/auto-remove.js';
import { openTorrent } from './src/openTorrent.js';
import { notify } from './src/notify.js';
import { JSONStorage } from './src/JSONStorage.js';

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import ngrok from 'ngrok';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const usedIdsPath = path.join(__dirname, 'used_movie_ids.txt');
const TMDB_BEARER = process.env.TMDB_BEARER;

let movieCache = [];
let currentPage = 1;
let movie;

const app = express();
const PORT = 3001;
const INTERVAL_MS = 30 * 1000; // 30 seconds
const storage = new JSONStorage('data.json');


// Periodic removal
setInterval(async () => {
    try {
        runAutoRemove()
    } catch (e) {
        console.log(e)
    }

}, INTERVAL_MS);

// setInterval(async () => {
//     try {
//         getNextSuggestion()
//         await notify(`Hey Bobby, have you seen ` + movie.title + "?", movie.overview);
//     } catch (e) {
//         console.log(e)
//     }

// }, 10*1000);

app.get('/open', async (req, res) => {
    const { name, type } = req.query;

    if (!name) {
        return res.status(400).send('Invalid or missing name');
    }

    try {
        const torrentUrl = await findTorrent(name)
        if (!torrentUrl) return;

        console.log("Got torrent: " + torrentUrl)
        await openTorrent(torrentUrl);

        setTimeout(async () => {
            const torr = await getLatestAddedTorrent();
            console.log('torr: ' + JSON.stringify(torr, null, 2))
        }, 3000);


        const currData = storage.read();
        const downloading = currData?.downloading || [];
        downloading.push(torrentUrl);

        storage.save({ ...currData, downloading })

        await notify("Hey Bobby! xox", `I'm downloading ` + name + ` for you.`);
        res.status(200).send(`Opened: ${name}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to open link');
    }
});


async function fetchMoviePage(page) {
    const randomYear = Math.floor(Math.random() * (2012 - 1995 + 1)) + 1995;
    console.log(`FETCHING MORE MOVIES for year ${randomYear}...`);

    const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${Math.floor(Math.random() * 2) + 1}&primary_release_year=${randomYear}&sort_by=popularity.desc&with_genres=35`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${TMDB_BEARER}`,
            accept: 'application/json'
        }
    });

    console.log(url);

    const data = await res.json();
    movieCache = data.results || [];
    currentPage++;
}


async function getNextSuggestion() {
    const usedIds = getUsedIds();

    while (true) {
        if (movieCache.length === 0) {
            await fetchMoviePage(currentPage);
        }

        const idx = Math.floor(Math.random() * movieCache.length);
        const candidate = movieCache.splice(idx, 1)[0];

        if (candidate.vote_average < 6.5) {
            continue;
        }

        movie = candidate;
        addUsedId(movie.id);

        return {
            title: movie.title,
            overview: movie.overview,
            rating: Math.round(movie.vote_average * 10) / 10,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        };
    }
}


function getUsedIds() {
    if (!fs.existsSync(usedIdsPath)) return new Set();
    const data = fs.readFileSync(usedIdsPath, 'utf8');
    return new Set(data.split('\n').filter(Boolean));
}

function addUsedId(id) {
    fs.appendFileSync(usedIdsPath, id + '\n');
}

let lastSuggestion = null;

async function updateSuggestion() {
    try {
        lastSuggestion = await getNextSuggestion();
        console.log('New suggestion:', lastSuggestion.title);
    } catch (err) {
        console.error('Error fetching suggestion:', err.message);
    }
}

app.use(express.static('public'));
app.get('/search', (req, res) => {
  res.sendFile(__dirname + '/public/search.html');
});

app.get('/api/suggestion', async (req, res) => {
    await updateSuggestion();
    res.json(lastSuggestion);
});

app.get('/movieName', async (req, res) => {
    res.json(movie.title.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase())
    // res.json(movie.title.toLowerCase() + "+" + movie.release_date.split("-")[0]);
});

app.post('/webhook', express.json(), (req, res) => {
    const { ref } = req.body;
    if (ref === 'refs/heads/main') {
        const { exec } = require('child_process');
        exec('git -C /path/to/your/app pull && pm2 restart my-app', (err, stdout, stderr) => {
            if (err) {
                console.error('Deploy error:', stderr);
                return res.sendStatus(500);
            }
            console.log('Deploy output:', stdout);
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(200);
    }
});

updateSuggestion();

app.listen(PORT, '::', async () => {
    const url = await ngrok.connect(PORT);
    console.log("URL:" + url)
    console.log('Server running on IPv6 and IPv4');
});