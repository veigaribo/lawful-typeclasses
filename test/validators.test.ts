import { all, any, obey } from '../src/validators'
import { Instance } from '../src/instances'
import { Left, Right } from '../src/utils'

class EqInstance implements Instance {
  constructor(public readonly x: number) {}

  equals(b: EqInstance): boolean {
    return this.x === b.x
  }

  static generateData(x: number): EqInstance {
    return new EqInstance(x)
  }
}

class SumInstance extends EqInstance {
  sum(b: SumInstance): SumInstance {
    return new SumInstance(this.x + b.x)
  }

  static generateData(x: number): SumInstance {
    return new SumInstance(x)
  }
}

test('Obey returns true if the predicate holds', () => {
  const validator = obey((a: SumInstance, b: SumInstance) => {
    return a.sum(b).equals(b.sum(a))
  })

  expect(validator.check(SumInstance)).toBeInstanceOf(Right)
})

test('Obey returns false if the predicate does not hold', () => {
  const zero = new SumInstance(0)

  const validator = obey((a: SumInstance, b: SumInstance) => {
    return !a.equals(b) && a.sum(zero).equals(b.sum(zero))
  })

  expect(validator.check(SumInstance)).toBeInstanceOf(Left)
})

test('Obey tests with all params as 0', () => {
  const zero = new SumInstance(0)

  let wasZeroes = false

  const validator = obey((a: SumInstance, b: SumInstance) => {
    if ([a, b].every((x) => x.equals(zero))) {
      wasZeroes = true
    }

    return !a.equals(b) && a.sum(zero).equals(b.sum(zero))
  })

  expect(validator.check(SumInstance)).toBeInstanceOf(Left)
  expect(wasZeroes).toBe(true)
})

test('Obey tests with all params as 1', () => {
  const one = new SumInstance(1)

  let wasOnes = false

  const validator = obey((a: SumInstance, b: SumInstance) => {
    if ([a, b].every((x) => x.equals(one))) {
      wasOnes = true
    }

    return a.sum(b).equals(b.sum(a))
  })

  expect(validator.check(SumInstance)).toBeInstanceOf(Right)
  expect(wasOnes).toBe(true)
})

const implement = (key: string) => {
  return obey((a) => key in a)
}

test('All returns true if all validators return true', () => {
  const validator = all(
    implement('sum'),
    implement('equals'),
    implement('toString'),
  )

  expect(validator.check(SumInstance)).toBeInstanceOf(Right)
})

test('All returns false if some of the validators does not return true', () => {
  const validator = all(
    implement('sum'),
    implement('equals'),
    implement('multiply'),
  )

  expect(validator.check(SumInstance)).toBeInstanceOf(Left)
})

test('All returns false if none of the validators return true', () => {
  const validator = all(implement('a'), implement('b'), implement('c'))

  expect(validator.check(SumInstance)).toBeInstanceOf(Left)
})

test('All returns true if no validators are expected', () => {
  const validator = all()

  expect(validator.check(SumInstance)).toBeInstanceOf(Right)
})

test('Any returns true if all validators return true', () => {
  const validator = any(
    implement('sum'),
    implement('equals'),
    implement('toString'),
  )

  expect(validator.check(SumInstance)).toBeInstanceOf(Right)
})

test('Any returns true if only some of the validators return true', () => {
  const validator = any(
    implement('sum'),
    implement('equals'),
    implement('multiply'),
  )

  expect(validator.check(SumInstance)).toBeInstanceOf(Right)
})

test('Any returns false if none of the validators return true', () => {
  const validator = any(implement('a'), implement('b'), implement('c'))

  expect(validator.check(SumInstance)).toBeInstanceOf(Left)
})

test('Any returns false if no validators are expected', () => {
  const validator = any()

  expect(validator.check(SumInstance)).toBeInstanceOf(Left)
})

test('Using higher-order validators as argument to another works as expected', () => {
  const validator1 = all(
    implement('sum'),
    implement('toString'),
    any(implement('equals'), implement('nequals')),
  )

  expect(validator1.check(SumInstance)).toBeInstanceOf(Right)

  const validator2 = any(
    all(implement('sum'), implement('multiply'), implement('divide')),
    implement('append'),
    all(implement('sum'), implement('equals')),
  )

  expect(validator2.check(SumInstance)).toBeInstanceOf(Right)

  const validator3 = all(
    implement('sum'),
    implement('equals'),
    any(implement('multiply'), implement('divide'), implement('raise')),
  )

  expect(validator3.check(SumInstance)).toBeInstanceOf(Left)

  const validator4 = all(
    any(all(any(implement('sum'), implement('multiply')))),
    any(implement('equals'), implement('nequals')),
    implement('map'),
  )

  expect(validator4.check(SumInstance)).toBeInstanceOf(Left)
})
