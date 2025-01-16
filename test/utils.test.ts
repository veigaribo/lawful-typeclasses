import { MaybeError } from '../src/utils'

test('and works as expected', () => {
  const error = MaybeError.fail('1')
  const notError = MaybeError.success()

  expect(error.and(error).value).toBe(
    MaybeError.appendText(error.value!, error.value!),
  )

  expect(error.and(notError).value).toBe(error.value)
  expect(notError.and(error).value).toBe(error.value)
  expect(notError.and(notError).value).toBeNull()
})

test('or works as expected', () => {
  const error = MaybeError.fail('2')
  const notError = MaybeError.success()

  expect(error.or(error).value).toBe(
    MaybeError.appendText(error.value!, error.value!),
  )

  expect(error.or(notError).value).toBeNull()
  expect(notError.or(error).value).toBeNull()
  expect(notError.or(notError).value).toBeNull()
})
