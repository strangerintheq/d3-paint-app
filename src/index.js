var createAxes = require('./axes');
var createExtent = require('./extent');
var createCanvas = require('./canvas');
var createTransformer = require('./transformer');

var modes = {
    circle: require('./mode/circle'),
    rect: require('./mode/rect'),
    line: require('./mode/line'),
    pen: require('./mode/pen')
};

window.d3Paint = function (elementOrSelector) {

    var ctx = {};
    ctx.containerElement = d3.select(elementOrSelector);
    ctx.svg = ctx.containerElement.append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    ctx.helpers = g('helpers');
    ctx.canvas = g('canvas');
    ctx.axes = createAxes(ctx.svg);
    ctx.extent = createExtent(ctx);
    ctx.transformer = createTransformer(ctx);

    ctx.transform = d3.zoomTransform(ctx.svg);
    ctx.mode = null; // current mode
    ctx.active = null; // selected shape

    createCanvas(ctx);

    ctx.transformer.adjustSize();

    window.oncontextmenu = function () {
        return false
    };

    return {
        adjustSize: ctx.transformer.adjustSize,
        onTransform: ctx.transformer.onTransform,
        setMode: setMode
    };

    function setMode(newMode) {
        ctx.mode = modes[newMode];
    }

    function g(className) {
        return ctx.svg.append('g').classed(className, true);
    }
};
