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
                ctx.mode && ctx.mode.dragStart && drawStart();
            })
            .on("drag", function () {
                ctx.mode && ctx.mode.dragMove && ctx.mode.dragMove(d3.event);
            })
            .on("end", function () {
                ctx.mode && ctx.mode.dragStart && drawEnd();
            }));



    ctx.broker.on(ctx.broker.events.DELETE, function () {
        var deleted = ctx.active;
        del();
        ctx.broker.fire(ctx.broker.events.ACTION, {
            undo: function () {
                canvas.node().appendChild(deleted.node());
                ctx.active = deleted;
                ctx.extent.updateExtent();
                ctx.edit.updatePathEditor();

            },
            redo: del
        });

        function del() {
            deleted.remove();
            ctx.active = null;
            ctx.extent.updateExtent();
            ctx.edit.updatePathEditor();
        }
    });

    return {

        getImage: function() {
            return `<svg xmlns="http://www.w3.org/2000/svg" 
                         xmlns:xlink="http://www.w3.org/1999/xlink" 
                         width="${width}" 
                         height="${height}"
                         style="background-color:white" 
                         viewBox="${-width/2} ${-height/2} ${width} ${height}">
                         
                        ${canvas.html()}
                        
                    </svg>`;
        },

        applyTransform: function () {
            helpers.attr("transform", ctx.transform);
            canvas.attr("transform", ctx.transform);
        }

    };

    function drawStart() {


        var group;

        if (ctx.mode.isNeedToCreateGroup())
            group = canvas
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


        !d3.event.sourceEvent.ctrlKey && ctx.broker.fire(ctx.broker.events.MODE, 'null');
        ctx.active = d3.select(ctx.active.node().parentNode)
            .call(createTranslate(ctx))
            .style('cursor', 'move')
            .attr('transform', svg.getTransform);

        action.endDraw();

        ctx.mode.dragEnd && ctx.mode.dragEnd(d3.event);

        ctx.broker.fire(ctx.broker.events.ACTION, action);
        ctx.extent.updateExtent();
        ctx.edit.updatePathEditor();
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
                ctx.edit.updatePathEditor();
            },
            redo: function () {
                canvas.node().append(shape.node());
                ctx.active = shape;
                ctx.extent.updateExtent();
                ctx.edit.updatePathEditor();
            }
        }
    }
}
