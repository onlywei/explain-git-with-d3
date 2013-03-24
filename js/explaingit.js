define(['historyview', 'controlbox', 'd3'], function (HistoryView, ControlBox, d3) {
    var prefix = 'ExplainGit',
        openSandBoxes = [],
        open,
        reset,
        explainGit;

    open = function (args) {
        var name = prefix + args.name,
            containerId = name + '-Container',
            container = d3.select('#' + containerId),
            historyView,
            controlBox;

        container.style('display', 'block');

        args.name = name;
        historyView = new HistoryView(args);

        controlBox = new ControlBox({
            historyView: historyView,
            initialMessage: args.initialMessage
        });

        controlBox.render(container);
        historyView.render(container);

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
        d3.select('a.openswitch').style('display', '');
    };

    explainGit = {
        HistoryView: HistoryView,
        ControlBox: ControlBox,
        generateId: HistoryView.generateId,
        open: open,
        reset: reset
    };

    window.explainGit = explainGit;

    return explainGit;
});