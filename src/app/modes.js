// app/modes.js

var modes = {
    circle: require('../mode/circle'),
    rect: require('../mode/rect'),
    line: require('../mode/line'),
    pen: require('../mode/pen'),
    points: require('./point-based-draw')
};

module.exports = function (ctx) {
    ctx.broker.on(ctx.broker.events.MODE, function (newMode) {
        ctx.mode = modes[newMode];
        ctx.mode.init && ctx.mode.init(ctx);
    });
};
