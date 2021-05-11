import { continuous } from '../src/generators'
import { all, any, obey } from '../src/validators'

class EqInstance {
  constructor(public readonly x: number) {}

  equals(b: EqInstance): boolean {
    return this.x === b.x
  }
}

class SumInstance extends EqInstance {
  sum(b: SumInstance): SumInstance {
    return new SumInstance(this.x + b.x)
  }
}

const generateSum = continuous((x) => new SumInstance(x))

test('Obey returns true if the predicate holds', () => {
  const validator = obey((Instance, a: SumInstance, b: SumInstance) => {
    return a.sum(b).equals(b.sum(a))
  })

  expect(validator.check(SumInstance, generateSum).isSuccess()).toBe(true)
})

test('Obey returns false if the predicate does not hold', () => {
  const zero = new SumInstance(0)

  const validator = obey((Instance, a: SumInstance, b: SumInstance) => {
    return !a.equals(b) && a.sum(zero).equals(b.sum(zero))
  })

  expect(validator.check(SumInstance, generateSum).isError()).toBe(true)
})

test('Will run as many tests as it is set in the options', () => {
  const qty = 10

  const predicate = jest.fn((Instance, a: SumInstance, b: SumInstance) => {
    return a.sum(b).equals(b.sum(a))
  })

  const validator = obey(predicate)

  expect(
    validator.check(SumInstance, generateSum, { sampleSize: qty }).isSuccess(),
  ).toBe(true)
  expect(predicate).toBeCalledTimes(qty)

  predicate.mockClear()
  const qty2 = 6

  expect(
    validator.check(SumInstance, generateSum, { sampleSize: qty2 }).isSuccess(),
  ).toBe(true)
  expect(predicate).toBeCalledTimes(qty2)
})

test('Will provide the Instance constructor as the first parameter', () => {
  class StaticSumInstance extends SumInstance {
    static sum(x: StaticSumInstance, y: StaticSumInstance) {
      return x.sum(y)
    }

    static generateData(n: number) {
      return new StaticSumInstance(n)
    }
  }

  const validator = obey((Instance: typeof StaticSumInstance, a, b) => {
    return Instance.sum(a, b).equals(Instance.sum(a, b))
  })
})

const implement = (key: string) => {
  return obey((Instance, a) => key in a)
}

test('All returns true if all validators return true', () => {
  const validator = all(
    implement('sum'),
    implement('equals'),
    implement('toString'),
  )

  expect(validator.check(SumInstance, generateSum).isSuccess()).toBe(true)
})

test('All returns false if some of the validators does not return true', () => {
  const validator = all(
    implement('sum'),
    implement('equals'),
    implement('multiply'),
  )

  expect(validator.check(SumInstance, generateSum).isError()).toBe(true)
})

test('All returns false if none of the validators return true', () => {
  const validator = all(implement('a'), implement('b'), implement('c'))

  expect(validator.check(SumInstance, generateSum).isError()).toBe(true)
})

test('All returns true if no validators are expected', () => {
  const validator = all()

  expect(validator.check(SumInstance, generateSum).isSuccess()).toBe(true)
})

test('Any returns true if all validators return true', () => {
  const validator = any(
    implement('sum'),
    implement('equals'),
    implement('toString'),
  )

  expect(validator.check(SumInstance, generateSum).isSuccess()).toBe(true)
})

test('Any returns true if only some of the validators return true', () => {
  const validator = any(
    implement('sum'),
    implement('equals'),
    implement('multiply'),
  )

  expect(validator.check(SumInstance, generateSum).isSuccess()).toBe(true)
})

test('Any returns false if none of the validators return true', () => {
  const validator = any(implement('a'), implement('b'), implement('c'))

  expect(validator.check(SumInstance, generateSum).isError()).toBe(true)
})

test('Any returns false if no validators are expected', () => {
  const validator = any()

  expect(validator.check(SumInstance, generateSum).isError()).toBe(true)
})

test('Using higher-order validators as argument to another works as expected', () => {
  const validator1 = all(
    implement('sum'),
    implement('toString'),
    any(implement('equals'), implement('nequals')),
  )

  expect(validator1.check(SumInstance, generateSum).isSuccess()).toBe(true)

  const validator2 = any(
    all(implement('sum'), implement('multiply'), implement('divide')),
    implement('append'),
    all(implement('sum'), implement('equals')),
  )

  expect(validator2.check(SumInstance, generateSum).isSuccess()).toBe(true)

  const validator3 = all(
    implement('sum'),
    implement('equals'),
    any(implement('multiply'), implement('divide'), implement('raise')),
  )

  expect(validator3.check(SumInstance, generateSum).isError()).toBe(true)

  const validator4 = all(
    any(all(any(implement('sum'), implement('multiply')))),
    any(implement('equals'), implement('nequals')),
    implement('map'),
  )

  expect(validator4.check(SumInstance, generateSum).isError()).toBe(true)
})
