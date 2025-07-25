var offlineFetch = require('../src/offline-fetch');
var helpers = require('./helpers');
var fetch = require('fetch-reply-with');
var cuid = require('cuid');
var { LocalStorage } = require('node-localstorage');

var localStorage = new LocalStorage('fetch-storage/local');
var sessionStorage = new LocalStorage('fetch-storage/session');

jasmine.getEnv().allowRespy(true);

describe('offlineFetch (node)', function () {

    // check fake environment before each test as any test could wipeout a global as a negative test
    beforeEach(function() {

        // create fake storage objects we can spy on
        global.sessionStorage = sessionStorage;
        global.localStorage = localStorage;

        // create a fake navigator to be consumed within offlineFetch
        global.navigator = { onLine: true };

        expect(navigator).toBeDefined();
        expect(navigator.onLine).toEqual(true);

        // spy on storage function so we can verify responses are cached
        spyOn(localStorage, 'getItem').and.callThrough();
        spyOn(localStorage, 'setItem').and.callThrough();
        spyOn(sessionStorage, 'getItem').and.callThrough();
        spyOn(sessionStorage, 'setItem').and.callThrough();
    });

    afterEach(function() {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('should save response to node sessionStorage by default', function(done) {

        var url = `http://www.${cuid.slug()}.com`;
        var status = helpers.randomIntBetween(200, 299);
        var body = 'Great Barcode App!';

        // setup intercept
        fetch(url, {
            replyWith: {
                status: status,
                body: body,
                headers: {
                    'content-type': 'text/html'
                }
            }
        });

        // issue request and conform it has been intercepted
        offlineFetch(url, { offline: true }).then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(body);
            setTimeout(function() {
                expect(sessionStorage.setItem).toHaveBeenCalled();
                expect(sessionStorage.setItem.calls.count()).toEqual(1);
                done();
            }, 10);
        });
    });

    it('should save response to node localStorage when set', function(done) {

        var now = (new Date()).getTime();
        var url = `http://www.${cuid.slug()}.com`;
        var status = helpers.randomIntBetween(200, 299);
        var body = String(now * 100);

        // setup intercept
        fetch(url, {
            replyWith: {
                status: status,
                body: body,
                headers: {
                    'content-type': 'text/html'
                }
            }
        });

        // issue request and confirm it has been intercepted
        offlineFetch(url, {
            offline: {
                storage: 'localStorage'
            }
        })
        .then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(body);
            setTimeout(function() {
                expect(localStorage.setItem).toHaveBeenCalled();
                expect(localStorage.setItem.calls.count()).toEqual(1);
                done();
            }, 10);
        });
    });
});
