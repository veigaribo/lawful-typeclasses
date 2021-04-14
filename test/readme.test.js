test('Readme examples work', () => {
  expect(() => {
    const {
      Class,
      all,
      instance,
      isInstance,
      obey,
      validate,
    } = require('../lib/index')

    const eq = new Class({
      name: 'Eq',
      laws: all(
        obey(function reflexivity(Instance, x) {
          return x.equals(x)
        }),
      ),
    })

    // our class is going to be an instance of Class
    const addable = new Class({
      // this is what I've decided to name my class
      // this option is not necessary, but it helps to improve error messages
      name: 'Addable',

      extends: [eq],
      // next, we define the properties we expect our instances to have.
      // we'll start out by using the `all` function to say that, in order to
      // be an Addable, the constructor must obey all of the following laws
      // (not just any)
      laws: all(
        // using named functions is not necessary, but it helps to improve error
        // messages as well
        // the first parameter is the instance constructor itself, the others are
        // random values of that constructor
        obey(function commutativity(Instance, x, y) {
          const a = x.add(y)
          const b = y.add(x)

          return a.equals(b)
        }),
        obey(function associativity(Instance, x, y, z) {
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
        // this is quite a trivial example, we just wrap the n.
        // in case you need more random values, just add them as parameters and they
        // will be provided
        return new Number(n)
      }
    }

    // will throw if anything goes bad.
    // new instances shall be instantiated using the returned constructor
    const VNumber = instance(addable)(Number)

    // will throw and Error if it fails
    validate(VNumber)

    const n = new VNumber(50)

    const isAddable = isInstance(n, addable) // true, because Numbers are addable
    expect(isAddable).toBe(true)
  }).not.toThrow()
})
