// canvas.js

var width = 800;
var height = 600;

module.exports = canvas;

function canvas(ctx) {

    ctx.helpers.append('rect')
        .classed('canvas', true)
        .attr('fill', 'rgba(0,0,0,0.2)')
        .attr('x', -width/2)
        .attr('y', -height/2)
        .attr('width', width)
        .attr('height', height)
        .call(d3.drag()
            .on("start", function () {
                ctx.mode && dragStart();
            })
            .on("drag", function () {
                ctx.mode && ctx.mode.dragMove(d3.event);
            })
            .on("end", function () {
                ctx.mode && dragEnd();
            }));

    function dragStart() {

        var dragger = d3.drag()
            .subject(function (d) {
                return d;
            })
            .on("start", function (d) {
                ctx.active = d3.select(this);
                drag(d);
            })
            .on("drag", drag);

        var group = ctx.canvas.append('g')
            .datum({x: 0, y: 0, r: 77})
            .call(dragger);

        ctx.active = ctx.mode.dragStart(group, d3.event);

        applyBrush(ctx.active);

        function drag(d) {
            //d.x = d3.event.x;
            //d.y = d3.event.y;
            d.r = d3.event.y;
            ctx.active.attr('transform', getTransform(d));
            ctx.extent.updateExtent(ctx);
        }
    }

    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function getTransform(d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return'rotate(' + d.r +',' + x + ',' + y + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }

    function dragEnd() {
        ctx.extent.updateExtent(ctx);
        ctx.broker.fire(ctx.broker.events.MODE, 'null')
    }

}





