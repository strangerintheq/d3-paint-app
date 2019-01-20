// app/broker.js

var events = require('./events');

module.exports = broker;

function broker() {

    var listeners = {};

    return {
        events: events,
        fire: fire,
        on: on
    };

    function on(evt, func) {
        !listeners[evt] && (listeners[evt] = []);
        listeners[evt].push(func);
    }

    function fire(evt, arg) {
        console.log('evt: ' + evt + (arg ? '[' + JSON.stringify(arg) + ']' : ''));
        listeners[evt] && listeners[evt].forEach(function (listener) {
            listener(arg);
        });
    }
}
