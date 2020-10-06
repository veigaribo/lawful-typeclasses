import { Instance, InstanceConstructor } from './instances'
import { Left, Right } from './utils'
import { all, obey, ValidationResult, Validator } from './validators'

type Laws = Validator<Instance>

export interface ClassOptions {
  name?: string
  extends?: Class[]
  laws?: Laws
}

export class Class {
  public readonly parents: Class[]
  public readonly laws: Laws
  public readonly name: string

  constructor(options: ClassOptions) {
    const { extends: parents = [], laws = all(), name } = options

    this.parents = parents
    this.laws = laws
    this.name = name || 'Unnamed'
  }

  validate(instance: InstanceConstructor): ValidationResult {
    const parentLefts = this.parents
      .map((parent) => parent.validate(instance))
      .filter((result) => result instanceof Left)

    if (parentLefts.length) {
      return new Left(
        `Class ${instance.name} fails the prerequisites to be a ${
          this.name
        }\n\n${parentLefts.map((left) => left.value).join('\n\n')}`,
      )
    }

    return this.laws.check(instance)
  }
}
