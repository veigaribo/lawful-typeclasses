import { Class } from '../src/classes'

test("Each class will have it's own id", () => {
  const a = new Class({})
  const b = new Class({})
  const c = new Class({})

  expect(a.id).not.toEqual(b.id)
  expect(a.id).not.toEqual(c.id)
  expect(b.id).not.toEqual(c.id)
})
