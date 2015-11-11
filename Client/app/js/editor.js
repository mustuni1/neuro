var ipc = require('ipc');

ipc.on('character-output', function(arg) {
    $("#text").append("<span>" + arg + "</span>");
});
