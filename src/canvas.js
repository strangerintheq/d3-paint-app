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
        var group = ctx.canvas.append('g').call(d3.drag()
            .on("start", function () {
                ctx.active = d3.select(this);
                ctx.extent.updateExtent(ctx);
            })
            .on("drag", function () {
                d3.select(this).attr('transform', getTransform());
                ctx.extent.updateExtent(ctx);
            }));

        ctx.active = ctx.mode.dragStart(group, d3.event);

        applyBrush(ctx.active);
    }


    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function getTransform() {
        var x = 0;
        var y = 0;
        return 'translate(' + x +',' + y + ')'
    }

    function dragEnd() {
        ctx.extent.updateExtent(ctx);
    }

}





