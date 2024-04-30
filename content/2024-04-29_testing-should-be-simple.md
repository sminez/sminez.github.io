+++
title = "Testing Should Be Simple"
draft = true

[taxonomies]
tags = [ "programming", "rust", "testing" ]
+++

> _Or, "How to set yourself up for success when everything is on fire"_

We all know that testing is important.

If you currently _don't_ know this or otherwise take issue with this statement then please
humour me for now and keep what follows in mind for your first encounter with trying to fix
a mind bending bug affecting a live system.

<!-- more -->

There are of course almost as many thought pieces, frameworks and methodologies on software
testing as there are software engineers (a situation I am fully aware that I am adding to)
so why should you care what I have to say on the matter?

Well for one thing, in a previous job I was responsible for designing, writing, maintaining
and the tooling that formed the company's internal developer platform. My team's software
was (and still is!) responsible for our colleagues ability to track, deploy and smoke test
their web services as they rolled out to production.

- A team's build failed because recording the meta-data broke? Our problem.
- Deployment failed because parameterising the pipeline messed up? Our problem.
- Testing that a new feature has successfully gone live failed because the test orchestrator
  was unable to find the relevant config? Our problem.

You get the idea.

For another thing, that team was small enough that you could count the number of members
(including me) on one hand after being involved in an unfortunate woodworking accident.

So it's safe to say that we became pretty good at knowing how to make the most of our
limited resources: no one wants to be front and center on an incident call with everyone
else waiting for _you_ to solve the problem.

<br>

# Maintaining software is harder than writing it

The first and most important thing to acknowledge is that it is orders of magnitude simpler
to sit down and write software (with all the relevant context in your head) than it is to
return to existing software at a later date and try to make sense of it.

<br>

# Minimising complexity to maximise your sanity

<br>

# Writing your business logic with testing in mind
