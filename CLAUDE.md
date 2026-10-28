# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static, client-side site that visualizes git operations with D3 (v3.5.12) and SVG. Users type simulated `git` commands into a sandbox and watch a commit graph update. Live at http://onlywei.github.io/explain-git-with-d3/ (GitHub Pages, served from `main`).

## Development

There is no build, package manager, linter, or test suite. RequireJS, D3, normalize.css and the 1140 grid are loaded from cdnjs at runtime.

- Run: serve the repo root with any static server (e.g. `python -m http.server 8000`) and open `index.html`. Opening via `file://` may break RequireJS module loading in some browsers.
- `memtest.html` opens and destroys a sandbox 100 times to check for memory leaks (watch DevTools memory); it is the only "test".
- Code is ES5 AMD modules (`define([...], function () {...})`) with `"use strict"`; keep it that way — there is no transpiler. `js/main.js` contains ES5 polyfills plus the RequireJS config (D3 CDN path/shim).

## Architecture

AMD modules in `js/`:

- **`historyview.js` — `HistoryView`**: the git model *and* its SVG rendering. State is `commitData`, an array of `{id, parent, parent2?, tags[], message?}`. Branches, `HEAD`, remote-tracking refs (`origin/main`) and git tags all live in a commit's `tags` array; git tags are stored wrapped in brackets (`[v1.0]`), and `getCommit(ref)` resolves ids, tag names (with or without brackets) and `HEAD^^…`. Git operations (`commit`, `branch`, `checkout`, `reset`, `revert`, `merge`, `rebase`, `deleteBranch`, `moveTag`, …) mutate `commitData` then call `renderCommits()` / `renderTags()`. Layout is computed, not stored: `cx`/`cy` derive positions from parents relative to `baseLine`, and `preventOverlap` shifts colliding commits. Commits unreachable from any branch are marked `branchless` and drawn faded. A second `HistoryView` with `remoteName: 'origin'` acts as the remote.
- **`controlbox.js` — `ControlBox`**: the command-line UI. `command()` splits input and dispatches `git <method> <args>` to the same-named method on `ControlBox` (so adding a command = adding a method). These methods parse flags and call into `historyView` / `originView`; remote commands (`fetch`, `pull`, `push`) copy commits between the two views. Thrown `Error`s are caught and shown as error lines in the log.
- **`explaingit.js`**: public API exposed as `window.explainGit`. `open(config)` builds the HistoryView(s) + ControlBox inside `#ExplainGit<name>-Container .playground-container`; `reset()` destroys all open sandboxes.
- **`config.js`**: shared settings: `defaultBranch` (default branch name) and `remoteName` (name of the remote repository). `index.html` and `memtest.html` load it directly (`require(['explaingit', 'config'], …)`) and build their sandbox data (e.g. `remoteName + '/' + defaultBranch`) and the `<span class="default-branch">` labels from them, and `controlbox.js` uses `remoteName` for `fetch`/`pull`/`push`, so never hardcode either name.

`index.html` wires it together: each sandbox needs (1) a `<div id="ExplainGit<Name>-Container" class="concept-container">` with explanatory text and a `.playground-container`, (2) an entry in the inline `examples` object (`name`, `height`, `baseLine`, `commitData`, optional `originData`, `currentBranch`, `initialMessage`), and optionally (3) an `<a id="open-<hash>" class="openswitch" href="#<hash>">` link. Sandboxes are opened from `location.hash`; `#zen` is a special full-page free-play mode. Arrow markers referenced by the graph (`#triangle`, `#faded-triangle`, `#brown-triangle`) are defined in a hidden `<svg>` in `index.html`, and styling is in `css/explaingit.css`.
