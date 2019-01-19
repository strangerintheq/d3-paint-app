// app/svg.js

var ctx;
var pt;

module.exports = {

    createPointCalc: function(node, pad) {

        if (!pt) {
            pt = ctx.svg.node().createSVGPoint();
        }

        var bbox = node.node().getBBox();
        var matrix = node.node().getScreenCTM();
        var hw = bbox.width / 2 + pad;
        var hh = bbox.height / 2 + pad;

        reset();

        var calc = {
            reset : reset,
            shift: shift,
            calc: function () {
                return pt.matrixTransform(matrix)
            }
        };

        return calc;

        function shift(x, y, absolute) {
            pt.x += offset(x, hw, absolute);
            pt.y += offset(y, hh, absolute);
            return calc;
        }

        function offset(a, b, k) {
            return k ? a/k : a*b;
        }

        function reset() {
            pt.x = bbox.x - pad;
            pt.y = bbox.y - pad;
            return calc;
        }
    },

    setContext: function(c) {
        ctx = c
    },

    getTransform: function (d) {
        var r = ctx.active.node().getBBox();
        var x = r.x + r.width / 2;
        var y = r.y + r.height / 2;
        return 'rotate(' + d.r + ',' + (x + d.x) + ',' + (y + d.y) + ')' +
            'translate(' + d.x + ',' + d.y + ')';
    },

    screenOffsetX: function () {
        var n = ctx.containerElement.node();
        return n.clientWidth / 2 + n.offsetLeft;
    },

    screenOffsetY: function () {
        var n = ctx.containerElement.node();
        return n.clientHeight / 2 + n.offsetTop;
    },

    g: function (className) {
        return ctx.svg.append('g').classed(className, true);
    }
};
