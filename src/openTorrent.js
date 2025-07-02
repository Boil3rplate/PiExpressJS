import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import FormData from 'form-data';

const QB_URL = 'http://localhost:8080';
const QB_USERNAME = 'admin';
const QB_PASSWORD = 'apples';
const MOVIE_PATH = 'C:/Users/ancui/PlexMedia/Movies';
const TV_PATH = 'C:/Users/ancui/PlexMedia/TV Shows';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, baseURL: QB_URL }));

const login = async () => {
  const res = await client.post('/api/v2/auth/login', null, {
    params: { username: QB_USERNAME, password: QB_PASSWORD },
  });

  if (res.data !== 'Ok.') throw new Error('Login failed');
};

export const openTorrent = async (url, isMovie) => {
  const savePath = isMovie ? MOVIE_PATH : TV_PATH;
  await login();

  if (url.startsWith('magnet:')) {
    await client.post('/api/v2/torrents/add', null, {
      params: { urls: url, savepath: savePath },
    });
  } else if (url.startsWith('http')) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const form = new FormData();
    form.append('torrents', Buffer.from(res.data), 'file.torrent');
    form.append('savepath', savePath);

    await client.post('/api/v2/torrents/add', form, {
      headers: form.getHeaders(),
    });
  } else {
    console.error('Unsupported URL:', url);
  }
};
