// TODO: remove vestiges of vbscript

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("qbjs", function(conf, parserConf) {
    var ERRORCLASS = 'error';

    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
    }

    var singleOperators = new RegExp("^[\\+\\-\\*/&\\\\\\^<>=]");
    var doubleOperators = new RegExp("^((<>)|(<=)|(>=))");
    var singleDelimiters = new RegExp('^[\\.,]');
    var brakets = new RegExp('^[\\(\\)]');
    var identifiers = new RegExp("^[A-Za-z][_A-Za-z0-9]*");

    var openingKeywords = ['sub','select','while','if','function', 'property', 'with', 'for', 'type\\s'];
    var middleKeywords = ['else','elseif','case','then'];
    var endKeywords = ['next','loop','wend'];

    var wordOperators = wordRegexp(['and', 'or', 'not', 'xor', 'is', 'mod', 'eqv', 'imp']);
    var commonkeywords = ['dim', 'as', 'redim', 'then', 'until', 'exit', 'in', 'to', 'let',
                          'const', 'integer', 'single', 'double', 'long', '_?unsigned', '_?float', '_?bit', '_?byte',
                          'string', '_?byte', 'object', '_?offset', '_?integer64', 'call', 'step', '_?preserve'];

    // TODO: adjust for QB
    var atomWords = ['true', 'false', 'nothing', 'empty', 'null'];

    var builtinFuncsWords = ['_?acos', '_?acosh', '_?alpha', '_?alpha32', '_?asin', '_?asinh', '_?atan2', '_?atanh', '_?autodisplay',
                             '_?backgroundcolor', '_?blue', '_?blue32', '_?capslock', '_?ceil', '_?commandcount', '_?continue', '_?copyimage',
                             '_?cosh', '_?coth', '_?csch', '_?cwd', '_?defaultcolor', '_?d2g', '_?d2r', '_?deflate', '_?desktopwidth', '_?desktopheight',
                             '_?delay', '_?dest', '_?dir', '_?direxists', '_?display', '_?echo', '_?fileexists', '_?font', '_?fontwidth', '_?fontheight',
                             '_?freeimage', '_?fullscreen', '_?g2d', '_?g2r', '_?green', '_?green32', '_?height', '_?hypot', "_?inflate",
                             '_?instrrev', '_?limit', '_?keyclear', '_?keydown', '_?keyhit', '_?loadfont', '_?loadimage',
                             '_?mousebutton', '_?mousehide', '_?mouseinput', '_?mouseshow', '_?mousewheel', '_?mousex', '_?mousey',
                             '_?newimage', '_?numlock', '_?os', '_?palettecolor', '_?pi', '_?printstring', '_?printwidth', '_?printmode', '_?putimage',
                             '_?r2d', '_?r2g', '_?readbit', '_?red', '_?red32', '_?resetbit', '_?resize', '_?resizewidth',
                             '_?resizeheight', '_?rgb', '_?rgba', '_?rgb32', '_?rgba32', '_?round',
                             '_?screenexists', '_?screenmove', '_?screenx', '_?screeny', '_?scrolllock', '_?sech', '_?setbit', '_?shl', '_?shr', '_?sinh',
                             '_?source', '_?sndclose', '_?sndopen', '_?sndplay', '_?sndloop', '_?sndpause', '_?sndstop', '_?sndvol', '_?startdir',
                             '_?strcmp', '_?stricmp', '_?tanh', '_?title', '_?trim', '_?togglebit', '_?width',
                             'abs', 'asc', 'atn', 'beep',
                             'chr', 'cdbl', 'cint', 'clng', 'csng', 'circle', 'cls', 'color', 'command', 'cos', 'cvi', 'cvl',
                             'data', 'date', 'draw', 'environ', 'error', 'exp', 'fix', 'hex', 'input', 'inkey', 'instr', 'int',
                             'lbound', 'left', 'lcase', 'len', 'line', 'loc', 'locate', 'log', 'ltrim', 'mid', 'mki', 'mkl',
                             'oct', 'paint', 'point', 'preset', 'print', 'pset',
                             'right', 'rtrim', 'randomize', 'read', 'restore', 'rnd',
                             'screen', 'shared', 'sgn', 'sin', 'sleep', 'sound', 'space', 'sqr',
                             'str', 'swap', 'tan', 'time', 'timer', 'ubound', 'ucase',
                             'val', 'varptr', 'window',
                             'mkdir', 'chdir', 'rmdir', 'kill', 'name', 'files', 'open', 'close', 'lof', 'eof', 'put', 'get', 'freefile',
                             'seek', 'write',
                             // QBJS-specific
                             'export', 'from', 'import']

    var builtinConsts = ['append', 'binary', 'input', 'output', 'random',
                         '_?off', '_?smooth', '_?stretch', '_?squarepixels', '_?keepbackground', '_?onlybackground', '_?fillbackground',
                         'gx_true', 'gx_false', 'gxevent_init', 'gxevent_update', 'gxevent_drawbg', 'gxevent_drawmap', 'gxevent_drawscreen',
                         'gxevent_mouseinput', 'gxevent_paintbefore', 'gxevent_paintafter', 'gxevent_collision_tile', 'gxevent_collision_entity',
                         'gxevent_player_action', 'gxevent_animate_complete', 'gxanimate_loop', 'gxanimate_single', 'gxbg_stretch',
                         'gxbg_scroll', 'gxbg_wrap', 'gxkey_esc', 'gxkey_1', 'gxkey_2', 'gxkey_3', 'gxkey_4', 'gxkey_5', 'gxkey_6', 'gxkey_7',
                         'gxkey_8', 'gxkey_9', 'gxkey_0', 'gxkey_dash', 'gxkey_equals', 'gxkey_backspace', 'gxkey_tab', 'gxkey_q', 'gxkey_w',
                         'gxkey_e', 'gxkey_r', 'gxkey_t', 'gxkey_y', 'gxkey_u', 'gxkey_i', 'gxkey_o', 'gxkey_p', 'gxkey_lbracket',
                         'gxkey_rbracket', 'gxkey_enter', 'gxkey_lctrl', 'gxkey_a', 'gxkey_s', 'gxkey_d', 'gxkey_f', 'gxkey_g', 'gxkey_h',
                         'gxkey_j', 'gxkey_k', 'gxkey_l', 'gxkey_semicolon', 'gxkey_quote', 'gxkey_backquote', 'gxkey_lshift', 'gxkey_backslash',
                         'gxkey_z', 'gxkey_x', 'gxkey_c', 'gxkey_v', 'gxkey_b', 'gxkey_n', 'gxkey_m', 'gxkey_comma', 'gxkey_period',
                         'gxkey_slash', 'gxkey_rshift', 'gxkey_numpad_multiply', 'gxkey_spacebar', 'gxkey_capslock', 'gxkey_f1', 'gxkey_f2',
                         'gxkey_f3', 'gxkey_f4', 'gxkey_f5', 'gxkey_f6', 'gxkey_f7', 'gxkey_f8', 'gxkey_f9', 'gxkey_f9', 'gxkey_pause',
                         'gxkey_scrlk', 'gxkey_numpad_7', 'gxkey_numpad_8', 'gxkey_numpad_9', 'gxkey_numpad_minus', 'gxkey_numpad_4',
                         'gxkey_numpad_5', 'gxkey_numpad_6', 'gxkey_numpad_plus', 'gxkey_numpad_1', 'gxkey_numpad_2', 'gxkey_numpad_3',
                         'gxkey_numpad_0', 'gxkey_numpad_period', 'gxkey_f11', 'gxkey_f12', 'gxkey_numpad_enter', 'gxkey_rctrl',
                         'gxkey_numpad_divide', 'gxkey_numlock', 'gxkey_home', 'gxkey_up', 'gxkey_pageup', 'gxkey_left', 'gxkey_right',
                         'gxkey_end', 'gxkey_down', 'gxkey_pagedown', 'gxkey_insert', 'gxkey_delete', 'gxkey_lwin', 'gxkey_rwin', 'gxkey_menu',
                         'gxaction_move_left', 'gxaction_move_right', 'gxaction_move_up', 'gxaction_move_down', 'gxaction_jump',
                         'gxaction_jump_right', 'gxaction_jump_left', 'gxscene_follow_none', 'gxscene_follow_entity_center',
                         'gxscene_follow_entity_center_x', 'gxscene_follow_entity_center_y', 'gxscene_follow_entity_center_x_pos',
                         'gxscene_follow_entity_center_x_neg', 'gxscene_constrain_none', 'gxscene_constrain_to_map', 'gxfont_default',
                         'gxfont_default_black', 'gxdevice_keyboard', 'gxdevice_mouse', 'gxdevice_controller', 'gxdevice_button',
                         'gxdevice_axis', 'gxdevice_wheel', 'gxtype_entity', 'gxtype_font', 'gx_cr', 'gx_lf', 'gx_crlf',
                         'local', 'session'];

    var builtinObjsWords = ['\\$if', '\\$end if', '\\$elseif', '\\$else', '\\$touchmouse'];

    // TODO: adjust for QB
    var knownProperties = ['description', 'firstindex', 'global', 'helpcontext', 'helpfile', 'ignorecase', 'length', 'number', 'pattern', 'value', 'count'];

    var knownMethods = ['gxongameevent', 'gxmousex', 'gxmousey', 'gxsoundload', 'gxsoundplay', 'gxsoundrepeat', 'gxsoundvolume', 'gxsoundpause', 'gxsoundstop',
                        'gxsoundmuted', 'gxsoundmuted', 'gxentityanimate', 'gxentityanimatestop', 'gxentityanimatemode', 'gxentityanimatemode',
                        'gxscreenentitycreate', 'gxentitycreate', 'gxentityvisible', 'gxentitymove', 'gxentitypos', 'gxentityvx', 'gxentityvy',
                        'gxentityx', 'gxentityy', 'gxentitywidth', 'gxentityheight', 'gxentityframenext', 'gxentityframeset', 'gxentitytype',
                        'gxentitytype', 'gxentityuid', 'gxfontuid', 'gxentityapplygravity', 'gxentitycollisionoffset',
                        'gxentitycollisionoffsetleft', 'gxentitycollisionoffsettop', 'gxentitycollisionoffsetright',
                        'gxentitycollisionoffsetbottom', 'gxfullscreen', 'gxbackgroundadd', 'gxbackgroundwrapfactor',
                        'gxbackgroundclear', 'gxsceneembedded', 'gxscenecreate', 'gxscenewindowsize', 'gxscenescale', 'gxsceneresize',
                        'gxscenedestroy', 'gxcustomdraw', 'gxframerate', 'gxframe', 'gxscenedraw', 'gxscenemove', 'gxscenepos', 'gxscenex',
                        'gxsceney', 'gxscenewidth', 'gxsceneheight', 'gxscenecolumns', 'gxscenerows', 'gxscenestart', 'gxsceneupdate',
                        'gxscenefollowentity', 'gxsceneconstrain', 'gxscenestop', 'gxmapcreate', 'gxmapcolumns', 'gxmaprows', 'gxmaplayers',
                        'gxmaplayervisible', 'gxmaplayeradd', 'gxmaplayerinsert', 'gxmaplayerremove', 'gxmapresize', 'gxmapdraw',
                        'gxmaptileposat', 'gxmaptile', 'gxmaptile', 'gxmaptiledepth', 'gxmaptileadd', 'gxmaptileremove', 'gxmapversion',
                        'gxmapsave', 'gxmapload', 'gxmapisometric', 'gxspritedraw', 'gxspritedrawscaled', 'gxtilesetcreate',
                        'gxtilesetreplaceimage', 'gxtilesetload', 'gxtilesetsave', 'gxtilesetpos', 'gxtilesetwidth', 'gxtilesetheight',
                        'gxtilesetcolumns', 'gxtilesetrows', 'gxtilesetfilename', 'gxtilesetimage', 'gxtilesetanimationcreate',
                        'gxtilesetanimationadd', 'gxtilesetanimationremove', 'gxtilesetanimationframes', 'gxtilesetanimationspeed',
                        'gxfontcreate', 'gxfontwidth', 'gxfontheight', 'gxfontcharspacing', 'gxfontlinespacing',
                        'gxdrawtext', 'gxdebug', 'gxdebug', 'gxdebugscreenentities', 'gxdebugfont', 'gxdebugtilebordercolor',
                        'gxdebugentitybordercolor', 'gxdebugentitycollisioncolor', 'gxkeyinput', 'gxkeydown', 'gxdeviceinputdetect',
                        'gxdeviceinputtest', 'gxdevicename', 'gxdevicetypename', 'gxinputtypename', 'gxkeybuttonname'];

    var knownWords = knownMethods.concat(knownProperties);

    builtinObjsWords = builtinObjsWords.concat(builtinConsts);

    var keywords = wordRegexp(commonkeywords);
    var atoms = wordRegexp(atomWords);
    var builtinFuncs = wordRegexp(builtinFuncsWords);
    var builtinObjs = wordRegexp(builtinObjsWords);
    var known = wordRegexp(knownWords);
    var stringPrefixes = '"';

    var opening = wordRegexp(openingKeywords);
    var middle = wordRegexp(middleKeywords);
    var closing = wordRegexp(endKeywords);
    var doubleClosing = wordRegexp(['end']);
    var doOpening = wordRegexp(['do']);
    var noIndentWords = wordRegexp(['on error resume next', 'exit']);
    var comment = wordRegexp(['rem']);


    function indent(_stream, state) {
      state.currentIndent++;
    }

    function dedent(_stream, state) {
      state.currentIndent--;
    }
    // tokenizers
    function tokenBase(stream, state) {
        if (stream.eatSpace()) {
            return 'space';
            //return null;
        }

        var ch = stream.peek();

        // Handle Comments
        if (ch === "'") {
            stream.skipToEnd();
            return 'comment';
        }
        if (stream.match(comment)){
            stream.skipToEnd();
            return 'comment';
        }


        // Handle Number Literals
        if (stream.match(/^((&H)|(&O))?[0-9\.]/i, false) && !stream.match(/^((&H)|(&O))?[0-9\.]+[a-z_]/i, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+/i)) { floatLiteral = true; }
            else if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
            else if (stream.match(/^\.\d+/)) { floatLiteral = true; }

            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^&H[0-9a-f]+/i)) { intLiteral = true; }
            // Octal
            else if (stream.match(/^&O[0-7]+/i)) { intLiteral = true; }
            // Decimal
            else if (stream.match(/^[1-9]\d*F?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            else if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'number';
            }
        }

        // Handle Strings
        if (stream.match(stringPrefixes)) {
            state.tokenize = tokenStringFactory(stream.current());
            return state.tokenize(stream, state);
        }

        // Handle operators and Delimiters
        if (stream.match(doubleOperators)
            || stream.match(singleOperators)
            || stream.match(wordOperators)) {
            return 'operator';
        }
        if (stream.match(singleDelimiters)) {
            return null;
        }

        if (stream.match(brakets)) {
            return "bracket";
        }

        if (stream.match(noIndentWords)) {
            state.doInCurrentLine = true;

            return 'keyword';
        }

        if (stream.match(doOpening)) {
            indent(stream,state);
            state.doInCurrentLine = true;

            return 'keyword';
        }
        if (stream.match(opening)) {
            if (! state.doInCurrentLine)
              indent(stream,state);
            else
              state.doInCurrentLine = false;

            return 'keyword';
        }
        if (stream.match(middle)) {
            return 'keyword';
        }


        if (stream.match(doubleClosing)) {
            dedent(stream,state);
            dedent(stream,state);

            return 'keyword';
        }
        if (stream.match(closing)) {
            if (! state.doInCurrentLine)
              dedent(stream,state);
            else
              state.doInCurrentLine = false;

            return 'keyword';
        }

        if (stream.match(keywords)) {
            return 'keyword';
        }

        if (stream.match(atoms)) {
            return 'atom';
        }

        if (stream.match(known)) {
            return 'variable-2';
        }

        if (stream.match(builtinFuncs)) {
            return 'builtin';
        }

        if (stream.match(builtinObjs)){
            return 'variable-2';
        }

        if (stream.match(identifiers)) {
            return 'variable';
        }

        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }

    function tokenStringFactory(delimiter) {
        var singleline = delimiter.length == 1;
        var OUTCLASS = 'string';

        return function(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^'"]/);
                if (stream.match(delimiter)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                } else {
                    stream.eat(/['"]/);
                }
            }
            if (singleline) {
                if (parserConf.singleLineStringErrors) {
                    return ERRORCLASS;
                } else {
                    state.tokenize = tokenBase;
                }
            }
            return OUTCLASS;
        };
    }


    function tokenLexer(stream, state) {
        var style = state.tokenize(stream, state);
        var current = stream.current();

        // Handle '.' connected identifiers
        if (current === '.') {
            style = state.tokenize(stream, state);

            current = stream.current();
            if (style && (style.substr(0, 8) === 'variable' || style==='builtin' || style==='keyword')){//|| knownWords.indexOf(current.substring(1)) > -1) {
                if (style === 'builtin' || style === 'keyword') style='variable';
                if (knownWords.indexOf(current.substr(1)) > -1) style='variable-2';

                return style;
            } else {
                return ERRORCLASS;
            }
        }

        return style;
    }

    var external = {
        electricChars:"dDpPtTfFeE ",
        startState: function() {
            return {
              tokenize: tokenBase,
              lastToken: null,
              currentIndent: 0,
              nextLineIndent: 0,
              doInCurrentLine: false,
              ignoreKeyword: false


          };
        },

        token: function(stream, state) {
            if (stream.sol()) {
              state.currentIndent += state.nextLineIndent;
              state.nextLineIndent = 0;
              state.doInCurrentLine = 0;
            }
            var style = tokenLexer(stream, state);

            state.lastToken = {style:style, content: stream.current()};

            if (style==='space') style=null;

            return style;
        },

        indent: function(state, textAfter) {
            var trueText = textAfter.replace(/^\s+|\s+$/g, '') ;
            if (trueText.match(closing) || trueText.match(doubleClosing) || trueText.match(middle)) return conf.indentUnit*(state.currentIndent-1);
            if(state.currentIndent < 0) return 0;
            return state.currentIndent * conf.indentUnit;
        }

    };
    return external;
});

CodeMirror.defineMIME("text/qbjs", "qbjs");

});
