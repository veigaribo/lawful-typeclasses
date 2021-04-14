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

Instances are JavaScript classes that behave according to some (type) class.

Using the Addable example above, one could almost define an instance as:

```javascript
// you may use this decorator as many times as needed
@instance(addable)
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

The only extra step is to define a static method called `generateData`, that
will take any number of random numbers in the range [0, 1] as parameters
and should return a random instance value.

```javascript
@instance(addable)
class Number {
  // ...

  static generateData(n) {
    // this is quite a trivial example, we just wrap the n.
    // in case you need more random values, just add them as parameters and they
    // will be provided
    return new Number(n)
  }
}
```

With that done, you need only to call `validate` on the constructor and the
validators will run. **You should call this at some point in your tests.**

```javascript
// will throw an Error if it fails
validate(Number)
```

## Checking

You may also check whether a value is of an instance of a class using the
`isInstance` function:

```javascript
const n = new Number(50)
isInstance(n, addable) // true, because Numbers are addable
```

## How it works

When you define your constructor using the `@instance` decorator, some metadata
will be injected into it and into every value it produces. That metadata will
be used to both run the proper validations during `validate` and also to allow
the `isInstance` to work.

When `validate` is called, for each class that the constructor should be an
instance of, a sample of random instance values will be generated using your
constructor's `generateData`, and each class property will be tested using those.
If any of the laws fails to be asserted, an error is thrown, and you may be sure
that the constructor in question is not an instance of the class you declared in
the decorator.

In case it passes, you may have a high confidence that it is.

## What if I can't use decorators?

An approach would be to use the `instance(...)` decorator as a regular
function:

```javascript
class Number {
  // ...
}

// new instances shall be instantiated using the returned constructor
const VNumber = instance(addable)(Number)

validate(VNumber)
```
