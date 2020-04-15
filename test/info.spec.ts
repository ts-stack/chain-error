import * as assert from 'assert';

import { ChainError } from '../src/chain-error';

describe('Tests the way informational properties are inherited with nested errors:', () => {
  let err1: Error;
  let err2: Error;
  let err3: Error;
  it('base case using "options" to specify cause', () => {
    err1 = new Error('bad');
    err2 = new ChainError('worse', { cause: err1 });
    expect(err2.message).toEqual('worse: bad');
    assert.deepStrictEqual(ChainError.getInfo(err2), {});
  });

  it('simple info usage', () => {
    err1 = new ChainError('bad', {
      name: 'MyError',
      info: {
        errno: 'EDEADLK',
        anobject: { hello: 'world' },
      },
    });
    expect(err1.name).toEqual('MyError');
    assert.deepStrictEqual(ChainError.getInfo(err1), {
      errno: 'EDEADLK',
      anobject: { hello: 'world' },
    });
  });

  it('simple property propagation using old syntax', () => {
    err2 = new ChainError('worse', err1);
    expect(err2.message).toEqual('worse: bad');
    assert.deepStrictEqual(ChainError.getInfo(err2), {
      errno: 'EDEADLK',
      anobject: { hello: 'world' },
    });
  });

  it('one property override', () => {
    err2 = new ChainError('worse', {
      cause: err1,
      info: {
        anobject: { hello: 'moon' },
      },
    });
    expect(err2.message).toEqual('worse: bad');
    assert.deepStrictEqual(ChainError.getInfo(err2), {
      errno: 'EDEADLK',
      anobject: { hello: 'moon' },
    });
  });

  it('add a third-level to the chain', () => {
    err3 = new ChainError('what next', {
      cause: err2,
      name: 'BigError',
      info: {
        remote_ip: '127.0.0.1',
      },
    });
    expect(err3.name).toEqual('BigError');
    expect(ChainError.getInfo(err3).remote_ip).toEqual('127.0.0.1');
    expect(err3.message).toEqual('what next: worse: bad');
    expect(ChainError.getInfo(err3).errno).toEqual('EDEADLK');
    assert.deepStrictEqual(ChainError.getInfo(err3).anobject, { hello: 'moon' });
  });
});
