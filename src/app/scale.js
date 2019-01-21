var svgpath = require('svgpath');
var svg = require('./svg');


module.exports = function (ctx, vxs, vxe, vys, vye, dw, dh) {

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
                .round(1);

            ctx.active.node().firstChild.setAttribute('d', transformed.toString());


            var datum = ctx.active.datum();
            datum.dx = 0;
            datum.dy = 0;
            ctx.active.attr('transform', svg.getTransform);
            ctx.extent.updateExtent();

            d.scaleHelper
                .attr('cx', knob.datum().x)
                .attr('cy', knob.datum().y);

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

        }

        function startScale(d) {

            svg.fill(knob, 'rgba(0, 40, 255, 0.5)', 150);

            if (vxs && vxe)
                d.lineX = line(knob, vxs, vxe);

            if (vys && vye)
                d.lineY = line(knob, vys, vye);

            d.path = ctx.active.node().firstChild.getAttribute('d');

            var box = ctx.active.node().firstChild.getBBox();
            var x = box.x + dw * box.width;
            var y = box.y + dh * box.height;

            d.origin = {x: x, y: y};

            d.scaleHelper = ctx.svg.append('circle')
                .attr('r', 3)
                .attr('stroke', 'none')
                .attr('cx', knob.datum().x)
                .attr('cy', knob.datum().y)
                .attr('fill', 'none');
        }

        function endScale(d){
            svg.fill(knob, 'transparent', 150);
            ['lineX', 'lineY', 'helperPath', 'scaleHelper'].forEach(function (key) {
                if (!d[key])
                    return;
                d[key].remove();
                d[key] = null;
            });

            d.path = null;
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
            datum.x1 = x3;
            datum.y1 = y3;
            datum.x2 = x3 - k * dy;
            datum.y2 = y3 + k * dx;

            datum.scale = Math.sqrt(
                Math.pow(datum.x2 - x1, 2) + Math.pow(datum.y2 - y1, 2)
            ) / Math.sqrt(dx * dx + dy * dy);
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
};