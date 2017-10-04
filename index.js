const mirrarray = require('mirrarray');

const constants = mirrarray(['PENDING', 'RESOLVED', 'REJECTED']);

class FancyPromise {
  constructor(exec) {
    this._fulfill = null;
    this._reject = null;
    this._then = null;
    this._catch = null;
    this._state = constants.PENDING;
    setTimeout(() => {
      exec(this._then, this._onError.bind(this));
    }, 0);
  }
  _onError(...args) {
    this._state = constants.REJECTED;
    // If this promise has a handler attached to itself via .catch:
    if (this._catch) {
      this._catch(...args);
    // Or, if it can reject to the .catch handler of the promise it already returned (implying that that promise *has* one),  
    } else if (this._reject) {
      this._reject(...args);
    /**
     * If neither of these options is available, we'll resolve the next promise if present (calling its callback)
     * with *this* promise, a rejected promise, and let its callback take care of passing it along to the hypothetical eventual .catch.
     */
    // TODO: Complain when there are uncaught errors here.
    } else if (this._fulfill) {
      this._fulfill(this);
    }
  }
  // 'resolver' means a function that will either fulfill or reject.
  _resolve(resolver, ...args) {
    const resolution = resolver(...args);
    if (resolution instanceof FancyPromise) {
      /**
       * "Connect" the callback/error handler from the promise we initially returned to set up the chain,
       * to this, the promise that is being returned by eventual asynchronous execution of this callback.
       * It'll handle the rest when it resolves or rejects.
       */
      resolution._then = this._fulfill;
      resolution._catch = this._reject;
    } else {
      // resolve synchronously since the callback didn't evaluate to a (fancy) promise.
      // Need to make sure we wait until .thens & .catch has been attached, though.
      setTimeout(() => this._fulfill && this._fulfill(resolution), 0);
    }
  }
  then(callback) {
    this._then = (...args) => {
      // If we resolved with a rejected promise, the show's over-- reject everything and get us to the .catch.
      if (args[0] instanceof FancyPromise && args[0]._state === constants.REJECTED) {
        return this._onError(...args);
      }
      this._resolve(callback, ...args);
    };
    /**
     * Need to immediately return this to set up the chain.
     * By the time the exec function provided actually executes, it'll have resolve & reject
     * arguments, and we'll attach them to *this* promise so that we can resolve/reject
     * the "child" promise when the time comes.
     * Put another way: due to asynchronous execution of 'exec' function via setTimeout 0,
     * this._fulfill will be the next .then's callback by the time it is actually called
     * by this promise.
     * This is how promises ultimately wind up being, under the surface, nested callbacks.
     */
    return new FancyPromise((fulfill, reject) => {
      this._fulfill = fulfill;
      this._reject = reject;
    });
  }
  catch(handler) {
    this._catch = (...args) => {
      this._resolve(handler, ...args);
    }
  }
}

module.exports = FancyPromise;