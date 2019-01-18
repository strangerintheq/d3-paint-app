// app/rotate.js

var svg = require('./svg');

module.exports = rotate;

function rotate(ctx, center) {
    return function (knob) {
        var action;
        return d3.drag()
            .on("start", function (d) {
                fill(knob, 'rgba(0, 40, 255, 0.5)');
                var r = ctx.active.node().getBoundingClientRect();
                d.cx = r.x + r.width/2 - svg.screenOffsetX(ctx);
                d.cy = r.y + r.height/2 - svg.screenOffsetY(ctx);
                center.attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .attr('display', 'visible');
                action = createRotateAction(ctx.active);
            })
            .on("drag", function (d) {
                var x = d3.event.x;
                var y = d3.event.y;
                var a = Math.atan2(y - d.cy, x - d.cx) * 180 / Math.PI + 90;

                // if (d3.event.sourceEvent.ctrlKey && Math.abs(a) % 90 < 9)
                //     a = 90 * (a/90).toFixed(0);

                doRotate(ctx.active, a);
            })
            .on("end", function (d) {
                fill(knob, 'transparent');
                center.attr('display', 'none');
                action.endRotate();
                ctx.broker.fire(ctx.broker.events.ACTION, action);
                action = null;
            })
    };

    function fill(el, col) {
        el.transition()
            .duration(100)
            .style('fill', col)
    }

    function doRotate(shape, r) {
        shape.datum().r = r;
        shape.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }

    function createRotateAction(shape) {
        var initialRotation = shape.datum().r;
        var endRotation;
        return {
            endRotate: function() {
                endRotation = shape.datum().r;
            },

            undo: function () {
                doRotate(shape, initialRotation);
            },

            redo: function () {
                doRotate(shape, endRotation);
            }
        }
    }
}
