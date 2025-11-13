+++
title = "Match it again Sam"

[taxonomies]
tags = [ "programming", "rust" ]
+++

> _Implementing a structural regular expressions engine for x/fun and.*/ v/profit/_

If you have you ever looked at regular expressions and thought _"gee, these sure are useful
but I wish there was more going on"_, then do _I_ have a blog post for you!

OK, hear me out. I promise there's some fun stuff in here that's worth a look. It might
only be worth an "oh god why?" kind of look, but worth a look none the less.

Allow me to introduce you to the delightful world of _structural_ regular expressions.

[![xkcd perl](https://imgs.xkcd.com/comics/perl_problems.png)](https://xkcd.com/1171)
Obligatory XKCD.

<!-- more -->

<br>

# I love the smell of regular expressions in the morning

Introduced by Rob Pike in his [Sam][0] text editor, and discussed in his [1987 paper][1],
_structural regular expressions_ provide a notation and semantics for composing the regular
expressions we all know and love in order to more easily describe the _structure_ of the
text being searched.

This composition idea allow for writing chains of smaller, easier to reason about expressions
that drill down into the text being searched. The primary goal being to allow you break up the
text into meaningful chunks that care about, rather than always being forced into looping over
lines.

It's always easier to understand what is going on with a concrete example. Lets take this easy
to start: take a look at the following text and determine the names of each of the programmers
and what their language of choice is.
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

Hopefully it only takes you a second or two to work the answer out. You might not even
notice that the order of the fields in each record is inconsistent.

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
We can't just look for the names and preferred languages directly as Claire isn't a programmer.
Even if we could, we need to extract the name alongside the language, and the language can
appear before or _after_ the occupation line. So attempting to cover all cases with a single
expression quickly starts to get messy.

Really what we want is the logic from the Python script (minus the manual string manipulation):
  - Split the text into paragraphs
  - Drop any paragraphs that aren't for a programmer
  - Extract the name and language fields
  - Pretty print the results

Which, coincidentally, is what the following _structural_ regular expression[^true-any] does:
```
y/\n\n/
g/programmer/
x/name: (.*)@*lang.*: (.*)/
p/{1} prefers {2}/
```
```
Alice prefers Rust
Bob prefers Go
```

I'm not sure about you, but personally I think that's pretty cool.

I strongly recommend that you have a read through Rob's paper. It's all of 6 pages long
and it does a great job of demonstrating the sorts of problems that regular expression based
tools can run into, and how a new approach could help.

The paper also makes a point of calling out that what its doing is highlighting some interesting
problems to look into, rather than offering up a fully formed solution, and that the hope is to
encourage others to think about how they might apply these ideas elsewhere.

So, with that in mind: lets take a look at how we might take these ideas and run with them!


<br>

# We're going to need a bigger parser

The syntax used by Pike in `Sam` combined looping constructs and conditional filters with
printing and editing actions such as deleting, replacing or inserting around a match of a
regular expression. There have been a handful of other implementations over the years, notably
Pike's later editor [acme][3], [vis][4] and my own editor [ad][5], all of which follow this
same approach of coupling the composition operators with editing actions that are applied to
each match. (Sam itself also provided a number of additional operators for working with the
state of the editor itself that we wont cover here.)

As we saw in the example above, the syntax used for this takes inspiration from classic regular
expressions in being really quite terse. Operators and actions share a common syntax of a single
character to identify the action followed by an argument included in forward slashes.

Writing a structural regular expression then involves writing a pipeline of operators ending in
an action that is applied to any matches that are found. To kick things off, the selected text
begins as the full haystack (or in the case of the text editors, the current selection within
the editor). From there, the first operator is run and any matches it finds are passed along
to subsequent expressions in the pipeline: additional operators acting with flat-map and filter
semantics and actions being applied before processing the next match.

For operators, the argument is always a regular expression `re`[^operators]:

- `x/re/` for each match of **re**, run the expressions that follow
- `y/re/` between each match of **re**, run the expressions that follow
- `g/re/` if **re** matches, run the expressions that follow
- `v/re/` if **re** does _not_ match, run the expressions that follow

For actions, the argument is text to be inserted into the file.[^templating]:

- `a/text/` append **text** after the match
- `i/text/` insert **text** before the match
- `c/text/` change the match to **text**
- `p/text/` print **text**
- `d` delete the match


<br>

### Putting it all together

Lets revisit our expression from before:

```
  y/\n\n/
  g/programmer/
  x/name: (.*)@*lang.*: (.*)/
  p/{1} prefers {2}/
```

If we look at each line in turn, we can follow the pipeline as it executes and see how it
breaks apart the input text to find the answer to our question:

- `y/\n\n/`

Our first operator acts as a "split" on the input text, breaking it into three blocks:
```
    name: Alice
    occupation: programmer
    language of choice: Rust
```
```
    name: Bob
    language of choice: Go
    occupation: programmer
```
```
    name: Claire
    occupation: linguist
    language of choice: French
```


- `g/programmer/`

Next, we apply a filter to accept only those blocks that contain the expression "programmer":
```
    name: Alice
    occupation: programmer
    language of choice: Rust
```
```
    name: Bob
    language of choice: Go
    occupation: programmer
```

- `x/name: (.*)@*lang.*: (.*)/`

After that we narrow the selection using another regular expression, this time extracting
submatches so we have the available for printing:
```
    name: (Alice)
    occupation: programmer
    language of choice: (Rust)
```
```
    name: (Bob)
    language of choice: (Go)
```

- `p/{1} prefers {2}/`

Finally, we use the extracted submatches to fill in our template string and print the result:

```
Alice prefers Rust
Bob prefers Go
```

Lovely!

But, what if we also want to deal with the fact that Claire is a linguist? Luckily, the we've
got one final piece of syntax to introduce that can help us out there as well.


<br>

### Mrs Robinson, are you trying to extract submatches in parallel from me?

The final trick we have up our sleeve is to enclose multiple pipelines in curly braces. Doing
so marks these separate pipelines as being run in parallel with one another over each match
that flows into the "group". Each branch of the parallel group is terminated with a semicolon
(of course) and behaves the same as any other chain of operators ending in an action. The
difference is that each match produced by the preceding operator in the pipeline is run through
all branches of the parallel group _simultaneously_.

Lets update our original expression to use a parallel group. We'll start the group once we've
split the input into blocks, adding an alternative pipeline that will run when the matched
text contains "linguist" this time:
```diff
 y/\n\n/ {
   g/programmer/
   x/name: (.*)@*lang.*: (.*)/
   p/{1} prefers {2}/;

+  g/linguist/
+  x/name: (.*)@*lang.*: (.*)/
+  p/{1} has no time for this nonsense, they're busy discussing {2}/;
 }
```

If we run this _new_ expression, we'll get the output we had before (from the original
pipeline) along with the output from our second parallel branch:
```
Alice prefers Rust
Bob prefers Go
Claire has no time for this nonsense, they're busy discussing French
```

Hopefully now you're starting to see how this sort of system can be a powerful tool to have
available! When built into a text editor, these expressions form a mini editing language
that allows you do a bunch of useful stuff.

The example we've been looking at so far has just been making use of printing. Lets try
editing the text instead using some new, non-controversial text as our input:

```
You'll make a lot of people angry if you say that Vim is better than Emacs.
(Really, we all know that Emacs is the best).
```

Now, before anyone gets upset, we can rewrite this to align to the other side of the editor
holy war (if you are that way inclined) using the following structural regular expression:

```
{
  x/Emacs/ c/Vim/;
  x/Vim/ c/Emacs/;
}
```
```
You'll make a lot of people angry if you say that Emacs is better than Vim.
(Really, we all know that Vim is the best).
```

Using a parallel group inside of our structural regular expression allows us to swap Emacs
for Vim (and vice versa) simultaneously, avoiding the all too common problem of accidentally
ending up with everything turning into "Emacs" because the replacements were run sequentially.


<br>

# Toto, I don't think we're in Bell Labs anymore

Everything we've seen so far can be found as part of the original `Sam` engine and its
derivatives, and this is perfectly fine for implementing an embedded editing language for a
text editor. But, we're missing a trick in being able to provide a _general purpose_ engine
that could be adapted for a variety of use cases.

To do _that_ we need to break things apart slightly.

Rather than interleaving the operators and actions into a single system, we can instead write
a generic engine that handles the "intentify interesting structure" side of the problem (the
operators) which then feeds that structure into the handling logic of your choice (actions
that are tailored to the problem you're trying to solve). In effect, what we end up doing is
tagging subsections of the text being searched for later processing.

Enter [structex][6]: a Rust crate I've been working on recently after overhauling the engine
inside of [ad][5] that is my attempt to write the engine I've just outlined. In addition to
the core functionality of the engine it provides a variety of pieces quality of life
functionality in order to make writing custom engines a little simpler, such as a simple
templating engine, a builder struct for configuring the behaviour of the expression compiler
and a set of traits to allow you to provide your own underlying regular expression engine if
needed.

Let's take a look at how we can use `structex` to write a minimal CLI tool that is capable
of running the grep-like pretty-printing expression we started with. If you have a local Rust
toolchain installed you can try running this by setting up a new project and adding the `regex`
and `structex` crates.
```rust
use std::collections::HashMap;
use structex::{Structex, template::Template};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // (1)
    let args: Vec<String> = std::env::args().skip(1).collect();
    let se: Structex<regex::Regex> = Structex::new(&args[0])?;
    let haystack = std::fs::read_to_string(&args[1])?;

    // (2)
    let mut templates = HashMap::new();
    for action in se.actions() {
        let arg = action.arg().unwrap();
        templates.insert(action.id(), Template::parse(arg)?);
    }

    // (3)
    for caps in se.iter_tagged_captures(haystack.as_str()) {
        let id = caps.id().unwrap();
        println!("{}", templates[&id].render(&caps)?);
    }

    Ok(())
}
```

So what's going on here?
  1. We read in our arguments from the command line and use the first to compile a new
     [Structex][7] using the regex crate as the backing engine. The second argument
     we simply read in as the haystack we're going to search.
  2. We ask our newly compiled Structex for the actions that it found in the compiled
     expression and we parse the argument to each action as a [Template][8] we can use
     later to pretty print the match.
  3. We call [iter_tagged_captures][9] to find each match inside of the haystack.
     Every time a match is found it is returned to us with its associated action,
     allowing us to look up the template and pretty print the result.

To run this, we'll need to slightly tweak the expression we used before: the `@` meta-character
we were using is a feature of `ad`'s engine and not supported by the regex crate. Luckily,
we can swap it out for `(?:.|\n)` and achieve the same effect.[^non-capturing] (Albeit with a
much uglier syntax!)
```
$ cargo run --  '
y/\n\n/ {
  g/programmer/
  x/name: (.*)(?:.|\n)*lang.*: (.*)/
  p/{1} prefers {2}/;

  g/linguist/
  x/name: (.*)(?:.|\n)*lang.*: (.*)/
  p/{1} has no time for this nonsense, they are busy discussing {2}/;
}' haystack.txt

Alice prefers Rust
Bob prefers Go
Claire has no time for this nonsense, they are busy discussing French
```

Nice!

But what if we want to run the second example? The one where we swapped "Emacs" and "Vim"?
There the semantics of what we want to do are a little different. Its more like sed where
we default to echoing out unmatched text and _modify_ the text of matches inside of that
output stream.

In that case we'll want something more like this:
```rust
use std::collections::HashMap;
use structex::{Structex, template::Template};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let se: Structex<regex::Regex> = Structex::new(&args[0])?;
    let haystack = std::fs::read_to_string(&args[1])?;

    // (1)
    let mut templates = HashMap::new();
    for action in se.actions() {
        if let Some(arg) = action.arg() {
            templates.insert(action.id(), Template::parse(arg)?);
        }
    }

    // (2)
    let mut pos = 0;

    for caps in se.iter_tagged_captures(haystack.as_str()) {
        let action = caps.action.as_ref().unwrap();
        let id = action.id();

        // (3)
        if caps.from() > pos {
            print!("{}", &haystack[pos..caps.from()]);
        }

        // (4)
        match action.tag() {
            'd' => (), // just consume the matched text
            'c' => print!("{}", templates[&id].render(&caps)?),
            'i' => print!("{}{}", templates[&id].render(&caps)?, caps.as_slice()),
            'a' => print!("{}{}", caps.as_slice(), templates[&id].render(&caps)?),
            tag => panic!("unknown action {tag}"),
        }

        // (5)
        pos = caps.to();
    }

    // (6)
    if pos < haystack.len() {
        print!("{}", &haystack[pos..]);
    }

    Ok(())
}
```

A little more going on this time:
  1. We handle our command line arguments the same way, but now when we parse our templates
     we need to skip actions that don't have a template (like our `d` delete action).
  2. In order to handle printing out unmatched text, we'll need to track where we are in
     the input before we start iterating over matches.
  3. Each time we find a match we check to see if its after our current position, if it is
     then we simply print out the unedited input up until the match.
  4. Next, we check the "tag" of the action associated with the match to determine how it
     should be handled. We still render the templates as before but how the resulting text
     makes its way into the output depends on the tag.
  5. After processing each match, we update where we are in the input before handling the
     next one.
  6. Once all of the matches have been found, we check one last time to see if we need to
     print any remaining input (otherwise we'd cut things short at the end of the final
     match!)

Phew! OK, lets test it out:
```
$ cargo run -- '{
  x/Emacs/ c/Vim/;
  x/Vim/ c/Emacs/;
}' haystack2.txt

You'll make a lot of people angry if you say that Emacs is better than Vim.
(Really, we all know that Vim is the best).
```

So far so good. We also added support for other actions so lets test them out as well:
```
$ cargo run -- '{
  n/a lot of / d;        # delete the first occurrence of "a lot of "
  x/Emacs/ i/Gnu /;      # Insert "Gnu " before each occurrence of "Emacs"
  x/Vim/ a/ (or Vi)/;    # Append " (or Vi)" after each occurrence of "Vim"
}' haystack2.txt

You'll make people angry if you say that Vim (or Vi) is better than Gnu Emacs.
(Really, we all know that Gnu Emacs is the best).
```

It works!

The `n` operator here is something we haven't seen before: it's an addition I've made to
the semantics of Sam's engine that "narrows" to the first match of the given regular
expression rather than looping over all matches. In effect it's similar to the classic
sed `s/regex/replacement/` but it allows for providing further operators or the action
of your choice in place of the fixed replacement text.


<br>

# Wrapping up[^no-misquote]

Now, there is obviously a lot of unwrapping going on in these examples and, if you experiment
a little yourself, you'll quickly find that you can get some unexpected behaviour and
crashes. To handle things more robustly we'd want to control what sorts of expressions were
permitted and we'd need to be a little more careful about how we work with the actions
associated with each match.

In the structex repo I've included some more realistic versions of these two programs in
the form of the [sgrep][10] and [ssed][11] examples. They also make use of a copy of `ad`'s
regex engine in order to support matching against streams, allowing you to run them over
standard in as well as against named files. If you like the ideas presented in this blog
post I'd encourage you to take a look and have a go at adding your own actions to see what
sorts of tools you can come up with!

To finish off I'll take one last page out of Rob Pike's book and call out some of the open
problems and areas where it might be possible to take this idea in the future. Firstly, there
are certainly multiple opportunities for improving the performance of this thing: the current
design is based on flexibility and proving out this idea of splitting apart the matching engine
and the application of actions to matches. I think that it _should_ be possible to compile
expressions down to an automata for direct, efficient execution but at that point you'd no
longer be able to bring your own regex engine. Is that worth it? I'm not sure. But it would
be fun to try out at some point. It would also be fun to take a stab at implementing a
structex based awk (as proposed by Pike in his paper) but I'll be honest, getting a full
language implemented is something I'm not sure I have time to tackle at the moment!

So there we have it. A strange new tool to add to your toolbox, or, avoid like the plague
if what you've seen here isn't to your taste. But I assume that if you've made it this far
you've at least got a passing interest in taking this thing for a spin.

Until next time, happy hacking!

<br>

---

<br>

[0]: http://doc.cat-v.org/plan_9/4th_edition/papers/sam/
[1]: http://doc.cat-v.org/bell_labs/structural_regexps/
[2]: https://en.wikipedia.org/wiki/Regular_expression
[3]: http://acme.cat-v.org/
[4]: https://github.com/martanne/vis
[5]: https://github.com/sminez/ad
[6]: https://github.com/sminez/structex
[7]: https://docs.rs/structex/latest/structex/struct.Structex.html
[8]: https://docs.rs/structex/latest/structex/template/struct.Template.html
[9]: https://docs.rs/structex/latest/structex/struct.Structex.html#method.iter_tagged_captures
[10]: https://github.com/sminez/structex/tree/main/examples/sgrep
[11]: https://github.com/sminez/structex/tree/main/examples/ssed

[^true-any]: The `@` character in the expression used to the name and language fields might
look a little odd at first glance. This is an additional meta-character in the engine used
by `ad` that acts like the normal `.` "any" meta-character but with the added power of
also matching newlines. Unimaginatively it is called "true any".

[^operators]: The characters used for each of the operators can look a little confusing at
first glance. `x` is shorthand for "extract matches", while `g` is a "guard" (so far so good).
`y` on the other hand is "split on each match", with the character simply being "close to x".
At least `v` can be remembered as an "inVerted match" I suppose.

[^templating]: Sam's print didn't support templating and the template syntax shown here is
a minimal built in system specific to the engine we're presenting in this blog post. But
really, swapping in the templating engine of your choice is a simple change to make if you
find yourself needing more expressive power.

[^non-capturing]: The `?:` prefix here inside of the parentheses is to mark the group as
non-capturing. Without this, this will become our second capture group and our `{2}` template
variable will print the wrong thing!

[^no-misquote]: I couldn't think of a quote to butcher for this one. I'm sorry for failing you.
