import { Class } from '../src/classes'
import { instance } from '../src/decorators'
import { InstanceConstructor, KnownInstanceConstructor } from '../src/instances'
import { metadataKey } from '../src/private'
import { all, obey } from '../src/validators'

interface Eq {
  equals(other: this): boolean
}

const eq = new Class({
  laws: all(
    obey((instance: Eq) => {
      return instance.equals(instance)
    }),
  ),
})

test('instance will throw if validation fails', () => {
  expect(() => {
    @instance(eq)
    class VNumber implements Eq {
      constructor(public readonly n: number) {}

      equals(another: VNumber) {
        return this.n !== another.n
      }

      static generateData(x: number) {
        return new VNumber(x)
      }
    }
  }).toThrow()
})

test('instance will mark if validation succeeds', () => {
  expect(() => {
    @instance(eq)
    class VNumber implements Eq {
      constructor(public readonly n: number) {}

      equals(another: VNumber) {
        return this.n === another.n
      }

      static generateData(x: number) {
        return new VNumber(x)
      }
    }

    const n = new VNumber(Math.PI)
    expect(n instanceof VNumber).toBe(true)

    expect((VNumber as KnownInstanceConstructor)[metadataKey]).toMatchObject({
      classIds: [eq.id],
    })
  }).not.toThrow()
})
