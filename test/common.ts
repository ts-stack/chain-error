/**
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 *
 * Common utility functions used in multiple tests.
 */
export function cleanStack(stacktxt: string) {
  const re = new RegExp('\\(/.*/*.spec.js:\\d+:\\d+\\)', 'gm');
  return stacktxt.replace(re, '(dummy filename)').replace(/UserContext.fit /gm, 'UserContext.it ');
}
