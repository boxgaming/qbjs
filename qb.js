var QB = new function() {
    // QB sound functionality
    // original source: https://siderite.dev/blog/qbasic-play-in-javascript
    class QBasicSound {

        constructor() {
            this.octave = 4;
            this.noteLength = 4;
            this.tempo = 120;
            this.mode = 7 / 8;
            this.foreground = true;
            this.type = 'square';
        }
    
        stop() {
            if (this._audioContext) {
                this._audioContext.suspend();
                this._audioContext.close();
            }
        }

        setType(type) {
            this.type = type;
        }
    
        async playSound(frequency, duration) {
            if (!this._audioContext) {
                this._audioContext = new AudioContext();
            }
            // a 0 frequency means a pause
            if (frequency == 0) {
                await delay(duration);
            } else {
                const o = this._audioContext.createOscillator();
                const g = this._audioContext.createGain();
                o.connect(g);
                g.connect(this._audioContext.destination);
                g.gain.value = 0.25;
                o.frequency.value = frequency;
                o.type = this.type;
                o.start();
                const actualDuration = duration * this.mode;
                const pause = duration - actualDuration;
                await delay(actualDuration);
                o.stop();
                if (pause) { await delay(pause); }
            }
        }
    
        getNoteValue(octave, note) {
            const octaveNotes = 'C D EF G A B';
            const index = octaveNotes.indexOf(note.toUpperCase());
            if (index < 0) {
                throw new Error(note + ' is not a valid note');
            }
            return octave * 12 + index;
        }

        async play(commandString) {
            commandString = commandString.replace(/ /g, "");
            const reg = /(?<octave>O\d+)|(?<octaveUp>>)|(?<octaveDown><)|(?<note>[A-G][#+-]?\d*\.?[,]?)|(?<noteN>N\d+\.?)|(?<length>L\d+)|(?<legato>ML)|(?<normal>MN)|(?<staccato>MS)|(?<pause>P\d+\.?)|(?<tempo>T\d+)|(?<foreground>MF)|(?<background>MB)/gi;
            let match = reg.exec(commandString);
            let promise = Promise.resolve();
            let nowait = false;
            while (match) {
                let noteValue = null;
                let longerNote = false;
                let temporaryLength = 0;
                if (match.groups.octave) {
                    this.octave = parseInt(match[0].substring(1));
                }
                if (match.groups.octaveUp) {
                    this.octave++;
                }
                if (match.groups.octaveDown) {
                    this.octave--;
                }
                if (match.groups.note) {
                    const noteMatch = /(?<note>[A-G])(?<suffix>[#+-]?)(?<shorthand>\d*)(?<longerNote>\.?)(?<nowait>,?)/i.exec(match[0]);
                    if (noteMatch.groups.longerNote) {
                        longerNote = true;
                    }
                    if (noteMatch.groups.shorthand) {
                        temporaryLength = parseInt(noteMatch.groups.shorthand);
                    }
                    if (noteMatch.groups.nowait) {
                        nowait = true;
                    }
                    noteValue = this.getNoteValue(this.octave, noteMatch.groups.note);
                    switch (noteMatch.groups.suffix) {
                        case '#':
                        case '+':
                            noteValue++;
                            break;
                        case '-':
                            noteValue--;
                            break;
                    }
                }
                if (match.groups.noteN) {
                    const noteNMatch = /N(?<noteValue>\d+)(?<longerNote>\.?)/i.exec(match[0]);
                    if (noteNMatch.groups.longerNote) {
                        longerNote = true;
                    }
                    noteValue = parseInt(noteNMatch.groups.noteValue);
                }
                if (match.groups.length) {
                    this.noteLength = parseInt(match[0].substring(1));
                }
                if (match.groups.legato) {
                    this.mode = 1;
                }
                if (match.groups.normal) {
                    this.mode = 7 / 8;
                }
                if (match.groups.staccato) {
                    this.mode = 3 / 4;
                }
                if (match.groups.pause) {
                    const pauseMatch = /P(?<length>\d+)(?<longerNote>\.?)/i.exec(match[0]);
                    if (pauseMatch.groups.longerNote) {
                        longerNote = true;
                    }
                    noteValue = 0;
                    temporaryLength = parseInt(pauseMatch.groups.length);
                }
                if (match.groups.tempo) {
                    this.tempo = parseInt(match[0].substring(1));
                }
                if (match.groups.foreground) {
                    this.foreground = true;
                }
                if (match.groups.background) {
                    this.foreground = false;
                }
    
                if (noteValue !== null) {
                   const noteDuration = (60000 * 4 / this.tempo);
                    let duration = (temporaryLength
                        ? noteDuration / temporaryLength
                        : noteDuration / this.noteLength);
                    if (longerNote) { duration *= 1.5; }
                    const C6 = 1047;
                    const freq = noteValue == 0
                        ? 0
                        : C6 * Math.pow(2, (noteValue - 48) / 12);
                    if (nowait) {
                        this.playSound(freq, duration);
                        nowait = false;
                    }
                    else {
                        await this.playSound(freq, duration);
                    }
                }
                match = reg.exec(commandString);
            }
            if (this.foreground) {
                await promise;
            } else {
                promise;
            }
        }
    }
    
    function delay(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }


    // QB public constants
    this._KEEPBACKGROUND = 1;
    this._ONLYBACKGROUND = 2;
    this._FILLBACKGROUND = 3;

    // QB constants
    this.COLUMN_ADVANCE = Symbol("COLUMN_ADVANCE");
    this.PREVENT_NEWLINE = Symbol("PREVENT_NEWLINE");
    this.STRETCH = Symbol("STRETCH");
    this.SQUAREPIXELS = Symbol("SQUAREPIXELS");
    this.APPEND = Symbol("APPEND");
    this.BINARY = Symbol("BINARY");
    this.INPUT = Symbol("INPUT");
    this.OUTPUT = Symbol("OUTPUT");
    this.RANDOM = Symbol("RANDOM");

    var _activeImage = 0;
    var _bgColor = null; 
    var _colormap = [];
    var _currScreenImage = null;
    var _dataBulk = [];
    var _dataLabelMap;
    var _font = 16;
    var _fgColor = null;
    var _fonts = {};
    var _haltedFlag = false;
    var _images = {};
    var _inkeyBuffer = [];
    var _inkeymap = {};
    var _inkeynp = {};
    var _inputMode = false;
    var _inputCursor = false;
    var _inputTimeout = false;
    var _keyDownMap = {};
    var _keyHitBuffer = [];
    var _keyhitmap = {};
    var _lastLimitTime;
    var _lastKey = null;
    var _locX = 0;
    var _lastTextX = 0;
    var _locY = 0;
    var _nextImageId = 1000;
    var _nextFontId = 1000;
    var _printMode = this._FILLBACKGROUND;
    var _readCursorPosition;
    var _resize = false;
    var _resizeWidth = 0;
    var _resizeHeight = 0;
    var _rndSeed;
    var _runningFlag = false;
    var _screenDiagInv;
    var _screenMode;
    var _screenText;
    var _sourceImage = 0;
    var _strokeDrawLength = null;
    var _strokeDrawAngle = null;
    var _strokeDrawColor = null;
    var _strokeLineThickness = 2;
    var _windowAspect = [];
    var _windowDef = [];
    var _fileHandles = {};
    var _typeMap = {};
    var _ucharMap = {};
    var _ccharMap = {};
    var _player = null;
    var _soundCtx = null;
    
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
            a._dimensions = [{l:0,u:1}];
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
        if (dimensions && dimensions.length > 0) {
            a._dimensions = dimensions;
        }
        else {
            // default to single dimension to support Dim myArray() syntax
            // for convenient hashtable declaration
            a._dimensions = [{l:0,u:1}];
        }
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

        return value;
    };


    this.resize = function(width, height) {
        _resize = true;
        _resizeWidth = width;
        _resizeHeight = height;
    }

    // Data type conversions
    this.toInteger = function(value) {
        var result = parseInt(value);
        if (isNaN(result)) {
            result = 0;
        }
        return result;
    };

    this.toFloat = function(value) {
        var result = parseFloat(value);
        if (isNaN(result)) {
            result = 0;
        }
        return result;
    };

    this.toBoolean = function(value) {
        return value ? -1 : 0;
    };

    // Process control methods
    // -------------------------------------------
    this.halt = function() {
        _haltedFlag = true;
        _runningFlag = false;
        _inputMode = false;
        _player.stop();
        if (_soundCtx) {
            _soundCtx.suspend();
            _soundCtx.close();
        }
        GX.soundStopAll();
        toggleCursor(true);
    };

    this.halted = function() {
        return _haltedFlag;
    };

    this.end = function() {
        _flushAllScreenCache();
        _runningFlag = false;
    };

    this.start = function() {
        _activeImage = 0;
        _currScreenImage = null;
        _dataLabelMap = {};
        _haltedFlag = false;
        _lastLimitTime = new Date();
        _nextImageId = 1000;
        _printMode = QB._FILLBACKGROUND;
        _readCursorPosition = 0;
        _rndSeed = 327680;
        _runningFlag = true;
        _sourceImage = 0;
        _strokeLineThickness = 2;
        _player = new QBasicSound();
        _soundCtx = new AudioContext();
        // initialize the default fonts
        _nextFontId = 1000;
        _font = 16;
        _fonts = {};
        _fonts[8] = { name: "dosvga", size: "16px", style: "", offset: 4, monospace: true };
        _fonts[14] = { name: "dosvga", size: "16px", style: "", offset: 4, monospace: true };
        _fonts[16] = { name: "dosvga", size: "16px", style: "", offset: 4, monospace: true };
        GX.vfsCwd(GX.vfs().rootDirectory());
        _fileHandles = {};
        _initColorTable();
        GX._enableTouchMouse(true);
        GX.registerGameEvents(function(e){});
        QB.sub_Screen(0);
    };

    this.setData = function(data) {
        _dataBulk = data;
    };

    this.setDataLabel = function(label, dataIndex) {
        _dataLabelMap[label] = dataIndex;
    }

    this.setTypeMap = function(typeMap) {
        _typeMap = typeMap;
    }

    this.running = function() {
        return _runningFlag;
    };

    // Access methods for std libraries
    // --------------------------------------------
    this.getImage = function(imageId) {
        return _images[imageId].canvas;
    };

    this.defaultLineWidth = function(width) {
        if (width != undefined) {
            _strokeLineThickness = width;
        }
        return _strokeLineThickness;
    };

    this.colorToRGB = _color;

    this.vfs = function() { return GX.vfs(); }
    this.vfsCwd = function() { return GX.vfsCwd(); }

    this.downloadFile = async function(data, defaultName) {
        if (window.showSaveFilePicker) {
            const handle = await showSaveFilePicker({ suggestedName: defaultName });
            const writable = await handle.createWritable();
            await writable.write(data);
            writable.close();
        }
        else {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(data);
            link.download = defaultName;
            link.click();
            link.remove();
        }
    };

    // Runtime Assertions
    function _assertParam(param, arg) {
        if (arg == undefined) { arg = 1; }
        if (param == undefined) { throw new Error("Method argument " + arg + " is required"); }
    }

    function _assertNumber(param, arg) {
        if (arg == undefined) { arg = 1; }
        if (isNaN(param)) { throw new Error("Number required for method argument " + arg); }
    }

    // Extended QB64 Keywords
    // --------------------------------------------

    this.func__Acos = function(x) {
        _assertNumber(x);
        return Math.acos(x);
    };

    this.func__Acosh = function(x) {
        _assertNumber(x);
        return Math.acosh(x);
    };

    this.func__Arccot = function(x) {
        _assertNumber(x);
        return 2 * Math.atan(1) - Math.atan(x);
    };

    this.func__Arccsc = function(x) {
        _assertNumber(x);
        return Math.asin(1 / x);
    };

    this.func__Arcsec = function(x) {
        _assertNumber(x);
        return Math.acos(1 / x);
    };

    this.func__Alpha = function(rgb, imageHandle) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).a;
    };

    this.func__Alpha32 = function(rgb) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).a;
    };

    this.func__Asin = function(x) {
        _assertNumber(x);
        return Math.asin(x);
    };

    this.func__Asinh = function(x) {
        _assertNumber(x);
        return Math.asinh(x);
    };

    this.func__Atanh = function(x) {
        _assertNumber(x);
        return Math.atanh(x);
    };

    this.func__Atan2 = function(y, x) {
        _assertNumber(x);
        return Math.atan2(y, x);
    };

    // the canvas handles the display for us, there is effectively no difference
    // between _display and _autodisplay, included here for compatibility
    this.func__AutoDisplay = function() { return -1; }
    this.sub__AutoDisplay = function() {}

    this.func__BackgroundColor = function() {
        return _bgColor;
    };

    this.func__Blue = function(rgb, imageHandle) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).b;
    };

    this.func__Blue32 = function(rgb) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).b;
    };

    this.func__CapsLock = function() {
        return  _keyDownMap._CapsLock ? -1 : 0;
    };

    this.func__Ceil = function(x) {
        _assertNumber(x);
        return Math.ceil(x);
    };

    this.func__Clipboard = async function () {
      var result = "";
      await navigator.clipboard.readText().then((clipText) => (result = clipText));
      return result;
    };

    this.sub__Clipboard = function (text) {
        _assertParam(text);
        navigator.clipboard.writeText(text);
    }

    this.func__ClipboardImage = async function () {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              var image = new Image();
              var imgId = -1;
              image.src = URL.createObjectURL(blob);
              await image.decode();
              imgId = QB.func__NewImage(image.width, image.height, 32);
              var ctx = _images[imgId].ctx;
              ctx.drawImage(image, 0, 0);
              return imgId;
            }
          }
        }
      } catch (e) {
        return -1;
      }
      return -1;
    };

    this.sub__ClipboardImage = async function (imageIdToCopy) {
        _assertParam(imageIdToCopy);
        _assertNumber(imageIdToCopy);
        if (!_images[imageIdToCopy]) {
          throw new Error("Invalid image ID");
          return;
        }
        await _images[imageIdToCopy].canvas.toBlob(function(blob) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        });
    }

    this.func__CommandCount = function() {
        return 0;
    };

    this.func__CopyImage = function(srcImageId) {
        _assertNumber(srcImageId);
        var srcCanvas = _images[srcImageId].canvas;
        var destImageId = QB.func__NewImage(srcCanvas.width, srcCanvas.height);
        var ctx = _images[destImageId].ctx;
        ctx.drawImage(srcCanvas, 0, 0);

        return destImageId;
    };

    this.func__Cosh = function(x) {
        _assertNumber(x);
        return Math.cosh(x);
    };

    this.func__Cot = function(x) {
        _assertNumber(x);
        return 1 / Math.tan(x);
    }

    this.func__Coth = function(x) {
        _assertNumber(x);
        return 1 / Math.tanh(x);
    };

    this.func__Csc = function(x) {
        _assertNumber(x);
        return 1 / Math.sin(x);
    };

    this.func__Csch = function(x) {
        _assertNumber(x);
        return 1 / Math.sinh(x);
    };

    this.func__CWD = function() {
        return GX.vfs().fullPath(GX.vfsCwd());
    };

    this.func__D2R = function(x) {
        _assertNumber(x);
        return x * Math.PI / 180;
    };

    this.func__D2G = function(x) {
        _assertNumber(x);
        return (x * 10 / 9);
    };

    this.func__DefaultColor = function(imageHandle) {
        // TODO: implement imageHandle version?
        //       at present we have a global default color rather than one per image
        return _fgColor;
    };

    this.func__Deflate = function(src) {
        _assertParam(src);
        var result = pako.deflate(src);//, { to: "string" });
        return String.fromCharCode.apply(String, result);
    };

    this.sub__Delay = async function(seconds) {
        _assertNumber(seconds);
        await GX.sleep(seconds*1000);
    };

    this.func__DesktopHeight = function() {
        return window.screen.height * window.devicePixelRatio;
    };

    this.func__DesktopWidth = function() {
        return window.screen.width * window.devicePixelRatio;
    };

    this.func__Dest = function() {
        return _activeImage;
    };

    this.sub__Dest = function(imageId) {
        _assertNumber(imageId);
        _flushScreenCache(_images[_activeImage]);
        _activeImage = imageId;
    };

    this.func__Dir = function(folder) {
        return "./";
    };

    this.func__DirExists = function(path) {
        _assertParam(path);
        var vfs = GX.vfs();
        var dir = vfs.getNode(path, GX.vfsCwd());
        if (dir && dir.type == vfs.DIRECTORY) {
            return -1;
        }
        return 0;
    };

    this.func__Display = function() {
        return 0;
    };

    this.sub__Display = function() {
        // The canvas handles this for us, this method is included for compatibility
    };

    this.sub__Echo = function(msg) {
        _assertParam(msg);
        console.log(msg); 
    };

    this.func__EnvironCount = function() {
        /* no-op: included for compatibility */
        return 0;
    };

    this.func__FileExists = async function(path) {
        _assertParam(path);
        var vfs = GX.vfs();
        var file = vfs.getNode(path, GX.vfsCwd());
        if (file && file.type == vfs.FILE) {
            return -1;
        }
        // didn't find the file in the vfs, so try to download it
        file = await _downloadFile(path);
        if (file) {
            return -1;
        }
        return 0;
    };

    this.sub__Font = function(fnt) {
        _assertNumber(fnt);
        _font = fnt;
        _locX = 0;
        _lastTextX = 0;
        _locY = 0;
        _initScreenText();
    };

    this.func__Font = function() {
        return _font;
    };

    this.func__FontHeight = function(fnt) {
        if (fnt == undefined) {
            fnt = _font;
        }
        if (fnt < 1000) {
            return 16;
        }
        return _fonts[fnt].height;
    };

    this.func__FontWidth = function(fnt) {
        if (fnt == undefined) {
            fnt = _font;
        }
        if (fnt < 1000) {
            return 8;
        }
        return _fonts[fnt].width;
    };

    this.sub__FreeImage = function(imageId) {
        if (imageId == undefined) {
            imageId = _activeImage;
        }
        _images[imageId] = undefined;
    };

    this.func__FullScreen = function() {
        return GX.fullScreen() ? 2 : 0;
    };

    this.sub__FullScreen = function(mode, smooth) {
        if (mode == QB.OFF) {
            GX.fullScreen(false);
        }
        else if (mode == QB.STRETCH || mode == QB.SQUAREPIXELS) {
            // TODO: not making any distinction at present
            GX.fullScreen(true, smooth);
        }
    }

    this.func__G2D = function(x) {
        return (x * 9/10);
    };

    this.func__G2R = function(x) {
        _assertNumber(x);
        return (x * 9/10) * Math.PI/180;
    };

    this.func__Green = function(rgb, imageHandle) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).g;
    };

    this.func__Green32 = function(rgb) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).g;
    };

    this.func__Height = function(imageId) {
        if (imageId == undefined) { imageId = _activeImage; }
        if (_images[imageId].charSizeMode) {
            return _height(imageId) / this.func__FontWidth();
        }
        return _height(imageId);
    };

    function _height(imageId) {
        if (imageId == undefined) { imageId = _activeImage; }
        return _images[imageId].canvas.height;
    }

    this.func__Hypot = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 1);
        return Math.hypot(x, y);
    };

    this.func__Inflate = function(src) {
        _assertParam(src);
        var result = pako.inflate(GX.vfs().textToData(src), { to: "string" });
        return result;
    };

    this.func__InStrRev = function(arg1, arg2, arg3) {
        _assertParam(arg1, 1);
        _assertParam(arg2, 2);
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

    this.sub__KeyClear = function(buffer) {
        if (buffer == undefined || buffer == 1) {
            _inkeyBuffer = [];
        }
        if (buffer == undefined || buffer == 2) {
            _keyHitBuffer = [];
        }
    };

    this.func__KeyDown = function(keyCode) {
        return (_keyDownMap[keyCode]) ? -1 : 0;
    };

    this.func__KeyHit = function() {
        if (_keyHitBuffer.length < 1) {
            return "";
        }
        return _keyHitBuffer.shift();
    };

    this.sub__Limit = async function(fps) {
        _assertNumber(fps);
        _flushAllScreenCache();
        var frameMillis = 1000 / fps / 1.15;
        await GX.sleep(0);
        while (Date.now() - _lastLimitTime < frameMillis) {
                await GX.sleep(0);
        }
        _lastLimitTime = new Date();
    };

    this.autoLimit = async function() {
        var timeElapsed = new Date() - _lastLimitTime;
        if (timeElapsed > 1000) { 
            _flushAllScreenCache();
            await GX.sleep(1);
            _lastLimitTime = new Date();
        }
    };

    this.func__LoadFont = async function(name, size, opts) {
        _assertParam(name, 1);
        _assertParam(size, 2);
        if (!isNaN(size)) {
            size = size + "px";
        }

        var id = _nextFontId;
        _nextFontId++;

        var nameLower = name.toLowerCase();
        if (nameLower.startsWith("http://") || nameLower.startsWith("https://") || nameLower.startsWith("data:")) {
            // load the font from the url
            var url = name;
            name = "Font-" + id;
            await _loadFont(name, url);
        }
        else {
            // attempt to load the font from the vfs
            var vfs = GX.vfs();
            var f = vfs.getNode(name, GX.vfsCwd());
            if (!f) {
                // couldn't find the font in the vfs, let's try to load it as a relative URL
                f = await _downloadFile(name);
            }
            if (f && f.type == vfs.FILE) {
                var url = await vfs.getDataURL(f);
                name = "Font-" + id;
                await _loadFont(name, url);
            }
            else {
                throw new Error("File not found: [" + name + "]");
            }
        }
        
        _fonts[id] = { name: name, size: size, style: ""};
        // determine the font width and height
        var ctx = GX.ctx();
        ctx.font = size + " " + name;
        var tm = ctx.measureText("M");

        if (tm.fontBoundingBoxAscent) {
            _fonts[id].height = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
            _fonts[id].offset = tm.fontBoundingBoxAscent - tm.actualBoundingBoxAscent;
        }
        else {
            // some browsers may still not support fontBoundingBox... so it will just not work as well
            _fonts[id].height = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent + 2;
            _fonts[id].offset = 0;
        }

        if (tm.width != ctx.measureText("i").width) {
            _fonts[id].width = 0;
            _fonts[id].monospace = false;
        }
        else {
            _fonts[id].width = tm.width;
            _fonts[id].monospace = true;
        }
        return id;

        async function _loadFont(name, url) {
            var fontFace = new FontFace(name, "url(" + url + ")");
            document.fonts.add(fontFace);
            await fontFace.load();
        }
    };


    this.func__LoadImage = async function(url) {
        _assertParam(url);
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
        var img = null;

        // attempt to read the image from the virtual file system
        var file = vfs.getNode(url, vfsCwd);
        if (file && file.type == vfs.FILE) {
            img = new Image();
            img.src = await vfs.getDataURL(file);
                
            while (!img.complete) {
                await GX.sleep(10);
            }
        }
        else {
            // otherwise, read it from the url location
            var img = new Image();
            img.src = url;

            while (!img.complete) {
                await GX.sleep(10);
            }
        }

        var imgId = QB.func__NewImage(img.width, img.height);
        var ctx = _images[imgId].ctx;
        ctx.drawImage(img, 0, 0);

        return imgId;
    };

    this.func__MouseInput = function() {
        return GX._mouseInput();
    };

    this.sub__MouseHide = function() {
        var canvas = _images[0].canvas;
        canvas.style.cursor = "none";
    };

    this.sub__MouseShow = function(style) {
        if (style == undefined) {
            style = "DEFAULT";
        }
        else {
            style = style.trim().toUpperCase();
        }
        var canvas = _images[0].canvas;
        if      (style == "LINK")                { canvas.style.cursor = "pointer"; }
        else if (style == "TEXT")                { canvas.style.cursor = "text"; }
        else if (style == "CROSSHAIR")           { canvas.style.cursor = "crosshair"; }
        else if (style == "VERTICAL")            { canvas.style.cursor = "ns-resize"; }
        else if (style == "HORIZONTAL")          { canvas.style.cursor = "ew-resize"; }
        else if (style == "TOPLEFT_BOTTOMRIGHT") { canvas.style.cursor = "nwse-resize"; }
        else if (style == "TOPRIGHT_BOTTOMLEFT") { canvas.style.cursor = "nesw-resize"; }
        else if (style == "PROGRESS")            { canvas.style.cursor = "progress"; }
        else if (style == "WAIT")                { canvas.style.cursor = "wait"; }
        else if (style == "MOVE")                { canvas.style.cursor = "move"; }
        else if (style == "NOT_ALLOWED")         { canvas.style.cursor = "not-allowed"; }
        else if (style == "GRAB")                { canvas.style.cursor = "grab"; }
        else if (style == "GRABBING")            { canvas.style.cursor = "grabbing"; }
        else if (style == "ZOOM_IN")             { canvas.style.cursor = "zoom-in"; }
        else if (style == "ZOOM_OUT")            { canvas.style.cursor = "zoom-out"; }
        else                                     { canvas.style.cursor = "default"; }
    };

    this.func__MouseX = function() {
        return GX.mouseX();
    };

    this.func__MouseY = function() {
        return GX.mouseY();
    };

    this.func__MouseButton = function(button) {
        _assertNumber(button);
        return GX.mouseButton(button);
    };

    this.func__MouseWheel = function() {
        return GX.mouseWheel();
    };
    
    this.func__NewImage = function(iwidth, iheight, mode) {
        _assertNumber(iwidth, 1);
        _assertNumber(iheight, 2);
        var canvas = document.createElement("canvas");
        canvas.id = "qb-canvas-" + _nextImageId;
        if (mode == 0) {
            canvas.width = this.func__FontWidth() * iwidth;
            canvas.height = this.func__FontHeight() * iheight;
        }
        else {
            canvas.width = iwidth;
            canvas.height = iheight;
        }
        ctx = canvas.getContext("2d");
        ctx.lineCap = "butt";

        _images[_nextImageId] = { canvas: canvas, ctx: ctx, lastX: 0, lastY: 0, charSizeMode: (mode == 0), dirty: true };
        var tmpId = _nextImageId;
        _nextImageId++;
        return tmpId;
    };

    this.func__NumLock = function() {
        return  _keyDownMap._NumLock ? -1 : 0;
    };

    this.func__OS = function() {

        var browser = "";
        if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1 )  {
            browser = "Opera";
        }
        else if (navigator.userAgent.indexOf("Edg") != -1 )  {
            browser = "Edge";
        }
        else if (navigator.userAgent.indexOf("Chrome") != -1 ) {
            browser = "Chrome";
        }
        else if (navigator.userAgent.indexOf("Safari") != -1) {
            browser = "Safari";
        }
        else if(navigator.userAgent.indexOf("Firefox") != -1 ) {
            browser = "Firefox";
        }
        else if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )) //IF IE > 10
        {
            browser = "IE"; 
        }  
        else 
        {
            browser = "Unknown";
        }

        return "[WEB][" + browser.toUpperCase() + "]";
    };

    this.sub__PaletteColor = function(x, y) {
        _colormap[x] = _color(y);
    };

    this.func__PrintMode = function(imageHandle) {
        return _printMode;
    };

    this.sub__PrintMode = function(mode, imageHandle) {
        // TODO: implement imageHandle?
        //       currently only one global mode instead of per image
        _printMode = mode;
    };

    this.sub__PrintString = function(x, y, s) {
        var ctx = _images[_activeImage].ctx;
        _flushScreenCache(_images[_activeImage]);
        var f = _fonts[_font];
        ctx.font = f.size + " " + f.name;
        var tm = ctx.measureText(s);
        var fheight = 0;
        if (tm.fontBoundingBoxAscent) {
            fheight = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
        }
        else {
            fheight = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
        }
    
        if (_printMode != QB._KEEPBACKGROUND) {
            ctx.fillStyle = _bgColor.rgba();
            ctx.fillRect(x, y, tm.width, fheight);
        }
        if (_printMode != QB._ONLYBACKGROUND) {
            // Draw the string
            ctx.fillStyle = _fgColor.rgba();
            ctx.fillText(s, x, y + fheight - f.offset);
        }
    };

    this.func__PrintWidth = function(s) {
        _assertParam(s);
        //if (!s) { return 0; }
        var ctx = GX.ctx();
        var f = _fonts[_font];
        ctx.font = f.size + " " + f.name;
        var tm = ctx.measureText(s);
        return tm.width;
    };

    this.func__Pi = function(m) {
        if (m == undefined) {
            m = 1;
        }
        else {
            _assertNumber(m);
        }
        return Math.PI * m;
    }

    this.sub__PutImage = function(dstep1, dx1, dy1, dstep2, dx2, dy2, sourceImageId, destImageId, sstep1, sx1, sy1, sstep2, sx2, sy2, smooth) {
        if (destImageId == undefined) {
            destImageId = _activeImage;
        }
        if (sourceImageId == undefined) {
            sourceImageId = _sourceImage;
        }
        var destImage = _images[destImageId];
        var sourceImage = _images[sourceImageId];
        var sw = 0;
        var sh = 0;
        var dw = 0;
        var dh = 0;

        var dxu = false;
        if (dx1 == undefined) {
            dx1 = 0;
            dy1 = 0;
            dxu = true;
        }
        else if (dstep1) {
            dx1 = destImage.lastX + dx1;
            dy1 = destImage.lastY + dy1;
        }

        if (dx2 == undefined) {
            if (dxu) {
                dw = destImage.canvas.width;
                dh = destImage.canvas.height;
            }
            else {
                dw = sourceImage.canvas.width;
                dh = sourceImage.canvas.height;
            }
        }
        else {
            if (dstep2) {
                dx2 = destImage.lastX + dx2;
                dy2 = destImage.lastY + dy2;
            }
            dw = dx2-dx1;
            dh = dy2-dy1;
        }

        if (sx1 == undefined) {
            sx1 = 0;
            sy1 = 0;
        }
        else if (sstep1) {
            sx1 = sourceImage.lastX + sx1;
            sy1 = sourceImage.lastY + sy1;
        }

        if (sx2 == undefined) {
            sw = sourceImage.canvas.width;
            sh = sourceImage.canvas.height;
        }
        else {
            if (sstep2) {
                sx2 = sourceImage.lastX + sx2;
                sy2 = sourceImage.lastY + sy2;
            }
            sw = sx2-sx1;
            sh = sy2-sy1;
        }

        if (sw > sourceImage.canvas.width) {
            sw = sourceImage.canvas.width;
        }
        if (sh > sourceImage.canvas.height) {
            sh = sourceImage.canvas.height;
        }

        destImage.lastX = dx1 + dw;
        destImage.lastY = dy1 + dh;
        sourceImage.lastX = sx1 + sw;
        sourceImage.lastY = sy2 + sh;

        _flushScreenCache(_images[destImageId]);
        destImage.ctx.imageSmoothingEnabled = smooth;
        destImage.ctx.drawImage(sourceImage.canvas, sx1, sy1, sw, sh, dx1, dy1, dw, dh);
    }

    function _rgb(r, g, b, a) {
        if (a == undefined) { a = 1; }
        r = parseInt(r);
        g = parseInt(g);
        b = parseInt(b);
        return {
            r: r,
            g: g,
            b: b,
            a: a,
            rgba: function() { return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")"; },
            toString: function() {
                var hexrep = ("00" + (255*a).toString(16)).slice(-2) +
                             ("00" + r.toString(16)).slice(-2) +
                             ("00" + g.toString(16)).slice(-2) +
                             ("00" + b.toString(16)).slice(-2);
                return parseInt(hexrep, 16).toString();
            }
        }
    }

    this.func__R2D = function(x) {
        _assertNumber(x);
        return x*180/Math.PI;
    };

    this.func__R2G = function(x) {
        _assertNumber(x);
        return (x*(9/10))*180/Math.PI;
    };

    this.func__Readbit = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 2);
        var mask = 1 << y;
        if ((x & mask) != 0) {
            return -1;
        } else {
            return 0;
        }
    };

    this.func__Red = function(rgb, imageHandle) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).r;
    };

    this.func__Red32 = function(rgb) {
        _assertParam(rgb);
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).r;
    };

    this.func__Resetbit = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 2);
        var mask = 1 << y;
        return x & ~mask;
    };

    this.func__Resize = function() {
        var tmp = _resize;
        _resize = false;
        return tmp ? -1 : 0;
    }

    this.func__ResizeHeight = function() {
        return _resizeHeight;
    };

    this.func__ResizeWidth = function() {
        return _resizeWidth;
    };

    this.func__RGB = function(r, g, b) {
        return this.func__RGBA(r, g, b);
    };

    this.func__RGB32 = function(r, g, b, a) {
        return this.func__RGBA(r, g, b, a);
    };

    this.func__RGBA32 = function(r, g, b, a) {
        return this.func__RGBA(r, g, b, a);
    };

    this.func__RGBA = function(r, g, b, a) {
        _assertNumber(r, 1);
        if (a == undefined) {
            a = 255;
        }
        else {
            a = parseInt(a);
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

        return _rgb(r, g, b, a);
    }

    this.func__Round = function(value) {
        _assertNumber(value);
        if (value < 0) {
            return -Math.round(-value);
        } else {
            return Math.round(value);
        }
    };

    this.func__ScreenExists = function() {
        return true;
    };

    this.sub__ScreenMove = function() {
        /* no-op: included for compatibility */
    };

    this.func__ScreenX = function() {
        return window.screenX;
    };

    this.func__ScreenY = function() {
        return window.screenY;
    };

    this.func__ScrollLock = function() {
        return  _keyDownMap._ScrollLock ? -1 : 0;
    };

    this.func__Sec = function(x) {
        _assertNumber(x);
        return 1 / Math.cos(x);
    };

    this.func__Sech = function(x) {
        _assertNumber(x);
        return 1 / Math.cosh(x);
    };

    this.func__Setbit = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 2);
        var mask = 1 << y;
        return x | mask;
    };

    this.func__Shl = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 2);
        return x << y;
    };

    this.func__Shr = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 2);
        return x >>> y;
    };

    this.func__Sinh = function(x) {
        _assertNumber(x);
        return Math.sinh(x);
    };

    this.func__Source = function() {
        return _sourceImage;
    };

    this.sub__Source = function(imageId) {
        _assertNumber(imageId);
        _sourceImage = imageId;
    };

    this.sub__SndClose = function(sid) {
        _assertNumber(sid);
        GX.soundClose(sid);
    };

    this.func__SndOpen = function(filename) {
        _assertParam(filename);
        return GX.soundLoad(filename);
    };

    this.sub__SndPlay = function(sid) {
        _assertNumber(sid);
        GX.soundPlay(sid);
    };

    this.sub__SndLoop = function(sid) {
        _assertNumber(sid);
        GX.soundRepeat(sid);
    };

    this.sub__SndPause = function(sid) {
        _assertNumber(sid);
        GX.soundPause(sid);
    };

    this.sub__SndStop = function(sid) {
        _assertNumber(sid);
        GX.soundStop(sid);
    };

    this.sub__SndVol = function(sid, v) {
        _assertNumber(sid, 1);
        _assertNumber(v, 2);
        GX.soundVolumne(sid, v);
    };

    this.func__StartDir = function() {
        return GX.vfs().fullPath(GX.vfs().rootDirectory());
    }

    this.func__Strcmp = function(x, y) {
        _assertParam(x, 1);
        _assertParam(y, 2);
        return (( x == y ) ? 0 : (( x > y ) ? 1 : -1 ));
    };

    this.func__Stricmp = function(x, y) {
        _assertParam(x, 1);
        _assertParam(y, 2);
        var a = x.toLowerCase();
        var b = y.toLowerCase();
        return (( a == b ) ? 0 : (( a > b ) ? 1 : -1 ));
    };

    this.func__Tanh = function(x) {
        _assertParam(x);
        return Math.tanh(x);
    };

    this.func__Title = function() {
        return document.title;
    };

    this.sub__Title = function(title) {
        _assertParam(title);
        document.title = title;
    };

    this.func__Trim = function(value) {
        _assertParam(value);
        return value.trim();
    };

    this.func__Togglebit = function(x, y) {
        _assertNumber(x, 1);
        _assertNumber(y, 2);
        var mask = 1 << y;
        return x ^ mask;
    };

    this.func__Width = function(imageId) {
        if (imageId == undefined) { imageId = _activeImage; }
        if (_images[imageId].charSizeMode) {
            return _width(imageId) / this.func__FontWidth();
        }
        return _width(imageId);
    };

    function _width (imageId) {
        if (imageId == undefined) { imageId = _activeImage; }
        return _images[imageId].canvas.width;
    }
    

    // QB45 Keywords
    // --------------------------------------------
    this.func_Abs = function(value) {
        _assertNumber(value);
        return Math.abs(value);
    };

    this.func_Asc = function(value, pos) {
        _assertParam(value);
        if (pos == undefined) {
            pos = 0;
        }
        else {
            _assertNumber(pos, 2);
            pos--; 
        }

        var c = String(value).charCodeAt(pos);
        var uc = _ccharMap[c];
        if (uc) { c = uc; }
        return c;
    }

    this.func_Atn = function(value) {
        _assertNumber(value);
        return Math.atan(value);
    };

    this.sub_Beep = function() {
        var oscillator = _soundCtx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.value = 780;
        oscillator.connect(_soundCtx.destination);
        oscillator.start(); 
        setTimeout(function () {
            oscillator.stop();
        }, 200);  
    };

    this.sub_ChDir = function(path) {
        _assertParam(path);
        var node = GX.vfs().getNode(path, GX.vfsCwd());
        if (node) {
            GX.vfsCwd(node);
        }
        else {
            throw new Error("Path not found: [" + path + "]");
        }
    };

    this.func_Chr = function(charCode) {
        _assertNumber(charCode);
        var uc = _ucharMap[charCode];
        if (uc) { charCode = uc; }
        return String.fromCharCode(charCode);
    };

    this.sub_Close = function(fh) {
        if (!fh) {
            for (const key in _fileHandles) {
                delete _fileHandles[key];
            }
            return;
        }
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }

        delete _fileHandles[fh];
    };

    this.sub_Cls = function(method, bgColor) {
        // method parameter is ignored, there is no separate view port for text and graphics

        var color = _bgColor;
        if (bgColor != undefined) {
            color = _color(bgColor);
        }
        
        ctx = _images[_activeImage].ctx;
        _flushScreenCache(_images[_activeImage]);
        ctx.clearRect(0, 0, _width(), _height());
        ctx.fillStyle = color.rgba();
        ctx.fillRect(0, 0, _width(), _height());

        // reset the text position
        _locX = 0;
        _lastTextX = 0;
        _locY = 0;
    };

    function _color(c) {
        if (c != undefined && c.r != undefined) {
            return c;
        }
        else if (!isNaN(c) && c >= 0 && c <= 255) {
            return _colormap[parseInt(c)];
        }
        else if (!isNaN(c) && c > 255) {
            var hexstr = QB.func_Right('00000000' + c.toString(16), 8);
            var a = hexstr.slice(0, 2);
            var r = hexstr.slice(2, 4);
            var g = hexstr.slice(4, 6);
            var b = hexstr.slice(6, 8);
            return _rgb(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), parseInt(a, 16)/255);
        }
        return _rgb(0,0,0);
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
        _assertNumber(value);
        return Math.cos(value);
    };

    this.func_Csrlin = function() {
        return _locY + 1;
    };

    this.func_Cvi = function(numString) {
        _assertParam(numString);
        var result = 0;
        numString = numString.split("").reverse().join("");
        for (let i=1;i>=0;i--) {
            result+=numString.charCodeAt(1-i)<<(8*i);
        }
        return result;
    };

    this.func_Cvl = function(numString) {
        _assertParam(numString);
        var result = 0;
        numString = numString.split("").reverse().join("");
        for (let i=3;i>=0;i--) {
            result+=numString.charCodeAt(3-i)<<(8*i);
        }
        return result;
    };

    this.func_Date = function() {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        return mm + '-' + dd + '-' + yyyy;
    };

    this.sub_Draw = function(t) {
        _assertParam(t);
        // Turn input string into array of characters.
        var u = t.toString();
        u = u.replace(/\s+/g, '');
        u = u.replace(/=/g, '');
        u = u.toUpperCase();
        u = u.split("");

        // Prime data prep loop.
        var ch;
        var elem;
        var flag;
        ch = u[0];
        if (!isNaN(String(ch) * 1)) {
            flag = 0;  // number
        } else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
            flag = 1;  // letter
        } else {
            flag = -1; // symbol
        }
        elem = ch;

        // Turn character data into tokens.
        var v = [[]];
        v.shift();
        for (var i=1; i<u.length; i++) {
            ch = u[i];
            if (!isNaN(String(ch) * 1)) {
                if (flag == 0) {
                    elem += ch;
                } else {
                    v.push([elem,flag]);
                    elem = ch;
                    flag = 0;
                }
            } else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
                v.push([elem,flag]);
                elem = ch;
                flag = 1;
            } else {
                v.push([elem,flag]);
                elem = ch;
                flag = -1;
            }
        }
        v.push([elem,flag]);

        // Draw-specific variables.
        var cursX, cursY;
        var cursX0, cursY0;
        var cursXt, cursYt;
        var ang, ux, uy, ux0, uy0, vx, vy, wx, wy, dlen;
        var sMFlag;
        var cursReturn = false;
        var cursSkipdraw = false;
        var multiplier = 1;
        var tok, tok1, tok2;
        var tmp = [[]];
        var lines = [["U",0,1],
                     ["E",Math.PI/4,Math.sqrt(2)],
                     ["R",Math.PI/2,1],
                     ["F",Math.PI*(3/4),Math.sqrt(2)],
                     ["D",Math.PI,1],
                     ["G",Math.PI*(5/4),Math.sqrt(2)],
                     ["L",Math.PI*(3/2),1],
                     ["H",Math.PI*(7/4),Math.sqrt(2)]];

        // Screen variables.
        _flushScreenCache(_images[_activeImage]);
        var screen = _images[_activeImage];
        var ctx = screen.ctx;

        cursX = screen.lastX;
        cursY = screen.lastY;

        // Main loop.
        while (v.length) {
            tok = v.shift();
            if (tok[1] == 1) { 

                if (tok[0] == "B") {
                    cursSkipdraw = true;

                } else if (tok[0] == "N") {
                    cursX0 = cursX;
                    cursY0 = cursY;
                    cursReturn = true;

                } else if (tok[0] == "C") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 0) {
                            tok1 = v.shift();
                            _strokeDrawColor = Math.floor(tok1[0]);
                        }
                    }

                } else if (tok[0] == "S") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 0) {
                            tok1 = v.shift();
                            _strokeDrawLength = tok1[0];
                        }
                    }

                } else if (tok[0] == "A") {
                    tok1 = v.shift();
                    if (tok1[1] == 0) {
                        if (tok1[0] == 1) {
                            _strokeDrawAngle = -Math.PI;
                        } else if (tok1[0] == 2) {
                            _strokeDrawAngle = -Math.PI*(3/2);
                        } else if (tok1[0] == 3) {
                            _strokeDrawAngle = 0;
                        }
                        if (_strokeDrawAngle > Math.PI*2) { _strokeDrawAngle -= Math.PI*2; }
                        if (_strokeDrawAngle < -Math.PI*2) { _strokeDrawAngle += Math.PI*2; }
                    }

                } else if (tok[0] == "T") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 1) {
                            tok1 = v.shift();
                            if (tok1[0] == "A") {
                                if (v.length) {
                                    tmp = v[0];
                                    multiplier = 1;
                                    if (tmp[1] == -1) {
                                        if (tmp[0] == "-") {
                                            multiplier = -1;
                                        } else if (tmp[0] == "+") {
                                            multiplier = 1;
                                        }
                                        tok1 = v.shift();
                                    }
                                }
                                if (v.length) {
                                    tmp = v[0];
                                    if (tmp[1] == 0) {
                                        tok2 = v.shift();
                                        _strokeDrawAngle = -(Math.PI/2) - multiplier * (tok2[0])*Math.PI/180;
                                        if (_strokeDrawAngle > Math.PI*2) { _strokeDrawAngle -= Math.PI*2; }
                                        if (_strokeDrawAngle < -Math.PI*2) { _strokeDrawAngle += Math.PI*2; }
                                    }
                                }
                            }
                        }
                    }

                } else if (tok[0] == "M") {
                    sMFlag = false;
                    multiplier = 1;
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == -1) {
                            tok1 = v.shift(); 
                            if (tok1[0] == "+") {
                                multiplier = 1;
                                sMFlag = true;
                            } else if (tok1[0] == "-") {
                                multiplier = -1;
                                sMFlag = true;
                            }
                            if (v.length) {
                                tmp = v[0];
                                if (tmp[1] == 0) {
                                    tok2 = v.shift();
                                    ux = multiplier * (tok2[0]);
                                }
                            }
                        } else if (tmp[1] == 0) {
                            tok1 = v.shift();
                            ux = multiplier * (tok1[0]);
                        }
                        if (sMFlag == true) {
                            ux0 = cursX;
                            uy0 = cursY;
                        } else {
                            ux0 = 0.0;
                            uy0 = 0.0;
                        }
                    }
                    multiplier = 1;
                    if (v.length) {
                        tmp = v[0];
                        if ((tmp[1] == -1) && (tmp[0] == ",")) {
                            tmp = v.shift();
                            if (v.length) {
                                tmp = v[0];
                                if (tmp[1] == -1) {
                                    tok1 = v.shift(); 
                                    if (tok1[0] == "+") {
                                        multiplier = 1;
                                    } else if (tok1[0] == "-") {
                                        multiplier = -1;
                                    }
                                    if (v.length) {
                                        tmp = v[0];
                                        if (tmp[1] == 0) {
                                            tok2 = v.shift();
                                            uy = multiplier * (tok2[0]);
                                        }
                                    }
                                } else if (tmp[1] == 0) {
                                    tok1 = v.shift();
                                    uy = multiplier * (tok1[0]);
                                }

                                if (sMFlag == true) {
                                    ang = (_strokeDrawAngle + Math.PI/2);
                                    vx = ux * Math.cos(ang) - uy * Math.sin(ang);
                                    vy = ux * Math.sin(ang) + uy * Math.cos(ang);
                                    vx *= (_strokeDrawLength/4);
                                    vy *= (_strokeDrawLength/4);
                                } else {
                                    vx = ux;
                                    vy = uy;
                                }
                                wx = vx;
                                wy = vy;
                            }
                        }
                        cursXt = ux0 + wx;
                        cursYt = uy0 + wy;
                        if (cursSkipdraw == false) {
                            ctx.lineWidth = _strokeLineThickness;
                            ctx.strokeStyle = _color(_strokeDrawColor).rgba();
                            ctx.beginPath();
                            ctx.moveTo(cursX, cursY);
                            ctx.lineTo(cursXt, cursYt);
                            ctx.stroke();
                        } else {
                            cursSkipdraw = false;
                        }
                        cursX = cursXt;
                        cursY = cursYt;
                    }

                } else if (tok[0] == "P") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 0) {
                            tok1 = v.shift();
                            tok2 = tok1;
                            if (v.length) {
                                tmp = v[0];
                                if ((tmp[1] == -1) && (tmp[0] == ",")) {
                                    tmp = v.shift();
                                    if (v.length) {
                                        tmp = v[0];
                                        if (tmp[1] == 0) {
                                            tok2 = v.shift();
                                        }
                                    }
                                }
                            }
                            this.sub_Paint(undefined, cursX, cursY, _color(Math.floor(tok1[0])), _color(Math.floor(tok2[0])));
                        }
                    }

                } else { 
                    for (i=0 ; i<lines.length ; i++) {
                        if (tok[0] == lines[i][0]) {
                            if (v.length) {
                                tmp = v[0];
                                if (tmp[1] == 0) {
                                    tok1 = v.shift();
                                    dlen = (tok1[0]) * (_strokeDrawLength/4) * (lines[i][2]);
                                } else {
                                    dlen = (_strokeDrawLength/4) * (lines[i][2]);
                                }
                            }
                            ux = dlen * Math.cos(_strokeDrawAngle + lines[i][1]);
                            uy = dlen * Math.sin(_strokeDrawAngle + lines[i][1]);
                            cursXt = (cursX)*1.0 + ux;
                            cursYt = (cursY)*1.0 + uy;
                            if (cursSkipdraw == false) {
                                ctx.lineWidth = _strokeLineThickness;
                                ctx.strokeStyle = _color(_strokeDrawColor).rgba();
                                ctx.beginPath();
                                ctx.moveTo(cursX, cursY);
                                ctx.lineTo(cursXt, cursYt);
                                ctx.stroke();
                            } else {
                                cursSkipdraw = false;
                            }
                            cursX = cursXt;
                            cursY = cursYt;
                        }
                    }
                }     
            }
            if (cursReturn == true) {
                cursX = cursX0;
                cursY = cursY0;
                cursReturn = false;
            } 
        }
        screen.lastX = cursX;
        screen.lastY = cursY;
    };

    this.func_Environ = function(param) {
        /* no-op: included for compatibility */
        return "";
    };

    this.sub_Environ = function(value) {
        /* no-op: included for compatibility */
    };

    this.sub_Error = function(errorNumber) {
        _assertNumber(errorNumber);
        throw new Error("Unhandled Error #" + errorNumber);
    };

    this.func_Exp = function(value) {
        _assertNumber(value);
        return Math.exp(value);
    };

    this.func_Fix = function(value) {
        _assertNumber(value);
        if (value >=0) {
            return Math.floor(value);
        }
        else {
            return Math.floor(Math.abs(value)) * -1;
        }
    };

    function _textColumns() {
        if (!_font.monospace) {
            return Math.floor(_width() / QB.func__FontWidth(8));    
        }
        return Math.floor(_width() / QB.func__FontWidth());
    }

    function _textRows() {
        return Math.floor(_height() / QB.func__FontHeight());
    }

    this.func_Hex = function(n) {
        _assertNumber(n);
        return n.toString(16).toUpperCase();
    };

    this.func_EOF = function(fh) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }

        return (_fileHandles[fh].offset >= _fileHandles[fh].file.data.byteLength) ? -1 : 0;
    };

    this.func_LOF = function(fh) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }

        return _fileHandles[fh].file.data.byteLength;
    };


    function blinkCursor() {
        if (_inputMode == true) {
            _inputTimeout = true;
            toggleCursor();
            setTimeout(blinkCursor, 400);
        }
        else {
            _inputTimeout = false;
        }
    }

    function toggleCursor(off) {
        if (!off || off != _inputCursor) {
            var ctx = _images[_activeImage].ctx;
            ctx.globalCompositeOperation="difference";
            ctx.fillStyle = "white";
            var w = QB.func__FontWidth();
            if (w < 1) {
                var tm = ctx.measureText("A");
                w = tm.width;
            }
            ctx.fillRect(_lastTextX, (_locY + 1) * QB.func__FontHeight() - 2, w, 2);
            ctx.globalCompositeOperation = "source-over";
            _inputCursor = !_inputCursor;
        }
    }

    this.sub_Input = async function(values, preventNewline, addQuestionPrompt, prompt) {
        _lastKey = null;
        var str = "";
        _inputMode = true;

        _flushScreenCache(_images[_activeImage]);

        if (prompt != undefined) {
            await QB.sub_Print([prompt, QB.PREVENT_NEWLINE]);
        }
        if (prompt == undefined || addQuestionPrompt) {
            await QB.sub_Print(["? ", QB.PREVENT_NEWLINE]);
        }

        if (!preventNewline && _locY > _textRows()-1) {
            await _printScroll();
            _locY = _textRows()-1;
        }

        if (!_inputTimeout) {
            setTimeout(blinkCursor, 400);
        }

        var ctx = _images[_activeImage].ctx;
        var copy = document.createElement("canvas");
        copy.width = _images[_activeImage].canvas.width;
        copy.height = _images[_activeImage].canvas.height;
        var copyCtx = copy.getContext("2d");
        copyCtx.drawImage(_images[_activeImage].canvas, 0, 0);

        var beginTextX = _lastTextX;
        while (_lastKey != "Enter" && _inputMode) {

            if (_lastKey == "Backspace" && str.length > 0) {
                toggleCursor(true);
                _locX--;
                
                var tm = ctx.measureText(str);
                str = str.substring(0, str.length-1);
                var tm = ctx.measureText(str);
                _lastTextX = beginTextX + tm.width;
                ctx.clearRect(0, 0, copy.width, copy.height);
                ctx.drawImage(copy, 0, 0);
                QB.sub__PrintString(beginTextX, _locY * QB.func__FontHeight(), str);
            }

            else if (_lastKey && _lastKey.length < 2) {
                toggleCursor(true);
                str += _lastKey;
                var tm = ctx.measureText(str);
                ctx.clearRect(0, 0, copy.width, copy.height);
                ctx.drawImage(copy, 0, 0);
                QB.sub__PrintString(beginTextX, _locY * QB.func__FontHeight(), str);
                _locX++;
                _lastTextX = beginTextX + tm.width;
            }

            _lastKey = null;
            await GX.sleep(5);
        }
        if (!_inputMode) { return; }

        _inputMode = false;
        toggleCursor(true);

        if (!preventNewline) {
            _locX = 0;
            _lastTextX = 0;
            if (_locY < _textRows()-1) {
                _locY = _locY + 1;
            }
            else {
                await _printScroll();
            }
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
    }

    this.sub_InputFromFile = async function(fh, returnValues) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }
        if (_fileHandles[fh].mode != QB.INPUT) {
            throw new Error("Bad file mode");
        }

        fh = _fileHandles[fh];
        var text = GX.vfs().readLine(fh.file, fh.offset);
        fh.offset += text.length + 1;
        var values = text.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        for (var i=0; i < returnValues.length; i++) {
            if (i < values.length) {
                var v = values[i];
                // remove surrounding double quotes from string values
                if (v.startsWith('"') && v.endsWith('"')) {
                    v = v.substring(1, v.length-1);
                }
                returnValues[i] = v;
            }
        }
    };

    this.func_InKey = function() {
        if (_inkeyBuffer.length < 1) {
            return "";
        }
        return _inkeyBuffer.shift();
    }

    this.func_InStr = function(arg1, arg2, arg3) {
        _assertParam(arg1, 1);
        _assertParam(arg2, 2);
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
        _assertNumber(value);
        return Math.floor(value);
    };

    this.func_LCase = function(value) {
        _assertParam(value);
        return String(value).toLowerCase();
    };

    this.func_Left = function(value, n) {
        _assertParam(value, 1);
        _assertNumber(n, 2);
        return String(value).substring(0, n);
    };

    this.func_Len = function(value) {
        _assertParam(value);
        return String(value).length;
    };

    this.func_Loc = function(fh) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }

        return _fileHandles[fh].offset;
    };

    this.func_Log = function(value) {
        _assertNumber(value);
        return Math.log(value);
    };

    this.func_Cdbl = function(value) {
        _assertNumber(value);
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        view.setFloat32(1, value);
        return view.getFloat32(1);
    };

    this.func_Cint = function(value) {
        _assertNumber(value);
        if (value > 0) {
            return Math.round(value);
        } else {
            return -Math.round(-value);
        }
    };

    this.func_Clng = function(value) {
        _assertNumber(value);
        if (value > 0) {
            return Math.round(value);
        } else {
            return -Math.round(-value);
        }
    };

    this.func_Csng = function(value) {
        return value; // TODO: Implement this.
    };

    this.sub_Circle = function(step, x, y, radius, color, startAngle, endAngle, aspect) {

        var screen = _images[_activeImage];
        var ctx = screen.ctx;
        _flushScreenCache(screen);

        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }

        if (startAngle == undefined) { startAngle = 0; }
        if (endAngle == undefined) { endAngle = 2 * Math.PI; }

        if (step) {
            if (_windowAspect[0] != false) {
                screen.lastX = windowUnContendX(screen.lastX, screen.canvas.width);
                screen.lastY = windowUnContendY(screen.lastY, screen.canvas.height);
            }
            x = screen.lastX + x;
            y = screen.lastY + y;
        } 

        if (_windowAspect[0] != false) {
            x = windowContendX(x, screen.canvas.width);
            y = windowContendY(y, screen.canvas.height);
            radius *= _windowAspect[0] / Math.abs(_windowAspect[2]);
        }
        
        screen.lastX = x;
        screen.lastY = y;

        ctx.lineWidth = _strokeLineThickness;
        ctx.lineWidth += Math.tanh(8*radius*_screenDiagInv); // Adds some radius to compensate for antialiasing. The prefactor 8 is arbitrary. //
        ctx.strokeStyle = color.rgba();
        ctx.beginPath();
        if (aspect == undefined) {
            ctx.arc(x, y, radius, -endAngle, -startAngle);
        } else {
            if (aspect < 1) {
                ctx.ellipse(x, y, radius, radius * aspect, 0, -endAngle, -startAngle); 
            } else {
                ctx.ellipse(x, y, radius / aspect, radius, 0, -endAngle, -startAngle); 
            }
        }
        ctx.stroke();
        _strokeDrawColor = _color(color);
    };

    this.sub_Files = function(path) {
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
        var childNodes = null;
        if (path == undefined) {
            childNodes = vfs.getChildren(vfsCwd);
        }
        else {
            var parent = vfs.getNode(path, vfsCwd);
            childNodes = vfs.getChildren(parent);
        }
        for (var i=0; i < childNodes.length; i++) {
            this.sub_Print(childNodes[i].name + ((childNodes[i].type == vfs.DIRECTORY) ? " <DIR>" : ""));
        }
    };

    this.sub_Line = function(sstep, sx, sy, estep, ex, ey, color, style, pattern) {
        var screen = _images[_activeImage];
        _flushScreenCache(_images[_activeImage]);

        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }
        
        if (sstep) {
            if (_windowAspect[0] != false) {
                screen.lastX = windowUnContendX(screen.lastX, screen.canvas.width);
                screen.lastY = windowUnContendY(screen.lastY, screen.canvas.height);
            }
            sx = screen.lastX + sx;
            sy = screen.lastY + sy;
        } 

        if (sx == undefined) {
            if (_windowAspect[0] != false) {
                screen.lastX = windowUnContendX(screen.lastX, screen.canvas.width);
                screen.lastY = windowUnContendY(screen.lastY, screen.canvas.height);
            }
            sx = screen.lastX;
            sy = screen.lastY;
        }
        screen.lastX = sx;
        screen.lastY = sy;

        if (estep) {
            ex = screen.lastX + ex;
            ey = screen.lastY + ey;
        } 

        if (_windowAspect[0] != false) {
            ex = windowContendX(ex, screen.canvas.width);
            sx = windowContendX(sx, screen.canvas.width);
            ey = windowContendY(ey, screen.canvas.height);
            sy = windowContendY(sy, screen.canvas.height);
        }

        screen.lastX = ex;
        screen.lastY = ey;

        if (pattern != undefined) { 
            if (typeof pattern == "number") {
                var value = pattern;
            }
        }

        var ctx = screen.ctx; 
        ctx.lineWidth = _strokeLineThickness;
        if (pattern == undefined || pattern == "BF") {
            
            var width = ex-sx;
            var height = ey-sy;
            if (width < 0) { width--; } else { width++; }
            if (height < 0) { height--; } else { height++; }

            if (style == "B") {
                ctx.strokeStyle = color.rgba();
                ctx.strokeRect(sx, sy, width, height);
            } 
            else if (style == "BF") {
                ctx.fillStyle = color.rgba();
                ctx.fillRect(sx, sy, width, height);
            } 
            else {
                ctx.strokeStyle = color.rgba();
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
        } else { // Stylized line.
            ctx.fillStyle = color.rgba();
            if (style == "B") {
                lineStyle(sx, sy, ex, sy, value);
                lineStyle(ex, sy, ex, ey, value);
                lineStyle(ex, ey, sx, ey, value);
                lineStyle(sx, ey, sx, sy, value);
            } else {
                lineStyle(sx, sy, ex, ey, value);
            }
        }

        _strokeDrawColor = _color(color);
    };

    function bitTreadLeft(num, cnt) { // Bitwise treadmill left.
        var val = (num << cnt) | (num >>> (32 - cnt));
        return (val | (~~bitTest(num, 15))<<0);
    }

    function bitTest(num, bit) { // Returns true or false.
        return ((num>>bit) % 2 != 0)
    }

    function lineStyle(x1, y1, x2, y2, sty) {
        var screen = _images[_activeImage];
        var ctx = screen.ctx;
        var lx = Math.abs(x2 - x1);
        var ly = Math.abs(y2 - y1);
        var xtmp = x1;
        var ytmp = y1;
        var ptn = sty;
        var slope;
        var mi;
        if (lx >= ly) {
            var y1f = y1;
            if (lx) { slope = (y1 - y2) / lx; }
            if (x1 < x2) { mi = 1; } else { mi = -1; }
            lx += 1;
            while (lx -= 1) {
                if (y1f < 0) {ytmp = y1f - 0.5; } else { ytmp = y1f + 0.5; }
                ptn = bitTreadLeft(ptn, 1);
                if (bitTest(ptn, 0) == true) { ctx.fillRect(xtmp, ytmp, 1, 1); }
                xtmp += mi;
                y1f -= slope;
            }
        } else {
            var x1f = x1;
            if (ly) { slope = (x1 - x2) / ly; }
            if (y1 < y2) { mi = 1; } else { mi = -1; }
            ly += 1;
            while (ly -= 1) {
                if (x1f < 0) {xtmp = x1f - 0.5; } else { xtmp = x1f + 0.5; }
                ptn = bitTreadLeft(ptn, 1);
                if (bitTest(ptn, 0) == true) { ctx.fillRect(xtmp, ytmp, 1, 1); }
                ytmp += mi;
                x1f += slope;
            }
        }
        return 0;
    }

    this.sub_LineInput = async function(values, preventNewline, addQuestionPrompt, prompt) {
        await QB.sub_Input(values, preventNewline, addQuestionPrompt, prompt);
    }

    this.sub_LineInputFromFile = async function(fh, returnValues) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }
        if (_fileHandles[fh].mode == QB.RANDOM) {
            throw new Error("Bad file mode");
        }

        fh = _fileHandles[fh];
        var text = GX.vfs().readLine(fh.file, fh.offset);
        fh.offset += text.length + 1;
        returnValues[0] = text;
    };

    this.sub_Locate = function(row, col) {
        // TODO: implement cursor positioning/display parameters
        if (row == undefined) { row = 1; } else { _assertNumber(row); row = parseInt(row); }
        if (col == undefined) { col = 1; } else { _assertNumber(col); col = parseInt(col); }
        if (row && row > 0 && row <= _textRows()) {
            _locY = row-1;
        }
        if (col && col > 0 && col <= _textColumns()) {
            _locX = col-1;
            _lastTextX = _locX * QB.func__FontWidth();
        }
    };

    this.func_LTrim = function(value) {
        _assertParam(value);
        return String(value).trimStart();
    };

    this.sub_Kill = function(path) {
        _assertParam(path);
        GX.vfs().removeFile(path, GX.vfsCwd());
    };

    this.func_Mid = function(value, n, len) {
        _assertParam(value, 1);
        _assertNumber(n, 2);
        if (len == undefined) {
            return String(value).substring(n-1);
        }
        else {
            return String(value).substring(n-1, n+len-1);
        }
    };

    this.sub_MkDir = function(path) {
        _assertParam(path);
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
        var parent = vfs.getParentPath(path);
        var filename = vfs.getFileName(path);
        var parentNode = vfs.getNode(parent, vfsCwd);
        if (!parentNode) { parentNode = vfsCwd; }
        vfs.createDirectory(filename, parentNode);
    }

    this.func_Mki = function(num) {
        _assertNumber(num);
        var ascii = "";
        for (var i=1; i >= 0; i--) {
            ascii += String.fromCharCode((num>>(8*i))&255);
        }
        return ascii.split("").reverse().join("");
    };

    this.func_Mkl = function(num) {
        _assertNumber(num);
        var ascii = "";
        for (var i=3; i >= 0; i--) {
            ascii += String.fromCharCode((num>>(8*i))&255);
        }
        return ascii.split("").reverse().join("");
    };

    this.sub_Name = function(oldName, newName) {
        _assertParam(oldName, 1);
        _assertParam(newName, 2);
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
        var node = vfs.getNode(oldName, vfsCwd);
        vfs.renameNode(node, newName);
    };

    this.func_Oct = function(n) {
        _assertNumber(n);
        return n.toString(8).toUpperCase();
    };

    this.sub_Open = async function(path, mode, handle) {
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
       if (mode == QB.OUTPUT || mode == QB.APPEND || mode == QB.BINARY) {
            var parent = vfs.getParentPath(path);
            var filename = vfs.getFileName(path);
            var parentNode = vfs.getNode(parent, vfsCwd);
            if (!parentNode) { parentNode = vfsCwd; }
            var file = null;
            if (mode == QB.APPEND || mode == QB.BINARY) {
                file = vfs.getNode(path, vfsCwd);
            }
            if (!file) {
                if (mode == QB.APPEND || mode == QB.BINARY) {
                    file = await _downloadFile(path);
                }
                if (!file) {
                    file = vfs.createFile(filename, parentNode);
                }
            }
            else if (file.type != vfs.FILE) {
                // make sure this is not a directory
                throw new Error("Path is not a file.");
            }
            _fileHandles[handle] = { file: file, mode: mode, offset: 0 };
        }
        else if (mode == QB.INPUT) {
            var file = vfs.getNode(path, vfsCwd);
            if (!file) {
                // attempt to copy the path to the local filesystem
                var file = await _downloadFile(path);
                if (!file) {
                    throw new Error("File not found");
                }
            }
            else if (file.type != vfs.FILE) {
                throw new Error("Path is not a file.");
            }
            _fileHandles[handle] = { file: file, mode: mode, offset: 0 };
        }
        else {
            throw new Error("Unsupported Open Method");
        }

    };

    async function _downloadFile(path) {
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
        try {
            var res = await fetch(path);
            if (res.ok) {
                var filename = vfs.getFileName(path);
                var parentPath = vfs.getParentPath(path);

                var parentNode = vfs.rootDirectory();
                var dirs = parentPath.split("/");
                for (var i=0; i < dirs.length; i++) {
                    if (dirs[i] == "") { continue; }
                    var node = vfs.getNode(dirs[i], parentNode);
                    if (!node) { node = vfs.createDirectory(dirs[i], parentNode); }
                    parentNode = node;
                }
            
                var file = vfs.createFile(filename, parentNode);
                vfs.writeData(file, await res.arrayBuffer());
                return file;
            }
            else {
                return null;
            }
        }
        catch (err) {
            return null;
        }
    }

    this.sub_Paint = function(sstep, startX, startY, fillColor, borderColor) {
        // See: http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
        // TODO: this method should probably utilize the same screen cache as PSet
        _flushScreenCache(_images[_activeImage]);
        var screen = _images[_activeImage];
        var ctx = screen.ctx;
        var data = ctx.getImageData(0, 0, screen.canvas.width, screen.canvas.height).data;

        var x0 = startX;
        var y0 = startY;

        if (sstep) {
            x0 = screen.lastX + x0;
            y0 = screen.lastY + y0;
        }
        
        fillColor = _color(fillColor);
        if (borderColor == undefined) {
            borderColor = fillColor;
        }
        else {
            borderColor = _color(borderColor);
        }

        var pixelStack = [[Math.floor(x0), Math.floor(y0)]];

        while (pixelStack.length) {
            var newPos, x, y, pixelIndex, flagLeft, flagRight;
            newPos = pixelStack.pop();
            x = newPos[0];
            y = newPos[1];
            pixelIndex = (y * screen.canvas.width + x) * 4;

            while ((y-- >= 0) && checkPixel(data, pixelIndex, fillColor, borderColor)) {
                pixelIndex -= screen.canvas.width * 4;
            }
            pixelIndex += screen.canvas.width * 4;
            ++y;

            flagLeft = false;
            flagRight = false;
            while ((y++ < screen.canvas.height - 1) && checkPixel(data, pixelIndex, fillColor, borderColor)) {
                ctx.fillStyle = fillColor.rgba();
                ctx.fillRect(x, y, 1, 1);
                data[pixelIndex] = fillColor.r;
                data[pixelIndex+1] = fillColor.g;
                data[pixelIndex+2] = fillColor.b;
                data[pixelIndex+3] = fillColor.a;
                if (x > 0) {
                    if (checkPixel(data, pixelIndex - 4, fillColor, borderColor)) {
                        if (!flagLeft) {
                            pixelStack.push([x - 1, y]);
                            flagLeft = true;
                        }
                    } else if (flagLeft) {
                        flagLeft = false;
                    }
                }
                if (x < screen.canvas.width - 1) {
                    if (checkPixel(data, pixelIndex + 4, fillColor, borderColor)) {
                        if (!flagRight) {
                            pixelStack.push([x + 1, y]);
                            flagRight = true;
                        }
                    } else if (flagRight) {
                        flagRight = false;
                    }
                }
                pixelIndex += screen.canvas.width * 4;
            }
        }
    };

    function checkPixel(dat, p, c1, c2) {
        var r = dat[p];
        var g = dat[p+1];
        var b = dat[p+2];
        //var a = dat[p+3]; // 0 < a < 255
        var thresh = 16; // usually 2
        if ((Math.abs(r - c1.r) < thresh) && (Math.abs(g - c1.g) < thresh) && (Math.abs(b - c1.b) < thresh)) { return false; }
        if ((Math.abs(r - c2.r) < thresh) && (Math.abs(g - c2.g) < thresh) && (Math.abs(b - c2.b) < thresh)) { return false; }
        return true;
    }

    this.sub_Play = async function(cmdstr) {
        await _player.play(cmdstr);
    };

    this.func_Point = function(x, y) {
        var screen = _images[_sourceImage];
        var ret = 0;
        if (y == undefined) {
            if (x == 0) {
                ret = screen.lastX;
            } else if (x == 1) {
                ret = screen.lastY;           
            } else if (x == 2) {
                if (_windowAspect[0] != false) {
                    ret = windowUnContendX(screen.lastX, screen.canvas.width);
                } else {
                    ret = screen.lastX;
                }
            } else if (x == 3) {
                if (_windowAspect[0] != false) {
                    ret = windowUnContendY(screen.lastY, screen.canvas.height);
                } else {
                    ret = screen.lastY;
                }
            }
        } else {
            if (!screen.cached) { 
                var ctx = screen.ctx;
                screen.imgdata = ctx.getImageData(0, 0, screen.canvas.width, screen.canvas.height);
                screen.cached = true;
            }
            var pixelIndex = (y * screen.canvas.width + x) * 4;
            ret = _rgb(screen.imgdata.data[pixelIndex], 
                       screen.imgdata.data[pixelIndex + 1], 
                       screen.imgdata.data[pixelIndex + 2], 
                       screen.imgdata.data[pixelIndex + 3]);
        }
        return ret;
    };

    this.func_Pos = function() {
        return _locX + 1;
    };

    this.sub_PReset = function(sstep, x, y, color) {
        var screen = _images[_activeImage];
        if (color == undefined) {
            color = _bgColor;
        }
        else {
            color = _color(color);
        }

        if (sstep) {
            if (_windowAspect[0] != false) {
                screen.lastX = windowUnContendX(screen.lastX, screen.canvas.width);
                screen.lastY = windowUnContendY(screen.lastY, screen.canvas.height);
            }
            x = screen.lastX + x;
            y = screen.lastY + y;
        } 

        if (_windowAspect[0] != false) {
            x = windowContendX(x, screen.canvas.width);
            y = windowContendY(y, screen.canvas.height);
        }
        
        screen.lastX = x;
        screen.lastY = y;

        _strokeDrawColor = _color(color);
    };

    this.sub_PrintToFile = function(fh, args) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }
        if (_fileHandles[fh].mode != QB.OUTPUT && _fileHandles[fh].mode != QB.APPEND) {
            throw new Error("Bad file mode");
        }
        var locX = 0;
        var file = _fileHandles[fh].file;
        if (!file) { 
            throw new Error("Invalid file handle");
        }

        // Print called with no arguments
        if (args == undefined || args == null || args.length < 1) {
            args = [""];
        }

        var preventNewline = (args[args.length-1] == QB.PREVENT_NEWLINE || args[args.length-1] == QB.COLUMN_ADVANCE);

        for (var ai = 0; ai < args.length; ai++) {
            if (args[ai] == QB.PREVENT_NEWLINE) {
                // ignore as we will just concatenate the next arg
            }
            else if (args[ai] == QB.COLUMN_ADVANCE) {
                // advance to the next column offset
                var chars = 14 - locX % 13;
                var padStr = "";
                padStr = padStr.padStart(chars, " ");
                GX.vfs().writeText(file, padStr);
                locX += chars;
            }
            else {
                locX = args[ai].length;
                GX.vfs().writeText(file, args[ai]);
            }
        }

        if (!preventNewline) {
            GX.vfs().writeText(file, "\r\n");
        }
    };

    this.sub_Print = async function(args) {
        var screen = _images[_activeImage];

        // Print called with no arguments
        if (args == undefined || args == null || args.length < 1) {
            args = [""];
        }

        _flushScreenCache(_images[_activeImage]);

        var ctx = _images[_activeImage].ctx;
        var preventNewline = (args[args.length-1] == QB.PREVENT_NEWLINE || args[args.length-1] == QB.COLUMN_ADVANCE);

        var x = _lastTextX;
        for (var ai = 0; ai < args.length; ai++) {
            if (args[ai] == QB.PREVENT_NEWLINE) {
                // ignore as we will just concatenate the next arg
            }
            else if (args[ai] == QB.COLUMN_ADVANCE) {
                // advance to the next column offset
                _locX += 14 - _locX % 14;
                x = _locX * QB.func__FontWidth(8);
            }
            else {
                var str = args[ai];
                // non-negative numbers are prefixed with a space
                if (typeof str != "string" && !isNaN(str)) {
                    if (str >= 0) {
                        str = " " + str;
                    }
                    str = str + " "; //a space is added to the end numbers when printing
                }
                var lines = String(str).split("\n");
                for (var i=0; i < lines.length; i++) {
                    var f = _fonts[_font];
                    ctx.font = f.size + " " + f.name;

                    var sublines = _fitLines(x, lines[i], ctx);

                    for (var j=0; j < sublines.length; j++) {
                        var subline = sublines[j];

                        if (j > 0) {
                            if (_locY < _textRows()-2) {
                                _locY++;
                                _locX = 0;
                                x = 0;
                            }
                            else {
                                _locY--;
                                await _printScroll();
                            }
                        }
                        var y =  _locY * QB.func__FontHeight();

                        // Draw the text background
                        var tm = ctx.measureText(subline);
                        if (_printMode != QB._KEEPBACKGROUND) {
                            ctx.fillStyle = _bgColor.rgba();
                            ctx.fillRect(x, y, tm.width, QB.func__FontHeight());
                        }
                        if (_printMode != QB._ONLYBACKGROUND) {
                            ctx.fillStyle = _fgColor.rgba();
                            ctx.fillText(subline, x, (y + QB.func__FontHeight() - f.offset));
                            _setScreenText(subline);
                        }
                        x += tm.width;

                        _locX += subline.length;
                    }

                    if (i < lines.length-1) {
                        if (_locY < _textRows()-1) {
                            _locY++;
                            _locX = 0;
                            x = 0;
                        }
                        else {
                            await _printScroll();
                        }
                    }
                }
            }
        }

        _lastTextX = x;

        if (!preventNewline) {
            _locX = 0;
            _lastTextX = 0;
            if (_locY < _textRows()-1) {
                _locY = _locY + 1;
            }
            else {
                await _printScroll();
            }
        }
    };

    function _fitLines(startX, line, ctx) {
        // TODO: could be optimized for fixed width fonts which would not require measureText
        var lines = [];
        var tm = ctx.measureText(line);
        if (tm.width < QB.func__Width() - startX) {
            lines.push(line);
            return lines;
        }

        var start = 0; end = 1;
        for (var i=0; i < line.length; i++) {
            var s = line.substring(start, end);
            tm = ctx.measureText(s);
            if (tm.width > QB.func__Width() - startX) {
                lines.push(line.substring(start, end-1));
                start = end - 1;
                startX = 0;
            }
            else {
                end++;
            }
        }
        lines.push(line.substring(start));
        return lines;
    }

    async function _printScroll() {
        var ctx = _images[_activeImage].ctx;
        ctx.globalCompositeOperation = "copy";
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(ctx.canvas, 0, -QB.func__FontHeight(), ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = "source-over";
        _scrollScreenText();
    }

    this.sub_PSet = function(sstep, x, y, color) {
        var screen = _images[_activeImage];
        
        x = Math.round(x);
        y = Math.round(y);

        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }

        if (sstep) {
            if (_windowAspect[0] != false) {
                screen.lastX = windowUnContendX(screen.lastX, screen.canvas.width);
                screen.lastY = windowUnContendY(screen.lastY, screen.canvas.height);
            }
            x = screen.lastX + x;
            y = screen.lastY + y;
        } 

        if (_windowAspect[0] != false) {
            x = windowContendX(x, screen.canvas.width);
            y = windowContendY(y, screen.canvas.height);
        }

        screen.lastX = x;
        screen.lastY = y;

        if (!screen.cached) {
        var ctx = screen.ctx;
        screen.imgdata = ctx.getImageData(0, 0, screen.canvas.width, screen.canvas.height);
        screen.cached = true;
        }
        var pixelIndex = (y * screen.canvas.width + x) * 4;
        screen.imgdata.data[pixelIndex] = color.r;
        screen.imgdata.data[pixelIndex + 1] = color.g;
        screen.imgdata.data[pixelIndex + 2] = color.b;
        screen.imgdata.data[pixelIndex + 3] = color.a * 255;

        _strokeDrawColor = _color(color);
    };

    function _flushScreenCache(screen) {
        if (screen.cached) {
            var ctx = screen.ctx;
            ctx.putImageData(screen.imgdata, 0, 0);
            screen.imgdata = undefined;
            screen.cached = false;
        }
    }

    function _flushAllScreenCache() {
        // TODO: this is brute force - fix it
        for (var i=0; i < _nextImageId; i++) {
            if (_images[i]) {
                _flushScreenCache(_images[i]);
            }
        }
    }

    this.sub_Get = function(fhi, position, type, valueObj) {
        if (!_fileHandles[fhi]) {
            throw new Error("Invalid file handle");
        }
        var fh = _fileHandles[fhi];

        if (fh.mode != QB.BINARY && fh.mode != QB.RANDOM) {
            throw new Error("Bad file mode");
        }

        if (position == undefined) {
            position = fh.offset;
        }
        else if (position > 0) {
            position--;
        }

        var value = valueObj.value;
        if (value._dimensions) {
            // this is an array
            var idx = [];
            for (var di=0; di < value._dimensions.length; di++) {
                var d = value._dimensions[di];
                idx.push({l: d.l, u: d.u, i: d.l});
            }

            var done = false;
            while (!done && !QB.func_EOF(fhi)) {
                var ai = [];
                for (var i=0; i < idx.length; i++) {
                    ai.push(idx[i].i);
                }

                QB.arrayValue(value, ai).value = _readDataElement(fh, position, type);
                position = fh.offset;

                // increment the indexes
                var cidx = 0;
                var incNext = true;
                while (cidx < idx.length) { 
                    if (incNext) {
                        idx[cidx].i++;
                        if (idx[cidx].i > idx[cidx].u) {
                            idx[cidx].i = idx[cidx].l;
                            incNext = true;
                        }
                        else {
                            incNext = false;
                        }
                    }
                    cidx++;
                }
                if (incNext) {
                    done = true;
                }
            }

            return;
        }
        else {
            if (type == "STRING") {
                var bytestoread = String(value).length;
            } else {
                var bytestoread = 0;
            }
            valueObj.value = _readDataElement(fh, position, type, bytestoread);
        }
    };

    function _readDataElement(fh, position, type, bytestoread) {
        var vfs = GX.vfs();
        var data = null;
        if (type == "SINGLE") {
            data = vfs.readData(fh.file, position, 4);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getFloat32(0, true);
        }
        else if (type == "DOUBLE") { 
            data = vfs.readData(fh.file, position, 8);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getFloat64(0, true);
        }
        else if (type == "_BYTE") { 
            data = vfs.readData(fh.file, position, 1);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getInt8(0, true);
        }
        else if (type == "_UNSIGNED _BYTE") {
            data = vfs.readData(fh.file, position, 1);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getUint8(0, true);
        }
        else if (type == "INTEGER") { 
            data = vfs.readData(fh.file, position, 2);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getInt16(0, true);
        }
        else if (type == "_UNSIGNED INTEGER") {
            data = vfs.readData(fh.file, position, 2);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getUint16(0, true);
        }
        else if (type == "LONG") {
            data = vfs.readData(fh.file, position, 4);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getInt32(0, true);
        }
        else if (type == "_UNSIGNED LONG") {
            data = vfs.readData(fh.file, position, 4);
            fh.offset = position + data.byteLength;
            return (new DataView(data)).getUint32(0, true);
        }
        else if (type == "STRING") {
            if (bytestoread > 0) {
                data = vfs.readData(fh.file, position, bytestoread);
                fh.offset = position + data.byteLength;
                return String.fromCharCode.apply(null, new Uint8Array(data));
            }
            return '';
        }
        else if (type == "_BIT" || type == "_UNSIGNED _BIT") {
            // mimicking QB64 error message here
            throw new Error("Variable/element cannot be BIT aligned on current line");
        }
        else if (type == "_INTEGER64" || type == "_UNSIGNED _INTEGER64" ||
                 type == "_OFFSET" || type == "_UNSIGNED _OFFSET" ||
                 type == "_MEM") {
            throw new Error("Unsupported data type for operation: " + type);
        }
        else {
            // handle custom type
            var tvars = _typeMap[type];
            if (tvars == undefined) {
                throw new Error("Unknown type: " + type);
            }

            var resObj = {};
            for (var i=0; i < tvars.length; i++) {
                var tname = tvars[i].name;
                var ttype = tvars[i].type;
                resObj[tname] = _readDataElement(fh, position, ttype);
                position = fh.offset;
            }
            return resObj;
        }
    }

    this.sub_Put = function(fhi, position, type, value) {
        if (!_fileHandles[fhi]) {
            throw new Error("Invalid file handle");
        }
        var fh = _fileHandles[fhi];

        if (fh.mode != QB.BINARY && fh.mode != QB.RANDOM) {
            throw new Error("Bad file mode");
        }

        if (position == undefined) {
            position = fh.offset;
        }
        else if (position > 0) {
            position--;
        }

        var vfs = GX.vfs();

        if (value._dimensions) {
            var idx = [];
            for (var di=0; di < value._dimensions.length; di++) {
                var d = value._dimensions[di];
                idx.push({l: d.l, u: d.u, i: d.l});
            }

            var done = false;
            while (!done) {
                var ai = [];
                for (var i=0; i < idx.length; i++) {
                    ai.push(idx[i].i);
                }
                var v = QB.arrayValue(value, ai);
                QB.sub_Put(fhi, position+1, type, v.value);
                position = fh.offset;

                // increment the indexes
                var cidx = 0;
                var incNext = true;
                while (cidx < idx.length) { 
                    if (incNext) {
                        idx[cidx].i++;
                        if (idx[cidx].i > idx[cidx].u) {
                            idx[cidx].i = idx[cidx].l;
                            incNext = true;
                        }
                        else {
                            incNext = false;
                        }
                    }
                    cidx++;
                }
                if (incNext) {
                    done = true;
                }
            }

            return;
        }

        var customType = false;
        var data = null;
        var bytes = 0;
        if      (type == "SINGLE")            { data = new Float32Array([value]).buffer; }
        else if (type == "DOUBLE")            { data = new Float64Array([value]).buffer; }
        else if (type == "_BYTE")             { data = new Int8Array([value]).buffer; }
        else if (type == "_UNSIGNED _BYTE")   { data = new Uint8Array([value]).buffer; }
        else if (type == "INTEGER")           { data = new Int16Array([value]).buffer; }
        else if (type == "_UNSIGNED INTEGER") { data = new Uint16Array([value]).buffer; }
        else if (type == "LONG")              { data = new Int32Array([value]).buffer; }
        else if (type == "_UNSIGNED LONG")    { data = new Uint32Array([value]).buffer; }
        else if (type == "STRING")            { data = vfs.textToData(value); }
        else if (type == "_BIT" || type == "_UNSIGNED _BIT") {
            // mimicking QB64 error message here
            throw new Error("Variable/element cannot be BIT aligned on current line");
        }
        else if (type == "_INTEGER64" || type == "_UNSIGNED _INTEGER64" ||
                 type == "_OFFSET" || type == "_UNSIGNED _OFFSET" ||
                 type == "_MEM") {
            throw new Error ("Unsupported data type for operation: " + type);
        }
        else {
            // Assume if we got here this is a custom type
            customType = true;
            var tvars = _typeMap[type];
            if (tvars == undefined) {
                throw new Error("Unknown type: " + type);
            }
            for (var i=0; i < tvars.length; i++) {
                var tname = tvars[i].name;
                var ttype = tvars[i].type;
                QB.sub_Put(fhi, position + 1, ttype, value[tname]);
                position = fh.offset;
            }
        }

        if (!customType) {
            vfs.writeData(fh.file, data, position);
            fh.offset = position + data.byteLength;
        }
    };

    this.sub_Read = function(values) {
        for (var i=0; i < values.length; i++) {
            values[i] = _dataBulk[_readCursorPosition];
            _readCursorPosition += 1;
        }
    };

    this.sub_Restore = function(t) {
        if ((t == undefined) || (t.trim() == "")) {
            _readCursorPosition = 0;
        } else {
            _readCursorPosition = _dataLabelMap[t];
            if (_readCursorPosition == undefined) {
                throw new Error("Label '" + t + "' not defined");
            }
        }
    };

    this.func_Right = function(value, n) {
        _assertParam(value, 1);
        _assertNumber(n, 2);
        if (value == undefined) {
            return "";
        }
        var s = String(value);
        return s.substring(s.length-n, s.length);
    };

    this.func_RTrim = function(value) {
        _assertParam(value);
        return String(value).trimEnd();
    }

    this.sub_Randomize = function(using, n) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        var m;
        if (n == undefined) { // TODO: implement user prompt case
            view.setFloat64(0, 0, false); // assumes n=0 for now
            m = view.getUint32(0);
            m ^= (m >> 16);
            _rndSeed = ((m & 0xffff)<<8) | (_rndSeed & 0xff);
        } else {
            view.setFloat64(0, n, false);
            m = view.getUint32(0);
            m ^= (m >> 16);
            if (using == false) {
                _rndSeed = ((m & 0xffff)<<8) | (_rndSeed & 0xff);
            } else if (using == true) {
                _rndSeed = ((m & 0xffff)<<8) | (327680 & 0xff);
            }
        }
    };

    this.sub_RmDir = function(path) {
        _assertParam(path);
        vfs.removeDirectory(path, vfsCwd);
    };

    this.func_Rnd = function(n) {
        if (n == undefined) {n = 1;}
        if (n != 0) {
            if (n < 0) {
                const buffer = new ArrayBuffer(8);
                const view = new DataView(buffer);  
                view.setFloat32(0, n, false);
                var m = view.getUint32(0);
                _rndSeed = (m & 0xFFFFFF) + ((m & 0xFF000000) >>> 24);
            }
            _rndSeed = (_rndSeed * 16598013 + 12820163) & 0xFFFFFF;
        }
        return _rndSeed / 0x1000000;
    };

    this.sub_Screen = function(mode) {
        _activeImage = 0;
        charSizeMode = false;

        if (_currScreenImage) {
            _images[_currScreenImage.id] = _currScreenImage;
            this.sub__PutImage(undefined, undefined, undefined, undefined, undefined, undefined, 0, _currScreenImage.id);
            _currScreenImage = null;
        }

        _screenMode = mode;
        if (mode == 0) {
            GX.sceneCreate(640, 400);
        }
        else if (mode == 1) {
            GX.sceneCreate(320, 200);
        }
        else if (mode == 2 || mode == 7 || mode == 13) {
            GX.sceneCreate(320, 200);
        }
        else if (mode == 8) {
            GX.sceneCreate(640, 200);
        }
        else if (mode == 9 || mode == 10) {
            GX.sceneCreate(640, 350);
        }
        else if (mode == 11 || mode == 12) {
            GX.sceneCreate(640, 480);
        }
        else if (mode == 13) {
            GX.sceneCreate(320, 200);
        }
        else if (mode >= 1000) {
            var img = _images[mode];
            if (img && img.canvas) {
                GX.sceneCreate(img.canvas.width, img.canvas.height);
                this.sub__PutImage(undefined, undefined, undefined, undefined, undefined, undefined, mode);
                charSizeMode = img.charSizeMode;
                _currScreenImage = _images[mode];
                _currScreenImage.id = mode;
                _images[mode] = _images[0];
            }
        }
        else {
            throw new Error("Invalid screen mode");
        }

        _images[0] = { canvas: GX.canvas(), ctx: GX.ctx(), lastX: 0, lastY: 0 };
        _images[0].lastX = _images[0].canvas.width/2;
        _images[0].lastY = _images[0].canvas.height/2;
        _images[0].canvas.style.cursor = "default";

        _screenDiagInv = 1/Math.sqrt(_images[0].canvas.width*_images[0].canvas.width + _images[0].canvas.height*_images[0].canvas.height);
        
        // initialize the graphics
        _screenMode = mode;
        if (mode < 2) {
            _fgColor = _color(7); 
        }
        else {
            _fgColor = _color(15); 
        }
        _bgColor = _color(0);
        _lastTextX = 0;
        _locX = 0;
        _locY = 0;

        _windowAspect[0] = false;
        _strokeDrawLength = 4;
        _strokeDrawAngle = -Math.PI/2;
        _strokeDrawColor = _color(15);

        _lastKey = null;
        _inputMode = false;
        _inkeyBuffer = [];
        _keyHitBuffer = [];
        _keyDownMap = {};

        _initScreenText();
        
        // TODO: set the appropriate default font for the selected screen mode above instead of here
    };

    this.func_Screen = function(row, col, colorflag) {
        if (colorflag) {
            return _getScreenColor(row-1, col-1);
        }
        else {
            var s = _getScreenText(row-1, col-1);
            s = QB.convertTo437(s);
            return s.charCodeAt(0);
        }
    };
    
    function _initScreenText()
    {
        _screenText = [];

        var fw = QB.func__FontWidth();
        if (fw > 0) {
            var fh = QB.func__FontHeight();
            for (var i=0; i < Math.floor(QB.func__Height()/fh); i++)
            {
                var col = [];
                for (var j=0; j < Math.floor(QB.func__Width()/fw); j++) {
                    col.push({ text: " " });
                }
                _screenText.push(col);
            }
        }
    }

    function _scrollScreenText() {
        for (var i=1; i < _screenText.length; i++) {
            _screenText[i-1] = _screenText[i];
        }
        var col = [];
        for (var j=0; j < Math.floor(QB.func__Width()/QB.func__FontWidth()); j++) {
            col.push({ text: " " });
        }
        _screenText[_screenText.length-1] = col;
    }

    function _setScreenText(text) {
        var row = _locY;
        var col = _locX; 
        if (_screenText.length < 1 || row >= _screenText.length) { return; }
        for (var i=0; i < text.length; i++) {
            _screenText[row][col+i].text = text.substring(i, i+1);
            _screenText[row][col+i].fgcolor = _fgColor;
            _screenText[row][col+i].bgcolor = _bgColor;
        }
    }

    function _getScreenColor(row, col) {
        var rdata = _screenText[row];
        if (!rdata) { return 0; }
        var cdata = rdata[col];
        if (!cdata) { return 0; }
        var c = cdata.fgcolor;
        if (!c) { return 0; }
        c = _lookupIndexedColor(c);
        if (!isNaN(c)) {
            if (c < 16) {
                var bg = _lookupIndexedColor(cdata.bgcolor);
                if (!isNaN(bg) && bg > 0 && bg <= 7) {
                    c += bg*16;
                }
            }
        }
        return c;
    }

    function _lookupIndexedColor(c) {
        for (var i=0; i < _colormap.length; i++) {
            var cm = _colormap[i];
            if (cm.r == c.r && cm.g == c.g && cm.b == c.b && cm.a == c.a) {
                return i;
            }
        }
        return c;
    }

    function _getScreenText(row, col) {
        var rdata = _screenText[row];
        if (!rdata) { return " "; }
        var cdata = rdata[col];
        if (!cdata || !cdata.text) { return " "; }
        return cdata.text;
    }

    this.func_Seek = function(fh) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }

        return _fileHandles[fh].offset + 1;
    };

    this.sub_Seek = function(fh, pos) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }

        _fileHandles[fh].offset = pos - 1;
    };

    this.func_Sgn = function(value) {
        _assertNumber(value);
        if (value > 0) { return 1; }
        else if (value < 0) { return -1; }
        else { return 0; }
    };

    this.func_Space = function(ccount) {
        _assertNumber(ccount);
        return QB.func_String(ccount, " ");
    }

    this.func_String = function(ccount, s) {
        _assertNumber(ccount, 1);
        _assertParam(s, 2);
        if (typeof s === "string") {
            s = s.substring(0, 1);
        }
        else {
            s = String.fromCharCode(s);
        }
        return "".padStart(ccount, s);
    };

    this.func_Sin = function(value) {
        _assertNumber(value);
        return Math.sin(value);
    };

    this.sub_Sleep = async function(seconds) {
        var elapsed = 0;
        var totalWait = Infinity;
        if (seconds != undefined) {
            _assertNumber(seconds);
            if (seconds > 0) {
                totalWait = seconds*1000;
            }
        }
        
        _lastKey = null;
        while (!_lastKey && elapsed < totalWait) { 
            await GX.sleep(100); 
            elapsed += 100;
            if (_haltedFlag) { return; }
        }
    };


    this.sub_Sound = async function(freq, duration, shape, decay, gain) {
        _assertNumber(freq, 1);
        _assertNumber(duration, 2);
        // convert duration to milliseconds
        duration = duration * 1000 / 18;
        if (shape == undefined || (typeof shape != 'string')) { shape = "square"; }
        if (decay == undefined || (typeof decay != 'number')) { decay = 0.0; }
        if (gain  == undefined || (typeof gain != 'number')) { gain = 1.0; }
        if (!(freq == 0 || (freq >= 32 && freq <= 32767))) {
            throw new Error("Frequency invalid - valid: 0 (delay), 32 to 32767");
        }
        var valid_shapes = ["sine", "square", "sawtooth", "triangle"];
        if (!valid_shapes.includes(shape.toLowerCase())) {
            throw new Error("Shape invalid - valid: " + valid_shapes.join(', '));
        }
        if (freq == 0) {
            await GX.sleep(duration);
        } else {
            var oscillator = _soundCtx.createOscillator();
            var gainNode = _soundCtx.createGain();
            oscillator.type = shape;
            oscillator.frequency.value = freq;
            oscillator.connect(gainNode);
            gainNode.connect(_soundCtx.destination)
            gainNode.gain.value = gain;
            oscillator.start(); 
            setTimeout(await async function () {
                gainNode.gain.setTargetAtTime(0, _soundCtx.currentTime, decay);
                oscillator.stop(duration + decay + 1);
            }, duration);  
            await GX.sleep(duration*2/3);
        }
    };

    this.func_Sqr = function(value) {
        _assertNumber(value);
        return Math.sqrt(value);
    };

    this.func_Str = function(value) {
        if (!isNaN(value) && value >= 0) {
            return " " + value;
        }
        return String(value);
    };

    this.sub_Swap = function(values) {
        var temp = values[1];
        values[1] = values[0];
        values[0] = temp;
    };

    this.func_Tan = function(value) {
        __assertNumber(value);
        return Math.tan(value);
    };

    this.func_Time = function() {
        var digital = new Date();
        var hours = ("00" + digital.getHours()).slice(-2);
        var minutes = ("00" + digital.getMinutes()).slice(-2);
        var seconds = ("00" + digital.getSeconds()).slice(-2);
        var c = hours + ":" + minutes + ":" + seconds;
        return c;
    };

    this.func_Timer = function(accuracy) {
        // TODO: implement optional accuracy
        var midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        return ((new Date()).getTime() - midnight.getTime()) / 1000;
    };

    this.func_LBound = function(a, dimension) {
        _assertParam(a);
        if (dimension == undefined) {
            dimension = 1;
        }
        else {
            _assertNumber(dimension, 2);
        }
        return a._dimensions[dimension-1].l;
    };

    this.func_UBound = function(a, dimension) {
        _assertParam(a);
        if (dimension == undefined) {
            dimension = 1;
        }
        else {
            _assertNumber(dimension, 2);
        }
        return a._dimensions[dimension-1].u;
    };

    this.func_UCase = function(value) {
        _assertParam(value);
        return String(value).toUpperCase();
    };

    this.func_Val = function(value) {
        _assertParam(value);
        var ret;
        value = value.toString();
        value = value.replaceAll(/\s/g, "");
        if (value.substring(0, 2) == "&H") {
            ret = parseInt(value.slice(2), 16);
        } else if (value.substring(0, 2) == "&O") {
            ret = parseInt(value.slice(2), 8);
        } else if (value.substring(0, 2) == "&B") {
            ret = parseInt(value.slice(2), 2);
        } else {
            ret = Number(value);
        }
        if (isNaN(ret)) { ret = 0; }
        return ret;
    };

    this.func_Varptr = function(value) {
        return String(value);
    };

    this.sub_Window = function(screenSwitch, x0, y0, x1, y1) {
        var screen = _images[_activeImage];
        var orientY, factorX, factorY;
        if ((screenSwitch == false) && (x0 == undefined) && (y0 == undefined) && (x1 == undefined) && (y1 == undefined)) {
            _windowAspect[0] = false;
        } else {
            factorX = Math.abs(x1-x0) / screen.canvas.width;
            factorY = Math.abs(y1-y0) / screen.canvas.height;
            if (screenSwitch == false) {
                orientY = -1;
            } else {
                orientY = 1;
            }
            _windowAspect[0] = factorY/factorX;
            _windowAspect[1] = factorX;
            _windowAspect[2] = orientY*factorY;
            _windowDef[0] = x0;
            _windowDef[1] = y0;
            _windowDef[2] = x1;
            _windowDef[3] = y1;
        }

    };

    function windowContendX(u, w) {
        return w * (u - _windowDef[0]) / (_windowDef[2] - _windowDef[0]);
    }

    function windowUnContendX(u, w) {
        return _windowDef[0] + u * (_windowDef[2] - _windowDef[0]) / w;
    }

    function windowContendY(v, h) {
        if (_windowAspect[2] < 0) {
            return h - h * (v - _windowDef[1]) / (_windowDef[3] - _windowDef[1]);
        } else {
            return 0 + h * (v - _windowDef[1]) / (_windowDef[3] - _windowDef[1]);
        }
    }

    function windowUnContendY(v, h) {
        if (_windowAspect[2] < 0) {
            return _windowDef[3] - (v/h) * (_windowDef[3] - _windowDef[1]);
        } else {
            return _windowDef[1] + (v/h) * (_windowDef[3] - _windowDef[1]);
        }
    }

    this.sub_Write = function(args) {
        QB.sub_Print([_getWriteString(args)]);
    }

    this.sub_WriteToFile = function(fh, args) {
        if (!_fileHandles[fh]) {
            throw new Error("Invalid file handle");
        }
        if (_fileHandles[fh].mode != QB.OUTPUT && _fileHandles[fh].mode != QB.APPEND) {
            throw new Error("Bad file mode");
        }

        fh = _fileHandles[fh];
        var vfs = GX.vfs();
        vfs.writeText(fh.file, _getWriteString(args) + "\r\n");
    }

    function _getWriteString(args) {
        if (!args || !args.length) { return ""; }
        var output = "";
        for (var i=0; i < args.length; i++) {
            if (i > 0) {
                output += ","
            }
            if (args[i].type == "STRING" && !args[i].value.startsWith('"')) {
                output += "\"" + args[i].value + "\"";
            }
            else {
                output += args[i].value;
            }
        }
        return output;
    }

    // QBJS-only methods
    // ---------------------------------------------------------------------------------
    this.sub_IncludeJS = async function(url) {
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();

        var script = document.createElement("script")
        document.body.appendChild(script);
        script.id = url;
        script.async = false;

        var file = vfs.getNode(url, vfsCwd);
        if (file && file.type == vfs.FILE) {
            script.innerHTML = vfs.readText(file);
        }
        else {
            script.src = url;
        }
    };
    
    this.sub_Fetch = async function(url, fetchRes) {
        var vfs = GX.vfs();
        var vfsCwd = GX.vfsCwd();
        var file = vfs.getNode(url, vfsCwd);
        if (file && file.type == vfs.FILE) {
            fetchRes.ok = true;
            fetchRes.status = 200;
            fetchRes.statusText = "";
            fetchRes.text = vfs.readText(file);
        }
        else {
            var response = await fetch(url);
            var responseText = await(response.text());
            fetchRes.ok = response.ok;
            fetchRes.status = response.status;
            fetchRes.statusText = response.statusText;
            fetchRes.text = responseText;
        }
    };

    this.func_Fetch = async function(url) {
        var fetchRes = {};
        await QB.sub_Fetch(url, fetchRes);
        return fetchRes;
    };

    function _addInkeyPress(e) {
        var shift = e.getModifierState("Shift");
        var ctrl = e.getModifierState("Control");
        var alt = e.getModifierState("Alt");
        var capslock = e.getModifierState("CapsLock");
        var numlock = e.getModifierState("NumLock");

        var code = e.code;
        if (!numlock && _inkeynp[code]) { code = _inkeynp[code]; }        

        var k = _inkeymap[code];
        if (!k) { return; }

        var charCodes = null;
        if (alt) {
            if (!k.a) { return; }
            charCodes = k.a;
        }
        else if (ctrl) {
            charCodes = k.c;
        }
        else if (k.cl) {
            if ((capslock && !shift) || (!capslock && shift)) {
                charCodes = k.s;
            }
            else {
                charCodes = k.n;
            }
        }
        else if (shift) {
            charCodes = k.s;
        }
        else {
            charCodes = k.n;
        }
        
        if (charCodes) {
            var str = "";
            for (var i=0; i < charCodes.length; i++) {
                str += String.fromCharCode(charCodes[i]);
            }
            _inkeyBuffer.push(str);
        }
    }

    function _getKeyHit(e)
    {
        var shift = e.getModifierState("Shift");
        var capslock = e.getModifierState("CapsLock");
        var numlock = e.getModifierState("NumLock");

        var code = e.code;
        if (!numlock && _inkeynp[code]) { code = _inkeynp[code]; }        
        var k = _keyhitmap[code];
        if (!k) { return null; } 
        
        var keyCode = null;
        if (k.cl) {
            if ((capslock && !shift) || (!capslock && shift)) {
                keyCode = k.s;
            }
            else {
                keyCode = k.c;
            }
        }
        else if (shift && (e.code != "ShiftLeft") && (e.code != "ShiftRight")) {
            keyCode = k.s;
        }
        else {
            keyCode = k.c;
        }        

        return keyCode;
    }

    function _initInKeyMap() {
        _inkeynp['Numpad0'] = 'Insert';
        _inkeynp['Numpad1'] = 'End';
        _inkeynp['Numpad2'] = 'ArrowDown';
        _inkeynp['Numpad3'] = 'PageDown';
        _inkeynp['Numpad4'] = 'ArrowLeft';
        _inkeynp['Numpad5'] = 'N/A';
        _inkeynp['Numpad6'] = 'ArrowRight';
        _inkeynp['Numpad7'] = 'Home';
        _inkeynp['Numpad8'] = 'ArrowUp';
        _inkeynp['Numpad9'] = 'PageUp';

        _inkeymap['Backspace'] = {n:[8],s:[8],c:[0,147],a:[0,14]};
        _inkeymap['Tab'] = {n:[9],s:[0,15]};
        _inkeymap['Enter'] = {n:[13],s:[13],c:[10]};
        _inkeymap['Escape'] = {n:[0,27],s:[0,27]};
        _inkeymap['Space'] = {n:[0,32],s:[0,32],c:[0,32]};
        _inkeymap['PageUp'] = {n:[0,73],s:[0,73],c:[0,132],a:[0,153]};
        _inkeymap['PageDown'] = {n:[0,81],s:[0,81],c:[0,118],a:[0,161]};
        _inkeymap['End'] = {n:[0,79],s:[0,79],c:[0,117],a:[0,159]};
        _inkeymap['Home'] = {n:[0,71],s:[0,71],c:[0,119],a:[0,151]};
        _inkeymap['ArrowLeft'] = {n:[0,75],s:[0,75],c:[0,115],a:[0,155]};
        _inkeymap['ArrowUp'] = {n:[0,72],s:[0,72],c:[0,141],a:[0,152]};
        _inkeymap['ArrowRight'] = {n:[0,77],s:[0,77],c:[0,116],a:[0,157]};
        _inkeymap['ArrowDown'] = {n:[0,80],s:[0,80],c:[0,145],a:[0,160]};
        _inkeymap['Insert'] = {n:[0,82],s:[0,82],c:[0,146],a:[0,162]};
        _inkeymap['Delete'] = {n:[0,83],s:[0,83],c:[0,147],a:[0,163]};
        _inkeymap['Digit0'] = {n:[48],s:[41],a:[0,129]};
        _inkeymap['Digit1'] = {n:[49],s:[33],a:[0,120]};
        _inkeymap['Digit2'] = {n:[50],s:[64],a:[0,121]};
        _inkeymap['Digit3'] = {n:[51],s:[35],a:[0,122]};
        _inkeymap['Digit4'] = {n:[52],s:[36],a:[0,123]};
        _inkeymap['Digit5'] = {n:[53],s:[37],a:[0,124]};
        _inkeymap['Digit6'] = {n:[54],s:[94],a:[0,125]};
        _inkeymap['Digit7'] = {n:[55],s:[38],a:[0,126]};
        _inkeymap['Digit8'] = {n:[56],s:[42],a:[0,127]};
        _inkeymap['Digit9'] = {n:[57],s:[40],a:[0,128]};
        _inkeymap['KeyA'] = {n:[97],s:[65],c:[1],a:[0,30],cl:true};
        _inkeymap['KeyB'] = {n:[98],s:[66],c:[2],a:[0,48],cl:true};
        _inkeymap['KeyC'] = {n:[99],s:[67],c:[3],a:[0,46],cl:true};
        _inkeymap['KeyD'] = {n:[100],s:[68],c:[4],a:[0,32],cl:true};
        _inkeymap['KeyE'] = {n:[101],s:[69],c:[5],a:[0,18],cl:true};
        _inkeymap['KeyF'] = {n:[102],s:[70],c:[6],a:[0,33],cl:true};
        _inkeymap['KeyG'] = {n:[103],s:[71],c:[7],a:[0,34],cl:true};
        _inkeymap['KeyH'] = {n:[104],s:[72],c:[8],a:[0,35],cl:true};
        _inkeymap['KeyI'] = {n:[105],s:[73],c:[9],a:[0,23],cl:true};
        _inkeymap['KeyJ'] = {n:[106],s:[74],c:[10],a:[0,36],cl:true};
        _inkeymap['KeyK'] = {n:[107],s:[75],c:[11],a:[0,37],cl:true};
        _inkeymap['KeyL'] = {n:[108],s:[76],c:[12],a:[0,38],cl:true};
        _inkeymap['KeyM'] = {n:[109],s:[77],c:[13],a:[0,50],cl:true};
        _inkeymap['KeyN'] = {n:[110],s:[78],c:[14],a:[0,49],cl:true};
        _inkeymap['KeyO'] = {n:[111],s:[79],c:[15],a:[0,24],cl:true};
        _inkeymap['KeyP'] = {n:[112],s:[80],c:[16],a:[0,25],cl:true};
        _inkeymap['KeyQ'] = {n:[113],s:[81],c:[17],a:[0,16],cl:true};
        _inkeymap['KeyR'] = {n:[114],s:[82],c:[18],a:[0,19],cl:true};
        _inkeymap['KeyS'] = {n:[115],s:[83],c:[19],a:[0,31],cl:true};
        _inkeymap['KeyT'] = {n:[116],s:[84],c:[20],a:[0,20],cl:true};
        _inkeymap['KeyU'] = {n:[117],s:[85],c:[21],a:[0,22],cl:true};
        _inkeymap['KeyV'] = {n:[118],s:[86],c:[22],a:[0,47],cl:true};
        _inkeymap['KeyW'] = {n:[119],s:[87],c:[23],a:[0,17],cl:true};
        _inkeymap['KeyX'] = {n:[120],s:[88],c:[24],a:[0,45],cl:true};
        _inkeymap['KeyY'] = {n:[121],s:[89],c:[25],a:[0,21],cl:true};
        _inkeymap['KeyZ'] = {n:[122],s:[90],c:[26],a:[0,44],cl:true};
        _inkeymap['Numpad0'] = {n:[48],s:[0,82]};
        _inkeymap['Numpad1'] = {n:[49],s:[0,79]};
        _inkeymap['Numpad2'] = {n:[50],s:[0,80]};
        _inkeymap['Numpad3'] = {n:[51],s:[0,81]};
        _inkeymap['Numpad4'] = {n:[52],s:[0,75]};
        _inkeymap['Numpad5'] = {n:[53],s:[0,76]};
        _inkeymap['Numpad6'] = {n:[54],s:[0,77]};
        _inkeymap['Numpad7'] = {n:[55],s:[0,71]};
        _inkeymap['Numpad8'] = {n:[56],s:[0,72]};
        _inkeymap['Numpad9'] = {n:[57],s:[0,73]};
        _inkeymap['NumpadMultiply'] = {n:[42],s:[42],a:[0,127]};
        _inkeymap['NumpadAdd'] = {n:[43],s:[43],a:[0,131]};
        _inkeymap['NumpadSubtract'] = {n:[45],s:[45],a:[0,130]};
        _inkeymap['NumpadDecimal'] = {n:[46],s:[0,83],a:[0,52]};
        _inkeymap['NumpadDivide'] = {n:[47],s:[47],a:[0,53]};
        _inkeymap['NumpadEnter'] = {n:[13],s:[13],c:[10]};
        _inkeymap['F1'] = {n:[0,59],s:[0,84],c:[0,94],a:[0,104]};
        _inkeymap['F2'] = {n:[0,60],s:[0,85],c:[0,95],a:[0,105]};
        _inkeymap['F3'] = {n:[0,61],s:[0,86],c:[0,96],a:[0,106]};
        _inkeymap['F4'] = {n:[0,62],s:[0,87],c:[0,97],a:[0,107]};
        _inkeymap['F5'] = {n:[0,63],s:[0,88],c:[0,98],a:[0,108]};
        _inkeymap['F6'] = {n:[0,64],s:[0,89],c:[0,99],a:[0,109]};
        _inkeymap['F7'] = {n:[0,65],s:[0,90],c:[0,100],a:[0,110]};
        _inkeymap['F8'] = {n:[0,66],s:[0,91],c:[0,101],a:[0,111]};
        _inkeymap['F9'] = {n:[0,67],s:[0,92],c:[0,102],a:[0,112]};
        _inkeymap['F10'] = {n:[0,68],s:[0,93],c:[0,103],a:[0,113]};
        _inkeymap['F11'] = {n:[0,133],s:[0,133],c:[0,137],a:[0,139]};
        _inkeymap['F12'] = {n:[0,134],s:[0,134],c:[0,138],a:[0,140]};
        _inkeymap['Semicolon'] = {n:[59],s:[58],a:[0,39]};
        _inkeymap['Equal'] = {n:[61],s:[43],a:[0,131]};
        _inkeymap['Comma'] = {n:[44],s:[60],a:[0,51]};
        _inkeymap['Minus'] = {n:[45],s:[95],a:[0,130]};
        _inkeymap['Period'] = {n:[46],s:[62],a:[0,52]};
        _inkeymap['Slash'] = {n:[47],s:[63],a:[0,53]};
        _inkeymap['Backquote'] = {n:[96],s:[126],a:[0,41]};
        _inkeymap['BracketLeft'] = {n:[91],s:[123],c:[27],a:[0,26]};
        _inkeymap['Backslash'] = {n:[92],s:[124],c:[28],a:[0,43]};
        _inkeymap['BracketRight'] = {n:[93],s:[125],c:[29],a:[0,27]};
        _inkeymap['Quote'] = {n:[39],s:[34],a:[0,40]};
    }

    function _initKeyHitMap() {
        _keyhitmap['Backspace'] = {c:8}
        _keyhitmap['Tab'] = {c:9}
        _keyhitmap['Enter'] = {c:13}
        _keyhitmap['ShiftLeft'] = {c:100304}
        _keyhitmap['ShiftRight'] = {c:100303}
        _keyhitmap['ControlLeft'] = {c:100306}
        _keyhitmap['ControlRight'] = {c:100305}
        _keyhitmap['AltLeft'] = {c:100308}
        _keyhitmap['AltRight'] = {c:100307}
        _keyhitmap['CapsLock'] = {c:100301}
        _keyhitmap['Escape'] = {c:27}
        _keyhitmap['Space'] = {c:32}
        _keyhitmap['PageUp'] = {c:18688}
        _keyhitmap['PageDown'] = {c:20736}
        _keyhitmap['End'] = {c:20224}
        _keyhitmap['Home'] = {c:18176}
        _keyhitmap['ArrowLeft'] = {c:19200}
        _keyhitmap['ArrowUp'] = {c:18432}
        _keyhitmap['ArrowRight'] = {c:19712}
        _keyhitmap['ArrowDown'] = {c:20480}
        _keyhitmap['Insert'] = {c:20992}
        _keyhitmap['Delete'] = {c:21248}
        _keyhitmap['Digit0'] = {c:48}
        _keyhitmap['Digit1'] = {c:49}
        _keyhitmap['Digit2'] = {c:50}
        _keyhitmap['Digit3'] = {c:51}
        _keyhitmap['Digit4'] = {c:52}
        _keyhitmap['Digit5'] = {c:53}
        _keyhitmap['Digit6'] = {c:54}
        _keyhitmap['Digit7'] = {c:55}
        _keyhitmap['Digit8'] = {c:56}
        _keyhitmap['Digit9'] = {c:57}
        _keyhitmap['KeyA'] = {c:97,s: 65,cl:true}
        _keyhitmap['KeyB'] = {c:98,s: 66,cl:true}
        _keyhitmap['KeyC'] = {c:99,s: 67,cl:true}
        _keyhitmap['KeyD'] = {c:100,s: 68,cl:true}
        _keyhitmap['KeyE'] = {c:101,s: 69,cl:true}
        _keyhitmap['KeyF'] = {c:102,s: 70,cl:true}
        _keyhitmap['KeyG'] = {c:103,s: 71,cl:true}
        _keyhitmap['KeyH'] = {c:104,s: 72,cl:true}
        _keyhitmap['KeyI'] = {c:105,s: 73,cl:true}
        _keyhitmap['KeyJ'] = {c:106,s: 74,cl:true}
        _keyhitmap['KeyK'] = {c:107,s: 75,cl:true}
        _keyhitmap['KeyL'] = {c:108,s: 76,cl:true}
        _keyhitmap['KeyM'] = {c:109,s: 77,cl:true}
        _keyhitmap['KeyN'] = {c:110,s: 78,cl:true}
        _keyhitmap['KeyO'] = {c:111,s: 79,cl:true}
        _keyhitmap['KeyP'] = {c:112,s: 80,cl:true}
        _keyhitmap['KeyQ'] = {c:113,s: 81,cl:true}
        _keyhitmap['KeyR'] = {c:114,s: 82,cl:true}
        _keyhitmap['KeyS'] = {c:115,s: 83,cl:true}
        _keyhitmap['KeyT'] = {c:116,s: 84,cl:true}
        _keyhitmap['KeyU'] = {c:117,s: 85,cl:true}
        _keyhitmap['KeyV'] = {c:118,s: 86,cl:true}
        _keyhitmap['KeyW'] = {c:119,s: 87,cl:true}
        _keyhitmap['KeyX'] = {c:120,s: 88,cl:true}
        _keyhitmap['KeyY'] = {c:121,s: 89,cl:true}
        _keyhitmap['KeyZ'] = {c:122,s: 90,cl:true}
        _keyhitmap['Numpad0'] = {c:48}
        _keyhitmap['Numpad1'] = {c:49}
        _keyhitmap['Numpad2'] = {c:50}
        _keyhitmap['Numpad3'] = {c:51}
        _keyhitmap['Numpad4'] = {c:52}
        _keyhitmap['Numpad5'] = {c:53}
        _keyhitmap['Numpad6'] = {c:54}
        _keyhitmap['Numpad7'] = {c:55}
        _keyhitmap['Numpad8'] = {c:56}
        _keyhitmap['Numpad9'] = {c:57}
        _keyhitmap['NumpadMultiply'] = {c:42}
        _keyhitmap['NumpadAdd'] = {c:43}
        _keyhitmap['NumpadSubtract'] = {c:45}
        _keyhitmap['NumpadDecimal'] = {c:46}
        _keyhitmap['NumpadDivide'] = {c:47}
        _keyhitmap['NumpadEnter'] = {c:13}
        _keyhitmap['F1'] = {c:15104}
        _keyhitmap['F2'] = {c:15360}
        _keyhitmap['F3'] = {c:15616}
        _keyhitmap['F4'] = {c:15872}
        _keyhitmap['F5'] = {c:16128}
        _keyhitmap['F6'] = {c:16384}
        _keyhitmap['F7'] = {c:16640}
        _keyhitmap['F8'] = {c:16896}
        _keyhitmap['F9'] = {c:17152}
        _keyhitmap['F10'] = {c:17408}
        _keyhitmap['F11'] = {c:34048}
        _keyhitmap['F12'] = {c:34304}
        _keyhitmap['NumLock'] = {c:100300}
        _keyhitmap['ScrollLock'] = {c:145}
        _keyhitmap['Semicolon'] = {c:59,s: 58}
        _keyhitmap['Equal'] = {c:61,s: 43}
        _keyhitmap['Comma'] = {c:44,s: 60}
        _keyhitmap['Minus'] = {c:45,s: 95}
        _keyhitmap['Period'] = {c:46,s: 62}
        _keyhitmap['Slash'] = {c:47,s: 63}
        _keyhitmap['Backquote'] = {c:96,s: 126}
        _keyhitmap['BracketLeft'] = {c:91,s: 123}
        _keyhitmap['Backslash'] = {c:92,s: 124}
        _keyhitmap['BracketRight'] = {c:93,s: 125}
        _keyhitmap['Quote'] = {c:39,s: 34}
        
    }

    function _initColorTable() {
        _colormap[0] = _rgb(0, 0, 0);
        _colormap[1] = _rgb(0, 0, 168);
        _colormap[2] = _rgb(0, 168, 0);
        _colormap[3] = _rgb(0, 168, 168);
        _colormap[4] = _rgb(168, 0, 0);
        _colormap[5] = _rgb(168, 0, 168);
        _colormap[6] = _rgb(168, 84, 0);
        _colormap[7] = _rgb(168, 168, 168);
        _colormap[8] = _rgb(84, 84, 84);
        _colormap[9] = _rgb(84, 84, 252);
        _colormap[10] = _rgb(84, 252, 84);
        _colormap[11] = _rgb(84, 252, 252);
        _colormap[12] = _rgb(252, 84, 84);
        _colormap[13] = _rgb(252, 84, 252);
        _colormap[14] = _rgb(252, 252, 84);
        _colormap[15] = _rgb(252, 252, 252);
        _colormap[16] = _rgb(0, 0, 0);
        _colormap[17] = _rgb(20, 20, 20);
        _colormap[18] = _rgb(32, 32, 32);
        _colormap[19] = _rgb(44, 44, 44);
        _colormap[20] = _rgb(56, 56, 56);
        _colormap[21] = _rgb(68, 68, 68);
        _colormap[22] = _rgb(80, 80, 80);
        _colormap[23] = _rgb(96, 96, 96);
        _colormap[24] = _rgb(112, 112, 112);
        _colormap[25] = _rgb(128, 128, 128);
        _colormap[26] = _rgb(144, 144, 144);
        _colormap[27] = _rgb(160, 160, 160);
        _colormap[28] = _rgb(180, 180, 180);
        _colormap[29] = _rgb(200, 200, 200);
        _colormap[30] = _rgb(224, 224, 224);
        _colormap[31] = _rgb(252, 252, 252);
        _colormap[32] = _rgb(0, 0, 252);
        _colormap[33] = _rgb(64, 0, 252);
        _colormap[34] = _rgb(124, 0, 252);
        _colormap[35] = _rgb(188, 0, 252);
        _colormap[36] = _rgb(252, 0, 252);
        _colormap[37] = _rgb(252, 0, 188);
        _colormap[38] = _rgb(252, 0, 124);
        _colormap[39] = _rgb(252, 0, 64);
        _colormap[40] = _rgb(252, 0, 0);
        _colormap[41] = _rgb(252, 64, 0);
        _colormap[42] = _rgb(252, 124, 0);
        _colormap[43] = _rgb(252, 188, 0);
        _colormap[44] = _rgb(252, 252, 0);
        _colormap[45] = _rgb(188, 252, 0);
        _colormap[46] = _rgb(124, 252, 0);
        _colormap[47] = _rgb(64, 252, 0);
        _colormap[48] = _rgb(0, 252, 0);
        _colormap[49] = _rgb(0, 252, 64);
        _colormap[50] = _rgb(0, 252, 124);
        _colormap[51] = _rgb(0, 252, 188);
        _colormap[52] = _rgb(0, 252, 252);
        _colormap[53] = _rgb(0, 188, 252);
        _colormap[54] = _rgb(0, 124, 252);
        _colormap[55] = _rgb(0, 64, 252);
        _colormap[56] = _rgb(124, 124, 252);
        _colormap[57] = _rgb(156, 124, 252);
        _colormap[58] = _rgb(188, 124, 252);
        _colormap[59] = _rgb(220, 124, 252);
        _colormap[60] = _rgb(252, 124, 252);
        _colormap[61] = _rgb(252, 124, 220);
        _colormap[62] = _rgb(252, 124, 188);
        _colormap[63] = _rgb(252, 124, 156);
        _colormap[64] = _rgb(252, 124, 124);
        _colormap[65] = _rgb(252, 156, 124);
        _colormap[66] = _rgb(252, 188, 124);
        _colormap[67] = _rgb(252, 220, 124);
        _colormap[68] = _rgb(252, 252, 124);
        _colormap[69] = _rgb(220, 252, 124);
        _colormap[70] = _rgb(188, 252, 124);
        _colormap[71] = _rgb(156, 252, 124);
        _colormap[72] = _rgb(124, 252, 124);
        _colormap[73] = _rgb(124, 252, 156);
        _colormap[74] = _rgb(124, 252, 188);
        _colormap[75] = _rgb(124, 252, 220);
        _colormap[76] = _rgb(124, 252, 252);
        _colormap[77] = _rgb(124, 220, 252);
        _colormap[78] = _rgb(124, 188, 252);
        _colormap[79] = _rgb(124, 156, 252);
        _colormap[80] = _rgb(180, 180, 252);
        _colormap[81] = _rgb(196, 180, 252);
        _colormap[82] = _rgb(216, 180, 252);
        _colormap[83] = _rgb(232, 180, 252);
        _colormap[84] = _rgb(252, 180, 252);
        _colormap[85] = _rgb(252, 180, 232);
        _colormap[86] = _rgb(252, 180, 216);
        _colormap[87] = _rgb(252, 180, 196);
        _colormap[88] = _rgb(252, 180, 180);
        _colormap[89] = _rgb(252, 196, 180);
        _colormap[90] = _rgb(252, 216, 180);
        _colormap[91] = _rgb(252, 232, 180);
        _colormap[92] = _rgb(252, 252, 180);
        _colormap[93] = _rgb(232, 252, 180);
        _colormap[94] = _rgb(216, 252, 180);
        _colormap[95] = _rgb(196, 252, 180);
        _colormap[96] = _rgb(180, 252, 180);
        _colormap[97] = _rgb(180, 252, 196);
        _colormap[98] = _rgb(180, 252, 216);
        _colormap[99] = _rgb(180, 252, 232);
        _colormap[100] = _rgb(180, 252, 252);
        _colormap[101] = _rgb(180, 232, 252);
        _colormap[102] = _rgb(180, 216, 252);
        _colormap[103] = _rgb(180, 196, 252);
        _colormap[104] = _rgb(0, 0, 112);
        _colormap[105] = _rgb(28, 0, 112);
        _colormap[106] = _rgb(56, 0, 112);
        _colormap[107] = _rgb(84, 0, 112);
        _colormap[108] = _rgb(112, 0, 112);
        _colormap[109] = _rgb(112, 0, 84);
        _colormap[110] = _rgb(112, 0, 56);
        _colormap[111] = _rgb(112, 0, 28);
        _colormap[112] = _rgb(112, 0, 0);
        _colormap[113] = _rgb(112, 28, 0);
        _colormap[114] = _rgb(112, 56, 0);
        _colormap[115] = _rgb(112, 84, 0);
        _colormap[116] = _rgb(112, 112, 0);
        _colormap[117] = _rgb(84, 112, 0);
        _colormap[118] = _rgb(56, 112, 0);
        _colormap[119] = _rgb(28, 112, 0);
        _colormap[120] = _rgb(0, 112, 0);
        _colormap[121] = _rgb(0, 112, 28);
        _colormap[122] = _rgb(0, 112, 56);
        _colormap[123] = _rgb(0, 112, 84);
        _colormap[124] = _rgb(0, 112, 112);
        _colormap[125] = _rgb(0, 84, 112);
        _colormap[126] = _rgb(0, 56, 112);
        _colormap[127] = _rgb(0, 28, 112);
        _colormap[128] = _rgb(56, 56, 112);
        _colormap[129] = _rgb(68, 56, 112);
        _colormap[130] = _rgb(84, 56, 112);
        _colormap[131] = _rgb(96, 56, 112);
        _colormap[132] = _rgb(112, 56, 112);
        _colormap[133] = _rgb(112, 56, 96);
        _colormap[134] = _rgb(112, 56, 84);
        _colormap[135] = _rgb(112, 56, 68);
        _colormap[136] = _rgb(112, 56, 56);
        _colormap[137] = _rgb(112, 68, 56);
        _colormap[138] = _rgb(112, 84, 56);
        _colormap[139] = _rgb(112, 96, 56);
        _colormap[140] = _rgb(112, 112, 56);
        _colormap[141] = _rgb(96, 112, 56);
        _colormap[142] = _rgb(84, 112, 56);
        _colormap[143] = _rgb(68, 112, 56);
        _colormap[144] = _rgb(56, 112, 56);
        _colormap[145] = _rgb(56, 112, 68);
        _colormap[146] = _rgb(56, 112, 84);
        _colormap[147] = _rgb(56, 112, 96);
        _colormap[148] = _rgb(56, 112, 112);
        _colormap[149] = _rgb(56, 96, 112);
        _colormap[150] = _rgb(56, 84, 112);
        _colormap[151] = _rgb(56, 68, 112);
        _colormap[152] = _rgb(80, 80, 112);
        _colormap[153] = _rgb(88, 80, 112);
        _colormap[154] = _rgb(96, 80, 112);
        _colormap[155] = _rgb(104, 80, 112);
        _colormap[156] = _rgb(112, 80, 112);
        _colormap[157] = _rgb(112, 80, 104);
        _colormap[158] = _rgb(112, 80, 96);
        _colormap[159] = _rgb(112, 80, 88);
        _colormap[160] = _rgb(112, 80, 80);
        _colormap[161] = _rgb(112, 88, 80);
        _colormap[162] = _rgb(112, 96, 80);
        _colormap[163] = _rgb(112, 104, 80);
        _colormap[164] = _rgb(112, 112, 80);
        _colormap[165] = _rgb(104, 112, 80);
        _colormap[166] = _rgb(96, 112, 80);
        _colormap[167] = _rgb(88, 112, 80);
        _colormap[168] = _rgb(80, 112, 80);
        _colormap[169] = _rgb(80, 112, 88);
        _colormap[170] = _rgb(80, 112, 96);
        _colormap[171] = _rgb(80, 112, 104);
        _colormap[172] = _rgb(80, 112, 112);
        _colormap[173] = _rgb(80, 104, 112);
        _colormap[174] = _rgb(80, 96, 112);
        _colormap[175] = _rgb(80, 88, 112);
        _colormap[176] = _rgb(0, 0, 64);
        _colormap[177] = _rgb(16, 0, 64);
        _colormap[178] = _rgb(32, 0, 64);
        _colormap[179] = _rgb(48, 0, 64);
        _colormap[180] = _rgb(64, 0, 64);
        _colormap[181] = _rgb(64, 0, 48);
        _colormap[182] = _rgb(64, 0, 32);
        _colormap[183] = _rgb(64, 0, 16);
        _colormap[184] = _rgb(64, 0, 0);
        _colormap[185] = _rgb(64, 16, 0);
        _colormap[186] = _rgb(64, 32, 0);
        _colormap[187] = _rgb(64, 48, 0);
        _colormap[188] = _rgb(64, 64, 0);
        _colormap[189] = _rgb(48, 64, 0);
        _colormap[190] = _rgb(32, 64, 0);
        _colormap[191] = _rgb(16, 64, 0);
        _colormap[192] = _rgb(0, 64, 0);
        _colormap[193] = _rgb(0, 64, 16);
        _colormap[194] = _rgb(0, 64, 32);
        _colormap[195] = _rgb(0, 64, 48);
        _colormap[196] = _rgb(0, 64, 64);
        _colormap[197] = _rgb(0, 48, 64);
        _colormap[198] = _rgb(0, 32, 64);
        _colormap[199] = _rgb(0, 16, 64);
        _colormap[200] = _rgb(32, 32, 64);
        _colormap[201] = _rgb(40, 32, 64);
        _colormap[202] = _rgb(48, 32, 64);
        _colormap[203] = _rgb(56, 32, 64);
        _colormap[204] = _rgb(64, 32, 64);
        _colormap[205] = _rgb(64, 32, 56);
        _colormap[206] = _rgb(64, 32, 48);
        _colormap[207] = _rgb(64, 32, 40);
        _colormap[208] = _rgb(64, 32, 32);
        _colormap[209] = _rgb(64, 40, 32);
        _colormap[210] = _rgb(64, 48, 32);
        _colormap[211] = _rgb(64, 56, 32);
        _colormap[212] = _rgb(64, 64, 32);
        _colormap[213] = _rgb(56, 64, 32);
        _colormap[214] = _rgb(48, 64, 32);
        _colormap[215] = _rgb(40, 64, 32);
        _colormap[216] = _rgb(32, 64, 32);
        _colormap[217] = _rgb(32, 64, 40);
        _colormap[218] = _rgb(32, 64, 48);
        _colormap[219] = _rgb(32, 64, 56);
        _colormap[220] = _rgb(32, 64, 64);
        _colormap[221] = _rgb(32, 56, 64);
        _colormap[222] = _rgb(32, 48, 64);
        _colormap[223] = _rgb(32, 40, 64);
        _colormap[224] = _rgb(44, 44, 64);
        _colormap[225] = _rgb(48, 44, 64);
        _colormap[226] = _rgb(52, 44, 64);
        _colormap[227] = _rgb(60, 44, 64);
        _colormap[228] = _rgb(64, 44, 64);
        _colormap[229] = _rgb(64, 44, 60);
        _colormap[230] = _rgb(64, 44, 52);
        _colormap[231] = _rgb(64, 44, 48);
        _colormap[232] = _rgb(64, 44, 44);
        _colormap[233] = _rgb(64, 48, 44);
        _colormap[234] = _rgb(64, 52, 44);
        _colormap[235] = _rgb(64, 60, 44);
        _colormap[236] = _rgb(64, 64, 44);
        _colormap[237] = _rgb(60, 64, 44);
        _colormap[238] = _rgb(52, 64, 44);
        _colormap[239] = _rgb(48, 64, 44);
        _colormap[240] = _rgb(44, 64, 44);
        _colormap[241] = _rgb(44, 64, 48);
        _colormap[242] = _rgb(44, 64, 52);
        _colormap[243] = _rgb(44, 64, 60);
        _colormap[244] = _rgb(44, 64, 64);
        _colormap[245] = _rgb(44, 60, 64);
        _colormap[246] = _rgb(44, 52, 64);
        _colormap[247] = _rgb(44, 48, 64);
        _colormap[248] = _rgb(0, 0, 0);
        _colormap[249] = _rgb(0, 0, 0);
        _colormap[250] = _rgb(0, 0, 0);
        _colormap[251] = _rgb(0, 0, 0);
        _colormap[252] = _rgb(0, 0, 0);
        _colormap[253] = _rgb(0, 0, 0);
        _colormap[254] = _rgb(0, 0, 0);
        _colormap[255] = _rgb(0, 0, 0);
    }

    function _initCharMap() {
        _mapChar(1, 0x263a);
        _mapChar(2, 0x263b);
        _mapChar(3, 0x2665);
        _mapChar(4, 0x2666);
        _mapChar(5, 0x2663);
        _mapChar(6, 0x2660);
        _mapChar(7, 0x2022);
        _mapChar(8, 0x25D8);
        _mapChar(9, 0x25CB);
        //_mapChar(10, 0x25D9);
        _mapChar(11, 0x2642);
        _mapChar(12, 0x2640);
        _mapChar(13, 0x266A);
        _mapChar(14, 0x266B);
        _mapChar(15, 0x263C);
        _mapChar(16, 0x25BA);
        _mapChar(17, 0x25C4);
        _mapChar(18, 0x2195);
        _mapChar(19, 0x203C);
        _mapChar(20, 0x00B6);
        _mapChar(21, 0x00A7);
        _mapChar(22, 0x25AC);
        _mapChar(23, 0x21A8);
        _mapChar(24, 0x2191);
        _mapChar(25, 0x2193);
        _mapChar(26, 0x2192);
        _mapChar(27, 0x2190);
        _mapChar(28, 0x221F);
        _mapChar(29, 0x2194);
        _mapChar(30, 0x25B2);
        _mapChar(31, 0x25BC);
        _mapChar(127, 0x2302);
        _mapChar(128, 0x00C7);
        _mapChar(129, 0x00FC);
        _mapChar(130, 0x00E9);
        _mapChar(131, 0x00E2);
        _mapChar(132, 0x00E4);
        _mapChar(133, 0x00E0);
        _mapChar(134, 0x00E5);
        _mapChar(135, 0x00E7);
        _mapChar(136, 0x00EA);
        _mapChar(137, 0x00EB);
        _mapChar(138, 0x00E8);
        _mapChar(139, 0x00EF);
        _mapChar(140, 0x00EE);
        _mapChar(141, 0x00EC);
        _mapChar(142, 0x00C4);
        _mapChar(143, 0x00C5);
        _mapChar(144, 0x00C9);
        _mapChar(145, 0x00E6);
        _mapChar(146, 0x00C6);
        _mapChar(147, 0x00F4);
        _mapChar(148, 0x00F6);
        _mapChar(149, 0x00F2);
        _mapChar(150, 0x00FB);
        _mapChar(151, 0x00F9);
        _mapChar(152, 0x00FF);
        _mapChar(153, 0x00D6);
        _mapChar(154, 0x00DC);
        _mapChar(155, 0x00A2);
        _mapChar(156, 0x00A3);
        _mapChar(157, 0x00A5);
        _mapChar(158, 0x20A7);
        _mapChar(159, 0x0192);
        _mapChar(160, 0x00E1);
        _mapChar(161, 0x00ED);
        _mapChar(162, 0x00F3);
        _mapChar(163, 0x00FA);
        _mapChar(164, 0x00F1);
        _mapChar(165, 0x00D1);
        _mapChar(166, 0x00AA);
        _mapChar(167, 0x00BA);
        _mapChar(168, 0x00BF);
        _mapChar(169, 0x2310);
        _mapChar(170, 0x00AC);
        _mapChar(171, 0x00BD);
        _mapChar(172, 0x00BC);
        _mapChar(173, 0x00A1);
        _mapChar(174, 0x00AB);
        _mapChar(175, 0x00BB);
        _mapChar(176, 0x2591);
        _mapChar(177, 0x2592);
        _mapChar(178, 0x2593);
        _mapChar(179, 0x2502);
        _mapChar(180, 0x2524);
        _mapChar(181, 0x2561);
        _mapChar(182, 0x2562);
        _mapChar(183, 0x2556);
        _mapChar(184, 0x2555);
        _mapChar(185, 0x2563);
        _mapChar(186, 0x2551);
        _mapChar(187, 0x2557);
        _mapChar(188, 0x255D);
        _mapChar(189, 0x255C);
        _mapChar(190, 0x255B);
        _mapChar(191, 0x2510);
        _mapChar(192, 0x2514);
        _mapChar(193, 0x2534);
        _mapChar(194, 0x252C);
        _mapChar(195, 0x251C);
        _mapChar(196, 0x2500);
        _mapChar(197, 0x253C);
        _mapChar(198, 0x255E);
        _mapChar(199, 0x255F);
        _mapChar(200, 0x255A);
        _mapChar(201, 0x2554);
        _mapChar(202, 0x2569);
        _mapChar(203, 0x2566);
        _mapChar(204, 0x2560);
        _mapChar(205, 0x2550);
        _mapChar(206, 0x256C);
        _mapChar(207, 0x2567);
        _mapChar(208, 0x2568);
        _mapChar(209, 0x2564);
        _mapChar(210, 0x2565);
        _mapChar(211, 0x2559);
        _mapChar(212, 0x2558);
        _mapChar(213, 0x2552);
        _mapChar(214, 0x2553);
        _mapChar(215, 0x256B);
        _mapChar(216, 0x256A);
        _mapChar(217, 0x2518);
        _mapChar(218, 0x250C);
        _mapChar(219, 0x2588);
        _mapChar(220, 0x2584);
        _mapChar(221, 0x258C);
        _mapChar(222, 0x2590);
        _mapChar(223, 0x2580);
        _mapChar(224, 0x03B1);
        _mapChar(225, 0x00DF);
        _mapChar(226, 0x0393);
        _mapChar(227, 0x03C0);
        _mapChar(228, 0x03A3);
        _mapChar(229, 0x03C3);
        _mapChar(230, 0x00B5);
        _mapChar(231, 0x03C4);
        _mapChar(232, 0x03A6);
        _mapChar(233, 0x0398);
        _mapChar(234, 0x03A9);
        _mapChar(235, 0x03B4);
        _mapChar(236, 0x221E);
        _mapChar(237, 0x03C6);
        _mapChar(238, 0x03B5);
        _mapChar(239, 0x2229);
        _mapChar(240, 0x2261);
        _mapChar(241, 0x00B1);
        _mapChar(242, 0x2265);
        _mapChar(243, 0x2264);
        _mapChar(244, 0x2320);
        _mapChar(245, 0x2321);
        _mapChar(246, 0x00F7);
        _mapChar(247, 0x2248);
        _mapChar(248, 0x00B0);
        _mapChar(249, 0x2219);
        _mapChar(250, 0x00B7);
        _mapChar(251, 0x221A);
        _mapChar(252, 0x207F);
        _mapChar(253, 0x00B2);
        _mapChar(254, 0x25A0);
        _mapChar(255, 0x00A0);
    }

    function _mapChar(ccode, ucode) {
        _ucharMap[ccode] = ucode;
        _ccharMap[ucode] = ccode;
    }

    function _convertCharMap(str, charMap) {
        var newstr = "";
        for (var i=0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            var uc = charMap[c];
            if (uc) { c = uc; }
            newstr += String.fromCharCode(c);
        }
        return newstr;
    }

    this.convertToUTF = function(str) {
        return _convertCharMap(str, _ucharMap);
    };

    this.convertTo437 = function(str) {
        return _convertCharMap(str, _ccharMap);
    };

    function _init() {
        _initColorTable();
        _initInKeyMap();
        _initKeyHitMap();
        _initCharMap();

        addEventListener("keydown", function(event) { 
            if (!_runningFlag) { return; }
            event.preventDefault();
            _lastKey = event.key;
            if (!_inputMode) {
                var kh = _getKeyHit(event);
                if (kh) {
                    _keyHitBuffer.push(kh);
                    _keyDownMap[kh] = true;
                    _keyDownMap._CapsLock = event.getModifierState("CapsLock");
                    _keyDownMap._NumLock = event.getModifierState("NumLock");
                    _keyDownMap._ScrollLock = event.getModifierState("ScrollLock");
                }
            }
        });

        addEventListener("keyup", function(event) { 
            if (!_runningFlag) { return; }

            event.preventDefault();
            if (!_inputMode) {
                _addInkeyPress(event);
                var kh = _getKeyHit(event);
                if (kh) {
                    _keyHitBuffer.push(kh * -1);
                    _keyDownMap[kh] = false;
                    _keyDownMap._CapsLock = event.getModifierState("CapsLock");
                    _keyDownMap._NumLock = event.getModifierState("NumLock");
                    _keyDownMap._ScrollLock = event.getModifierState("ScrollLock");
                }
            }
        });
    };

    _init();
}
