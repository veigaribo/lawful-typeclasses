/**
 * An InstanceConstructor must implement a `generateData` method, that shall
 * generate random instance values based on any amount of random numbers.
 *
 * Those random instances will be used to check against the class laws.
 */
export interface InstanceConstructor extends Function {
  // @ts-ignore
  new (...args: any[]): InstanceType<this>
  generateData(...xs: number[]): InstanceType<this>
}

export interface Instance {}
