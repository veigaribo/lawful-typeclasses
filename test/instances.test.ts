import { expectTypeOf } from 'expect-type'
import { ClassBuilder } from '../src/classes'
import type { Class } from '../src/classes'
import { continuous, discrete } from '../src/generators'
import { instance } from '../src/instances'
import { obey } from '../src/validators'

// Eq

interface Eq {
  equals(other: this): boolean
}

const eqLaw = obey((instance: Eq) => {
  return instance.equals(instance)
})

const eq = new ClassBuilder('Eq')
  .withType<Eq>()
  .withParents()
  .withLaws(eqLaw)
  .build()

expectTypeOf(eq).toEqualTypeOf<Class<Eq>>()

// Show

interface Show {
  show(): void
}

const showLaw = obey((instance: Show) => {
  return instance.show() === undefined
})

const show = new ClassBuilder('Show').withType<Show>().withLaws(showLaw).build()
expectTypeOf(show).toEqualTypeOf<Class<Show>>()

// ShowEq

const showEq = new ClassBuilder('ShowEq').withParents(eq, show).build()
expectTypeOf(showEq).toEqualTypeOf<Class<Show & Eq>>()

//

test('validate will throw if validation fails', () => {
  class VNumber implements Eq {
    constructor(public readonly n: number) {}

    equals(another: VNumber) {
      return this.n === another.n + 1
    }

    show() {}
  }

  const generateVNumber = continuous('VNumber', (x) => new VNumber(x))

  expect(() => {
    instance(eq, generateVNumber)
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

  const generateVNumber = continuous('VNumber', (x) => new VNumber(x))

  expect(() => {
    instance(eq, generateVNumber)
    instance(show, generateVNumber)
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

  const generateVNumber = continuous('VNumber', (x) => new VNumber(x))

  expect(() => {
    instance(showEq, generateVNumber)
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

  const generateVNumber = continuous('VNumber', (x) => new VNumber(x))

  expect(() => {
    instance(showEq, generateVNumber)
  }).not.toThrow()
})

test('validate will not check any single class more than once', () => {
  const showSpy = jest.spyOn(showLaw, 'check')
  const eqSpy = jest.spyOn(eqLaw, 'check')

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

  const generateVNumber = discrete('VNumber', [
    new VNumber(Math.PI),
    new VNumber(Math.E),
    new VNumber(Math.SQRT2),
  ])

  instance(showEq, generateVNumber)
  instance(show, generateVNumber)
  instance(eq, generateVNumber)

  expect(showSpy).toBeCalledTimes(1)
  expect(eqSpy).toBeCalledTimes(1)
})
