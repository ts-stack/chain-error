/**
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 *
 * Common utility functions used in multiple tests.
 */
export function cleanStack(stacktxt: string) {
  return stacktxt
    .replace(/ +at Object.asyncJest[^\n]+\n/gm, '')
    .replace(/ +at Object.<anonymous>[^\n]+\n/gm, '')
    .replace(/at \/[^\n]+queueRunner[^\n]+/g, '(dummy filename)')
    .replace(/at \([^\n]+queueRunner[^\n]+\)/g, '(dummy filename)')
    .replace(/\([^\n]+spec.ts:\d+:\d+\)/, '(dummy filename)');
}
