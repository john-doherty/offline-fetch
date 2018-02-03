# offline-fetch

[![Shippable branch](https://img.shields.io/shippable/59a3e41510cb4d07000a10cd/master.svg)](https://app.shippable.com/projects/59a3e41510cb4d07000a10cd) [![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/MrJohnDoherty.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/MrJohnDoherty)

[twitter-image]:https://img.shields.io/twitter/follow/CambridgeMVP.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/CambridgeMVP

`offlineFetch` is a wrapper around the standard [window.fetch](https://davidwalsh.name/fetch) that adds offline support by caching requests in `sessionStorage`, `localStorage` or IndexedDB, WebSQL when used with [localForage](https://github.com/localForage/localForage).

Offline mode is detected when `navigator.onLine === true` or a request times out.

## Usage

Copy [offline-fetch.min.js](dist/offline-fetch.min.js) into your application:

```html
<script src="js/offline-fetch.min.js"></script>
```

Replace `fetch` calls with `offlineFetch` and pass in additional parameter:

```js
var options = {

    // typical fetch property
    method: 'GET',

    // new offline property with optional config
    offline: {
        storage: 'localStorage',    // use localStorage (defaults to sessionStorage)
        timeout: 750,               // request timeout in milliseconds, defaults 730ms
        expires: 1000,              // expires in milliseconds, defaults 1000ms (set to -1 to check for updates with every request)
        debug: true,                // console log request info to help with debugging
        renew: false,               // if true, request is fetched regardless of expire state. Response is and added to cache

        // timeouts are not retried as they risk cause the browser to hang
        retries: 3,                 // number of times to retry the request before considering it failed, default 3 (timeouts are not retried)
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
5. Submit a pull request

## History

For change-log, check [releases](https://github.com/john-doherty/offline-fetch/releases).

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)