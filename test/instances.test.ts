import { Class } from '../src/classes'
import { instance } from '../src/decorators'
import { isInstance, validate } from '../src/instances'
import { all, obey } from '../src/validators'

interface Eq {
  equals(other: this): boolean
}

interface Neq {
  nequals(other: this): boolean
}

interface Show {
  show(): void
}

const eq = new Class({
  laws: all(
    obey((Instance, instance: Eq) => {
      return instance.equals(instance)
    }),
  ),
})

const neq = new Class({
  laws: all(
    obey((Instance, instance: Neq) => {
      return !instance.nequals(instance)
    }),
  ),
})

const show = new Class({
  laws: all(
    obey((Instance, instance: Show) => {
      return instance.show() === undefined
    }),
  ),
})

const showEq = new Class({
  extends: [eq, show],
})

test('isInstance returns whether the value is an instance of the class', () => {
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

test('isInstance returns false if the value is not of an instance of anything', () => {
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

  expect(isInstance(showNumber, eq)).toBe(false)
  expect(isInstance(showNumber, show)).toBe(false)
  expect(isInstance(showNumber, neq)).toBe(false)
})

test('isInstance works for inherited constructors', () => {
  @instance(show)
  class Showable implements Show {
    constructor(public readonly n: number) {}

    show() {}

    static generateData(x: number) {
      return new Showable(x)
    }
  }

  @instance(eq)
  class Eqable extends Showable {
    equals(another: Eqable) {
      return this.n === another.n
    }

    static generateData(x: number) {
      return new Eqable(x)
    }
  }

  const eqable = new Eqable(20)
  const showable = new Showable(66)

  expect(isInstance(eqable, show)).toBe(true)
  expect(isInstance(eqable, eq)).toBe(true)
  expect(isInstance(eqable, neq)).toBe(false)

  expect(isInstance(showable, show)).toBe(true)
  expect(isInstance(showable, eq)).toBe(false)
  expect(isInstance(showable, neq)).toBe(false)
})

interface Semigroup extends Eq {
  add(y: Semigroup): this
}

const semigroup = new Class({
  extends: [eq],
  laws: all(
    obey((Instance, x: Semigroup, y: Semigroup, z: Semigroup) => {
      return x
        .add(y)
        .add(z)
        .equals(x.add(y.add(z)))
    }),
  ),
})

test('isInstance works for inherited classes', () => {
  @instance(semigroup)
  class NAddition {
    constructor(public readonly n: number) {}

    equals(another: NAddition) {
      return this.n === another.n
    }

    add(y: NAddition) {
      return new NAddition(this.n + y.n)
    }

    static generateData(x: number) {
      return new NAddition(x)
    }
  }

  const nadd = new NAddition(20)

  expect(isInstance(nadd, semigroup)).toBe(true)
  expect(isInstance(nadd, eq)).toBe(true)
  expect(isInstance(nadd, neq)).toBe(false)
})

test('validate will throw if validation fails', () => {
  @instance(eq)
  @instance(show)
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n + 1
    }

    show() {}

    static generateData(x: number) {
      return new VNumber(x)
    }
  }

  expect(() => {
    validate(VNumber)
  }).toThrow()
})

test('validate will not throw if validation succeeds', () => {
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

  expect(() => {
    validate(VNumber)
  }).not.toThrow()
})

test('validate will throw if a parent class fails', () => {
  @instance(showEq)
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n + 1
    }

    show() {}

    static generateData(x: number) {
      return new VNumber(x)
    }
  }

  expect(() => {
    validate(VNumber)
  }).toThrow()
})

test('validate will not throw if no parent class fails', () => {
  @instance(showEq)
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

  expect(() => {
    validate(VNumber)
  }).not.toThrow()
})

test('validate throw if the value is not an instance of anything', () => {
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

  expect(() => {
    validate(VNumber)
  }).toThrow()
})

test('validate will not check any one class more than once', () => {
  const showSpy = jest.spyOn(show.laws, 'check')
  const eqSpy = jest.spyOn(eq.laws, 'check')

  @instance(showEq)
  @instance(show)
  @instance(eq)
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

  validate(VNumber)

  expect(showSpy).toBeCalledTimes(1)
  expect(eqSpy).toBeCalledTimes(1)
})
