var ipc = require('ipc');

ipc.on('character-output', function(arg) {
	if (arg == "backspace") {
		$('#text span:last-child').remove();
		return;
	}
    $("#text").append("<span>" + arg + "</span>");
});
