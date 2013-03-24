define(['d3'], function () {
    "use strict";

    /**
     * @class ControlBox
     * @constructor
     */
    function ControlBox (config) {
        this.historyView = config.historyView;
        this.initialMessage = config.initialMessage || 'Enter git commands below.';
        this._commandHistory = [];
        this._currentCommand = -1;
        this._tempCommand = '';
    }

    ControlBox.prototype = {
        render: function (container) {
            container = d3.select(container).append('div')
                .classed('control-box', true);

            container.node().style.height = this.historyView.height + 5 + 'px';

            var cBox = this;

            var log = container.append('div')
                .classed('log', true)
                .style('height', this.historyView.height - 20 + 'px');

            var input = container.append('input')
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

            this.log = log;
            this.input = input;

            this.info(this.initialMessage);
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

        commit: function (args) {
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
                    default:
                        this.historyView.checkout(arg);
                }
            }
        }
    };

    return ControlBox;
});