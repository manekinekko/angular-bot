process.env.DEBUG = "actions-on-google:*";
const functions = require("firebase-functions");
const App = require('actions-on-google').ApiAiApp;
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const EVENTS_API = `https://angular.io/generated/docs/events.json`;
const SEARCH_API = `http://ngdoc.io/api/articles/search`;
const DOC_API = `https://angular.io/generated/navigation.json`;

function buildUrlCard(url, result) {
    if (url) {
        return fetch(url)
            .then(res => res.text())
            .then(txt => {
                const $ = cheerio.load(txt);
                let img = $('img').attr('src');
                if (img && img.startsWith('http') === false) {
                    img = url + img;
                }

                return {
                    result,
                    url: {
                        href: url,
                        title: $('title').text(),
                        description: $('meta[name="description"]').attr('content'),
                        img,
                    }
                }
            });
    } else {
        return Promise.resolve({
            result
        });
    }
}

function getEvent(currentIndex) {
    return fetch(EVENTS_API)
        .then(res => res.json())
        .then(txt => {
            const $ = cheerio.load(txt.contents)
            const event = $($('tbody tr').get(currentIndex));
            let result = [event.find('th').text()];
            result = result.concat(Array.from(event.children('td').map((i, e) => $(e).text())))
            const url = event.find('th>a').attr('href');

            console.log(`getting event id=${currentIndex}`, result);
            return buildUrlCard(url, result);
        });
}

function upcomingEvents(app) {
    getEvent(0)
        .then(data => {
            console.log('upcomingEvents::getting data', data);
            if (data.url) {
                app.data.url = data.url;
            }

            app.data.currentEventIndex = 1;
            app.ask(`According the angular.io, the Angular team will be presenting at ${data.result[0]}, in ${data.result[1]}, on ${data.result[2]} (${data.url.href}).`);
        })
        .catch(e => console.error(e));
}

function upcomingEventsNext(app) {
    getEvent(app.data.currentEventIndex ||  0)
        .then(data => {
            console.log('upcomingEventsNext::getting data', data);
            if (data) {
                if (data.url) {
                    app.data.url = data.url;
                }

                app.data.currentEventIndex++;
                app.ask(`The Core team is going to be at ${data.result[0]}, in ${data.result[1]}, on ${data.result[2]} (${data.url.href}).`);
            } else {
                app.data.url = null;
                app.ask(`There are no more upcoming events.`);
            }
        })
        .catch(e => console.error(e));
}

function searchByKeyword(app) {
    const search = app.getArgument('search');
    fetch(SEARCH_API, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "keywords": search,
                "version": "2+",
                "tags": []
            })
        })
        .then(res => res.json())
        .then(result => {
            if (result && result.length > 0) {
                const entry = result[(Math.random() * result.length) | 0];
                return buildUrlCard(entry.url, entry);
            }
            return null;
        })
        .then(data => {
            console.log('search results', data);

            if (data) {
                app.data.url = data.url;
                app.ask(`I just checked ngdoc.io and found this article by ${data.result.author_name}: "${data.result.title}" (${data.url.href}).`);
            } else {
                app.ask(`Sorry. I could not find anything related to ${search}. Try another request.`);
            }
        })
        .catch(e => console.error(e));
}

function checkVersion(app) {
    fetch(DOC_API)
        .then(res => res.json())
        .then(res => {
            app.ask(`The current version of Angular is: ${res.__versionInfo.version}.`)
        })
        .catch(e => console.error(e));
}

exports.assistant = functions.https.onRequest((request, response) => {
    const app = new App({ request, response });
    let actionMap = new Map();
    actionMap.set('upcoming-events', upcomingEvents);
    actionMap.set('upcoming-events.next', upcomingEventsNext);
    actionMap.set('search-by.keyword', searchByKeyword);
    actionMap.set('check-version', checkVersion);
    app.handleRequest(actionMap);
});