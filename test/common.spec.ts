import { ChainError } from '#lib/chain-error.js';
import { ChainErrorOptions } from '#lib/types.js';
import { cleanStack } from './common.js';

describe('Common functionality for ChainError:', () => {
  let nodestack: string;
  let err: Error;
  let actualStack: string;

  beforeEach(() => {
    /**
     * Save the generic parts of all stack traces so we can avoid hardcoding
     * Node-specific implementation details in our testing of stack traces.
     * The stack trace limit has to be large enough to capture all of Node's frames,
     * which are more than the default (10 frames) in Node v6.x.
     */
    Error.stackTraceLimit = 20;
    nodestack = new Error().stack!.split('\n').slice(4).join('\n');
    nodestack = cleanStack(nodestack);
  });

  it('No arguments', () => {
    err = new ChainError();
    expect(err.name).toBe('ChainError');
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe('');
    actualStack = cleanStack(err.stack);

    const expectedStack = `ChainError: \n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);
  });

  it('Options-argument form', () => {
    err = new ChainError(null, {});
    expect(err.name).toBe('ChainError');
    expect(err.message).toBe('');
  });

  it('Simple message', () => {
    const message = 'my error';
    err = new ChainError(message);
    expect(err.name).toBe('ChainError');
    expect(err.message).toBe(message);
    actualStack = cleanStack(err.stack);
    const expectedStack = `ChainError: ${message}\n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);

    err = new ChainError(message, {});
    expect(err.name).toBe('ChainError');
    expect(err.message).toBe(message);
    actualStack = cleanStack(err.stack);
    expect(actualStack).toBe(expectedStack);
  });

  it('FullStack', () => {
    const message = 'Some error';
    err = new ChainError(message);
    actualStack = cleanStack(ChainError.getFullStack(err));
    let expectedStack = `ChainError: ${message}\n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);

    err = new Error(message);
    actualStack = cleanStack(ChainError.getFullStack(err));
    expectedStack = `Error: ${message}\n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);
  });

  it('ConstructorOpt', () => {
    const message = 'test error';
    function makeErr(options: ChainErrorOptions) {
      return new ChainError(message, options);
    }
    err = makeErr({});
    actualStack = cleanStack(err.stack);
    let expectedStack = `ChainError: ${message}\n    at makeErr (dummy filename)\n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);

    err = makeErr({ constructorOpt: makeErr });
    actualStack = cleanStack(err.stack);
    expectedStack = `ChainError: ${message}\n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);
  });

  it('Custom error name', () => {
    const message = 'another kind of error';
    const otherClassName = 'SomeOtherError';
    err = new ChainError(message, { name: otherClassName });
    expect(err.name).toBe(otherClassName);
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe(message);
    actualStack = cleanStack(err.stack);
    const expectedStack = `${otherClassName}: ${message}\n    (dummy filename)\n${nodestack}`;
    expect(actualStack).toBe(expectedStack);
  });
});
