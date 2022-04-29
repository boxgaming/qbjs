var QB = new function() {
    // QB constants
    this.COLUMN_ADVANCE = Symbol("COLUMN_ADVANCE");
    this.PREVENT_NEWLINE = Symbol("PREVENT_NEWLINE");
    this.LOCAL = Symbol("LOCAL");
    this.SESSION = Symbol("SESSION");
    this.STRETCH = Symbol("STRETCH");
    this.SQUAREPIXELS = Symbol("SQUAREPIXELS");
    this.OFF = Symbol("OFF");

    var _strokeThickness = 2;
    var _fgColor = null; 
    var _bgColor = null; 
    var _colormap = [];
    var _locX = 0;
    var _locY = 0;
    var _lastKey = null;
    var _inkeyBuffer = [];
    var _keyHitBuffer = [];
    var _keyDownMap = {};
    var _inkeymap = {};
    var _inkeynp = {};
    var _keyhitmap = {};
    var _inputMode = false;
    var _haltedFlag = false;
    var _runningFlag = false;
    var _images = {};
    var _activeImage = 0;
    var _nextImageId = 1000;
    var _lastLimitTime = new Date();
    var _resize = false;
    var _resizeWidth = 0;
    var _resizeHeight = 0;

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
            a._dimensions = [{l:1,u:1}];
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
        a._dimensions = [{l:1,u:1}];
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
        _nextImageId = 1000;
        _activeImage = 0;
        GX._enableTouchMouse(true);
        GX.registerGameEvents(function(e){});
        QB.sub_Screen(0);
    }

    this.running = function() {
        return _runningFlag;
    };

    // Access methods for std libraries
    // --------------------------------------------
    this.getImage = function(imageId) {
        return _images[imageId].canvas;
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

    // the canvas handles the display for us, there is effectively no difference
    // between _display and _autodisplay, included here for compatibility
    this.func__AutoDisplay = function() { return -1; }
    this.sub__AutoDisplay = function() {}

    this.func__Blue = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).b;
    };

    this.func__Blue32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).b;
    };

    this.func__CopyImage = function(srcImageId) {
        var srcCanvas = _images[srcImageId].canvas;
        var destImageId = QB.func__NewImage(srcCanvas.width, srcCanvas.height);
        var ctx = _images[destImageId].ctx;
        ctx.drawImage(srcCanvas, 0, 0);

        return destImageId;
    };

    this.func__Cosh = function(x) {
        return (Math.exp(x)+Math.exp(-x))/2;
    };

    this.func__D2R = function(x) {
        return x*Math.PI/180;
    };

    this.sub__Delay = async function(seconds) {
        await GX.sleep(seconds*1000);
    };

    this.func__Dest = function() {
        return _activeImage;
    }

    this.sub__Dest = function(imageId) {
        _activeImage = imageId;
    }

    this.func__Display = function() {
        return 0;
    }

    this.sub__Display = function() {
        // The canvas handles this for us, this method is included for compatibility
    };

    this.func__FontHeight = function(fnt) {
        return 16;
    };

    this.func__FontWidth = function(fnt) {
        return 8;
    };

    this.sub__FreeImage = function(imageId) {
        _images[imageId] = undefined;
    };

    this.func__FullScreen = function() {
        return GX.fullScreen();
    };

    this.sub__FullScreen = function(mode, smooth) {
        if (mode == QB.OFF) {
            GX.fullScreen(false);
        }
        else if (mode == QB.STRETCH || mode == QB.SQUAREPIXELS) {
            // TODO: not making any distinction at present
            GX.fullScreen(true);
        }
        // TODO: implement smooth option (maybe) - the canvas does smooth scaling by default
    }

    this.func__Green = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).g;
    };

    this.func__Green32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).g;
    };

    this.func__Height = function(imageId) {
        if (imageId == undefined) { imageId = _activeImage; }
        return _images[imageId].canvas.height;
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
        await GX.sleep((1000 - (new Date() - _lastLimitTime))/fps);
        _lastLimitTime = new Date();
    };

    this.func__LoadImage = async function(url) {
        var img = new Image();
        img.src = url;
        while (!img.complete) {
            await GX.sleep(10);
        }

        var imgId = QB.func__NewImage(img.width, img.height);
        var ctx = _images[imgId].ctx;
        ctx.drawImage(img, 0, 0);

        return imgId;
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
        var canvas = document.createElement("canvas");
        canvas.id = "qb-canvas-" + _nextImageId;
        canvas.width = iwidth;
        canvas.height = iheight;
        ctx = canvas.getContext("2d");

        _images[_nextImageId] = { canvas: canvas, ctx: ctx, lastX: 0, lastY: 0 };
        var tmpId = _nextImageId;
        _nextImageId++;
        return tmpId;
    };

    this.sub__PrintString = function(x, y, s) {
        // TODO: check the background opacity mode
        // Draw the text background
        var ctx = _images[_activeImage].ctx;
        ctx.beginPath();
        ctx.fillStyle = _bgColor.rgba();
        ctx.fillRect(x, y, QB.func__FontWidth(), QB.func__FontHeight());

        // Draw the string
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

    this.sub__PutImage = function(dstep1, dx1, dy1, dstep2, dx2, dy2, sourceImageId, destImageId, sstep1, sx1, sy1, sstep2, sx2, sy2, smooth) {
        if (destImageId == undefined) {
            destImageId = _activeImage;
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

        destImage.lastX = dx1 + dw;
        destImage.lastY = dy1 + dh;
        sourceImage.lastX = sx1 + sw;
        sourceImage.lastY = sy2 + sh;

        destImage.ctx.drawImage(sourceImage.canvas, sx1, sy1, sw, sh, dx1, dy1, dw, dh);
    }

    function _rgb(r, g, b, a) {
        if (a == undefined) { a = 1; }
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
        return x*180/Math.PI;
    };

    this.func__Red = function(rgb, imageHandle) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).r;
    };

    this.func__Red32 = function(rgb) {
        // TODO: implement corresponding logic when an image handle is supplied (maybe)
        return _color(rgb).r;
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

        return _rgb(r, g, b, a);
    }

    this.func__Round = function(value) {
        return Math.round(value);
    };

    this.func__ScreenExists = function() {
        return true;
    };

    this.func__Sinh = function(x) {
        return (Math.exp(x)-Math.exp(-x))/2;
    };

    this.sub__SndClose = function(sid) {
        GX.soundClose(sid);
    };

    this.func__SndOpen = function(filename) {
        return GX.soundLoad(filename);
    };

    this.sub__SndPlay = function(sid) {
        GX.soundPlay(sid);
    };

    this.sub__SndLoop = function(sid) {
        GX.soundRepeat(sid);
    };

    this.sub__SndPause = function(sid) {
        GX.soundPause(sid);
    };

    this.sub__SndStop = function(sid) {
        GX.soundStop(sid);
    };

    this.sub__SndVol = function(sid, v) {
        GX.soundVolumne(sid, v);
    };


    this.sub__Title = function(title) {
        document.title = title;
    };

    this.func__Trim = function(value) {
        return value.trim();
    };

    this.func__Width = function(imageId) {
        if (imageId == undefined) { imageId = _activeImage; }
        return _images[imageId].canvas.width;
    };


    // QB45 Keywords
    // --------------------------------------------
    this.func_Abs = function(value) {
        return Math.abs(value);
    };

    this.func_Asc = function(value, pos) {
        if (pos == undefined) {
            pos = 0;
        }
        else { pos--; }

        return String(value).charCodeAt(pos);
    }

    this.func_Atn = function(value) {
        return Math.atan(value);
    };

    this.sub_Beep = function() {
        var context = new AudioContext();
        var oscillator = context.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.value = 780;
        oscillator.connect(context.destination);
        oscillator.start(); 
        setTimeout(function () {
            oscillator.stop();
        }, 200);  
    };

    this.func_Chr = function(charCode) {
        return String.fromCharCode(charCode);
    };

    this.sub_Cls = function(method, bgColor) {
        // method parameter is ignored, there is no separate view port for text and graphics

        var color = _bgColor;
        if (bgColor != undefined) {
            color = _color(bgColor);
        }
        
        ctx = _images[_activeImage].ctx;
        ctx.beginPath();
        ctx.clearRect(0, 0, QB.func__Width(), QB.func__Height());
        ctx.fillStyle = color.rgba();
        ctx.fillRect(0, 0, QB.func__Width(), QB.func__Height());

        // reset the text position
        _locX = 0;
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
        return Math.cos(value);
    };

    this.func_Cvi = function(numString) {
        var result = 0;
        numString = numString.split("").reverse().join("");
        for (let i=1;i>=0;i--) {
            result+=numString.charCodeAt(1-i)<<(8*i);
        }
        return result;
    }

    this.func_Cvl = function(numString) {
        var result = 0;
        numString = numString.split("").reverse().join("");
        for (let i=3;i>=0;i--) {
            result+=numString.charCodeAt(3-i)<<(8*i);
        }
        return result;
    }

    this.sub_Draw = function(t) {

        var u = t.toString();
        u = u.replace(" ","");
        u = u.replace("=","");
        u = u.toUpperCase();
        u = u.split("");

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

        var tok;
        var tok1;
        var tok2;
        var cursS = 4;
        var cursA = -Math.PI/2;
        var cursX;
        var cursY;
        var cursX0;
        var cursY0;
        var cursXt;
        var cursYt;
        var cursReturn = false;
        var cursSkipdraw = false;
        var dx;
        var dy;
        var dlen;
        var multiplier;
        var color;
        var tmp = [[]];

        var lines = [["U",0],["E",Math.PI/4],["R",Math.PI/2],["F",Math.PI*(3/4)],["D",Math.PI],["G",Math.PI*(5/4)],["L",Math.PI*(3/2)],["H",Math.PI*(7/4)]];

        var screen = _images[_activeImage];
        var ctx = screen.ctx;
        cursX = screen.lastX;
        cursY = screen.lastY;

        ctx.strokeStyle = _fgColor.rgba();

        while (v.length) {
            tok = v.shift();

            if (tok[1] == 1) { 

                if (tok[0] == "C") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 0) {
                            tok1 = v.shift();
                            color = Math.floor(tok1[0]);
                            ctx.strokeStyle = _color(color).rgba();
                            _fgColor = _color(color);
                        }
                    }

                } else if (tok[0] == "S") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 0) {
                            tok1 = v.shift();
                            cursS = tok1[0];
                        }
                    }

                } else if (tok[0] == "N") {
                    cursX0 = cursX;
                    cursY0 = cursY;
                    cursReturn = true;

                } else if (tok[0] == "B") {
                    cursSkipdraw = true;

                } else if (tok[0] == "A") {
                    tok1 = v.shift();
                    if (tok1[1] == 0) {
                        if (tok1[0] == 1) {
                            cursA = -Math.PI;
                        } else if (tok1[0] == 2) {
                            cursA = -Math.PI*(3/2);
                        } else if (tok1[0] == 3) {
                            cursA = 0;
                        }
                        if (cursA > Math.PI*2) { cursA -= Math.PI*2; }
                        if (cursA < -Math.PI*2) { cursA += Math.PI*2; }
                    }

                } else if (tok[0] == "T") {
                    if (v.length) {
                        tmp = v[0];
                        if (tmp[1] == 1) {
                            tok1 = v.shift();
                            if (tok1[0] == "A") {
                                if (v.length) {
                                    tmp = v[0];
                                    if (tmp[1] == 0) {
                                        tok2 = v.shift();
                                        cursA = -Math.PI/2 - tok2[0]*Math.PI/180;
                                    }
                                }
                            }
                        }
                    }

                } else if (tok[0] == "M") {
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
                                    cursXt = cursX + multiplier * tok2[0];
                                }
                            }
                        } else if (tmp[1] == 0) {
                            tok1 = v.shift();
                            cursXt = tok1[0];
                        }
                    }
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
                                            cursYt = cursY + multiplier * tok2[0];
                                        }
                                    }
                                } else if (tmp[1] == 0) {
                                    tok1 = v.shift();
                                    cursYt = tok1[0];
                                }
                            }
                        }
                        if (cursSkipdraw == false) {
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
                                    dlen = tok1[0];
                                } else {
                                    dlen = cursS/4;
                                }
                            }
                            dx = dlen * Math.cos(cursA + lines[i][1]);
                            dy = dlen * Math.sin(cursA + lines[i][1]);
                            cursXt = cursX*1.0 + dx;
                            cursYt = cursY*1.0 + dy;
                            if (cursSkipdraw == false) {
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

    this.func_Hex = function(n) {
        return n.toString(16).toUpperCase();
    };

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

        while (_lastKey != "Enter") {

            if (_lastKey == "Backspace" && str.length > 0) {
                _locX--;
                
                var ctx = _images[_activeImage].ctx;
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
        if (_inkeyBuffer.length < 1) {
            return "";
        }
        return _inkeyBuffer.shift();
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

        var screen = _images[_activeImage];
        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }

        if (startAngle == undefined) { startAngle = 0; }
        if (endAngle == undefined) { endAngle = 2 * Math.PI; }
        
        if (step) {
            x = screen.lastX + x;
            y = screen.lastY + y;
        }
        screen.lastX = x;
        screen.lastY = y;

        var ctx = screen.ctx;
        ctx.lineWidth = _strokeThickness;
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
        _fgColor = _color(color);
    };

    this.sub_Line = function(sstep, sx, sy, estep, ex, ey, color, style, pattern) {
        var screen = _images[_activeImage];

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
            sx = screen.lastX + sx;
            sy = screen.lastY + sy;
        }
        if (sx == undefined) {
            sx = screen.lastX;
            sy = screen.lastY;
        }
        screen.lastX = sx;
        screen.lastY = sy;

        if (estep) {
            ex = screen.lastX + ex;
            ey = screen.lastY + ey;
        }
        screen.lastX = ex;
        screen.lastY = ey;

        var ctx = screen.ctx;
        ctx.lineWidth = _strokeThickness;

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
        _fgColor = _color(color);
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

    this.func_Mki = function(num) {
        var ascii = "";
        for (var i=1; i >= 0; i--) {
            ascii += String.fromCharCode((num>>(8*i))&255);
        }
        return ascii.split("").reverse().join("");
    };

    this.func_Mkl = function(num) {
        var ascii = "";
        for (var i=3; i >= 0; i--) {
            ascii += String.fromCharCode((num>>(8*i))&255);
        }
        return ascii.split("").reverse().join("");
    };

    this.func_Oct = function(n) {
        return n.toString(8).toUpperCase();
    };

    this.sub_Paint = function(sstep, startX, startY, fillColor, borderColor) {
        var screen = _images[_activeImage];
        var ctx = screen.ctx;
        var data = ctx.getImageData(0, 0, screen.canvas.width, screen.canvas.height).data;
        ctx.beginPath();

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
        //var a = dat[p+3];
        var thresh = 2;
        if ((Math.abs(r - c1.r) < thresh) && (Math.abs(g - c1.g) < thresh) && (Math.abs(b - c1.b) < thresh)) { return false; }
        if ((Math.abs(r - c2.r) < thresh) && (Math.abs(g - c2.g) < thresh) && (Math.abs(b - c2.b) < thresh)) { return false; }
        return true;
    }

    this.func_Point = function(x, y) {
        var screen = _images[_activeImage];
        var ret = 0;
        if ( y == undefined ) {
            if (x == 0) { 
                ret = screen.lastX;
            } else if (x == 1) {
                ret = screen.lastY;
            } else if (x == 2) { // until Window is implemented.
                ret = screen.lastX;
            } else if (x == 3) { // until Window is implemented.
                ret = screen.lastY;
            }
        } else {
            var ctx = screen.ctx;
            var data = ctx.getImageData(x, y, 1, 1).data;
            ret = QB.func__RGBA(data[0],data[1],data[2],data[3]);
        }
        return ret;
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
            x = screen.lastX + x;
            y = screen.lastY + y;
        }
        screen.lastX = x;
        screen.lastY = y;
    };

    this.sub_Print = async function(args) {
        // Print called with no arguments
        if (args == undefined || args == null || args.length < 1) {
            args = [""];
        }

        var ctx = _images[_activeImage].ctx;
        var preventNewline = (args[args.length-1] == QB.PREVENT_NEWLINE || args[args.length-1] == QB.COLUMN_ADVANCE);

        for (var ai = 0; ai < args.length; ai++) {
            if (args[ai] == QB.PREVENT_NEWLINE) {
                // ignore as we will just concatenate the next arg
            }
            else if (args[ai] == QB.COLUMN_ADVANCE) {
                // advance to the next column offset
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
                    }
                    else {
                        y = (_locY) * QB.func__FontHeight();
                    }
        
                    // TODO: check the background opacity mode
                    // Draw the text background
                    ctx.beginPath();
                    ctx.fillStyle = _bgColor.rgba();
                    ctx.fillRect(x, y, QB.func__FontWidth() * lines[i].length, QB.func__FontHeight());
        
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

    async function _printScroll() {
        var img = new Image();
        img.src = GX.canvas().toDataURL("image/png");
        while (!img.complete) {
            await GX.sleep(10);
        }

        var ctx = _images[_activeImage].ctx;
        ctx.beginPath();
        ctx.fillStyle = _bgColor.rgba();
        ctx.fillRect(0, 0, QB.func__Width(), QB.func__Height());
        ctx.drawImage(img, 0, -QB.func__FontHeight());
    }

    this.sub_PSet = function(sstep, x, y, color) {
        var screen = _images[_activeImage];

        if (color == undefined) {
            color = _fgColor;
        }
        else {
            color = _color(color);
        }
        if (sstep) {
            x = screen.lastX + x;
            y = screen.lastY + y;
        }
        screen.lastX = x;
        screen.lastY = y;

        var ctx = screen.ctx;
        ctx.fillStyle = color.rgba();
        ctx.beginPath();
        ctx.fillRect(x, y, 1, 1);
        _fgColor = _color(color);
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
        _activeImage = 0;

        if (mode == 0) {
            GX.sceneCreate(640, 400);
        }
        else if (mode < 2 || mode == 7 || mode == 13) {
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
        else if (mode >= 1000) {
            var img = _images[mode];
            if (img && img.canvas) {
                GX.sceneCreate(img.canvas.width, img.canvas.height);
                this.sub__PutImage(undefined, undefined, undefined, undefined, undefined, undefined, mode);
            }
        }
        _images[0] = { canvas: GX.canvas(), ctx: GX.ctx(), lastX: 0, lastY: 0 };
        _images[0].lastX = _images[0].canvas.width/2;
        _images[0].lastY = _images[0].canvas.height/2;

        // initialize the graphics
        _fgColor = _color(7); 
        _bgColor = _color(0);
        _locX = 0;
        _locY = 0;

        _lastKey = null;
        _inputMode = false;
        _inkeyBuffer = [];
        _keyHitBuffer = [];
        _keyDownMap = {};
    };

    this.func_Sgn = function(value) {
        if (value > 0) { return 1; }
        else if (value < 0) { return -1; }
        else { return 0; }
    };

    this.func_Space = function(ccount) {
        return QB.func_String(ccount, " ");
    }

    this.func_String = function(ccount, s) {
        return "".padStart(ccount, s);
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
        if (dimension == undefined) {
            dimension = 1;
        }
        return a._dimensions[dimension-1].l;
    };

    this.func_UBound = function(a, dimension) {
        if (dimension == undefined) {
            dimension = 1;
        }
        return a._dimensions[dimension-1].u;
    };

    this.func_UCase = function(value) {
        return String(value).toUpperCase();
    };

    this.func_Val = function(value) {
        var ret;
        if (value.substring(0, 2) == "&H") {
            ret = parseInt(value.slice(2), 16);
        } else if (value.substring(0, 2) == "&O") {
            ret = parseInt(value.slice(2), 8);
        } else if (value.substring(0, 2) == "&B") {
            ret = parseInt(value.slice(2), 2);
        } else {
            ret = Number(value);
        }
        return ret;
    };

    this.func_Varptr = function(value) {
        return String(value);
    };


    // QBJS-only methods
    // ---------------------------------------------------------------------------------
    this.sub_TouchMouse = function() {
        GX._enableTouchMouse(true);
    };

    this.sub_Fetch = async function(url, fetchRes) {
        var response = await fetch(url);
        var responseText = await(response.text());
        fetchRes.ok = response.ok;
        fetchRes.status = response.status;
        fetchRes.statusText = response.statusText;
        fetchRes.text = responseText;
    };

    this.func_Fetch = async function(url) {
        var fetchRes = {};
        QB.fetch(url, fetchRes);
        return fetchRes;
    };

    this.func_FromJSON = function(s) {
        return JSON.parse(s);
    };

    this.func_ToJSON = function(a) {
        return JSON.stringify(a);
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

    function _init() {
        _initColorTable();
        _initInKeyMap();
        _initKeyHitMap();

        addEventListener("keydown", function(event) { 
            if (!_runningFlag) { return; }
            event.preventDefault();
            _lastKey = event.key;
            if (!_inputMode) {
                var kh = _getKeyHit(event);
                if (kh) {
                    _keyHitBuffer.push(kh);
                    _keyDownMap[kh] = true;
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
                }
            }
        });
    };

    _init();
}
