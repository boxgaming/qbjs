var QB = new function() {
    // QB constants
    this.COLUMN_ADVANCE = Symbol("COLUMN_ADVANCE");
    this.PREVENT_NEWLINE = Symbol("PREVENT_NEWLINE");

    var _fgColor = null; 
    var _bgColor = null; 
    var _lastX = 0;
    var _lastY = 0;
    //var _fntDefault = null;
    var _locX = 0;
    var _locY = 0;
    var _lastKey = null;
    var _keyBuffer = [];
    var _inputMode = false;
    var _haltedFlag = false;
    var _runningFlag = false;

    // Array handling methods
    // ----------------------------------------------------
    this.initArray = function(dimensions, obj) {
        var a = {};
        if (dimensions && dimensions.length > 0) {
            a._dimensions = dimensions;
        }
        else {
            // default to single dimension to support Dim myArray() syntax
            // for convenient hashtable declaration
            a._dimensions = [0];
        }
        a._newObj = { value: obj };
        return a;
    };

    this.resizeArray = function(a, dimensions, obj, preserve) {
       if (!preserve) {
         var props = Object.getOwnPropertyNames(a);
         for (var i = 0; i < props.length; i++) {
            if (props[i] != "_newObj") {
               delete a[props[i]];
            }
         }
      }
      a._dimensions = dimensions;
    };

    this.arrayValue = function(a, indexes) {
        var value = a;
        for (var i=0; i < indexes.length; i++) {
            if (value[indexes[i]] == undefined) {
                if (i == indexes.length-1) {
                    value[indexes[i]] = JSON.parse(JSON.stringify(a._newObj));
                }
                else {
                    value[indexes[i]] = {};
                }
            }
            value = value[indexes[i]];
        }

        // added to treat regular objects and qb hashtable/arrays the same
        if (value.value == undefined) {
            value = { value: value };
        }
        return value;
    };

    this.import = async function(url) {
        await fetch(url).then(response => response.text()).then((response) => {
            var f = new Function(response);
            f();
        });
    };
/*
    this.byRef = function(v) {
        if (v != undefined && v.value == undefined) {
            return { value: v };
        }
        return v;
    };

    this.byValue = function(v) {
        if (v !== undefined && v.value != undefined) {
            return v.value;
        }
        return v;
    };

    this.$var = function(varname) {
        return window[varname];
    };

    this.$func = function(methodName) {
        var func = window["sub_" + methodName];
        if (func == undefined) {
            func = window["func_" + methodName]
        }
        return func;
    }
*/
    // Process control methods
    // -------------------------------------------
    this.halt = function() {
        _haltedFlag = true;
        _runningFlag = false;
    };

    this.halted = function() {
        return _haltedFlag;
    };

    this.end = function() {
        _runningFlag = false;
    };

    this.start = function() {
        _runningFlag = true;
        _haltedFlag = false;
    }

    this.running = function() {
        return _runningFlag;
    };


    // Extended QB64 Keywords
    // --------------------------------------------
    this.func__Alpha = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).a * 255;
    };

    this.func__Alpha32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).a * 255;
    };

    this.func__Atan2 = function(y, x) {
        return Math.atan2(y, x);
    };

    this.func__Blue = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).b;
    };

    this.func__Blue32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).b;
    };

    this.sub__Delay = async function(seconds) {
        await GX.sleep(seconds*1000);
    };

    this.func__FontHeight = function(fnt) {
        //return GX.fontHeight(_fntDefault) + GX.fontLineSpacing(_fntDefault);
        return 16;
    };

    this.func__FontWidth = function(fnt) {
        //return GX.fontWidth(_fntDefault);
        return 8;
    };

    this.func__Green = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).g;
    };

    this.func__Green32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).g;
    };

    this.func__Height = function(img) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return GX.sceneHeight();
    };

    this.func__InStrRev = function(arg1, arg2, arg3) {
      var startIndex = +Infinity;
      var strSource = "";
      var strSearch = "";
      if (arg3 != undefined) {
          startIndex = arg1-1;
          strSource = String(arg2);
          strSearch = String(arg3);
      }
      else {
          strSource = String(arg1);
          strSearch = String(arg2);
      }
      return strSource.lastIndexOf(strSearch, startIndex)+1;
    };

   this.func__KeyDown = function(keyCode) {
        // TODO: actual implementation (maybe)
        //       this is here just to allow converted programs to compile
        return GX.keyDown(keyCode) ? -1 : 0;
    };
    this.func__KeyHit = function() {
        // TODO: actual implementation (maybe)
        //       this is here just to support rendering loops that are using _KeyHit as the exit criteria
        return 0;
    };

    this.sub__Limit = async function(fps) {
        // TODO: limit based on frame rate
        //       need to incorporate time elapsed from last loop invocation

        await GX.sleep(1000/fps);
    };

    this.func__MouseInput = function() {
        return GX._mouseInput();
    };

    this.func__MouseX = function() {
        return GX.mouseX();
    };

    this.func__MouseY = function() {
        return GX.mouseY();
    };

    this.func__MouseButton = function(button) {
        return GX.mouseButton(button);
    };

    this.func__NewImage = function(iwidth, iheight) {
        return {
            width: iwidth,
            height: iheight
        };
    };

    this.sub__PrintString = function(x, y, s) {
        // TODO: check the background opacity mode
        // Draw the text background
        var ctx = GX.ctx();
        ctx.beginPath();
        ctx.fillStyle = _bgColor.rgba();
        ctx.fillRect(x, y, QB.func__FontWidth(), QB.func__FontHeight());
        //GX.drawText(_fntDefault, x, y, s);
        ctx.font = "16px dosvga";
        ctx.fillStyle = _fgColor.rgba();
        ctx.fillText(s, x, y+QB.func__FontHeight()-6);
    };

    this.func__PrintWidth = function(s) {
        if (!s) { return 0; }
        return String(s).length * QB.func__FontWidth();
    };

    this.func__Pi = function(m) {
        if (m == undefined) {
            m = 1;
        }
        return Math.PI * m;
    }

    function _rgb(r, g, b) {
        return {
            r: r,
            g: g,
            b: b,
            a: 1,
            rgb: function() { return "rgb(" + this.r + "," + this.g + "," + this.b + ")"; },
            rgba: function() { return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")"; }
        }
    }

    this.func__Red = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).r;
    };

    this.func__Red32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).r;
    };

    this.func__RGB = function(r, g, b) {
        return this.func__RGB32(r, g, b);
    };

    this.func__RGB32 = function(r, g, b, a) {
        if (a == undefined) {
            a = 255;
        }
        if (b == undefined && g != undefined) {
            a = g;
            g = r;
            b = r;
        }
        else if (b == undefined) {
            g = r;
            b = r;
        }
        a = a / 255;

        return {
            r: r,
            g: g,
            b: b,
            a: a,
            rgb: function() { return "rgb(" + this.r + "," + this.g + "," + this.b + ")"; },
            rgba: function() { return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")"; }
        }
    }

    this.func__Round = function(value) {
        return Math.round(value);
    };

    this.func__ScreenExists = function() {
        return true;
    }

    this.sub__Title = function(title) {
        document.title = title;
    };

    this.func__Trim = function(value) {
        return value.trim();
    };

    this.func__Width = function(img) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return GX.sceneWidth();
    };


    // QB45 Keywords
    // --------------------------------------------
    this.func_Asc = function(value, pos) {
        if (pos == undefined) {
            pos = 0;
        }
        else { pos--; }

        return String(value).charCodeAt(pos);
    }

    this.func_Abs = function(value) {
        return Math.abs(value);
    };

    this.func_Chr = function(charCode) {
        return String.fromCharCode(charCode);
    };

    this.sub_Cls = function() {
        // TODO: parameter variants
        var ctx = GX.ctx();
        ctx.beginPath();
        ctx.fillStyle = _bgColor.rgba();
        ctx.fillRect(0, 0, QB.func__Width() , QB.func__Height());
    };

    function _color(c) {
        if (c != undefined && c.r != undefined) {
            return c;
        }
        return QB.func__RGB(0,0,0);
    }

    this.sub_Color = function(fg, bg) {
        if (fg != undefined) {
            _fgColor = _color(fg);
        }
        if (bg != undefined) {
            _bgColor = _color(bg);
        }
    };

    this.func_Command = function() {
        return "";
    };
    
    this.func_Cos = function(value) {
        return Math.cos(value);
    };

    this.func_Exp = function(value) {
        return Math.exp(value);
    };

    this.func_Fix = function(value) {
        if (value >=0) {
            return Math.floor(value);
        }
        else {
            return Math.floor(Math.abs(value)) * -1;
        }
    };

    function _textColumns() {
        return Math.floor(QB.func__Width() / QB.func__FontWidth());
    }

    function _textRows() {
        return Math.floor(QB.func__Height() / QB.func__FontHeight());
    }

    this.sub_Input = async function(values, preventNewline, addQuestionPrompt, prompt) {
        _lastKey = null;
        var str = "";
        _inputMode = true;

        if (prompt != undefined) {
            QB.sub_Print([prompt, QB.PREVENT_NEWLINE]);
        }
        if (prompt == undefined || addQuestionPrompt) {
            QB.sub_Print(["? ", QB.PREVENT_NEWLINE]);
        }

        if (!preventNewline && _locY > _textRows()-1) {
                await _printScroll();
            _locY = _textRows()-1;
        }
        //QB.sub__PrintString(_locX * QB.func__FontWidth(), _locY * QB.func__FontHeight(), "? ");
        //_locX += 2;
        while (_lastKey != "Enter") {

            if (_lastKey == "Backspace" && str.length > 0) {
                _locX--;
                
                var ctx = GX.ctx();
                ctx.beginPath();
                ctx.fillStyle = _bgColor.rgba();
                ctx.fillRect(_locX * QB.func__FontWidth(), _locY * QB.func__FontHeight(), QB.func__FontWidth() , QB.func__FontHeight());
                str = str.substring(0, str.length-1);
            }

            else if (_lastKey && _lastKey.length < 2) {
                QB.sub__PrintString(_locX * QB.func__FontWidth(), _locY * QB.func__FontHeight(), _lastKey);
                _locX++;
                str += _lastKey;
            }

            _lastKey = null;
            await GX.sleep(10);
        }
        if (!preventNewline) {
            _locY++;
            _locX = 0;
        }

        if (values.length < 2) {
            values[0] = str;
        }
        else {
            var vparts = str.split(",");
            for (var i=0; i < values.length; i++) {
                values[i] = vparts[i] ? vparts[i] : "";
            }
        }
        _inputMode = false;
    }

    this.func_InKey = function() {
        if (_keyBuffer.length < 1) {
            return "";
        }
        return _keyBuffer.shift();
//        var temp = _lastKey;
//        _lastKey = "";
//        return temp;
    }

    this.func_InStr = function(arg1, arg2, arg3) {
        var startIndex = 0;
        var strSource = "";
        var strSearch = "";
        if (arg3 != undefined) {
            startIndex = arg1-1;
            strSource = String(arg2);
            strSearch = String(arg3);
        }
        else {
            strSource = String(arg1);
            strSearch = String(arg2);
        }
        return strSource.indexOf(strSearch, startIndex)+1;
    };

    this.func_Int = function(value) {
        return Math.floor(value);
    };

    this.func_LCase = function(value) {
        return String(value).toLowerCase();
    };

    this.func_Left = function(value, n) {
        return String(value).substring(0, n);
    };

    this.func_Len = function(value) {
        return String(value).length;
    };

    this.func_Log = function(value) {
        return Math.log(value);
    };

    this.sub_Circle = function(step, x, y, radius, color, startAngle, endAngle, aspect) {
        // TODO: implement aspect parameter
        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }

        if (startAngle == undefined) { startAngle = 0; }
        if (endAngle == undefined) { endAngle = 2 * Math.PI; }
        
        if (step) {
            x = _lastX + x;
            y = _lastY + y;
        }
        _lastX = x;
        _lastY = y;

        var ctx = GX.ctx();
        ctx.strokeStyle = color.rgba();
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.stroke();
    };

    this.sub_Line = function(sstep, sx, sy, estep, ex, ey, color, style, pattern) {
        if (color == undefined) {
            if (style == "BF") {
                color = _bgColor;
            }
            else {
                color = _fgColor;
            }
        }
        else {
            color = _color(color);
        }
        
        if (sstep) {
            sx = _lastX + sx;
            sy = _lastY + sy;
        }
        if (sx == undefined) {
            sx = _lastX;
            sy = _lastY;
        }
        _lastX = sx;
        _lastY = sy;

        if (estep) {
            ex = _lastX + ex;
            ey = _lastY + ey;
        }
        _lastX = ex;
        _lastY = ey;

        var ctx = GX.ctx();

        if (style == "B") {
            ctx.strokeStyle = color.rgba();
            ctx.beginPath();
            ctx.strokeRect(sx, sy, ex-sx, ey-sy)
        } 
        else if (style == "BF") {
            ctx.fillStyle = color.rgba();
            ctx.beginPath();
            ctx.fillRect(sx, sy, ex-sx, ey-sy)
        } 
        else {
            ctx.strokeStyle = color.rgba();
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
    };

    this.sub_LineInput = async function(values, preventNewline, addQuestionPrompt, prompt) {
        await QB.sub_Input(values, preventNewline, addQuestionPrompt, prompt);
    }

    this.sub_Locate = function(row, col) {
        // TODO: implement cursor positioning/display
        if (row && row > 0 && row <= _textRows()) {
            _locY = row-1;
        }
        if (col && col > 0 && col <= _textColumns()) {
            _locX = col-1;
        }
    };

    this.func_LTrim = function(value) {
        return String(value).trimStart();
    }

    this.func_Mid = function(value, n, len) {
      if (len == undefined) {
         return String(value).substring(n-1);
      }
      else {
        return String(value).substring(n-1, n+len-1);
      }
    };

    this.sub_Print = async function(args) {
        // Print called with no arguments
        if (args == undefined || args == null || args.length < 1) {
            args = [""];
        }

        var ctx = GX.ctx();
        var preventNewline = (args[args.length-1] == QB.PREVENT_NEWLINE || args[args.length-1] == QB.COLUMN_ADVANCE);

        for (var ai = 0; ai < args.length; ai++) {
            if (args[ai] == QB.PREVENT_NEWLINE) {
                // ignore as we will just concatenate the next arg
            }
            else if (args[ai] == QB.COLUMN_ADVANCE) {
                // TODO: advance to the next column offset
                _locX += 14 - _locX % 13;
            }
            else {
                var str = args[ai];
                var lines = String(str).split("\n");
                for (var i=0; i < lines.length; i++) {
                    var x = _locX * QB.func__FontWidth();
                    var y = -1;
        
                    // scroll the screen
                    if (_locY < _textRows()-1) {
                        y = _locY * QB.func__FontHeight();
                        //_locY = _locY + 1;
                    }
                    else {
                        //await _printScroll();
        
                        y = (_locY) * QB.func__FontHeight();
                    }
        
                    // TODO: check the background opacity mode
                    // Draw the text background
                    ctx.beginPath();
                    ctx.fillStyle = _bgColor.rgba();
                    ctx.fillRect(x, y, QB.func__FontWidth() * lines[i].length, QB.func__FontHeight());
        
                    //GX.drawText(_fntDefault, x, y, lines[i]);
                    ctx.font = "16px dosvga";
                    ctx.fillStyle = _fgColor.rgba();
                    ctx.fillText(lines[i], x, y+QB.func__FontHeight()-6);

                    _locX += lines[i].length;

                    if (i < lines.length-1) {
                        if (_locY < _textRows()-1) {
                            _locY = _locY + 1;
                            _locX = 0;
                        }
                        else {
                            await _printScroll();
                        }
                    }
                }
            }
        }

        if (!preventNewline) {
            _locX = 0;
            if (_locY < _textRows()-1) {
                _locY = _locY + 1;
            }
            else {
                await _printScroll();
            }
        }
    };

/*
    this.sub_Print = async function(str) {
        if (str == undefined || str == null) {
            str = "";
        }
        var ctx = GX.ctx();
        var lines = String(str).split("\n");
        for (var i=0; i < lines.length; i++) {
            var x = _locX * QB.func__FontWidth();
            var y = -1;

            // scroll the screen
            if (_locY < _textRows()) {
                y = _locY * QB.func__FontHeight();
                _locY = _locY + 1;
            }
            else {
                await _printScroll();

                y = (_locY-1) * QB.func__FontHeight();
            }

            // TODO: check the background opacity mode
            // Draw the text background
            ctx.beginPath();
            ctx.fillStyle = _bgColor.rgba();
            ctx.fillRect(x, y, QB.func__FontWidth() * lines[0].length, QB.func__FontHeight());

            GX.drawText(_fntDefault, x, y, lines[i]);
        }
        _locX = 0;
    };
*/
    async function _printScroll() {
        var img = new Image();
        img.src = GX.canvas().toDataURL("image/png");
        while (!img.complete) {
            await GX.sleep(10);
        }
        var ctx = GX.ctx();
        ctx.beginPath();
        ctx.fillStyle = _bgColor.rgba();
        ctx.fillRect(0, 0, QB.func__Width(), QB.func__Height());
        ctx.drawImage(img, 0, -QB.func__FontHeight());
    }

    this.sub_PSet = function(sstep, x, y, color) {
        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }
        if (sstep) {
            x = _lastX + x;
            y = _lastY + y;
        }
        _lastX = x;
        _lastY = y;

        var ctx = GX.ctx();
        ctx.fillStyle = color.rgba();
        ctx.beginPath();
        ctx.fillRect(x, y, 1, 1);
    };

    this.func_Right = function(value, n) {
        if (value == undefined) {
            return "";
        }
        var s = String(value);
        return s.substring(s.length-n, s.length);
    };

    this.func_RTrim = function(value) {
        return String(value).trimEnd();
    }

    this.func_Rnd = function(n) {
        // TODO: implement modifier parameter
        return Math.random();
    }

    this.sub_Screen = async function(mode) {
        if (mode == 0) {
            GX.sceneCreate(640, 400);
            //GX.fontLineSpacing(_fntDefault, 2);
        }
        else if (mode < 2 || mode == 7 || mode == 13) {
            GX.sceneCreate(320, 200);
            //GX.fontLineSpacing(_fntDefault, 0);
        }
        else if (mode == 8) {
            GX.sceneCreate(640, 200);
            //GX.fontLineSpacing(_fntDefault, 0);
        }
        else if (mode == 9 || mode == 10) {
            GX.sceneCreate(640, 350);
            //GX.fontLineSpacing(_fntDefault, 0);
        }
        else if (mode == 11 || mode == 12) {
            GX.sceneCreate(640, 480);
            //GX.fontLineSpacing(_fntDefault, 0);
        }
        else if (mode.width != undefined) {
            GX.sceneCreate(mode.width, mode.height);
            //GX.fontLineSpacing(_fntDefault, 2);
        }

        // initialize the graphics
        _fgColor = this.func__RGB(255, 255, 255); 
        _bgColor = this.func__RGB(0, 0, 0);
        _lastX = 0;
        _lastY = 0;
        _locX = 0;
        _locY = 0;
        _lastKey = null;
        _inputMode = false;
    };

    this.func_Sgn = function(value) {
        if (value > 0) { return 1; }
        else if (value < 0) { return -1; }
        else { return 0; }
    };

    this.func_Sin = function(value) {
        return Math.sin(value);
    };

    this.sub_Sleep = async function(seconds) {
        var elapsed = 0;
        var totalWait = Infinity;
        if (seconds != undefined) {
            totalWait = seconds*1000;
        }
        
        _lastKey = null;
        while (!_lastKey && elapsed < totalWait) { 
            await GX.sleep(100); 
            elapsed += 100;
        }
    };

    this.func_Sqr = function(value) {
        return Math.sqrt(value);
    };

    this.func_Str = function(value) {
        return String(value);
    };

    this.sub_Swap = function(values) {
        var temp = values[1];
        values[1] = values[0];
        values[0] = temp;
    };

    this.func_Tan = function(value) {
        return Math.tan(value);
    };

    this.func_Timer = function(accuracy) {
        // TODO: implement optional accuracy
        var midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        return ((new Date()).getTime() - midnight.getTime()) / 1000;
    };

    this.func_Atn = function(value) {
        return Math.atan(value);
    };

    this.func_UBound = function(a, dimension) {
        if (dimension == undefined) {
            dimension = 1;
        }
        return a._dimensions[dimension-1];
        //return a.length-1;
    };

    this.func_UCase = function(value) {
        return String(value).toUpperCase();
    };

    this.func_Val = function(value) {
        return Number(value);
    };


    // QBJS-only methods
    // ---------------------------------------------------------------------------------
    this.func_Fetch = async function(url) {
        var response = await fetch(url);
        var responseText = await(response.text());
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            text: responseText
        };
    };

    this.func_FromJSON = function(s) {
        return JSON.parse(s);
    };

    this.func_ToJSON = function(a) {
        return JSON.stringify(a);
    }


    function _init() {
        // initialize the fonts
        /*if (!_fntDefault) {
            _fntDefault = GX.fontCreate("./qb/font.png", 8, 14,
                "`1234567890-=~!@#$%^&*()_+\n" + 
                "qwertyuiop[]\\QWERTYUIOP{}|\n" + 
                "asdfghjkl;'ASDFGHJKL:\"\n" + 
                "zxcvbnm,./ZXCVBNM<>?");    
        }*/

        addEventListener("keydown", function(event) { 
            if (_inputMode) {
                event.preventDefault();
            }
            _lastKey = event.key;
        });

        addEventListener("keyup", function(event) { 
            _keyBuffer.push(event.key);
        });

    };

    _init();
}
