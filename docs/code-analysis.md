# Design and code analysis

Analysis of `js/historyview.js`, `js/controlbox.js`, `js/explaingit.js` and the sandbox wiring in
`index.html`, done on 2026-10-23. Line numbers refer to that state of the code and may drift.

Ideas for new git commands are collected separately in [feature-ideas.md](feature-ideas.md).

Bugs marked **confirmed** were reproduced by running the real git logic (`HistoryView`, `ControlBox`)
in Node with only the D3 drawing stubbed out. The others were found by reading the code.

## Bugs

### 1. Branch names containing `/` are treated as remote branches (confirmed)

`git branch feature/x` then `git checkout feature/x` results in a *detached HEAD* instead of being on
`feature/x`.

- Cause: anything with a `/` is considered a remote-tracking branch — `historyview.js:748`
  (`_setCurrentBranch`), also `:645` (`_markBranchlessCommits`) and `:706` (`renderTags`, styling).
- Fix together with design point 2 below.

### 2. Changes in a sandbox survive switching sandboxes (confirmed)

Make commits in `#commit`, open another sandbox, come back: the old commits are still there.

- Cause: `explaingit.js:8` uses `Object.create(_args)`, which shares the example's `commitData` array,
  and `historyview.js:238` uses it without copying. `commit`, `rebase`, `fetch` etc. then mutate the
  `examples` object in `index.html`.
- Fix: deep-copy `commitData` / `originData` when a sandbox is opened.

### 3. `git config branch.<name>.rebase true` has no effect (confirmed)

- Cause: `controlbox.js:572` writes to `this.rebase` (the `rebase` method) instead of
  `this.rebaseConfig`, which is what `pull` reads (`:473`).
- `git config` without arguments shows a raw JavaScript error (`args.shift().split` on `undefined`,
  `:568`).

### 4. `git merge --no-ff <branch>` fails when the branch is one commit ahead (confirmed)

Error: `Cannot read properties of null (reading 'parent')`.

- Cause: the loop in `historyview.js:969–972` walks parents until `parent === currentCommit.id`; when
  the merge target's parent *is* the current commit, it walks past the root to `null`.

### 5. `git checkout -b new <start-point>` creates the wrong branch (confirmed)

`git checkout -b new a` creates a branch named `a`, then fails with `Cannot find commit: new a`.

- Cause: `controlbox.js:215` takes the *last* argument as the branch name.
- Related: `checkout -b` silently ignores an existing branch name (`:219`), real git refuses.

### 6. `fetch` loses the second parent of merge commits (confirmed)

Fetching a merge commit results in `parent2: undefined`, and commits only reachable through the second
parent are not fetched at all. (`push` handles `parent2` correctly.)

- Cause: `controlbox.js:423` follows only `parent`; `:432–436` copies only `id` and `parent`.

### 7. `push` does not update the local remote-tracking branch (confirmed)

After `git push`, the remote's `main` moves, but the local `origin/main` stays on the old commit. Real
git moves it, so the visualization teaches the wrong picture.

- Cause: `controlbox.js:559–561` only updates the remote view.
- Fix: also `local.moveTag(remoteName + '/' + remoteRef, …)` and re-render the local view.

### 8. Internal methods can be invoked as git commands (dispatch confirmed)

`git destroy`, `git render`, `git info`, `git error`, `git command` are all executed. `git destroy`
removes the control box and breaks the sandbox.

- Cause: `controlbox.js:124` dispatches to any method `this[method]`, without an allow list.
- Fix: a list of allowed git commands.

### Smaller issues (from reading)

- **Pull timer:** `pull` merges after `setTimeout(…, 750)` (`controlbox.js:471`); if the sandbox is
  closed within that time, it runs on an already-destroyed view.
- **HTML injection:** typed commands and error messages are inserted with `.html()`
  (`controlbox.js:112`, `:136`, `:142`). `git <img src=x onerror=alert(1)>` executes script. It only
  affects the person typing, but the echoed command should use `.text()`.
- **Faded commits:** commits reachable only through a remote-tracking branch, or through a merge nested
  inside another merge's second parent, are drawn faded as unreachable (`historyview.js:645`, `:658`).
- **Typo:** `orginalBaseLine` (`historyview.js:245`) vs. `originalBaseLine` (`:443`), so Zen mode
  ignores a configured `baseLine`.
- **Missing call:** `entry.trim === ''` lacks `()` (`controlbox.js:104`), the check never fires.
- **Dead code:** `clearInterval(this.refreshSizeTimer)` (`historyview.js:404`), the timer is never set.
- **HTML:** `<h4>Basic Commands</h3>` (mismatched tag) and `</br>` in several places in `index.html`;
  `memtest.html` loads RequireJS over `http://`, which is blocked on GitHub Pages.

## Design

1. **Git model and rendering are one class.** `HistoryView` holds the git operations *and* the D3
   drawing, and every operation triggers a re-render. Nothing can be tested without a browser (or
   stubs). Splitting a pure `GitRepo` model (commits, refs, operations) from a renderer would make the
   git rules testable. Largest change, largest gain.
2. **Refs are untyped strings in `commit.tags`.** Branches, `HEAD`, remote-tracking branches and git
   tags are distinguished by spelling (`/` = remote, `[...]` = tag), checked in about six places
   (including `switch` in `controlbox.js`). Bug 1 is a direct result. At minimum: central helpers like
   `isRemoteBranch(name)`, `isTag(name)`; ideally typed refs in the model from point 1. The `branches`
   list also only grows (except through `deleteBranch`).
3. **Ad-hoc command parsing.** Input is split on single spaces (`git  commit` fails, `-m "a b"` keeps
   the quotes), each command parses its flags its own way. An allow list (bug 8) and a small shared
   argument parser would make behavior consistent.
4. **Logic coupled to animation timing.** `pull` waits 750 ms to match the 500 ms transitions,
   `renderCommits` calculates the layout twice "to make sure" and calls `checkout` itself. This makes
   the order of effects hard to follow.
5. **Old dependencies.** D3 3.5.12 (2015) and RequireJS 2.1.4 (2013) are fine for a static site, but
   moving to current D3 is not a version bump: the v3 APIs used here (`d3.event`, enter/exit
   handling) changed substantially. Only worth doing together with point 1.
6. **No automated tests.** The only test page, `memtest.html`, is a manual memory-leak check, it does
   not test behavior. Nothing protects existing commands when fixing a bug or adding a feature, and
   several bugs above (4, 5, 6) are exactly the edge cases tests would have caught. A start without
   framework or build step: run the real `HistoryView` and `ControlBox` in Node with the D3 drawing
   stubbed out (a minimal `define` loader plus no-op `renderCommits` / `renderTags` / `getCircle`).
   That is how the bugs above were confirmed; those throwaway scripts can seed a `tests/` folder run
   with `node`. The model/view split (point 1) would later remove the need for stubs.

## Suggested order

1. Set up the tests (design point 6). From then on, write a failing test for each bug before fixing
   it.
2. Quick fixes: bug 3 (`rebaseConfig`), bug 8 (allow list), bug 5 (`checkout -b`), typo, missing
   `()`, HTML tags.
3. Bug 2: copy sandbox data on open — small change, most visible to users.
4. Bugs 6, 7, 4: fetch with second parents, update `origin/*` after push, `--no-ff` loop.
5. Bug 1 together with design point 2: ref-type helpers so `feature/x` works.
6. Design point 1 (model/view split), if the tool will keep being extended.
