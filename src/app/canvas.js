// app/canvas.js

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
                ctx.mode && drawStart();
            })
            .on("drag", function () {
                ctx.mode && ctx.mode.dragMove(d3.event);
            })
            .on("end", function () {
                ctx.mode && drawEnd();
            }));

    function drawStart() {

        var dragger = d3.drag()
            .on("start", function (d) {
                ctx.active = d3.select(this);
                drag(d);
            })
            .on("drag", drag);

        var group = ctx.canvas
            .append('g')
            .style('cursor', 'move')
            .datum({x: 0, y: 0, r: 0, id:'x'})
            .call(dragger);

        ctx.active = ctx.mode
            .dragStart(group, d3.event);

        applyBrush(ctx.active);

        function drag(d) {
            d.x = d3.event.x;
            d.y = d3.event.y;
            ctx.active.attr('transform', getTransform);
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
        return'rotate(' + d.r +',' + (x+d.x)  + ',' + (y+d.y) + ')' +
            'translate(' + d.x +',' + d.y + ')' ;
    }

    function drawEnd() {
        ctx.extent.updateExtent(ctx);
        ctx.broker.fire(ctx.broker.events.MODE, 'null');
        ctx.active = d3.select(ctx.active.node().parentNode);
    }

}





