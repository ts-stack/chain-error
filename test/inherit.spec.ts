import { ChainError } from '../src/chain-error';
import * as testcommon from './common';
import { ChainErrorOptions } from '../src';

// tslint:disable:max-classes-per-file
describe('Test that inheriting from ChainError work as expected:', () => {
  let err: Error;
  let suberr: Error;
  let stack: string;
  let nodestack: string;

  class ChainErrorChild extends ChainError {
    name = 'ChainErrorChild';
    constructor(message?: string, optsOrError?: ChainErrorOptions | Error, skipCauseMessage?: boolean) {
      super(message, optsOrError, skipCauseMessage);
    }
  }

  class WErrorChild extends ChainError {
    name = 'WErrorChild';
    constructor(message?: string, optsOrError?: ChainErrorOptions | Error, skipCauseMessage?: boolean) {
      super(message, optsOrError, skipCauseMessage);
    }
  }

  beforeEach(() => {
    /**
     * Save the generic parts of all stack traces so we can avoid hardcoding
     * Node-specific implementation details in our testing of stack traces.
     * The stack trace limit has to be large enough to capture all of Node's frames,
     * which are more than the default (10 frames) in Node v6.x.
     */
    Error.stackTraceLimit = 20;
    nodestack = new Error().stack.split('\n').slice(2).join('\n');
  });

  it('Root cause', () => {
    suberr = new Error('root cause');
    err = new ChainErrorChild('top', suberr);
    expect(err instanceof Error).toBeTruthy();
    expect(err instanceof ChainError).toBeTruthy();
    expect(err instanceof ChainErrorChild).toBeTruthy();
    expect(err.message).toEqual('top: root cause');
    expect(err.toString()).toEqual('ChainErrorChild: top: root cause');
    stack = testcommon.cleanStack(err.stack);
    expect(stack).toEqual(
      ['ChainErrorChild: top: root cause', '    at UserContext.it (dummy filename)', nodestack].join('\n')
    );

    suberr = new Error('root cause');
    err = new WErrorChild('top', suberr, true);
    expect(err instanceof Error).toBeTruthy();
    expect(err instanceof ChainError).toBeTruthy();
    expect(err instanceof WErrorChild).toBeTruthy();
    expect(err.message).toEqual('top');
    expect(err.toString()).toEqual('WErrorChild: top; caused by Error: root cause');
    stack = testcommon.cleanStack(err.stack);

    expect(stack).toEqual(['WErrorChild: top', '    at UserContext.it (dummy filename)', nodestack].join('\n'));
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
      name = 'ChainErrorChildAnon';
      constructor(arg1) {
        super(arg1);
      }
    }

    err = new ChainErrorChildAnon('top');
    expect(err.toString()).toEqual('ChainErrorChildAnon: top');

    class WErrorChildAnon extends ChainError {
      name = 'WErrorChildAnon';
      constructor(message?: string, optsOrError?: ChainErrorOptions | Error, skipCauseMessage?: boolean) {
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
