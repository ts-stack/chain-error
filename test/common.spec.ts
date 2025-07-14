import { ChainError } from '#lib/chain-error.js';
import { ChainErrorOptions } from '#lib/types.js';

describe('Common functionality for ChainError:', () => {
  it('No arguments', () => {
    const err = new ChainError();
    expect(err.name).toBe('ChainError');
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe('');
    expect(err.stack).toContain('ChainError');
  });

  it('Options-argument form', () => {
    const err = new ChainError(null, {});
    expect(err.name).toBe('ChainError');
    expect(err.message).toBe('');
  });

  it('Simple message', () => {
    const message = 'my error';
    const err1 = new ChainError(message);
    expect(err1.name).toBe('ChainError');
    expect(err1.message).toBe(message);
    expect(err1.stack).toContain('ChainError: ');

    const err2 = new ChainError(message, {});
    expect(err2.name).toBe('ChainError');
    expect(err2.message).toBe(message);
    expect(err2.stack).toContain('ChainError: ');
  });

  it('FullStack', () => {
    const message = 'Some error';
    const err1 = new ChainError(message);
    const actualStack1 = ChainError.getFullStack(err1);
    expect(actualStack1).toContain('ChainError: ');

    const err = new Error(message);
    const actualStack2 = ChainError.getFullStack(err);
    expect(actualStack2).toContain('Error: ');
  });

  it('ConstructorOpt', () => {
    const message = 'test error';
    function makeErr(options: ChainErrorOptions) {
      return new ChainError(message, options);
    }
    const err1 = makeErr({});
    expect(err1.stack).toContain('ChainError: ');
    expect(err1.stack).toContain('at makeErr ');

    const err2 = makeErr({ constructorOpt: makeErr });
    expect(err2.stack).toContain('ChainError: ');
  });

  it('Custom error name', () => {
    const message = 'another kind of error';
    const otherClassName = 'SomeOtherError';
    const err = new ChainError(message, { name: otherClassName });
    expect(err.name).toBe(otherClassName);
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe(message);
    expect(err.stack).toContain(`${otherClassName}: ${message}`);
  });
});
