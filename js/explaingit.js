var HistoryView = require('./historyview');
var ControlBox = require('./controlbox');
var d3 = require('d3');

'use strict';

var prefix = 'ExplainGit',
    openSandBoxes = [],
    open,
    reset;

open = function (_args) {
    var args = Object.create(_args),
        name = prefix + args.name,
        containerId = name + '-Container',
        container = d3.select('#' + containerId),
        playground = container.select('.playground-container'),
        historyView, originView = null,
        controlBox;

    container.style('display', 'block');

    args.name = name;
    historyView = new HistoryView(args);

    if (args.originData) {
        originView = new HistoryView({
            name: name + '-Origin',
            width: 300,
            height: 225,
            commitRadius: 15,
            remoteName: 'origin',
            commitData: args.originData
        });

        originView.render(playground);
    }

    controlBox = new ControlBox({
        historyView: historyView,
        originView: originView,
        initialMessage: args.initialMessage
    });

    controlBox.render(playground);
    historyView.render(playground);

    openSandBoxes.push({
        hv: historyView,
        cb: controlBox,
        container: container
    });
};

reset = function () {
    for (var i = 0; i < openSandBoxes.length; i++) {
        var osb = openSandBoxes[i];
        osb.hv.destroy();
        osb.cb.destroy();
        osb.container.style('display', 'none');
    }

    openSandBoxes.length = 0;
    d3.selectAll('a.openswitch').classed('selected', false);
};

module.exports = {
    HistoryView: HistoryView,
    ControlBox: ControlBox,
    generateId: HistoryView.generateId,
    open: open,
    reset: reset
};