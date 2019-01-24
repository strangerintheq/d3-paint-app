var svg = require('./svg');

module.exports = function (ctx) {

    var action;

    return d3.drag()
        .on("start", function (d) {
            activate(d3.select(this));
            console.log(d3.select(this).attr('transform'), d3.select(this).datum())
            drag(d);
        })
        .on("drag", drag)
        .on("end", function (d) {
            action.endTranslate(d);
            ctx.broker.fire(ctx.broker.events.ACTION, action);
            action = null;

            console.log(d3.select(this).attr('transform'), d3.select(this).datum())
        });

    function drag(d) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
        ctx.edit.updatePathEditor();
    }

    function activate(g) {
        ctx.active = g;
        ctx.active.raise();
        action = createTranslateAction(ctx.active.datum());
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
        ctx.active.datum().x = d.x;
        ctx.active.datum().y = d.y;
        ctx.active.attr('transform', svg.getTransform);
        ctx.extent.updateExtent();
    }
};
