import { Class } from './classes'
import {
  InstanceConstructor,
  InstanceMetadata,
  KnownInstance,
  KnownInstanceConstructor,
} from './instances'
import { metadataKey } from './private'

/**
 * Declares a constructor to be an instance of the given class.
 * The validation is not done in the spot, you must use the `validate` procedure
 * to actually do it. That would usually happen as part of your application's
 * tests.
 *
 * @param theClass - The class that this is an instance of.
 * @returns A function that checks whether the given constructor is an instance of theClass
 * or not.
 *
 * @example
 * ```javascript
 * `@instance(semigroup)` // (this should not be a string)
 * class Addition {
 *  constructor(x) { this.x = x }
 *  add(y) { return new Addition(this.x + y.x) }
 * }
 * ```
 *
 * @example
 * ```
 * // if you cannot use decorators, just call it as a function
 * instance(semigroup)(Addition)
 * ```
 *
 * @see {@link validate}
 */
export function instance<T extends InstanceConstructor>(
  theClass: Class,
): (Constructor: T) => T & KnownInstanceConstructor {
  return function (Constructor: T): T & KnownInstanceConstructor {
    const existingMetadata = (Constructor as any)[metadataKey]

    const newMetadata = existingMetadata
      ? { validated: false, classes: [...existingMetadata.classes, theClass] }
      : { validated: false, classes: [theClass] }

    class NewClass extends Constructor implements KnownInstance {
      public [metadataKey]: InstanceMetadata
      public static [metadataKey]: InstanceMetadata

      constructor(...args: any[]) {
        super(...args)

        // insert the metadata into the values so isInstance may see it
        this[metadataKey] = newMetadata!
      }
    }

    // insert the metadata into the constructor so we may easily see it
    // in later invocations and append things if necessary
    NewClass[metadataKey] = newMetadata!

    return NewClass
  }
}
