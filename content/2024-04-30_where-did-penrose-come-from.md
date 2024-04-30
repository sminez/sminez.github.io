+++
title = "Where did Penrose come from?"

[taxonomies]
tags = [ "penrose", "programming", "rust" ]
+++

In 2020 during lockdown at the height of the COVID-19 pandemic I (like so many others)
found myself with a lot of time on my hands. A lot of people decided to take up a new
hobby, maybe do some work on their house or perhaps get a dog.

Me?

I decided to write an X11 tiling window manager.

<!-- more -->

Now, a reasonable response to hearing that is probably something along the lines of
"but...why?", to which I've not really got anything to answer with other than "why not?".
A less frivolous answer might be that I was trying to convince my boss that he should
let me and my team build the new developer tooling platform we had planned in Rust, and
that this was a demonstration of what a non-trivial Rust project might look like. But
that'd be giving 2020 me too much credit. The honest answer is that I get far too much
satisfaction out of digging into interesting problems and writing code.

<br>

### Getting the ball rolling

My first attempt at this was actually from 2017 but I didn't get much further than
writing up my thoughts on the various tiling window managers that I'd tried up until
that point. I knew what I wanted (programmatic control over my desktop environment)
and I was reasonably confident that if I cherry picked ideas from different places
I could come up with something that was "just right".

![goldilocks looking at porridge bowls](/images/goldilocks.png)

Over the years I've tried out a wide variety of window managers and desktop environments
and it's been quite rare that I've come across anything that I found completely unusable.
That said, I'd never found something that didn't have at least one non-trivial feature
or quirk that just didn't work for me and more often than not, attempting to address that
lead me down a rabbit hole that quickly caused me to lose interest in finding a solution.

So, in 2020 having just spent a week or so of my early mornings trying to rework the [dwm][0]
code base into something I could more easily reason about and extend, I decided that if
I was going to go through this much effort to implement things then I might as well learn
how the whole thing worked. I put on a fresh pot of coffee, headed over to `crates.io` to
find an X11 crate and set up a new repo. As you might imagine, initial progress was mostly
getting to grips with the X11 APIs and just trying to get a terminal open. Once that was
working I decided to sketch things out by hunting through the dwm code for the main pieces
of functionality and then implementing them in Rust. Unsurprisingly, a lot of the C idioms
and paradigms didn't map _directly_ to Rust so I quickly ended up just using the dwm function
names as search terms through the X11 docs to see how everything worked.

After a surprisingly short amount of time I had something that worked! For a given definition
of worked. It certainly wasn't stable yet and it was far from feature complete but it was a
starting point that I understood and somewhere I could build from. A couple of weeks later
and I had something that was good _enough_ to start using in anger.

<br>

### Clunky C -> Monad do

The original releases of [penrose][1] (`0.1.X`..`0.2.X`) stuck with this C inspired API. It got
the job done but despite my best efforts there were a lot of issues with that version of the
code base. For one thing, testing relied heavily on mocked state as I'd started from designing
the project on top of dwm's "we're all one big happy file" model. I'd also learnt a lot about
the various moving parts inside of a window manager by getting to this point, and looking
back I could see a lot of places where I could have saved myself future pain and effort if I'd
known (or thought to look ahead at) what was coming next.

![taking inspiration from xmonad](/images/xmonad-penrose.jpeg)

Cue questionable idea number 2: now that I know (mostly) how a tiling window manager works,
that should be enough of a foothold to allow me to wrap my head around the [xmonad][2] code.

Right?

Now, I've dabbled with Haskell before but never for a project of any real complexity. Certainly
not something that is _entirely_ about IO and interaction with other APIs. But armed with my
new understanding of what a tiling window manager needed to do I decided to see how far I could
get. Turns out, pretty far! I still feel like my level with Haskell is that I can read it so long
as I have access to the docs to check a few things rather than being able to sit down and write
something like xmonad from scratch, but for this that's all I really needed.

The main thing I was after was how xmonad kept everything straight between the interactions with
the X server and the "pure" logic that handled manipulating the window manager state. Years ago
when I first tried out xmonad I'd read about how it makes use of functional data structures
called "zippers", but beyond seeing the name and taking a quick look at [the paper][3] that first
presented the idea I didn't really see how that was something that would be useful outside of
Haskell.

Oh how wrong I was.

Zippers are _fantastic_. I now use them all throughout penrose to handle state manipulation
without needing to worry about tracking invariants or worrying about a lot of the edge cases that
originally tripped me up with the old C-style API.

> If you want to learn more about the data structures that penrose uses I've written about them
> [here][4] in the penrose book and talked about them [here][5] in one of the "penrose from scratch"
> videos on YouTube.

Something as simple as getting a reference to the currently focused client window previously involved
checking top-level state on the window manager itself before falling back to indexing in to the list
of known workspaces and checking the active workspace for a focused client.

But that only got you an _ID_. An ID that you then needed to look up in a top-level map to hopefully
pull out the actual client state (assuming that all the book keeping of indices and map contents
had been handled correctly).
```rust
pub fn focused_client_id(&self) -> Option<WinId> {
    self.focused_client.or(self
        .workspaces
        .map_selected(&Selector::Index(self.active_ws_index()), |ws| {
            ws.focused_client()
        })?)
}

fn focused_client(&self) -> Option<&Client> {
    self.focused_client_id()
        .and_then(move |id| self.client_map.get(&id))
}
```

With zippers? Direct property access all the way down. At the end we map over an `Option` to pop
off the focused client as there is no such thing as an empty stack: the stack itself is optional
instead.

```rust
pub fn current_client(&self) -> Option<&C> {
    self.screens
        .focus
        .workspace
        .stack
        .as_ref()
        .map(|s| &s.focus)
}
```

Lovely.

<br>

### Easier to maintain, easier to use

So, one _massive_ breaking internal API change later and I think what I ended up with is actually
really quite nice! The core of the APIs that users of the library interact with are manipulations
of the pure state that is built out of a family of zipper data structures (I took things a little
further than xmonad in this respect in the end), and the interaction with the X server is handled
using a "diff and render" model. Any time that the pure state is about to be modified, penrose
snapshots the current state and then later diffs that against what comes back from the logic that
is making the changes. That diff is then processed to determine the set of API calls that need to
be made to the X server in order to reflect that state change.

This means that the majority of the internal logic of penrose can be tested without a running X
server (handy for CI!) and in particular, it allows me to fuzz the inputs to those pure functions
and data structures in order to flush out any unexpected corner cases that might cause the window
manager to crash.

The nature of the zipper data structures also means that it is delightfully simple to compose
together operations on them in ways that will behave as you expect, allowing me to open up the
internal APIs to consumers of the crate as a stable interface to build on without having to worry
about implementation details leaking.

<br>

### What now?

At this stage I've used penrose as my daily driver for over three years. It's definitely not for
everyone (you need to be interested in coding your window manager, not just configuring it) and
much like the projects I've used and found issue with myself, there will almost certainly be
aspects of penrose's design that aren't _quite_ what you are after. But hopefully, the modular
nature of the code should allow you to take what you like and re-implement the things that you
wish worked another way.

At the very least, it hopefully serves as a decent example of how a tiling window manager works
and how to structure, test and maintain a non-trivial Rust project.

If you are intested in learning more then I have a [YouTube playlist][6] covering how to write
your own window manager using penrose and some [guides and documentation][7] on how everything
works written using the fantastic [mdBook][8].

Happy hacking!


  [0]: https://dwm.suckless.org/
  [1]: https://github.com/sminez/penrose
  [2]: https://xmonad.org/
  [3]: https://www.st.cs.uni-saarland.de/edu/seminare/2005/advanced-fp/docs/huet-zipper.pdf
  [4]: https://sminez.github.io/penrose/overview/data-structures.html
  [5]: https://www.youtube.com/watch?v=4r4CkXrPEbw
  [6]: https://www.youtube.com/playlist?list=PLy2HjaQiG8lOxCKzuWKfmmXov4iEVOGOF
  [7]: https://sminez.github.io/penrose/
  [8]: https://github.com/rust-lang/mdBook
