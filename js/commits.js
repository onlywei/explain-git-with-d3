'use strict';

var generateSha = function () {
    return Math.floor((1 + Math.random()) * 0x10000000)
               .toString(16).substring(1);
};


var Commits = function(repository) {
    this.repository = repository;
    this.commits = [];
};

Commits.prototype = {
    add: function(parentCommit) {
        var newCommit = {
            sha: generateSha(),
            parents: [parentCommit]
        };
        this.commits.push(newCommit);
        this.head = newCommit;
        if (this.currentBranch !== null) {
            this.currentBranch.target = newCommit;
        }
    },

    get: function(sha) {
        var matchedCommit = null;

        for (var i = 0; i < this.commits.length; i++) {
            var commit = this.commits[i];
            if (commit.sha === sha) {
                matchedCommit = commit;
                break;
            }
        }
        
        return matchedCommit;
    },

    contains: function (commit) {
        if (typeof ref === 'string') {
            return this.get(commit) !== null;
        }

        return this.refs.indexOf(commit) !== -1;
    },
    
    getUnreachableCommits: function() {
        
    }
};

module.exports = Commits;