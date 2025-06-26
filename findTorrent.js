import * as cheerio from 'cheerio';

export const findTPBTorrent = async (term) => {
    try {
        const url = 'https://thepiratebay7.com/search/';
        const res = await fetch(`${url}${term}`);
        const html = await res.text();

        let $ = cheerio.load(html);
        const targetDiv = $('.detName').first(); // Select the first div with the class
        const torrentUrl = targetDiv.find('a').attr('href'); // Get the href of the <a> tag inside
        //console.log('torrentUrl:', torrentUrl);

        const torrentRes = await fetch(torrentUrl);
        const torrentHTML = await torrentRes.text();
        $ = cheerio.load(torrentHTML);

        const downloadDiv = $('.download').first();
        const magnetUrl = downloadDiv.find('a').attr('href'); // Get the href of the <a> tag inside
        console.log('magnetUrl:', magnetUrl);

        return magnetUrl;
    } catch (e) {
        //console.log(e);
        return '';
    }
}

// findTorrent('shrek');

export const findYTSTorrent = async (term) => {
    const url = 'https://en.yts-official.mx/browse-movies?keyword=';
    const res = await fetch(`${url}${term}&order_by=oldest`);
    const html = await res.text();

    let $ = cheerio.load(html);
    const targetDiv = $('.browse-movie-wrap').first(); // Select the first div with the class
    const torrentUrl = 'https://en.yts-official.mx' + targetDiv.find('a').attr('href'); // Get the href of the <a> tag inside
    //console.log('torrentUrl:', torrentUrl);

    const torrentRes = await fetch(torrentUrl);
    const torrentHTML = await torrentRes.text();
    $ = cheerio.load(torrentHTML);

    const downloadDiv = $('#movie-info').first();


    const firstHref = "https://en.yts-official.mx/" + downloadDiv.find('p a').first().attr('href');
    console.log('magnetUrl:', firstHref);

    return firstHref;
}

export const findTorrent = async (term) => {

    try {
        const res = await findYTSTorrent(term);
        console.log("result from YTS: " + res);
        return res;
    } catch (e) {
        const res = await findTPBTorrent(term);
        console.log("result from TPB: " + res);
        return res;
    }
}

//findTorrent('sjfjdksfn');