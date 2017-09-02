# offline-fetch

[![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/CambridgeMVP.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/CambridgeMVP)

A simple wrapper around [window.fetch](https://davidwalsh.name/fetch) that adds offline support by caching requests in `sessionStorage`, `localStorage` or IndexedDB, WebSQL when used with [localForage](https://github.com/localForage/localForage).

Offline mode is detected when a request times out, or `navigator.onLine === true`.

```js
var options = {

    // typical fetch property
    method: 'GET',

    // new offline property with optional config
    offline: {
        storage: 'localStorage',    // use localStorage (defaults to sessionStorage)
        timeout: 30 * 1000,         // request timeout in milliseconds, defaults to 30 seconds
        expires: 300 * 1000,        // expires in milliseconds, defaults to -1 (pulls live and re-caches are this)
        debug: true,                // console logs response source to help with debugging

        // timeouts are not retried as they risk cause the browser to hang
        retries: 3,                 // number of times to retry the request before considering it failed
        retryDelay: 1000,           // number of milliseconds to wait between each retry

        // used to generate per request cache keys (defaults to URL + METHOD hash if not provided)
        cacheKeyGenerator: function(url, opts, hash) {
            return 'myapp:' + url;
        }
    }
};

offlineFetch('http://www.orcascan.com/', options).then(function(data){
    // data contains response...
});
```

_Supports any global `localStorage`-like API, including promised based `getItem`, `setItem`._

## Credit where it's due

This script was heavily influenced by these two great posts:
 * [Cache Fetched AJAX Requests Locally: Wrapping the Fetch API](https://www.sitepoint.com/cache-fetched-ajax-requests/)
 * [Working Off the Grid with HTML5 Offline](https://www.html5rocks.com/en/mobile/workingoffthegrid/)

## Unit Tests

1. Checkout using `git clone https://github.com/john-doherty/offline-fetch`
2. Navigate into project folder `cd fetch-reply-with`
3. Install dependencies `npm install`
4. Run the tests `npm test`

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :)

## History

For detailed changelog, check [Releases](https://github.com/john-doherty/offline-fetch/releases).

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)