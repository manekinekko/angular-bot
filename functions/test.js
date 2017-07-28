const fetch = require('node-fetch');
const cheerio = require('cheerio');
const crypto = require('crypto');

const EVENTS_API = `https://angular.io/generated/docs/events.json`;
const SEARCH_API = `http://ngdoc.io/api/articles/search`;
const CONTRIBUTORS_API = `https://angular.io/generated/contributors.json`;

(async function testContributors() {
    let selectedContrib = 'CONTRIBUTOR_esoSanderElias';
    selectedContrib = selectedContrib.replace('CONTRIBUTOR_', '');

    const res = await fetch(CONTRIBUTORS_API);
    const data = await res.json();


    const member = Object.keys(data)
        .map(k => data[k])
        .filter(arr => arr.twitter === selectedContrib)
        .pop();

    console.log(member.name, crypto.createHash('sha256').update(member.name, 'utf8').digest('hex'))

    console.log(member);
})();

/*
(async function testContributors() {
    const res = await fetch(CONTRIBUTORS_API);
    const data = await res.json();
    // console.log(Object.keys(data).map(k => data[k].name));

    const core = Object.keys(data)
        .map(k => data[k])
        .filter(arr => arr.group === "Angular")

    function r() {
        const i = (Math.random() * core.length - 1) | 0;
        return core.slice(i, i + 1).pop();
    }
    console.log(core, [r(), r(), r()].map(o => o.name).join(', '));
})();
*/

/** 
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