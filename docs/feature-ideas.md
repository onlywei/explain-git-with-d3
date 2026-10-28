# Feature ideas

Ideas for further git commands and teaching features, collected on 2026-10-23.

The tool only draws the commit graph (commits, branches, `HEAD`, remotes), it does not show files,
the working directory or the staging area. So the best candidates are commands that change the
graph. File-based commands like `git restore`, `git stash` or merge conflicts have nothing to show
(see the note in the reset sandbox for `git restore`), unless the tool gets a model of files — see
[The three trees](#the-three-trees) below.

## Small — reuse existing logic

- **`git commit --amend`** — replaces the last commit with a new one; the old commit stays visible,
  faded, like after a rebase. Common source of confusion, shows why amending pushed commits causes
  trouble.
- **`HEAD~2`** — only `HEAD^^` is supported in `getCommit` (`historyview.js`), but `~n` is what
  people usually type.
- **`git branch -m old new`** (rename) and **`git branch -f dev <commit>`** (move a branch) — both just
  change an entry in a commit's `tags`.
- **`git switch -`** / **`git checkout -`** — back to the previous branch; needs a "previous branch"
  field.
- **`git tag -d <name>`** — tags can be created but not deleted (`git branch -d` exists).

## Medium — new graph operations

- **`git cherry-pick <commit>`** — copies one commit onto the current branch with a new id. Very
  visual, and close to what `rebase` already does per commit.
- **`git reflog`** — lists where `HEAD` has been, so "lost" commits can be recovered after a `reset`.
  Natural follow-up to the reset sandbox and its warning; needs a log of `HEAD` movements.
- **`git push -u origin <branch>`** — creating a branch on the remote. `push` currently answers
  "creating new remote branches is not supported yet", which blocks the everyday feature-branch
  workflow.
- **`git push --force`** — overwrites the remote branch; the remote's dropped commits turn faded.
  Good companion to the "never reset pushed commits" warning.
- **`git merge --squash`** — one new commit without a second parent, as a contrast to a normal merge.

## Larger

- **A second remote (`upstream`)** — the fork workflow: fetch from upstream, push to origin. The
  remote name is already configurable (`config.js`), but the code assumes a single `originView`
  throughout (`explaingit.js`, `controlbox.js`).
- **`git rebase -i`** (squash, drop, reorder) — valuable to teach, but needs its own input format,
  since an editor cannot be simulated.
- **Teaching aids** instead of commands — an undo button, replaying a sequence of commands, or tasks
  with a target graph ("make the graph look like this"), like the *Learn Git Branching* site.

## The three trees

Adding the working directory, the staging area (index) and `HEAD` as three visible "trees". This is
the largest idea, and the one that unlocks what the site currently has to skip: the reset sandbox says
only `--hard` works because "this visualization cannot graphically display that work".

**What it enables**

- `git reset --soft` / `--mixed` / `--hard` shown properly — the "Reset Demystified" picture the reset
  text already links to: which of the three trees each flag changes.
- `git add`, `git commit`, `git status` — a commit becomes a snapshot of the staging area instead of
  appearing from nowhere.
- `git restore` and `git restore --staged` — the note in the reset sandbox could become a real sandbox.
- `git stash`, `git checkout -- <file>`, and a simple `git diff` ("which trees differ for which file").

**Possible design, kept simple**

- Files as abstract versions, no real content: a file is a name plus a version label
  (`readme.md v2`).
- Three columns next to the graph — Working directory, Staging area, HEAD — showing each file's
  version, with differences highlighted.
- Each commit stores a snapshot `{file: version}`; checkout, reset and restore copy snapshots between
  the trees.
- A made-up command such as `edit readme.md` (or `echo … > readme.md`) creates the next version in the
  working directory, since real editing cannot be simulated.

**Effort and prerequisites**

- Every existing command must keep the trees consistent: `checkout` / `switch` update all three,
  `merge` and `rebase` need snapshot rules, merge conflicts would be left out or simplified.
- In the current code, where git logic and drawing are mixed in `HistoryView`, this gets messy. Do
  design point 1 from [code-analysis.md](code-analysis.md) (separate git model) first, and build the
  three trees on top of it.
- The site's intro deliberately leaves staging out to keep things simple. Show the three trees only in
  new sandboxes (reset flags, add/commit, restore) and keep the existing sandboxes graph-only.

## Suggested order

1. `commit --amend` and `HEAD~n` — small, frequently needed.
2. `cherry-pick` and `reflog` — most teaching value.
3. `push -u` — makes the remote sandboxes cover a realistic workflow.
4. The three trees — after the model/view split (design point 1 in
   [code-analysis.md](code-analysis.md)).

Before building more remote features, fix bugs 6 and 7 from [code-analysis.md](code-analysis.md)
(`fetch` drops second parents, `push` doesn't update `origin/*`), since new push/fetch features
would build on them.
