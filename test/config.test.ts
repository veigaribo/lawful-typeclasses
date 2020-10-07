import { config } from '../src/config'

test('Will throw if one tries to use a negative testSampleSize', () => {
  expect(() => {
    config.testSampleSize = -2
  }).toThrow()
})

test('Will truncate valid testSampleSizes', () => {
  const value = (config.testSampleSize = Math.E)

  expect(config.testSampleSize).toBe(Math.trunc(value))
})
