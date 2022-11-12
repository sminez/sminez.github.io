+++
title = "Inverse Fours"
+++

## Finding inverses for 4 element multi-vectors

The following program makes use of the arthroprod library to find inverse
multi-vectors for Zet based, 4-element multi-vectors.

### Program
```rust
#[macro_use]
extern crate arthroprod;

use std::collections::HashSet;

use arthroprod::algebra::{full, Form, MultiVector, AR};
use arthroprod::prelude::*;

/// Helper for forming products and simplifying the resulting terms
fn simplified_product(m: &MultiVector, f: impl Fn(&MultiVector) -> MultiVector) -> MultiVector {
    let mut res: MultiVector = full(&m.clone(), &f(&m.clone()));
    res.simplify();
    res
}

/// display the alpha values contained within a multivector
fn simple_form_rep(m: &MultiVector) -> String {
    let forms: HashSet<Form> = m.as_terms().iter().map(|a| a.form()).collect();
    let mut fs: Vec<&Form> = forms.iter().collect();
    fs.sort();
    fs.iter()
        .map(|f| format!("a{}", f))
        .collect::<Vec<String>>()
        .join(" ")
}

/// Print a MultiVector if it is a pure scalar, otherwise list the forms it is composed of
fn print_if_scalar(name: &str, m: MultiVector) {
    if m.is_scalar() {
        println!("{}: {}", name, m)
    }
}

fn main() {
    // MultiVector product functions
    let squared = |m: &MultiVector| simplified_product(m, |n| n.clone());
    let phi = |m: &MultiVector| simplified_product(m, |n| n.hermitian());
    let ddaggered = |m: &MultiVector| simplified_product(m, |n| n.double_dagger());
    let vdm_scalar = |m: &MultiVector| simplified_product(&phi(&m), |n| n.diamond());

    let time_like = vec![term!(), term!(0), term!(1 2 3), term!(0 1 2 3)];
    let space_like = vec![B(), T(), A(), E()];

    for t in time_like.iter() {
        for s in space_like.iter() {
            let mvec = mvec![s, t];

            println!("MultiVector = {{ {} }}", simple_form_rep(&mvec));
            print_if_scalar("squared", squared(&mvec));
            print_if_scalar("phi", phi(&mvec));
            print_if_scalar("double_dagger", ddaggered(&mvec));
            print_if_scalar("VdM_scalar", vdm_scalar(&mvec));
            println!("\n");
        }
    }
}
```

### Output
```bash
$ cargo run --bin=inverse-fours

MultiVector = { ap a23 a31 a12 }
phi: {
  ap    ( +ξp^2, +ξ23^2, +ξ31^2, +ξ12^2 )
}
double_dagger: {
  ap    ( -ξp^2, -ξ23^2, -ξ31^2, -ξ12^2 )
}
VdM_scalar: {
  ap    (
           +ξp^4, +ξp^2.ξ23^2, +ξp^2.ξ31^2, +ξp^2.ξ12^2, +ξ23^4, +ξ23^2.ξ31^2
           +ξ23^2.ξ12^2, +ξ31^4, +ξ31^2.ξ12^2, +ξ12^4
  )
}


MultiVector = { ap a023 a031 a012 }
phi: {
  ap    ( +ξp^2, +ξ023^2, +ξ031^2, +ξ012^2 )
}
VdM_scalar: {
  ap    (
           +ξp^4, +ξp^2.ξ023^2, +ξp^2.ξ031^2, +ξp^2.ξ012^2, +ξ023^4, +ξ023^2.ξ031^2
           +ξ023^2.ξ012^2, +ξ031^4, +ξ031^2.ξ012^2, +ξ012^4
  )
}


MultiVector = { ap a1 a2 a3 }
phi: {
  ap    ( +ξp^2, +ξ1^2, +ξ2^2, +ξ3^2 )
}
VdM_scalar: {
  ap    (
           +ξp^4, +ξp^2.ξ1^2, +ξp^2.ξ2^2, +ξp^2.ξ3^2, +ξ1^4, +ξ1^2.ξ2^2
           +ξ1^2.ξ3^2, +ξ2^4, +ξ2^2.ξ3^2, +ξ3^4
  )
}


MultiVector = { ap a01 a02 a03 }
double_dagger: {
  ap    ( -ξp^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
VdM_scalar: {
  ap    (
           +ξp^4, -ξp^2.ξ01^2, -ξp^2.ξ02^2, -ξp^2.ξ03^2, +ξ01^4, +ξ01^2.ξ02^2
           +ξ01^2.ξ03^2, +ξ02^4, +ξ02^2.ξ03^2, +ξ03^4
  )
}


MultiVector = { a23 a31 a12 a0 }
phi: {
  ap    ( +ξ23^2, +ξ31^2, +ξ12^2, +ξ0^2 )
}
double_dagger: {
  ap    ( -ξ23^2, -ξ31^2, -ξ12^2, -ξ0^2 )
}
VdM_scalar: {
  ap    (
           +ξ23^4, +ξ23^2.ξ31^2, +ξ23^2.ξ12^2, +ξ23^2.ξ0^2, +ξ31^4, +ξ31^2.ξ12^2
           +ξ31^2.ξ0^2, +ξ12^4, +ξ12^2.ξ0^2, +ξ0^4
  )
}


MultiVector = { a0 a023 a031 a012 }
phi: {
  ap    ( +ξ0^2, +ξ023^2, +ξ031^2, +ξ012^2 )
}
VdM_scalar: {
  ap    (
           +ξ0^4, +ξ0^2.ξ023^2, +ξ0^2.ξ031^2, +ξ0^2.ξ012^2, +ξ023^4, +ξ023^2.ξ031^2
           +ξ023^2.ξ012^2, +ξ031^4, +ξ031^2.ξ012^2, +ξ012^4
  )
}


MultiVector = { a0 a1 a2 a3 }
squared: {
  ap    ( +ξ0^2, -ξ1^2, -ξ2^2, -ξ3^2 )
}
double_dagger: {
  ap    ( -ξ0^2, +ξ1^2, +ξ2^2, +ξ3^2 )
}
VdM_scalar: {
  ap    (
           +ξ0^4, -ξ0^2.ξ1^2, -ξ0^2.ξ2^2, -ξ0^2.ξ3^2, +ξ1^4, +ξ1^2.ξ2^2
           +ξ1^2.ξ3^2, +ξ2^4, +ξ2^2.ξ3^2, +ξ3^4
  )
}


MultiVector = { a0 a01 a02 a03 }
squared: {
  ap    ( +ξ0^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
phi: {
  ap    ( +ξ0^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
VdM_scalar: {
  ap    (
           +ξ0^4, +ξ0^2.ξ01^2, +ξ0^2.ξ02^2, +ξ0^2.ξ03^2, +ξ01^4, +ξ01^2.ξ02^2
           +ξ01^2.ξ03^2, +ξ02^4, +ξ02^2.ξ03^2, +ξ03^4
  )
}


MultiVector = { a23 a31 a12 a123 }
phi: {
  ap    ( +ξ23^2, +ξ31^2, +ξ12^2, +ξ123^2 )
}
double_dagger: {
  ap    ( -ξ23^2, -ξ31^2, -ξ12^2, -ξ123^2 )
}
VdM_scalar: {
  ap    (
           +ξ23^4, +ξ23^2.ξ31^2, +ξ23^2.ξ12^2, +ξ23^2.ξ123^2, +ξ31^4, +ξ31^2.ξ12^2
           +ξ31^2.ξ123^2, +ξ12^4, +ξ12^2.ξ123^2, +ξ123^4
  )
}


MultiVector = { a023 a031 a012 a123 }
squared: {
  ap    ( -ξ023^2, -ξ031^2, -ξ012^2, +ξ123^2 )
}
double_dagger: {
  ap    ( +ξ023^2, +ξ031^2, +ξ012^2, -ξ123^2 )
}
VdM_scalar: {
  ap    (
           +ξ023^4, +ξ023^2.ξ031^2, +ξ023^2.ξ012^2, -ξ023^2.ξ123^2, +ξ031^4, +ξ031^2.ξ012^2
           -ξ031^2.ξ123^2, +ξ012^4, -ξ012^2.ξ123^2, +ξ123^4
  )
}


MultiVector = { a123 a1 a2 a3 }
phi: {
  ap    ( +ξ123^2, +ξ1^2, +ξ2^2, +ξ3^2 )
}
VdM_scalar: {
  ap    (
           +ξ123^4, +ξ123^2.ξ1^2, +ξ123^2.ξ2^2, +ξ123^2.ξ3^2, +ξ1^4, +ξ1^2.ξ2^2
           +ξ1^2.ξ3^2, +ξ2^4, +ξ2^2.ξ3^2, +ξ3^4
  )
}


MultiVector = { a123 a01 a02 a03 }
squared: {
  ap    ( +ξ123^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
phi: {
  ap    ( +ξ123^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
VdM_scalar: {
  ap    (
           +ξ123^4, +ξ123^2.ξ01^2, +ξ123^2.ξ02^2, +ξ123^2.ξ03^2, +ξ01^4, +ξ01^2.ξ02^2
           +ξ01^2.ξ03^2, +ξ02^4, +ξ02^2.ξ03^2, +ξ03^4
  )
}


MultiVector = { a23 a31 a12 a0123 }
double_dagger: {
  ap    ( -ξ23^2, -ξ31^2, -ξ12^2, +ξ0123^2 )
}
VdM_scalar: {
  ap    (
           +ξ23^4, +ξ23^2.ξ31^2, +ξ23^2.ξ12^2, -ξ23^2.ξ0123^2, +ξ31^4, +ξ31^2.ξ12^2
           -ξ31^2.ξ0123^2, +ξ12^4, -ξ12^2.ξ0123^2, +ξ0123^4
  )
}


MultiVector = { a023 a031 a012 a0123 }
squared: {
  ap    ( -ξ023^2, -ξ031^2, -ξ012^2, -ξ0123^2 )
}
phi: {
  ap    ( +ξ023^2, +ξ031^2, +ξ012^2, +ξ0123^2 )
}
double_dagger: {
  ap    ( +ξ023^2, +ξ031^2, +ξ012^2, +ξ0123^2 )
}
VdM_scalar: {
  ap    (
           +ξ023^4, +ξ023^2.ξ031^2, +ξ023^2.ξ012^2, +ξ023^2.ξ0123^2, +ξ031^4, +ξ031^2.ξ012^2
           +ξ031^2.ξ0123^2, +ξ012^4, +ξ012^2.ξ0123^2, +ξ0123^4
  )
}


MultiVector = { a1 a2 a3 a0123 }
squared: {
  ap    ( -ξ1^2, -ξ2^2, -ξ3^2, -ξ0123^2 )
}
phi: {
  ap    ( +ξ1^2, +ξ2^2, +ξ3^2, +ξ0123^2 )
}
double_dagger: {
  ap    ( +ξ1^2, +ξ2^2, +ξ3^2, +ξ0123^2 )
}
VdM_scalar: {
  ap    (
           +ξ1^4, +ξ1^2.ξ2^2, +ξ1^2.ξ3^2, +ξ1^2.ξ0123^2, +ξ2^4, +ξ2^2.ξ3^2
           +ξ2^2.ξ0123^2, +ξ3^4, +ξ3^2.ξ0123^2, +ξ0123^4
  )
}


MultiVector = { a0123 a01 a02 a03 }
phi: {
  ap    ( +ξ0123^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
double_dagger: {
  ap    ( +ξ0123^2, +ξ01^2, +ξ02^2, +ξ03^2 )
}
VdM_scalar: {
  ap    (
           +ξ0123^4, +ξ0123^2.ξ01^2, +ξ0123^2.ξ02^2, +ξ0123^2.ξ03^2, +ξ01^4, +ξ01^2.ξ02^2
           +ξ01^2.ξ03^2, +ξ02^4, +ξ02^2.ξ03^2, +ξ03^4
  )
}
```
