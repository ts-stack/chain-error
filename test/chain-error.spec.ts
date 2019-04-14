import * as assert from 'assert';

import { ChainError } from '../src/chain-error';
import { cleanStack } from './common';

// tslint:disable: no-unused-expression

describe('ChainError:', () => {
  let nodestack: string;

  beforeEach(() => {
    /**
     * Save the generic parts of all stack traces so we can avoid hardcoding
     * Node-specific implementation details in our testing of stack traces.
     * The stack trace limit has to be large enough to capture all of Node's frames,
     * which are more than the default (10 frames) in Node v6.x.
     */
    Error.stackTraceLimit = 20;
    nodestack = new Error().stack
      .split('\n')
      .slice(2)
      .join('\n');
  });

  it('"null" or "undefined" as string', () => {
    let err = new ChainError(`my ${null} string`);
    expect(err.message).toEqual('my null string');
    err = new ChainError(`my ${undefined} string`);
    expect(err.message).toEqual('my undefined string');
  });

  it('caused by another error, with no additional message', () => {
    const suberr = new Error('root cause');
    let err = new ChainError(null, suberr);
    expect(err.message).toEqual(': root cause');

    err = new ChainError(null, { cause: suberr });
    expect(err.message).toEqual(': root cause');
  });

  it('caused by another error, with annotation', () => {
    const num = 3;
    const suberr = new Error('root cause');
    const err = new ChainError(`proximate cause: ${num} issues`, suberr);
    expect(err.message).toEqual('proximate cause: 3 issues: root cause');
    const stack = cleanStack(err.stack);
    assert.strictEqual(
      stack,
      ['ChainError: proximate cause: 3 issues: root cause', '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack
    );
  });

  it('caused by another ChainError, with annotation', () => {
    const num = 3;
    const suberr1 = new Error('root cause');
    const suberr2 = new ChainError(`proximate cause: ${num} issues`, suberr1);
    let err = new ChainError('top', suberr2);
    expect(err.message).toEqual('top: proximate cause: 3 issues: root cause');

    err = new ChainError('top', { cause: suberr2 });
    expect(err.message).toEqual('top: proximate cause: 3 issues: root cause');
  });

  it('caused by a ChainError', () => {
    const suberr = new ChainError('mid', new Error('root cause'), true);
    const err = new ChainError('top', suberr);
    expect(err.message).toEqual('top: mid');
  });

  it('fullStack', () => {
    const suberr = new ChainError('mid', new Error('root cause'));
    const err = new ChainError('top', suberr);
    const stack = cleanStack(ChainError.getFullStack(err));
    assert.strictEqual(
      stack,
      ['ChainError: top: mid: root cause', '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack +
        '\n' +
        ['caused by: ChainError: mid: root cause', '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack +
        '\n' +
        ['caused by: Error: root cause', '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack
    );
  });

  it('no arguments', () => {
    const err = new ChainError(null, null, true);
    expect(err.toString()).toEqual('ChainError');
    const stack = cleanStack(err.stack);
    expect(stack).toEqual(['ChainError', '    at UserContext.it (dummy filename)'].join('\n') + '\n' + nodestack);
  });

  it('options-argument form', () => {
    let err = new ChainError(null, {}, true);
    expect(err.toString()).toEqual('ChainError');

    /* simple message */
    err = new ChainError('my error', null, true);
    expect(err.message).toEqual('my error');
    expect(err.toString()).toEqual('ChainError: my error');
    const stack = cleanStack(err.stack);
    expect(stack).toEqual(
      ['ChainError: my error', '    at UserContext.it (dummy filename)'].join('\n') + '\n' + nodestack
    );

    err = new ChainError('my error', {}, true);
    expect(err.toString()).toEqual('ChainError: my error');
  });

  it('caused by another error, with no additional message', () => {
    const suberr = new Error('root cause');
    let err = new ChainError(null, suberr, true);
    expect(err.message).toEqual('');
    expect(err.toString()).toEqual('ChainError; caused by Error: root cause');

    err = new ChainError(null, { cause: suberr }, true);
    expect(err.message).toEqual('');
    expect(err.toString()).toEqual('ChainError; caused by Error: root cause');
  });

  it('caused by another error, with annotation', () => {
    const suberr = new Error('root cause');
    let err = new ChainError(`proximate cause: ${3} issues`, suberr, true);
    expect(err.message).toEqual('proximate cause: 3 issues');
    expect(err.toString()).toEqual('ChainError: proximate cause: 3 issues; ' + 'caused by Error: root cause');
    let stack = cleanStack(err.stack);
    /* See the comment in tst.inherit.js. */
    const stackmessageTop = 'ChainError: proximate cause: 3 issues';
    expect(stack).toEqual([stackmessageTop, '    at UserContext.it (dummy filename)'].join('\n') + '\n' + nodestack);

    err = new ChainError(`proximate cause: ${3} issues`, { cause: suberr }, true);
    expect(err.message).toEqual('proximate cause: 3 issues');
    expect(err.toString()).toEqual('ChainError: proximate cause: 3 issues; ' + 'caused by Error: root cause');
    stack = cleanStack(err.stack);
    expect(stack).toEqual([stackmessageTop, '    at UserContext.it (dummy filename)'].join('\n') + '\n' + nodestack);
  });

  it('caused by another ChainError, with annotation', () => {
    const suberr1 = new Error('root cause');
    const suberr = new ChainError(`proximate cause: ${3} issues`, { cause: suberr1 }, true);
    let err = new ChainError('top', suberr, true);
    expect(err.message).toEqual('top');
    assert.strictEqual(
      err.toString(),
      'ChainError: top; caused by ChainError: ' + 'proximate cause: 3 issues; caused by Error: root cause'
    );

    err = new ChainError('top', { cause: suberr }, true);
    expect(err.message).toEqual('top');
    assert.strictEqual(
      err.toString(),
      'ChainError: top; caused by ChainError: ' + 'proximate cause: 3 issues; caused by Error: root cause'
    );
  });

  it('caused by a ChainError', () => {
    const suberr = new ChainError('mid', new Error('root cause'));
    const err = new ChainError('top', suberr, true);
    expect(err.message).toEqual('top');
    expect(err.toString()).toEqual('ChainError: top; caused by ChainError: mid: root cause');
  });

  it('fullStack', () => {
    const suberr = new ChainError('mid', new Error('root cause'), true);
    const err = new ChainError('top', suberr, true);
    const stack = cleanStack(ChainError.getFullStack(err));
    /* See the comment in tst.inherit.js. */
    const stackmessageMid = 'ChainError: mid';
    const stackmessageTop = 'ChainError: top';

    assert.strictEqual(
      stack,
      [stackmessageTop, '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack +
        '\n' +
        ['caused by: ' + stackmessageMid, '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack +
        '\n' +
        ['caused by: Error: root cause', '    at UserContext.it (dummy filename)'].join('\n') +
        '\n' +
        nodestack
    );
  });
});
