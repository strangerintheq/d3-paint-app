// app/undoredo.js

module.exports = function (ctx) {

    var undoQueue = [];
    var redoQueue = [];

    ctx.broker.on(ctx.broker.events.UNDO, undo);
    ctx.broker.on(ctx.broker.events.REDO, redo);
    ctx.broker.on(ctx.broker.events.ACTION, add);

    function add(action) {
        if (!action.undo || !action.redo) {
            throw Error('undo/redo method not found')
        }
        undoQueue.push(action);
        redoQueue = [];
    }

    function undo() {
        if (!undoQueue.length)
            return;
        var action = undoQueue.pop();
        action.undo();
        redoQueue.push(action);
    }

    function redo() {
        if (!redoQueue.length)
            return;
        var action = redoQueue.pop();
        action.redo();
        undoQueue.push(action);
    }
};
