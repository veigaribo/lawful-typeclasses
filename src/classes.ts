import { InstanceConstructor } from './instances'
import { MaybeError } from './utils'
import { all, ValidationResult, Validator } from './validators'

type Laws = Validator<InstanceConstructor>

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
 *  laws: all(append, commutativity, associativity, identity)
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
   * Checks if something is an instance of this class, not taking parents into
   * account.
   *
   * This is probably not what you're looking for: If you want to properly check
   * if something is an instance of a class, check out the `validate` procedure.
   *
   * @param instance
   * @returns
   *
   * @see {@link validate}
   */
  validate(instance: InstanceConstructor): ValidationResult {
    return this.laws.check(instance)
  }

  equals(other: Class) {
    return this.id === other.id
  }
}
