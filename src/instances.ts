import { Class, ClassInput } from './classes'
import { Generator } from './generators'
import { MaybeError } from './utils'
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
export function instance<T extends any[]>(
  clazz: Class<T>,
  values: Generator<ClassInput<T>>,
  options: ValidationOptions = {},
) {
  const result = clazz.validate(values, options)

  if (result.isError()) {
    throw new Error(
      result.conjoin(MaybeError.fail(`'${values.name}' is invalid.`)).value!,
    )
  }
}
