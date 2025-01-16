import { expectTypeOf } from 'expect-type'
import { Class, ClassBuilder } from '../src/classes'
import { all, obey } from '../src/validators'

test('each class will have its own id', () => {
  const a = new Class('A')
  const b = new Class('B')
  const c = new Class('C')

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

  let a = new Class<A>('A')
  let b = new Class<B>('B')
  let c = new ClassBuilder('C').withType<C>().build()

  let ab = new ClassBuilder('AB')
    .withParents(a, b)
    .withLaws(all(obey((x) => (x.a(), x.b(), true))))
    .build()

  expectTypeOf(ab).toEqualTypeOf<Class<A & B>>()

  expectTypeOf(
    new ClassBuilder('ABC')
      .withParents(ab, c)
      .withLaws(all(obey((x) => (x.a(), x.b(), x.c(), true))))
      .build(),
  ).toEqualTypeOf<Class<A & B & C>>()
})
