var offlineFetch = require('../src/offline-fetch');
var fetch = require('fetch-reply-with');
var helpers = require('./helpers');
var cuid = require('cuid');

describe('offlineFetch (common)', function () {

    // check fake environment before each test as any test could wipeout a global as a negative test
    beforeEach(function() {

        // create fake storage objects we can spy on
        global.sessionStorage = helpers.storageMock();
        global.localStorage = helpers.storageMock();

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

    it('should throw an error if no URL param provided', function() {

        return offlineFetch().catch(function(err) {
            expect(err.message).toEqual('Please provide a URL');
        });
    });

    it('should throw an error if options is not undefined or an object', function() {

        return offlineFetch('http://www.orcascan.com', false).catch(function(err) {
            expect(err.message).toEqual('If defined, options must be of type object');
        });
    });

    it('should throw an error if fetch is not supported', function() {

        // save the global fetch
        var tempFetch = global.fetch;

        // wipe it out so we can trigger the not support error
        global.fetch = null;

        return offlineFetch('http://www.orcascan.com').catch(function(err) {

            expect(err.message).toEqual('fetch not supported, are you missing the fetch polyfill?');

            // restore global fetch to allow other tests to run
            global.fetch = tempFetch;
        });
    });

    it('should include x-offline-cache header', function(done) {

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
            expect(res.headers.get('x-offline-cache')).toEqual('MISS');
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(body);
            done();
        });
    });

    it('should return cached response if error is "Failed to fetch"', function(done) {
        spyOn(global, 'fetch').and.returnValue(Promise.reject(new Error('Failed to fetch')));
        var url = `http://www.${cuid.slug()}.com`;
        var status = 200;
        var body = 'Cached Content!';
        var cacheKey = 'offline-fetch-123';
        // Simulate cached item
        var cachedItem = JSON.stringify({
            url: url,
            status: status,
            statusText: 'OK',
            contentType: 'text/html',
            content: body,
            storedAt: Date.now()
        });
        sessionStorage.getItem.and.returnValue(cachedItem);
        offlineFetch(url, { offline: { renew: true } }).then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            return res.text();
        }).then(function(text) {
            expect(text).toEqual(body);
            done();
        }).catch(done);
    });

    it('should return cached response if error is "Network request failed"', function(done) {
        spyOn(global, 'fetch').and.returnValue(Promise.reject(new Error('Network request failed')));
        var url = `http://www.${cuid.slug()}.com`;
        var status = 200;
        var body = 'Cached Content!';
        var cacheKey = 'offline-fetch-123';
        // Simulate cached item
        var cachedItem = JSON.stringify({
            url: url,
            status: status,
            statusText: 'OK',
            contentType: 'text/html',
            content: body,
            storedAt: Date.now()
        });
        sessionStorage.getItem.and.returnValue(cachedItem);
        offlineFetch(url, { offline: { renew: true } }).then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            return res.text();
        }).then(function(text) {
            expect(text).toEqual(body);
            done();
        }).catch(done);
    });

    it('should return cached response if error is "Promise Timed Out"', function(done) {
        spyOn(global, 'fetch').and.returnValue(Promise.reject(new Error('Promise Timed Out')));
        var url = `http://www.${cuid.slug()}.com`;
        var status = 200;
        var body = 'Cached Content!';
        var cacheKey = 'offline-fetch-123';
        // Simulate cached item
        var cachedItem = JSON.stringify({
            url: url,
            status: status,
            statusText: 'OK',
            contentType: 'text/html',
            content: body,
            storedAt: Date.now()
        });
        sessionStorage.getItem.and.returnValue(cachedItem);
        offlineFetch(url, { offline: { renew: true } }).then(function(res) {
            expect(res).toBeDefined();
            expect(res.status).toEqual(status);
            return res.text();
        }).then(function(text) {
            expect(text).toEqual(body);
            done();
        }).catch(done);
    });
});
