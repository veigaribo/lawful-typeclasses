const testSampleSizeKey = Symbol('Test sample size')

export const config = {
  [testSampleSizeKey]: 15,

  get testSampleSize() {
    return this[testSampleSizeKey]
  },

  set testSampleSize(value: number) {
    if (value < 0) {
      throw new Error(`Test sample size cannot be negative (got ${value}).`)
    }

    this[testSampleSizeKey] = Math.trunc(value)
  },
}
