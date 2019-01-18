// index.js

var createAxes = require('./app/axes');
var createExtent = require('./app/extent');
var createCanvas = require('./app/canvas');
var createPanZoom = require('./app/panzoom');
var createBroker = require('./app/broker');
var createModes = require('./app/modes');
var addUndoRedoSupport = require('./app/undoredo');
var svg = require('./app/svg');

window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape

    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg');
    ctx.transform = d3.zoomTransform(ctx.svg);

    svg.setContext(ctx);

    ctx.broker = createBroker();
    ctx.axes = createAxes(ctx.svg);
    ctx.canvas = createCanvas(ctx);
    ctx.extent = createExtent(ctx);

    createModes(ctx);
    createPanZoom(ctx);
    addUndoRedoSupport(ctx);

    ctx.broker.fire(ctx.broker.events.RESIZE);

    window.oncontextmenu = function () {
        return false
    };

    return ctx.broker;
};
