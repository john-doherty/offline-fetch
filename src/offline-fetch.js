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

        // get the offline options, if set to true assumes defaults
        var offlineOptions = (typeof options.offline !== 'object') ? {} : options.offline;

        var storage = window[offlineOptions.storage || 'sessionStorage'];  // determine storage type, default sessionStorage (supports any storage that matches the localStorage API)
        var timeout = parseInt(offlineOptions.timeout || '10000', 10);     // request timeout in milliseconds, defaults to 30 seconds
        var expires = parseInt(offlineOptions.expires || '-1', 10);        // expires in milliseconds, defaults to -1
        var debug = (offlineOptions.debug === true);                       // logs request/cache hits to console if enabled, default false
        var method = options.method || 'GET';                       // method, defaults to GET
        var isOffline = (navigator.onLine === false);               // detect offline if supported (if true, browser supports the property & client is offline)
        var requestHash = 'key:' + stringToHash(method + '|' + url);         // a hash of the method + url, used as default cache key if no generator passed

        // if cacheKeyGenerator provided, use that otherwise use the hash generated above
        var cacheKey = (options.cacheKeyGenerator) ? options.cacheKeyGenerator(url, options, requestHash) : requestHash;

        // execute cache gets
        return Promise.resolve(storage.getItem(cacheKey)).then(function (cachedResponse) {

            // convert to JSON if it's not already
            cachedResponse = (typeof cachedResponse !== 'object') ? JSON.parse(cachedResponse) : cachedResponse;

            // determine if the cached content has expired
            var cacheExpired = (cachedResponse && expires > 0) ? ((Date.now() - cachedResponse.storedAt)) < expires : true;

            // if the request is cached and we're offline, return it
            if (cachedResponse && isOffline) {
                if (debug) log('offlineFetch[cache] (offline): ' + url);
                return Promise.resolve(new Response(cachedResponse.content, { headers: { 'Content-Type': cachedResponse.contentType } }));
            }

            // if the request is cached, expires is set and not expired, return it
            if (cachedResponse && expires > 0 && !cacheExpired) {
                if (debug) log('offlineFetch[cache]: ' + url);
                return Promise.resolve(new Response(cachedResponse.content, { headers: { 'Content-Type': cachedResponse.contentType } }));
            }

            // if we have a timeout, wrap fetch in timeout-promise otherwise execute a normal fetch
            var request = (timeout > 0) ? promiseTimeout(timeout, fetch(url, options)) : fetch(url, options);

            // execute the request
            return request.then(function (res) {

                // if response status is within 200-299 range inclusive res.ok will be true
                if (res.ok) {

                    var contentType = res.headers.get('Content-Type') || '';

                    // let's only store in cache if the content-type is JSON or something non-binary
                    if (contentType.match(/application\/json/i) || contentType.match(/text\//i)) {
                        // There is a .json() instead of .text() but we're going to store it as a string anyway.
                        // If we don't clone the response, it will be consumed by the time it's returned.
                        // This way we're being un-intrusive.
                        res.clone().text().then(function (content) {

                            // store the content in cache as a JSON object
                            storage.setItem(cacheKey, {
                                contentType: contentType,   // the response content type
                                content: content,           // the body of the response as a string
                                storedAt: Date.now()        // store the date-time in milliseconds that the item was cached
                            });
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
                    return Promise.resolve(new Response(cachedResponse.content, { headers: { 'Content-Type': cachedResponse.contentType } }));
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
