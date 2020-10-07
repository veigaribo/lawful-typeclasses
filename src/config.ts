const testSampleSize = Symbol('Test sample size')
const skipValidations = Symbol('Skip validations')
const generateRandom = Symbol('Generate random')

export const config = {
  [generateRandom]: Math.random,
  [skipValidations]: false,
  [testSampleSize]: 15,

  get generateRandom() {
    return this[generateRandom]
  },

  set generateRandom(value: () => number) {
    this[generateRandom] = value
  },

  get skipValidations() {
    return this[skipValidations]
  },

  set skipValidations(value: boolean) {
    this[skipValidations] = !!value
  },

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
