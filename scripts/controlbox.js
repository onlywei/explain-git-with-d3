define(['d3'], function () {
    "use strict";

    /**
     * @class ControlBox
     * @constructor
     */
    function ControlBox (config) {
        this.historyView = config.historyView;
        this.initialMessage = config.initialMessage || 'Enter git commands below.';
    }
    
    ControlBox.prototype = {
        render: function (container) {
            container = d3.select(container).append('div')
                .classed('control-box', true);

            container.node().style.height = this.historyView.height + 5 + 'px';

            var cConsole = this;

            var log = container.append('div')
                .classed('log', true)
                .style('height', this.historyView.height - 20 + 'px');

            var input = container.append('input')
                .attr('type', 'text')
                .attr('placeholder', 'enter git command');

            input.on('keyup', function () {
                if (d3.event.keyCode === 13) {
                    cConsole.command(this.value);
                    this.value = '';
                    d3.event.stopImmediatePropagation();
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

            try {
                var result = this[split[1]](split.slice(2));
            
                if (typeof result === 'string') {
                    this.error(result);
                }
            } catch (ex) {
                this.error();
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
        
        }
    };

    return ControlBox;
});