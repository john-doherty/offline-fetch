/**
 * Returns a random number between two numbers
 * @param {integer} min - minimum number
 * @param {integer} max - maximum number
 * @returns {integer} number between min and max
 */
function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Creates a simple storage object mimicking the localStorage API
 * @returns {object} localStorage mock object
 */
function storageMock() {

    var storage = {};

    return {
        setItem: function(key, value) {
            storage[key] = value || '';
        },
        getItem: function(key) {
            return key in storage ? storage[key] : null;
        },
        removeItem: function(key) {
            delete storage[key];
        },
        key: function(i) {
            var keys = Object.keys(storage);
            return keys[i] || null;
        },
        keys: function() {
            return Object.keys(storage);
        }
    };
}

module.exports = {
    randomIntBetween: randomIntBetween,
    storageMock: storageMock
};
