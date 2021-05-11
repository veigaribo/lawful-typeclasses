import { Class } from './classes'
import { Constructor } from './utils'

class Cache {
  public readonly map: Map<Constructor, Class[]>

  constructor() {
    this.map = new Map()
  }

  set(Constructor: Constructor, clazz: Class): Class[] {
    const existing = this.get(Constructor)

    const newClasses = existing ? [...existing, clazz] : [clazz]

    this.map.set(Constructor, newClasses)

    return newClasses
  }

  get(Constructor: Constructor): Class[] | undefined {
    return this.map.get(Constructor)
  }

  contains(Constructor: Constructor, clazz: Class) {
    const existing = this.get(Constructor)

    return existing && existing.some((clazz2) => clazz2.equals(clazz))
  }
}

export const cache = new Cache()
