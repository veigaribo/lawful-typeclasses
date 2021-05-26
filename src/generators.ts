import { arrayWithLength, Constructor } from './utils'

export interface Generator<T extends Constructor> {
  get(i: number): InstanceType<T>
}

export type RandomFunction = () => number

/**
 * Generates "random" numbers in the range [0, 1[.
 *
 * @returns
 */
export function defaultRandom(): number {
  return Math.random()
}

export class Continuous<T extends Constructor> implements Generator<T> {
  public readonly random: RandomFunction

  /**
   *
   * @param f A function from _n_ real numbers in the range [0, 1] to a value of
   * T
   * @param random A function that generates pseudo-random numbers. For each
   * value that is instantiated, this function will be called with a different
   * parameter `x`, and every random parameter will be a different `y`.
   *
   * The default implementation will always generate 0s for the first value, 1s
   * for the second one, and the rest will be random.
   */
  constructor(
    public readonly f: (...n: number[]) => InstanceType<T>,
    random?: RandomFunction,
  ) {
    this.random = random || defaultRandom
  }

  public get(i: number): InstanceType<T> {
    const amountOfParams = this.f.length
    const params = arrayWithLength(amountOfParams).map(() => {
      if (i === 0) return 0
      if (i === 1) return 1

      return this.random()
    })

    return this.f(...params)
  }
}

export class Discrete<T extends Constructor> implements Generator<T> {
  public readonly random: RandomFunction

  /**
   *
   * @param values A list of discrete values the constructor may assume
   */
  constructor(
    public readonly values: InstanceType<T>[],
    random?: RandomFunction,
  ) {
    this.random = random || defaultRandom
  }

  public get(i: number): InstanceType<T> {
    const randomIndex = Math.floor(this.random() * this.values.length)

    return this.values[randomIndex]
  }
}

/**
 * Generate testing values via a function.
 *
 * @example
 * ```
 * // a will be a random number, so the Foo value should be too
 * instance(Foo, bar, continuous((a) => new Foo(a)))
 * ```
 *
 * @param f
 * @param random
 * @returns
 */
export function continuous<T extends Constructor>(
  f: (...n: number[]) => InstanceType<T>,
  random?: RandomFunction,
) {
  return new Continuous(f, random)
}

/**
 * Generate testing values from a finite list
 *
 * @example
 * ```
 * // random values will be sampled from that list
 * instance(Foo, bar, discrete([new Foo(1), new Foo(2), new Foo(3)]))
 * ```
 *
 * @param values
 * @returns
 */
export function discrete<T extends Constructor>(
  values: InstanceType<T>[],
  random?: RandomFunction,
) {
  return new Discrete(values, random)
}
