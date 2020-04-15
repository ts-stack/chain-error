import { ChainError } from '../src/chain-error';
import { cleanStack } from './common';
import { ChainErrorOptions } from '../src';

runTests(ChainError, 'ChainError');

/**
 * Runs all tests using the class "cons". We'll apply this to each of the main
 * classes.
 */
function runTests(cons: typeof ChainError, className: string) {
  describe(`Common functionality for ${cons.name}:`, () => {
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
      nodestack = new Error().stack.split('\n').slice(2).join('\n');
    });

    it('No arguments', () => {
      err = new cons();
      expect(err.name).toBe(className);
      expect(err instanceof Error).toBe(true);
      expect(err.message).toBe('');
      actualStack = cleanStack(err.stack);

      const expectedStack = `${className}\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);
    });

    it('Options-argument form', () => {
      err = new cons(null, {});
      expect(err.name).toBe(className);
      expect(err.message).toBe('');
    });

    it('Simple message', () => {
      const message = 'my error';
      err = new cons(message);
      expect(err.name).toBe(className);
      expect(err.message).toBe(message);
      actualStack = cleanStack(err.stack);
      const expectedStack = `${className}: ${message}\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);

      err = new cons(message, {});
      expect(err.name).toBe(className);
      expect(err.message).toBe(message);
      actualStack = cleanStack(err.stack);
      expect(actualStack).toBe(expectedStack);
    });

    it('FullStack', () => {
      const message = 'Some error';
      err = new cons(message);
      actualStack = cleanStack(ChainError.getFullStack(err));
      let expectedStack = `${className}: ${message}\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);

      err = new Error(message);
      actualStack = cleanStack(ChainError.getFullStack(err));
      expectedStack = `Error: ${message}\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);
    });

    it('ConstructorOpt', () => {
      const message = 'test error';
      function makeErr(options: ChainErrorOptions) {
        return new cons(message, options);
      }
      err = makeErr({});
      actualStack = cleanStack(err.stack);
      let expectedStack = `${className}: ${message}\n    at makeErr (dummy filename)\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);

      err = makeErr({ constructorOpt: makeErr });
      actualStack = cleanStack(err.stack);
      expectedStack = `${className}: ${message}\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);
    });

    it('Custom error name', () => {
      const message = 'another kind of error';
      const otherClassName = 'SomeOtherError';
      err = new cons(message, { name: otherClassName });
      expect(err.name).toBe(otherClassName);
      expect(err instanceof Error).toBe(true);
      expect(err.message).toBe(message);
      actualStack = cleanStack(err.stack);
      const expectedStack = `${otherClassName}: ${message}\n    at UserContext.it (dummy filename)\n${nodestack}`;
      expect(actualStack).toBe(expectedStack);
    });
  });
}
