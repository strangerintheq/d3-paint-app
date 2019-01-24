// app/edit.js
var svgpath = require('svgpath');
var svg = require('./svg');

var commandLayout = {
    a: [[1, 2], [6, 7]],
    c: [[1, 2, true], [3, 4, true], [5, 6]],
   // h: 1,
    l: [[1, 2]],
    m: [[1, 2]],
    r: [[1, 2]],
    q: [[1, 2], [3, 4]],
    s: [[1, 2], [3, 4]],
    t: [[1, 2]],
  // v: 1,
  // z: 0
};

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

        function addPoint(segment, xIndex, yIndex, isControlPoint) {
            pt.x = segment[xIndex];
            pt.y = segment[yIndex];
            var p = pt.matrixTransform(active.getScreenCTM());
            activePathPoints.push({
                x: p.x - svg.screenOffsetX(),
                y: p.y - svg.screenOffsetY(),
                xIndex: xIndex,
                yIndex: yIndex,
                segment: segment,
                isControlPoint: isControlPoint
            });
        }

        svgPathEditor = svgpath(active.getAttribute('d'));
        svgPathEditor.segments.forEach(function (seg) {
            if (!seg[1])
                return;
            commandLayout[seg[0].toLowerCase()].forEach(function (indexes) {
                addPoint(seg, indexes[0],indexes[1], indexes[2]);
            })
        });

        var selection = edit
            .selectAll('circle.editor-anchor-point')
            .data(activePathPoints);

        selection
            .enter()
            .append('circle')
            .classed('editor-anchor-point', true)
            .attr('r', 5)
            .attr('stroke', function (d) {
                return d.isControlPoint ? '#ff0013' : '#fcf9ff';
            })
            .attr('stroke-width', 1.2)
            .attr('cursor', 'pointer')
            .attr('fill', 'transparent')
            .call(d3.drag()
                .subject(function (d) {
                    return d;
                })
                .on('drag', function (d) {
                    d.x = d3.event.x;
                    d.y = d3.event.y;
                    upd(d3.select(this));
                    pt.x = d.x + svg.screenOffsetX();
                    pt.y = d.y + svg.screenOffsetY();
                    var p = pt.matrixTransform(active.getScreenCTM().inverse());
                    d.segment[d.xIndex] = p.x;
                    d.segment[d.yIndex] = p.y;
                    active.setAttribute('d', svgPathEditor.toString());
                    ctx.extent.updateExtent();
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