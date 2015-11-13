var ipc = require('ipc');

var LAYOUT_OPTIONS = {
    QWERTY: {
        order: 'qwertyuiopasdfghjklzxcvbnm.',
        counts: [10, 9, 8]
    },
    ALPHABETICAL: {
        order: 'abcdefghijklmnopqrstuvxyz',
        counts: [9, 9, 8]
    },
    // DVORAK: {

    // }
};

var LAYOUT = LAYOUT_OPTIONS.QWERTY;
var INITIALIZED = false;
var KEYS;

var $key_wrapper = $('.key-wrapper');
var $feedback = $('.feedback');


function send_character(ch) {
    ipc.send('character-input', ch);
}

function init_keyboard_events() {
    $(window).keydown(function(e) {
        key = (e.keyCode) ? e.keyCode : e.which;
        $('.key.k' + key).addClass('active');
        var ch = String.fromCharCode(key).toLowerCase();;
        send_character(ch);

    });

    $(window).keyup(function(e) {
        key = (e.keyCode) ? e.keyCode : e.which;
        $('.key.k' + key).removeClass('active');
    });
}

function generate_row(arr) {
    var str = "";
    for (var i in arr) {
        var ch = arr[i];
        console.log(ch.toUpperCase(), ch.toUpperCase().charCodeAt(0));
        str += '<li class="key k' + ch.toUpperCase().charCodeAt(0) + '">' + ch + '</li>';
    }
    return str;
}

function append_space_bar() {
    $space_bar = $('<ul class="row"> <li class = "key k32" > </li> </ul>');
    $key_wrapper.append($space_bar);
}

function init_initial_layout() {
    var rows = ['zero', 'one', 'two'];
    var counts = LAYOUT.counts;
    var order = LAYOUT.order;
    var characters = [order.substring(0, counts[0]),
        order.substring(counts[0], counts[0] + counts[1]),
        order.substring(counts[0] + counts[1], order.length)
    ].map(function(item) {
        return item.split("");
    });

    KEYS = characters;

    $key_wrapper.empty();

    for (var i in rows) {

        var $row = $('<ul class="row ' + rows[i] + '"></ul>');
        var identifier_number = +i + 2;
        var identifier = '<div class="identifier">' + identifier_number + '</div>';
        var str = generate_row(characters[i]);
        $row.append(identifier);
        $row.append(str);

        $key_wrapper.append($row);
    }

    append_space_bar();
}

var completed_count = 0;

function update() {
    $.get('/Users/Sashank/eeg_output.txt', function(data) {
        if (!data) return;
        var lines = data.split('\n');
        lines.pop(); //remove trailing newline
        if (!INITIALIZED) {
            completed_count = lines.length;
            INITIALIZED = true;
            return;
        }

        for (var i = completed_count; i < lines.length; i++) {
            input(lines[i]);
        }

        completed_count = lines.length;
    });
}

function split(a, n) {
    var len = a.length,
        out = [],
        i = 0;
    while (i < len) {
        var size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i += size));
    }
    return out;
}

function input(num) {
    if (!(num < 5 && num > -2)) return;

    var selected_row = KEYS[num - 2];
    var characters = split(selected_row, 3);

    $feedback.text(num);

    if (characters.length == 1) {
        var ch = characters[0][0];
        send_character(ch);
        init_initial_layout();
        return;
    }

    KEYS = characters;

    var rows = ['zero', 'one', 'two'];

    $key_wrapper.empty();
    for (var i in characters) {

        var $row = $('<ul class="row ' + rows[i] + '"></ul>');
        var identifier_number = +i + 2;
        var identifier = '<div class="identifier">' + identifier_number + '</div>';
        var str = generate_row(characters[i]);
        $row.append(identifier);
        $row.append(str);

        $key_wrapper.append($row);
    }

    append_space_bar();

}


function init() {
    init_keyboard_events();
    init_initial_layout();
    setInterval(update, 1);
}

init();
