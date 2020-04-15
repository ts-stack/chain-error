import { types } from 'util';
import * as vm from 'vm';

describe('Cause works with errors:', () => {
  let err: Error;

  beforeAll(() => {
    err = new Error();
  });

  it('from different contexts', (done) => {
    const context = vm.createContext({
      callback: function callback(err2: Error) {
        expect(types.isNativeError(err2)).toBeTruthy();
        done();
      },
    });

    vm.runInContext('callback(new Error())', context);
  });
});
