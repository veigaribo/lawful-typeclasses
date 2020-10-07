test('Readme examples work', () => {
  expect(() => {
    const { Class, all, instance, obey } = require('../lib/index')

    const eq = new Class({
      name: 'Eq',
      laws: all(
        obey((x) => {
          // we expect comparison to oneself to be true
          return x.equals(x)
        }),
      ),
    })

    // our class is going to be an instance of Class
    const addable = new Class({
      // this is what I've decided to name my class
      // this option is not necessary, but it helps in case something goes
      // wrong
      name: 'Addable',

      extends: [eq],
      // next, we define the properties we expect our instances to have
      // we'll start out by using the `all` function to say that, in order to
      // be an Addable, the class must obey all of the following laws (not any)
      laws: all(
        obey((x, y) => {
          // we expect addition to be commutative
          const a = x.add(y)
          const b = y.add(x)

          return a.equals(b)
        }),
        obey((x, y, z) => {
          // we expect addition to be associative
          const a = x.add(y.add(z))
          const b = x.add(y).add(z)

          return a.equals(b)
        }),
      ),
    })

    class Number {
      constructor(n) {
        this.n = n
      }

      equals(other) {
        return this.n === other.n
      }

      add(other) {
        return new Number(this.n + other.n)
      }

      static generateData(n) {
        // this is quite a trivial example, we just wrap the n
        return new Number(n)
      }
    }

    instance(addable)(Number)
  }).not.toThrow()
})
