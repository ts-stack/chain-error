import { ChainError } from '#lib/chain-error.js';

const findCauseByName = ChainError.findCauseByName.bind(ChainError);
const hasCauseWithName = ChainError.hasCauseWithName.bind(ChainError);

class MyError extends Error {
  override name = 'MyError';
  /**
   * This class deliberately doesn't inherit from our error classes.
   */
  constructor() {
    super('here is my error');
  }
}

describe('findCauseByName()/hasCauseWithName():', () => {
  /**
   * We'll build up a cause chain using each of our classes and make sure
   * that findCauseByName() traverses all the way to the bottom.  This
   * ends up testing that findCauseByName() works with each of these
   * classes.
   */
  let err1: Error;
  let err2: Error;
  let err3: Error;
  let err4: Error;

  beforeEach(() => {
    err1 = new MyError();
    err2 = new ChainError('basic chain-error (number two)', { name: 'ErrorTwo', cause: err1 });
    err3 = new ChainError('strict error (number three)', { name: 'ErrorThree', cause: err2 });
    err4 = new ChainError(
      'skipCauseMessage (number four)',
      {
        name: 'ErrorFour',
        cause: err3,
      },
      true
    );
  });

  it('top-level error should have all of the causes in its chain', () => {
    expect(findCauseByName(err4, 'ErrorFour')).toBe(err4);
    expect(hasCauseWithName(err4, 'ErrorFour')).toBe(true);
    expect(findCauseByName(err4, 'ErrorThree')).toBe(err3);
    expect(hasCauseWithName(err4, 'ErrorThree')).toBe(true);
    expect(findCauseByName(err4, 'ErrorTwo')).toBe(err2);
    expect(hasCauseWithName(err4, 'ErrorTwo')).toBe(true);
    expect(findCauseByName(err4, 'MyError')).toBe(err1);
    expect(hasCauseWithName(err4, 'MyError')).toBe(true);
  });

  it('next-level errors should have only their own causes', () => {
    expect(findCauseByName(err3, 'ErrorFour')).toBe(null);
    expect(hasCauseWithName(err3, 'ErrorFour')).toBe(false);
    expect(findCauseByName(err3, 'ErrorThree')).toEqual(err3);
    expect(hasCauseWithName(err3, 'ErrorThree')).toBe(true);
    expect(findCauseByName(err3, 'ErrorTwo')).toEqual(err2);
    expect(hasCauseWithName(err3, 'ErrorTwo')).toBe(true);
    expect(findCauseByName(err3, 'MyError')).toEqual(err1);
    expect(hasCauseWithName(err3, 'MyError')).toBe(true);

    expect(findCauseByName(err2, 'ErrorFour')).toBe(null);
    expect(hasCauseWithName(err2, 'ErrorFour')).toBe(false);
    expect(findCauseByName(err2, 'ErrorThree')).toBe(null);
    expect(hasCauseWithName(err2, 'ErrorThree')).toBe(false);
    expect(findCauseByName(err2, 'ErrorTwo')).toEqual(err2);
    expect(hasCauseWithName(err2, 'ErrorTwo')).toBe(true);
    expect(findCauseByName(err2, 'MyError')).toEqual(err1);
    expect(hasCauseWithName(err2, 'MyError')).toBe(true);
  });

  it('must work on non-ChainError errors', () => {
    expect(findCauseByName(err1, 'MyError')).toEqual(err1);
    expect(hasCauseWithName(err1, 'MyError')).toBe(true);
    expect(findCauseByName(err1, 'ErrorTwo')).toBe(null);
    expect(hasCauseWithName(err1, 'ErrorTwo')).toBe(false);

    err1 = new Error('a very basic error');
    expect(findCauseByName(err1, 'Error')).toEqual(err1);
    expect(hasCauseWithName(err1, 'Error')).toBe(true);
    expect(findCauseByName(err1, 'MyError')).toBe(null);
    expect(hasCauseWithName(err1, 'MyError')).toBe(false);
  });

  it('should throw an Error when given bad argument types', () => {
    expect(() => findCauseByName(null as any, 'AnError')).toThrow(/err must be an Error/);
    expect(() => hasCauseWithName(null as any, 'AnError')).toThrow(/err must be an Error/);
    expect(() => findCauseByName(err1, null as any)).toThrow(/string.*is required/);
    expect(() => hasCauseWithName(err1, null as any)).toThrow(/string.*is required/);
  });
});
