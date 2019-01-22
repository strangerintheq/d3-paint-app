// app/canvas.js

var createTranslate = require('./translate');
var svg = require('./svg');

var width = 800;
var height = 600;

module.exports = canvas;

function canvas(ctx) {

    var action;

    var helpers = svg.g('helpers');
    var canvas = svg.g('canvas');

    helpers.append('rect')
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

    ctx.broker.on(ctx.broker.events.DELETE, function () {
        var deleted = ctx.active;
        del();
        ctx.broker.fire(ctx.broker.events.ACTION, {
            undo: function () {
                canvas.node().appendChild(deleted.node());
                ctx.active = deleted;
                ctx.extent.updateExtent();
            },
            redo: del
        });

        function del() {
            deleted.remove();
            ctx.active = null;
            ctx.extent.updateExtent();
        }
    });

    return {
        applyTransform: function () {
            helpers.attr("transform", ctx.transform);
            canvas.attr("transform", ctx.transform);
        }
    };

    function drawStart() {
        var group = canvas
            .append('g')
            .datum({x: 0, y: 0, r: 0});

        action = createDrawAction(ctx.active);

        ctx.active = ctx.mode
            .dragStart(group, d3.event);

        applyBrush(ctx.active);
    }

    function applyBrush(active) {
        active.attr('stroke-width', 3)
            .attr('stroke', 'black')
            .attr('fill', 'transparent')
    }

    function drawEnd() {

        ctx.extent.updateExtent(ctx);
        !d3.event.sourceEvent.ctrlKey && ctx.broker.fire(ctx.broker.events.MODE, 'null');
        ctx.active = d3.select(ctx.active.node().parentNode)
            .call(createTranslate(ctx))
            .style('cursor', 'move');

        action.endDraw();
        ctx.broker.fire(ctx.broker.events.ACTION, action);
    }


    function createDrawAction(prev) {
        var shape;
        return {
            endDraw: function() {
                shape = ctx.active;
            },
            undo: function () {
                shape.remove();
                ctx.active = prev;
                ctx.extent.updateExtent();
            },
            redo: function () {
                canvas.node().append(shape.node());
                ctx.active = shape;
                ctx.extent.updateExtent();
            }
        }
    }
}
