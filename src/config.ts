const testSampleSize = Symbol('Test sample size')
const skipValidations = Symbol('Skip validations')
const generateRandom = Symbol('Generate random')

export const config = {
  [generateRandom]: Math.random,
  [skipValidations]: false,
  [testSampleSize]: 15,

  /** A callable that shall return a random number. */
  get generateRandom() {
    return this[generateRandom]
  },

  set generateRandom(value: () => number) {
    this[generateRandom] = value
  },

  /** If true, class validations will not be performed. */
  get skipValidations() {
    return this[skipValidations]
  },

  set skipValidations(value: boolean) {
    this[skipValidations] = !!value
  },

  /** The number of times each instance will be validated against its supposed class.
   * Note that, because of the edge cases 0 and 1, that are always tested against, this
   * effectively has a minimum value of 2. */
  get testSampleSize() {
    return this[testSampleSize]
  },

  set testSampleSize(value: number) {
    if (value < 0) {
      throw new Error(`Test sample size cannot be negative (got ${value}).`)
    }

    this[testSampleSize] = Math.trunc(value)
  },
}
