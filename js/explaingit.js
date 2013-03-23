define(['historyview', 'controlbox'], function (HistoryView, ControlBox) {
    return {
        generateId: HistoryView.generateId,
        HistoryView: HistoryView,
        ControlBox: ControlBox
    };
});