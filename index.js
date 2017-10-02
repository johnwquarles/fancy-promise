const mirrarray = require('mirrarray');

const constants = mirrarray(['PENDING', 'RESOLVED', 'REJECTED']);

class FancyPromise {
  constructor(exec) {
    this._resolve = null;
    this._callback = null;
    this._errorHandler = null;
    this._state = constants.PENDING;
    setTimeout(() => {
      exec(this._callback, this.errorHandler.bind(this));
    }, 0);
  }
  errorHandler(...args) {
    this._state = constants.REJECTED;
    // If this promise has a handler attached to itself via .catch:
    if (this._errorHandler) {
      this._errorHandler(...args);
    // Or, if it can reject to the .catch handler of the promise it already returned (implying that that promise *has* one),  
    } else if (this._reject) {
      this._reject(...args);
    /**
     * If neither of these options is available, we'll resolve the next promise if present (calling its callback)
     * with *this* promise, a rejected promise, and let its callback take care of passing it along to the hypothetical eventual .catch.
     */
    // TODO: Complain when there are uncaught errors here.
    } else if (this._resolve) {
      this._resolve(this);
    }
  }
  // 'resolution' means a function that will either resolve or reject.
  next(resolution, args) {
    const returnValue = resolution(...args);
    if (returnValue instanceof FancyPromise) {
      /**
       * "Connect" the callback/error handler from the promise we initially returned to set up the chain,
       * to this, the promise that is being returned by eventual asynchronous execution of this callback.
       * It'll handle the rest when it resolves or rejects.
       */
      returnValue._callback = this._resolve;
      returnValue._errorHandler = this._reject;
    } else {
      // resolve synchronously since the callback didn't evaluate to a (fancy) promise.
      this._resolve && this._resolve(returnValue);
    }
  }
  then(callback) {
    this._callback = (...args) => {
      // If we resolved with a rejected promise, the show's over-- reject everything and get us to the .catch.
      if (args[0] instanceof FancyPromise && args[0]._state === constants.REJECTED) {
        return this.errorHandler(...args);
      }
      this.next(callback, args);
    };
    /**
     * Need to immediately return this to set up the chain.
     * By the time the exec function provided actually executes, it'll have resolve & reject
     * arguments, and we'll attach them to *this* promise so that we can resolve/reject
     * the "child" promise when the time comes.
     */
    return new FancyPromise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }
  catch(handler) {
    this._errorHandler = (...args) => {
      this.next(handler, args);
    }
  }
}

export default FancyPromise;