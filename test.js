const FancyPromise = require('./index');

const eventualResult = 'theResultIsEqualToThis';
const rejectedResult = 'thisWasRejected';

test('It works for a bunch of synchronous .thens', () => {
  new Promise(done => {
    const result = new FancyPromise(resolve => resolve('theResult'))
    .then(result => `${result}IsEqual`)
    .then(result => `${result}ToThis`)
    .then(() => done());
  }).then(() => expect(result).toEqual(eventualResult));
});
test('It works when starting with an asynchronous fancyPromise', () => {
  new Promise(done => {
    const result = new FancyPromise(resolve => {
      setTimeout(() => resolve('theResult'), 3000);
    })
    .then(result => `${result}isEqual`)
    .then(result => `${result}toThis`)
    .then(() => done());
  }).then(() => expect(result).toEqual(eventualResult));
});
test('It works when using all asynchronous fancyPromises', () => {
  new Promise(done => {
    const result = new FancyPromise(resolve => {
      setTimeout(() => resolve('theResult'), 3000);
    })
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}isEqual`), 3000);
    }))
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}toThis`), 3000);
    }))
    .then(() => done());
  }).then(() => expect(result).toEqual(eventualResult));
});
test('It propagates an error to the .catch handler', () => {
  new Promise(done => {
    const result = new FancyPromise(resolve => {
      setTimeout(() => reject('rejected'), 3000);
    })
    .then(result => `${result}isEqual`)
    .then(result => `${result}toThis`)
    .catch(result => result)
    .then(() => done());
  }).then(() => expect(result).toEqual('rejected'));
});
test('It propagates an error to the .catch handler even with asynchronous fancypromises in between', () => {
  new Promise(done => {
    const result = new FancyPromise(resolve => {
      setTimeout(() => reject(rejectedResult), 3000);
    })
    .then(result => `${result}isEqual`)
    .then(result => `${result}toThis`)
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}toThis`), 3000);
    }))
    .then(result => `${result}isEqual`)
    .then(result => `${result}isEqual`)
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}toThis`), 3000);
    }))
    .catch(result => result)
    .then(() => done());
  }).then(() => expect(result).toEqual(rejectedResult));
});
