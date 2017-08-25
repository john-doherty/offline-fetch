# offline-fetch

[![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/CambridgeMVP.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/CambridgeMVP)

Adds offline support to window.fetch:

```js
var options = {
        offline: {
            storage: 'localStorage',
            timeout: 30 * 1000,
            expires: 300 * 1000,
            logging: true,
            cacheKeyGenerator: function(url, opts, hash) {
                return 'myapp:' + url;
            }
        },
        method: 'GET'
    };

offlineFetch('http://date.jsontest.com/', options).then(function(data){
    // data contains response...
});
```

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)