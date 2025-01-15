import { Class, consolidate } from '../src/classes'
import { all, obey } from '../src/validators'

test('each class will have its own id', () => {
  const a = new Class({})
  const b = new Class({})
  const c = new Class({})

  expect(a.id).not.toEqual(b.id)
  expect(a.id).not.toEqual(c.id)
  expect(b.id).not.toEqual(c.id)
})

test('more complex `extends` values type-check fine', () => {
  interface A {
    a(): void
  }
  interface B {
    b(): void
  }
  interface C {
    c(): void
  }

  let a = new Class<[A]>()
  let b = new Class<[B]>()
  let c = new Class<[C]>()

  let ab = new Class({
    extends: consolidate(a, b),
  }).withLaws(all(obey((x) => (x.a(), x.b(), true))))

  consolidate(ab, c)

  new Class({
    extends: consolidate(ab, c),
  }).withLaws(all(obey((x) => (x.a(), x.b(), x.c(), true))))
})
