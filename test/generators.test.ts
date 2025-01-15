import { continuous, discrete } from '../src/generators'

class A {
  constructor(public readonly x: number, public readonly y: number) {}
}

describe('continuous', () => {
  const originalRandom = Math.random
  const mockedRandomValue = (Symbol(42) as any) as number

  beforeEach(() => {
    Math.random = () => mockedRandomValue
  })

  afterEach(() => {
    Math.random = originalRandom
  })

  it('continuous generates random numbers for its function', () => {
    const c = continuous<A>('A', (x, y) => {
      return new A(x, y)
    })

    const gen = c.get(10)

    expect(gen.x).toEqual(mockedRandomValue)
    expect(gen.y).toEqual(mockedRandomValue)
  })

  it('continuous generates always 0s for the first position', () => {
    const c = continuous<A>('A', (x, y) => {
      return new A(x, y)
    })

    const gen = c.get(0)

    expect(gen.x).toEqual(0)
    expect(gen.y).toEqual(0)
  })

  it('continuous generates always 1s for the second position', () => {
    const c = continuous<A>('A', (x, y) => {
      return new A(x, y)
    })

    const gen = c.get(1)

    expect(gen.x).toEqual(1)
    expect(gen.y).toEqual(1)
  })

  it('continuous uses the provided random function', () => {
    const mockedRandomValue2 = (Symbol(2013) as any) as number
    const random = () => mockedRandomValue2

    const c = continuous<A>(
      'A',
      (x, y) => {
        return new A(x, y)
      },
      random,
    )

    const gen = c.get(10)

    expect(gen.x).toEqual(mockedRandomValue2)
    expect(gen.y).toEqual(mockedRandomValue2)
  })
})

describe('discrete', () => {
  const originalRandom = Math.random
  const mockedRandomFn = jest.fn()
  const index = 10 // Could be anything > 2

  // Results of the random function in order to trigger the first, second and
  // third values of a discrete generator with 3 options, respectively
  const FIRST_VALUE = 0.3
  const SECOND_VALUE = 0.6
  const THIRD_VALUE = 0.9

  beforeEach(() => {
    Math.random = mockedRandomFn
  })

  afterEach(() => {
    Math.random = originalRandom
  })

  it('discrete generates random values', () => {
    const values = [new A(10, 1), new A(100, 2), new A(1000, 3)]
    const d = discrete<A>('A', values)

    mockedRandomFn.mockReturnValueOnce(THIRD_VALUE)
    const gen0 = d.get(index)

    expect(gen0).toEqual(values[2])

    mockedRandomFn.mockReturnValueOnce(FIRST_VALUE)
    const gen1 = d.get(index)

    expect(gen1).toEqual(values[0])
  })

  it('discrete uses the provided random function', () => {
    const random = () => SECOND_VALUE

    const values = [new A(10, 1), new A(100, 2), new A(1000, 3)]
    const d = discrete<A>('A', values, random)

    const gen0 = d.get(index)
    const gen1 = d.get(index)

    expect(gen0).toEqual(values[1])
    expect(gen1).toEqual(values[1])
  })
})
