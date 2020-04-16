import * as assert from 'assert-plus';
import { types } from 'util';

import { ChainErrorOptions, ObjectAny } from './types';

export class ChainError<T extends ObjectAny = ObjectAny> extends Error {
  readonly skipCauseMessage: boolean;
  /**
   * Indicates that the new error was caused by `cause`. See `getCause()` below.
   * If unspecified, the cause will be `null`.
   */
  readonly cause: Error;
  /**
   * Specifies arbitrary informational properties that
   * are available through the `ChainError.getInfo(err)` static class method.
   * See that method for details.
   */
  readonly info: T;
  /**
   * For debugging, we keep track of the original message (attached
   * this Error particularly) separately from the concatenated message (which
   * includes the messages of our cause chain).
   */
  readonly currentMessage: string;

  constructor(message?: string, optsOrError?: ChainErrorOptions<T> | Error, skipCauseMessage?: boolean) {
    super();

    this.skipCauseMessage = skipCauseMessage;

    const options = {} as ChainErrorOptions<T>;
    message = message || '';
    assert.string(message, 'message must be a string');

    if (types.isNativeError(optsOrError)) {
      Object.assign(options, { cause: optsOrError });
    } else if (optsOrError !== null && typeof optsOrError == 'object') {
      if (optsOrError.cause) {
        assert.ok(types.isNativeError(optsOrError.cause), 'cause is not an Error');
      }
      Object.assign(options, optsOrError);
    } else if (optsOrError) {
      throw new TypeError('second argument for ChainError constructor must be an object or instance of Error');
    }

    /**
     * If we've been given a name, apply it now.
     */
    if (options.name) {
      this.name = options.name;
    }

    this.message = this.currentMessage = message;

    /**
     * If we've been given a cause, record a reference to it and update our
     * message appropriately.
     */
    this.cause = options.cause;
    if (this.cause && !skipCauseMessage) {
      this.message += ': ' + this.cause.message;
    }

    /**
     * If we've been given an object with properties, shallow-copy that
     * here. We don't want to use a deep copy in case there are non-plain
     * objects here, but we don't want to use the original object in case
     * the caller modifies it later.
     */
    this.info = {} as T;
    if (options.info) {
      Object.assign(this.info, options.info);
    }

    if (Error.captureStackTrace) {
      const ctor = options.constructorOpt || this.constructor;
      Error.captureStackTrace(this, ctor);
    }
  }

  /**
   * Returns the next `Error` in the cause chain for given `err`,
   * or `null` if there is no next `ChainError`. See the `cause`
   * argument to the constructor. Errors can have arbitrarily long cause chains.
   * You can walk the `cause` chain by invoking `ChainError.getCause(err)`
   * on each subsequent return value.
   */
  static getCause(err: Error): Error | null {
    assert.ok(types.isNativeError(err), 'err must be an Error');
    return types.isNativeError((err as ChainError).cause) ? (err as ChainError).cause : null;
  }

  /**
   * Returns an object with all of the extra error information that's been associated
   * with this `Error` and all of its causes. These are the properties passed in using
   * the `info` option to the constructor. Properties not specified in the
   * constructor for this `Error` are implicitly inherited from this error's cause.
   *
   * These properties are intended to provide programmatically-accessible metadata
   * about the error. For an error that indicates a failure to resolve a DNS name,
   * informational properties might include the DNS name to be resolved, or even the
   * list of resolvers used to resolve it. The values of these properties should
   * generally be plain objects (i.e., consisting only of `null`, `undefined`, `numbers`,
   * `booleans`, `strings`, `objects` and arrays containing only other plain objects).
   */
  static getInfo<T extends ObjectAny = ObjectAny>(error: Error): T {
    const err = error as ChainError;
    let info = {} as T;
    let cause: Error;

    cause = this.getCause(err);
    if (cause !== null) {
      info = this.getInfo(cause);
    }

    if (err.info !== null && typeof err.info == 'object') {
      Object.assign(info, err.info);
    }

    return info;
  }

  /**
   * The `findCauseByName()` method traverses the cause chain for given `err`, looking
   * for an error whose `name` property matches the passed in `name` value. If no
   * match is found, `null` is returned.
   *
   * If all you want is to know _whether_ there's a cause (and you don't care what it is),
   * you can use `ChainError.hasCauseWithName(err, name)`.
   *
   * If a vanilla error or a non-ChainError error is passed in, then there is no cause
   * chain to traverse. In this scenario, the method will check the `name`
   * property of only `err`.
   */
  static findCauseByName(err: Error, name: string): Error | null {
    assert.ok(types.isNativeError(err), 'err must be an Error');
    assert.string(name, 'name');
    assert.ok(name.length > 0, 'name cannot be empty');

    for (let cause = err; cause !== null; cause = this.getCause(cause)) {
      if (cause.name == name) {
        return cause;
      }
    }

    return null;
  }

  /**
   * Returns `true` if and only if `ChainError.findCauseByName(err, name)` would return
   * a non-null value. This essentially determines whether `err` has any cause in
   * its cause chain that has name `name`.
   */
  static hasCauseWithName(err: Error, name: string): boolean {
    return this.findCauseByName(err, name) !== null;
  }

  /**
   * Returns a string containing the full stack trace, with all nested errors recursively
   * reported as `'caused by:' + err.stack`.
   */
  static getFullStack(err: Error): string {
    const cause = this.getCause(err);
    if (cause) {
      return err.stack + '\ncaused by: ' + this.getFullStack(cause);
    }

    return err.stack;
  }

  toString() {
    let str = (this.hasOwnProperty('name') && this.name) || this.constructor.name || this.constructor.prototype.name;
    if (this.message) {
      str += ': ' + this.message;
    }

    if (this.skipCauseMessage && this.cause && this.cause.message) {
      str += '; caused by ' + this.cause.toString();
    }

    return str;
  }
}

ChainError.prototype.name = 'ChainError';
