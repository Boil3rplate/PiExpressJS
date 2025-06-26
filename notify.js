import axios from 'axios';

export async function notify(title, message) {
    try {
        await axios.post(`https://ntfy.sh/TorrentFlix`, message, {
            headers: { 'Title': title }
        });
    } catch (err) {
        console.error('ntfy.sh error:', err.message);
    }
}