var d3 = require('d3');
var Repository = require('./repository');

'use strict';

var REG_MARKER_END = 'url(#triangle)',
    MERGE_MARKER_END = 'url(#brown-triangle)',
    FADED_MARKER_END = 'url(#faded-triangle)',

    preventOverlap,
    applyBranchlessClass,
    cx, cy, fixCirclePosition,
    px1, py1, fixPointerStartPosition,
    px2, py2, fixPointerEndPosition,
    fixIdPosition, tagY;

preventOverlap = function preventOverlap(commit, view) {
    var commitData = view.repository.commits.commits,
        baseLine = view.baseLine,
        shift = view.commitRadius * 4.5,
        overlapped = null;

    for (var i = 0; i < commitData.length; i++) {
        var c = commitData[i];
        if (c.cx === commit.cx && c.cy === commit.cy && c !== commit) {
            overlapped = c;
            break;
        }
    }

    if (overlapped) {
        var oParent = view.getCommit(overlapped.parent),
            parent = view.getCommit(commit.parent);

        if (overlapped.cy < baseLine) {
            overlapped = oParent.cy < parent.cy ? overlapped : commit;
            overlapped.cy -= shift;
        } else {
            overlapped = oParent.cy > parent.cy ? overlapped : commit;
            overlapped.cy += shift;
        }

        preventOverlap(overlapped, view);
    }
};

applyBranchlessClass = function (selection) {
    if (selection.empty()) {
        return;
    }

    selection.classed('branchless', function (d) {
        return d.branchless;
    });

    if (selection.classed('commit-pointer')) {
        selection.attr('marker-end', function (d) {
            return d.branchless ? FADED_MARKER_END : REG_MARKER_END;
        });
    } else if (selection.classed('merge-pointer')) {
        selection.attr('marker-end', function (d) {
            return d.branchless ? FADED_MARKER_END : MERGE_MARKER_END;
        });
    }
};

cx = function (commit, view) {
    var parent = commit.parent || view.noParentPosition,
        parentCX = parent.cx;

    return parentCX + (view.commitRadius * 4.5);
};

cy = function (commit, view) {
    var parent = commit.parent || view.noParentPosition,
        parentCY = parent.cy || cy(parent, view),
        baseLine = view.baseLine,
        shift = view.commitRadius * 4.5,
        branches = [], // count the existing branches
        branchIndex = 0;

    for (var i = 0; i < view.repository.commits.commits.length; i++) {
        var d = view.repository.commits.commits[i];

        if (d.parent === commit.parent) {
            branches.push(d.sha);
        }
    }

    branchIndex = branches.indexOf(commit.sha);

    if (commit.isNoFFBranch === true) {
        branchIndex++;
    }
    if (commit.isNoFFCommit === true) {
        branchIndex--;
    }

    if (parentCY === baseLine) {
        var direction = 1;
        for (var bi = 0; bi < branchIndex; bi++) {
            direction *= -1;
        }

        shift *= Math.ceil(branchIndex / 2);

        return parentCY + (shift * direction);
    }

    if (parentCY < baseLine) {
        return parentCY - (shift * branchIndex);
    } else if (parentCY > baseLine) {
        return parentCY + (shift * branchIndex);
    }
};

fixCirclePosition = function (selection) {
    selection
        .attr('cx', function (d) {
            return d.cx;
        })
        .attr('cy', function (d) {
            return d.cy;
        });
};

// calculates the x1 point for commit pointer lines
px1 = function (commit, view, pp) {
    pp = pp || 'parent';

    var parent = commit[pp] || view.noParentPosition,
        startCX = commit.cx,
        diffX = startCX - parent.cx,
        diffY = parent.cy - commit.cy,
        length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return startCX - (view.pointerMargin * (diffX / length));
};

// calculates the y1 point for commit pointer lines
py1 = function (commit, view, pp) {
    pp = pp || 'parent';

    var parent = commit[pp] || view.noParentPosition,
        startCY = commit.cy,
        diffX = commit.cx - parent.cx,
        diffY = parent.cy - startCY,
        length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return startCY + (view.pointerMargin * (diffY / length));
};

fixPointerStartPosition = function (selection, view) {
    selection.attr('x1', function (d) {
        return px1(d, view);
    }).attr('y1', function (d) {
        return py1(d, view);
    });
};

px2 = function (commit, view, pp) {
    pp = pp || 'parent';

    var parent = commit[pp] || view.noParentPosition,
        endCX = parent.cx,
        diffX = commit.cx - endCX,
        diffY = parent.cy - commit.cy,
        length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return endCX + (view.pointerMargin * 1.2 * (diffX / length));
};

py2 = function (commit, view, pp) {
    pp = pp || 'parent';

    var parent = commit[pp] || view.noParentPosition,
        endCY = parent.cy,
        diffX = commit.cx - parent.cx,
        diffY = endCY - commit.cy,
        length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return endCY - (view.pointerMargin * 1.2 * (diffY / length));
};

fixPointerEndPosition = function (selection, view) {
    selection.attr('x2', function (d) {
        return px2(d, view);
    }).attr('y2', function (d) {
        return py2(d, view);
    });
};

fixIdPosition = function (selection, view) {
    selection.attr('x', function (d) {
        return d.cx;
    }).attr('y', function (d) {
        return d.cy + view.commitRadius + 14;
    });
};

tagY = function(t, view) {
    var commit = t.target,
        commitCY = commit.cy,
        tags = view.repository.getRefs().map(function(r) { return r.name; }),
        tagIndex = tags.indexOf(t.name);

    if (tagIndex === -1) {
        tagIndex = tags.length;
    }

    if (commitCY < (view.baseLine)) {
        return commitCY - 45 - (tagIndex * 25);
    } else {
        return commitCY + 40 + (tagIndex * 25);
    }
};

/**
 * @class HistoryView
 * @constructor
 */
function HistoryView(config) {
    this.repository = new Repository();

    this.name = config.name || 'UnnamedHistoryView';

    this.width = config.width;
    this.height = config.height || 400;
    this.orginalBaseLine = config.baseLine;
    this.baseLine = this.height * (config.baseLine || 0.6);

    this.commitRadius = config.commitRadius || 20;
    this.pointerMargin = this.commitRadius * 1.3;

    this.isRemote = typeof config.remoteName === 'string';
    this.remoteName = config.remoteName;

    this.noParentPosition = {
        cx: -(this.commitRadius * 2),
        cy: this.baseLine
    };
}

HistoryView.prototype = {
    /**
     * @method getCircle
     * @param ref {String} the id or a tag name that refers to the commit
     * @return {d3 Selection} the d3 selected SVG circle
     */
    getCircle: function (ref) {
        var circle = this.svg.select('#' + this.name + '-' + ref),
            commit;

        if (circle && !circle.empty()) {
            return circle;
        }

        commit = this.repository.commits.find(ref);

        if (!commit) {
            return null;
        }

        return this.svg.select('#' + this.name + '-' + commit.sha);
    },

    getCircles: function () {
        return this.svg.selectAll('circle.commit');
    },

    /**
     * @method render
     * @param container {String} selector for the container to render the SVG into
     */
    render: function (container) {
        var svgContainer, svg;

        svgContainer = container.append('div')
            .classed('svg-container', true)
            .classed('remote-container', this.isRemote);

        svg = svgContainer.append('svg:svg');

        svg.attr('id', this.name)
            .attr('width', this.width)
            .attr('height', this.height);

        if (this.isRemote) {
            svg.append('svg:text')
                .classed('remote-name-display', true)
                .text(this.remoteName)
                .attr('x', 10)
                .attr('y', 25);
        } else {
            svg.append('svg:text')
                .classed('remote-name-display', true)
                .text('Local Repository')
                .attr('x', 10)
                .attr('y', 25);

            svg.append('svg:text')
                .classed('current-branch-display', true)
                .attr('x', 10)
                .attr('y', 45);
        }

        this.svgContainer = svgContainer;
        this.svg = svg;
        this.arrowBox = svg.append('svg:g').classed('pointers', true);
        this.commitBox = svg.append('svg:g').classed('commits', true);
        this.tagBox = svg.append('svg:g').classed('tags', true);

        this.renderCommits();

        this._setCurrentBranch(this.repository.currentBranch);
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

    _calculatePositionData: function () {
        for (var i = 0; i < this.repository.commits.commits.length; i++) {
            var commit = this.repository.commits.commits[i];
            commit.cx = cx(commit, this);
            commit.cy = cy(commit, this);
            preventOverlap(commit, this);
        }
    },

    _resizeSvg: function() {
        var ele = document.getElementById(this.svg.node().id);
        var container = ele.parentNode;
        var currentWidth = ele.offsetWidth;
        var newWidth;

        if (ele.getBBox().width > container.offsetWidth)
            newWidth = Math.round(ele.getBBox().width);
        else
            newWidth = container.offsetWidth - 5;

        if (currentWidth != newWidth) {
            this.svg.attr('width', newWidth);
            container.scrollLeft = container.scrollWidth;
        }
    },

    renderCommits: function () {
        if (typeof this.height === 'string' && this.height.indexOf('%') >= 0) {
            var perc = this.height.substring(0, this.height.length - 1) / 100.0;
            var baseLineCalcHeight = Math.round(this.svg.node().parentNode.offsetHeight * perc) - 65;
            var newBaseLine = Math.round(baseLineCalcHeight * (this.originalBaseLine || 0.6));
            if (newBaseLine !== this.baseLine) {
                this.baseLine = newBaseLine;
                this.initialCommit.cy = newBaseLine;
                this.svg.attr('height', baseLineCalcHeight);
            }
        }
        this._calculatePositionData();
        this._calculatePositionData(); // do this twice to make sure
        this.renderTags();
        this._renderCircles();
        this._renderPointers();
        this._renderMergePointers();
        this._renderIdLabels();
        this._resizeSvg();
        this._setCurrentBranch(this.repository.currentBranch);
    },

    _renderCircles: function () {
        var view = this,
            existingCircles,
            newCircles,
            commits = this.repository.commits.commits;

        existingCircles = this.commitBox.selectAll('circle.commit')
            .data(commits, function (d) { return d.sha; })
            .attr('id', function (d) {
                return view.name + '-' + d.sha;
            })
            .classed('reverted', function (d) {
                return d.reverted;
            })
            .classed('rebased', function (d) {
                return d.rebased;
            });

        existingCircles.transition()
            .duration(500)
            .call(fixCirclePosition);

        newCircles = existingCircles.enter()
            .append('svg:circle')
            .attr('id', function (d) {
                return view.name + '-' + d.sha;
            })
            .classed('commit', true)
            .classed('merge-commit', function (d) {
                return typeof d.parent2 === 'string';
            })
            .call(fixCirclePosition)
            .attr('r', 1)
            .transition()
            .duration(500)
            .attr('r', this.commitRadius);

    },

    _renderPointers: function () {
        var view = this,
            existingPointers,
            newPointers,
            commits = this.repository.commits.commits;

        existingPointers = this.arrowBox.selectAll('line.commit-pointer')
            .data(commits, function (d) { return d.sha; })
            .attr('id', function (d) {
                return view.name + '-' + d.sha + '-to-' + d.parent;
            });

        existingPointers.transition()
            .duration(500)
            .call(fixPointerStartPosition, view)
            .call(fixPointerEndPosition, view);

        newPointers = existingPointers.enter()
            .append('svg:line')
            .attr('id', function (d) {
                return view.name + '-' + d.sha + '-to-' + d.parent;
            })
            .classed('commit-pointer', true)
            .call(fixPointerStartPosition, view)
            .attr('x2', function () { return d3.select(this).attr('x1'); })
            .attr('y2', function () {  return d3.select(this).attr('y1'); })
            .attr('marker-end', REG_MARKER_END)
            .transition()
            .duration(500)
            .call(fixPointerEndPosition, view);
    },

    _renderMergePointers: function () {
        var view = this,
            mergeCommits = [],
            existingPointers, newPointers;

        for (var i = 0; i < this.repository.commits.commits.length; i++) {
            var commit = this.repository.commits.commits[i];
            if (typeof commit.parent2 === 'string') {
                mergeCommits.push(commit);
            }
        }

        existingPointers = this.arrowBox.selectAll('polyline.merge-pointer')
            .data(mergeCommits, function (d) { return d.sha; })
            .attr('id', function (d) {
                return view.name + '-' + d.sha + '-to-' + d.parent2;
            });

        existingPointers.transition().duration(500)
            .attr('points', function (d) {
                var p1 = px1(d, view, 'parent2') + ',' + py1(d, view, 'parent2'),
                    p2 = px2(d, view, 'parent2') + ',' + py2(d, view, 'parent2');

                return [p1, p2].join(' ');
            });

        newPointers = existingPointers.enter()
            .append('svg:polyline')
            .attr('id', function (d) {
                return view.name + '-' + d.sha + '-to-' + d.parent2;
            })
            .classed('merge-pointer', true)
            .attr('points', function (d) {
                var x1 = px1(d, view, 'parent2'),
                    y1 = py1(d, view, 'parent2'),
                    p1 = x1 + ',' + y1;

                return [p1, p1].join(' ');
            })
            .attr('marker-end', MERGE_MARKER_END)
            .transition()
            .duration(500)
            .attr('points', function (d) {
                var points = d3.select(this).attr('points').split(' '),
                    x2 = px2(d, view, 'parent2'),
                    y2 = py2(d, view, 'parent2');

                points[1] = x2 + ',' + y2;
                return points.join(' ');
            });
    },

    _renderIdLabels: function () {
        var view = this,
            existingLabels,
            newLabels,
            commits = this.repository.commits.commits;

        existingLabels = this.commitBox.selectAll('text.id-label')
            .data(commits, function (d) { return d.sha; })
            .text(function (d) { return d.sha + '..'; });

        existingLabels.transition().call(fixIdPosition, view);

        newLabels = existingLabels.enter()
            .insert('svg:text', ':first-child')
            .classed('id-label', true)
            .text(function (d) { return d.sha + '..'; })
            .call(fixIdPosition, view);
    },

    _markBranchlessCommits: function () {
        var ref, commit, parent, parent2, c, b,
            refs = this.repository.getRefs(),
            commits = this.repository.commits.commits;

        // first mark every commit as branchless
        for (c = 0; c < commits.length; c++) {
            commits[c].branchless = true;
        }

        for (b = 0; b < refs.length; b++) {
            ref = refs[b];
            if (ref.isRemote !== true) {
                commit = ref.target;
                parent = commit.parent;
                parent2 = commit.parent2;

                commit.branchless = false;

                while (parent) {
                    parent.branchless = false;
                    parent = parent.parent;
                }

                // just in case this is a merge commit
                while (parent2) {
                    parent2.branchless = false;
                    parent2 = parent2.parent;
                }
            }
        }

        this.svg.selectAll('circle.commit').call(applyBranchlessClass);
        this.svg.selectAll('line.commit-pointer').call(applyBranchlessClass);
        this.svg.selectAll('polyline.merge-pointer').call(applyBranchlessClass);
    },

    renderTags: function () {
        var view = this,
            tagData = this.repository.getRefs(),
            existingTags, newTags;

        existingTags = this.tagBox.selectAll('g.branch-tag')
            .data(tagData, function (d) { return d.name; });

        existingTags.exit().remove();

        existingTags.select('rect')
            .transition()
            .duration(500)
            .attr('y', function (d) { return tagY(d, view); })
            .attr('x', function (d) {
                var commit = d.target,
                    width = Number(d3.select(this).attr('width'));

                return commit.cx - (width / 2);
            });

        existingTags.select('text')
            .transition()
            .duration(500)
            .attr('y', function (d) { return tagY(d, view) + 14; })
            .attr('x', function (d) { return d.target.cx; });

        newTags = existingTags.enter()
            .append('g')
            .attr('class', function (d) {
                var classes = 'branch-tag';
                if (d.isTracking === false) {
                    classes += ' git-tag';
                } else if (d.isRemote === true) {
                    classes += ' remote-branch';
                } else if (d.name.toUpperCase() === 'HEAD') {
                    classes += ' head-tag';
                }
                return classes;
            });

        newTags.append('svg:rect')
            .attr('width', function (d) {
                return (d.name.length * 6) + 10;
            })
            .attr('height', 20)
            .attr('y', function (d) { return tagY(d, view); })
            .attr('x', function (d) {
                var commit = d.target,
                    width = Number(d3.select(this).attr('width'));

                return commit.cx - (width / 2);
            });

        newTags.append('svg:text')
            .text(function (d) { return d.name; })
            .attr('y', function (d) { return tagY(d, view) + 14; })
            .attr('x', function (d) { return d.target.cx; });

        this._markBranchlessCommits();
    },

    // TODO Rename
    _setCurrentBranch: function (branch) {
        var display = this.svg.select('text.current-branch-display'),
            text = 'Current Branch: ';

        if (branch && branch.isRemote !== true) {
            text += branch.name;
        } else {
            text += ' DETACHED HEAD';
        }

        display.text(text);
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
        this.renderCommits();

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

        if (this.branches.indexOf(name) > -1) {
            throw new Error('Branch "' + name + '" already exists.');
        }

        this.getCommit('HEAD').tags.push(name);
        this.renderTags();
        return this;
    },

    tag: function (name) {
        this.branch('[' + name + ']');
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

        this.renderCommits();

        if (this.currentBranch) {
            this.checkout(this.currentBranch);
        } else {
            this.checkout(rebasedCommit.id);
        }
    }
};

module.exports = HistoryView;
