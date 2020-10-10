import { Class } from './classes'
import { InstanceConstructor } from './instances'
import { metadataKey } from './private'
import { Right } from './utils'

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
): (constructor: T) => T {
  return function (constructor: T): T {
    const result = theClass.validate(constructor)

    if (result instanceof Right) {
      if (constructor[metadataKey]) {
        constructor[metadataKey]!.classIds.push(theClass.id)
      } else {
        constructor[metadataKey] = { classIds: [theClass.id] }
      }

      return constructor
    }

    throw new Error(
      `${constructor.name} is not an instance of ${theClass.name}.\n\n${result.value}`,
    )
  }
}
