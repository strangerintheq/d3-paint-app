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
        ctx.active.attr('transform', getTransform);
        ctx.extent.updateExtent(ctx);
    }

    function getTransform(d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return'rotate(' + d.r +',' + (x+d.x)  + ',' + (y+d.y) + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }
};