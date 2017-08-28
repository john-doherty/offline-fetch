/*!
 * offline-fetch - v@version@
 * Adds offline support to window.fetch
 * https://github.com/john-doherty/offline-fetch
 * @author John Doherty <www.johndoherty.info>
 * @license MIT
 */
(function () {

    'use strict';

    /**
     * Adds offline support to window.fetch - returning previous responses no internet connection detected
     * @param {string} url - URL to request
     * @param {object} options - fetch options with additional .offlineable, .storage & .timeout properties
     * @example
     *      var options = {
     *          offline: {
     *              storage: 'localStorage',
     *              timeout: 30 * 1000,
     *              expires: 300 * 1000,
     *              logging: true,
     *              cacheKeyGenerator: function(url, opts, hash) {
     *                  return 'myapp:' + url;
     *              }
     *          }
     *      };
     *
     *      offlineFetch('https://courseof.life/johndoherty.json', options).then(function(data) {
     *          // data contains either online request response or cached response
     *      });
     * @returns {Promise} executes .then with either cached or fetched response if successful, otherwise catch is throw
     */
    function offlineFetch(url, options) {

        if (!url || url === '') return Promise.reject(new Error('Please provide a URL'));
        if (options !== undefined && typeof options !== 'object') return Promise.reject(new Error('If defined, options must be of type object'));
        if (!fetch) return Promise.reject(new Error('fetch not supported, are you missing the window.fetch polyfill?'));

        // offline not requested, execute a regular fetch
        if (!options || !options.offline) return fetch(url, options);

        //options = options || {}; // ensure we always have an options object
        //options.offline = options.offline || {}; // ensure we always have an options object

        //if (typeof options && typeof options !== 'object') return Promise.reject(new Error('Options must be of type object'));

        //if (!options || !options.offline) return fetch(url, options);



        

        //options.offline = (options.offline === undefined || options.offline === true) ? {} : undefined;

        // if (typeof options.offline !== 'object') {
        //     options.offline = (options.offline === true) ? {} : undefined;
        // }

        // if (typeof options.offline === 'boolean') {
        //     options.offline = {};
        // }

        //options.offline = (options.offline === true) ? {} : options.offline;

        // could be offline: true (in which case we cache content in session storage but only serve it up when offline - could be via prop or timeout)

        var offlineable = (options.offline);                        // if it's
        var storage = window[options.storage || 'sessionStorage'];  // determine storage type, defaults to sessionStorage (supports any storage that matches the localStorage API)
        var timeout = parseInt(options.timeout || '10000', 10);     // request timeout in milliseconds, defaults to 30 seconds
        var expires = parseInt(options.expires || '-1', 10);        // expires in milliseconds, defaults to -1
        var debug = (options.debug === true);                       // logs request/cache hits to console if enabled, default false
        var method = options.method || 'GET';                       // method, defaults to GET
        var isOffline = (navigator.onLine === false);               // detect offline if supported (if true, browser supports the property & client is offline)
        var requestHash = stringToHash(method + '|' + url);         // a hash of the method + url, used as default cache key if no generator passed

        // if cacheKeyGenerator provided, use that otherwise use the hash generated above
        var cacheKey = (options.cacheKeyGenerator) ? options.cacheKeyGenerator(url, options, requestHash) : requestHash;

        // wrap cache gets in Promises, just in case we're using a promise based library such as window['localforage']
        var cacheGets = [
            Promise.resolve(storage.getItem(cacheKey)),
            Promise.resolve(storage.getItem(cacheKey + ':ts'))
        ];

        // execute cache gets
        return Promise.all(cacheGets).then(function (data) {

            var cachedResponse = data[0];                               // the cached response from storage
            var whenCached = parseInt(data[1] || '0', 10);              // the date-time (in ms) the response was cached from storage
            var cacheExpired = (expires > 0) ? ((Date.now() - whenCached)) < expires : true;

            // if the request is cached and we're offline, return it
            if (cachedResponse && isOffline) {
                if (debug) log('offlineFetch[cache] (offline): ' + url);
                return Promise.resolve(new Response(new Blob([cachedResponse])));
            }

            // if the request is cached, expires is set and not expired, return it
            if (cachedResponse && expires > 0 && !cacheExpired) {
                if (debug) log('offlineFetch[cache]: ' + url);
                return Promise.resolve(new Response(new Blob([cachedResponse])));
            }

            // if we have a timeout, wrap fetch in timeout-promise otherwise execute a normal fetch
            var request = (timeout > 0) ? promiseTimeout(timeout, fetch(url, options)) : fetch(url, options);

            // execute the request
            return request.then(function (res) {

                // if this request is to be cached and has a success response, cache it
                if (offlineable && res.status === 200) {

                    var contentType = res.headers.get('Content-Type') || '';

                    // let's only store in cache if the content-type is JSON or something non-binary
                    if (contentType.match(/application\/json/i) || contentType.match(/text\//i)) {
                        // There is a .json() instead of .text() but we're going to store it as a string anyway.
                        // If we don't clone the response, it will be consumed by the time it's returned.
                        // This way we're being un-intrusive.
                        res.clone().text().then(function (content) {

                            // store the content in cache
                            storage.setItem(cacheKey, content);

                            // store the date-time in milliseconds that the item was cached
                            storage.setItem(cacheKey + ':ts', Date.now());
                        });
                    }
                }

                if (debug) log('offlineFetch[live]: ' + url);

                return res;
            })
            .catch(function (error) {

                // return cached response if we have it
                if (cachedResponse) {
                    if (debug) log('offlineFetch[cache] (timedout): ' + url);
                    return Promise.resolve(new Response(new Blob([cachedResponse])));
                }

                // otherwise rethrow the error as it timedout but we dont have cache
                throw error;
            });
        });
    }

    /* --- HELPERS --- */

    /**
     * Logs to console if its available
     * @param {any} value - value to log to the console
     * @returns {void}
     */
    function log(value) {
        if (console && console.log) {
            console.log(value);
        }
    }

    /**
     * Returns the hash of string (slightly compressed)
     * @param {string} value - string to hash
     * @returns {string} hash of the value
     */
    function stringToHash(value) {

        var hash = 0;

        if (value.length === 0) return hash;

        for (var i = 0, l = value.length; i < l; i++) {
            var char = value.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return hash;
    }

    /**
     * wraps a promise in a timeout, allowing the promise to reject if not resolve with a specific period of time
     * @param {integer} ms - milliseconds to wait before rejecting promise if not resolved
     * @param {Promise} promise to monitor
     * @example
     *  promiseTimeout(1000, fetch('https://courseof.life/johndoherty.json'))
     *      .then(function(cvData){
     *          alert(cvData);
     *      })
     *      .catch(function(){
     *          alert('request either failed or timed-out');
     *      });
     * @returns {Promise} resolves as normal if not timed-out, otherwise rejects
     */
    function promiseTimeout(ms, promise) {

        return new Promise(function (resolve, reject) {

            // create a timeout to reject promise if not resolved
            var timer = setTimeout(function () {
                reject(new Error('Timedout'));
            }, ms);

            promise.then(function (res) {
                clearTimeout(timer);
                resolve(res);
            })
            .catch(function (err) {
                clearTimeout(timer);
                reject(err);
            });
        });
    }

    if (typeof window === 'undefined') {
        module.exports = offlineFetch;
    }
    else {
        window.offlineFetch = offlineFetch;
    }

})();
