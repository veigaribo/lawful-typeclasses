import { Class } from './classes'
import { metadataKey, Metadatable } from './private'
import { MaybeError } from './utils'

export interface InstanceMetadata {
  classes: Class[]
}

/**
 * An InstanceConstructor must implement a `generateData` method, that shall
 * generate random instance values based on any amount of random numbers.
 *
 * Those random instances will be used to check against the class laws.
 */
export interface InstanceConstructor extends Function {
  new (...args: any[]): any
  generateData(...xs: number[]): InstanceType<this>
}

export interface KnownInstanceConstructor
  extends InstanceConstructor,
    Metadatable<InstanceMetadata> {
  new (...args: any[]): KnownInstance
}

export interface KnownInstance extends Metadatable<InstanceMetadata> {}

/**
 * Given a value, return if that is a value of an instance of the given class.
 *
 * @param value
 * @param theClass
 * @returns
 *
 * @example
 * ```javascript
 * const show = new Class({
 *   // ...
 * });
 *
 * `@instance(show)` // (this should not be a string)
 * class Showable implements Show {
 *   // ...
 * }
 *
 * const showable = new Showable();
 *
 * // true
 * isInstance(showable, show);
 * ```
 */
export function isInstance(value: any, theClass: Class): boolean {
  const metadata = value[metadataKey] as InstanceMetadata | null

  if (!metadata) {
    return false
  }

  const classes = metadata.classes

  return classes.some((candidateClass) => {
    // true if the candidate class is the class we're looking for or if one of
    // it's parents is
    return (
      candidateClass.equals(theClass) ||
      candidateClass.parents.some((parent) => parent.equals(theClass))
    )
  })
}

/**
 * Effectively validates if something is an instance of what it claims to be.
 *
 * This procedure will traverse through every class the instance should conform
 * to and check if the tests pass.
 *
 * This was made to be executed during your tests, not during runtime, although
 * there is nothing keeping you from doing it.
 *
 * @param MaybeConstructor
 *
 * @throws If the validation fails.
 * @throws If the given value isn't an instance of anything.
 *
 * @example
 * ```javascript
 * const show = new Class({
 *   // ...
 * });
 *
 * `@instance(show)` // (this should not be a string)
 * class Showable implements Show {
 *   // ...
 * }
 *
 * // will throw if it fails
 * validate(Showable);
 * ```
 */
export function validate(MaybeConstructor: Function) {
  const metadata = (MaybeConstructor as KnownInstanceConstructor)[
    metadataKey
  ] as InstanceMetadata | null

  if (!metadata) {
    throw new Error(
      MaybeError.fail(
        `${MaybeConstructor.name} is not an instance of anything.`,
      ).value!,
    )
  }

  const Constructor = MaybeConstructor as KnownInstanceConstructor

  const validatedClassIds: number[] = []
  const results: MaybeError[] = []

  // recursively validate every class only once
  const work = (clazz: Class): void => {
    // if the class has been seen, do nothing
    if (validatedClassIds.includes(clazz.id)) {
      return
    }

    results.push(clazz.validate(Constructor))
    validatedClassIds.push(clazz.id)

    // repeat for every parent
    for (const parent of clazz.parents) {
      work(parent)
    }
  }

  for (const clazz of metadata.classes) {
    work(clazz)
  }

  const maybeError = MaybeError.foldConjoin(results)

  if (maybeError.isError()) {
    throw new Error(
      maybeError.conjoin(
        MaybeError.fail(`${Constructor.name} is invalid.`),
      ).value!,
    )
  }
}
