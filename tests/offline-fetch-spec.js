'use strict';

var blob = require('w3c-blob');
var offlineFetch = require('../src/offline-fetch.js');
var LocalStorage = require('node-localstorage').LocalStorage;
var mockFetch = require('mock-fetch-api');

global.Blob = blob;

// create a fake window object to be consumed within offlineFetch
global.window = {
    sessionStorage: new LocalStorage('./session-storage-scratch'),
    localStorage: new LocalStorage('./local-storage-scratch')
};

// create a fake navigator to be consumed within offlineFetch
global.navigator = {
    onLine: true
};

describe('window.offlineFetch', function () {

    // check fake environment is setup correctly
    beforeEach(function(done) {

        // ensure globals exist
        expect(window).toBeDefined();
        expect(window.sessionStorage).toBeDefined();
        expect(window.localStorage).toBeDefined();
        expect(navigator).toBeDefined();
        expect(navigator.onLine).toEqual(true);
        expect(Blob).toBeDefined();

        var url = 'http://www.orcascan.com';
        var method = 'GET';
        var response = 'Great Barcode App!';

        // setup intercept
        mockFetch.when(method, url).respondWith(200, response);

        // issue request and conform it has been intercepted
        fetch(url, { method: method }).then(function(res) {
            expect(res).toBeDefined();
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(response);
            done();
        });
    });

    it('should be defined', function() {
        expect(offlineFetch).toBeDefined();
    });

    it('should throw an error if no URL param provided', function(done) {

        offlineFetch().catch(function(err) {
            expect(err.message).toEqual('Please provide a URL');
            done();
        })
    });

    it('should throw an error if options is not undefined or an object', function(done) {
        
        offlineFetch('http://www.orcascan.com', false).catch(function(err) {
            expect(err.message).toEqual('If defined, options must be of type object');
            done();
        })
    });

    it ('should error if window.fetch is not supported', function(done) {

        // save the global fetch
        var tempFetch = global.fetch;

        // wipe it out so we can trigger the not support error
        global.fetch = null;

        offlineFetch('http://www.orcascan.com').catch(function(err) {

            expect(err.message).toEqual('fetch not supported, are you missing the window.fetch polyfill?');

            // restore global fetch to allow other tests to run
            global.fetch = tempFetch;
            done();
        })
        
    });

});
