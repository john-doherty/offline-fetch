var offlineFetch = require('../src/offline-fetch');
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
});
