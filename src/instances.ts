import { Class } from './classes'
import { metadataKey, Metadatable } from './private'

export interface InstanceMetadata {
  classIds: number[]
}

/**
 * An InstanceConstructor must implement a `generateData` method, that shall
 * generate random instance values based on any amount of random numbers.
 *
 * Those random instances will be used to check against the class laws.
 */
export interface InstanceConstructor
  extends Function,
    Metadatable<InstanceMetadata> {
  // @ts-ignore
  new (...args: any[]): InstanceType<this>
  generateData(...xs: number[]): InstanceType<this>
}

export interface Instance {}

export function isInstance(value: Instance, theClass: Class) {
  const metadata = (value.constructor as InstanceConstructor)[metadataKey]
    ?.classIds

  return !!metadata && metadata.includes(theClass.id)
}
