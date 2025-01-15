import { Class } from './classes'
import { Generator } from './generators'

type AnyGenerator = Generator<any>
type AnyClass = Class<any>

class Cache {
  public readonly map: Map<AnyGenerator, AnyClass[]>

  constructor() {
    this.map = new Map()
  }

  set(Constructor: AnyGenerator, clazz: AnyClass): AnyClass[] {
    const existing = this.get(Constructor)
    const newClasses = existing ? [...existing, clazz] : [clazz]

    this.map.set(Constructor, newClasses)

    return newClasses
  }

  get(Constructor: AnyGenerator): AnyClass[] | undefined {
    return this.map.get(Constructor)
  }

  contains(Constructor: AnyGenerator, clazz: AnyClass) {
    const existing = this.get(Constructor)
    return existing && existing.some((clazz2) => clazz2.equals(clazz))
  }
}

export const cache = new Cache()
