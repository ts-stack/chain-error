export interface ObjectAny {
  [key: string]: any;
}

export interface ChainErrorOptions<T extends ObjectAny = ObjectAny> {
  /**
   * Describes what kind of error this is. This is intended for programmatic use
   * to distinguish between different kinds of errors. Note that in modern versions of Node.js,
   * this name is ignored in the `stack` property value, but callers can still use the `name`
   * property to get at it.
   */
  name?: string;
  /**
   * Indicates that the new error was caused by `cause`. See `getCause()` below.
   * If unspecified, the cause will be `null`.
   */
  cause?: Error;
  /**
   * If specified, then the stack trace for this error ends at function `constructorOpt`.
   * Functions called by `constructorOpt` will not show up in the stack.
   * This is useful when this class is subclassed.
   */
  constructorOpt?: (...args: any[]) => any;
  /**
   * Specifies arbitrary informational properties that
   * are available through the `ChainError.getInfo(err)` static class method.
   * See that method for details.
   */
  info?: T;
}
