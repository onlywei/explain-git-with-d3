var Repository = require('./repository');
var Renderer = require('./renderer');

'use strict';

/**
 * @class HistoryView
 * @constructor
 */
function HistoryView(config) {
    this.config = config;
    this.repository = new Repository();
    this.name = config.name = config.name || 'UnnamedHistoryView';

    this.isRemote = typeof config.remoteName === 'string';
    this.remoteName = config.remoteName;
}

HistoryView.prototype = {
    init: function() {
        this.renderer = new Renderer(this, this.config);
        this.renderer.renderCommits();
    },
    destroy: function () {
        this.svg.remove();
        this.svgContainer.remove();
        clearInterval(this.refreshSizeTimer);

        for (var prop in this) {
            if (this.hasOwnProperty(prop)) {
                this[prop] = null;
            }
        }
    },

    /**
     * @method isAncestor
     * @param ref1
     * @param ref2
     * @return {Boolean} whether or not ref1 is an ancestor of ref2
     */
    isAncestor: function(ref1, ref2) {
        var currentCommit = this.getCommit(ref1),
            targetTree = this.getCommit(ref2),
            inTree = false,
            additionalTrees = [];

        if (!currentCommit) {
            return false;
        }

        while (targetTree) {
            if (targetTree.sha === currentCommit.sha) {
                inTree = true;
                targetTree = null;
            } else {
                if (targetTree.parent2) {
                    additionalTrees.push(targetTree.parent2);
                }
                targetTree = this.getCommit(targetTree.parent);
            }
        }

        if (inTree) {
            return true;
        }

        for (var i = 0; i < additionalTrees.length; i++) {
            inTree = isAncestor.call(this, currentCommit, additionalTrees[i]);
            if (inTree) break;
        }

        return inTree;
    },

    commit: function (commit) {
        this.repository.commits.add(this.repository.head);
        this.renderer.renderCommits();

        return this;
    },

    branch: function (name) {
        if (!name || name.trim() === '') {
            throw new Error('You need to give a branch name.');
        }

        if (name === 'HEAD') {
            throw new Error('You cannot name your branch "HEAD".');
        }

        if (name.indexOf(' ') > -1) {
            throw new Error('Branch names cannot contain spaces.');
        }

        if (this.repository.branches.contains(name)) {
            throw new Error('Branch "' + name + '" already exists.');
        }

        this.repository.branches.add(name, this.repository.head, false);
        this.renderer.renderCommits();
        return this;
    },

    tag: function (name) {
        if (!name || name.trim() === '') {
            throw new Error('You need to give a tag name.');
        }

        if (name === 'HEAD') {
            throw new Error('You cannot name your tag "HEAD".');
        }

        if (name.indexOf(' ') > -1) {
            throw new Error('Tag names cannot contain spaces.');
        }

        if (this.branches.indexOf(name) > -1) {
            throw new Error('Tag "' + name + '" already exists.');
        }

        this.repository.tags.add(name, this.repository.head, false);
        this.renderer.renderCommits();
        return this;
    },

    deleteBranch: function (name) {
        var branchIndex,
            commit;

        if (!name || name.trim() === '') {
            throw new Error('You need to give a branch name.');
        }

        if (name === this.currentBranch) {
            throw new Error('Cannot delete the currently checked-out branch.');
        }

        branchIndex = this.branches.indexOf(name);

        if (branchIndex === -1) {
            throw new Error('That branch doesn\'t exist.');
        }

        this.branches.splice(branchIndex, 1);
        commit = this.getCommit(name);
        branchIndex = commit.tags.indexOf(name);

        if (branchIndex > -1) {
            commit.tags.splice(branchIndex, 1);
        }

        this.renderTags();
    },

    checkout: function (ref) {
        var commit = ref;

        if (!commit) {
            throw new Error('Cannot find commit: ' + ref);
        }

        var previousHead = this.getCircle('HEAD'),
            newHead = this.getCircle(commit.id);

        if (previousHead && !previousHead.empty()) {
            previousHead.classed('checked-out', false);
        }

        this._setCurrentBranch(ref === commit.id ? null : ref);
        this.moveTag('HEAD', commit.id);
        this.renderTags();

        newHead.classed('checked-out', true);

        return this;
    },

    reset: function (ref) {
        var commit = this.getCommit(ref);

        if (!commit) {
            throw new Error('Cannot find ref: ' + ref);
        }

        if (this.currentBranch) {
            this.moveTag(this.currentBranch, commit.id);
            this.checkout(this.currentBranch);
        } else {
            this.checkout(commit.id);
        }

        return this;
    },

    revert: function (ref) {
        var commit = this.getCommit(ref);

        if (!commit) {
            throw new Error('Cannot find ref: ' + ref);
        }

        if (this.isAncestor(commit, 'HEAD')) {
            commit.reverted = true;
            this.commit({reverts: commit.id});
        } else {
            throw new Error(ref + 'is not an ancestor of HEAD.');
        }
    },

    fastForward: function (ref) {
        var targetCommit = this.getCommit(ref);

        if (this.currentBranch) {
            this.moveTag(this.currentBranch, targetCommit.id);
            this.checkout(this.currentBranch);
        } else {
            this.checkout(targetCommit.id);
        }
    },

    merge: function (ref, noFF) {
        var mergeTarget = this.getCommit(ref),
            currentCommit = this.getCommit('HEAD');

        if (!mergeTarget) {
            throw new Error('Cannot find ref: ' + ref);
        }

        if (currentCommit.id === mergeTarget.id) {
            throw new Error('Already up-to-date.');
        } else if (currentCommit.parent2 === mergeTarget.id) {
            throw new Error('Already up-to-date.');
        } else if (noFF === true) {
            var branchStartCommit = this.getCommit(mergeTarget.parent);
            while (branchStartCommit.parent !== currentCommit.id) {
                branchStartCommit = this.getCommit(branchStartCommit.parent);
            }

            branchStartCommit.isNoFFBranch = true;

            this.commit({parent2: mergeTarget.id, isNoFFCommit: true});
        } else if (this.isAncestor(currentCommit, mergeTarget)) {
            this.fastForward(mergeTarget);
            return 'Fast-Forward';
        } else {
            this.commit({parent2: mergeTarget.id});
        }
    },

    rebase: function (ref) {
        var rebaseTarget = this.getCommit(ref),
            currentCommit = this.getCommit('HEAD'),
            isCommonAncestor,
            rebaseTreeLoc,
            toRebase = [], rebasedCommit,
            remainingHusk;

        if (!rebaseTarget) {
            throw new Error('Cannot find ref: ' + ref);
        }

        if (currentCommit.id === rebaseTarget.id) {
            throw new Error('Already up-to-date.');
        } else if (currentCommit.parent2 === rebaseTarget.id) {
            throw new Error('Already up-to-date.');
        }

        isCommonAncestor = this.isAncestor(currentCommit, rebaseTarget);

        if (isCommonAncestor) {
            this.fastForward(rebaseTarget);
            return 'Fast-Forward';
        }

        rebaseTreeLoc = rebaseTarget.id

        while (!isCommonAncestor) {
            toRebase.unshift(currentCommit);
            currentCommit = this.getCommit(currentCommit.parent);
            isCommonAncestor = this.isAncestor(currentCommit, rebaseTarget);
        }

        for (var i = 0; i < toRebase.length; i++) {
            rebasedCommit = toRebase[i];

            remainingHusk = {
                id: rebasedCommit.id,
                parent: rebasedCommit.parent,
                tags: []
            };

            for (var t = 0; t < rebasedCommit.tags.length; t++) {
                var tagName = rebasedCommit.tags[t];
                if (tagName !== this.currentBranch && tagName !== 'HEAD') {
                    remainingHusk.tags.unshift(tagName);
                }
            }

            this.commitData.push(remainingHusk);

            rebasedCommit.parent = rebaseTreeLoc;
            rebaseTreeLoc = HistoryView.generateId()
            rebasedCommit.id = rebaseTreeLoc;
            rebasedCommit.tags.length = 0;
            rebasedCommit.rebased = true;
        }

        if (this.currentBranch) {
            rebasedCommit.tags.push(this.currentBranch);
        }

        this.renderer.renderCommits();

        if (this.currentBranch) {
            this.checkout(this.currentBranch);
        } else {
            this.checkout(rebasedCommit.id);
        }
    }
};

module.exports = HistoryView;
