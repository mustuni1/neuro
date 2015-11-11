var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');



var keyboardWindow = null;
var writingWindow = null;


app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

ipc.on('character-input', function (event, arg) {
    console.log(arg);
    writingWindow.webContents.send('character-output', arg);
});

app.on('ready', function() {

    var electronScreen = require('screen');
    var size = electronScreen.getPrimaryDisplay().workAreaSize;

    keyboardWindow = new BrowserWindow({
        frame: false,
        width: size.width/2,
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

    keyboardWindow.loadUrl('file://' + __dirname + '/app/keyboard.html');
    writingWindow.loadUrl('file://' + __dirname + '/app/editor.html');

    keyboardWindow.openDevTools();

    keyboardWindow.on('closed', function() {
        keyboardWindow = null;
    });

    writingWindow.on('closed', function() {
        writingWindow = null;
    });

});
