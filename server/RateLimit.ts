/**
 * Generic rate limiter that can be used on objects, especially websockets.
 * Source: https://github.com/uNetworking/uWebSockets.js/issues/335
 */

class RateLimit {
    /**
     * @param {number} limit Number of requests allowed per interval.
     * @param {number} interval Number of milliseconds in the interval.
     * @returns {function} A function that returns true if the object has exceeded the rate limit.
     */
    constructor(limit, interval) {
        let now = 0;
        const last = Symbol(), count = Symbol();
        setInterval(() => ++now, interval);
        return o => {
            if (o[last] == now) return ++o[count] > limit;
            o[last] = now;
            o[count] = 1;
        };
    }
}

export default RateLimit;
