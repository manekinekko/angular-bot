process.env.DEBUG = "actions-on-google:*";
const functions = require("firebase-functions");
const App = require('actions-on-google').ApiAiApp;
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const crypto = require('crypto');

const CONTRIBUTORS_API = `https://angular.io/generated/contributors.json`;
const EVENTS_API = `https://angular.io/generated/docs/events.json`;
const SEARCH_API = `http://ngdoc.io/api/articles/search`;
const DOC_API = `https://angular.io/generated/navigation.json`;
const NPM_SEARCH_API = `https://api.npms.io/v2/search?q=#+popularity-weight:10+keywords:ng2,angular2,angular,-angularjs`;

const NO_INPUTS = [
    `I didn't hear that.`,
    `If you're still there, say that again.`,
    `We can stop here. See you soon.`
];

function _hash(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

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

            if (data) {
                if (data.url) {
                    app.data.url = data.url;
                }

                if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
                    const response = `According the angular.io, the Angular team will be presenting at ${data.result[0]}, in ${data.result[1]}, on ${data.result[2]}`;
                    app.tell(
                        app.buildRichResponse()
                        .addSimpleResponse(response)
                        .addBasicCard(
                            app.buildBasicCard(response)
                            .addButton('Visit the website', data.url.href)
                        )
                    );
                } else {
                    app.tell(`According the angular.io, the Angular team will be presenting at ${data.result[0]}, in ${data.result[1]}, on ${data.result[2]}.`, NO_INPUTS);
                }

                app.data.currentEventIndex = 1;
            } else {
                app.data.url = null;
                app.tell(`There are no upcoming events.`);
            }
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

                if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
                    const response = `The Core team is going to be at ${data.result[0]}, in ${data.result[1]}, on ${data.result[2]}`;
                    app.tell(
                        app.buildRichResponse()
                        .addSimpleResponse(response)
                        .addBasicCard(
                            app.buildBasicCard(response)
                            .addButton('Visit the website', data.url.href)
                        )
                    );
                } else {
                    app.tell(`The Core team is going to be at ${data.result[0]}, in ${data.result[1]}, on ${data.result[2]}.`, NO_INPUTS);
                }

                app.data.currentEventIndex++;
            } else {
                app.data.url = null;
                app.tell(`There are no more upcoming events.`);
            }
        })
        .catch(e => console.error(e));
}

function search(app) {
    const searchType = app.getArgument('search-type');
    const searchKeyword = app.getArgument('search-keyword');
    if (searchType === 'library') {
        return searchForLibrary(app, searchKeyword);
    } else {
        return searchByArticle(app, searchKeyword);
    }
}

function searchByArticle(app, searchKeyword) {
    fetch(SEARCH_API, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "keywords": searchKeyword,
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
        .then(entry => {
            console.log('found an article', entry);

            if (entry) {
                const responsePrefix = `I found this article by ${entry.result.author_name}:`;
                const response = `${responsePrefix} ${entry.result.title}.`;

                app.data.url = entry.url;
                console.log('setting article url info', app.data.url);

                if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {

                    app.tell(
                        app.buildRichResponse()
                        .addSimpleResponse(response)
                        .addBasicCard(
                            app.buildBasicCard(entry.url.description)
                            .setTitle(`${entry.result.title} by ${entry.result.author_name}`)
                            .addButton('Visit the website', entry.url.href)
                            .setImage(entry.url.img, entry.url.img)
                        )
                    );

                } else if (app.hasSurfaceCapability(app.SurfaceCapabilities.AUDIO_OUTPUT)) {
                    app.tell(`${response}`, NO_INPUTS);
                } else {
                    app.tell(`${response} (${entry.url.href})`, NO_INPUTS);
                }

            } else {
                console.log('no article found', entry);
                app.data.url = null;
                app.tell(`Sorry. I could not find anything related to ${searchKeyword}. Try another request.`);
            }
        })
        .catch(e => console.error(e));
}

function searchForLibrary(app, searchKeyword) {
    fetch(NPM_SEARCH_API.replace('#', searchKeyword))
        .then(res => res.json())
        .then(res => {
            if (res && res.results && res.results.length > 0) {
                const entry = res.results[(Math.random() * res.results.length) | 0];
                return buildUrlCard(entry.package.links.repository, entry);
            }
            return null;
        })
        .then(entry => {

            if (entry) {
                console.log('found a library', entry);

                const response = `I found this package on NPM: ${entry.result.package.name} - ${entry.result.package.description}.`;

                app.data.url = entry.url;
                console.log('setting library url info', app.data.url);

                if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {

                    app.tell(
                        app.buildRichResponse()
                        .addSimpleResponse(response)
                        .addBasicCard(
                            app.buildBasicCard(entry.result.package.description)
                            .setTitle(`${entry.url.title}`)
                            .addButton('Visit the repository', entry.url.href)
                            .setImage('https://crossbrowsertesting.com/design/images/github-logo.png', entry.url.href)
                        )
                    );

                } else if (app.hasSurfaceCapability(app.SurfaceCapabilities.AUDIO_OUTPUT)) {
                    app.tell(`${response}`, NO_INPUTS);
                } else {
                    app.tell(`${response} (${entry.url.href})`, NO_INPUTS);
                }

            } else {
                console.log('no library found', entry);
                app.data.url = null;
                app.tell(`Sorry. I could not find any library matching your request.`);
            }
        })
        .catch(e => console.error(e));
}

function checkVersion(app) {
    fetch(DOC_API)
        .then(res => res.json())
        .then(res => {
            app.tell(`The current version of Angular is: ${res.__versionInfo.version}.`)
        })
        .catch(e => console.error(e));
}

function contributors(group, title) {

    return function(app) {
        return fetch(CONTRIBUTORS_API)
            .then(res => res.json())
            .then(data => {
                const members = Object.keys(data)
                    .map(k => data[k])
                    .filter(arr => arr.group === group)

                console.log('team members', group, members);

                function r() {
                    const i = (Math.random() * members.length - 1) | 0;
                    const rand = members.slice(i, i + 1);
                    return rand[0];
                }

                const response = `Alright! I found ${members.length} members on the ${group} team`;

                if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
                    let list = app.buildList(title);

                    for (let i = 0; i < members.length; i++) {
                        const t = members[i];

                        list = list.addItems(
                            // app.buildOptionItem(`CONTRIBUTOR_${_hash(t.name)}`)
                            app.buildOptionItem(t.name, [t.name])
                            .setTitle(t.name)
                            .setDescription(t.bio)
                            .setImage(`https://angular.io/generated/images/bios/${t.picture}`, `${t.name}'s picture`)
                        );

                        console.log('builing list with member', t);
                    }

                    app.askWithList(`${response}. Which team member were you looking for?`, list);

                } else {
                    app.tell(`${response}. Here are 3 of them: ${r().name}, ${r().name} and ${r().name}. Visit angular.io/about to discover more of them.`, NO_INPUTS);
                }
            })
            .catch(e => console.error(e));
    }
}

function contributorsOption(app) {
    // let selectedContribName = app.getSelectedOption();
    let selectedContribName = app.getContextArgument('actions_intent_option', 'OPTION').value;
    console.log('selected member', selectedContribName);

    if (selectedContribName.indexOf('CONTRIBUTOR_') !== 0) {
        const selectedContribHash = selectedContribName.replace('CONTRIBUTOR_', '');

        fetch(CONTRIBUTORS_API)
            .then(res => res.json())
            .then(data => {
                const member = Object.keys(data)
                    .map(k => data[k])
                    .filter(o => o.name === selectedContribName)
                    .pop();

                console.log('found selected member', member);

                if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
                    const twitterUrl = `https://twitter.com/${member.twitter}`;

                    app.tell(
                        app.buildRichResponse()
                        .addSimpleResponse(`${member.bio}`)
                        .addBasicCard(
                            app.buildBasicCard(member.name)
                            .addButton('Visit Twitter', twitterUrl)
                            .setImage(`https://angular.io/generated/images/bios/${member.picture}`, `${member.name}'s picture`)
                        )
                    );

                } else {
                    app.tell(`${member.bio}`, NO_INPUTS);
                }
            })
            .catch(e => console.error(e));

    } else {
        app.tell("Sorry, I could not find this memeber's bio. Make sure you've selected the right option from the list.");
    }
}


function eg(app) {
    if (app.hasSurfaceCapability(app.SurfaceCapabilities.AUDIO_OUTPUT)) {
        app.tell(`
            <speak>Shy is a rock star! <emphasis>Put your hands up in the air.</emphasis>
                <audio src="https://storage.googleapis.com/angular-bot-12202.appspot.com/ng-show.mp3"></audio>
            </speak>
        `);
    } else {
        app.data.url = {
            href: 'https://www.youtube.com/watch?v=aSFfLVxT5vA&t=48s',
            title: 'The ng-show: Angular 2 - Shai Reznik',
            description: ''
        };
        app.tell(`Shy is a rock star! Put your hands up in the air. (https://www.youtube.com/watch?v=aSFfLVxT5vA&t=48s)`);
    }
}

exports.assistant = functions.https.onRequest((request, response) => {
    const app = new App({ request, response });
    let actionMap = new Map();
    actionMap.set('_angular.upcoming_events', upcomingEvents);
    actionMap.set('_angular.upcoming_events:next', upcomingEventsNext);
    actionMap.set('_angular.search', search);
    actionMap.set('_angular.check_version', checkVersion);
    actionMap.set('_angular.core_team', contributors('Angular', 'The Angular Core Team'));
    actionMap.set('_angular.gde_team', contributors('GDE', 'The Angular GDE Team'));
    actionMap.set('actions.intent.OPTION', contributorsOption);
    actionMap.set('_angular.eg', eg);
    app.handleRequest(actionMap);
});