import { arrayWithLength, Either, Left, Right } from './utils'
import { Instance, InstanceConstructor } from './instances'

export type ValidationResult = Either<string, true>

export interface Validator<T> {
  check(instance: T): ValidationResult
}

type Predicate<T extends Instance> = (...data: T[]) => boolean

type InstanceValidator = Validator<InstanceConstructor>

const OBEY_CHECK_AMOUNT = 13
const specialCases = [0, 1]

// An Obey of T validates using instances of T
export class Obeys<T extends InstanceConstructor> implements InstanceValidator {
  constructor(public readonly param: Predicate<InstanceType<T>>) {}

  check(instance: T): ValidationResult {
    const predicate = this.param

    const paramsForInstance = instance.generateData.length
    const paramsForPredicate = predicate.length

    const fail = (params: any[]): ValidationResult => {
      return new Left(
        `Predicate ${predicate.name} failed with params ${params
          .map((p) => JSON.stringify(p))
          .join(', ')}`,
      )
    }

    for (var specialCase of specialCases) {
      const params = arrayWithLength(paramsForPredicate).map(() => {
        return instance.generateData(
          // impure
          ...new Array(paramsForInstance).fill(specialCase),
        )
      })

      if (!predicate(...params)) {
        return fail(params)
      }
    }

    for (var i = 0; i < OBEY_CHECK_AMOUNT; i++) {
      const params = arrayWithLength(paramsForPredicate).map(() => {
        return instance.generateData(
          // impure
          ...arrayWithLength(paramsForInstance).map(Math.random),
        )
      })

      if (!predicate(...params)) {
        return fail(params)
      }
    }

    return new Right(true)
  }
}

export class All implements InstanceValidator {
  constructor(public readonly param: InstanceValidator[]) {}

  check(instance: InstanceConstructor): ValidationResult {
    const lefts = this.param
      .map((val) => val.check(instance))
      .filter((res) => res instanceof Left)

    return lefts.length
      ? new Left(
          `All constraint failed:\n\n${lefts
            .map((left) => left.value)
            .join('\n\n')}`,
        )
      : new Right(true)
  }
}

export class Any implements InstanceValidator {
  constructor(public readonly param: InstanceValidator[]) {}

  check(instance: InstanceConstructor): ValidationResult {
    const lefts = this.param
      .map((val) => val.check(instance))
      .filter((res) => res instanceof Left)

    return lefts.length === this.param.length
      ? new Left(
          `Any constraint failed:\n\n${lefts
            .map((left) => left.value)
            .join('\n\n')}`,
        )
      : new Right(true)
  }
}

export function obey<T extends InstanceConstructor>(
  predicate: Predicate<InstanceType<T>>,
) {
  return new Obeys<T>(predicate)
}

export function all(...laws: InstanceValidator[]): InstanceValidator {
  return new All(laws)
}

export function any(...laws: InstanceValidator[]): InstanceValidator {
  return new Any(laws)
}
