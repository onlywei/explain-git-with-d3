'use strict';

var Commits = require('./commits');
var Refs = require('./refs');

var Repository = function() {
    this.commits = new Commits(this);
    this.tags = new Refs(this, { isTracking: false });
    this.branches = new Refs(this, { isTracking: true });

    var initalCommit = this.commits.add(null);
    this.currentBranch = this.branches.add('master', initalCommit);
    this.head = initalCommit;
};

Repository.prototype = {
    _checkout: function(ref) {
        if (this.commits.contains(ref)) {
            this._checkoutCommit(this.commits.get(ref));
        } else if (this.branches.contains(ref)) {
            this._checkoutRef(this.branches.get(ref));
        } else if (this.tags.contains(ref)) {
            this._checkoutRef(this.tags.get(ref));
        } else {
            throw new Error('Cannot find ref \'' + ref + '\'');
        }
        this.head = ref.target;
    },
    
    _checkoutRef: function(ref) {
        if (ref.isTracked) {
            this.currentBranch = ref;
        } else {
            this.currentBranch = null;
        }
    },
    
    _checkoutCommit: function(commit) {
        this.currentBranch = null;
        this.head = commit;
    }
};

module.exports = Repository;