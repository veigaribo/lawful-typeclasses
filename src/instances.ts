export interface InstanceConstructor extends Function {
  // @ts-ignore
  new (...args: any[]): InstanceType<this>
  generateData(...xs: number[]): InstanceType<this>
}

export interface Instance {}
