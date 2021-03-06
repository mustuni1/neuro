var ipc = require('ipc');

var LAYOUT_OPTIONS = {
    QWERTY: {
        order: 'qwertyuiopasdfghjklzxcvbnm.',
        counts: [10, 9, 8]
    },
    ALPHABETICAL: {
        order: 'abcdefghijklmnopqrstuvxyz',
        counts: [9, 9, 8]
    }
};

var LAYOUT = LAYOUT_OPTIONS.QWERTY;
var INITIALIZED = false;
var CURRENT_WORD = '';
var PREDICTED_WORDS = ['the', 'I', 'a'];
var SELECTING_WORD = false;
var TREE;
var KEYS;
var INITIAL_LAYOUT = false;

var $key_wrapper = $('.key-wrapper');
var $feedback = $('.feedback');

function update_current_word(ch) {
    CURRENT_WORD += ch;
    if (TREE.predict(CURRENT_WORD).length != 0)
        PREDICTED_WORDS = TREE.predict(CURRENT_WORD);
}

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

function init_tree() {
    TREE = new jsT9(words, {
        maxAmount: 3
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

function append_suggestions() {

}

function init_initial_layout() {
    INITIAL_LAYOUT = true;
    PREDICTED_WORDS = TREE.predict(CURRENT_WORD);
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
    var $prediction_row = $('<ul class="row five"></ul>');
    var identifier = '<div class="identifier">5</div>';
    $prediction_row.append(identifier);

    if (CURRENT_WORD == '') {
        PREDICTED_WORDS = ['the', 'I', 'a'];
    };

    for (var i in PREDICTED_WORDS) {
        var predicted_word = PREDICTED_WORDS[i];
        var new_word = '<li class="key prediction">' + predicted_word + '</li>';
        $prediction_row.append(new_word);
    }

    $key_wrapper.append($prediction_row);

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
    $.get('/Users/' + SYSTEM_USER + '/eeg_output.txt', function(data) {
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
    var rows = ['zero', 'one', 'two'];
    if (!(num <= 5 && num >= -3)) return;

    if (SELECTING_WORD && num == 5) return;

    //BACKSPACE 
    if (num == -1) {
        if (INITIAL_LAYOUT) { // if it's in initial layout, delete last letter
            CURRENT_WORD = CURRENT_WORD.slice(0, CURRENT_WORD.length - 1);
            send_character("backspace");
        };
        init_initial_layout();
        return;
    }

    //SPACE
    if (num == -2) {
        CURRENT_WORD = '';
        send_character(" ");
        init_initial_layout();
        return;
    }

    //RESET
    if (num == -3) {
        CURRENT_WORD = '';
        init_initial_layout();
        return;
    }

    if (SELECTING_WORD) {
        $feedback.text(num);
        if (CURRENT_WORD.length > 0) {
            // delete typed word
            for (var i = CURRENT_WORD.length - 1; i >= 0; i--) {
                send_character("backspace");
            };
        }
        send_character(PREDICTED_WORDS[num - 2] + ' ');
        CURRENT_WORD = '';
        SELECTING_WORD = false;
        PREDICTED_WORDS = ['the', 'I', 'a'];
        init_initial_layout();
        return;
    }

    if (num == 5) {
        INITIAL_LAYOUT = false;
        $feedback.text(num);
        $key_wrapper.empty();
        for (var i in PREDICTED_WORDS) {
            var $row = $('<ul class="row ' + rows[i] + '"></ul>');
            var identifier_number = +i + 2;
            var identifier = '<div class="identifier">' + identifier_number + '</div>';
            var str = '<li class="key prediction">' + PREDICTED_WORDS[+i] + '</li>';
            $row.append(identifier);
            $row.append(str);

            $key_wrapper.append($row);
            SELECTING_WORD = true;
        }

        append_space_bar();
        return;
    }

    INITIAL_LAYOUT = false;
    var selected_row = KEYS[num - 2];
    var characters = split(selected_row, 3);

    $feedback.text(num);

    if (characters.length == 1) {
        var ch = characters[0][0];
        update_current_word(ch);
        send_character(ch);
        init_initial_layout();
        return;
    }

    $key_wrapper.empty();

    var $prediction_row = $('<ul class="row five"></ul>');
    var identifier = '<div class="identifier">5</div>';
    $prediction_row.append(identifier);
    for (var i in PREDICTED_WORDS) {
        var predicted_word = PREDICTED_WORDS[i];
        var new_word = '<li class="key prediction">' + predicted_word + '</li>';
        $prediction_row.append(new_word);
    }
    $key_wrapper.append($prediction_row);

    KEYS = characters;


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
    init_tree();
    init_keyboard_events();
    init_initial_layout();
    setInterval(update, 1);
}

init();
