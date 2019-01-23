// app/edit.js

var svg = require('./svg');

module.exports = function (ctx) {

    var pt = ctx.svg.node().createSVGPoint();
    var edit = svg.g('edit');
    var active;
    var activePathD;
    var activePathCmds;

    ctx.broker.on(ctx.broker.events.EDIT, startEdit);

    return {
        updatePathEditor: updatePathEditorPoints
    };

    function updatePathEditorPoints() {
        if (!active)
            return;

        var activePathPoints = [];
        var ctm = active.getScreenCTM();
        var cmdIndex = 0;
        activePathD.forEach(function (command) {
            var coords = command.split(',');
            var notNeedCmd;
            while (coords.length > 1) {
                pt.x = +coords.shift().trim();
                pt.y = +coords.shift().trim();
                var p = pt.matrixTransform(ctm);
                activePathPoints.push({
                    x: p.x - svg.screenOffsetX(),
                    y: p.y - svg.screenOffsetY(),
                    px: pt.x,
                    py: pt.y,
                    cmd: notNeedCmd ? '' : activePathCmds[cmdIndex++]
                });
                notNeedCmd = true;
            }
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
            .attr('corsor', 1.2)
            .attr('fill', 'transparent')
            .call(d3.drag()
                .subject(function (d) {
                    return d
                })
                .on('start', function () {

                })
                .on('drag', function (d) {
                    d.x = d3.event.x;
                    d.y = d3.event.y;
                    upd(d3.select(this))
                    console.log(d)
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
        var d = active.getAttribute('d');
        var s = 'MmLlSsQqHhVvCcSsQqTtAaZz'.split('');
        activePathD = d.split(new RegExp(s.join('|'), 'g'));
        activePathCmds = [];
        d.split('').forEach(function (sym) {
            if (s.indexOf(sym) > -1)
                activePathCmds.push(sym);
        });
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