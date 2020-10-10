import { Class } from '../src/classes'
import { instance } from '../src/decorators'
import { Instance, isInstance } from '../src/instances'
import { all, obey } from '../src/validators'

interface Eq extends Instance {
  equals(other: this): boolean
}

interface Neq extends Instance {
  nequals(other: this): boolean
}

interface Show extends Instance {
  show(): void
}

const eq = new Class({
  laws: all(
    obey((instance: Eq) => {
      return instance.equals(instance)
    }),
  ),
})

const neq = new Class({
  laws: all(
    obey((instance: Neq) => {
      return !instance.nequals(instance)
    }),
  ),
})

const show = new Class({
  laws: all(
    obey((instance: Show) => {
      return instance.show() === undefined
    }),
  ),
})

test('Returns whether the value is an instance of the class', () => {
  @instance(eq)
  @instance(show)
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n
    }

    show() {}

    static generateData(x: number) {
      return new VNumber(x)
    }
  }

  const showNumber = new VNumber(6)

  expect(isInstance(showNumber, eq)).toBe(true)
  expect(isInstance(showNumber, show)).toBe(true)
  expect(isInstance(showNumber, neq)).toBe(false)
})
