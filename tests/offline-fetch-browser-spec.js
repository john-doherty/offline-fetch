var offlineFetch = require('../src/offline-fetch');
var fetch = require('fetch-reply-with');
var cuid = require('cuid');
var helpers = require('./helpers');

describe('offlineFetch (browser)', function () {

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

    it('should save response to sessionStorage by default', function(done) {

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
            expect(sessionStorage.setItem).toHaveBeenCalled();
            expect(sessionStorage.setItem.calls.count()).toEqual(1);
            expect(res.headers.get('x-offline-cache')).toEqual('MISS');
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
