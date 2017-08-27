# offline-fetch

[![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/CambridgeMVP.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/CambridgeMVP)

A simple wrapper around window.fetch that adds offline support via a simple `offline` property.

Cached responses are returned from `sessionStorage`, `localStorage` or _(my favourite)_ [localForage](https://github.com/localForage/localForage) when offline mode is detected.

Offline mode is detected when `navigator.onLine === true` _(if supported)_ or a request is times out.

```js
var options = {

        // typical fetch property
        method: 'GET',

        // add offline property with optional config
        offline: {
            storage: 'localStorage',    // use localStorage (defaults to sessionStorage)
            timeout: 30 * 1000,         // request timeout in milliseconds, defaults to 30 seconds
            expires: 300 * 1000,        // expires in milliseconds, defaults to -1 (pulls live and re-caches are this)
            debug: true,                // console logs response source to help with debugging

            // if provided uses cacheKeyGenerator to generate per request cache key (defaults to URL + METHOD hash)
            cacheKeyGenerator: function(url, opts, hash) {
                return 'myapp:' + url;
            }
        }
    };

offlineFetch('http://www.orcascan.com/', options).then(function(data){
    // data contains response...
});
```

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)