import { MaybeError } from '../src/utils'

test('conjoin works as expected', () => {
  const error = MaybeError.fail('1')
  const notError = MaybeError.success()

  expect(error.conjoin(error).value).toBe(
    MaybeError.appendText(error.value!, error.value!),
  )

  expect(error.conjoin(notError).value).toBe(error.value)
  expect(notError.conjoin(error).value).toBe(error.value)
  expect(notError.conjoin(notError).value).toBeNull()
})

test('disjoin works as expected', () => {
  const error = MaybeError.fail('2')
  const notError = MaybeError.success()

  expect(error.disjoin(error).value).toBe(
    MaybeError.appendText(error.value!, error.value!),
  )

  expect(error.disjoin(notError).value).toBeNull()
  expect(notError.disjoin(error).value).toBeNull()
  expect(notError.disjoin(notError).value).toBeNull()
})
