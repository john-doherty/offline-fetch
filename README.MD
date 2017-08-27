# offline-fetch

[![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/CambridgeMVP.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/CambridgeMVP)

A simple wrapper around [window.fetch](https://davidwalsh.name/fetch) that adds offline support by caching requests in `sessionStorage`, `localStorage` or _(my favourite)_ [localForage](https://github.com/localForage/localForage).

Offline mode is detected when `navigator.onLine === true` _(if supported)_ or a request is times out.

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

Supports any global `localStorage`-like API including promise based [localForage](https://github.com/localForage/localForage).

## Credit where credit is due

This script was heavily influenced by the following posts _(thank you)_:
 * [Cache Fetched AJAX Requests Locally: Wrapping the Fetch API](https://www.sitepoint.com/cache-fetched-ajax-requests/)
 * [Working Off the Grid with HTML5 Offline](https://www.html5rocks.com/en/mobile/workingoffthegrid/)

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)