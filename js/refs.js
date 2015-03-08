'use strict';

var Refs = function(repository, config) {
    this.refs = [];
    this.repository = repository;
    this.config = config;
};

Refs.prototype = {
    add: function(name, commit, isRemote) {
        if (isRemote === undefined) { isRemote = false; }

        var existing = this.get(name);
        
        if (existing === null) {
            var ref = {
                name: name,
                target: commit,
                isRemote: false,
                isTracking: this.config.isTracking
            };
            this.refs.push(ref);
            return ref;
        }
        else {
            existing.target = commit;
            return existing;
        }
    },
    
    move: function(name, commit) {
        
    },

    get: function(name) {
        var matchedRef = null;
        
        for (var i = 0; i < this.refs.length; i++) {
            var ref = this.refs[i];
            if (ref.name === name) {
                matchedRef = ref;
                break;
            }
        }
        
        return matchedRef;
    },
    
    checkout: function(name) {
        var existing = this.get(name);
        
        if (existing === null) {
            throw new Error('Ref does not exist');
        }
        else {
            this.repository._checkout(existing);
        }
    },
    
    contains: function(ref) {
        if (typeof ref === 'string') {
            return this.get(ref) !== null;
        }

        return this.refs.indexOf(ref) !== -1;
    },

    
};

module.exports = Refs;