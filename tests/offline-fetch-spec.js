'use strict';

var blob = require('w3c-blob');
var offlineFetch = require('../src/offline-fetch.js');
var fetch = require('fetch-reply-with');

describe('window.offlineFetch', function () {

    // check fake environment before each test as any test could wipeout a global as a negative test
    beforeEach(function() {

        // create fake storage objects we can spy on
        global.window = {
            sessionStorage: jasmine.createSpyObj('sessionStorage', ['getItem', 'setItem']),
            localStorage: jasmine.createSpyObj('localStorage', ['getItem', 'setItem'])
        };

        // add Blob support
        global.Blob = blob;

        // create a fake navigator to be consumed within offlineFetch
        global.navigator = { onLine: true };

        expect(window).toBeDefined();
        expect(window.sessionStorage.getItem).toBeDefined();
        expect(window.sessionStorage.setItem).toBeDefined();
        expect(window.localStorage.getItem).toBeDefined();
        expect(window.localStorage.setItem).toBeDefined();
        expect(navigator).toBeDefined();
        expect(navigator.onLine).toEqual(true);
        expect(Blob).toBeDefined();
    });

    it('should be defined', function() {
        expect(offlineFetch).toBeDefined();
    });

    it('should throw an error if no URL param provided', function(done) {

        offlineFetch().catch(function(err) {
            expect(err.message).toEqual('Please provide a URL');
            done();
        });
    });

    it('should throw an error if options is not undefined or an object', function(done) {

        offlineFetch('http://www.orcascan.com', false).catch(function(err) {
            expect(err.message).toEqual('If defined, options must be of type object');
            done();
        });
    });

    it('should throw an error if window.fetch is not supported', function(done) {

        // save the global fetch
        var tempFetch = global.fetch;

        // wipe it out so we can trigger the not support error
        global.fetch = null;

        offlineFetch('http://www.orcascan.com').catch(function(err) {

            expect(err.message).toEqual('fetch not supported, are you missing the window.fetch polyfill?');

            // restore global fetch to allow other tests to run
            global.fetch = tempFetch;
            done();
        });
    });

    it('should save response to sessionStorage by default', function(done) {

        var url = 'http://www.orcascan.com';
        var status = randomIntBetween(200, 299);
        var data = 'Great Barcode App!';

        // setup intercept
        fetch(url, {
            replyWith: {
                status: status,
                body: data,
                headers: {
                    'content-type': 'text/html'
                }
            }
        });

        // issue request and conform it has been intercepted
        offlineFetch(url, { offline: true }).then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            expect(window.sessionStorage.setItem).toHaveBeenCalled();
            //expect(window.sessionStorage.setItem.calls.length).toEqual(1);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(data);
            done();
        });
    });

    it('should save response to localStorage when set', function(done) {

        var now = (new Date()).getTime();
        var url = 'http://www.' + now + '.com';
        var status = randomIntBetween(200, 299);
        var data = String(now * 100);

        // setup intercept
        fetch(url, {
            replyWith: {
                status: status,
                body: data,
                headers: {
                    'content-type': 'text/html'
                }
            }
        });

        // issue request and conform it has been intercepted
        offlineFetch(url, {
            offline: {
                storage: 'localStorage'
            }
        })
        .then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            expect(window.localStorage.setItem).toHaveBeenCalled();
            //expect(window.localStorage.setItem.calls.length).toEqual(1);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(data);
            done();
        });
    });

    /**
     * tests
     * 1) check it adds to sessionStorage by default
     * 2) check it adds to localStorage when set
     * 3) check it returns offline content when onLine is false
     * 4) check it returns offline content when a request times out according to timeout property
     * 5) check it checks for new content when cache expires
     * 6) check it still returns cached content if expired but offline
     * 7) check it still returns cached content if expired and timesout
     * 8) check it updates cache when expired and new content returned
     * 9) check it does not execute request if expires is set and not expired
     * 10) check it always checks for live content if expires not set (if expires not set, always returns live content if online)
     */

});

/* --- HELPERS --- */

function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
