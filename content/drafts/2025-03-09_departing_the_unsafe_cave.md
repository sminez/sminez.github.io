+++
title = "Departing the unsafe cave"

[taxonomies]
tags = [ "programming", "rust" ]
+++

> _"Welcome out of the cave, my friend. It's a bit colder out here, but the stars are just beautiful."_
> 
> _Or, "Covering up our crimes to make our API respectable"_

[Last time][0] we took a look at developing a simple coroutine API using Rust's async/await syntax, where we
got something that worked but the API was a little clunky and left a fair amount to be desired. So, being
unable to leave this well enough alone I've carried on poking at things and now things are at least passably
rehabilitated and respectable.

Or at the very least, I've done a decent job of burying the bodies.

So, lets take a look at how things ended up! :eyes:

<!-- more -->

<br>


# The right question is usually more important than the right answer

We left off with an API that was split into two parts: a `Runner` that was responsible for holding onto the
state of the coroutine and, well, running it to completion and the coroutine itself that we were still calling
a `StateMachine` thanks to the overall theme of the blog post. The traits you needed to implement to use the
API looked like this:
```rust
pub trait RunState {
    type Snd: Unpin + 'static;
    type Rcv: Unpin + 'static;
}

pub trait StateMachine: Sized {
    type Snd: Unpin + 'static;
    type Rcv: Unpin + 'static;
    type Out;

    fn run(handle: Handle<Self::Snd, Self::Rcv>) -> impl Future<Output = Self::Out> + Send;
}
```

And running a simple `StateMachine` that handled each yield in the same way looked something like this:
```rust
    let runner = Runner::new(MyState);                       // Something implementing RunState
    let mut state_machine = runner.init::<MyStateMachine>(); // Something implementing StateMachine
    loop {
        match runner.step(&mut state_machine) {
            Step::Complete(res) => return res,
            Step::Pending(yield_data) => {
                let response = build_response_for(yield_data);
                runner.send(response);
            }
        }
    }
```

Now this definitely works, and for what we set out to achieve last time it solved the problem we had:
factoring the IO we needed to perform _out_ of the main logic of our protocol layer so we could provide
synchronous and asynchronous implementations from the same code.

But we can do better.

This shouldn't be a surprise (what we have so far is a proof of concept at best) and its also not a _bad_
thing: getting started with something is usually the hardest part. But now that we have something working
lets take a look at what we've got and where things can be improved. The easiest place to start is with the
top level API.

### Multiple structs
This idea of splitting the problem into two (the `Runner` and the `StateMachine`) is really an implementation
detail that we're exposing to users of the API. Under the hood we have two pieces of the puzzle: the statemachine
representation of our coroutine and the _shared_ state between that state machine and the logic running it. But
if all we can meaningfully do with the runner is use it to interact with the state machine then we should find a
way to combine them into a single struct. More importantly, splitting things into two structs means that we need
to manage sharing state between them and making sure we don't do anything unsound when users of out API do
arbitrary things with each half. If we can avoid having to deal with that then we probably should.

### Overly permissive API
We modelled these initial API methods on Python's [generators][1] so its not that surprising that we've
ended up with something that places fairly minimal restrictions on how users of the API interact with it.
For example, nothing prevents you from calling `step` without first calling `send` to respond to the previous
yield (which will result in a panic), or from calling `send` multiple times in a row (which will simply
overwrite the previous value). In Python, calling `next` will run the generator by sending a default
`None` value back but in Rust this would mean having all yields return Options which we really don't want.
`send` is also a composite operation that returns a value for the yield while also resuming the generator. This
is great for preventing the "double send" issue but it's also why Python has both `send` _and_ `next`: when a
generator is first created all you can do is call `next` as you've not hit a yield point yet.

### Cleanup
Finally, once a coroutine completes...what happens if you try to resume it again? Well in Python a `StopIteration`
exception is thrown:
```python
>>> def g():
...     yield 1
...
>>> a = g()
>>> next(a)
1
>>> next(a)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration
```

But what about Rust? This is what [the docs on Future::poll][2] have to say on the matter:

> Once a future has completed (returned Ready from poll), calling its poll method again may panic, block forever,
> or cause other kinds of problems; the Future trait places no requirements on the effects of such a call.

Soooo...we probably should find a way of preventing the user from spinning that roulette wheel.

Once we've sorted these issues out there's then the part that's a little more fun: wrapping things up nicely in
a top level API that gives the user some convenience methods and functionality to make things easier to work with.

<br>

----

<br>

# Overall themes and topics
- "The cave" here is back to front: the real (unsafe) world is most often viewed from the safety of the cave.
  Taking a look at how things actually work under the hood and then bringing that learning back is valuable.
- Unsafe isn't the best way to communicate what is happening
  - & and &mut being shared / exclusive references instad of immutable / mutable references is a better mental model
  - unchecked (rather than unsafe) is a better mental model: you are opting out of having the compiler check invariants
    for you rather than what you are doing inherently being unsafe and problematic
- "safe" idiomatic APIs are wrappers around underlying "unsafe" APIs where we confine the book keeping. This
  is nothing new, the difference in Rust is that the language (and community) emphasise confining the checking of
  these invariants to a smaller part of the codebase rather than allowing it to bleed out into the public API.


# Ergonomics
- if this is going to be a real library, what sorts of convenience methods do we need?
  - talk about Option & Result methods
  - ensuring that users can't footgun
- bundling things into a single struct
- reducing the amount of unsafe
- removing the need for unsafe-cellWill we learn fun things along the way? Yes.

# Trade-offs
- typestate enforcing correct API behaviour
- allowing for an in progress coroutine to be moved between threads
- avoiding allocations and being able to support no_std
  - `Pin<&mut Self>` prevents using the typestate technique which weakens the top-level API

# Discussion of unsafe
- not a "bad" thing: its how you actually get things done in Rust
- places a larger burden on library authors to validate their implementation
- how the vast majority of `std` works (along with most widely used crates)

# Implementing the higher level ninep APIs
- methods returning Coros that mutate self
- issues with the current aproach
  - allocating Vecs to pass data back to the Coros
  - having a generic Handle interface nukes the ability to be more performant in specialised
    cases

-> Everything is trade offs in the end, so building a toolkit and exploring the landscape of
   what is possible is often a better approach than blindly following a single path



### Plato quotes to use / modify
- Referencing learning more about how unsafe works
  - "Reality is created by the mind, we can change our reality by changing our mind"
  - "Wisest is he who knows what he does not know."
  - "Ignorance is the root cause of all difficulties"
- Specific silly things to tie into parts of the API
  - "The first and best victory is to conquer self" (Getting methods returning coros to work)
  - "Everything changes and nothing remains still" (Pin)
- Misc
  - "The greatest wealth is to live content with little"


# To cover
- link to previous post and the new crate
- getting it working
  - go over the initial unsafe API, then the "crimes" API that works but has multiple problems
  - outline what we would want / need to ensure in order to avoid these problems
- taking a step back
  - go through the journey of using unsafe-cell to share state between the runner and coro, then
    being able to remove it if they are both contained in the same struct
    - link to Mara's "Atomics & Locks" for more info on unsafe-cell
  - talk about the choice to store the future on the heap so we can pin it
    - need to pin it somewhere for all of this to work
    - storing it inside of the coro and pinning the coro works but prevents you from implementing the
      typestate behaviour as you need to move out of self
    - storing it outside of the coro entirely also works but then you need to bring back unsafe-cell
      and deal with managing that state correctly (plus the API is then a bit more clunky)
- unsafe APIs in general
  - this is the whole point of unsafe, and what a _lot_ of libraries are built on top of
  - forbidding unsafe in crates makes sense if you don't need it, but you almost certainly use unsafe
    in your Rust code somewhere under the hood, so don't think of it as "unsafe bad": think of it as
    "unsafe is...unsafe, so stop and think before you act".
- implementing the higher level API in ninep
  - The simple coro / state machine technique works for the protocol layer, but implementing the server
    and client side of things requires methods that mutate `self`
  - having to allocate Vecs in order to pass data back to the coro is annoying


  [0]: https://www.sminez.dev/socrates-is-a-state-machine/
  [1]: https://docs.python.org/3/reference/expressions.html#yield-expressions
  [2]: https://doc.rust-lang.org/std/future/trait.Future.html#tymethod.poll
