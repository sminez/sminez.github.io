+++
title = "Socrates is a state machine"

[taxonomies]
tags = [ "programming", "rust" ]
+++

> _"All men are mortal, Socrates is a man, therefore Socrates is mortal."_
> 
> _Or, "Writing sans I/O APIs by abusing Rust's language features"_

If you've ever looked into how Rust [Futures][0] work you've probably read at some point
that `async/await` syntax [de-sugars into a state machine][1]. If you like to poke at
things to see what happens then you might also have wondered if this fact can be ~~ab~~used
to instead write other sorts of state machines like, oh I don't know, the state machines you
might need for implementing a [sans I/O][2] network protocol API.

_Does this work?_ → Yes.

_Does this constitute "crimes"?_ → Also yes.

_Am I a little bit too happy with how this turned out?_ → Maybe...

<!-- more -->

<br>

# Sans I/O: À quoi bon?

Recently, Fasterthanlime released [an article][3] (and [video][4]) advocating for the sans I/O
API design pattern. From what I can [find][2] [online][5], this originated in the Python ecosystem
as a way to write protocol libraries that were usable with as many I/O implementations as possible
by removing all of the actual I/O from the core protocol layer (hence the name). Now, there is an
immediate and obvious downside with a network protocol that doesn't perform I/O, namely that it
doesn't perform I/O, so clearly this isn't the whole picture. What you're actually doing when you
follow this design pattern is turning your API inside out so that all of the I/O happens outside
of the logic that is handling the data. On its own that isn't a particularly helpful explanation
so lets take a look at some code and commit some crimes in the name of learning.

> :warning: If you'd like to gloss over the justification and instead skip directly to the criminal activity
> click [here](#committing-crimes) :warning:

<br>

## Parsing 9p messages

For the rest of this blog post we're going to be using [9p][6] as our protocol of choice for our
examples, specifically we're going to be looking at the implementation of the [ninep][7] crate
that I maintain for providing the virtual filesystem interface to `ad`. Thankfully, the protocol
itself is pretty minimal and the details of the structure of each message type and how to handle
it are all covered in [the plan 9 man page][8] for the protocol.

For our purposes we're just going to focus on how to _read_ values as that's where things are
more interesting (when we're writing we know what all the data looks like). An initial naive
approach to writing a trait for parsing 9p values might look like this:

```rust
use std::io::{self, Read};

/// Parse a 9p value out of something that implements std::io::Read
trait NinepAvecIO {
    fn read_from<R: Read>(r: &mut R) -> io::Result<Self>;
}
```

One of the most common pieces of data we need to know how to parse as part of the protocol is a
two byte length header, so lets implement our new trait for `u16`:

```rust
impl NinepAvecIO for u16 {
    fn read_from<R: Read>(r: &mut R) -> io::Result<u16> {
        let mut buf = [0u8; size_of::<u16>()];
        r.read_exact(&mut buf)?;

        Ok(u16::from_le_bytes(buf))
    }
}
```

Nice! But that's a bit boring, lets try something a little more interesting: strings. In 9p,
data items of larger or variable lengths are represented by one of these two-byte header fields
specifying a count (n) followed by n bytes of data. Strings are represented this way with the
data stored as utf-8 encoded text without a C-style trailing null byte. Armed with that knowledge
we should be able to implement our trait for `String`:

```rust
impl NinepAvecIO for String {
    fn read_from<R: Read>(r: &mut R) -> io::Result<u16> {
        let len = u16::read_from(r)? as usize;
        let mut s = String::with_capacity(len);
        r.take(len as u64).read_to_string(&mut s)?;
        let actual = s.len();

        if actual < len {
            return Err(io::Error::new(
                io::ErrorKind::UnexpectedEof,
                format!("unexpected EOF: wanted {len} bytes, got {actual}"),
            ));
        }

        Ok(s)
    }
}
```

Ok, a little more going on this time: we need to first read the header to know how many bytes
of string data are following and then we can attempt to read and parse that many bytes as a
valid utf-8 string. If for some reason we end up with a valid string but its not the correct
length we need to return an error as this violates the protocol, otherwise we've successfully
deserialized our string!

The full protocol consists of 13 [T-messages][9] and their paired [R-messages][10] (plus an
additional error variant on the R-message side) but implementing our `read_from` method for all
of these is [a little much][11] for a blog post so instead lets throw a spanner into the works.

<br>

# Toki-oh-no

Our `NinepAvecIO` trait is exactly what we want for parsing 9p data from something that implements
[Read][12] like, say, a [UnixStream][13] but what if we need to work with async code? The standard
library Read trait is a synchronous blocking API so calling our new `read_from` method inside of async
code is going to cause [problems][14].

Really our naming has been sloppy: our trait should be called something like `NinepAvecBlockingIO`
rather than just `NinepAvecIO`.

That's not _too_ bad though, right? We can define an asynchronous version of our trait as well for
when we need non-blocking I/O:

```rust
use std::io;
use tokio::io::AsyncRead;

/// Parse a 9p value out of something that implements tokio::io::AsyncRead
trait NinepAvecNonBlockingIO {
    fn async_read_from<R: AsyncRead>(
        r: &mut R
    ) -> impl Future<Output=io::Result<Self>> + Send;
}
```

And then we just need to implement _that_ as well each time we implement the blocking API:

```rust
impl NinepAvecNonBlockingIO for u16 {
    async fn async_read_from<R: AsyncRead>(r: &mut R) -> io::Result<u16> {
        let mut buf = [0u8; size_of::<u16>()];
        r.read_exact(&mut buf).await?;

        Ok(u16::from_le_bytes(buf))
    }
}

impl NinepAvecNonBlockingIO for String {
    async fn async_read_from<R: AsyncRead>(r: &mut R) -> io::Result<u16> {
        let len = u16::async_read_from(r).await? as usize;
        let mut s = String::with_capacity(len);
        r.take(len as u64).read_to_string(&mut s).await?;
        let actual = s.len();

        if actual < len {
            return Err(io::Error::new(
                io::ErrorKind::UnexpectedEof,
                format!("unexpected EOF: wanted {len} bytes, got {actual}"),
            ));
        }

        Ok(s)
    }
}
```

Ok, this is getting a little repetitive at this point and we've not even started on the
protocol's 27 message types... there has to be a better way to do this.

<br>

# Sans I/O: Oh, c'est le but

Surprise! The answer is to do the sans I/O thing: who could have guessed. The problem we've
made for ourselves is that we've buried the I/O operations we need to perform inside of our
nice I/O-free protocol code. If we can somehow lift the that _out_ then we'd be able to reuse
the same protocol code for both the blocking API and the non-blocking one.

A first pass at this might look something like this:

```rust
trait NinepSansIO {
    fn bytes_needed() -> usize;
    fn accept_bytes(bytes: &[u8]) -> io::Result<Self>;
}

fn read_from<T, R>(r: &mut R) -> io::Result<T>
where:
    T: NinepSansIO,
    R: Read,
{
    let n = T::bytes_needed();
    let mut buf = [0u8; n];
    r.read_exact(&mut buf)?;

    T::accept_bytes(&buf)
}

async fn async_read_from<T, R>(r: &mut R) -> io::Result<T>
where:
    T: NinepSansIO,
    R: AsyncRead,
{
    let n = T::bytes_needed();
    let mut buf = [0u8; n];
    r.read_exact(&mut buf).await?;

    T::accept_bytes(&buf)
}

```

We've gone from one method to two, splitting our `read_from` method into letting whatever is
going to perform the I/O know how many bytes we need and the logic for actually parsing the
bytes themselves once they're ready. We still need to write dedicated code for the synchronous
and asynchronous cases but this time we just need to write a single wrapper function for each
that drives the sans I/O trait from the outside, meaning our actual protocol logic is free to
be reused for both implementations. Let's try it out! :rocket:

```rust
impl NinepSansIO for u16 {
    fn bytes_needed() -> usize {
        size_of::<u16>()
    }

    fn accept_bytes(bytes: &[u8]) -> io::Result<u16> {
        // from_le_bytes needs a [u8; 2] rather than a &[u8]
        let data = bytes[0..size_of::<u16>()].try_into().unwrap();

        Ok(u16::from_le_bytes(data))
    }
}
```

A little more verbose but that's the price we're paying for not having to perform any I/O
inside of the protocol code. Now for String:

```rust
impl NinepSansIO for String {
    fn bytes_needed() -> usize {
        size_of::<u16>()
    }

    fn accept_bytes(bytes: &[u8]) -> io::Result<String> {
        let len = u16::accept_bytes(bytes)?;
        let mut s = String::with_capacity(len);

        panic!("oh no...");
    }
}
```

Ah...how do we do the second read once we know the length? The way we have things now we
can lift out a single I/O operation out to the wrapper function but we've not got any way
of handling an arbitrary number of I/O operations. What we need is a way to track where
we are in the deserialization process so we know what we've got left to do. In the case
of parsing a string we know that we need to first request the two-byte header and then
we need to request that many bytes for the string itself, but we've not got anywhere to
store the number of bytes we need for the second read.

If you haven't figured it out by now, its time to write some state machines. :robot:

> Side note: if you feel like we could just pass back either the number of bytes we need
> or our final result each time there is a call to `accept_bytes` then we _could_ make
> that work in this instance but we're just creating more problems for ourselves once
> we start to parse more complicated types where we need to build up state in between
> reads.

## State machines to the rescue!

Instead of implementing our trait on the type we're trying to deserialize directly, lets
instead split things into a pair of traits: one for the type itself and one for a state
machine that can track where we are in our deserialization process. While we're working
out the details of the new traits we'll stick to just writing the blocking I/O loop to
keep things simpler:

```rust
trait NinepSansIO {
    type S: StateMachine<T=Self>;

    fn state_machine() -> Self::S;
}

trait StateMachine {
    type T: NinepSansIO<S=Self>;

    fn bytes_needed(&self) -> usize;
    fn accept_bytes(self, bytes: &[u8]) -> io::Result<State<T>>;
}

enum State<T>
where
    T: NinepSansIO,
{
    Pending(T::S),
    Done(T),
}

fn read_from<T: NinepSansIO, R: Read>(r: &mut R) -> io::Result<T> {
    let mut sm = T::state_machine();

    loop {
        let n = sm.bytes_needed();
        let mut buf = [0u8; n];
        r.read_exact(&mut buf)?;

        match sm.accept_bytes(&buf)? {
            State::Pending(s) => sm = s,
            State::Done(t) => return Ok(t),
        }

    }
}
```

Now all an implementation of `NinepSansIO` needs to do is be able to provide a state
machine and the heavy lifting is going to be done in the `StateMachine` trait. Lets
skip the `u16` case for just now (it's not too dissimilar the naive sans I/O implementation
above) and instead take a look just at string again:

```rust
impl NinepSansIO for String {
    type S: StringReader;

    fn state_machine() -> StringReader {
        StringReader::Start
    }
}

enum StringReader {
    Start,
    WithLen(usize),
}

impl StateMachine for StringReader {
    type T = String;

    fn bytes_needed(&self) -> usize {
        match self {
            Self::Start => size_of::<u16>(),
            Self::WithLen(len) => *len,
        }
    }

    fn accept_bytes(self, mut bytes: &[u8]) -> io::Result<State<String>> {
        match self {
            Self::Start => {
                let len = match 0u16.accept_bytes(bytes)? {
                    State::Done(t) => Ok(t),
                    State::Pending(_) => unreachable!(), // we know this takes a single read
                };
                
                Ok(State::Pending(Self::WithLen(len)))
            }

            Self::WithLen(len) => {
                let mut s = String::with_capacity(len);
                bytes.read_to_string(&mut s)?;

                Ok(State::Done(s))
            }
        }
    }
}
```

:weary:

So...it works. And it lets us abstract away the I/O like we wanted. But it does not spark joy.

For one thing, our nested calls to `accept_bytes` are now returning a `State<T>` so we need to match
on that ourselves and handle the case where that state might still be pending (when we know it isn't).
But more importantly the code is becoming more and more verbose and harder to follow, and this is the
simplest case other than an integer! A lot of the message types have 3 or 4 fields that need to be
deserialized, each of which needs to run its own state machine so things are quickly getting out of hand.
As an example, here's what parsing a `create` T-message ends up looking like:

```rust
struct Create {
    fid: u32,
    name: String,
    perm: u32,
    mode: u8,
}

impl NinepSansIO for Create {
    type S = CreateReader;

    fn state_machine() -> CreateReader {
        CreateReader::Fid(u32::state_machine())
    }
}

pub enum CreateReader {
    Fid(u32::S),
    Name(u32, String::S),
    Perm(u32, String, u32::S),
    Mode(u32, String, u32, u8::S),
}

impl StateMachine for CreateReader {
    type T = Create;

    fn bytes_needed(&self) -> usize {
        match self {
            Self::Fid(r) => r.bytes_needed(),
            Self::Name(_, r) => r.bytes_needed(),
            Self::Perm(_, _, r) => r.bytes_needed(),
            Self::Mode(_, _, _, r) => r.bytes_needed(),
        }
    }

    fn accept_bytes(self, bytes: &[u8]) -> io::Result<State<Create>> {
        match self {
            Self::Fid(r) => match r.accept_bytes(bytes)? {
                State::Pending(r) => Ok(State::Pending(Self::Fid(r))),
                State::Done(fid) => Ok(State::Pending(Self::Name(fid, String::reader()))),
            },
            Self::Name(fid, r) => match r.accept_bytes(bytes)? {
                State::Pending(r) => Ok(State::Pending(Self::Name(fid, r))),
                State::Done(name) => {
                    Ok(State::Pending(Self::Perm(fid, name, u32::reader())))
                }
            },
            Self::Perm(fid, name, r) => match r.accept_bytes(bytes)? {
                State::Pending(r) => Ok(State::Pending(Self::Perm(fid, name, r))),
                State::Done(perm) => {
                    Ok(State::Pending(Self::Mode(fid, name, perm, u8::reader())))
                }
            },
            Self::Mode(fid, name, perm, r) => match r.accept_bytes(bytes)? {
                State::Pending(r) => Ok(State::Pending(Self::Mode(fid, name, perm, r))),
                State::Done(mode) => Ok(State::Done(Create { fid, name, perm, mode })),
            },
        }
    }
}
```

Ok, enough is enough. Time to commit some crimes.

<br>

# Committing crimes

When we had the I/O threaded through the protocol logic everything was easy to write and easy
to read (yay!). We just had this problem that we were stuck with a single I/O implementation
(boo). So we lifted the I/O out and now we had code reuse (yay!) but then writing and maintaining
the code started to get out of hand (boo).

Really what we want is to have our cake and eat it. :cake:

So how do we do _that_?

When I first started learning Python one of my heros was (and still is) [Dave Beazley][15]. (If you've
never watched Dave's presentations before then stop reading now and go and take a look. You won't be
disappointed.) Dave has a wonderful way of looking at an existing tool, in his case frequently the
Python interpreter, and working out what sorts of unexpected things you can do with it. Famously he
has played around a lot with Python's generator functions and in particular he's given a number of
talks on what you can do with the [send][16] method that allows you to write coroutines.

Thinking back to Dave's talks, and remembering that Rust's `asyc/await` de-sugars to a state machine
based Future (we finally got there!) we might just have a ready-made mechanism for writing our sans
I/O API. All we're missing is the ability to communicate between the state machine and the I/O loop
driving it.

> _"A future in Rust is a state machine, async/await is used to define futures,
> therefore I can use async/await to define an arbitrary state machine"_

If we take a look at how `yield` and `send` work with generators in Python we can get a pretty good
idea of the sort of API we want to try and replicate. Lets take a quick break from parsing 9p messages
for now and instead do something even simpler: doubling integers.

```python
# example.py
def request_doubling(nums):
    for n in nums:
        print(f"  requesting that {n} gets doubled...")
        doubled = yield n
        print(f"  2 x {n} = {doubled}")

    return "done"


print("starting generator")
gen = request_doubling([1, 2, 3])

while True:
    print("calling 'next'")
    try:
        n = next(gen)
        print("sending result")
        gen.send(2 * n)
    except StopIteration as res:
        print(f"generator finished with result={res.value}")
        break
```

Running this gives us the following output:
```
$ python3 example.py
starting generator
calling 'next'
  requesting that 1 gets doubled...
sending result
  2 x 1 = 2
  requesting that 2 gets doubled...
calling 'next'
  2 x 2 = None
  requesting that 3 gets doubled...
sending result
  2 x 3 = 6
generator finished with result=done
```

There are a couple of important moving parts here so lets go over them and see how we can
replicate them in Rust:

  1. The `request_doubling` function is returning a Generator that requires something external to drive it.
     This is going to be our state machine and what we're after is a way of writing it as simple imperative
     code rather than explicitly writing out the different states of the state machine. Using `async/await`
     for this is going to allow us to return a Future that we can later poll to run the state machine.
     Exactly _how_ we run it is the main problem to solve (more on that later).
  2. The `doubled = yield n` line is both sending and receiving a value by communicating with whatever is
     driving the Generator. In Python everything is dynamically typed but we're going to need to find a way
     of specifying the type of the values being sent and received.
  3. Outside of the Generator this communication is split into two parts: receiving the value (from `next`)
     and sending the result back into the Generator (with `send`). In order to maintain the type safety we
     want around these values we're going to need to define both sides of this interface.
  4. When the Generator is finished it can return a value (by raising a `StopIteration` exception in Python
     but we'll gloss over that :grimacing:). For the Rust side of things we need to pay attention to the
     fact that the type of this return value is something else that we need to define as part of the contract
     between the state machine and whatever is running it.

### Stubbing out an interface

So, we're going to need two traits: one for the state machine and one for the thing running it. They need
to point at each other and they need to keep track of the shared types. With that in mind, here's a rough
sketch of how this might look.

```rust
trait StateMachine {
    type Snd; // the type we're going to yield
    type Rcv; // the type coming back from a yield
    type Out; // the type we're going to return

    fn run() -> impl Future<Output=Self::Out>;
}

enum Step<Snd, Out> {
    Pending(Snd),
    Complete(Out),
}

trait Runner {
    type Snd; // the type we expect to be yielded
    type Rcv; // the type we'll return from a yield

    fn send(&self, value: Self::Rcv);

    fn step<Out, F>(&self, fut: &mut Pin<&mut F>) -> Step<Self::Snd, Out>
    where
        F: Future<Output = Out>;
}
```

That gets us _close_ but not close enough: we're still missing a mechanism for passing values between
the state machine and the runner, and while we _are_ pinning down the types being passed back and forth
we're not yet ensuring that both sides agree on the types they need to use. But, if we take a step back
and instead look at the [Future][1] trait itself we might be able to spot somewhere that we can smuggle
some data in and out of the "state machine" while it's running:

```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

Hmm...so we get given a [Context][17] it seems. What can we do with that? Well according to the docs
"currently, Context only serves to provide access to a `&Waker` which can be used to wake the current
task." Fair enough. Lets take a look at what having a [Waker][18] gets us then :eyes:
> pub fn data(&self) -> *const ()  // Gets the data pointer used to create this Waker.

Now _that_ we can work with. Sure its a raw pointer to an empty tuple (Rust's equivalent of a void
pointer) but we did say we were prepared to commit some crimes, so lets cast some pointers! We can
only get at this if we hand write a Future and implement `poll` directly so lets whip up something
simple(ish) and see what mischief we can get into:

```rust
use std::{
    future::Future,
    pin::{Pin, pin},
    sync::Arc,
    task::{Context, Poll, Wake, Waker},
};

struct Data(&'static str);

// We don't actually need to handle things correctly here so lets just no-op
impl Wake for Data {
    fn wake(self: Arc<Self>) {}
    fn wake_by_ref(self: &Arc<Self>) {}
}

struct SneakyFuture;
impl Future for SneakyFuture {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, ctx: &mut Context<'_>) -> Poll<Self::Output> {
        // SAFETY: highly questionable
        let data = unsafe {
            (ctx.waker().data() as *const Data)
                .as_ref()
                .unwrap()
                .0
        };

        Poll::Ready(data)
    }
}

fn main() {
    let state = Arc::new(Data("Hello, world!"));
    let waker = Waker::from(state);
    let mut ctx = Context::from_waker(&waker);
    let fut = pin!(SneakyFuture);

    match fut.poll(&mut ctx) {
        Poll::Pending => panic!("should only return ready"),
        Poll::Ready(data) => println!("got some data -> {data}"),
    }
}
```

I've set up this example as a [playground link][19] for you to try out and confirm for yourself
that it does in fact print "got some data -> Hello, world!" when you run it :tada:

Half way there (not).

That allows us to read some data out of the `Waker`, but what about storing data? Well, lets try
writing another future and seeing if we can get that to work as well:

```rust
// Adding this to the previous example...
struct ReallySneakyFuture;
impl Future for ReallySneakyFuture {
    type Output = ();

    fn poll(self: Pin<&mut Self>, ctx: &mut Context<'_>) -> Poll<Self::Output> {
        // SAFETY: even more highly questionable
        unsafe {
            (ctx.waker().data() as *mut () as *mut Data)
                .as_mut()
                .unwrap()
                .0 = "psych! new data!"
        };

        Poll::Ready(())
    }
}

// ...and swapping out the main function
fn main() {
    let state = Arc::new(Data("Hello, world!"));
    let waker = Waker::from(state.clone());
    let mut ctx = Context::from_waker(&waker);

    match pin!(SneakyFuture).poll(&mut ctx) {
        Poll::Pending => panic!("should only return ready"),
        Poll::Ready(data) => println!("got some data -> {data}"),
    }

    match pin!(ReallySneakyFuture).poll(&mut ctx) {
        Poll::Pending => panic!("should only return ready"),
        Poll::Ready(_) => println!("did sneaky things..."),
    }

    println!("contents of state = {}", state.0);
}
```

There's another [playground link][20] for this one and if you run it you should see the following:

```
got some data -> Hello, world!
did sneaky things...
contents of state = psych! new data!
```

Getting closer!

### Getting data out and responses back in

Let's recap where we're at so far: we've managed to get data out of a Waker given to us by the
thing polling us (kind of like "send" in Python) and we can stash data in that same Waker so it
is accessible by the thing polling us (kind of like "yield" in Python). At the moment we have
this split over two separate futures that we have to poll in sequence, but that's an easy enough
thing to fix: what we really want is to recreate our doubling example. For that, we need the future
that acts like a `yield` and then we'll need to call it from inside another async function that
is behaving like the generator from the Python example:

```rust
// Now we need to store a usize instead of a string and we need to be able to
// mutate that usize from the poll loop
struct Data(Mutex<usize>);

// Our yield future needs to make sure that it returns Poll::Pending once in order to
// yield control back to the poll loop. The second time we're polled we can read back
// the value from the shared state and return it to the async function that called us.
struct Yield {
    polled: bool,
    n: usize,
}

impl Future for Yield {
    type Output = usize;

    fn poll(mut self: Pin<&mut Self>, ctx: &mut Context<'_>) -> Poll<usize> {
        if self.polled {
            // SAFETY: we can only poll this future using a waker wrapping Data
            let data = unsafe {
                *(ctx.waker().data() as *mut () as *mut Data)
                    .as_mut()
                    .unwrap()
                    .0
                    .lock()
                    .unwrap()
            };

            Poll::Ready(data)
        } else {
            self.polled = true;
            // SAFETY: we can only poll this future using a waker wrapping Data
            unsafe {
                *(ctx.waker().data() as *mut () as *mut Data)
                    .as_mut()
                    .unwrap()
                    .0
                    .lock()
                    .unwrap() = self.n;
            };

            Poll::Pending
        }
    }
}

// The bit we've been waiting for!
// Out generator / state machine / abuse of async ends up looking like a normal Rust
// function. But...it really isn't: the Yield future will only work if we poll it in
// the right way.
async fn request_doubling(nums: &[usize]) -> &'static str {
    for &n in nums.iter() {
        println!("  requesting that {n} gets doubled...");
        let doubled = Yield { polled: false, n }.await;
        println!("  2 x {n} = {doubled}");
    }

    "done"
}

// Now we want to poll the future until it is complete rather than just once
fn main() {
    let state = Arc::new(Data(Mutex::new(0))); // starting value doesn't matter
    let waker = Waker::from(state.clone());
    let mut ctx = Context::from_waker(&waker);

    println!("creating future");
    let mut fut = pin!(request_doubling(&[1, 2, 3]));

    loop {
        println!("polling");
        match fut.as_mut().poll(&mut ctx) {
            Poll::Pending => {
                let n = *state.0.lock().unwrap();
                println!("setting result");
                *state.0.lock().unwrap() = 2 * n;
            }

            Poll::Ready(data) => {
                println!("future finished with result={data}");
                break;
            }
        }
    }
}
```

Obligatory [playground link][21], and if you run this one you should see...
```
creating future
polling
  requesting that 1 gets doubled...
setting result
polling
  2 x 1 = 2
  requesting that 2 gets doubled...
setting result
polling
  2 x 2 = 4
  requesting that 3 gets doubled...
setting result
polling
  2 x 3 = 6
future finished with result=done
```

Success! :tada: :tada: :tada:

<br>

# The rest of the owl

At this stage we have successfully poked Rust into letting us have something that's in roughly the
same ballpark as Python's coroutine feature, but we're still a long way off from making this
something that's general purpose.

  - The shared state is currently hard coded as being a usize in and a usize out.
  - The future we write for our state machine is callable as a normal async function, but actually
    trying to run it will blow up when we try to peek inside the Waker and discover it isn't what
    we're expecting.
  - We don't have any sort of API contract between the state machines we want to write and the logic
    of the poll loop that is going to drive them to completion.

I could walk you through all of the steps in how we can address these issues but this blog post is
already pretty long and we're still not any closer to writing our sans I/O API. So instead I'll
just introduce you to [crimes][22]: a crate I've written that provides a typesafe API around the
questionable hacking we've just been looking at.

> I was also considering "ohnoroutines" for the crate name, but requiring users of the crate to type
> "use crimes" in their source code was too good to pass up.

The API itself is pretty minimal: two traits to implement, two helper structs for binding everything
together and the `Step` enum we proposed earlier. First lets take a look at the traits:

```rust
pub trait RunState {
    type Snd: Unpin + 'static;
    type Rcv: Unpin + 'static;
}

pub trait StateMachine: Sized {
    type Snd: Unpin + 'static;
    type Rcv: Unpin + 'static;
    type Out;

    /// Return a future that can be executed by a [Runner] to run this state machine to completion.
    ///
    /// # Panics
    /// This [Future] must be executed using a [Runner] rather than awaiting it normally. Any calls
    /// to async methods or functions other than [Handle::pending] will panic.
    fn run(handle: Handle<Self::Snd, Self::Rcv>) -> impl Future<Output = Self::Out> + Send;
}
```

`RunState` is a marker trait that defines a pair of types associated with yielding that a given
state machine runner is able to support. In order to actually execute a state machine we need to
create a `Runner`, the first of our two helper structs (more on that in a bit). `StateMachine`
is our state machine trait (surprisingly enough) where we specify the types we want to associate
with yielding and our output type. As you might expect, these need to line up with the types
provided by the `Runner` that is going to be executing the state machine. The purpose of the
`run` method is to return a Future that represents the state machine we want to execute, but to
be able to call run we need to provide a `Handle`, the second of our two helper structs.

> If you're wondering about the Unpin and 'static bounds on all the types, they're there to make
> things place nice with tokio.

So, what's a Handle? There's not much to it:
```rust
pub struct Handle<S, R>
where
    S: Unpin + 'static,
    R: Unpin + 'static,
{
    _snd: PhantomData<S>,
    _rcv: PhantomData<R>,
}
```

But, importantly, you can't ever create a Handle: the only way to get one is by asking a `Runner`
to do it for you, ensuring that the yield types for the Runner match those expected by the
state machine. Once your state machine is executing, the Handle can be used to yield back to
the Runner by calling its `yield_value` method (which under the hood just runs the `Yield` future
we wrote previously).

Let's take a look at what it's like to `use crimes` to parse 9p messages (remember those?):

```rust
use crimes::{Handle, RunState, Runner, StateMachine, Step};
use std::{io, marker::PhantomData, pin::pin};

// The string "Hello, 世界" encoded in 9p binary format
const HELLO_WORLD: [u8; 15] = [
    0x0d, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0xe4, 0xb8, 0x96, 0xe7, 0x95, 0x8c,
];

fn main() -> io::Result<()> {
    println!(">> reading using std::io::Read");
    let v: String = read_9p_sync_from_bytes(&mut io::Cursor::new(HELLO_WORLD.to_vec()))?;
    println!("  got val: {v:?}\n");

    Ok(())
}

// This is what our blocking I/O read loop ends up looking like
fn read_9p_sync_from_bytes<T: Read9p, R: io::Read>(r: &mut R) -> io::Result<T> {
    let runner = Runner::new(NinepState);
    let mut fut = pin!(runner.make_fut::<NineP<T>>());
    loop {
        match runner.step(&mut fut) {
            Step::Complete(res) => return res,
            Step::Pending(n) => {
                println!("{n} bytes requested");
                let mut buf = vec![0; n];
                r.read_exact(&mut buf)?;
                runner.send(buf);
            }
        }
    }
}

// We don't need anything special for our run state so we can just use an empty struct
struct NinepState;
impl RunState for NinepState {
    type Snd = usize;
    type Rcv = Vec<u8>;
}

// Defining a wrapper trait lets us implement it directly on the types we care about even if we
// don't own them
trait Read9p: Sized {
    fn read_9p(handle: Handle<usize, Vec<u8>>) -> impl Future<Output = io::Result<Self>> + Send;
}

// But when it comes to implementing StateMachine, we need to use a wrapper type to avoid the
// orphan rule
struct NineP<T>(PhantomData<T>);
impl<T: Read9p> StateMachine for NineP<T> {
    type Snd = usize;
    type Rcv = Vec<u8>;
    type Out = io::Result<T>;

    async fn run(handle: Handle<usize, Vec<u8>>) -> io::Result<T> {
        T::read_9p(handle).await
    }
}

impl Read9p for u16 {
    async fn read_9p(handle: Handle<usize, Vec<u8>>) -> io::Result<u16> {
        let n = size_of::<u16>();
        let buf = handle.yield_value(n).await;
        let data = buf[0..n].try_into().unwrap();
        Ok(u16::from_le_bytes(data))
    }
}

impl Read9p for String {
    async fn read_9p(handle: Handle<usize, Vec<u8>>) -> io::Result<String> {
        let len = NineP::<u16>::run(handle).await? as usize;
        let buf = handle.yield_value(len).await;
        String::from_utf8(buf)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))
    }
}
```

That doesn't look too bad! Running it gives us the following output:
```
>> reading using std::io::Read
2 bytes requested
13 bytes requested
  got val: "Hello, 世界"
```

So, moment of truth...what do we need to do in order to also support non-blocking I/O? Two
things:
  1. Convert our main function to be async
  2. Write an async version of the I/O loop

```rust
use tokio::io::{AsyncRead, AsyncReadExt};

#[tokio::main]
async fn main() -> io::Result<()> {
    println!(">> reading using std::io::Read");
    let s: String = read_9p_sync_from_bytes(&mut io::Cursor::new(HELLO_WORLD.to_vec()))?;
    println!("  got val: {s:?}\n");

    println!(">> reading using tokio::io::AsyncRead");
    let s: String = read_9p_async_from_bytes(&mut io::Cursor::new(HELLO_WORLD.to_vec())).await?;
    println!("  got val: {s:?}");

    Ok(())
}

async fn read_9p_async_from_bytes<T: Read9p, R: AsyncRead + Unpin>(r: &mut R) -> io::Result<T> {
    let runner = Runner::new(NinepState);
    let mut fut = pin!(runner.make_fut::<NineP<T>>());
    loop {
        match runner.step(&mut fut) {
            Step::Complete(res) => return res,
            Step::Pending(n) => {
                println!("{n} bytes requested");
                let mut buf = vec![0; n];
                r.read_exact(&mut buf).await?;
                runner.send(buf);
            }
        }
    }
}
```

Running this gives us output both from the blocking I/O reader and the non-blocking one:
```
>> reading using std::io::Read
2 bytes requested
13 bytes requested
  got val: "Hello, 世界"

>> reading using tokio::io::AsyncRead
2 bytes requested
13 bytes requested
  got val: "Hello, 世界"
```

:sunglasses:

<br>

# We made it!

It took some work (and some abuse of async/await) but we got there: a underlying sans I/O API
that only requires some minimal boilerplate for plugging in our choice of blocking or
non-blocking I/O. The top level `crimes` API even looks vaguely respectable (so long as you
don't mind the comment about panics on the `StateMachine::read` method) and _seems_ to do the
trick for providing a sans I/O API for my 9p crate which was what kicked this all off in the
first place. :muscle:

If you like this idea in principle but would prefer that it was a first class "thing" (and more
robust), then take a look at [the work being done to bring generators to Rust][23] as part of
RFC 2033. Some fantastic work is going on over there and I for one can't wait until they find
their way into the language :crab:

Until next time, look after yourself, and happy hacking.

  [0]: https://doc.rust-lang.org/std/future/trait.Future.html
  [1]: https://eventhelix.com/rust/rust-to-assembly-async-await/
  [2]: https://sans-io.readthedocs.io/
  [3]: https://fasterthanli.me/articles/the-case-for-sans-io
  [4]: https://www.youtube.com/watch?v=RYHYiXMJdZI
  [5]: https://www.youtube.com/watch?v=7cC3_jGwl_U
  [6]: http://9p.cat-v.org/documentation/
  [7]: https://crates.io/crates/ninep
  [8]: http://man.cat-v.org/plan_9/5/
  [9]: https://docs.rs/ninep/0.3.0/ninep/protocol/enum.Tdata.html
  [10]: https://docs.rs/ninep/0.3.0/ninep/protocol/enum.Rdata.html
  [11]: https://github.com/sminez/ad/blob/4f9fc13c517fd715c8c053f20879635cf50c0936/crates/ninep/src/protocol.rs
  [12]: https://doc.rust-lang.org/std/io/trait.Read.html
  [13]: https://doc.rust-lang.org/std/os/unix/net/struct.UnixStream.html
  [14]: https://rust-lang.github.io/async-book/part-guide/more-async-await.html?#blocking-io
  [15]: http://www.dabeaz.com/talks.html
  [16]: https://docs.python.org/3/reference/expressions.html#generator.send
  [17]: https://doc.rust-lang.org/std/task/struct.Context.html
  [18]: https://doc.rust-lang.org/std/task/struct.Waker.html
  [19]: https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&gist=65a27fa84db70fec9d04c30df5db2e68
  [20]: https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&gist=4bdd5d7bd9e6654ab93d35e35bc36428
  [21]: https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&gist=5a378982f55f941e064ff7075df65380
  [22]: https://github.com/sminez/crimes
  [23]: https://dev-doc.rust-lang.org/beta/unstable-book/language-features/generators.html
