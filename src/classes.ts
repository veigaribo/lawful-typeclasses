import { cache } from './cache'
import { Generator } from './generators'
import { Constructor, MaybeError } from './utils'
import {
  all,
  ValidationResult,
  InstanceValidator,
  ValidationOptions,
} from './validators'

type Laws = InstanceValidator<Constructor>

export interface ClassOptions {
  /** The name will be used to improve error messages. */
  name?: string
  /** A list of classes that are prerequisites to this one. */
  extends?: Class[]
  /** A validator that will check if a constructor is an instance of this class. */
  laws?: Laws
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
export class Class {
  public readonly parents: Class[]
  public readonly laws: Laws
  public readonly name: string
  public readonly id: number

  constructor(options: ClassOptions) {
    const { extends: parents = [], laws = all(), name } = options

    this.parents = parents
    this.laws = laws
    this.name = name || 'Unnamed'
    this.id = idCounter++
  }

  /**
   * Checks if something is an instance of this class.
   *
   * @param Constructor
   * @returns
   */
  validate<T extends Constructor>(
    Constructor: T,
    values: Generator<T>,
    options: ValidationOptions = {},
  ): ValidationResult {
    if (cache.contains(Constructor, this)) {
      return MaybeError.success()
    }

    const result = MaybeError.foldConjoin([
      ...this.parents.map((parent) =>
        parent.validate(Constructor, values, options),
      ),
      this.laws.check(Constructor, values, options),
    ])

    cache.set(Constructor, this)
    return result
  }

  equals(other: Class) {
    return this.id === other.id
  }
}
