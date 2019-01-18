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

    return {
        applyTransform: function () {
            helpers.attr("transform", ctx.transform);
            canvas.attr("transform", ctx.transform);
        }
    };

    function drawStart() {

        var group = canvas
            .append('g')
            .style('cursor', 'move')
            .datum({x: 0, y: 0, r: 0});

        action = createAction(ctx.active);

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
        ctx.broker.fire(ctx.broker.events.MODE, 'null');
        ctx.active = d3.select(ctx.active.node().parentNode)
            .call(createTranslate(ctx));

        action.added = ctx.active;

        ctx.broker.fire(ctx.broker.events.ACTION, action);
    }


    function createAction(prev) {
        var action = {
            prev: prev,
            added: null,
            undo: function () {
                action.added.remove();
                ctx.active = action.prev;
                ctx.extent.updateExtent();
            },
            redo: function () {

            }
        };
        return action
    }

}
