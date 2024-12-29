import { types } from 'util';
import * as vm from 'vm';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Cause works with errors:', () => {
  let err: Error;

  beforeAll(() => {
    err = new Error();
  });

  it('from different contexts', async () => {
    return new Promise<void>((resolve) => {
      const context = vm.createContext({
        callback: function callback(err2: Error) {
          expect(types.isNativeError(err2)).toBeTruthy();
          resolve();
        },
      });
  
      vm.runInContext('callback(new Error())', context);
    });
  });
});
