import { Class } from './classes'
import {
  InstanceConstructor,
  InstanceMetadata,
  KnownInstance,
  KnownInstanceConstructor,
} from './instances'
import { metadataKey } from './private'
import { MaybeError } from './utils'

/**
 * Declares a constructor to be an instance of the given class.
 * If the validation fails, an error is thrown.
 *
 * @param theClass - The class that this is an instance of.
 * @returns A function that checks whether the given constructor is an instance of theClass
 * or not.
 * @throws If the class validations fail.
 *
 * @example
 * ```javascript
 * // this should not be a string, JSDoc's fault
 * `@instance(semigroup)`
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
 */
export function instance<T extends InstanceConstructor>(
  theClass: Class,
): (Constructor: T) => KnownInstanceConstructor {
  return function (Constructor: T): KnownInstanceConstructor {
    const result = theClass.validate(Constructor)

    if (result.isSuccess()) {
      const existingMetadata = (Constructor as any)[metadataKey]

      const newIds = [
        theClass.id,
        ...theClass.parents.map((parent) => parent.id),
      ]

      const newMetadata = existingMetadata
        ? { classIds: [...existingMetadata.classIds, ...newIds] }
        : { classIds: [...newIds] }

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

    throw new Error(
      result.conjoin(
        MaybeError.fail(
          `${Constructor.name} is not an instance of ${theClass.name}.`,
        ),
      ).value!,
    )
  }
}
