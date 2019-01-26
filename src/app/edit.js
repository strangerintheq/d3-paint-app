// app/edit.js
var svgpath = require('svgpath');
var svg = require('./svg');

var commandLayout = {
    m: [[1, 2]],
    l: [[1, 2]],
    t: [[1, 2]],
    a: [[1, 2], [6, 7]],
    q: [[1, 2], [3, 4]],
    s: [[1, 2], [3, 4]],
    c: [[1, 2], [3, 4], [5, 6]],
};



module.exports = function (ctx) {

    var pt = ctx.svg.node().createSVGPoint();
    var edit = svg.g('edit');
    var controlPointsPath = edit.append('path')
        .attr('stroke', 'red');
    var active;
    var svgPathEditor;
    ctx.broker.on(ctx.broker.events.EDIT, startEdit);

    return {
        updatePathEditor: updatePathEditorPoints
    };

    function updateControlPointsPaths(edit, controlPointsPath) {
        var controlPointsPathD = "";
        d3.selectAll('circle.editor-anchor-point')
            .each(function (d) {
                if(d.prevControlPoint || d.controlPoint)
                    addLine(d3.select(this), d.index-1)
            });

        function addLine(curPt, ptIdx) {
            try {
                var toPt = edit.select('.pt_' + ptIdx);
                controlPointsPathD +=
                    "M" + toPt.attr('cx') +
                    "," + toPt.attr('cy') +
                    "L" + curPt.attr('cx') +
                    "," + curPt.attr('cy');
            } catch (e) {
                console.log(curPt)
            }
        }

        controlPointsPath.attr('d', controlPointsPathD)
    }

    function updatePathEditorPoints() {
        if (!active)
            return;

        var activePathPoints = [];

        function isControlPoint(segmentIndex, pointIndex) {
            var cmd = svgPathEditor.segments[segmentIndex][0].toLowerCase();
            return commandLayout[cmd].length !== pointIndex + 1;
        }

        function isPrevControlPoint() {
            return activePathPoints.length && activePathPoints[activePathPoints.length - 1].controlPoint;
        }

        function addPoint(segmentIndex, pointIndex, xIndex, yIndex) {
            var segment = svgPathEditor.segments[segmentIndex];
            pt.x = segment[xIndex];
            pt.y = segment[yIndex];
            var p = pt.matrixTransform(active.getScreenCTM());
            activePathPoints.push({
                x: p.x - svg.screenOffsetX(),
                y: p.y - svg.screenOffsetY(),
                xIndex: xIndex,
                yIndex: yIndex,
                segmentIndex: segmentIndex,
                pointIndex: pointIndex,
                index: activePathPoints.length,
                controlPoint: isControlPoint(segmentIndex, pointIndex),
                prevControlPoint: isPrevControlPoint(),
            });
        }

        svgPathEditor = svgpath(active.getAttribute('d'));
        svgPathEditor.segments.forEach(function (seg, i) {
            if (!seg[1])
                return;
            commandLayout[seg[0].toLowerCase()].forEach(function (indexes, group) {
                addPoint(i, group, indexes[0], indexes[1]);
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
            .attr('stroke-width', 1.2)
            .attr('cursor', 'pointer')
            .attr('fill', 'transparent')
            .each(function (d) {
                d3.select(this)
                    .classed('seg_'+d.segmentIndex+'_'+d.pointIndex, true)
                    .classed('pt_'+d.index, true)
            })
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
                    var seg = svgPathEditor.segments[d.segmentIndex];
                    seg[d.xIndex] = p.x;
                    seg[d.yIndex] = p.y;
                    active.setAttribute('d', svgPathEditor.toString());
                    ctx.extent.updateExtent();
                }))
            .call(upd)
            .merge(selection);

        selection.exit()
            .remove();

        upd(selection)


        function upd(selection) {

            selection
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                })
                .attr('stroke', function (d) {
                    return d.controlPoint ? '#ff0013' : '#fcf9ff';
                });

            updateControlPointsPaths(edit, controlPointsPath);

        }
    }

    function startEdit() {
        active = ctx.active.node().firstChild;
        updatePathEditorPoints()
    }

};