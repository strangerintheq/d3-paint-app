// app/edit.js

var svg = require('./svg');

module.exports = function (ctx) {
    var pt = ctx.svg.node().createSVGPoint();
    var edit = svg.g('edit');

    ctx.broker.on(ctx.broker.events.EDIT, function () {
        var path = ctx.active.node().firstChild;
        var d = path.getAttribute('d');
        var s = 'MmLlSsQqHhVvCcSsQqTtAaZz'.split('')
        var tokens = d.split(new RegExp(s.join('|'), 'g'));
        var pts = [];
        tokens.forEach(function (command) {
            var coords = command.split(',');
            while (coords.length > 1) {
                pts.push({
                    x: coords.shift(),
                    y: coords.shift()
                })
            }
        });

        var ctm = path.getScreenCTM();

        var selection = edit.selectAll('circle.editor-anchor-point').data(pts);
        selection
            .enter()
            .append('circle')
            .classed('editor-anchor-point', true)
            .attr('r', 5)
            .attr('stroke', '#0020ff')
            .attr('stroke-width', 1.2)
            .attr('fill', 'transparent')
            .each(function (d) {

                pt.x = d.x;
                pt.y = d.y;

                var p = pt.matrixTransform(ctm);

                d3.select(this)
                    .attr('cx', p.x - svg.screenOffsetX())
                    .attr('cy', p.y - svg.screenOffsetY())
            });

        selection.exit()
            .remove();
    })
};