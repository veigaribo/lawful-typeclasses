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
/**
 * Uses contravariance to convert an union type like `A | B | C` into an intersection type like
 * `A & B & C`.
 */
export type UnionToIntersection<U> = (
  U extends any ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

/**
 * Converts from e.g. `[A, B, C]` to `(A | B | C)[]`. `TypesOfClasses` doesn't handle tuples
 * well without this.
 */
export type ArrayFromTuple<T extends any[]> = T extends (infer U)[]
  ? U[]
  : never

/**
 * Given the type of an array (or tuple) of classes over different types, returns the intersection
 * of every inner type. Example: `[Class<A>, Class<B & C>]` becomes `A & B & C`
 */
export type TypesOfClasses<T extends Class<any>[]> = ArrayFromTuple<
  T
> extends Class<infer U>[]
  ? UnionToIntersection<U>
  : never

/**
 * Given the type of an array (or tuple) of classes over different types, create the type of a new
 * array whose elements are classes whose types are intersections of every type in the classes of
 * the original array. Example: `[Class<A>, Class<B & C>]` becomes `Class<A & B & C>[]`.
 */
type ConsolidatedClasses<T extends Class<any>[]> = Class<TypesOfClasses<T>>[]

/**
 * Transforms a list of distinct classes, such as `[Class<A>, Class<B & C>]` into an uniform
 * list of the form `Class<A & B & C>[]`. Use it to generate an adequate value for `parents`.
 * Do note that the resulting type will only be subtype of the input in contravariant position.
 */
function consolidate<T extends Class<any>[]>(
  ...classes: T
): ConsolidatedClasses<T> {
  // WARNING: I claim this conversion works, but TypeScript will not help us with this.
  return (classes as unknown) as ConsolidatedClasses<T>
}

/**
 * Used to build a new Class. The builder pattern is used to allow better type inference than
 * would be possible with a simple options object.
 *
 * You should specify a name when constructing the builder, then specify a type for your class
 * to be defined over via `withType<T>()`, unless you are not using static typing, in which case
 * you can ignore it; then, set the parent classes via `withParents(parent1, parent2...)`, if
 * there are any; set the validator via `withLaws(obey(...))`; lastly, obtain a Class with
 * `.build()`. If your code is type-checked, you should not be able to invoke `withLaws` before
 * both `withType` and `withParents`, because they are used to determine the type the class is
 * defined over, which `withLaws` must know about.
 */
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

  /**
   * This function should only be used if static typing is not being used. Otherwise, call
   * `withType` and/or `withParents` first. */
  withLaws(validator: never): ClassBuilder2<never> {
    return new ClassBuilder2(this.name, [], validator)
  }

  build(): Class<never> {
    return new Class(this.name, [], all())
  }
}

/**
 * The second step of building a class: When the underlying type has been defined, at least in
 * part. This is returned by some methods in `ClassBuilder`; you should not need to interact
 * with it directly.
 */
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
 * ```typescript
 * // Using the constructor (simpler if not using static typing):
 * const monoid = new Class(
 *   'Monoid',
 *   [eq],
 *   all(append, associativity, identity),
 * });
 *
 * // Using the builder (better inference if using static typing):
 * const monoid = new ClassBuilder('Monoid')
 *   .withType<Monoid>()
 *   .withParents(eq)
 *   .withLaws(all(append, associativity, identity))
 *   .build();
 * ```
 *
 * @see {@link ClassBuilder}
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
   * @param values
   * @param options
   * @returns
   */
  validate(
    values: Generator<T>,
    options: ValidationOptions = {},
  ): ValidationResult {
    if (cache.contains(values, this)) {
      return MaybeError.success()
    }

    const result = MaybeError.foldAnd([
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
