var svg = require('./svg');

module.exports = function (ctx) {

    return d3.drag()
        .on("start", function (d) {
            ctx.active = d3.select(this);
            drag(d);
        })
        .on("drag", drag);

    function drag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent(ctx);
    }
};