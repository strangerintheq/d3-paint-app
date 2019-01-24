var svgpath = require('svgpath');
var svg = require('./svg');


module.exports = function (ctx, vxs, vxe, vys, vye, dw, dh, x,xy,y) {

    var action;

    return function (knob) {
        return d3.drag()
            .on("start", startScale)
            .on("drag", doScale)
            .on("end", endScale);

        function doScale(d) {
            calc(d.lineX);
            calc(d.lineY);

            var transformed = svgpath(d.path)
                .translate(-d.origin.x, -d.origin.y)
                .scale(
                    d.lineX ? d.lineX.datum().scale : 1,
                    d.lineY ? d.lineY.datum().scale : 1
                )
                .translate(d.origin.x, d.origin.y)
                .round(4);

            ctx.active.select('path.figure').attr('d', transformed.toString());

            var datum = ctx.active.datum();
            datum.dx = 0;
            datum.dy = 0;
            ctx.active.attr('transform', svg.getTransform);
            ctx.extent.updateExtent();

            var k = knob;
            var needDx = d.lineX && d.lineX.datum().scale < 0;
            var needDy = d.lineY && d.lineY.datum().scale < 0;
            if (needDx && needDy)
                k = d3.select('circle.knob.' + xy);
            else if (needDx)
                k = d3.select('circle.knob.' + x);
            else if (needDy)
                k = d3.select('circle.knob.' + y);

            svg.fill(d3.selectAll('circle.knob'), false);
            svg.fill(k, true);

            d.scaleHelper
                .attr('cx', k.datum().x)
                .attr('cy', k.datum().y);

            var knobRect = d.scaleHelper.node().getBoundingClientRect();
            datum.dx = knobRect.x + knobRect.width/2 - svg.screenOffsetX();
            datum.dy = knobRect.y + knobRect.height/2 - svg.screenOffsetY();

            if (d.lineX && d.lineY) {
                datum.dx -= d3.event.x;
                datum.dy -= d3.event.y;
            } else {
                var l = d.lineX || d.lineY;
                datum.dx -= +l.datum().x2;
                datum.dy -= +l.datum().y2;
            }

            datum.dx /= ctx.transform.k;
            datum.dy /= ctx.transform.k;

            ctx.active.attr('transform', svg.getTransform);
            ctx.extent.updateExtent();
            ctx.edit.updatePathEditor();
        }

        function startScale(d) {
            svg.fill(knob, true, 150);

            if (vxs && vxe)
                d.lineX = line(knob, vxs, vxe);

            if (vys && vye)
                d.lineY = line(knob, vys, vye);

            var figure = ctx.active.select('path.figure');
            d.path = figure.attr('d');

            var box = figure.node().getBBox();
            var x = box.x + dw * box.width;
            var y = box.y + dh * box.height;

            d.origin = {x: x, y: y};

            d.scaleHelper = ctx.svg.append('circle')
                .attr('r', 3)
                .attr('stroke', 'none')
                .attr('cx', knob.datum().x)
                .attr('cy', knob.datum().y)
                .attr('fill', 'none');

            action = createScaleAction(ctx.active);
        }

        function endScale(d){

            svg.fill(d3.selectAll('circle.knob'), false, 150);

            ['lineX', 'lineY', 'scaleHelper'].forEach(function (key) {
                if (!d[key])
                    return;
                d[key].remove();
                d[key] = null;
            });

            action.endScale();
            ctx.broker.fire(ctx.broker.events.ACTION, action);
            d.path = null;
        }


        function len(x,y) {
            return Math.sqrt(x * x + y * y)
        }

        function dot(x1, y1, x2, y2) {
            return x1 * x2 + y1 * y2;
        }

        function calc(line) {
            if (!line)
                return;

            var datum = line.datum();
            var x1 = datum.sx, y1 = datum.sy;
            var x2 = datum.ex, y2 = datum.ey;
            var x3 = d3.event.x, y3 = d3.event.y;
            var dx = x2 - x1, dy = y2 - y1;
            var k = (dy * (x3 - x1) - dx * (y3 - y1)) / (dy * dy + dx * dx);
            datum.x1 = x3; datum.y1 = y3;
            datum.x2 = x3 - k * dy; datum.y2 = y3 + k * dx;
            var x4 = datum.x2 - x1, y4 = datum.y2 - y1;
            datum.scale = len(x4, y4) / len(dx, dy);
            datum.scale *= Math.sign(dot(x4, y4, dx, dy));
        }
    };

    function line(knob, vs, ve) {
        vs = d3.select('circle.knob.' + vs);
        ve = d3.select('circle.knob.' + ve);
        return ctx.svg.append('line')
            .datum({
                sx: +vs.datum().x,
                sy: +vs.datum().y,
                ex: +ve.datum().x,
                ey: +ve.datum().y
            })
            .attr('stroke-width', 1.8)
            .attr('stroke', 'red')
    }

    function createScaleAction(shape) {
        var initialPath = getD();
        var resultPath;
        return {
            endScale: function() {
                resultPath = getD();
            },

            undo: function () {
                doScale(initialPath);
            },

            redo: function () {
                doScale(resultPath);
            }
        };

        function doScale(pathD) {
            d3.select(shape.node().firstChild).attr('d', pathD);
            ctx.extent.updateExtent();
            ctx.edit.updatePathEditor();
        }

        function getD() {
            return d3.select(shape.node().firstChild).attr('d')
        }
    }
};