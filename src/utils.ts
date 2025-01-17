export function arrayWithLength(n: number): Array<number> {
  return new Array(n).fill(0)
}

export class Maybe<T> {
  public readonly value: T | null

  constructor(value: T | null) {
    this.value = value
  }

  map<U>(f: (x: T) => U): Maybe<U> {
    if (this.value === null) {
      return new Maybe<U>(null)
    }

    return new Maybe(f(this.value))
  }
}

export class MaybeError extends Maybe<string> {
  // error + error -> error
  // error + not error -> error
  // not error + not error -> not error
  and(other: MaybeError) {
    if (other.isError()) {
      if (this.isError()) {
        return new MaybeError(MaybeError.appendText(this.value!, other.value!))
      } else {
        return other
      }
    } else {
      return this
    }
  }

  // error + error -> error
  // error + not error -> not error
  // not error + not error -> not error
  or(other: MaybeError) {
    if (other.isError()) {
      if (this.isError()) {
        return new MaybeError(MaybeError.appendText(this.value!, other.value!))
      } else {
        return this
      }
    } else {
      return other
    }
  }

  isSuccess() {
    return this.value === null
  }

  isError() {
    return !this.isSuccess()
  }

  static appendText(a: string, b: string) {
    return `${b}\n\n${a}`.trimEnd()
  }

  static success() {
    return new MaybeError(null)
  }

  static fail(text: string) {
    return new MaybeError(text)
  }

  static foldAnd(maybeErrors: MaybeError[]) {
    return maybeErrors.reduce((acc, res) => res.and(acc), MaybeError.success())
  }

  static foldOr(maybeErrors: MaybeError[]) {
    return maybeErrors.reduce((acc, res) => res.or(acc), MaybeError.fail(''))
  }
}
