# Comparator Live

Comparator Live gives an online interface to the
[Lean `comparator` tool](https://github.com/leanprover/comparator/) tool,
Lean's "gold standard" for validating proofs from untrusted sources.

Comparator Live is intended as a limited-purpose tool, it's goal is to clearly
signify the conditions under which users can rely on a Lean proof from an
unreliable, potentially malicious, or AI source. To this end, Comparator Live
differs in several ways from the the command-line `comparator` utility that it
invokes:

- While `comparator` allows configuration of permitted axioms, Comparator Live
  always uses the standard set of three permitted axioms: `propext`,
  `Quot.sound`, and `Classical.choice`.
- While `comparator` allows set of challenge theorems to be configured,
  Comparator Live automatically infers the challenge theorems as all the
  theorems declared in the challenge.
- Comparator Live introduces a notion of "trusted challenges."

## Trusted Challenges

A trusted challenge for Comparator Live is simply one that can be relied on to
reliably present the theorem statement. Knowing when this is the case can be
difficult for novice users, so Comparator Live treats a built-in set of proofs
as reliable and trusted; these challenges are identified by their hash(\*).

Users can additionally mark specific challenges as locally trusted; these will
not be loudly flagged as unreliable in the UI.

(\*) We normalize the trailing whitespace, so the hash of a challenge is
`sha256(challenge.trimRight() + "\n")`

Trusted challenges are derived from
[`lean-eval` benchmark](https://github.com/leanprover/lean-eval/) and from
files in `Projects/MathlibDemo/TrustedChallenges`. These can be updated by
running `npm run update-trusted` from the repository root.

## How Comparator Live runs `comparator`

Comparator Live does its own compilation of source files to olean files; this
is necessary (at least for the challenge) because we need to inspect the
challenge's olean file in order to find out what theorems it contains.

Bubblewrap is used for sandboxing these tasks in production, **development
mode does no sandboxing and should not be used to evaluate unknown challenges
or untrusted solutions**.

Each task runs in the context of a Lean project (e.g. `MathlibDemo`) that
lives in a directory `$PROJECT_DIR`, and each task is given its own temporary
working directory `$WORK_DIR`. In parallel:

- The challenge file is placed as `Challenge.lean` in an initially empty
  `$WORK_DIR/Challenge`, and that directory is used as an overlay atom
  `$PROJECT_DIR` for compiling the challenge. Compilation is only able to
  write to `$WORK_DIR/Challenge/.lake/build`.
- The candidate solution is placed as `Solution.lean` in an initially empty
  `$WORK_DIR/Solution`, and that directory is used as an overlay directory
  atom `$SOLUTION_DIR` for compiling the solution. Compilation is only able to
  write to `$WORK_DIR/Solution/.lake/build`.

After this, the `challenge-thms` utility is run with an overlay setup of
`$WORK_DIR/Challenge` -> `$PROJECT_DIR`  -> (temp dir to capture writes). Putting the challenge-thms utility
on top helps ensure the integrity of the challenge-thms executable.

Finally, the `comparator` utility is run with an overlay setup of
`$PROJECT_DIR` -> `$WORK_DIR/Solution` -> `$WORK_DIR/Challenge` -> (temp dir to capture writes). Placing the
challenge on top in the overlay ensures that the process of compiling the
solution cannot put `olean` files into place that would corrupt the challenge.

The command-line `comparator` tool will avoid recompiling the challenge and
solution if they've already been compiled to olean by other means, so this
workflow avoids repeated work.

## Development mode setup

Comparator Live can be run in development mode; the only dependencies are `lean` and `npm`.

1. Run `lake build` in the repository's `./Projects/MathlibDemo` directory
2. Run `npm install` and then `npm run dev` in the repository's root
   directory
3. Go to `http://localhost/5173`

## Production mode setup

TODO document better:

 - landrun is at $HOME/landrun/landrun
 - TODO change how project home is located
