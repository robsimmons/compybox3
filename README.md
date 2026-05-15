# Comparator

(These notes are not complete)

theorem inconsistent : False := by sorry

1: in parallel (separate directories)

- compile Challenge.lean -> Challenge.olean
- compile Solution.lean -> Solution.olean

2b: Also in parallel, run lean4checker on Challenge and Solution 2: run the
tiny tool that asks Challenge what its theorems are

3: Call Comparator in an overlay filesystem that places the challenge "on top
of the" solution. Comparator, when given pre-compiled oleans, will call lake,
but lake will identify it has no work to do and will never call lean.

The extra complexity here is in setting up the ovelayfs correctly to call
comparator, but like, that's fine I know how to do that. (it's like three more
lines in bubblewrap)

The extra nice thing here is that comparator can be called on a _completely
read only filesystem_

To document better:

assumes landrun is at $HOME/landrun/landrun

git clone https://github.com/leanprover/lean4export.git --depth 1 --branch
v4.30.0-rc2 git clone https://github.com/leanprover/comparator.git --depth 1

