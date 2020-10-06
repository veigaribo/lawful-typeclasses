export function arrayWithLength(n: number): Array<number> {
  return new Array(n).fill(0)
}

export abstract class Either<L, R> {
  protected left: L | null = null
  protected right: R | null = null

  rightMap(f: (right: R) => R): Either<L, R> {
    if (this.right !== null) {
      return new Right(f(this.right))
    } else {
      return this
    }
  }

  // kinda hard to work without this
  get value() {
    return this.left || this.right
  }
}

export class Left<L, R> extends Either<L, R> {
  constructor(value: L) {
    super()
    this.left = value
  }
}

export class Right<L, R> extends Either<L, R> {
  constructor(value: R) {
    super()
    this.right = value
  }
}
