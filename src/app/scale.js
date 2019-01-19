var Vector = require('./vector');

module.exports = function (ctx, oppositeX, oppositeY) {
    return function (knob) {
        return d3.drag()
            .on("start", function (d) {
                d.lineX = line(knob, oppositeX);
                d.lineY = line(knob, oppositeY);
                d.start = {
                    x: +knob.attr('cx'),
                    y: +knob.attr('cy')
                }
            })
            .on("drag", function (d) {
                if (d.lineX && !d.lineY)
                    calcLine(d, d.lineX);
                if (!d.lineX && d.lineY)
                    calcLine(d, d.lineY);

                if (d.lineX && d.lineY) {
                }

                upd(d.lineX);
                upd(d.lineY);
            })
            .on("end", function (d) {
                del(d, 'lineX');
                del(d, 'lineY');
            });

        function calcLine(d, line) {

            var datum = line.datum();

            var v1 = new Vector(
                d.start.x - datum.x1,
                d.start.y - datum.y1
            );

            var v2 = new Vector(
                d3.event.x - datum.x1,
                d3.event.y - datum.y1
            );

            v1.normalize().multiply(v2.length()*Math.cos(v1.angleTo(v2)));

            datum.x2 = +datum.x1 + v1.x;
            datum.y2 = +datum.y1 + v1.y;
        }
    };

    function del(d, key) {
        if (!d[key])
            return;
        d[key].remove();
        d[key] = null;
    }

    function upd(line) {
        if (!line)
            return;

        line.attr('x1', function (d) {
            return d.x1
        }).attr('y1', function (d) {
            return d.y1
        }).attr('x2', function (d) {
            return d.x2
        }).attr('y2', function (d) {
            return d.y2
        })
    }

    function line(knob, op) {
        if (!op)
            return;
        op = d3.select('circle.knob.' + op);
        return ctx.svg.append('line')
            .datum({
                x1: +op.attr('cx'),
                y1: +op.attr('cy'),
                x2: +knob.attr('cx'),
                y2: +knob.attr('cy')
            })
            .attr('stroke-width', 1.8)
            .attr('stroke', 'red')
    }
};