import { ChainError } from '#lib/chain-error.js';
import { describe, expect, it } from 'vitest';

// tslint:disable: no-unused-expression

describe('ChainError:', () => {
  it('caused by another error, with no additional message', () => {
    const suberr = new Error('root cause');
    let err = new ChainError(null, suberr);
    expect(err.message).toBe(': root cause');

    err = new ChainError(null, { cause: suberr });
    expect(err.message).toBe(': root cause');
  });

  it('caused by another error, with annotation', () => {
    const suberr = new Error('root cause');
    const err = new ChainError('proximate cause: 3 issues', suberr);
    expect(err.message).toBe('proximate cause: 3 issues: root cause');
    expect(err.stack).toContain('ChainError: proximate cause: 3 issues: root cause');
  });

  it('caused by another ChainError, with annotation', () => {
    const suberr1 = new Error('root cause');
    const suberr2 = new ChainError('proximate cause: 3 issues', suberr1);
    let err = new ChainError('top', suberr2);
    expect(err.message).toBe('top: proximate cause: 3 issues: root cause');

    err = new ChainError('top', { cause: suberr2 });
    expect(err.message).toBe('top: proximate cause: 3 issues: root cause');
  });

  it('caused by a ChainError', () => {
    const suberr = new ChainError('mid', new Error('root cause'), true);
    const err = new ChainError('top', suberr);
    expect(err.message).toBe('top: mid');
  });

  it('fullStack', () => {
    const suberr = new ChainError('mid', new Error('root cause'));
    const err = new ChainError('top', suberr);
    const actualStack = ChainError.getFullStack(err);
    expect(actualStack).toContain('ChainError: top: mid: root cause');
    expect(actualStack).toContain('caused by: ChainError: mid: root cause');
    expect(actualStack).toContain('caused by: Error: root cause');
  });

  it('no arguments', () => {
    const err = new ChainError(null, null, true);
    expect(err.toString()).toBe('ChainError');
    const stack = err.stack;
    expect(stack).toContain('ChainError');
  });

  it('options-argument form', () => {
    let err = new ChainError(null, {}, true);
    expect(err.toString()).toBe('ChainError');

    /* simple message */
    err = new ChainError('my error', null, true);
    expect(err.message).toBe('my error');
    expect(err.toString()).toBe('ChainError: my error');
    const stack = err.stack;
    expect(stack).toContain('ChainError: my error');

    err = new ChainError('my error', {}, true);
    expect(err.toString()).toBe('ChainError: my error');
  });

  it('caused by another error, with no additional message', () => {
    const suberr = new Error('root cause');
    let err = new ChainError(null, suberr, true);
    expect(err.message).toBe('');
    expect(err.toString()).toBe('ChainError; caused by Error: root cause');

    err = new ChainError(null, { cause: suberr }, true);
    expect(err.message).toBe('');
    expect(err.toString()).toBe('ChainError; caused by Error: root cause');
  });

  it('caused by another error, with annotation', () => {
    const suberr = new Error('root cause');
    let err = new ChainError('proximate cause: 3 issues', suberr, true);
    expect(err.message).toBe('proximate cause: 3 issues');
    expect(err.toString()).toBe('ChainError: proximate cause: 3 issues; caused by Error: root cause');
    let stack = err.stack;
    expect(stack).toContain('ChainError: proximate cause: 3 issues');

    err = new ChainError('proximate cause: 3 issues', { cause: suberr }, true);
    expect(err.message).toBe('proximate cause: 3 issues');
    expect(err.toString()).toBe('ChainError: proximate cause: 3 issues; caused by Error: root cause');
    stack = err.stack;
    expect(stack).toContain('ChainError: proximate cause: 3 issues');
  });

  it('caused by another ChainError, with annotation', () => {
    const suberr1 = new Error('root cause');
    const suberr = new ChainError('proximate cause: 3 issues', { cause: suberr1 }, true);
    let err = new ChainError('top', suberr, true);
    expect(err.message).toBe('top');
    let actualStack = err.toString();
    let expectedStack = 'ChainError: top; caused by ChainError: proximate cause: 3 issues; caused by Error: root cause';
    expect(actualStack).toBe(expectedStack);

    err = new ChainError('top', { cause: suberr }, true);
    expect(err.message).toBe('top');
    actualStack = err.toString();
    expectedStack =
      'ChainError: top; caused by ChainError: ' + 'proximate cause: 3 issues; caused by Error: root cause';
    expect(actualStack).toBe(expectedStack);
  });

  it('caused by a ChainError', () => {
    const suberr = new ChainError('mid', new Error('root cause'));
    const err = new ChainError('top', suberr, true);
    expect(err.message).toBe('top');
    expect(err.toString()).toBe('ChainError: top; caused by ChainError: mid: root cause');
  });

  it('fullStack', () => {
    const suberr = new ChainError('mid', new Error('root cause'), true);
    const err = new ChainError('top', suberr, true);
    const actualStack = ChainError.getFullStack(err);
    expect(actualStack).toContain('ChainError: top');
    expect(actualStack).toContain('caused by: ChainError: mid');
    expect(actualStack).toContain('caused by: Error: root cause');
  });
});
