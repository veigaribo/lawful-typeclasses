import { Class } from './classes'
import { ConstructorValuesGenerator } from './generators'
import { Constructor, MaybeError } from './utils'
import { ValidationOptions } from './validators'

/**
 * Validates if a constructor is an instance of a given class.
 *
 * @param Constructor
 * @param clazz
 *
 * @throws If the validation fails.
 *
 * @example
 * ```javascript
 * const show = new Class({
 *   // ...
 * });
 *
 * class Showable implements Show {
 *   // ...
 * }
 *
 * // will throw if it fails
 * instance(Showable, show);
 * ```
 */
export function instance<T extends Constructor>(
  Constructor: T,
  clazz: Class,
  values: ConstructorValuesGenerator<T>,
  options: ValidationOptions = {},
) {
  const result = clazz.validate(Constructor, values, options)

  if (result.isError()) {
    throw new Error(
      result.conjoin(MaybeError.fail(`${Constructor.name} is invalid.`)).value!,
    )
  }
}
