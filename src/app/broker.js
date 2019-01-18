// app/broker.js

var events = require('./events');

module.exports = broker;

function broker() {

    var listeners = {};

    return {
        events: events,

        fire: function (evt, arg) {

            console.log('evt: ' + evt + (arg ? '[' + JSON.stringify(arg) + ']' : ''));

            listeners[evt] && listeners[evt].forEach(invoke);

            function invoke(listener) {
                listener(arg);
            }
        },

        on: function (evt, func) {
            !listeners[evt] && (listeners[evt] = []);
            listeners[evt].push(func);
        }
    }
}
