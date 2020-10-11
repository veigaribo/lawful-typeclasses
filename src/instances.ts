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
export interface InstanceConstructor extends Function {
  new (...args: any[]): any
  generateData(...xs: number[]): InstanceType<this>
}

export interface KnownInstanceConstructor
  extends InstanceConstructor,
    Metadatable<InstanceMetadata> {
  new (...args: any[]): KnownInstance
}

export interface KnownInstance extends Metadatable<InstanceMetadata> {}

export function isInstance(value: KnownInstance, theClass: Class) {
  const metadata = value[metadataKey]?.classIds

  return !!metadata && metadata.includes(theClass.id)
}
