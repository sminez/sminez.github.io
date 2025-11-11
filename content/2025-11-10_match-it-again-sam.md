+++
title = "Match it again Sam"
draft = true

[taxonomies]
tags = [ "programming", "rust" ]
+++

> _Implementing a structural regular expressions engine for x/fun and.*/ v/profit/_

If you have you ever looked at regular expressions and thought _"gee, these sure are useful
but I wish there was more going on"_, then do _I_ have a blog post for you!

OK, hear me out. I promise there's some fun stuff in here that's worth a look. It might
only be worth an "oh god why?" kind of look, but worth a look none the less.

[![xkcd perl](https://imgs.xkcd.com/comics/perl_problems.png)](https://xkcd.com/1171)
Obligatory XKCD.

<!-- more -->

<br>

# I love the smell of regular expressions in the morning

Introduced by Rob Pike in his [Sam][0] text editor, and discussed in his [1987 paper][1],
_structural regular expressions_ provide a notation and semantics for composing the regular
expressions we all know (and in some cases, love) in order to more easily describe the _structure_
of the text being searched.

This composition idea allow for writing chains of smaller, easier to reason about expressions
that drill down into the text being searched. The primary goal being to allow you break up the
text into meaningful chunks that care about, rather than always being forced into looping over
lines.

It's always easier to understand what is going on with a concrete example. Take a look at the
following text:
```
    name: Alice
    occupation: programmer
    language of choice: Rust

    name: Bob
    language of choice: Go
    occupation: programmer

    name: Claire
    occupation: linguist
    language of choice: French
```

If I were to ask you to tell me the names of each of the programmers and what their language
of choice was, I'd hope that you could give me an answer in a second or two. You might not
even notice that the order of the fields in each record is inconsistent.

Now, what if I asked you to write me a program to extract that information from the text?

It's not a particularly _complicated_ program to write. For example, the following python
script gets the job done just fine:
```python
with open("haystack.txt", "r") as f:
    haystack = f.read()
    for chunk in haystack.split("\n\n"):
        if "programmer" in chunk:
            for line in chunk.split("\n"):
                if "name:" in line:
                    name = line.split(": ")[1]
                elif "lang" in line:
                    lang = line.split(": ")[1]

            print(f"{name} prefers {lang}")

# Prints:
# Alice prefers Rust
# Bob prefers Go
```

But attempting to do this with regular expressions becomes tricky, if not downright impossible.
We need can't just look for the preferred languages as Claire isn't a programmer. And even if
we could, we need to extract the name alongside the language and the language can appear before
or _after_ the occupation line. So even if you bring in back references you're quickly finding
yourself in trouble.

What we need to be able to do is:
  - Split the text into paragraphs
  - Drop any paragraphs that aren't for a programmer
  - Extract the name and language fields
  - Pretty print the results

Which, coincidentally, is what the following _structural_ regular expression does when executed
by the [sgrep][3] tool covered later in this blog post:
```sh
$ cat haystack.txt | sgrep '
  y/\n\n/
  g/programmer/
  x/name: (.*)@*lang.*: (.*)/
  p/{1} prefers {2}/
'
Alice prefers Rust
Bob prefers Go
```

I'm not sure about you, but personally I think that's pretty cool.

I strongly recommend that you have a read through Rob's paper. It's all of 6 pages long
and it does a great job of demonstrating the sorts of problems that regular expression based
tools can run into, and how a new approach could help.

The paper also makes a point of calling out that what its doing is calling out some interesting
problems to look into, rather than offering up a fully formed solution, and that the hope is to
encourage others to think about how they might apply these ideas elsewhere.

So, with that in mind: lets take a look at how we might take these ideas and run with them!


<br>

# We're going to need a bigger parser


The syntax used by Pike in Sam combined looping constructs and conditional expressions with printing and
editing actions such as deleting the matched text, inserting before or after the match and
replacing the match entirely.

There have been a handful of other implementations over the years, notably Pike's later
editor acme, vis and my own editor ad, all of which follow the original approach of coupling
the composition operators with editing actions that are applied to each match.


- What the hell are structural regular expressions?
- Show some of the arguments from the paper (the awk one is good)
- Mention Sam and Acme
- Mention the initial ad engine and vis
- Cover the original Sam syntax but then split it up as now done in
  the ad docs:
  - Regex based Operators
  - Consumer defined Actions
  - Serial vs Parallel execution


<br>

# Toto, I don't think we're in Bell Labs anymore



## Divide and conquer

- Splitting the problem into "find matches, take actions"
- On brand for a structural system, then further split this into "find matches, assign tags,
  handle tags"
- A lot of the tricky parts of the Sam system come from everything being treated as "apply
  actions at the correct points in the input"
- Instead changing this into more of a traditional (all be it, programmable) parser lets you
  instead turn this into something that feels a lot less like a scriptable editing language
  and more like a way of turning arbitrary text into executable actions.


## Bring your own engine

- At this stage, really what we're talking about is the structural semantics _around_ the
  regex matching itself.
- With that in mind, you can write a generic system that instead replaces the regex operators
  with something of the programmer's choosing so long as it satisfies the interface of supporting
  extracting matching sub-regions and filtering based on an expression.
- Actions change from being engine built-ins to free-form "tag + argument" meta-data that gets
  assigned to matches before they are yielded.
- Why bring your own engine?
  - Showcase the ad engine working on streams and discontiguous inputs (at the cost of performance)


# Rethinking grep

- Show the example impl
- Show some example scripts and their output
- Show working on streams


# Rethinking sed

- Show the example impl
- Show some example scripts and their output
- Show working on streams


# Embedding in an editor

- Explain the embedded nature of this inside Edit exprs
  - Addition of addresses
  - Integration with the rest of the editor


# Next steps

- Probably _could_ do this as a finite automata (of a kind)
- Would need to sort out being able to emit matches while also maintaining internal state
  - Implementing this way produces a more flexible system though
- Rethinking awk would be fun but turns into a full language which is a bit much for a spare time
  project over a couple of weeks.

[0]: http://doc.cat-v.org/plan_9/4th_edition/papers/sam/
[1]: http://doc.cat-v.org/bell_labs/structural_regexps/
[2]: https://en.wikipedia.org/wiki/Regular_expression
[3]: https://github.com/sminez/structex/tree/main/examples/sgrep
