import { ChainError } from '../src/chain-error';

const findCauseByName = ChainError.findCauseByName.bind(ChainError);
const hasCauseWithName = ChainError.hasCauseWithName.bind(ChainError);

class MyError extends Error {
  name = 'MyError';
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
    expect(null).toEqual(findCauseByName(err3, 'ErrorFour'));
    expect(false).toEqual(hasCauseWithName(err3, 'ErrorFour'));
    expect(err3).toEqual(findCauseByName(err3, 'ErrorThree'));
    expect(true).toEqual(hasCauseWithName(err3, 'ErrorThree'));
    expect(err2).toEqual(findCauseByName(err3, 'ErrorTwo'));
    expect(true).toEqual(hasCauseWithName(err3, 'ErrorTwo'));
    expect(err1).toEqual(findCauseByName(err3, 'MyError'));
    expect(true).toEqual(hasCauseWithName(err3, 'MyError'));

    expect(null).toEqual(findCauseByName(err2, 'ErrorFour'));
    expect(false).toEqual(hasCauseWithName(err2, 'ErrorFour'));
    expect(null).toEqual(findCauseByName(err2, 'ErrorThree'));
    expect(false).toEqual(hasCauseWithName(err2, 'ErrorThree'));
    expect(err2).toEqual(findCauseByName(err2, 'ErrorTwo'));
    expect(true).toEqual(hasCauseWithName(err2, 'ErrorTwo'));
    expect(err1).toEqual(findCauseByName(err2, 'MyError'));
    expect(true).toEqual(hasCauseWithName(err2, 'MyError'));
  });

  it('must work on non-ChainError errors', () => {
    expect(err1).toEqual(findCauseByName(err1, 'MyError'));
    expect(true).toEqual(hasCauseWithName(err1, 'MyError'));
    expect(null).toEqual(findCauseByName(err1, 'ErrorTwo'));
    expect(false).toEqual(hasCauseWithName(err1, 'ErrorTwo'));

    err1 = new Error('a very basic error');
    expect(err1).toEqual(findCauseByName(err1, 'Error'));
    expect(true).toEqual(hasCauseWithName(err1, 'Error'));
    expect(null).toEqual(findCauseByName(err1, 'MyError'));
    expect(false).toEqual(hasCauseWithName(err1, 'MyError'));
  });

  it('should throw an Error when given bad argument types', () => {
    expect(() => findCauseByName(null, 'AnError')).toThrowError(/err must be an Error/);
    expect(() => hasCauseWithName(null, 'AnError')).toThrowError(/err must be an Error/);
    expect(() => findCauseByName(err1, null)).toThrowError(/string.*is required/);
    expect(() => hasCauseWithName(err1, null)).toThrowError(/string.*is required/);
  });
});
