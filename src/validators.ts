import { Generator } from './generators'
import { Constructor, MaybeError } from './utils'

export interface ValidationOptions {
  sampleSize?: number
}

export type ValidationResult = MaybeError

export interface InstanceValidator<T extends Constructor> {
  check(
    Instance: T,
    values: Generator<T>,
    options?: ValidationOptions,
  ): ValidationResult
}

export type Predicate<T extends Constructor> = (
  Instance: T,
  ...data: InstanceType<T>[]
) => boolean

// An Obey of T validates using instances of T
export class Obeys<T extends Constructor> implements InstanceValidator<T> {
  constructor(public readonly param: Predicate<T>) {}

  check(
    Instance: T,
    values: Generator<T>,
    options: ValidationOptions = {},
  ): ValidationResult {
    const { sampleSize = 15 } = options

    const predicate = this.param
    const paramsForPredicate = predicate.length - 1

    const fail = (params: any[]): ValidationResult => {
      return MaybeError.fail(
        `Predicate ${predicate.name} failed with params ${params
          .map((p) => JSON.stringify(p))
          .join(', ')}`,
      )
    }

    for (var i = 0; i < sampleSize; i++) {
      const params = []

      for (var j = 0; j < paramsForPredicate; j++) {
        try {
          // may throw
          const param = values.get(i)

          params.push(param)
        } catch (error) {
          return MaybeError.fail((error as Error).message).conjoin(fail(params))
        }
      }

      try {
        // may throw
        const result = predicate(Instance, ...params)

        if (!result) {
          return fail(params)
        }
      } catch (error) {
        return MaybeError.fail((error as Error).message).conjoin(fail(params))
      }
    }

    return MaybeError.success()
  }
}

export class All<T extends Constructor> implements InstanceValidator<T> {
  constructor(public readonly param: InstanceValidator<T>[]) {}

  check(
    Instance: T,
    values: Generator<T>,
    options: ValidationOptions = {},
  ): ValidationResult {
    const result = MaybeError.foldConjoin(
      this.param.map((val) => val.check(Instance, values, options)),
    )

    return result.isError()
      ? result.conjoin(MaybeError.fail(`All constraint failed:`))
      : MaybeError.success()
  }
}

export class Any<T extends Constructor> implements InstanceValidator<T> {
  constructor(public readonly param: InstanceValidator<T>[]) {}

  check(
    Instance: T,
    values: Generator<T>,
    options: ValidationOptions = {},
  ): ValidationResult {
    const result = MaybeError.foldDisjoin(
      this.param.map((val) => val.check(Instance, values, options)),
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
 * obey(function commutativity(Instance, a, b) {
 *  // this property shall hold for any values a and b
 *  return a.add(b) === b.add(a)
 * })
 * ```
 */
export function obey<T extends Constructor>(predicate: Predicate<T>) {
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
export function all<T extends Constructor>(
  ...laws: InstanceValidator<T>[]
): InstanceValidator<T> {
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
export function any<T extends Constructor>(
  ...laws: InstanceValidator<T>[]
): InstanceValidator<T> {
  return new Any(laws)
}
