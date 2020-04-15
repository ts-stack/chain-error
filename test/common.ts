/**
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 *
 * Common utility functions used in multiple tests.
 */
export function cleanStack(stacktxt: string) {
  return stacktxt
    .replace(/ +at Object.asyncJest[^\n]+\n/g, '')
    .replace(/ +at Object.<anonymous>[^\n]+.spec.ts:\d[^\n]+\n/g, '')
    .replace(/at \/[^\n]+jest-jasmine[^\n]+/g, '(dummy filename)')
    .replace(/\([^\n]+.spec.ts[^\n]+\)/g, '(dummy filename)');
}
