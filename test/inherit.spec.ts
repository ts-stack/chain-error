import { ChainError } from '#lib/chain-error.js';
import { ChainErrorOptions } from '#lib/types.js';

describe('Test that inheriting from ChainError work as expected:', () => {
  let err: Error;
  let suberr: Error;
  let stack: string;
  let nodestack: string;

  class ChainErrorChild extends ChainError {
    override name = 'ChainErrorChild';
    constructor(message?: string, optsOrError?: ChainErrorOptions | Error, skipCauseMessage?: boolean) {
      super(message, optsOrError, skipCauseMessage);
    }
  }

  class WErrorChild extends ChainError {
    override name = 'WErrorChild';
    constructor(message?: string, optsOrError?: ChainErrorOptions | Error, skipCauseMessage?: boolean) {
      super(message, optsOrError, skipCauseMessage);
    }
  }

  it('Root cause', () => {
    suberr = new Error('root cause');
    err = new ChainErrorChild('top', suberr);
    expect(err instanceof Error).toBeTruthy();
    expect(err instanceof ChainError).toBeTruthy();
    expect(err instanceof ChainErrorChild).toBeTruthy();
    expect(err.message).toEqual('top: root cause');
    expect(err.toString()).toEqual('ChainErrorChild: top: root cause');
    expect(err.stack).toContain('ChainErrorChild: top: root cause');

    suberr = new Error('root cause');
    err = new WErrorChild('top', suberr, true);
    expect(err instanceof Error).toBeTruthy();
    expect(err instanceof ChainError).toBeTruthy();
    expect(err instanceof WErrorChild).toBeTruthy();
    expect(err.message).toEqual('top');
    expect(err.toString()).toEqual('WErrorChild: top; caused by Error: root cause');

    expect(err.stack).toContain('WErrorChild: top');
  });

  it('"<Ctor>.toString()" uses the constructor name', () => {
    /**
     * Test that "<Ctor>.toString()" uses the constructor name, so that setting
     * "<Ctor>.prototype.name" isn't necessary.
     */
    class ChainErrorChildNoName extends ChainError {}

    err = new ChainErrorChildNoName('top');
    expect(err.toString()).toEqual('ChainErrorChildNoName: top');

    class WErrorChildNoName extends ChainError {}

    err = new WErrorChildNoName('top', null, true);
    expect(err.toString()).toEqual('WErrorChildNoName: top');
  });

  it('"<Ctor>.prototype.name" can be used for the ".toString()"', () => {
    /**
     * Test that `<Ctor>.prototype.name` can be used for the `.toString()`
     * when the ctor is anonymous.
     */
    class ChainErrorChildAnon extends ChainError {
      override name = 'ChainErrorChildAnon';
      constructor(arg1: any) {
        super(arg1);
      }
    }

    err = new ChainErrorChildAnon('top');
    expect(err.toString()).toEqual('ChainErrorChildAnon: top');

    class WErrorChildAnon extends ChainError {
      override name = 'WErrorChildAnon';
      constructor(message?: string, optsOrError?: ChainErrorOptions | Error | null, skipCauseMessage?: boolean) {
        super(message, optsOrError, skipCauseMessage);
      }
    }

    err = new WErrorChildAnon('top', null, true);
    expect(err.toString()).toEqual('WErrorChildAnon: top');
  });

  it('We get an appropriate exception name in toString() output', () => {
    err = new ChainError('top');
    err.name = 'CustomNameError';
    expect(err.toString()).toEqual('CustomNameError: top');

    err = new ChainError('top', null, true);
    err.name = 'CustomNameError';
    expect(err.toString()).toEqual('CustomNameError: top');
  });
});
