/*!
 * offline-fetch - v@version@
 * Adds offline support to fetch
 * https://github.com/john-doherty/offline-fetch
 * @author John Doherty <www.johndoherty.info>
 * @license MIT
 */
(function () {

    'use strict';

    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = typeof self === 'object' && self.Object === Object && self;

    root = root || (typeof global === 'object' && global.Object === Object && global);

    /**
     * Adds offline support to fetch - returning previous responses when offline, offline is detected when a request times-out  or navigator.onLine = false
     * @param {string} url - URL to request
     * @param {object} options - fetch options with additional .offline property
     * @example
     *      var options = {
     *          offline: {
     *              storage: 'localStorage',    // where should we cache the offline responses
     *              timeout: 30 * 1000,         // how long should we wait before considering a connection offline?
     *              expires: 300 * 1000,        // how long should we store content without checking for an update?
     *              debug: true,                // console log all requests and their source (cache etc)
     *              renew: false,               // if true, this request is fetched regardless of expire state and added to cache
     *              // timeouts are not retried as they could cause the browser to hang
     *              retries: 3,                 // number of times to retry the request before considering it failed
     *              retryDelay: 1000,           // number of milliseconds to wait between each retry
     *              // what unique key should we use to cache the content
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

        // storage type, default sessionStorage (supports any storage matching localStorage API)
        var storage = root[offlineOptions.storage || 'sessionStorage'];

        // request timeout in milliseconds, defaults to 30 seconds
        var timeout = parseInt(offlineOptions.timeout || '10000', 10);

        // number of retries before giving up
        var retries = parseInt(offlineOptions.retries || '-1', 10);

        // number of milliseconds to wait between each retry
        var retryDelay = parseInt(offlineOptions.retryDelay || '-1', 10);

        // expires in milliseconds, defaults to -1 so checks for new content on each request
        var expires = (typeof offlineOptions.expires === 'number') ? offlineOptions.expires : -1;

        // should this request skip cache?
        var renew = (offlineOptions.renew === true);

        // logs request/cache hits to console if enabled, default false
        var debug = (offlineOptions.debug === true);

        // method, defaults to GET
        var method = options.method || 'GET';

        // detect offline if supported (if true, browser supports the property & client is offline)
        var isOffline = (navigator && navigator.onLine === false);

        // a hash of the method + url, used as default cache key if no generator passed
        var requestHash = 'offline:' + stringToHash(method + '|' + url);

        // if cacheKeyGenerator provided, use that otherwise use the hash generated above
        var cacheKey = (typeof options.offline.cacheKeyGenerator === 'function') ? options.offline.cacheKeyGenerator(url, options, requestHash) : requestHash;

        // remove null items from options (EDGE does not like them)
        Object.keys(options || {}).forEach(function(key) {
            if (options[key] === null) {
                delete options[key];
            }
        });

        // execute cache gets with a promise, just incase we're using a promise storage
        return Promise.resolve(storage.getItem(cacheKey)).then(function (cachedItem) {

            // convert to JSON object if it's not already
            cachedItem = (typeof cachedItem === 'string') ? JSON.parse(cachedItem) : cachedItem;

            // convert cached data into a fetch Response object, allowing consumers to process as normal
            var cachedResponse = null;

            if (cachedItem) {

                cachedResponse = new Response(cachedItem.content, {
                    status: cachedItem.status,
                    statusText: cachedItem.statusText,
                    headers: {
                        'Content-Type': cachedItem.contentType
                    }
                });
            }

            // determine if the cached content has expired
            var cacheExpired = (cachedItem && expires > 0) ? ((Date.now() - cachedItem.storedAt) > expires) : false;

            // if the request is cached and we're offline, return cached content
            if (cachedResponse && isOffline) {
                if (debug) log('offlineFetch[cache] (offline): ' + url);
                return Promise.resolve(cachedResponse);
            }

            // if the request is cached, expires is set but not expired, and this is not a renew request, return cached content
            if (cachedResponse && !cacheExpired && !renew) {
                if (debug) log('offlineFetch[cache]: ' + url);
                return Promise.resolve(cachedResponse);
            }

            // execute the request within a timeout, if it times-out, return cached response
            return promiseTimeout(timeout, fetch(url, options)).then(function (res) {

                // if response status is within 200-299 range inclusive res.ok will be true
                if (res.status >= 200 && res.status <= 299) {

                    var contentType = res.headers.get('Content-Type') || '';

                    // let's only store in cache if the content-type is JSON or something non-binary
                    if (contentType.match(/application\/json/i) || contentType.match(/text\//i)) {
                        // There is a .json() instead of .text() but we're going to store it as a string anyway.
                        // If we don't clone the response, it will be consumed by the time it's returned.
                        // This way we're being un-intrusive.
                        res.clone().text().then(function (content) {

                            var contentToStore = JSON.stringify({
                                status: res.status,         // store the response status
                                statusText: res.statusText, // the response status text
                                contentType: contentType,   // the response content type
                                content: content,           // the body of the response as a string
                                storedAt: Date.now()        // store the date-time in milliseconds that the item was cached
                            });

                            // store the content in cache as a JSON object
                            storage.setItem(cacheKey, contentToStore);
                        });
                    }
                }

                if (debug) log('offlineFetch[live]: ' + url);

                return res;
            })
            .catch(function (error) {

                var errorMessage = error.message || '';
                var timedout = (errorMessage) === 'Promise Timed Out';

                // if its a timeout and we have a cached response, return it
                if (timedout && cachedResponse) {

                    if (debug) log('offlineFetch[cache] (timedout): ' + url);

                    return Promise.resolve(cachedResponse);
                }

                // if it was not a timeout, but we have retries, try them
                if (!timedout && retries) {

                    if (debug) log('offlineFetch[' + errorMessage + '] (retrying): ' + url);

                    // retry fetch
                    return fetchRetry(url, options, retries, retryDelay, debug);
                }

                // it's a genuine request error, reject as normal
                return Promise.reject(error);
            });
        });
    }

    /* --- HELPERS --- */

    /**
     * Retries a fetch if it fails
     * @param {string} url - url to fetch
     * @param {object} options - fetch options
     * @param {integer} retries - number of times to retry the request
     * @param {integer} retryDelay - the number of milliseconds to wait between retries
     * @param {boolean} debug - logs retry count to console if true
     * @returns {Promise} executes .then if successful otherwise .catch
     */
    function fetchRetry(url, options, retries, retryDelay, debug) {

        retries = retries || 3;
        retryDelay = retryDelay || 1000;

        return new Promise(function (resolve, reject) {

            var wrappedFetch = function (n) {

                if (debug) log('offlineFetch[retrying] (' + n + ' of ' + retries + '): ' + url);

                fetch(url, options).then(function (response) {
                    resolve(response);
                })
                .catch(function (error) {

                    if (n > 0) {
                        setTimeout(function () {
                            wrappedFetch(--n);
                        }, retryDelay);
                    }
                    else {
                        reject(error);
                    }
                });
            };

            wrappedFetch(retries);
        });
    }

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
                reject(new Error('Promise Timed Out'));
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
