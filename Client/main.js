var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var robot = require("robotjs");

var MODE = "window"
var keyboardWindow = null;

if (MODE == "window") {
    var writingWindow = null;
}

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

ipc.on('character-input', function(event, arg) {
    if (MODE == "window") {
        writingWindow.webContents.send('character-output', arg);
    } else {
        if (arg == "backspace") {
            robot.keyTap("backspace");
            return;
        }
        robot.typeString(arg);
    }
});

app.on('ready', function() {

    var electronScreen = require('screen');
    var size = electronScreen.getPrimaryDisplay().workAreaSize;

    if (MODE == "window") {
        keyboardWindow = new BrowserWindow({
            frame: false,
            width: size.width / 2,
            height: size.height,
            resizable: false,
            x: size.width / 2,
            y: 0
        });

        writingWindow = new BrowserWindow({
            frame: false,
            width: size.width / 2,
            height: size.height,
            resizable: false,
            x: 0,
            y: 0,
        });


    } else {

        keyboardWindow = new BrowserWindow({
            frame: false,
            width: 650,
            // height: 420,
            height: 360,
            resizable: false,
            x: size.width - 400,
            y: 0,
            alwaysOnTop: true,
            transparent: true
        });

    }



    // enable dev tools => 
    keyboardWindow.openDevTools();

    keyboardWindow.loadURL('file://' + __dirname + '/app/keyboard.html');
    keyboardWindow.on('closed', function() {
        keyboardWindow = null;
    });

    if (MODE == "window") {
        writingWindow.loadURL('file://' + __dirname + '/app/editor.html');

        writingWindow.on('closed', function() {
            writingWindow = null;
        });
    } else {
        keyboardWindow.webContents.executeJavaScript("$('#instructions').addClass('hidden'); $('.feedback').addClass('small')");
    }           


});
