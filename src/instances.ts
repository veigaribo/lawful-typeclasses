import { Class } from './classes'
import { Generator } from './generators'
import { Constructor, MaybeError } from './utils'
import { ValidationOptions } from './validators'

/**
 * Validates if a constructor is an instance of a given class.
 *
 * @param Constructor JavaScript class to be tested
 * @param clazz Class that the Constructor should conform to
 * @param values Generator to generate testing values
 * @param options
 *
 * @throws If the validation fails.
 *
 * @example
 * ```javascript
 * const show = new Class({
 *   // ...
 * });
 *
 * interface Showable {}
 *
 * class Show implements Showable {
 *   // ...
 * }
 *
 * // will throw if it fails
 * instance(Show, show, discrete([new Show()]));
 * ```
 *
 * @see {@link discrete}
 */
export function instance<T extends Constructor>(
  Constructor: T,
  clazz: Class,
  values: Generator<T>,
  options: ValidationOptions = {},
) {
  const result = clazz.validate(Constructor, values, options)

  if (result.isError()) {
    throw new Error(
      result.conjoin(MaybeError.fail(`${Constructor.name} is invalid.`)).value!,
    )
  }
}
