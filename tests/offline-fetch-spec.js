var offlineFetch = require('../src/offline-fetch');
var fetch = require('fetch-reply-with');
var cuid = require('cuid');

describe('offlineFetch (general)', function () {

    // check fake environment before each test as any test could wipeout a global as a negative test
    beforeEach(function() {

        // create fake storage objects we can spy on
        global.sessionStorage = storageMock();
        global.localStorage = storageMock();

        // create a fake navigator to be consumed within offlineFetch
        global.navigator = { onLine: true };

        // spy on storage function so we can verify responses are cached
        spyOn(sessionStorage, 'getItem').and.callThrough();
        spyOn(sessionStorage, 'setItem').and.callThrough();
        spyOn(localStorage, 'getItem').and.callThrough();
        spyOn(localStorage, 'setItem').and.callThrough();

        expect(navigator).toBeDefined();
        expect(navigator.onLine).toEqual(true);
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

    it('should throw an error if fetch is not supported', function(done) {

        // save the global fetch
        var tempFetch = global.fetch;

        // wipe it out so we can trigger the not support error
        global.fetch = null;

        offlineFetch('http://www.orcascan.com').catch(function(err) {

            expect(err.message).toEqual('fetch not supported, are you missing the fetch polyfill?');

            // restore global fetch to allow other tests to run
            global.fetch = tempFetch;
            done();
        });
    });

    it('should save response to sessionStorage by default', function(done) {

        var url = `http://www.${cuid.slug()}.com`;
        var status = randomIntBetween(200, 299);
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
            expect(sessionStorage.setItem).toHaveBeenCalled();
            expect(sessionStorage.setItem.calls.count()).toEqual(1);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(body);
            done();
        });
    });

    it('should save response to localStorage when set', function(done) {

        var now = (new Date()).getTime();
        var url = `http://www.${cuid.slug()}.com`;
        var status = randomIntBetween(200, 299);
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
            expect(localStorage.setItem).toHaveBeenCalled();
            expect(localStorage.setItem.calls.count()).toEqual(1);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(body);
            done();
        });
    });

    it('should return offline content when navigator.onLine is false', function(done) {

        var now = (new Date()).getTime();
        var url = 'http://www.' + now + '.com';
        var status = randomIntBetween(200, 299);
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

        // set offline
        global.navigator.onLine = false;

        // issue request and confirm it has been intercepted
        offlineFetch(url, {
            offline: true
        })
        .then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            expect(sessionStorage.getItem).toHaveBeenCalled();
            expect(sessionStorage.getItem.calls.count()).toEqual(1);
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(body);
            done();
        });
    });

    // it('should return offline content when a request timesout')
    // it('should check for new content when cache expires')
    // it('should return cached content if expired but offline')
    // it('should returned cached content if expired but timesout')
    // it('should update cache when expired and new content recieved')
    // it('should not execute request if expires is set and not expired')
    // it('should always return live content if expired not set')
});

/* --- HELPERS --- */

/**
 * Returns a random number between two numbers
 * @param {integer} min - minimum number
 * @param {integer} max - maximum number
 * @returns {integer} number between min and max
 */
function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Creates a simple storage object mimicking the localStorage API
 * @returns {object} localStorage mock object
 */
function storageMock() {

    var storage = {};

    return {
        setItem: function(key, value) {
            storage[key] = value || '';
        },
        getItem: function(key) {
            return key in storage ? storage[key] : null;
        },
        removeItem: function(key) {
            delete storage[key];
        },
        key: function(i) {
            var keys = Object.keys(storage);
            return keys[i] || null;
        },
        keys: function() {
            return Object.keys(storage);
        }
    };
}
