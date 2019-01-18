var svg = require('./svg');

module.exports = function (ctx) {

    return d3.drag()
        .on("start", function (d) {
            activate(d3.select(this));
            drag(d);
        })
        .on("drag", drag);

    function drag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }

    function activate(g) {

        if (ctx.active === g)
            return;

        var prev = ctx.active;
        ctx.active = g;

        ctx.broker.fire(ctx.broker.events.ACTION, {
            undo: function () {
                ctx.active = prev;
                ctx.extent.updateExtent();
            },
            redo: function () {
                ctx.active = g;
                ctx.extent.updateExtent();
            }
        });
    }
};
