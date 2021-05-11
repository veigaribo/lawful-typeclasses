export interface Constructor {
  new (...args: any[]): any
}

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
  conjoin(other: MaybeError) {
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
  disjoin(other: MaybeError) {
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

  // not very functional
  isSuccess() {
    return this.value === null
  }

  // not very functional
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

  static foldConjoin(maybeErrors: MaybeError[]) {
    return maybeErrors.reduce(
      (acc, res) => res.conjoin(acc),
      MaybeError.success(),
    )
  }

  static foldDisjoin(maybeErrors: MaybeError[]) {
    return maybeErrors.reduce(
      (acc, res) => res.disjoin(acc),
      MaybeError.fail(''),
    )
  }
}
