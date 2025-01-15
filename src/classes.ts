import { cache } from './cache'
import { Generator } from './generators'
import { MaybeError } from './utils'
import {
  all,
  ValidationResult,
  InstanceValidator,
  ValidationOptions,
} from './validators'

// https://stackoverflow.com/a/50375286
// Ultra clever
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

export type ClassInput<T extends any[]> = T extends (infer U)[]
  ? UnionToIntersection<U>
  : never

// Converts from e.g. `[A, B, C]` to `(A | B | C)[]`. `ConsolidatedClasses` doesn't handle tuples
// well without this.
type ArrayFromTuple<T extends any[]> = T extends (infer U)[] ? U[] : never

export type ConsolidatedClasses<T extends Class<any[]>[]> = ArrayFromTuple<
  T
> extends Class<(infer U)[]>[]
  ? Class<U[]>[]
  : never

/** Transforms a list of distinct classes, such as `[Class<[A]>, Class<[B, C]>]` into an uniform
 * list of the form `[Class<(A | B | C)[]>, Class<(A | B | C)[]>, Class<(A | B | C)[]>]`. Use it
 * to generate an adequate value for `instance`.
 *
 * @see {@link instance}
 * */
export function consolidate<T extends Class<any[]>[]>(
  ...classes: T
): ConsolidatedClasses<T> {
  // WARNING: I claim this conversion works, but TypeScript will not help us with this.
  return (classes as unknown) as ConsolidatedClasses<T>
}

/** T should be an union of the types of every parent. */
export interface ClassOptions<T extends Class<any>[]> {
  /** The name will be used to improve error messages. */
  name?: string
  /** A list of classes that are prerequisites to this one. */
  extends?: Class<T>[]
}

let idCounter = 0

/**
 * A class defines the behavior that your instances shall have.
 *
 * The behavior will be asserted using the given laws (if a given constructor is declared
 * to be an instance of a given class, but it does not pass its validations, an error is
 * thrown).
 *
 * A class may also extend other classes, so all their validators must pass as well.
 *
 * @example
 * ```javascript
 * const monoid = new Class({
 *  name: 'Monoid',
 *  extends: [eq],
 *  laws: all(append, associativity, identity)
 * })
 * ```
 *
 * @see {@link all}
 */
export class Class<T extends any[]> {
  public readonly parents: Class<T>[]
  public readonly name: string
  public readonly id: number

  private _laws: InstanceValidator<ClassInput<T>>[] = []

  constructor(options: ClassOptions<T> = {}) {
    const { extends: parents = [], name } = options

    this.parents = parents
    this.name = name || 'Unnamed'
    this.id = idCounter++
  }

  /** A validator that will check if a constructor is an instance of this class. */
  withLaws(validator: InstanceValidator<ClassInput<T>>): this {
    this._laws.push(validator)
    return this
  }

  /** A dedicated method should be used for proper type inference from TypeScript */
  getLaws(): InstanceValidator<ClassInput<T>> {
    return all(...this._laws)
  }

  /**
   * Checks if something is an instance of this class.
   *
   * @param Constructor
   * @returns
   */
  validate(
    values: Generator<ClassInput<T>>,
    options: ValidationOptions = {},
  ): ValidationResult {
    if (cache.contains(values, this)) {
      return MaybeError.success()
    }

    const result = MaybeError.foldConjoin([
      ...this.parents.map((parent) => parent.validate(values, options)),
      this.getLaws().check(values, options),
    ])

    cache.set(values, this)
    return result
  }

  equals(other: Class<T>) {
    return this.id === other.id
  }
}
