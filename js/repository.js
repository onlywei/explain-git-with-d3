'use strict';

var Commits = require('./commits');
var Refs = require('./refs');

var Repository = function() {
    this.commits = new Commits(this);
    this.tags = new Refs(this, { isTracking: false });
    this.branches = new Refs(this, { isTracking: true });

    this.currentBranch = null;
    var initalCommit = this.commits.add(null);
    this.currentBranch = this.branches.add('master', initalCommit);
    this.head = initalCommit;
};

Repository.prototype = {
    find: function(commitish) {
        if (this.commits.contains(commitish)) {
            return this.commits.get(commitish);
        } else if (this.branches.contains(commitish)) {
            return this.branches.get(commitish);
        } else if (this.tags.contains(commitish)) {
            return this.tags.get(commitish);
        } else {
            throw new Error('Cannot find \'' + commitish + '\'');
        }
    },
    
    getRefs: function() {
        return this.branches.refs
            .concat(this.tags.refs)
            .concat([{name: 'HEAD', target: this.head }]);
    },
    
    _checkout: function(commitish) {
        if (this.commits.contains(commitish)) {
            this._checkoutCommit(this.commits.get(commitish));
        } else if (this.branches.contains(commitish)) {
            this._checkoutRef(this.branches.get(commitish));
        } else if (this.tags.contains(commitish)) {
            this._checkoutRef(this.tags.get(commitish));
        } else {
            throw new Error('Cannot find \'' + commitish + '\'');
        }
    },
    
    _checkoutRef: function(ref) {
        if (ref.isTracked) {
            this.currentBranch = ref;
        } else {
            this.currentBranch = null;
        }
        this.head = ref.target;
    },
    
    _checkoutCommit: function(commit) {
        this.currentBranch = null;
        this.head = commit;
    }
};

module.exports = Repository;