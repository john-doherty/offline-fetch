'use strict';

var mockFetch = require('mock-fetch-api');
var offlineFetch = require('../src/offline-fetch.js');
var LocalStorage = require('node-localstorage').LocalStorage;


var localStorage = new LocalStorage('./scratch');

global.window = {
    sessionStorage: localStorage,
    localStorage: localStorage
}

global.navigator = {
    onLine: true
};

describe('offline-fetch tests', function () {

    // create a new browser instance before each test
    beforeEach(function () {
        expect(fetch);
        //fetch.mockResponse(JSON.stringify({access_token: '12345' }));
    });

    it('should exist', function (done) {

        var url = 'http://mydomain.com';
        var method = 'GET';
        var response = 'Hello World';

        mockFetch.when(method, url).respondWith(200, response);

        offlineFetch(url).then(function(res) {
            expect(res).toBeDefined();
            return res.text();
        })
        .then(function(text) {
            expect(text).toEqual(response);
            done();
        });
    });

});
