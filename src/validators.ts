import { config } from './config'
import { Instance, InstanceConstructor } from './instances'
import { arrayWithLength, Maybe, MaybeError } from './utils'

export type ValidationResult = MaybeError

export interface Validator<T> {
  check(instance: T): ValidationResult
}

type Predicate<T extends Instance> = (...data: T[]) => boolean

type InstanceValidator = Validator<InstanceConstructor>

const specialCases = [0, 1]

const getRandomSampleSize = (): number => {
  const { testSampleSize } = config

  if (testSampleSize < specialCases.length) {
    throw new Error(
      `Test sample size cannot be ${testSampleSize}, there are ${specialCases.length} special cases that must be tested. that is the minimum acceptable value.`,
    )
  }

  return testSampleSize - specialCases.length
}

// An Obey of T validates using instances of T
export class Obeys<T extends InstanceConstructor> implements InstanceValidator {
  constructor(public readonly param: Predicate<InstanceType<T>>) {}

  check(instance: T): ValidationResult {
    const { skipValidations, generateRandom } = config

    if (skipValidations) {
      return MaybeError.success()
    }

    const predicate = this.param

    const paramsForInstance = instance.generateData.length
    const paramsForPredicate = predicate.length

    const fail = (params: any[]): ValidationResult => {
      return MaybeError.fail(
        `Predicate ${predicate.name} failed with params ${params
          .map((p) => JSON.stringify(p))
          .join(', ')}`,
      )
    }

    for (var specialCase of specialCases) {
      const params = arrayWithLength(paramsForPredicate).map(() => {
        return instance.generateData(
          ...new Array(paramsForInstance).fill(specialCase),
        )
      })

      if (!predicate(...params)) {
        return fail(params)
      }
    }

    const randomSampleSize = getRandomSampleSize()

    for (var i = 0; i < randomSampleSize; i++) {
      const params = arrayWithLength(paramsForPredicate).map(() => {
        return instance.generateData(
          // impure
          ...arrayWithLength(paramsForInstance).map(generateRandom),
        )
      })

      if (!predicate(...params)) {
        return fail(params)
      }
    }

    return MaybeError.success()
  }
}

export class All implements InstanceValidator {
  constructor(public readonly param: InstanceValidator[]) {}

  check(instance: InstanceConstructor): ValidationResult {
    const result = MaybeError.foldConjoin(
      this.param.map((val) => val.check(instance)),
    )

    return result.isError()
      ? result.conjoin(MaybeError.fail(`All constraint failed:`))
      : MaybeError.success()
  }
}

export class Any implements InstanceValidator {
  constructor(public readonly param: InstanceValidator[]) {}

  check(instance: InstanceConstructor): ValidationResult {
    const result = MaybeError.foldDisjoin(
      this.param.map((val) => val.check(instance)),
    )

    return result.isError()
      ? result.conjoin(MaybeError.fail(`Any constraint failed:`))
      : MaybeError.success()
  }
}

/**
 * Defines a behavior that the instance values must follow.
 *
 * @param predicate - The function that, given any number of random instance values, shall return true.
 *
 * @example
 * ```javascript
 * obey(function commutativity(a, b) {
 *  // this property shall hold for any values a and b
 *  return a.add(b) === b.add(a)
 * })
 * ```
 */
export function obey<T extends InstanceConstructor>(
  predicate: Predicate<InstanceType<T>>,
) {
  return new Obeys<T>(predicate)
}

/**
 * Compose multiple validators using a logical AND.
 *
 * @param laws - The individual validators that must be followed.
 *
 * @example
 * ```javascript
 * // assuming associativity, commutativity and identity are validators, this will return
 * // another validator that demands every one of those laws to be obeyed
 * all(associativity, commutativity, identity)
 * ```
 */
export function all(...laws: InstanceValidator[]): InstanceValidator {
  return new All(laws)
}

/**
 * Compose multiple validators using a logical OR.
 *
 * @param laws - The individual validators, where at least one must be followed.
 *
 * @example
 * ```
 * // assuming symmetry and antissymetry are validators, this will return another validator
 * // that demands at least one of those laws to be obeyed
 * any(symmetry, antisymmetry)
 * ```
 */
export function any(...laws: InstanceValidator[]): InstanceValidator {
  return new Any(laws)
}
