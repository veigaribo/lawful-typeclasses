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
/** Uses contravariance to convert an union type like `A | B | C` into an intersection type like
 * `A & B & C`. */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

/** Converts from e.g. `[A, B, C]` to `(A | B | C)[]`. `ConsolidatedClasses` doesn't handle tuples
 * well without this. */
type ArrayFromTuple<T extends any[]> = T extends (infer U)[] ? U[] : never

export type TypesOfClasses<T extends Class<any>[]> = ArrayFromTuple<
  T
> extends Class<infer U>[]
  ? UnionToIntersection<U>
  : never

/** Given the type of an array (or tuple) of classes over different types, create the type of a new
 * array whose elements are classes whose types are unions of every type in the classes of the
 * original array. Example: `[Class<A>, Class<B | C>]` becomes `Class<A | B | C>[]`. */
export type ConsolidatedClasses<T extends Class<any>[]> = Class<
  TypesOfClasses<T>
>[]

type IntersectNever<N, A> = [N] extends [never] ? A : N & A

// TODO: Remove
interface A {
  a(): void
}
interface B {
  b(): void
}
interface C {
  c(): void
}

// type X = OwnAndParents<A, B | C>
type X = TypesOfClasses<[Class<A>, Class<B & C>]>
type Y = ConsolidatedClasses<[Class<A>, Class<B | C>]>

/** Transforms a list of distinct classes, such as `[Class<A, never>, Class<B, C>]` into an uniform
 * list of the form `Class<(A | B | C), never>[]`. Use it to generate an adequate value for `parents`.
 *
 * @see {@link ClassBuilder}
 * */
function consolidate<T extends Class<any>[]>(
  ...classes: T
): ConsolidatedClasses<T> {
  // WARNING: I claim this conversion works, but TypeScript will not help us with this.
  return (classes as unknown) as ConsolidatedClasses<T>
}

export class ClassBuilder {
  constructor(private name: string) {}

  withName(name: string) {
    return new ClassBuilder(name)
  }

  withType<T>(): ClassBuilder2<T> {
    return new ClassBuilder2(this.name, [])
  }

  withParents<T extends Class<any>[]>(
    ...parents: T
  ): ClassBuilder2<TypesOfClasses<T>> {
    return new ClassBuilder2(this.name, consolidate(...parents))
  }

  /** This function should only be used if TypeScript is not being used. Otherwise, call
   * `withType` first. */
  withLaws(validator: never): ClassBuilder2<never> {
    return new ClassBuilder2(this.name, [], validator)
  }

  build(): Class<never> {
    return new Class(this.name, [], all())
  }
}

export class ClassBuilder2<T> {
  constructor(
    private name: string,
    private parents: Class<T>[],
    private laws?: InstanceValidator<T>,
  ) {}

  withName(name: string) {
    return new ClassBuilder2(name, this.parents)
  }

  withParents<NewT extends Class<any>[]>(
    ...parents: NewT
  ): ClassBuilder2<T & TypesOfClasses<NewT>> {
    return new ClassBuilder2(this.name, consolidate(...parents))
  }

  withLaws(
    validator: [T] extends [never] ? never : InstanceValidator<T>,
  ): ClassBuilder2<T> {
    return new ClassBuilder2(this.name, this.parents, validator)
  }

  build(): Class<T> {
    return new Class(this.name, this.parents, this.laws)
  }
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
export class Class<T> {
  public readonly id: number

  constructor(
    public readonly name: string,
    public readonly parents: Class<T>[] = [],
    public readonly laws: InstanceValidator<T> = all(),
  ) {
    this.id = idCounter++
  }

  /**
   * Checks if something is an instance of this class.
   *
   * @param Constructor
   * @returns
   */
  validate(
    values: Generator<T>,
    options: ValidationOptions = {},
  ): ValidationResult {
    if (cache.contains(values, this)) {
      return MaybeError.success()
    }

    const result = MaybeError.foldConjoin([
      ...this.parents.map((parent) => parent.validate(values, options)),
      this.laws.check(values, options),
    ])

    cache.set(values, this)
    return result
  }

  equals(other: Class<any>) {
    return this.id === other.id
  }
}
