require('./js/main');
var explainGit = require('./js/explaingit');

'use strict';

var examples = {
    'commit': {
        name: 'Commit',
        height: 200,
        baseLine: 0.4,
        commitData: [
            {id: 'e137e9b', tags: ['master']}
        ],
        initialMessage: 'Type git commit a few times.'
    },
    'branch': {
        name: 'Branch',
        baseLine: 0.6,
        commitData: [
            {id: 'e137e9b', tags: ['master']}
        ]
    },
    'tag': {
        name: 'Tag',
        baseLine: 0.6,
        commitData: [
            {id: 'e137e9b', tags: ['master']}
        ]
    },
    'checkout': {
        name: 'Checkout',
        height: 500,
        commitData: [
            {id: 'e137e9b'},
            {id: 'bb92e0e', parent: 'e137e9b', tags: ['master']},
            {id: 'e088135', parent: 'e137e9b', tags: ['dev']}
        ],
        initialMessage:
            'Use git checkout, git branch, and git commit commands until you understand.'
    },
    'checkout-b': {
        name: 'Checkout-b',
        height: 500,
        commitData: [
            {id: 'e137e9b'},
            {id: 'f5b32c8', parent: 'e137e9b'},
            {id: 'bb92e0e', parent: 'f5b32c8', tags: ['master']},
            {id: 'e088135', parent: 'e137e9b', tags: ['dev']}
        ],
        initialMessage:
            'Use git checkout -b and git commit commands until you understand.'
    },
    'reset': {
        name: 'Reset',
        height: 200,
        baseLine: 0.5,
        commitData: [
            {id: 'e137e9b'},
            {id: '0e70093', parent: 'e137e9b'},
            {id: '3e33afd', parent: '0e70093', tags: ['master']}
        ],
        initialMessage: 'Type "git reset HEAD^".'
    },
    'revert': {
        name: 'Revert',
        height: 200,
        baseLine: 0.5,
        commitData: [
            {id: 'e137e9b'},
            {id: '0e70093', parent: 'e137e9b'},
            {id: '3e33afd', parent: '0e70093', tags: ['master']}
        ],
        initialMessage: 'Type "git revert 0e70093".'
    },
    'merge': {
        name: 'Merge',
        height: 500,
        commitData: [
            {id: 'e137e9b'},
            {id: 'bb92e0e', parent: 'e137e9b', tags: ['master']},
            {id: 'f5b32c8', parent: 'e137e9b', tags: ['ff']},
            {id: 'e088135', parent: 'f5b32c8', tags: ['dev']}
        ],
        initialMessage:
            'Type "git merge dev".'
    },
    'rebase': {
        name: 'Rebase',
        height: 500,
        commitData: [
            {id: 'e137e9b'},
            {id: 'bb92e0e', parent: 'e137e9b', tags: ['master']},
            {id: 'f5b32c8', parent: 'e137e9b'},
            {id: 'e088135', parent: 'f5b32c8', tags: ['dev']}
        ],
        currentBranch: 'dev',
        initialMessage:
            'Type "git rebase master".'
    },
    'fetch': {
        name: 'Fetch',
        height: 500,
        commitData: [
            {id: 'e137e9b', tags: ['origin/master']},
            {id: '6ce726f', parent: 'e137e9b'},
            {id: 'bb92e0e', parent: '6ce726f', tags: ['master']},
            {id: '0cff760', parent: 'e137e9b', tags: ['origin/dev']},
            {id: '4ed301d', parent: '0cff760', tags: ['dev']}
        ],
        originData: [
            {id: 'e137e9b'},
            {id: '7eb7654', parent: 'e137e9b'},
            {id: '090e2b8', parent: '7eb7654'},
            {id: 'ee5df4b', parent: '090e2b8', tags: ['master']},
            {id: '0cff760', parent: 'e137e9b'},
            {id: '2f8d946', parent: '0cff760'},
            {id: '29235ca', parent: '2f8d946', tags: ['dev']}
        ],
        initialMessage:
            'Carefully compare the commit IDs between the origin and the local repository. ' +
            'Then type "git fetch".'
    },
    'pull': {
        name: 'Pull',
        height: 500,
        commitData: [
            {id: 'e137e9b', tags: ['origin/master']},
            {id: '46d095b', parent: 'e137e9b', tags: ['master']}
        ],
        originData: [
            {id: 'e137e9b'},
            {id: '7eb7654', parent: 'e137e9b'},
            {id: '090e2b8', parent: '7eb7654'},
            {id: 'ee5df4b', parent: '090e2b8', tags: ['master']}
        ],
        initialMessage:
            'Carefully compare the commit IDs between the origin and the local repository. ' +
            'Then type "git pull".'
    },
    'push': {
        name: 'Push',
        height: 500,
        commitData: [
            {id: 'e137e9b', tags: ['origin/master']},
            {id: '46d095b', parent: 'e137e9b', tags: ['master']}
        ],
        originData: [
            {id: 'e137e9b'},
            {id: '7eb7654', parent: 'e137e9b', tags: ['master']}
        ],
        initialMessage:
            'Carefully compare the commit IDs between the origin and the local repository. ' +
            'Then type "git push".'
    },
    'clean': {
        name: 'Clean',
        height: 200,
        baseLine: 0.4,
        commitData: [
            {id: 'e137e9b', tags: ['origin/master']},
            {id: '0e70093', parent: 'e137e9b'},
            {id: '3e33afd', parent: '0e70093', tags: ['master']}
        ],
        initialMessage: 'Type "git reset origin/master".'
    },
    'fetchrebase': {
        name: 'FetchRebase',
        height: 500,
        commitData: [
            {id: 'e137e9b', tags: ['origin/master', 'master']},
            {id: '46d095b', parent: 'e137e9b'},
            {id: 'dccdc4d', parent: '46d095b', tags: ['my-branch']}
        ],
        currentBranch: 'my-branch',
        originData: [
            {id: 'e137e9b'},
            {id: '7eb7654', parent: 'e137e9b'},
            {id: '090e2b8', parent: '7eb7654'},
            {id: 'ee5df4b', parent: '090e2b8', tags: ['master']}
        ],
        initialMessage:
            'First type "git fetch". Then type "git rebase origin/master".'
    },
    'deletebranches': {
        name: 'DeleteBranches',
        height: 500,
        baseLine: 0.6,
        commitData: [
            {id: 'e137e9b'},
            {id: 'bb92e0e', parent: 'e137e9b'},
            {id: 'd25ee9b', parent: 'bb92e0e', tags: ['master']},
            {id: '071ff28', parent: 'e137e9b', tags: ['protoss']},
            {id: 'f5b32c8', parent: 'bb92e0e'},
            {id: 'e088135', parent: 'f5b32c8', tags: ['zerg']},
            {id: '9e6c322', parent: 'bb92e0e'},
            {id: '593ae02', parent: '9e6c322', tags: ['terran']}
        ],
        currentBranch: 'terran',
        initialMessage:
            'Delete some branches.'
    },
    'freeplay': {
        name: 'Free',
        height: 500,
        commitData: [
            {id: 'e137e9b', tags: ['origin/master', 'master']}
        ],
        originData: [
            {id: 'e137e9b'},
            {id: '7eb7654', parent: 'e137e9b'},
            {id: '090e2b8', parent: '7eb7654'},
            {id: 'ee5df4b', parent: '090e2b8', tags: ['master']}
        ],
        initialMessage:
            'Have fun.'
    }
};

window.addEventListener('hashchange', open, false);
window.addEventListener('load', open, false);

function open() {
    var hash = window.location.hash.substr(1),
        linkId = 'open-' + hash,
        example = examples[hash];

    if (example) {
        explainGit.reset();
        document.getElementById(linkId).classList.add('selected');
        explainGit.open(example);
    } else if (hash === 'zen') {
        var elements = document.getElementsByClassName('row');
        for(var i = 0; i != elements.length; ++i)
        {
          elements[i].style.display = 'none';
        }
        document.getElementById('fork-me').style.display = 'none';

        explainGit.reset();

        explainGit.open({
            name: 'Zen',
            height: '100%',
            commitData: [
                {id: 'e137e9b', tags: ['master']}
            ],
            initialMessage:
                'Have fun.'
        });
    }
}