import path from "path";
import open from 'open';
import axios from "axios";
import fs from 'fs';

import axios from 'axios';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';

const QB_URL = 'http://localhost:8080'; // adjust if needed
const QB_USERNAME = 'admin'; // your qBittorrent username
const QB_PASSWORD = 'apples'; // your password
const MOVIE_PATH = 'C:/Users/ancui/PlexMedia/Movies'; // set your custom path
const TV_PATH = 'C:/Users/ancui/PlexMedia/TV Shows'; // set your custom path

const login = async () => {
  await axios.post(`${QB_URL}/api/v2/auth/login`, null, {
    params: { username: QB_USERNAME, password: QB_PASSWORD },
    withCredentials: true
  });
};

export const openTorrent = async (url, isMovie) => {
    let path = MOVIE_PATH;
    if(!isMovie) {
        path = TV_PATH;
    }
  await login();

  if (url.startsWith('magnet:')) {
    await axios.post(`${QB_URL}/api/v2/torrents/add`, null, {
      params: { urls: url, savepath: path },
      withCredentials: true
    });
  } else if (url.startsWith('http')) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const form = new FormData();
    form.append('torrents', Buffer.from(res.data), 'file.torrent');
    form.append('savepath', path);

    await axios.post(`${QB_URL}/api/v2/torrents/add`, form, {
      headers: form.getHeaders(),
      withCredentials: true
    });
  } else {
    console.error('Unsupported URL:', url);
  }
};
