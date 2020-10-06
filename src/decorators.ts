import { Class } from './classes'
import { InstanceConstructor } from './instances'
import { Right } from './utils'

export function instance<T extends InstanceConstructor>(
  theClass: Class,
): (constructor: T) => T {
  return function (constructor: T): T {
    const result = theClass.validate(constructor)

    if (result instanceof Right) {
      return constructor
    }

    throw new Error(
      `${constructor.name} is not an instance of ${theClass.name}.\n\n${result.value}`,
    )
  }
}
