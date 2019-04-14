# chain-error: rich JavaScript errors

This is a fork of [VError](https://github.com/joyent/node-verror). The module provides several classes in support of Joyent's [Best Practices for
Error Handling in Node.js](http://www.joyent.com/developers/node/design/errors).
If you find any of the behavior here confusing or surprising, check out that
document first.

The error classes here support:

* chains of causes
* properties to provide extra information about the error
* creating your own subclasses that support all of these

`ChainError`, for chaining errors while preserving each one's error message.
This is useful in servers and command-line utilities when you want to
propagate an error up a call stack, but allow various levels to add their own
context. See examples below.

But if you need, you can hiding the lower-level messages from the
top-level error. This is useful for API endpoints where you don't want to
expose internal error messages, but you still want to preserve the error chain
for logging and debugging.


# Quick start

First, install the package:

```bash
npm install @restify-ts/chain-error
```

If nothing else, you can use `ChainError` as a drop-in replacement for the built-in
JavaScript Error class:

```ts
import { ChainError } from '@restify-ts/chain-error';

const path = '/etc/passw';
const err = new ChainError(`missing file: "${path}"`);
console.log(err.message);
```

This prints:

```text
missing file: "/etc/passwd"
```

You can also pass a `cause` argument, which is any other Error object:

```ts
import { ChainError } from '@restify-ts/chain-error';
import * as fs from 'fs';

const filename = '/nonexistent';
fs.stat(filename, err1 => {
	const err2 = new ChainError(`stat "${filename}"`, err1);
	console.error(err2.message);
});
```

This prints out:

```text
stat "/nonexistent": ENOENT, stat '/nonexistent'
```

which resembles how Unix programs typically report errors:

```bash
$ sort /nonexistent
sort: open failed: /nonexistent: No such file or directory
```

To match the Unixy feel, when you print out the error, just prepend the
program's name to the ChainError's `message`. Or just call
[node-cmdutil.fail(your_verror)](https://github.com/joyent/node-cmdutil), which
does this for you.

Of course, you can chain these as many times as you want, and it works with any
kind of Error:

```ts
const err1 = new Error('No such file or directory');
const err2 = new ChainError('failed to stat "/junk"', err1);
const err3 = new ChainError('request failed', err2);
console.error(err3.message);
```

This prints:

```text
request failed: failed to stat "/junk": No such file or directory
```

The idea is that each layer in the stack annotates the error with a description
of what it was doing. The end result is a message that explains what happened
at each level.

You can also decorate Error objects with additional information so that callers
can not only handle each kind of error differently, but also construct their own
error messages (e.g., to localize them, format them, group them by type, and so
on). See the example below.


# Deeper dive

The two main goals for `ChainError` are:

* **Make it easy to construct clear, complete error messages intended for
  people.**  Clear error messages greatly improve both user experience and
  debuggability, so we wanted to make it easy to build them.
* **Make it easy to construct objects with programmatically-accessible
  metadata** (which we call _informational properties_). Instead of just saying
  "connection refused while connecting to 192.168.1.2:80", you can add
  properties like `"ip": "192.168.1.2"` and `"tcpPort": 80`. This can be used
  for feeding into monitoring systems, analyzing large numbers of Errors (as
  from a log file), or localizing error messages.

To really make this useful, it also needs to be easy to compose Errors:
higher-level code should be able to augment the Errors reported by lower-level
code to provide a more complete description of what happened. Instead of saying
"connection refused", you can say "operation X failed: connection refused".
That's why `ChainError` supports `causes`.

In order for all this to work, programmers need to know that it's generally safe
to wrap lower-level Errors with higher-level ones. If you have existing code
that handles Errors produced by a library, you should be able to wrap those
Errors with a `ChainError` to add information without breaking the error handling
code. There are two obvious ways that this could break such consumers:

* The error's name might change. People typically use `name` to determine what
  kind of Error they've got. To ensure compatibility, you can create ChainErrors
  with custom names, but this approach isn't great because it prevents you from
  representing complex failures. For this reason, `ChainError` provides
  `findCauseByName`, which essentially asks: does this Error _or any of its
  causes_ have this specific type?  If error handling code uses
  `findCauseByName`, then subsystems can construct very specific causal chains
  for debuggability and still let people handle simple cases easily. There's an
  example below.
* The error's properties might change. People often hang additional properties
  off of Error objects. If we wrap an existing Error in a new Error, those
  properties would be lost unless we copied them. But there are a variety of
  both standard and non-standard Error properties that should _not_ be copied in
  this way: most obviously `name`, `message`, and `stack`, but also `fileName`,
  `lineNumber`, and a few others. Plus, it's useful for some Error subclasses
  to have their own private properties -- and there'd be no way to know whether
  these should be copied. For these reasons, `ChainError` first-classes these
  information properties. You have to provide them in the constructor, you can
  only fetch them with the `getInfo()` function, and `ChainError` takes care of making
  sure properties from causes wind up in the `getInfo()` output.

Let's put this all together with an example from the `node-fast` RPC library.
`node-fast` implements a simple RPC protocol for Node programs. There's a server
and client interface, and clients make RPC requests to servers. Let's say the
server fails with an UnauthorizedError with message "user 'bob' is not
authorized". The client wraps all server errors with a FastServerError. The
client also wraps all request errors with a FastRequestError that includes the
name of the RPC call being made. The result of this failed RPC might look like
this:

```text
name: FastRequestError
message: "request failed: server error: user 'bob' is not authorized"
rpcMsgid: <unique identifier for this request>
rpcMethod: GetObject
cause:
  name: FastServerError
  message: "server error: user 'bob' is not authorized"
  cause:
  name: UnauthorizedError
  message: "user 'bob' is not authorized"
  rpcUser: "bob"
```

When the caller uses `ChainError.getInfo()`, the information properties are collapsed
so that it looks like this:

```text
message: "request failed: server error: user 'bob' is not authorized"
rpcMsgid: <unique identifier for this request>
rpcMethod: GetObject
rpcUser: "bob"
```

Taking this apart:

* The error's message is a complete description of the problem. The caller can
  report this directly to its caller, which can potentially make its way back to
  an end user (if appropriate). It can also be logged.
* The caller can tell that the request failed on the server, rather than as a
  result of a client problem (e.g., failure to serialize the request), a
  transport problem (e.g., failure to connect to the server), or something else
  (e.g., a timeout). They do this using `findCauseByName('FastServerError')`
  rather than checking the `name` field directly.
* If the caller logs this error, the logs can be analyzed to aggregate
  errors by cause, by RPC method name, by user, or whatever. Or the
  error can be correlated with other events for the same rpcMsgid.
* It wasn't very hard for any part of the code to contribute to this Error.
  Each part of the stack has just a few lines to provide exactly what it knows,
  with very little boilerplate.

It's not expected that you'd use these complex forms all the time. Despite
supporting the complex case above, you can still just do:

```ts
new ChainError(`my service isn't working`);
```

for the simple cases.


# API

## Constructors

The `ChainError` constructor has several forms:

```ts
/**
 * This is the most general form. You can specify any supported options
 * (including `cause` and `info`) this way.
 */
constructor(options: ChainErrorOptions, message?: string);
/**
 * This is a useful shorthand when the only option you need is `cause`.
 */
constructor(cause: Error, message?: string);
/**
 * This is a useful shorthand when you don't need any options at all.
 */
constructor(message?: string);
```

All of these forms construct a new `ChainError` that behaves just like the built-in
JavaScript `Error` class, with some additional methods described below.

In the first form, `ChainErrorOptions` is a plain object with any of the following
optional properties:

```ts
interface ChainErrorOptions {
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
  info?: { [key: string]: any };
}
```

The second signature of the constructor is equivalent to using the first signature with the specified `cause` as the error's cause.

The third signature is equivalent to using the first signature with all default option
values. This signature is distinguished from the other signatures because the first
argument is not an object or an instance of some `Error`.


## Public properties

`ChainError` provide the public properties as JavaScript's built-in Error objects.

Property name | Type   | Meaning
------------- | ------ | -------
`name`  | string | Programmatically-usable name of the error.
`message`   | string | Human-readable summary of the failure. Programmatically-accessible details are provided through `ChainError.getInfo(err)` class method.
`stack`   | string | Human-readable stack trace where the Error was constructed.

The `stack` property is managed entirely by the underlying JavaScript
implementation. It's generally implemented using a getter function because
constructing the human-readable stack trace is somewhat expensive.

## Class methods

The following methods are defined on the `ChainError` class. They're defined this way rather than using methods on `ChainError` instances so that they can be used on Errors not created with
`ChainError`.

```ts
class ChainError extends Error {
  /**
   * Returns the next `Error` in the cause chain for given `err`,
   * or `null` if there is no next `ChainError`. See the `cause`
   * argument to the constructor. Errors can have arbitrarily long cause chains.
   * You can walk the `cause` chain by invoking `ChainError.getCause(err)`
   * on each subsequent return value.
   */
  static getCause(err: Error): Error | null;

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
  static getInfo(err: Error): ObjectAny;

  /**
   * Returns a string containing the full stack trace, with all nested errors recursively
   * reported as `'caused by:' + err.stack`.
   */
  static getFullStack(err: Error): string;

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
  static findCauseByName(err: Error, name: string): Error | null;

  /**
   * Returns `true` if and only if `ChainError.findCauseByName(err, name)` would return
   * a non-null value. This essentially determines whether `err` has any cause in
   * its cause chain that has name `name`.
   */
  static hasCauseWithName(err: Error, name: string): boolean;
}
```

## Examples

The "Quick start" section above covers several basic cases. Here's a more advanced
case:

```ts
const err1 = new ChainError('something bad happened');
/* ... */
const err2 = new ChainError(
  'failed to connect to "127.0.0.1:215"',
  {
    'name': 'ConnectionError',
    'cause': err1,
    'info': {
    'errno': 'ECONNREFUSED',
    'remote_ip': '127.0.0.1',
    'port': 215
    }
  }
);

console.log(err2.message);
console.log(err2.name);
console.log(ChainError.getInfo(err2));
console.log(err2.stack);
```

This outputs:

```text
failed to connect to "127.0.0.1:215": something bad happened
ConnectionError
{ errno: 'ECONNREFUSED', remote_ip: '127.0.0.1', port: 215 }
ConnectionError: failed to connect to "127.0.0.1:215": something bad happened
  at Object.<anonymous> (/home/dap/node-chain-error/examples/info.js:5:12)
  at Module._compile (module.js:456:26)
  at Object.Module._extensions..js (module.js:474:10)
  at Module.load (module.js:356:32)
  at Function.Module._load (module.js:312:12)
  at Function.Module.runMain (module.js:497:10)
  at startup (node.js:119:16)
  at node.js:935:3
```

Information properties are inherited up the cause chain, with values at the top
of the chain overriding same-named values lower in the chain. To continue that
example:

```ts
const err3 = new ChainError(
  'request failed',
  {
    'name': 'RequestError',
    'cause': err2,
    'info': { 'errno': 'EBADREQUEST' }
  }
);

console.log(err3.message);
console.log(err3.name);
console.log(ChainError.getInfo(err3));
console.log(err3.stack);
```

This outputs:

```text
request failed: failed to connect to "127.0.0.1:215": something bad happened
RequestError
{ errno: 'EBADREQUEST', remote_ip: '127.0.0.1', port: 215 }
RequestError: request failed: failed to connect to "127.0.0.1:215": something bad happened
  at Object.<anonymous> (/home/dap/node-chain-error/examples/info.js:20:12)
  at Module._compile (module.js:456:26)
  at Object.Module._extensions..js (module.js:474:10)
  at Module.load (module.js:356:32)
  at Function.Module._load (module.js:312:12)
  at Function.Module.runMain (module.js:497:10)
  at startup (node.js:119:16)
  at node.js:935:3
```

You can also print the complete stack trace of combined `Error`s by using
`ChainError.getFullStack(err).`

```ts
const err1 = new ChainError('something bad happened');
/* ... */
const err2 = new ChainError('something really bad happened here', err1);

console.log(ChainError.getFullStack(err2));
```

This outputs:

```text
ChainError: something really bad happened here: something bad happened
  at Object.<anonymous> (/home/dap/node-chain-error/examples/fullStack.js:5:12)
  at Module._compile (module.js:409:26)
  at Object.Module._extensions..js (module.js:416:10)
  at Module.load (module.js:343:32)
  at Function.Module._load (module.js:300:12)
  at Function.Module.runMain (module.js:441:10)
  at startup (node.js:139:18)
  at node.js:968:3
caused by: ChainError: something bad happened
  at Object.<anonymous> (/home/dap/node-chain-error/examples/fullStack.js:3:12)
  at Module._compile (module.js:409:26)
  at Object.Module._extensions..js (module.js:416:10)
  at Module.load (module.js:343:32)
  at Function.Module._load (module.js:300:12)
  at Function.Module.runMain (module.js:441:10)
  at startup (node.js:139:18)
  at node.js:968:3
```

`ChainError.fullStack` is also safe to use on regular `Error`s, so feel free to use
it whenever you need to extract the stack trace from an `Error`, regardless if
it's a `ChainError` or not.
