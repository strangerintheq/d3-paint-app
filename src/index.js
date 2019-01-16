var createAxes = require('./app/axes');
var createExtent = require('./app/extent');
var createCanvas = require('./app/canvas');
var createTransformer = require('./app/transformer');
var createEvents = require('./app/broker');
var createModes = require('./app/modes');

window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape
    ctx.broker = createEvents();
    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    ctx.helpers = g('helpers');
    ctx.canvas = g('canvas');
    ctx.axes = createAxes(ctx.svg);
    ctx.extent = createExtent(ctx);
    ctx.transform = d3.zoomTransform(ctx.svg);

    createTransformer(ctx);
    createModes(ctx);
    createCanvas(ctx);

    ctx.broker.fire(ctx.broker.events.RESIZE);

    window.oncontextmenu = function () {
        return false
    };

    return ctx.broker;

    function g(className) {
        return ctx.svg.append('g').classed(className, true);
    }

};
