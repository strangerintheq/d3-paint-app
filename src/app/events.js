// app/events.js

module.exports = {

    // actions
    UNDO: 'undo',
    REDO: 'redo',
    MODE: 'mode',
    RESIZE: 'resize',
    TRANSFORM: 'transform',
    ACTION: 'action',
    DELETE: 'delete',
    EDIT: 'edit',

    // flags
    CAN_REDO: 'can-redo',
    CAN_UNDO: 'can-undo',
    CAN_DELETE: 'can-delete',
    CAN_EDIT: 'can-edit'

};
