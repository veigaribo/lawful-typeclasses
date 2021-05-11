# Lawful Type Classes

`lawful-typeclasses` is a library designed to provide a way of asserting
the behavior of your JavaScript classes.

"Lawful" here refers to a characteristic of [principled type classes](https://degoes.net/articles/principled-typeclasses).

## What it does

This library allows you to define two things: classes and instances. Perhaps
a bit confusedly, classes are JavaScript objects and instances are
JavaScript classes.

We'll be referring to the JavaScript classes that implement the behavior of
a type class (and are thus _instances_ of that class) as _constructors_ and
to the instances of those JavaScript classes as _instance values_.

What this library then allows you to do is to check if every constructor follows
the rules defined in their classes, so that you to modularize your tests in a
neat way.

### Classes

A class is what defines the behavior that you want your instances to
conform to.

For example, let's say that you want to define a class of things that can be
added:

```javascript
// our class is going to be an instance of Class
const addable = new Class({
  // this is what I've decided to name my class
  // this option is not necessary, but it helps to improve error messages
  name: 'Addable',
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
```

But, as you might have seen, we also expect our instances to implement an
`#equals` method.

That could be another class:

```javascript
const eq = new Class({
  name: 'Eq',
  laws: all(
    obey(function reflexivity(Instance, x) {
      return x.equals(x)
    }),
  ),
})
```

And then the Addable class may _extend_ Eq, meaning that, in order to be an
instance of Addable, the constructor must also be an instance of Eq:

```javascript
const addable = new Class({
  name: 'Addable',
  extends: [eq],
  laws: // ...
})
```

### Instances

Instances are JavaScript constructors that behave according to some (type)
class.

Let's start with the following:

```javascript
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
```

In order to declare it as an instance of something, you must provide a way of
generating values from it. These are the values that will be used for testing.
(See [How it works](#lt-how-it-works))

There are two ways of doing that:

```javascript
// you may ask for as many parameters as you want, and to each one will be
// assigned a random number between 0 and 1 (inclusive)
// from these numbers you may generate an instance of your constructor
const gen = continuous((n) => new Number(n))

// note that, to increase the likelihood of catching edge cases, sometimes the
// generated numbers will be all 0s or 1s
```

```javascript
// testing values will be sampled from the given array
const gen = discrete([new Number(0), new Number(1), new Number(2)])

// this method would be more useful if we had a finite number of possible
// values, which is not the case
```

And then you only need to call `instance` with the correct parameters and
the validators will run. **You should call this at some point in your tests.**

```javascript
// will throw an Error if it fails
instance(Number, addable, gen)
```

Additionally, you may specify how many times each law will be tested (The
default is 15 times):

```javascript
instance(Number, addable, gen, { sampleSize: 10 })
```

<h2 id="lt-how-it-works">How it works</h2>

When `instance` is called, a sample of random instance values will be created
using your provided generator, and each class property will be tested using
those.
If any of the laws fails to be asserted, an error is thrown, and you may be sure
that the constructor in question is not an instance of the class you declared in
the decorator.

In case it passes, you may have a high confidence that it is.
