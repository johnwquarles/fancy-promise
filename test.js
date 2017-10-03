const FancyPromise = require('./index');

const eventualResult = 'theResultIsEqualToThis';
const rejectedResult = 'thisWasRejected';

test('It works for a bunch of synchronous .thens', async () => {
  const result = await new Promise(done => {
    new FancyPromise(resolve => resolve('theResult'))
      .then(result => `${result}IsEqual`)
      .then(result => `${result}ToThis`)
      .then(result => done(result));
  });
  expect(result).toEqual(eventualResult);
});
test('It works when starting with an asynchronous fancyPromise', async () => {
  const result = await new Promise(done => {
    new FancyPromise(resolve => {
      setTimeout(() => resolve('theResult'), 200);
    })
    .then(result => `${result}IsEqual`)
    .then(result => `${result}ToThis`)
    .then(result => done(result));
  });
  expect(result).toEqual(eventualResult);
});
test('It works when using all asynchronous fancyPromises', async () => {
  const result = await new Promise(done => {
    new FancyPromise(resolve => {
      setTimeout(() => resolve('theResult'), 200);
    })
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}IsEqual`), 200);
    }))
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}ToThis`), 200);
    }))
    .then(result => done(result));
  });
  expect(result).toEqual(eventualResult);
});
test('It propagates an error to the .catch handler', async () => {
  const result = await new Promise(done => {
    new FancyPromise((resolve, reject) => {
      setTimeout(() => reject('rejected'), 200);
    })
    .then(result => `${result}isEqual`)
    .then(result => `${result}toThis`)
    .catch(result => done(result));
  });
  expect(result).toEqual('rejected');
});
test('It propagates an error to the .catch handler even with asynchronous fancypromises in between', async () => {
  const result = await new Promise(done => {
    new FancyPromise((resolve, reject) => {
      setTimeout(() => reject(rejectedResult), 200);
    })
    .then(result => `${result}isEqual`)
    .then(result => `${result}toThis`)
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}toThis`), 200);
    }))
    .then(result => `${result}isEqual`)
    .then(result => `${result}isEqual`)
    .then(result => new FancyPromise(resolve => {
      setTimeout(() => resolve(`${result}toThis`), 200);
    }))
    .catch(result => done(result));
  });
  expect(result).toEqual(rejectedResult);
});
