+++
title = "Zet Properties"
+++

## Checking sign distributions of Zets under product

The following program makes use of the arthroprod library to observe their
common properties under the full product.

### Program

```rust
#[macro_use]
extern crate arthroprod;

use arthroprod::algebra::{full, MultiVector, AR};
use arthroprod::prelude::*;

macro_rules! for_all_zets {
    { zets: $zets:expr; $($description:expr => $func:ident;)+ } => {
        $(println!("{}", $description);
          for (zet, mvec) in $zets.iter() {
              println!("  {}: {}", zet, $func(mvec));
          }
          println!("");)+
    }
}

fn sign_checked(m: &MultiVector) -> String {
    m.as_terms()
        .iter()
        .map(|t| t.sign().to_string())
        .collect::<Vec<String>>()
        .join("")
}

fn main() {
    let a0 = alpha!(0);
    let hermitian = |m: &MultiVector| sign_checked(&m.hermitian());
    let dual = |m: &MultiVector| sign_checked(&m.dual());
    let reversed = |m: &MultiVector| sign_checked(&m.reversed());
    let herm_dual = |m: &MultiVector| (m.hermitian() == m.reversed()).to_string();
    let parity = |m: &MultiVector| sign_checked(&full::<_, MultiVector, _>(&a0, &full(m, &a0)));

    for_all_zets! {
        zets: vec![
            ("ZB", Zet_B()),
            ("ZT", Zet_T()),
            ("ZA", Zet_A()),
            ("ZE", Zet_E()),
        ];

        "Hermitian conjugate" => hermitian;
        "Dual multivector" => dual;
        "Reversed indices" => reversed;
        "Hermitian == reversed" => herm_dual;
        "Parity: a0_Z_a0" => parity;
    }
}
```

### Output

```bash
$ cargo run --bin=zet-properties

Hermitian conjugate
  ZB: +---
  ZT: +---
  ZA: +---
  ZE: -+++

Dual multivector
  ZB: -+++
  ZT: +---
  ZA: -+++
  ZE: +---

Reversed indices
  ZB: ----
  ZT: +---
  ZA: -+++
  ZE: +---

Hermitian == reversed
  ZB: false
  ZT: true
  ZA: false
  ZE: false

Parity: a0_Z_a0
  ZB: ++++
  ZT: ++++
  ZA: ----
  ZE: ----
```
