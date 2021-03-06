// app/rotate.js

var svg = require('./svg');

module.exports = rotate;

function rotate(ctx, center) {
    return function (knob) {
        var action;
        return d3.drag()
            .on("start", function (d) {
                svg.fill(knob, true, 150);
                var r = ctx.active.node().getBoundingClientRect();
                d.cx = r.x + r.width/2 - svg.screenOffsetX(ctx);
                d.cy = r.y + r.height/2 - svg.screenOffsetY(ctx);
                center.attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .attr('display', 'visible');
                action = createRotateAction(ctx.active);
            })
            .on("drag", function (d) {
                var x = d3.event.x - d.cx;
                var y = d3.event.y - d.cy;
                var a = Math.atan2(y , x) * 180 / Math.PI + 90;
                if (!d3.event.sourceEvent.ctrlKey) {
                    var snapEvery = 45, precision = 5;
                    var pct = Math.abs(a) % snapEvery;
                    if (pct < precision || snapEvery - pct < precision) {
                        a = snapEvery * (a/snapEvery).toFixed(0);
                    }
                }
                doRotate(ctx.active, a);
            })
            .on("end", function (d) {
                svg.fill(knob, false, 150);
                center.attr('display', 'none');
                action.endRotate();
                ctx.broker.fire(ctx.broker.events.ACTION, action);
                action = null;
            })
    };

    function doRotate(shape, r) {
        shape.datum().r = r;
        shape.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
        ctx.edit.updatePathEditor();
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
