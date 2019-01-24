// app/edit.js
var svgpath = require('svgpath');
var svg = require('./svg');

module.exports = function (ctx) {

    var pt = ctx.svg.node().createSVGPoint();
    var edit = svg.g('edit');
    var active;
    var svgPathEditor;
    ctx.broker.on(ctx.broker.events.EDIT, startEdit);

    return {
        updatePathEditor: updatePathEditorPoints
    };

    function updatePathEditorPoints() {
        if (!active)
            return;

        var activePathPoints = [];
        svgPathEditor = svgpath(active.getAttribute('d'));
        svgPathEditor.segments.forEach(function (seg) {
            if (!seg[1])
                return;

            pt.x = seg[1];
            pt.y = seg[2];
            var p = pt.matrixTransform(active.getScreenCTM());
            activePathPoints.push({
                x: p.x - svg.screenOffsetX(),
                y: p.y - svg.screenOffsetY(),
                seg: seg
            });
        });

        var selection = edit
            .selectAll('circle.editor-anchor-point')
            .data(activePathPoints);

        selection
            .enter()
            .append('circle')
            .classed('editor-anchor-point', true)
            .attr('r', 5)
            .attr('stroke', '#fcf9ff')
            .attr('stroke-width', 1.2)
            .attr('cursor', 'pointer')
            .attr('fill', 'transparent')
            .call(d3.drag()
                .subject(function (d) {
                    return d;
                })
                .on('start', function () {

                })
                .on('drag', function (d) {
                    d.x = d3.event.x;
                    d.y = d3.event.y;
                    upd(d3.select(this));

                    pt.x = d.x + svg.screenOffsetX();
                    pt.y = d.y + svg.screenOffsetY();

                    var p = pt.matrixTransform(active.getScreenCTM().inverse());

                    d.seg[1] = p.x;
                    d.seg[2] = p.y;
                    active.setAttribute('d', svgPathEditor.toString());
                    ctx.extent.updateExtent();
                })
                .on('end', function (d) {

                }))
            .call(upd)
            .merge(selection);

        selection.exit()
            .remove();

        upd(selection)
    }

    function startEdit() {
        active = ctx.active.node().firstChild;

        updatePathEditorPoints()
    }

    function upd(selection) {
        selection
            .attr('cx', function (d) {
                return d.x;
            })
            .attr('cy', function (d) {
                return d.y;
            });
    }
};