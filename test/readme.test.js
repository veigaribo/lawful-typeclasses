test('readme examples work', () => {
  expect(() => {
    const {
      Class,
      continuous,
      discrete,
      obey,
      instance,
    } = require('../lib/index')

    const eq = new Class({
      name: 'Eq',
    }).withLaws(
      obey(function reflexivity(x) {
        return x.equals(x)
      }),
    )

    // our class is going to be an instance of Class
    const addable = new Class({
      // this is what I've decided to name my class
      // this option is not necessary, but it helps to improve error messages
      name: 'Addable',
      extends: [eq],
    })
      // next, we define the properties we expect our instances to have.
      // we'll start out by using the `all` function to say that, in order to
      // be an Addable, the constructor must obey all of the following laws
      // (not just any)
      .withLaws(
        // using named functions is not necessary, but it helps to improve error
        // messages as well
        // the first parameter is the instance constructor itself, the others are
        // random values of that constructor
        obey(function commutativity(x, y) {
          const a = x.add(y)
          const b = y.add(x)
          return a.equals(b)
        }),
        obey(function associativity(x, y, z) {
          const a = x.add(y.add(z))
          const b = x.add(y).add(z)
          return a.equals(b)
        }),
      )

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
    }

    // you may ask for as many parameters as you want, and to each one will be
    // assigned a random number between 0 and 1 (inclusive)
    // from these numbers you may generate an instance of your constructor
    const gen0 = continuous('Number (continuous)', (n) => new Number(n))

    // note that, to increase the likelihood of catching edge cases, sometimes the
    // generated numbers will be all 0s or 1s

    // testing values will be sampled from the given array
    const gen1 = discrete('Number (discrete)', [
      new Number(0),
      new Number(1),
      new Number(3),
    ])

    // this method would be more useful if we had a finite number of possible
    // values, which is not the case

    // will throw an Error if it fails
    instance(addable, gen0)
    instance(addable, gen1)

    instance(addable, gen0, { sampleSize: 10 })
    instance(addable, gen1, { sampleSize: 10 })
  }).not.toThrow()
})
