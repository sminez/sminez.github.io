+++
title = "the subtle art of winging it"
draft = false

[taxonomies]
tags = [ "programming", "rust", "software-engineering" ]
+++

_Or, "How I learned to fuck around and find out"_

I have a bad habit of telling people that I like to have interesting problems to work on.
On its own this isn't so bad, but saying this in interviews quickly ensures that your
day-to-day involves being air dropped into weird and wonderful situations with varying
amounts of context and high expectations.

So, how do you get better at coping in this sort of environment?


<!-- more -->

> This blog post is adapted from a talk I gave at the Rust Un-Conference at Canonical's
> October 2024 engineering sprint in the Hague. The talk there focused more on details from
> `penrose` and `ad` which I have blogged about previously so I won't reproduce that here.


# "But Why?" driven development

![But why?](https://gifdb.com/images/high/ryan-reynolds-but-why-reaction-dpsicvpejgpp14ew.gif)

As with most things in software engineering, the answer to the question "how do I get
better at X?" is of course to invent a new "Y Driven Development" paradigm (\s). Joking
aside, there's a lot to be said for listening to your inner 4 year old and shamelessly,
repeatedly asking "why?".

A fairly consistent thing I have found with the best engineers that I've worked with over
the years has been that they are always happy to call out when they are unsure about
something and that they don't shy away from diving into unknown situations. The first couple
of times you try this you'll almost certainly find that you are completely lost and spending
all of your time reading through documentation and example code. If you're lucky there might
be an aspect of the problem space that looks a little like something you've tackled before,
but if not then you're going to need to establish a base camp where you can get comfortable
as you work on mapping out what it is you need to do.

One obvious place to start is to improve the odds that there will be something familiar to
you in the problems that you encounter. This is your classic Computer Science education and
(for the most part) the countless books, courses and YouTube videos available for you to seek
out and consume. While this sort of material _is_ important, I don't think I'm alone in
thinking that you really need to try things out for yourself in order to learn them, and if
the thing you're wanting to practice is finding a way forward when you are in unfamiliar
territory then following along as someone else shows you what to do isn't really going to help.

So, what do we do?


# Becoming a professional amateur

Recently a colleague of mine mentioned that they were really impressed with the fact that
I always knew what I was doing. It didn't matter what the project was, what problem was
being solved or how much of a heads up I'd been given, I always seemed to have a plan and
know what the next step was. I felt a little bad letting them in on the secret, almost
like explaining how a magic trick works.

I really do have no idea what I'm doing in a lot of those situations.

![no idea what I'm doing](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHY2NWU1MnJpbTlzZWp1YXRvNzY5Y2Y2NjI1d3NydTFoNWlsaDY5cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12QASni5AUN1SM/giphy.webp)

Now before my boss reads this and starts questioning their decision to hire me, I should
point out that this is not at all the same thing as not knowing what I'm doing _at all_.
There is a big difference between having specific knowledge of a problem domain and having
the knowledge and experience to work things out as you go when starting on a new project.

At this point in my career there are a number of things that I am pretty good at, but in
any moderate to large software company I'll happily bet that you can find someone more
knowledgeable than me for any topic you care to pick. What I am _great_ at though is quickly
getting up to speed and getting something working that is more than just a throwaway proof
of concept. I've never managed to find out if this is a widely used term or not, but for me
and the engineers I worked with at Anaplan we called this "software sketching".

## Software Sketching

![rest of the owl](https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/How_to_draw_an_owl_meme.png/800px-How_to_draw_an_owl_meme.png)

Much like sketching in art, the idea is to rough out the details of what you want the final
piece (program) to look like. For any given subject there will be things that you need to
find references for, details you need to check and work on etc. But underpinning that there
are a lot of reusable techniques you can learn that allow you to quickly and efficiently
get a rough idea of what the final result is going to look like.

In art this is often practiced using a sketchbook and picking something you can see in
front of you. Your first attempts will be pretty bad, but over time you'll start to develop
better control of getting the lines and forms you have in your head down onto the paper. As
your technical skills improve you'll start to study and practice geometry, understanding how
light behaves, different techinques for achieving the look and feel you are after, and so on.

In programming we can do the same thing. Every year a whole bunch of us take on the
[advent of code](https://adventofcode.com/) or maybe you want to work your way through the
[Project Euler](https://projecteuler.net/) problems. That's our equivalent of the artist's
"sit down and sketch what's in front of you" work. Its a fantastic starting point but its
not quite the same thing as solving a real problem you are likely to face when developing
a larger piece of software. For that we need to look at tackling something a little more
interesting.


## Picking a project

There really is no substitute for tackling a _real_ problem that you want to solve, and I
do mean a problem that _you_ want to solve. The key part here is to throw yourselve into
something that you personally find interesting. You're about to actively bite off way more
than you can chew so whatever you decide to work on it needs to be something you care about
enough to get you through the "oh my god what am I doing?" phase.

For me, I have a problem that I tend to be nerd sniped easily (relevent [xkcd](https://xkcd.com/356/))
and as a result I tend to spend my free time coding up weird and (sometimes) wonderful
hobby projects:

- [LISP interpreter](https://github.com/sminez/gigl)([s](https://github.com/sminez/ripl))
- [AWK in Python](https://github.com/sminez/datools/blob/master/bin/pyk)
- [Adding destructuring pattern matching to Python 3.6](https://github.com/sminez/concepts/blob/master/docs/pattern_match_README.md)
- [16D hyper-complex algebra Caluclator](https://github.com/quicycle/mart/tree/main/arpy)([s](https://github.com/sminez/ar.jl))
- A graphQL server library
- [Fractal generation](https://github.com/sminez/sandpiles)
- [An AUR package manager written in Zsh](https://gist.github.com/sminez/d6ba0f88dd1e5ec7bcbd901ae9203e52)
- [Go doc for Rust](https://github.com/sminez/roc)
- [An activity pub relay server](https://github.com/hachyserve/actiserve)
- [Far](https://github.com/sminez/k) [too](https://github.com/sminez/bf) [many](https://github.com/sminez/pa) personal CLI tools...

And of course, [penrose](https://github.com/sminez/penrose) and
[ad](https://github.com/sminez/ad).

The one thing that all of these projects have in common is that I took a look at something
that I (at the time) had little to no experience with and I asked myself "I wonder how that
works?" The goal was never to have something perfect, or even usable. It was to learn about
something new and have a bit of fun doing it.

Utility and "good for your CV"-ness are not the goal here: pick something that you want to
learn more about but make sure you have a starting point. It might be working in a language
you are particularly comfortable with, or looking at a problem you already know a little
about. Or (my personal favourite) you could pick something you've recently read about or
watched that has given you a few ideas on where to get started.

Have something in mind? Then then let's dive in.


## Diving in

So, how do you start working on something like this?

You find the simplest, dumbest thing you can write that actually compiles and runs.
Parsing data formats? Grab some example data, throw it in a file and use your library
of choice to start statically parsing the exact data you have already. Writing a CLI?
Hard code some simple hand written argument parsing and just print out a short description
of the different actions you would perform based on the arguments you receive. Working
with REST APIs? Don't even open your text editor: start by using curl from a terminal.

![initial penrose](/images/initial-penrose.jpg)

This is the earliest image I have of `penrose` from when I first started developing it in
2020. The top right is an st terminal window and the floating window in the middle is rofi.
I'm 99% sure that the way this was working was that I had wrapped my head round _enough_
of the `dwm` source code to get to grips with handling map requests and then I hard
coded spawning the terminal and listening for a key binding to open rofi. It worked! Not
bad for an hour of reading the docs on the Rust xlib bindings and blindly porting C code
to Rust until it compiled.

"How did you exit this window manager of yours?", you might ask.

"You pkill it", I would reply.

And you know what? As a starting point that is _fine_. Like I said, the goal isn't to
write production ready code: its to poke at things to see how they work, and this was a
great place to start poking. Over time I got the rest of the initial functionality
working by reading through the source code of other window managers to see what they
had in common and then implementing something similar in penrose. Once I had something
working I could take a step back and work on identifying the pain points, the extra
details and abstractions I didn't want to keep, the missing interfaces that would allow
me to generalise things in nice ways.

Once you get to a point where you feel like you have a decent idea of what the high
level moving parts and how they fit together you're in a position to take a step
back and start outlining what the "real" structure of the project should look like.
Sometimes the sketching phase lasts a few hours, sometimes a day, sometimes a week.
You'll almost always end up with a few pieces that you can repurpose for the actual
codebase but more often than not what you'll take forward is a better understanding
of the problem.

Remember, this is a sketch: not the start of your masterpiece.


## From some ovals and a rectangle to an owl

Now, I'll admit that the advice above still feels very much like "and then the owl",
so lets wrap up with some concrete tips on things you can do to help get the ball
rolling on a new project when you're not sure how to start.

One thing to make clear is that the following advice is intended for getting a new
project up and running, it is very much _not_ universal advice that you should
follow for anything that you are shipping to end users!

#### 1. Minimal runnable project
This one I alluded to above, but your first step should always be to get _something_
running. It doesn't really matter what it is so long as you have a starting point
that you can build from. For the client side of the new [permissions prompting](https://discourse.ubuntu.com/t/ubuntu-desktop-s-24-10-dev-cycle-part-5-introducing-permissions-prompting/47963)
feature in Ubuntu I started with an [80 line shell script](https://github.com/canonical/prompting-client/blob/1385d6c09e1d4fddcdffc64756e3e54fe74e4c22/prompt-loop.sh)
that was essentially just a `while true` loop around some curls and echos. Things
are now a lot more complicated (and robust) but this was enough to start working out
what the request flows looked like and begin to manually test the system.

#### 2. Focus on interating quickly
You don't want to live with your starting point code for longer than you have to,
so that means you'll want to be set up for quickly making changes. My personal
favourite way to do this is to start writing a simple Makefile that wraps all of the
hacky shell commands you need to set up the project, build it and test it. Sure this
isn't actually what Makefiles are for but `make` is available on pretty much every
system you might want to work on and most shells provide nice autocompletion for
targets which helps with being able to quickly run things. As you work on more
projects you'll develop your own list of go to targets and scripts that you'll set
up to help you get into the swing of things.

Using Make specifically isn't the important part here: the thing is to develop
your own default toolkit that you use for sketching so you don't waste time going
down rabbit holes trying to decide what you're going to use.

#### 3. Fail fast and loud
You don't want to fully ignore error cases and failure modes but its going to be a
while before you're in a position to handle things correctly. Instead, a good way
to start is to explictly crash or exit the program the moment something unexpected
happens. When you do this you'll want to dump any and all relevant state you have
in order to make debugging what just happened easier. One benefit of this approach
is that when you do come to handling errors properly, you've already identified
all of the points in your code that you need to modify. But more importantly
this makes sure that you are thinking about errors and where they occur, even if
you're not actually handling them at the moment.

#### 4. Test things when they're stable
Yes tests are important. They're really important. But, TDD and really focusing on
nailing down requirements isn't the best way to start here. Pretty much by definition
you wont have a clear idea of the direction you are going in (at least not yet) so
you're better off keeping things simple enough that you can manually test things to
begin with and only start adding an actual test suite once you've nailed down your
first few pieces of functionality. If you're working in a language with a repl then
that's a _fantastic_ way to iterate and refine things as you get going. If not, then
making sure that your main function is as bare bones as possible so you can run it
in a loop is a close second.


## Over to you

![you can do it](/images/you-can-do-it.jpg)

So there we have it. Not exactly a step by step recipe for how to make forward
progress in unknown territory but then that's kind of the point. The key thing is
to get comfortable with not knowing and to focus small, incremental improvements.
Along the way you'll pick up specific techniques and domain knowledge that will
undoubtedly be useful for future projects, but remember to also pay attention to
how you are learning about the problems you are solving. The meta-skill here is
this idea of sketching the rough outline of what the "real" code will eventually
look like.

If you don't actively practice this then every new project tends to look impossible
without someone to help set you off in the right direction. So remember, "Impossible"
tasks can be broken down into questionable ones. Questionable tasks can be tackled.

Happy hacking.
