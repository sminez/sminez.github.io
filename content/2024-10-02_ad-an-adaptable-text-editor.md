+++
title = "the origin of ad: an adaptable text editor"

[taxonomies]
tags = [ "ad", "programming", "rust" ]
+++

As is probably the case with a lot of programmers, I've been searching for my "ideal"
text editor for programming for quite a while now. Over the years I've picked up,
configured and moved on from a long list of editors and IDEs so it was only really a
matter of time before I found myself wondering how hard it would be to write my own
from scratch one rainy afternoon.

Spoliers: turns out it's actually a fair amount of work. Who knew.

<iframe width="560" height="315" src="https://www.youtube.com/embed/jb2pAi5hLUg?si=BCPn_LhqCvdtP-9m"
 title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write;
 encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"
 allowfullscreen>
</iframe>

<!-- more -->

To be fair, a large part of _why_ my project in particular has ended up being a lot
of work is thanks to some arguably questionable design limitations I placed on the
initial project. Most importantly, I decided that I was going to limit myself to the
bare minimum of dependencies. By which I mean `libc` and not much else (I caved and
ended up pulling). Beyond that I also had a somewhat unconventional feature set in
mind; one composed of my favourite pieces of functionality found in various text
editors I've played around with during my career.

Some of the feature set are probably quite obvious. When it comes to picking sides
in the great holy war of Vim vs Emacs, I'm on the side of team modal editing (despite
having had a lot of fun implementing [LISP interpretors](https://github.com/sminez/gigl)
in the past). But when it comes to the rest of the built in functionality in vim I'll
be honest, I don't tend to make much use of it. I don't really write macros, I always
forget how to yank text to specific registers and on the rare occasion I remember that
'.' is a thing I tend to spend more time trying to work out how to make an edit I can
repeat than it would have taken to just repeat it by hand.

That's not intended as criticism of vim. I've played around with more vim plugins than
I care to mention and my `.vimrc` has been through many (many) rewrites over the years.
I've taken detours off to try out emacs several times (and vscode, kakoune, helix...)
but I always come back to good old, familiar vim.

It's my comfort zone.

So... why bother writing my own editor then?


<br>

### An IDE done right

Years ago now, back during my first programming job at a small startup in Leeds, I
came across a fantastic [video from Russ Cox](https://research.swtch.com/acme) where
he provided a tour of a text editor from the 90s written by [Rob Pike](http://herpolhode.com/rob/)
for the Plan 9 operating system. If you've never watched this screencast before I
highly recommend that you take a look at it now. It's a little over 20 minutes long
and its a delightfully minimalist tour of a fascinating piece of software.

Near the start of the screen cast, Russ refers to acme as "an IDE done right", redefining
IDE as an "integratING development environment" rather than "integratED". The key
distinction being an inversion of how you think about the relationship between the
IDE and the rest of the system:

  - In a traditional IDE you get itegrated debugging, compiling, linting, version
    control, refactoring tools, ... and (typically) a whole lot more. The tools
    need to be adapted, rewritten or embedded to become part of the IDE itself.

  - In acme, you get an interface that make it easy for your existing tools to
    interact with and control the state of your editor. The tools stay as they are
    and the IDE "just" handles the plumbing.

I _loved_ this approach to interacting with and extending acme. I was also really
taken with Plan 9 though as the folks at 9front are quick to point out,
[plan 9 is not for you](http://fqa.9front.org/fqa0.html#0.1.4) (in this case, me).
The idea that you treat your text editor as a glue layer to bind together the rest
of the tooling on your system was endlessly appealing and while there are a number
of things from plan 9 that have made it out into the wider world, I'm always surprised
that its text editors haven't received more attention. There is a small but growing
community of people interested in exploring them, largely via the fantastic
[plan9port](https://github.com/9fans/plan9port) project but that involves bringing
along _all_ of the plan 9 userspace programs. Certainly fun (I use it on all of my
machines) but a kind of a steep asking price if all you want is to try out a new text
editor to see if it's right for you. Which is a shame, because it really is worth
trying out.


<br>

### Time to embark on a questionable project

So, if I'm so taken with acme why isn't that my editor of choice?

While I absolutely love acme's approach to extending the functionality of the editor
and the expressive power if provides to text via [the plumber](http://doc.cat-v.org/plan_9/4th_edition/papers/plumb),
I'm simply to fond of modal editing and being able to write my own keyboard shortcuts.
The actual "editor" part of acme is (unsurprisingly for plan 9) also incredibly minimal
and what I _really_ want is something with a little bit more flexability.

The trick of course is to add something to this fantastic, minimalist editor without
completely wrecking what makes it so fun and powerful in the first place. Not a simple
task to be sure but I _think_ I've done alright.

With that in mind, I set out some ground rules for my new project:

1. Extending the functionality of the editor is limited to the filesystem interface and
   the plumber. Keybindings will be a thing but they're just convenient shortcuts for
   executing helper programs. (No LISP or Lua interpretors)

2. Everything about the editor should be focused around the text within the editor. Be
   that editing the text, selecting and manipulating the text or treating the text as
   input for acme style executing and loading.

3. "Built-ins" should be kept to a minimum. It's fine to provide a bunch of helper scripts
   and other programs that interact with the editor, but the core of the editor should
   be easy to understand and keep in your head.

All that was left to decide on was a name.

Originally I called it "rocket powered unicycle", as a bit of a knod to the acme / road
runner inspired feature set (and unsubtle warning on how advisable it might be to use
the thing) but eventually I settled on `ad`. It's short for "adaptable" and also has the
important quality of being really quick and satisying to type on the command line.

<br>

### Where things stand today

The YouTube video at the top of this article is a quick tour / demo of the current state
of the project as of version `0.1.2`. There is still a fair number of bugs to work out
and some features that need fleshing out but things are now in a state where the editor
is usable and, at least in my opinion, a lot of fun to play around with.

I'm planning on writing some more blog posts on the internals of `ad` and the features
it contains as I continue to work on it so stay tuned for more.

If you want to check it out, the project is available at <https://github.com/sminez/ad>
and published to crates.io as [ad-editor](https://crates.io/crates/ad-editor) (though
you'll still need to check out the repo in order to get the default config files and
helper scripts).

Until next time, happy hacking hacking!
