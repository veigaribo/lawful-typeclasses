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

const generateSum = continuous('SumInstance', (x) => new SumInstance(x))

test('obey returns true if the predicate holds', () => {
  const validator = obey((a: SumInstance, b: SumInstance) => {
    return a.sum(b).equals(b.sum(a))
  })

  expect(validator.check(generateSum).isSuccess()).toBe(true)
})

test('obey returns false if the predicate does not hold', () => {
  const zero = new SumInstance(0)

  const validator = obey((a: SumInstance, b: SumInstance) => {
    return !a.equals(b) && a.sum(zero).equals(b.sum(zero))
  })

  expect(validator.check(generateSum).isError()).toBe(true)
})

test('will run as many tests as it is set in the options', () => {
  const qty = 10

  const predicate = jest.fn((a: SumInstance, b: SumInstance) => {
    return a.sum(b).equals(b.sum(a))
  })

  const validator = obey(predicate)

  expect(validator.check(generateSum, { sampleSize: qty }).isSuccess()).toBe(
    true,
  )
  expect(predicate).toBeCalledTimes(qty)

  predicate.mockClear()
  const qty2 = 6

  expect(validator.check(generateSum, { sampleSize: qty2 }).isSuccess()).toBe(
    true,
  )
  expect(predicate).toBeCalledTimes(qty2)
})

test('will provide the Instance constructor as the first parameter', () => {
  class StaticSumInstance extends SumInstance {
    static sum(x: StaticSumInstance, y: StaticSumInstance) {
      return x.sum(y)
    }

    static generateData(n: number) {
      return new StaticSumInstance(n)
    }
  }

  const validator = obey<StaticSumInstance>((a, b) => {
    return StaticSumInstance.sum(a, b).equals(StaticSumInstance.sum(a, b))
  })

  const generate = continuous(
    'StaticSumInstance',
    (x) => new StaticSumInstance(x),
  )

  expect(validator.check(generate).isSuccess()).toBe(true)
})

const implement = (key: string) => {
  return obey<object>((a) => key in a)
}

test('all returns true if all validators return true', () => {
  const validator = all(
    implement('sum'),
    implement('equals'),
    implement('toString'),
  )

  expect(validator.check(generateSum).isSuccess()).toBe(true)
})

test('all returns false if some of the validators does not return true', () => {
  const validator = all(
    implement('sum'),
    implement('equals'),
    implement('multiply'),
  )

  expect(validator.check(generateSum).isError()).toBe(true)
})

test('all returns false if none of the validators return true', () => {
  const validator = all(implement('a'), implement('b'), implement('c'))

  expect(validator.check(generateSum).isError()).toBe(true)
})

test('all returns true if no validators are expected', () => {
  const validator = all()

  expect(validator.check(generateSum).isSuccess()).toBe(true)
})

test('any returns true if all validators return true', () => {
  const validator = any(
    implement('sum'),
    implement('equals'),
    implement('toString'),
  )

  expect(validator.check(generateSum).isSuccess()).toBe(true)
})

test('any returns true if only some of the validators return true', () => {
  const validator = any(
    implement('sum'),
    implement('equals'),
    implement('multiply'),
  )

  expect(validator.check(generateSum).isSuccess()).toBe(true)
})

test('any returns false if none of the validators return true', () => {
  const validator = any(implement('a'), implement('b'), implement('c'))

  expect(validator.check(generateSum).isError()).toBe(true)
})

test('any returns false if no validators are expected', () => {
  const validator = any()

  expect(validator.check(generateSum).isError()).toBe(true)
})

test('using higher-order validators as argument to another works as expected', () => {
  const validator1 = all(
    implement('sum'),
    implement('toString'),
    any(implement('equals'), implement('nequals')),
  )

  expect(validator1.check(generateSum).isSuccess()).toBe(true)

  const validator2 = any(
    all(implement('sum'), implement('multiply'), implement('divide')),
    implement('append'),
    all(implement('sum'), implement('equals')),
  )

  expect(validator2.check(generateSum).isSuccess()).toBe(true)

  const validator3 = all(
    implement('sum'),
    implement('equals'),
    any(implement('multiply'), implement('divide'), implement('raise')),
  )

  expect(validator3.check(generateSum).isError()).toBe(true)

  const validator4 = all(
    any(all(any(implement('sum'), implement('multiply')))),
    any(implement('equals'), implement('nequals')),
    implement('map'),
  )

  expect(validator4.check(generateSum).isError()).toBe(true)
})
