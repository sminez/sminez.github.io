+++
title = "Comparing metrics"
+++

## Comparing Space-Time Metrics

An attempt at categorising the differences between the `+---` and `-+++` metrics
when used with the 0i ("logical") space-time bivector ordering.

At present, this is NOT complete and should be added to as further cases and
examples are found.


### Program

```python
from itertools import groupby
from functools import reduce
from operator import mul
from arpy import ARContext, __version__, commutator, dagger, sign_cayley, sign_distribution


PRINT_ALL = False
ALLOWED = "p 23 31 12 0 023 031 012 123 1 2 3 0123 01 02 03".split()
EXYZ_ALLOWED = "p 0 123 0123 23 023 1 01 31 031 2 02 12 012 3 03".split()


print("Computed using arpy version %s" % __version__)


def compare_configs(allowed=ALLOWED, func=None):
    """
    Take a function and feed it both configs so we can compare the two.
    This is _not_ a normal decorator, it will call the functions immediately
    when the script is run.
    """
    # Hack to add arguments to a decorator
    if func is None:
        return lambda f: compare_configs(allowed=allowed, func=f)

    pmmm = ARContext(allowed, "+---", "into", print_all=PRINT_ALL)
    mppp = ARContext(allowed, "-+++", "by", print_all=PRINT_ALL)

    # Print the name of the function and its docstring
    qname = func.__qualname__
    print("\n.: %s :." % qname)
    print("=" * (len(qname) + 6))
    print(func.__doc__)

    # Iterate over the configs
    for ctx in [pmmm, mppp]:
        print("[%s]" % "".join("+" if m == 1 else "-" for m in ctx.metric))
        func(ctx)
        print("")


@compare_configs()
def squaring_to_neg_alpha_p(ctx):
    """
    One of the primary differences between metrics is in which elements
    square to -αp. This affects which elements support oscillations amongst
    other things.
    """
    pos = []
    neg = []

    with ctx as ar:
        for a in ar.allowed:
            res = ar("a%s a%s" % (a, a)).sign
            if res == 1:
                pos.append("α%s" % a)
            else:
                neg.append("α%s" % a)

        print(" αp:  %s" % ", ".join(pos))
        print("-αp:  %s" % ", ".join(neg))


@compare_configs()
def square_of_a_vector(ctx):
    """
    The square of a 4Vector should be an invariant scalar (== 0 for light).
    """
    with ctx as ar:
        v = ar("{0 1 2 3}")
        v_2 = ar("v v")
        print("v = %s" % v)
        print("\nv² = %s" % v_2)


@compare_configs()
def handedness_under_product(ctx):
    """
    The 3D handedness of each of the 3Vectors when forming products
    between the elements of the 3Vector. This is computed using:
        x y = z    --> Right Handed
        x y = -z   --> Left Handed
    """
    with ctx as ar:
        # Pull out the definitions of B, T, A, E
        for vec in "BTAE":
            comps = ar.cfg.zet_comps[vec]
            sign = ar("a%s a%s" % (comps["x"], comps["y"])).sign
            handedness = "RH" if sign == 1 else "LH"
            print("%s:  %s" % (vec, handedness))


@compare_configs()
def handedness_under_rotation(ctx):
    """
    The 3D handedness of each of the 3Vectors when forming products
    between the elements of the 3Vector and a space-space bivector.
        α23 y = z     --> Right Handed
        α23 y = -z    --> Left Handed
    """
    with ctx as ar:
        # Pull out the definitions of B, T, A, E
        for vec in "BTAE":
            comps = ar.cfg.zet_comps[vec]
            sign = ar("a%s a%s" % ("23", comps["y"])).sign
            handedness = "RH" if sign == 1 else "LH"
            print("%s:  %s" % (vec, handedness))


@compare_configs()
def full_handedness(ctx):
    """
    Look at the handedness of all 3Vector interactions.
        x y = z   --> Right Handed (□)
        x y = -z  --> Left Handed  (■)
    """
    with ctx as ar:
        # Pull out the definitions of B, T, A, E
        print("   B T A E")
        for vec1 in "BTAE":
            print(vec1, end="  ")
            for vec2 in "BTAE":
                comps = ar.cfg.zet_comps
                v1, v2 = comps[vec1], comps[vec2]
                sign = ar("a%s a%s" % (v1["x"], v2["y"])).sign
                handedness = "□" if sign == 1 else "■"
                print(handedness, end=" ")
            print("")


@compare_configs()
def zet_sign_distribution(ctx):
    """
    The full sign Cayley table above can be broken down into five groups that
    always have a consistent sign:

      ∂e |■ □ □ □|  ∂Ξ |□ ■ ■ ■|   ∇ |□ □ □ □|  ∇• |□ □ □ □|  ∇x |□ □ □ □|
         |□ □ □ □|     |□ □ □ □|     |■ □ □ □|     |□ ■ □ □|     |□ □ ■ ■|
         |□ □ □ □|     |□ □ □ □|     |■ □ □ □|     |□ □ ■ □|     |□ ■ □ ■|
         |□ □ □ □|     |□ □ □ □|     |■ □ □ □|     |□ □ □ ■|     |□ ■ ■ □|

    (Note that, in the case of the curl (∇x), □ represents a Right Handed
     set and ■ a Left Handed set.)
    In the following diagrams, the rows and columns are the 3Vector(+extra)
    sets: `B T A E`.

    """
    with ctx as ar:
        sign_distribution(cfg=ar.cfg)


@compare_configs(allowed=EXYZ_ALLOWED)
def exyz_sign_distribution(ctx):
    """
    When the grouping / ordering of the components is changed to group
    by exyz first and then by 3Vector, the sign distribution may shed
    some light on the sign distribution of the algebra.

    This time, the rows/columns are `e x y z` and the meaning of the diagrams
    is no longer the traditional vector calculus indicated by the notation.
    (Strictly, I should write another function that uses different notation but
     I'm not sure what to use yet / if this is at all useful!)
    """
    with ctx as ar:
        sign_distribution(cfg=ar.cfg)


@compare_configs()
def maxwell_is_maintained(ctx):
    """
    Maxwell's Equations should have the correct or inverted signs. The sign
    of vector, trivector, pivot, hedgehog and quedgehog terms are unknown
    as of now.
    """
    # These are the signs of the relevant components, computed using division
    # into and i0 using the following code:
    # ------------------------------------------------------------------------
    # Dg = Dmu(G)
    # MAXWELL = [
    #     [
    #         k.sign
    #         for k in sorted(Dg[blade], key=lambda k: k._component_partials)
    #         if k._components[0].val not in ["p", "0123"]
    #     ]
    #     for blade in "123 1 2 3 0 023 031 012".split()
    # ]
    # NEG_MAXWELL = [
    #     [
    #         k.sign * -1
    #         for k in sorted(Dg[blade], key=lambda k: k._component_partials)
    #         if k._components[0].val not in ["p", "0123"]
    #     ]
    #     for blade in "123 1 2 3 0 023 031 012".split()
    # ]
    MAXWELL = [
        [-1, -1, -1],
        [1, -1, 1],
        [-1, 1, 1],
        [1, -1, 1],
        [-1, -1, -1],
        [1, -1, 1],
        [1, 1, -1],
        [1, -1, 1],
    ]
    NEG_MAXWELL = [
        [1, 1, 1],
        [-1, 1, -1],
        [1, -1, -1],
        [-1, 1, -1],
        [1, 1, 1],
        [-1, 1, -1],
        [-1, -1, 1],
        [-1, 1, -1],
    ]

    with ctx as ar:
        XiG = "{%s}" % " ".join(ar.allowed)
        Dg = ar("<0 1 2 3> %s" % XiG)

        # Ignoring the sign of pivot terms as they are not governed by maxwell
        maxwell_signs = [
            [
                k.sign
                for k in sorted(Dg[blade], key=lambda k: k._component_partials)
                if k._components[0].val not in ["p", ar.cfg.allowed[-4]]
            ]
            for blade in ["0", "1", "2", "3", "123", "023", "031", "012"]
        ]

        if maxwell_signs == MAXWELL:
            print("Gives conventional Maxwell")
        elif maxwell_signs == NEG_MAXWELL:
            print("Gives inverted Maxwell")
        else:
            print("Does not give Maxwell")

        print(Dg)


@compare_configs()
def FF_dagger_force_equation(ctx):
    """
    F F_dagger style products should exhibit cancelation and lead to force
    equations.
    """
    with ctx as ar:
        F = ar("{ 23 31 12 01 02 03 }")
        res = ar("F F!")
        print("F = %s\n" % F)
        print("F_dagger = %s\n" % dagger(F, cfg=ar.cfg))
        print("F F_dagger = %s" % res)


@compare_configs()
def GG_dagger_force_equation(ctx):
    """
    G G_dagger style products should exhibit cancelation and lead to force
    equations.
    """
    with ctx as ar:
        G = ar("{%s}" % " ".join(ar.cfg.allowed))
        res = ar("G G!")
        print("G = %s\n" % G)
        print("G_dagger = %s\n" % dagger(G, cfg=ar.cfg))
        print("G G_dagger = %s" % res)


@compare_configs()
def group_commutator_full(ctx):
    """
    Compute the group commutator [a, b] = (a b a^-1 b^-1) for each combination
    of a and b in the algebra.

    [a, b] =  αp  --> □
    [a, b] = -αp  --> ■
    """
    with ctx as ar:
        sign_cayley(commutator, cfg=ar.cfg)


@compare_configs()
def group_commutator_distribution(ctx):
    """
    This is the same idea as above, combined with the sign distribution format
    from before that looks at vector calculus groupings.

    [a, b] =  αp  --> □
    [a, b] = -αp  --> ■
    """
    with ctx as ar:
        sign_distribution(commutator, cfg=ar.cfg)


@compare_configs()
def FF_dagger_signs(ctx):
    """
    Sign distributions for FF! force equations
    """

    with ctx as ar:
        for alpha, terms in groupby(ar("F F!"), lambda t: t._alpha):
            signs = " ".join(["□" if t._sign == -1 else "■" for t in terms])
            print(f"{str(alpha).ljust(5)} {signs}")


@compare_configs()
def split_sign(ctx):
    """
    There are (at least) two sources of sign under the full product: ordering of
    terms so that they can be contracted and the effect of the metric on contraction.
    The sign due to ordering is independent of the metric but _not_ of the defined
    positive orientations of each element.

    In the output below:
        cancellation negative = '◢ '
        ordering negative     = '◤ '
        both negative         = '■ '
        both positive         = '□ '
    """
    neg_cancel = "◢"
    neg_pop = "◤"
    neg_both = "■"
    pos_both = "□"
    signs = {
        (1, 1): pos_both,
        (-1, 1): neg_cancel,
        (1, -1): neg_pop,
        (-1, -1): neg_both,
    }

    with ctx as ar:
        G = ar("G")
        metric = dict(zip("0123", ar.cfg.metric))

        for i, left in enumerate(G):
            if i % 4 == 0:
                print()

            print(repr(left.alpha).ljust(7), end=" ")

            for j, right in enumerate(G):
                cancelled_indices = set(left.index).intersection(set(right.index))
                if len(cancelled_indices) > 0:
                    c_sign = reduce(mul, (metric.get(i, 1) for i in cancelled_indices))
                else:
                    c_sign = 1

                p_sign = c_sign / ar("left ^ right").sign
                print(signs[(p_sign, c_sign)], end=" ")
                if j % 4 == 3:
                    print(" ", end="")

            print()
```


### Output

```
$ python3 comp_metric.py

Computed using arpy version 0.3.7

.: squaring_to_neg_alpha_p :.
=============================

    One of the primary differences between metrics is in which elements
    square to -αp. This affects which elements support oscillations amongst
    other things.

[+---]
 αp:  αp, α0, α123, α01, α02, α03
-αp:  α23, α31, α12, α023, α031, α012, α1, α2, α3, α0123

[-+++]
 αp:  αp, α023, α031, α012, α1, α2, α3, α01, α02, α03
-αp:  α23, α31, α12, α0, α123, α0123


.: square_of_a_vector :.
========================

    The square of a 4Vector should be an invariant scalar (== 0 for light).

[+---]
v = {
  α₀   ( ξ₀ )
  α₁   ( ξ₁ )
  α₂   ( ξ₂ )
  α₃   ( ξ₃ )
}

v² = {
  αₚ   ( ξ₀^2 - ξ₁^2 - ξ₂^2 - ξ₃^2 )
  α₂₃  ( ξ₂.ξ₃ - ξ₂.ξ₃ )
  α₃₁  ( - ξ₁.ξ₃ + ξ₁.ξ₃ )
  α₁₂  ( ξ₁.ξ₂ - ξ₁.ξ₂ )
  α₀₁  ( ξ₀.ξ₁ - ξ₀.ξ₁ )
  α₀₂  ( ξ₀.ξ₂ - ξ₀.ξ₂ )
  α₀₃  ( ξ₀.ξ₃ - ξ₀.ξ₃ )
}

[-+++]
v = {
  α₀   ( ξ₀ )
  α₁   ( ξ₁ )
  α₂   ( ξ₂ )
  α₃   ( ξ₃ )
}

v² = {
  αₚ   ( - ξ₀^2 + ξ₁^2 + ξ₂^2 + ξ₃^2 )
  α₂₃  ( ξ₂.ξ₃ - ξ₂.ξ₃ )
  α₃₁  ( - ξ₁.ξ₃ + ξ₁.ξ₃ )
  α₁₂  ( ξ₁.ξ₂ - ξ₁.ξ₂ )
  α₀₁  ( ξ₀.ξ₁ - ξ₀.ξ₁ )
  α₀₂  ( ξ₀.ξ₂ - ξ₀.ξ₂ )
  α₀₃  ( ξ₀.ξ₃ - ξ₀.ξ₃ )
}


.: handedness_under_product :.
==============================

    The 3D handedness of each of the 3Vectors when forming products
    between the elements of the 3Vector. This is computed using:
        x y = z    --> Right Handed
        x y = -z   --> Left Handed

[+---]
B:  RH
T:  RH
A:  RH
E:  LH

[-+++]
B:  LH
T:  RH
A:  RH
E:  RH


.: handedness_under_rotation :.
===============================

    The 3D handedness of each of the 3Vectors when forming products
    between the elements of the 3Vector and a space-space bivector.
        α23 y = z     --> Right Handed
        α23 y = -z    --> Left Handed

[+---]
B:  RH
T:  RH
A:  RH
E:  RH

[-+++]
B:  LH
T:  LH
A:  LH
E:  LH


.: full_handedness :.
=====================

    Look at the handedness of all 3Vector interactions.
        x y = z   --> Right Handed (□)
        x y = -z  --> Left Handed  (■)

[+---]
   B T A E
B  □ □ □ □
T  □ □ □ □
A  □ ■ □ ■
E  □ ■ □ ■

[-+++]
   B T A E
B  ■ ■ ■ ■
T  ■ □ ■ □
A  ■ □ □ ■
E  ■ ■ □ □


.: zet_sign_distribution :.
===========================

    The full sign Cayley table above can be broken down into five groups that
    always have a consistent sign:

      ∂e |■ □ □ □|  ∂Ξ |□ ■ ■ ■|   ∇ |□ □ □ □|  ∇• |□ □ □ □|  ∇x |□ □ □ □|
         |□ □ □ □|     |□ □ □ □|     |■ □ □ □|     |□ ■ □ □|     |□ □ ■ ■|
         |□ □ □ □|     |□ □ □ □|     |■ □ □ □|     |□ □ ■ □|     |□ ■ □ ■|
         |□ □ □ □|     |□ □ □ □|     |■ □ □ □|     |□ □ □ ■|     |□ ■ ■ □|

    (Note that, in the case of the curl (∇x), □ represents a Right Handed
     set and ■ a Left Handed set.)
    In the following diagrams, the rows and columns are the 3Vector(+extra)
    sets: `B T A E`.


[+---]
 ∂e |□ □ □ □|  ∂Ξ |□ □ □ □|   ∇ |□ □ ■ ■|  ∇• |■ ■ □ □|  ∇x |□ □ □ □|
    |□ □ □ □|     |□ □ □ □|     |□ □ ■ ■|     |■ ■ □ □|     |□ □ □ □|
    |□ ■ □ ■|     |■ □ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ □ ■|
    |□ ■ □ ■|     |■ □ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ □ ■|

[-+++]
 ∂e |□ □ □ □|  ∂Ξ |□ □ □ □|   ∇ |□ □ ■ ■|  ∇• |■ ■ □ □|  ∇x |■ ■ ■ ■|
    |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ ■ □|     |■ □ □ ■|     |■ □ ■ □|
    |□ ■ ■ □|     |■ □ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |■ □ □ ■|
    |□ □ ■ ■|     |■ ■ □ □|     |□ □ □ □|     |□ □ □ □|     |■ ■ □ □|


.: exyz_sign_distribution :.
============================

    When the grouping / ordering of the components is changed to group
    by exyz first and then by 3Vector, the sign distribution may shed
    some light on the sign distribution of the algebra.

    This time, the rows/columns are `e x y z` and the meaning of the diagrams
    is no longer the traditional vector calculus indicated by the notation.
    (Strictly, I should write another function that uses different notation but
     I'm not sure what to use yet / if this is at all useful!)

[+---]
 ∂e |□ □ □ □|  ∂Ξ |□ □ □ □|   ∇ |□ □ □ □|  ∇• |□ □ □ □|  ∇x |■ □ □ □|
    |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |■ ■ ■ □|
    |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |■ □ ■ ■|
    |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |■ ■ □ ■|

[-+++]
 ∂e |□ □ □ □|  ∂Ξ |□ □ □ □|   ∇ |□ □ □ □|  ∇• |■ ■ ■ ■|  ∇x |□ ■ ■ ■|
    |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |■ □ □ ■|     |□ □ ■ □|
    |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |■ ■ □ □|     |□ □ □ ■|
    |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |■ □ ■ □|     |□ ■ □ □|


.: maxwell_is_maintained :.
===========================

    Maxwell's Equations should have the correct or inverted signs. The sign
    of vector, trivector, pivot, hedgehog and quedgehog terms are unknown
    as of now.

[+---]
Gives conventional Maxwell
{
  αₚ   ( ∂₀ξ₀ + ∂₁ξ₁ + ∂₂ξ₂ + ∂₃ξ₃ )
  α₂₃  ( ∂₀ξ₀₂₃ + ∂₁ξ₁₂₃ + ∂₃ξ₂ - ∂₂ξ₃ )
  α₃₁  ( ∂₀ξ₀₃₁ + ∂₂ξ₁₂₃ - ∂₃ξ₁ + ∂₁ξ₃ )
  α₁₂  ( ∂₀ξ₀₁₂ + ∂₃ξ₁₂₃ + ∂₂ξ₁ - ∂₁ξ₂ )
  α₀   ( ∂₀ξₚ - ∂₁ξ₀₁ - ∂₂ξ₀₂ - ∂₃ξ₀₃ )
  α₀₂₃ ( ∂₀ξ₂₃ - ∂₁ξ₀₁₂₃ - ∂₃ξ₀₂ + ∂₂ξ₀₃ )
  α₀₃₁ ( ∂₀ξ₃₁ - ∂₂ξ₀₁₂₃ + ∂₃ξ₀₁ - ∂₁ξ₀₃ )
  α₀₁₂ ( ∂₀ξ₁₂ - ∂₃ξ₀₁₂₃ - ∂₂ξ₀₁ + ∂₁ξ₀₂ )
  α₁₂₃ ( - ∂₁ξ₂₃ - ∂₂ξ₃₁ - ∂₃ξ₁₂ + ∂₀ξ₀₁₂₃ )
  α₁   ( - ∂₁ξₚ + ∂₃ξ₃₁ - ∂₂ξ₁₂ + ∂₀ξ₀₁ )
  α₂   ( - ∂₂ξₚ - ∂₃ξ₂₃ + ∂₁ξ₁₂ + ∂₀ξ₀₂ )
  α₃   ( - ∂₃ξₚ + ∂₂ξ₂₃ - ∂₁ξ₃₁ + ∂₀ξ₀₃ )
  α₀₁₂₃( ∂₁ξ₀₂₃ + ∂₂ξ₀₃₁ + ∂₃ξ₀₁₂ + ∂₀ξ₁₂₃ )
  α₀₁  ( ∂₁ξ₀ - ∂₃ξ₀₃₁ + ∂₂ξ₀₁₂ + ∂₀ξ₁ )
  α₀₂  ( ∂₂ξ₀ + ∂₃ξ₀₂₃ - ∂₁ξ₀₁₂ + ∂₀ξ₂ )
  α₀₃  ( ∂₃ξ₀ - ∂₂ξ₀₂₃ + ∂₁ξ₀₃₁ + ∂₀ξ₃ )
}

[-+++]
Gives inverted Maxwell
{
  αₚ   ( ∂₀ξ₀ + ∂₁ξ₁ + ∂₂ξ₂ + ∂₃ξ₃ )
  α₂₃  ( ∂₀ξ₀₂₃ + ∂₁ξ₁₂₃ + ∂₃ξ₂ - ∂₂ξ₃ )
  α₃₁  ( ∂₀ξ₀₃₁ + ∂₂ξ₁₂₃ - ∂₃ξ₁ + ∂₁ξ₃ )
  α₁₂  ( ∂₀ξ₀₁₂ + ∂₃ξ₁₂₃ + ∂₂ξ₁ - ∂₁ξ₂ )
  α₀   ( - ∂₀ξₚ + ∂₁ξ₀₁ + ∂₂ξ₀₂ + ∂₃ξ₀₃ )
  α₀₂₃ ( - ∂₀ξ₂₃ + ∂₁ξ₀₁₂₃ + ∂₃ξ₀₂ - ∂₂ξ₀₃ )
  α₀₃₁ ( - ∂₀ξ₃₁ + ∂₂ξ₀₁₂₃ - ∂₃ξ₀₁ + ∂₁ξ₀₃ )
  α₀₁₂ ( - ∂₀ξ₁₂ + ∂₃ξ₀₁₂₃ + ∂₂ξ₀₁ - ∂₁ξ₀₂ )
  α₁₂₃ ( ∂₁ξ₂₃ + ∂₂ξ₃₁ + ∂₃ξ₁₂ - ∂₀ξ₀₁₂₃ )
  α₁   ( ∂₁ξₚ - ∂₃ξ₃₁ + ∂₂ξ₁₂ - ∂₀ξ₀₁ )
  α₂   ( ∂₂ξₚ + ∂₃ξ₂₃ - ∂₁ξ₁₂ - ∂₀ξ₀₂ )
  α₃   ( ∂₃ξₚ - ∂₂ξ₂₃ + ∂₁ξ₃₁ - ∂₀ξ₀₃ )
  α₀₁₂₃( ∂₁ξ₀₂₃ + ∂₂ξ₀₃₁ + ∂₃ξ₀₁₂ + ∂₀ξ₁₂₃ )
  α₀₁  ( ∂₁ξ₀ - ∂₃ξ₀₃₁ + ∂₂ξ₀₁₂ + ∂₀ξ₁ )
  α₀₂  ( ∂₂ξ₀ + ∂₃ξ₀₂₃ - ∂₁ξ₀₁₂ + ∂₀ξ₂ )
  α₀₃  ( ∂₃ξ₀ - ∂₂ξ₀₂₃ + ∂₁ξ₀₃₁ + ∂₀ξ₃ )
}


.: FF_dagger_force_equation :.
==============================

    F F_dagger style products should exhibit cancelation and lead to force
    equations.

[+---]
F = {
  α₂₃  ( ξ₂₃ )
  α₃₁  ( ξ₃₁ )
  α₁₂  ( ξ₁₂ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

F_dagger = {
  α₂₃  ( - ξ₂₃ )
  α₃₁  ( - ξ₃₁ )
  α₁₂  ( - ξ₁₂ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

F F_dagger = {
  αₚ   ( - ξ₂₃^2 - ξ₃₁^2 - ξ₁₂^2 + ξ₀₁^2 + ξ₀₂^2 + ξ₀₃^2 )
  α₂₃  ( - ξ₃₁.ξ₁₂ + ξ₃₁.ξ₁₂ + ξ₀₂.ξ₀₃ - ξ₀₂.ξ₀₃ )
  α₃₁  ( ξ₂₃.ξ₁₂ - ξ₂₃.ξ₁₂ - ξ₀₁.ξ₀₃ + ξ₀₁.ξ₀₃ )
  α₁₂  ( - ξ₂₃.ξ₃₁ + ξ₂₃.ξ₃₁ + ξ₀₁.ξ₀₂ - ξ₀₁.ξ₀₂ )
  α₀₁₂₃( - 2ξ₂₃.ξ₀₁ - 2ξ₃₁.ξ₀₂ - 2ξ₁₂.ξ₀₃ )
  α₀₁  ( ξ₃₁.ξ₀₃ - ξ₃₁.ξ₀₃ - ξ₁₂.ξ₀₂ + ξ₁₂.ξ₀₂ )
  α₀₂  ( - ξ₂₃.ξ₀₃ + ξ₂₃.ξ₀₃ + ξ₁₂.ξ₀₁ - ξ₁₂.ξ₀₁ )
  α₀₃  ( ξ₂₃.ξ₀₂ - ξ₂₃.ξ₀₂ - ξ₃₁.ξ₀₁ + ξ₃₁.ξ₀₁ )
}

[-+++]
F = {
  α₂₃  ( ξ₂₃ )
  α₃₁  ( ξ₃₁ )
  α₁₂  ( ξ₁₂ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

F_dagger = {
  α₂₃  ( - ξ₂₃ )
  α₃₁  ( - ξ₃₁ )
  α₁₂  ( - ξ₁₂ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

F F_dagger = {
  αₚ   ( - ξ₂₃^2 - ξ₃₁^2 - ξ₁₂^2 + ξ₀₁^2 + ξ₀₂^2 + ξ₀₃^2 )
  α₂₃  ( ξ₃₁.ξ₁₂ - ξ₃₁.ξ₁₂ - ξ₀₂.ξ₀₃ + ξ₀₂.ξ₀₃ )
  α₃₁  ( - ξ₂₃.ξ₁₂ + ξ₂₃.ξ₁₂ + ξ₀₁.ξ₀₃ - ξ₀₁.ξ₀₃ )
  α₁₂  ( ξ₂₃.ξ₃₁ - ξ₂₃.ξ₃₁ - ξ₀₁.ξ₀₂ + ξ₀₁.ξ₀₂ )
  α₀₁₂₃( - 2ξ₂₃.ξ₀₁ - 2ξ₃₁.ξ₀₂ - 2ξ₁₂.ξ₀₃ )
  α₀₁  ( - ξ₃₁.ξ₀₃ + ξ₃₁.ξ₀₃ + ξ₁₂.ξ₀₂ - ξ₁₂.ξ₀₂ )
  α₀₂  ( ξ₂₃.ξ₀₃ - ξ₂₃.ξ₀₃ - ξ₁₂.ξ₀₁ + ξ₁₂.ξ₀₁ )
  α₀₃  ( - ξ₂₃.ξ₀₂ + ξ₂₃.ξ₀₂ + ξ₃₁.ξ₀₁ - ξ₃₁.ξ₀₁ )
}


.: GG_dagger_force_equation :.
==============================

    G G_dagger style products should exhibit cancelation and lead to force
    equations.

[+---]
G = {
  αₚ   ( ξₚ )
  α₂₃  ( ξ₂₃ )
  α₃₁  ( ξ₃₁ )
  α₁₂  ( ξ₁₂ )
  α₀   ( ξ₀ )
  α₀₂₃ ( ξ₀₂₃ )
  α₀₃₁ ( ξ₀₃₁ )
  α₀₁₂ ( ξ₀₁₂ )
  α₁₂₃ ( ξ₁₂₃ )
  α₁   ( ξ₁ )
  α₂   ( ξ₂ )
  α₃   ( ξ₃ )
  α₀₁₂₃( ξ₀₁₂₃ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

G_dagger = {
  αₚ   ( ξₚ )
  α₂₃  ( - ξ₂₃ )
  α₃₁  ( - ξ₃₁ )
  α₁₂  ( - ξ₁₂ )
  α₀   ( ξ₀ )
  α₀₂₃ ( - ξ₀₂₃ )
  α₀₃₁ ( - ξ₀₃₁ )
  α₀₁₂ ( - ξ₀₁₂ )
  α₁₂₃ ( ξ₁₂₃ )
  α₁   ( - ξ₁ )
  α₂   ( - ξ₂ )
  α₃   ( - ξ₃ )
  α₀₁₂₃( - ξ₀₁₂₃ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

G G_dagger = {
  αₚ   ( ξₚ^2 - ξ₂₃^2 - ξ₃₁^2 - ξ₁₂^2 + ξ₀^2 - ξ₀₂₃^2 - ξ₀₃₁^2 - ξ₀₁₂^2 + ξ₁₂₃^2 - ξ₁^2 - ξ₂^2 - ξ₃^2 - ξ₀₁₂₃^2 + ξ₀₁^2 + ξ₀₂^2 + ξ₀₃^2 )
  α₂₃  ( - 2ξₚ.ξ₂₃ - ξ₃₁.ξ₁₂ + ξ₃₁.ξ₁₂ - 2ξ₀.ξ₀₂₃ - ξ₀₃₁.ξ₀₁₂ + ξ₀₃₁.ξ₀₁₂ + 2ξ₁₂₃.ξ₁ - ξ₂.ξ₃ + ξ₂.ξ₃ - 2ξ₀₁₂₃.ξ₀₁ + ξ₀₂.ξ₀₃ - ξ₀₂.ξ₀₃ )
  α₃₁  ( - 2ξₚ.ξ₃₁ + ξ₂₃.ξ₁₂ - ξ₂₃.ξ₁₂ - 2ξ₀.ξ₀₃₁ + ξ₀₂₃.ξ₀₁₂ - ξ₀₂₃.ξ₀₁₂ + 2ξ₁₂₃.ξ₂ + ξ₁.ξ₃ - ξ₁.ξ₃ - 2ξ₀₁₂₃.ξ₀₂ - ξ₀₁.ξ₀₃ + ξ₀₁.ξ₀₃ )
  α₁₂  ( - 2ξₚ.ξ₁₂ - ξ₂₃.ξ₃₁ + ξ₂₃.ξ₃₁ - 2ξ₀.ξ₀₁₂ - ξ₀₂₃.ξ₀₃₁ + ξ₀₂₃.ξ₀₃₁ + 2ξ₁₂₃.ξ₃ - ξ₁.ξ₂ + ξ₁.ξ₂ - 2ξ₀₁₂₃.ξ₀₃ + ξ₀₁.ξ₀₂ - ξ₀₁.ξ₀₂ )
  α₀   ( 2ξₚ.ξ₀ - 2ξ₂₃.ξ₀₂₃ - 2ξ₃₁.ξ₀₃₁ - 2ξ₁₂.ξ₀₁₂ - ξ₁₂₃.ξ₀₁₂₃ + ξ₁₂₃.ξ₀₁₂₃ + ξ₁.ξ₀₁ - ξ₁.ξ₀₁ + ξ₂.ξ₀₂ - ξ₂.ξ₀₂ + ξ₃.ξ₀₃ - ξ₃.ξ₀₃ )
  α₀₂₃ ( - 2ξₚ.ξ₀₂₃ - 2ξ₂₃.ξ₀ - ξ₃₁.ξ₀₁₂ + ξ₃₁.ξ₀₁₂ + ξ₁₂.ξ₀₃₁ - ξ₁₂.ξ₀₃₁ - ξ₁₂₃.ξ₀₁ + ξ₁₂₃.ξ₀₁ - ξ₁.ξ₀₁₂₃ + ξ₁.ξ₀₁₂₃ + 2ξ₂.ξ₀₃ - 2ξ₃.ξ₀₂ )
  α₀₃₁ ( - 2ξₚ.ξ₀₃₁ + ξ₂₃.ξ₀₁₂ - ξ₂₃.ξ₀₁₂ - 2ξ₃₁.ξ₀ - ξ₁₂.ξ₀₂₃ + ξ₁₂.ξ₀₂₃ - ξ₁₂₃.ξ₀₂ + ξ₁₂₃.ξ₀₂ - 2ξ₁.ξ₀₃ - ξ₂.ξ₀₁₂₃ + ξ₂.ξ₀₁₂₃ + 2ξ₃.ξ₀₁ )
  α₀₁₂ ( - 2ξₚ.ξ₀₁₂ - ξ₂₃.ξ₀₃₁ + ξ₂₃.ξ₀₃₁ + ξ₃₁.ξ₀₂₃ - ξ₃₁.ξ₀₂₃ - 2ξ₁₂.ξ₀ - ξ₁₂₃.ξ₀₃ + ξ₁₂₃.ξ₀₃ + 2ξ₁.ξ₀₂ - 2ξ₂.ξ₀₁ - ξ₃.ξ₀₁₂₃ + ξ₃.ξ₀₁₂₃ )
  α₁₂₃ ( 2ξₚ.ξ₁₂₃ + 2ξ₂₃.ξ₁ + 2ξ₃₁.ξ₂ + 2ξ₁₂.ξ₃ + ξ₀.ξ₀₁₂₃ - ξ₀.ξ₀₁₂₃ + ξ₀₂₃.ξ₀₁ - ξ₀₂₃.ξ₀₁ + ξ₀₃₁.ξ₀₂ - ξ₀₃₁.ξ₀₂ + ξ₀₁₂.ξ₀₃ - ξ₀₁₂.ξ₀₃ )
  α₁   ( - 2ξₚ.ξ₁ + 2ξ₂₃.ξ₁₂₃ - ξ₃₁.ξ₃ + ξ₃₁.ξ₃ + ξ₁₂.ξ₂ - ξ₁₂.ξ₂ - ξ₀.ξ₀₁ + ξ₀.ξ₀₁ + ξ₀₂₃.ξ₀₁₂₃ - ξ₀₂₃.ξ₀₁₂₃ - 2ξ₀₃₁.ξ₀₃ + 2ξ₀₁₂.ξ₀₂ )
  α₂   ( - 2ξₚ.ξ₂ + ξ₂₃.ξ₃ - ξ₂₃.ξ₃ + 2ξ₃₁.ξ₁₂₃ - ξ₁₂.ξ₁ + ξ₁₂.ξ₁ - ξ₀.ξ₀₂ + ξ₀.ξ₀₂ + 2ξ₀₂₃.ξ₀₃ + ξ₀₃₁.ξ₀₁₂₃ - ξ₀₃₁.ξ₀₁₂₃ - 2ξ₀₁₂.ξ₀₁ )
  α₃   ( - 2ξₚ.ξ₃ - ξ₂₃.ξ₂ + ξ₂₃.ξ₂ + ξ₃₁.ξ₁ - ξ₃₁.ξ₁ + 2ξ₁₂.ξ₁₂₃ - ξ₀.ξ₀₃ + ξ₀.ξ₀₃ - 2ξ₀₂₃.ξ₀₂ + 2ξ₀₃₁.ξ₀₁ + ξ₀₁₂.ξ₀₁₂₃ - ξ₀₁₂.ξ₀₁₂₃ )
  α₀₁₂₃( - 2ξₚ.ξ₀₁₂₃ - 2ξ₂₃.ξ₀₁ - 2ξ₃₁.ξ₀₂ - 2ξ₁₂.ξ₀₃ - ξ₀.ξ₁₂₃ + ξ₀.ξ₁₂₃ - ξ₀₂₃.ξ₁ + ξ₀₂₃.ξ₁ - ξ₀₃₁.ξ₂ + ξ₀₃₁.ξ₂ - ξ₀₁₂.ξ₃ + ξ₀₁₂.ξ₃ )
  α₀₁  ( 2ξₚ.ξ₀₁ - 2ξ₂₃.ξ₀₁₂₃ + ξ₃₁.ξ₀₃ - ξ₃₁.ξ₀₃ - ξ₁₂.ξ₀₂ + ξ₁₂.ξ₀₂ + ξ₀.ξ₁ - ξ₀.ξ₁ - ξ₀₂₃.ξ₁₂₃ + ξ₀₂₃.ξ₁₂₃ + 2ξ₀₃₁.ξ₃ - 2ξ₀₁₂.ξ₂ )
  α₀₂  ( 2ξₚ.ξ₀₂ - ξ₂₃.ξ₀₃ + ξ₂₃.ξ₀₃ - 2ξ₃₁.ξ₀₁₂₃ + ξ₁₂.ξ₀₁ - ξ₁₂.ξ₀₁ + ξ₀.ξ₂ - ξ₀.ξ₂ - 2ξ₀₂₃.ξ₃ - ξ₀₃₁.ξ₁₂₃ + ξ₀₃₁.ξ₁₂₃ + 2ξ₀₁₂.ξ₁ )
  α₀₃  ( 2ξₚ.ξ₀₃ + ξ₂₃.ξ₀₂ - ξ₂₃.ξ₀₂ - ξ₃₁.ξ₀₁ + ξ₃₁.ξ₀₁ - 2ξ₁₂.ξ₀₁₂₃ + ξ₀.ξ₃ - ξ₀.ξ₃ + 2ξ₀₂₃.ξ₂ - 2ξ₀₃₁.ξ₁ - ξ₀₁₂.ξ₁₂₃ + ξ₀₁₂.ξ₁₂₃ )
}

[-+++]
G = {
  αₚ   ( ξₚ )
  α₂₃  ( ξ₂₃ )
  α₃₁  ( ξ₃₁ )
  α₁₂  ( ξ₁₂ )
  α₀   ( ξ₀ )
  α₀₂₃ ( ξ₀₂₃ )
  α₀₃₁ ( ξ₀₃₁ )
  α₀₁₂ ( ξ₀₁₂ )
  α₁₂₃ ( ξ₁₂₃ )
  α₁   ( ξ₁ )
  α₂   ( ξ₂ )
  α₃   ( ξ₃ )
  α₀₁₂₃( ξ₀₁₂₃ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

G_dagger = {
  αₚ   ( ξₚ )
  α₂₃  ( - ξ₂₃ )
  α₃₁  ( - ξ₃₁ )
  α₁₂  ( - ξ₁₂ )
  α₀   ( - ξ₀ )
  α₀₂₃ ( ξ₀₂₃ )
  α₀₃₁ ( ξ₀₃₁ )
  α₀₁₂ ( ξ₀₁₂ )
  α₁₂₃ ( - ξ₁₂₃ )
  α₁   ( ξ₁ )
  α₂   ( ξ₂ )
  α₃   ( ξ₃ )
  α₀₁₂₃( - ξ₀₁₂₃ )
  α₀₁  ( ξ₀₁ )
  α₀₂  ( ξ₀₂ )
  α₀₃  ( ξ₀₃ )
}

G G_dagger = {
  αₚ   ( ξₚ^2 - ξ₂₃^2 - ξ₃₁^2 - ξ₁₂^2 - ξ₀^2 + ξ₀₂₃^2 + ξ₀₃₁^2 + ξ₀₁₂^2 - ξ₁₂₃^2 + ξ₁^2 + ξ₂^2 + ξ₃^2 - ξ₀₁₂₃^2 + ξ₀₁^2 + ξ₀₂^2 + ξ₀₃^2 )
  α₂₃  ( - 2ξₚ.ξ₂₃ + ξ₃₁.ξ₁₂ - ξ₃₁.ξ₁₂ + 2ξ₀.ξ₀₂₃ - ξ₀₃₁.ξ₀₁₂ + ξ₀₃₁.ξ₀₁₂ - 2ξ₁₂₃.ξ₁ - ξ₂.ξ₃ + ξ₂.ξ₃ - 2ξ₀₁₂₃.ξ₀₁ - ξ₀₂.ξ₀₃ + ξ₀₂.ξ₀₃ )
  α₃₁  ( - 2ξₚ.ξ₃₁ - ξ₂₃.ξ₁₂ + ξ₂₃.ξ₁₂ + 2ξ₀.ξ₀₃₁ + ξ₀₂₃.ξ₀₁₂ - ξ₀₂₃.ξ₀₁₂ - 2ξ₁₂₃.ξ₂ + ξ₁.ξ₃ - ξ₁.ξ₃ - 2ξ₀₁₂₃.ξ₀₂ + ξ₀₁.ξ₀₃ - ξ₀₁.ξ₀₃ )
  α₁₂  ( - 2ξₚ.ξ₁₂ + ξ₂₃.ξ₃₁ - ξ₂₃.ξ₃₁ + 2ξ₀.ξ₀₁₂ - ξ₀₂₃.ξ₀₃₁ + ξ₀₂₃.ξ₀₃₁ - 2ξ₁₂₃.ξ₃ - ξ₁.ξ₂ + ξ₁.ξ₂ - 2ξ₀₁₂₃.ξ₀₃ - ξ₀₁.ξ₀₂ + ξ₀₁.ξ₀₂ )
  α₀   ( - 2ξₚ.ξ₀ + 2ξ₂₃.ξ₀₂₃ + 2ξ₃₁.ξ₀₃₁ + 2ξ₁₂.ξ₀₁₂ - ξ₁₂₃.ξ₀₁₂₃ + ξ₁₂₃.ξ₀₁₂₃ + ξ₁.ξ₀₁ - ξ₁.ξ₀₁ + ξ₂.ξ₀₂ - ξ₂.ξ₀₂ + ξ₃.ξ₀₃ - ξ₃.ξ₀₃ )
  α₀₂₃ ( 2ξₚ.ξ₀₂₃ + 2ξ₂₃.ξ₀ - ξ₃₁.ξ₀₁₂ + ξ₃₁.ξ₀₁₂ + ξ₁₂.ξ₀₃₁ - ξ₁₂.ξ₀₃₁ - ξ₁₂₃.ξ₀₁ + ξ₁₂₃.ξ₀₁ - ξ₁.ξ₀₁₂₃ + ξ₁.ξ₀₁₂₃ - 2ξ₂.ξ₀₃ + 2ξ₃.ξ₀₂ )
  α₀₃₁ ( 2ξₚ.ξ₀₃₁ + ξ₂₃.ξ₀₁₂ - ξ₂₃.ξ₀₁₂ + 2ξ₃₁.ξ₀ - ξ₁₂.ξ₀₂₃ + ξ₁₂.ξ₀₂₃ - ξ₁₂₃.ξ₀₂ + ξ₁₂₃.ξ₀₂ + 2ξ₁.ξ₀₃ - ξ₂.ξ₀₁₂₃ + ξ₂.ξ₀₁₂₃ - 2ξ₃.ξ₀₁ )
  α₀₁₂ ( 2ξₚ.ξ₀₁₂ - ξ₂₃.ξ₀₃₁ + ξ₂₃.ξ₀₃₁ + ξ₃₁.ξ₀₂₃ - ξ₃₁.ξ₀₂₃ + 2ξ₁₂.ξ₀ - ξ₁₂₃.ξ₀₃ + ξ₁₂₃.ξ₀₃ - 2ξ₁.ξ₀₂ + 2ξ₂.ξ₀₁ - ξ₃.ξ₀₁₂₃ + ξ₃.ξ₀₁₂₃ )
  α₁₂₃ ( - 2ξₚ.ξ₁₂₃ - 2ξ₂₃.ξ₁ - 2ξ₃₁.ξ₂ - 2ξ₁₂.ξ₃ + ξ₀.ξ₀₁₂₃ - ξ₀.ξ₀₁₂₃ + ξ₀₂₃.ξ₀₁ - ξ₀₂₃.ξ₀₁ + ξ₀₃₁.ξ₀₂ - ξ₀₃₁.ξ₀₂ + ξ₀₁₂.ξ₀₃ - ξ₀₁₂.ξ₀₃ )
  α₁   ( 2ξₚ.ξ₁ - 2ξ₂₃.ξ₁₂₃ - ξ₃₁.ξ₃ + ξ₃₁.ξ₃ + ξ₁₂.ξ₂ - ξ₁₂.ξ₂ - ξ₀.ξ₀₁ + ξ₀.ξ₀₁ + ξ₀₂₃.ξ₀₁₂₃ - ξ₀₂₃.ξ₀₁₂₃ + 2ξ₀₃₁.ξ₀₃ - 2ξ₀₁₂.ξ₀₂ )
  α₂   ( 2ξₚ.ξ₂ + ξ₂₃.ξ₃ - ξ₂₃.ξ₃ - 2ξ₃₁.ξ₁₂₃ - ξ₁₂.ξ₁ + ξ₁₂.ξ₁ - ξ₀.ξ₀₂ + ξ₀.ξ₀₂ - 2ξ₀₂₃.ξ₀₃ + ξ₀₃₁.ξ₀₁₂₃ - ξ₀₃₁.ξ₀₁₂₃ + 2ξ₀₁₂.ξ₀₁ )
  α₃   ( 2ξₚ.ξ₃ - ξ₂₃.ξ₂ + ξ₂₃.ξ₂ + ξ₃₁.ξ₁ - ξ₃₁.ξ₁ - 2ξ₁₂.ξ₁₂₃ - ξ₀.ξ₀₃ + ξ₀.ξ₀₃ + 2ξ₀₂₃.ξ₀₂ - 2ξ₀₃₁.ξ₀₁ + ξ₀₁₂.ξ₀₁₂₃ - ξ₀₁₂.ξ₀₁₂₃ )
  α₀₁₂₃( - 2ξₚ.ξ₀₁₂₃ - 2ξ₂₃.ξ₀₁ - 2ξ₃₁.ξ₀₂ - 2ξ₁₂.ξ₀₃ - ξ₀.ξ₁₂₃ + ξ₀.ξ₁₂₃ - ξ₀₂₃.ξ₁ + ξ₀₂₃.ξ₁ - ξ₀₃₁.ξ₂ + ξ₀₃₁.ξ₂ - ξ₀₁₂.ξ₃ + ξ₀₁₂.ξ₃ )
  α₀₁  ( 2ξₚ.ξ₀₁ - 2ξ₂₃.ξ₀₁₂₃ - ξ₃₁.ξ₀₃ + ξ₃₁.ξ₀₃ + ξ₁₂.ξ₀₂ - ξ₁₂.ξ₀₂ + ξ₀.ξ₁ - ξ₀.ξ₁ - ξ₀₂₃.ξ₁₂₃ + ξ₀₂₃.ξ₁₂₃ - 2ξ₀₃₁.ξ₃ + 2ξ₀₁₂.ξ₂ )
  α₀₂  ( 2ξₚ.ξ₀₂ + ξ₂₃.ξ₀₃ - ξ₂₃.ξ₀₃ - 2ξ₃₁.ξ₀₁₂₃ - ξ₁₂.ξ₀₁ + ξ₁₂.ξ₀₁ + ξ₀.ξ₂ - ξ₀.ξ₂ + 2ξ₀₂₃.ξ₃ - ξ₀₃₁.ξ₁₂₃ + ξ₀₃₁.ξ₁₂₃ - 2ξ₀₁₂.ξ₁ )
  α₀₃  ( 2ξₚ.ξ₀₃ - ξ₂₃.ξ₀₂ + ξ₂₃.ξ₀₂ + ξ₃₁.ξ₀₁ - ξ₃₁.ξ₀₁ - 2ξ₁₂.ξ₀₁₂₃ + ξ₀.ξ₃ - ξ₀.ξ₃ - 2ξ₀₂₃.ξ₂ + 2ξ₀₃₁.ξ₁ - ξ₀₁₂.ξ₁₂₃ + ξ₀₁₂.ξ₁₂₃ )
}


.: group_commutator_full :.
===========================

    Compute the group commutator [a, b] = (a b a^-1 b^-1) for each combination
    of a and b in the algebra.

    [a, b] =  αp  --> □
    [a, b] = -αp  --> ■

[+---]
           B         T         A         E
      +---------+---------+---------+---------+
αₚ    | □ □ □ □ | □ □ □ □ | □ □ □ □ | □ □ □ □ |
α₂₃   | □ □ ■ ■ | □ □ ■ ■ | □ □ ■ ■ | □ □ ■ ■ |
α₃₁   | □ ■ □ ■ | □ ■ □ ■ | □ ■ □ ■ | □ ■ □ ■ |
α₁₂   | □ ■ ■ □ | □ ■ ■ □ | □ ■ ■ □ | □ ■ ■ □ |
      +---------+---------+---------+---------+
α₀    | □ □ □ □ | □ □ □ □ | ■ ■ ■ ■ | ■ ■ ■ ■ |
α₀₂₃  | □ □ ■ ■ | □ □ ■ ■ | ■ ■ □ □ | ■ ■ □ □ |
α₀₃₁  | □ ■ □ ■ | □ ■ □ ■ | ■ □ ■ □ | ■ □ ■ □ |
α₀₁₂  | □ ■ ■ □ | □ ■ ■ □ | ■ □ □ ■ | ■ □ □ ■ |
      +---------+---------+---------+---------+
α₁₂₃  | □ □ □ □ | ■ ■ ■ ■ | □ □ □ □ | ■ ■ ■ ■ |
α₁    | □ □ ■ ■ | ■ ■ □ □ | □ □ ■ ■ | ■ ■ □ □ |
α₂    | □ ■ □ ■ | ■ □ ■ □ | □ ■ □ ■ | ■ □ ■ □ |
α₃    | □ ■ ■ □ | ■ □ □ ■ | □ ■ ■ □ | ■ □ □ ■ |
      +---------+---------+---------+---------+
α₀₁₂₃ | □ □ □ □ | ■ ■ ■ ■ | ■ ■ ■ ■ | □ □ □ □ |
α₀₁   | □ □ ■ ■ | ■ ■ □ □ | ■ ■ □ □ | □ □ ■ ■ |
α₀₂   | □ ■ □ ■ | ■ □ ■ □ | ■ □ ■ □ | □ ■ □ ■ |
α₀₃   | □ ■ ■ □ | ■ □ □ ■ | ■ □ □ ■ | □ ■ ■ □ |
      +---------+---------+---------+---------+

[-+++]
           B         T         A         E
      +---------+---------+---------+---------+
αₚ    | □ □ □ □ | □ □ □ □ | □ □ □ □ | □ □ □ □ |
α₂₃   | □ □ ■ ■ | □ □ ■ ■ | □ □ ■ ■ | □ □ ■ ■ |
α₃₁   | □ ■ □ ■ | □ ■ □ ■ | □ ■ □ ■ | □ ■ □ ■ |
α₁₂   | □ ■ ■ □ | □ ■ ■ □ | □ ■ ■ □ | □ ■ ■ □ |
      +---------+---------+---------+---------+
α₀    | □ □ □ □ | □ □ □ □ | ■ ■ ■ ■ | ■ ■ ■ ■ |
α₀₂₃  | □ □ ■ ■ | □ □ ■ ■ | ■ ■ □ □ | ■ ■ □ □ |
α₀₃₁  | □ ■ □ ■ | □ ■ □ ■ | ■ □ ■ □ | ■ □ ■ □ |
α₀₁₂  | □ ■ ■ □ | □ ■ ■ □ | ■ □ □ ■ | ■ □ □ ■ |
      +---------+---------+---------+---------+
α₁₂₃  | □ □ □ □ | ■ ■ ■ ■ | □ □ □ □ | ■ ■ ■ ■ |
α₁    | □ □ ■ ■ | ■ ■ □ □ | □ □ ■ ■ | ■ ■ □ □ |
α₂    | □ ■ □ ■ | ■ □ ■ □ | □ ■ □ ■ | ■ □ ■ □ |
α₃    | □ ■ ■ □ | ■ □ □ ■ | □ ■ ■ □ | ■ □ □ ■ |
      +---------+---------+---------+---------+
α₀₁₂₃ | □ □ □ □ | ■ ■ ■ ■ | ■ ■ ■ ■ | □ □ □ □ |
α₀₁   | □ □ ■ ■ | ■ ■ □ □ | ■ ■ □ □ | □ □ ■ ■ |
α₀₂   | □ ■ □ ■ | ■ □ ■ □ | ■ □ ■ □ | □ ■ □ ■ |
α₀₃   | □ ■ ■ □ | ■ □ □ ■ | ■ □ □ ■ | □ ■ ■ □ |
      +---------+---------+---------+---------+


.: group_commutator_distribution :.
===================================

    This is the same idea as above, combined with the sign distribution format
    from before that looks at vector calculus groupings.

    [a, b] =  αp  --> □
    [a, b] = -αp  --> ■

[+---]
 ∂e |□ □ □ □|  ∂Ξ |□ □ □ □|   ∇ |□ □ □ □|  ∇• |□ □ □ □|  ∇x |■ ■ ■ ■|
    |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |■ ■ □ □|
    |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |■ □ ■ □|
    |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |■ □ □ ■|

[-+++]
 ∂e |□ □ □ □|  ∂Ξ |□ □ □ □|   ∇ |□ □ □ □|  ∇• |□ □ □ □|  ∇x |■ ■ ■ ■|
    |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |□ □ ■ ■|     |■ ■ □ □|
    |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |□ ■ □ ■|     |■ □ ■ □|
    |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |□ ■ ■ □|     |■ □ □ ■|


.: FF_dagger_signs :.
=====================

    Sign distributions for FF! force equations

[+---]
αₚ    □ □ □ ■ ■ ■
α₂₃   □ ■ ■ □
α₃₁   ■ □ □ ■
α₁₂   □ ■ ■ □
α₀₁₂₃ □ □ □ □ □ □
α₀₁   ■ □ □ ■
α₀₂   □ ■ ■ □
α₀₃   ■ □ □ ■

[-+++]
αₚ    □ □ □ ■ ■ ■
α₂₃   ■ □ □ ■
α₃₁   □ ■ ■ □
α₁₂   ■ □ □ ■
α₀₁₂₃ □ □ □ □ □ □
α₀₁   □ ■ ■ □
α₀₂   ■ □ □ ■
α₀₃   □ ■ ■ □


.: split_sign :.
================

    There are (at least) two sources of sign under the full product: ordering of
    terms so that they can be contracted and the effect of the metric on contraction.
    The sign due to ordering is independent of the metric but _not_ of the defined
    positive orientations of each element.

    In the output below:
        cancellation negative = '◢ '
        ordering negative     = '◤ '
        both negative         = '■ '
        both positive         = '□ '

[+---]

αₚ      □ □ □ □  □ □ □ □  □ □ □ □  □ □ □ □
α₂₃     □ ◢ ■ ◤  □ ◢ ■ ◤  ◢ □ ■ ◤  ◢ □ ■ ◤
α₃₁     □ ◤ ◢ ■  □ ◤ ◢ ■  ◢ ◤ □ ■  ◢ ◤ □ ■
α₁₂     □ ■ ◤ ◢  □ ■ ◤ ◢  ◢ ■ ◤ □  ◢ ■ ◤ □

α₀      □ □ □ □  □ □ □ □  □ □ □ □  □ □ □ □
α₀₂₃    □ ◢ ■ ◤  □ ◢ ■ ◤  ◢ □ ■ ◤  ◢ □ ■ ◤
α₀₃₁    □ ◤ ◢ ■  □ ◤ ◢ ■  ◢ ◤ □ ■  ◢ ◤ □ ■
α₀₁₂    □ ■ ◤ ◢  □ ■ ◤ ◢  ◢ ■ ◤ □  ◢ ■ ◤ □

α₁₂₃    □ ◢ ◢ ◢  ◢ □ □ □  ■ ◤ ◤ ◤  ◤ ■ ■ ■
α₁      □ □ ■ ◤  ◢ ◢ ◤ ■  ◤ ◤ □ ◢  ■ ■ ◢ □
α₂      □ ◤ □ ■  ◢ ■ ◢ ◤  ◤ ◢ ◤ □  ■ □ ■ ◢
α₃      □ ■ ◤ □  ◢ ◤ ■ ◢  ◤ □ ◢ ◤  ■ ◢ □ ■

α₀₁₂₃   □ ◢ ◢ ◢  ◢ □ □ □  ■ ◤ ◤ ◤  ◤ ■ ■ ■
α₀₁     □ □ ■ ◤  ◢ ◢ ◤ ■  ◤ ◤ □ ◢  ■ ■ ◢ □
α₀₂     □ ◤ □ ■  ◢ ■ ◢ ◤  ◤ ◢ ◤ □  ■ □ ■ ◢
α₀₃     □ ■ ◤ □  ◢ ◤ ■ ◢  ◤ □ ◢ ◤  ■ ◢ □ ■

[-+++]

αₚ      □ □ □ □  □ □ □ □  □ □ □ □  □ □ □ □
α₂₃     □ ◢ ◢ □  □ ◢ ◢ □  ◢ □ ◢ □  ◢ □ ◢ □
α₃₁     □ □ ◢ ◢  □ □ ◢ ◢  ◢ □ □ ◢  ◢ □ □ ◢
α₁₂     □ ◢ □ ◢  □ ◢ □ ◢  ◢ ◢ □ □  ◢ ◢ □ □

α₀      □ □ □ □  ◤ ◤ ◤ ◤  □ □ □ □  ◤ ◤ ◤ ◤
α₀₂₃    □ ◢ ◢ □  ◤ ■ ■ ◤  ◢ □ ◢ □  ■ ◤ ■ ◤
α₀₃₁    □ □ ◢ ◢  ◤ ◤ ■ ■  ◢ □ □ ◢  ■ ◤ ◤ ■
α₀₁₂    □ ◢ □ ◢  ◤ ■ ◤ ■  ◢ ◢ □ □  ■ ■ ◤ ◤

α₁₂₃    □ ◢ ◢ ◢  ◢ □ □ □  ◢ □ □ □  □ ◢ ◢ ◢
α₁      □ □ ◢ □  ◢ ◢ □ ◢  □ □ □ ◢  ◢ ◢ ◢ □
α₂      □ □ □ ◢  ◢ ◢ ◢ □  □ ◢ □ □  ◢ □ ◢ ◢
α₃      □ ◢ □ □  ◢ □ ◢ ◢  □ □ ◢ □  ◢ ◢ □ ◢

α₀₁₂₃   □ ◢ ◢ ◢  ■ ◤ ◤ ◤  ◢ □ □ □  ◤ ■ ■ ■
α₀₁     □ □ ◢ □  ■ ■ ◤ ■  □ □ □ ◢  ■ ■ ■ ◤
α₀₂     □ □ □ ◢  ■ ■ ■ ◤  □ ◢ □ □  ■ ◤ ■ ■
α₀₃     □ ◢ □ □  ■ ◤ ■ ■  □ □ ◢ □  ■ ■ ◤ ■

```
