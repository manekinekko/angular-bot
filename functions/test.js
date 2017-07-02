const fetch = require('node-fetch');
const cheerio = require('cheerio');

const EVENTS_API = `https://angular.io/generated/docs/events.json`;
const SEARCH_API = `http://ngdoc.io/api/articles/search`;

//** 
async function buildUrlCard(url) {
    if (url) {
        const res = await fetch(url);
        let txt = await res.text();
        const $ = cheerio.load(txt);

        let img = $('img').attr('src');
        if (img && img.startsWith('http') === false) {
            img = url + img;
        }

        console.log({
            title: $('title').text(),
            description: $('meta[name="description"]').attr('content'),
            img,
        });
    }
}

(async function testUpcomingEvent() {
    const res = await fetch(EVENTS_API);
    const txt = await res.json();
    const $ = cheerio.load(txt.contents);
    const firstEvent = $($('tbody tr').get(3));
    let result = [firstEvent.find('th').text(), firstEvent.find('th>a').attr('href')];
    result = result.concat(Array.from(firstEvent.children('td').map((i, e) => $(e).text())));

    buildUrlCard(result[1]);
})();
/**/

/**
(function testSearch() {

    fetch(SEARCH_API, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "keywords": "universal",
                "version": "2+",
                "tags": []
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
        });

})();

/**/