define(['historyview', 'controlbox', 'd3', 'd3.contextMenu'], function (HistoryView, ControlBox, d3, contextMenu) {
    var prefix = 'ExplainGit',
        openSandBoxes = [],
        open,
        reset,
        explainGit;

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
        
        if (originView) {
            originView.svg.on('contextmenu', function() {
                contextMenu([
                    {title: 'Fetch', action: function() { controlBox.command('git fetch');}},
                    {title: 'Push', action: function() { controlBox.command('git push origin'); }},
                    {title: 'Pull', action: function() { controlBox.command('git pull'); }}
                ])();
            })
        }

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