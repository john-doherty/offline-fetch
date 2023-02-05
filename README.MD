# offline-fetch

[![Tests](https://github.com/john-doherty/offline-fetch/actions/workflows/ci.yml/badge.svg)](https://github.com/john-doherty/offline-fetch/actions/workflows/ci.yml)

Isomorphic _(browser and node)_ JavaScript library that adds offline support to [fetch](https://davidwalsh.name/fetch) by caching requests in:

* `sessionStorage`
* `localStorage`
* IndexedDB & WebSQL when used with [localForage](https://github.com/localForage/localForage)
* Nose support when using [node-localstorage](https://www.npmjs.com/package/node-localstorage)

Offline is detected when a request times out or `navigator.onLine === false`. `offlineFetch` is a wrapper around `fetch` so it can be used as a drop in replacement. Requests are only cached if an `offline` option is provided.

## Installation

### Client-side

Copy [offline-fetch.min.js](dist/offline-fetch.min.js) into your page and add a script tag:

```html
<script src="path-to/offline-fetch.min.js"></script>
```

### Server-side

Install via npm:

```bash
npm install offline-fetch
```

Require in your module:

```js
// make `fetch` avaliable globally
require('isomorphic-fetch');

var offlineFetch = require('offline-fetch');

// require node replacement for localStorage
var { LocalStorage } = require('node-localstorage');

// add instance to global namespace
global.localStorage = new LocalStorage('./local-storage');
```

## Usage

Replace `fetch` with `offlineFetch` and pass in additional parameter:

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

Licensed under [MIT License](LICENSE) &copy; [John Doherty](https://twitter.com/mrJohnDoherty)