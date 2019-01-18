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
        undoQueue.length && redoQueue.push(undoQueue.pop().undo());
    }

    function redo() {
        redoQueue.length && undoQueue.push(redoQueue.pop().redo());
    }
};
