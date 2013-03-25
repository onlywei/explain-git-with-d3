define(['d3'], function () {
    "use strict";

    /**
     * @class ControlBox
     * @constructor
     */
    function ControlBox(config) {
        this.historyView = config.historyView;
        this.initialMessage = config.initialMessage || 'Enter git commands below.';
        this._commandHistory = [];
        this._currentCommand = -1;
        this._tempCommand = '';
    }

    ControlBox.prototype = {
        render: function (container) {
			var cBox = this,
				cBoxContainer, log, input;

            cBoxContainer = container.append('div')
                .classed('control-box', true);

            cBoxContainer.style('height', this.historyView.height + 5 + 'px');
            
			log = cBoxContainer.append('div')
                .classed('log', true)
                .style('height', this.historyView.height - 20 + 'px');

            input = cBoxContainer.append('input')
                .attr('type', 'text')
                .attr('placeholder', 'enter git command');

            input.on('keyup', function () {
                var e = d3.event;

                switch (e.keyCode) {
				case 13:
					if (this.value.trim() === '') {
						break;
					}

					cBox._commandHistory.unshift(this.value);
					cBox._tempCommand = '';
					cBox._currentCommand = -1;
					cBox.command(this.value);
					this.value = '';
					e.stopImmediatePropagation();
					break;
				case 38:
					var previousCommand = cBox._commandHistory[cBox._currentCommand + 1];
					if (cBox._currentCommand === -1) {
						cBox._tempCommand = this.value;
					}

					if (typeof previousCommand === 'string') {
						cBox._currentCommand += 1;
						this.value = previousCommand;
						this.value = this.value; // set cursor to end
					}
					e.stopImmediatePropagation();
					break;
				case 40:
					var nextCommand = cBox._commandHistory[cBox._currentCommand - 1];
					if (typeof nextCommand === 'string') {
						cBox._currentCommand -= 1;
						this.value = nextCommand;
						this.value = this.value; // set cursor to end
					} else {
						cBox._currentCommand = -1;
						this.value = cBox._tempCommand;
						this.value = this.value; // set cursor to end
					}
					e.stopImmediatePropagation();
					break;
                }
            });

            this.container = cBoxContainer;
			this.log = log;
            this.input = input;

            this.info(this.initialMessage);
        },
		
		destroy: function () {
			this.log.remove();
			this.input.remove();
			this.container.remove();

			for (var prop in this) {
				if (this.hasOwnProperty(prop)) {
					this[prop] = null;
				}
			}
		},

        _scrollToBottom: function () {
            var log = this.log.node();
            log.scrollTop = log.scrollHeight;
        },

        command: function (entry) {
            if (entry.trim === '') {
                return;
            }

            var split = entry.split(' ');

            this.log.append('div')
                .classed('command-entry', true)
                .html(entry);

            this._scrollToBottom();

            if (split[0] !== 'git') {
                return this.error();
            }

            var method = split[1],
                args = split.slice(2);

            try {
                if (typeof this[method] === 'function') {
                    this[method](args);
                } else {
                    this.error();
                }
            } catch (ex) {
                var msg = (ex && ex.message) ? ex.message: null;
                this.error(msg);
            }
        },

        info: function (msg) {
            this.log.append('div').classed('info', true).html(msg);
            this._scrollToBottom();
        },

        error: function (msg) {
            msg = msg || 'I don\'t understand that.';
            this.log.append('div').classed('error', true).html(msg);
            this._scrollToBottom();
        },

        commit: function () {
            this.historyView.commit();
        },

        branch: function (args) {
            if (args.length < 1) {
                this.info(
                    'You need to give a branch name. ' +
                    'Normally if you don\'t give a name, ' +
                    'this command will list your local branches on the screen.'
                );

                return;
            }

            while (args.length > 0) {
                var arg = args.shift();

                switch (arg) {
				case '--remote':
					this.info(
						'This command normally displays all of your remote tracking branches.'
					);
					args.length = 0;
					break;
                case '-d':
                    var name = args.pop();
                    this.historyView.deleteBranch(name);
                    break;
				default:
					var remainingArgs = [arg].concat(args);
					args.length = 0;
					this.historyView.branch(remainingArgs.join(' '));
                }
            }
        },

        checkout: function (args) {
            while (args.length > 0) {
                var arg = args.shift();

                switch (arg) {
				case '-b':
					var name = args[args.length - 1];
					try {
						this.historyView.branch(name);
					} catch (err) {
						if (err.message.indexOf('already exists') === -1) {
							throw new Error(err.message);
						}
					}
					break;
				default:
					var remainingArgs = [arg].concat(args);
					args.length = 0;
					this.historyView.checkout(remainingArgs.join(' '));
                }
            }
        },

        reset: function (args) {
            while (args.length > 0) {
                var arg = args.shift();
                
                switch (arg) {
                case '--soft':
                    this.info(
                        'The "--soft" flag works in real git, but ' +
                        'I am unable to show you how it works in this demo. ' +
                        'So I am just going to show you what "--hard" looks like instead.'
                    );
                    break;
                case '--mixed':
                    this.info(
                        'The "--mixed" flag works in real git, but ' +
                        'I am unable to show you how it works in this demo.'
                    );
                    break;
                case '--hard':
                    this.historyView.reset(args.join(' '));
                    args.length = 0;
                    break;
                default:
                    var remainingArgs = [arg].concat(args);
                    args.length = 0;
                    this.info('Assuming "--hard".');
                    this.historyView.reset(remainingArgs.join(' '));
                }
            }
        },

        merge: function (args) {
            var ref = args.shift(),
                result = this.historyView.merge(ref);

            if (result === 'Fast-Forward') {
                this.info('You have performed a fast-forward merge.');
            }
        },
        
        rebase: function (args) {
            var ref = args.shift(),
                result = this.historyView.rebase(ref);

            if (result === 'Fast-Forward') {
                this.info('Fast-forwarded to ' + ref + '.');
            }
        }
    };

    return ControlBox;
});