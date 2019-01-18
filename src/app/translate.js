var svg = require('./svg');

module.exports = function (ctx) {

    var action;

    return d3.drag()
        .on("start", function (d) {
            activate(d3.select(this));
            drag(d);
        })
        .on("drag", drag)
        .on("end", function (d) {
            action.endTranslate(d);
            ctx.broker.fire(ctx.broker.events.ACTION, action);
            action = null;
        });

    function drag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }

    function activate(g) {
        if (ctx.active === g)
            return;

        action = createTranslateAction(ctx.active.datum());
        ctx.active = g;
    }

    function createTranslateAction(d) {
        var prev = {x: d.x, y: d.y, el: ctx.active};
        var next;
        return {
            endTranslate: function(d) {
                next = {x: d.x, y:d.y, el: ctx.active};
            },
            undo: function () {
                assign(prev);
            },
            redo: function () {
                assign(next);
            }
        }
    }

    function assign(d) {
        ctx.active = d.el;
        d.el.datum().x = d.x;
        d.el.datum().y = d.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }
};
