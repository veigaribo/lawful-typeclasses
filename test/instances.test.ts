import { Class } from '../src/classes'
import { continuous, discrete } from '../src/generators'
import { instance } from '../src/instances'
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
    obey((_Instance, instance: Eq) => {
      return instance.equals(instance)
    }),
  ),
})

const neq = new Class({
  laws: all(
    obey((_Instance, instance: Neq) => {
      return !instance.nequals(instance)
    }),
  ),
})

const show = new Class({
  laws: all(
    obey((_Instance, instance: Show) => {
      return instance.show() === undefined
    }),
  ),
})

const showEq = new Class({
  extends: [eq, show],
})

test('validate will throw if validation fails', () => {
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n + 1
    }

    show() {}
  }

  const generateVNumber = continuous((x) => new VNumber(x))

  expect(() => {
    instance(VNumber, eq, generateVNumber)
  }).toThrow()
})

test('validate will not throw if validation succeeds', () => {
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n
    }

    show() {}
  }

  const generateVNumber = continuous((x) => new VNumber(x))

  expect(() => {
    instance(VNumber, eq, generateVNumber)
    instance(VNumber, show, generateVNumber)
  }).not.toThrow()
})

test('validate will throw if a parent class fails', () => {
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n + 1
    }

    show() {}
  }

  const generateVNumber = continuous((x) => new VNumber(x))

  expect(() => {
    instance(VNumber, showEq, generateVNumber)
  }).toThrow()
})

test('validate will not throw if no parent class fails', () => {
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n
    }

    show() {}
  }

  const generateVNumber = continuous((x) => new VNumber(x))

  expect(() => {
    instance(VNumber, showEq, generateVNumber)
  }).not.toThrow()
})

test('validate will not check any single class more than once', () => {
  const showSpy = jest.spyOn(show.laws, 'check')
  const eqSpy = jest.spyOn(eq.laws, 'check')

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

  const generateVNumber = discrete([
    new VNumber(Math.PI),
    new VNumber(Math.E),
    new VNumber(Math.SQRT2),
  ])

  instance(VNumber, showEq, generateVNumber)
  instance(VNumber, show, generateVNumber)
  instance(VNumber, eq, generateVNumber)

  expect(showSpy).toBeCalledTimes(1)
  expect(eqSpy).toBeCalledTimes(1)
})
