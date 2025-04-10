var GX = new function() {
    var _canvas = null;
	var _ctx = null;
    var _framerate = 60;
    var _bg = [];
    var _images = [];
    var _entities = [];
    var _entities_active = [];
    var _entity_animations = [];
    var _scene = {};
    var _tileset = {};
    var _tileset_tiles = [];
    var _tileset_animations = [];
    var _map = {};
    var _map_layers = [];
    var _map_layer_info = [];
    var _map_loading = false;
    var _gravity = 9.8 * 8;
    var _terminal_velocity = 300;
    var _fonts = new Array(2);
    _fonts[0] = { eid:0, charSpacing:0, lineSpacing: 0};
    _fonts[1] = { eid:0, charSpacing:0, lineSpacing: 0};
    var _font_charmap = new Array(2).fill(new Array(256).fill({x:0,y:0}));
    var _fullscreenFlag = false;
    var __debug = {
        enabled: false,
        font: 1 // GX.FONT_DEFAULT
    };
    var _sounds = [];
    var _sound_muted = false;
    var _mouseButtons = [0,0,0];
    var _mouseWheelFlag = 0;
    var _mousePos = { x:0, y:0 };
    var _mouseInputFlag = false;
    var _touchInputFlag = false;
    var _touchPos = { x:0, y:0 };
    var _bindTouchToMouse = true;

    var _vfs = new VFS();
    var _vfsCwd = null;

    // javascript specific
    var _onGameEvent = null;
    var _pressedKeys = {};

    async function _registerGameEvents(fnEventCallback) {
        _onGameEvent = fnEventCallback;

        // wait for all of the resources to load
        while (!GX.resourcesLoaded()) {
            await _sleep(100);
        }
    }

    function __newFont() {
        return { eid:0, charSpacing:0, lineSpacing: 0}
    }
    
    function _qbBoolean(value) {
        return value ? -1 : 0;
    }

    function _reset() {
        // stop any sounds that are currently playing
        _soundStopAll();
        _framerate = 60;
        _bg = [];
        _images = [];
        _entities = [];
        _entity_animations = [];
        _scene = {};
        _tileset = {};
        _tileset_tiles = [];
        _tileset_animations = [];
        _map = {};
        _map_layers = [];
        _map_layer_info = [];
        _map_loading = false;
        _gravity = 9.8 * 8;
        _terminal_velocity = 300;

        _fonts = new Array(2);
        _fonts[0] = { eid:0, charSpacing:0, lineSpacing: 0};
        _fonts[1] = { eid:0, charSpacing:0, lineSpacing: 0};
        _font_charmap = new Array(2).fill(new Array(256).fill({x:0,y:0}));
        _fontCreateDefault(GX.FONT_DEFAULT);
        _fontCreateDefault(GX.FONT_DEFAULT_BLACK);

        _fullscreenFlag = false;
        __debug = {
            enabled: false,
            font: 1 // GX.FONT_DEFAULT
        };
        _sounds = [];
        _sound_muted = false;
        _mouseButtons = [0,0,0];
        _mouseWheelFlag = 0;
        _mousePos = { x:0, y:0 };
        _mouseInputFlag = false;
    
        _vfsCwd = _vfs.rootDirectory();

        // javascript specific
        _onGameEvent = null;
        _pressedKeys = {};
    }

    // Scene Functions
    // -----------------------------------------------------------------
    function _sceneCreate(width, height) {
        _canvas = document.getElementById("gx-canvas");
        if (!_canvas) {
		    _canvas = document.createElement("canvas");
            _canvas.id = "gx-canvas";
            document.getElementById("gx-container").appendChild(_canvas);

            _canvas.addEventListener("mousemove", function(event) {
                _mousePos.x = event.offsetX;
                _mousePos.y = event.offsetY;
                _mouseInputFlag = true;
            });
    
            _canvas.addEventListener("mousedown", function(event) {
                event.preventDefault();
                if (event.button == 0) { _mouseButtons[0] = -1; }
                else if (event.button == 1) { _mouseButtons[2] = -1; }
                else if (event.button == 2) { _mouseButtons[1] = -1; }
                _mouseInputFlag = true;
            });
    
            _canvas.addEventListener("mouseup", function(event) {
                if (event.button == 0) { _mouseButtons[0] = 0; }
                else if (event.button == 1) { _mouseButtons[2] = 0; }
                else if (event.button == 2) { _mouseButtons[1] = 0; }
                _mouseInputFlag = true;
            });

            _canvas.addEventListener("wheel", function(event) {
                event.preventDefault();
                var move = event.deltaY;
                if (move > 0) { move = 1; }
                else if (move < 0) { move = -1; }
                _mouseWheelFlag += move;
                _mouseInputFlag = true;
            });

            _canvas.addEventListener("contextmenu", function(event) {
                event.preventDefault();
            });

            _canvas.addEventListener("touchmove", function(event) {
                event.preventDefault();
                var touch = event.touches[0];
                var rect = event.target.getBoundingClientRect();
                _touchPos.x = touch.pageX - rect.x;
                _touchPos.y = touch.pageY - rect.y;
                _touchInputFlag = true;
                if (_bindTouchToMouse) {
                    _mousePos = _touchPos;
                    _mouseInputFlag = true;
                }
            });
    
            _canvas.addEventListener("touchstart", function(event) {
                event.preventDefault();
                var touch = event.touches[0];
                var rect = event.target.getBoundingClientRect();
                _touchPos.x = touch.pageX - rect.x;
                _touchPos.y = touch.pageY - rect.y;
                _touchInputFlag = true;
                if (_bindTouchToMouse) {
                    _mouseButtons[0] = -1;
                    _mouseInputFlag = true;
                    _mousePos = _touchPos;
                }
            });
    
            _canvas.addEventListener("touchend", function(event) {
                event.preventDefault();
                _touchInputFlag = false;
                if (_bindTouchToMouse) {
                    _mouseButtons[0] = 0;
                    _mouseInputFlag = true;
                }
            });

            document.addEventListener("fullscreenchange", function(event) {
                if (document.fullscreenElement) {
                    _fullscreenFlag = true;
                    _scene.prevScaleX = _scene.scaleX;
                    _scene.prevScaleY = _scene.scaleY;
                    var widthFactor = screen.width / _scene.width;
                    var heightFactor = screen.height / _scene.height;
                    var factor = Math.min(widthFactor, heightFactor);
                    var offsetX = 0;
                    var offsetY = 0;
                    if (widthFactor > heightFactor) {
                        offsetX = (screen.width - _scene.width * factor) / 2;
                    }
                    else {
                        offsetY = (screen.height - _scene.height * factor) / 2;
                    }
                    
                    _scene.scaleX = factor;
                    _scene.scaleY = factor;
                    _scene.offsetX = offsetX;
                    _scene.offsetY = offsetY;
                }
                else {
                    _fullscreenFlag = false;
                    _scene.scaleX = _scene.prevScaleX;
                    _scene.scaleY = _scene.prevScaleY;
                    _scene.offsetX = 0;
                    _scene.offsetY = 0;
                }
            });

        }
        _canvas.width = width;
        _canvas.height = height;
        _ctx = _canvas.getContext("2d");

        var footer = document.getElementById("gx-footer");
        footer.style.width = width;
        
        _scene.width = width;
        _scene.height = height;
        _scene.x = 0;
        _scene.y = 0;
        _scene.scaleX = 1;
        _scene.scaleY = 1;
        _scene.offsetX = 0;
        _scene.offsetY = 0;
        _scene.frame = 0;
        _scene.followMode = GX.SCENE_FOLLOW_NONE;
        _scene.followEntity = null;
        _scene.constrainMode = GX.SCENE_CONSTRAIN_NONE;
        _scene.active = false;

        _customEvent(GX.EVENT_INIT);
    }

    // Resize the scene with the specified pixel width and height.
    function _sceneResize(swidth, sheight) {
        _scene.width = swidth;
        _scene.height = sheight;
        _canvas.width = _scene.width;
        _canvas.height = _scene.height;
        if (_scene.scaleX != 1) {
            _ctx.imageSmoothingEnabled = false;
            _ctx.scale(_scene.scaleX, _scene.scaleY);
        }
        _updateSceneSize();
    }

    function _updateSceneSize() {
        if (GX.tilesetWidth() < 1 || GX.tilesetHeight() < 1) { return; }
    
        if (GX.mapIsometric()) {
            _scene.columns = Math.floor(GX.sceneWidth() / GX.tilesetWidth())
            _scene.rows = GX.sceneHeight() / (GX.tilesetWidth() / 4)
        }
        else {
            _scene.columns = Math.floor(GX.sceneWidth() / GX.tilesetWidth());
            _scene.rows = Math.floor(GX.sceneHeight() / GX.tilesetHeight());
        }
    }


    // Scale the scene by the specified scale factor.
    function _sceneScale (scale) {
        var lastScale = _scene.scaleX;
        _scene.scaleX = scale;
        _scene.scaleY = scale;
        _canvas.width = _scene.width * _scene.scaleX;
        _canvas.height = _scene.height * _scene.scaleY;
        _ctx.imageSmoothingEnabled = false;
        if (lastScale > 1) { _ctx.scale(1/lastScale, 1/lastScale); }
        _ctx.scale(_scene.scaleX, _scene.scaleY);

        var footer = document.getElementById("gx-footer");
        footer.style.width = _canvas.width;
    }

    function _sceneX() { return _scene.x; }
    function _sceneY() { return _scene.y; }
    function _sceneWidth() { return _scene.width; }
    function _sceneHeight() { return _scene.height; }
    function _sceneColumns() { return _scene.columns; }
    function _sceneRows() { return _scene.rows; }

    
    // Draw the scene.
    // This method is called automatically when GX is managing the event/game loop.
    // Call this method for each page draw event when the event/game loop is being
    // handled externally.
    function _sceneDraw() {
        if (_map_loading) { return; }
        var frame = _scene.frame % GX.frameRate() + 1;

        // If the screen has been resized, resize the destination screen image
        //If _Resize And Not GXSceneEmbedded Then
        //    '_FREEIMAGE _SOURCE
        //    'SCREEN _NEWIMAGE(_RESIZEWIDTH, _RESIZEHEIGHT, 32)
        //    GXSceneWindowSize _ResizeWidth, _ResizeHeight
        //End If

        // Clear the background
		_ctx.clearRect(0, 0, GX.sceneWidth(), GX.sceneHeight());

        // Draw background images, if present
        for (var bi = 1; bi <= _bg.length; bi++) {
            _backgroundDraw(bi);
        }

        // Call out to any custom screen drawing
        _customDrawEvent(GX.EVENT_DRAWBG);

        // Initialize the renderable entities
        _entities_active = [];
        for (var ei=1; ei <= _entities.length; ei++) {
            var e = _entities[ei-1];
            if (!e.screen) {
                if (_rectCollide(e.x, e.y, e.width, e.height, GX.sceneX(), GX.sceneY(), GX.sceneWidth(), GX.sceneHeight())) {
                    _entities_active.push(ei);
                }
            }
        }

        // Draw the map tiles
        GX.mapDraw();

        // Call out to any custom screen drawing
        _customDrawEvent(GX.EVENT_DRAWMAP);

        // Draw the entities
        _drawEntityLayer(0);

        // Draw the screen entities which should appear on top of the other game entities
        // and have a fixed position
        for (var ei = 1; ei <= _entities.length; ei++) {
            var e = _entities[ei-1];
            if (e.screen) {
                _entityDraw(e);
                if (frame % (GX.frameRate() / e.animate) == 0) {
                    GX.entityFrameNext(ei);
                }
            }
        }

        // Call out to any custom screen drawing
        _customDrawEvent(GX.EVENT_DRAWSCREEN);
        if (GX.debug()) { _debugFrameRate(); }

        // Copy the background image to the screen
        _customEvent(GX.EVENT_PAINTBEFORE);
        //_DontBlend
        //_PutImage , __gx_scene.image
        //_Blend
        _customEvent(GX.EVENT_PAINTAFTER);
    }
    
    async function _sceneUpdate() {
        _scene.frame++;
        if (_map_loading) { return; }

        // Call custom game update logic
        _customEvent(GX.EVENT_UPDATE);

        // Check for entity movement and collisions
        // TODO: filter out non-moving entities
        await _sceneMoveEntities();

        // Perform any auto-scene moves
        var sx, sy;
        if (_scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER ||
            _scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER_X ||
            _scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER_X_POS ||
            _scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER_X_NEG) {
            sx = (GX.entityX(_scene.followEntity) + GX.entityWidth(_scene.followEntity) / 2) - GX.sceneWidth() / 2;
            if (sx < GX.sceneX() && _scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER_X_POS ||
                sx > GX.sceneX() && _scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER_X_NEG) {
                // don't move the scene
            } else {
                GX.scenePos(sx, GX.sceneY());
            }
        }
        if (_scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER ||
            _scene.followMode == GX.SCENE_FOLLOW_ENTITY_CENTER_Y) {
            sy = (GX.entityY(_scene.followEntity) + GX.entityHeight(_scene.followEntity) / 2) - GX.sceneHeight() / 2;
            GX.scenePos(GX.sceneX(), sy);
        }

        // Check the scene move constraints
        if (_scene.constrainMode == GX.SCENE_CONSTRAIN_TO_MAP) {
            var mwidth = GX.mapColumns() * GX.tilesetWidth();
            var mheight = GX.mapRows() * GX.tilesetHeight();
            sx = GX.sceneX();
            if (sx < 0) {
                sx = 0
            } else if (sx + GX.sceneWidth() > mwidth) {
                sx = mwidth - GX.sceneWidth();
                if (sx < 0) { sx = 0; }
            }

            sy = GX.sceneY();
            if (sy < 0) {
                sy = 0;
            } else if (sy + GX.sceneHeight() > mheight) {
                sy = mheight - GX.sceneHeight();
                if (sy < 0) { sy = 0; }
            }
            GX.scenePos(sx, sy);
        }
    }

    // Start the game loop.
    // Game events will be sent to the GXOnGameEvent method during the game
    // loop execution.
    async function _sceneStart() {

        _scene.frame = 0;
        _scene.active = true;

        setTimeout(_sceneLoad, 10);

        while (_scene.active) {
            await _sleep(100);
        }
    }

    function _resourcesLoaded() {
        for (var i=0; i < _images.length; i++) {
            if (!_images[i].complete) {
                return false;
            }
        }
        return true;
    }

    function _sceneLoad() {
        if (!_resourcesLoaded()) {
            setTimeout(_sceneLoad, 50);
            return;
        }
        window.requestAnimationFrame(_sceneLoop);
    }

    async function _sceneLoop() {
        if (!_scene.active) { return; }

        await GX.sceneUpdate();
        GX.sceneDraw();

        window.requestAnimationFrame(_sceneLoop);
    }

    // Stop the game loop.
    // This method will cause the game loop to end and return control to the calling program.
    function _sceneStop() {
        _scene.active = false;
    }

    function _sceneFollowEntity (eid, mode) {
        _scene.followEntity = eid;
        _scene.followMode = mode;
    }

    function _sceneConstrain(mode) {
        _scene.constrainMode = mode;
    }

    // Moves the scene position by the number of pixels specified by the dx and dy values.
    // The default position for a scene is (0,0). Negative x and y values are valid.
    // A non-zero value for dx will move the scene by the number of pixels specified to the right or left.
    // A non-zero value for dy will move the scene by the number of pixels specified up or down.
    function _sceneMove (dx, dy) {
        _scene.x = GX.sceneX() + dx;
        _scene.y = GX.sceneY() + dy;
    }

    // Positions the scene at the specified x and y coordinates.
    // The default position for a scene is (0,0). Negative x and y values are valid.
    function _scenePos (x, y) {
        _scene.x = x;
        _scene.y = y;
    }

    function _updateSceneSize() {
        if (GX.tilesetWidth() < 1 || GX.tilesetHeight() < 1) { return; }
        if (GX.mapIsometric()) {
            _scene.columns = Math.floor(GX.sceneWidth() / GX.tilesetWidth());
            _scene.rows = GX.sceneHeight() / (GX.tilesetWidth() / 4);
        } else {
            _scene.columns = Math.floor(GX.sceneWidth() / GX.tilesetWidth());
            _scene.rows = Math.floor(GX.sceneHeight() / GX.tilesetHeight());
        }
    }


    // Event functions
    // --------------------------------------------------------------------
    function _customEvent (eventType) {
        var e = {};
        e.event = eventType
        _onGameEvent(e);
    }

    function _customDrawEvent (eventType) {
        _customEvent(eventType)
    }


    function _keyDown(key) {
        return _qbBoolean(_pressedKeys[key]);
    }

    // Frame Functions
    // -------------------------------------------------------------------
    // Gets or sets the current frame rate (expressed in frames-per-second or FPS).
    function _frameRate (frameRate) {
        if (frameRate != undefined) {
            _framerate = frameRate;
        }
        return _framerate;
    }

    // Returns the current frame.
    // This is a frame counter that starts when GXSceneStart is called.
    // It is initially set to zero and is incremented on each frame.
    function _frame() {
        return _scene.frame;
    }

    // Image Functions
    // ------------------------------------------------------------------
    function _imageLoad(filename, callbackFn) {
        for (var i=0; i < _images.length; i++) {
            if (filename == _images[i].src) {
                return i;
            }
        }
        var img = new Image();
        if (callbackFn != undefined) {
            img.onload = function() { 
                callbackFn(img);
            }
        }

        var file = _vfs.getNode(filename, _vfsCwd);
        if (file && file.type == _vfs.FILE) {
            //img.src = await _vfs.getDataURL(file);
            _vfs.getDataURL(file).then((dataUrl) => {
                img.src = dataUrl;
            });
        }
        else {
            img.src = filename;
        }
        _images.push(img);
        return _images.length;
    }
    
    function _image(imgId) {
        return _images[imgId-1];
    }
    
    function _spriteDraw(i, x, y, seq, frame, swidth, sheight) {
        _spriteDrawScaled(i, x, y, swidth, sheight, seq, frame, swidth, sheight);
    }
    
    function _spriteDrawScaled(i, x, y, dwidth, dheight, seq, frame, swidth, sheight) {
        var xoffset, yoffset;
        xoffset = (frame - 1) * swidth;
        yoffset = (seq - 1) * sheight;
        _ctx.drawImage(_image(i), xoffset, yoffset, swidth, sheight, x, y, dwidth, dheight);
    }
    

    // Background functions
    // ----------------------------------------------------
    // Adds a new background image to the current scene.  Multiple background images may be added to the scene.
    // Background images are displayed in layers based on the order they are added.
    // One of the following modes must be specified:
    //   GXBG_STRETCH - Stretch the background image to the size of the scene.
    //   GXBG_SCROLL  - Fit the height of the background image to the size of the screen. 
    //                  Scroll the horizontal position relative to the position on the map.
    //   GXBG_WRAP    - Continuously wrap the background as the scene is moved.
    function _backgroundAdd (imageFilename, mode) {
        var bg = {};
        bg.mode = mode;
        bg.x = 0;
        bg.y = 0;
        bg.wrapFactor = 1;
        bg.image = _imageLoad(imageFilename);
        
        _bg.push(bg);
        return _bg.length;
    }

    function _backgroundWrapFactor(bi, wrapFactor) {
        _bg[bi-1].wrapFactor = wrapFactor;
    }

    function _backgroundDraw (bi) {
        bi--;

        if (_bg[bi].mode == GX.BG_STRETCH) {
            _ctx.drawImage(_image(_bg[bi].image), 0, 0, _scene.width, _scene.height); // __gx_scene.image
        }

        else if (_bg[bi].mode == GX.BG_SCROLL) {
            var img = _image(_bg[bi].image);
            var factor = GX.sceneWidth() / GX.sceneHeight();
            var h = img.height;
            var w = h * factor;
            var xfactor = GX.sceneX() / (GX.mapColumns() * GX.tilesetWidth())
            var x = xfactor * (img.width - w); 
            _ctx.drawImage(img, x, 0, w, h, 0, 0, GX.sceneWidth(), GX.sceneHeight());
        }

        else if (_bg[bi].mode == GX.BG_WRAP) {
            _backgroundDrawWrap(bi);
        }
    }

    function _backgroundDrawWrap(bi) {
        var img;
        var x, y, x2, y2, xx, yy, w, h;
        var wrapFactor;

        img = _image(_bg[bi].image);
        wrapFactor = _bg[bi].wrapFactor;

        x = Math.floor((GX.sceneX() * wrapFactor) % img.width);
        y = Math.floor((GX.sceneY() * wrapFactor) % img.height);
        if (x < 0) { x = img.width + x; }
        if (y < 0) { y = img.height + y; }
        x2 = GX.sceneWidth() + x;
        y2 = GX.sceneHeight() + y;

        _ctx.drawImage(img, x, y, GX.sceneWidth(), GX.sceneHeight(), 0, 0, GX.sceneWidth(), GX.sceneHeight());

        if (x2 > img.width) {
            w = x2 - img.width;
            xx = GX.sceneWidth() - w;

            _ctx.drawImage(img, 0, y, w, GX.sceneHeight(), xx, 0, w, GX.sceneHeight());
        }

        if (y2 > img.height) {
            h = y2 - img.height;
            yy = GX.sceneHeight() - h;

            _ctx.drawImage(img, x, 0, GX.sceneWidth(), h, 0, yy, GX.sceneWidth(), h);
        }

        if (x2 > img.width && y2 > img.height) {
            w = x2 - img.width;
            h = y2 - img.height;
            xx = GX.sceneWidth() - w;
            yy = GX.sceneHeight() - h;

            _ctx.drawImage(img, 0, 0, w, h, xx, yy, w, h);
        }
    }

    // Removes all background images from the scene.
    function _backgroundClear() {
        _bg.length = 0;
    }


    // Sound Methods
    // ----------------------------------------------------------------------------
    function _soundClose (sid) {
        _sounds[sid-1].pause();
        _sounds[sid-1] = undefined;
    }

    async function _soundLoad (filename) {
        var file = _vfs.getNode(filename, _vfsCwd);
        if (file && file.type == _vfs.FILE) {
            var dataUrl = await _vfs.getDataURL(file);
            var a = new Audio(dataUrl);
            _sounds.push(a);
        }
        else {
            var a = new Audio(filename);
            _sounds.push(a);
        }

        return _sounds.length;
    }

    function _soundPlay (sid) {
        if (!GX.soundMuted()) {
            _sounds[sid-1].loop = false;
            _sounds[sid-1].play();
        }
    }

    function _soundRepeat (sid) {
        if (!GX.soundMuted()) {
            _sounds[sid-1].loop = true;
            _sounds[sid-1].play();
        }
    }

    function _soundVolume (sid, v) {
        _sounds[sid-1].volume = v / 100;
    }

    function _soundPause (sid) {
        _sounds[sid-1].pause();
    }

    function _soundStop (sid) {
        _sounds[sid-1].pause();
        _sounds[sid-1].currentTime = 0;
    }

    function _soundStopAll () {
        for (var i=0; i < _sounds.length; i++) {
            if (_sounds[i]) {
                _soundStop(i+1);
            }
        }
    }

    function _soundMuted (muted) {
        if (muted != undefined) {
            _sound_muted = muted;
            // TODO: loop through list of loaded sounds so they can all be muted / unmuted
        }
        return _qbBoolean(_sound_muted);
    }
    
    // Entity Functions
    // -----------------------------------------------------------------------------
    function _entityCreate (imageFilename, ewidth, height, seqFrames, uid) {
        var newent = {};
        newent.x = 0;
        newent.y = 0;
        newent.vx = 0;
        newent.vy = 0;
        newent.jumpstart = 0;
        newent.height = height;
        newent.width = ewidth;
        newent.sequences = 1;
        newent.image = _imageLoad(imageFilename, function() {
            newent.sequences = Math.floor(_images[newent.image-1].height / height);
        });
        newent.spriteFrame = 1;
        newent.spriteSeq = 1;
        newent.seqFrames = seqFrames;
        newent.hidden = false;
        newent.animateMode = GX.ANIMATE_LOOP;
        newent.coLeft = 0;
        newent.coTop = 0;
        newent.coRight = 0;
        newent.coBottom = 0;
        newent.applyGravity = false;
        newent.sequences = 0;
        newent.mapLayer = 0;

        _entities.push(newent);
        
        var animation = [];
        _entity_animations.push(animation);
        
        return _entities.length;
    }
    
    function _screenEntityCreate (imageFilename, ewidth, height, seqFrames, uid) {
        var eid = _entityCreate(imageFilename, ewidth, height, seqFrames, uid);
        _entities[eid-1].screen = true;
        return eid;
    }

    function _entityDraw (ent) {
        if (ent.hidden) { return; }
        var x, y;
        if (ent.screen) {
            x = ent.x
            y = ent.y
        } else {
            x = ent.x - GX.sceneX()
            y = ent.y - GX.sceneY()
    	}
        GX.spriteDraw(ent.image, x, y, ent.spriteSeq, ent.spriteFrame, ent.width, ent.height); //, __gx_scene.image)
    }    

    function _entityAnimate (eid, seq, a) {
        _entities[eid-1].animate = a;
        _entities[eid-1].spriteSeq = seq;
        _entities[eid-1].seqFrames = _entityGetFrames(eid, seq); //_entity_animations[eid-1][seq-1].frames;
        _entities[eid-1].prevFrame = -1;
        if (_entities[eid-1].spriteFrame > _entities[eid-1].seqFrames) {
            _entities[eid-1].spriteFrame = 1;
        }
    }

    function _entityGetFrames (eid, seq) {
        var a = _entity_animations[eid-1];
        if (a[seq-1] == undefined) {
            return _entities[eid-1].seqFrames;
        }
        else {
            return a[seq-1].frames;
        }
    }

    function _entityAnimateStop (eid) {
        _entities[eid-1].animate = 0;
    }

    function _entityAnimateMode (eid, mode) {
        if (mode != undefined) {
        	_entities[eid-1].animateMode = mode;
        }
        return _entities[eid-1].animateMode;
    }

    function _entityMove (eid, x, y) {
        if (eid == undefined || eid < 1) { return; }
        _entities[eid-1].x += x;
        _entities[eid-1].y += y;
    }

	function _entityPos (eid, x, y) {
        _entities[eid-1].x = x;
        _entities[eid-1].y = y;
    }

    function _entityVX (eid, vx) {
        if (vx != undefined) {
            _entities[eid-1].vx = vx;
        }
        return _entities[eid-1].vx;
    }

    function _entityVY (eid, vy) {
        if (vy != undefined) {
        	_entities[eid-1].vy = vy;
        }
        return _entities[eid-1].vy;
    }

    function _entityVisible (eid, visible) {
        if (visible != undefined) {
            _entities[eid-1].hidden = !visible;
        }
        return _qbBoolean(!_entities[eid-1].hidden);
    }

    function _entityX (eid) { return _entities[eid-1].x; }
    function _entityY (eid) { return _entities[eid-1].y; }
    function _entityWidth (eid) { return _entities[eid-1].width; }
    function _entityHeight (eid) { return _entities[eid-1].height; }
    
    
    function _entityFrameNext (eid) {
        if (_entities[eid-1].animateMode == GX.ANIMATE_SINGLE) {
            if (_entities[eid-1].spriteFrame + 1 > _entities[eid-1].seqFrames) {
                if (_entities[eid-1].spriteFrame != _entities[eid-1].prevFrame) {
                    // Fire animation complete event
                    var e = {};
                    e.event = GX.EVENT_ANIMATE_COMPLETE;
                    e.entity = eid;
                    _onGameEvent(e);
                    _entities[eid-1].prevFrame = _entities[eid-1].spriteFrame;
                }
                return;
            }
        }

        _entities[eid-1].prevFrame = _entities[eid-1].spriteFrame;
        _entities[eid-1].spriteFrame = _entities[eid-1].spriteFrame + 1;
        if (_entities[eid-1].spriteFrame > _entities[eid-1].seqFrames) {
            _entities[eid-1].spriteFrame = 1;
        }
    }

    function _entityFrameSet (eid, seq, frame) {
        _entities[eid-1].spriteSeq = seq;
        _entities[eid-1].seqFrames = _entityGetFrames(eid, seq);
        _entities[eid-1].spriteFrame = frame;
        _entities[eid-1].prevFrame = frame - 1;
    }

    function _entityFrame (eid) {
        return _entities[eid-1].spriteFrame;
    }

    function _entitySequence (eid) {
        return _entities[eid-1].spriteSeq;
    }

    function _entitySequences (eid) {
        return _entities[eid-1].sequences;
    }

    function _entityFrames (eid, seq, frames) {
        console.log(eid + ":" + seq + ":" + frames);
        if (frames != undefined) {
            _entity_animations[eid-1][seq-1] = { frames: frames };
        }
        return _entityGetFrames(eid, seq); //_entity_animations[eid-1][seq-1].frames;
    }

    function _entityType (eid, etype) {
        if (etype != undefined) {
        	_entities[eid-1].type = etype;
        }
        return _entities[eid-1].type
	}

    function _entityMapLayer (eid, layer) {
        if (layer != undefined) {
            _entities[eid-1].mapLayer = layer;
        }
        return _entities[eid-1].mapLayer;
    }

    function _drawEntityLayer (layer) {
        var frame = _scene.frame % GX.frameRate() + 1;

        for (var i=0; i < _entities_active.length; i++) {
            var ei = _entities_active[i];
            var e = _entities[ei-1];
            if (e.mapLayer == layer) {
                _entityDraw(e);
                if (e.animate > 0) {
                    if (frame % (GX.frameRate() / e.animate) == 0) {
                        GX.entityFrameNext(ei);
                    }
                }
            }
        }
    }

    function _entityApplyGravity (eid, gravity) {
        if (gravity != undefined) {
            _entities[eid-1].applyGravity = gravity;
            _entities[eid-1].jumpstart = GX.frame();
        }
        return _entities[eid-1].applyGravity;
    }

    function _entityCollisionOffset (eid, left, top, right, bottom) {
        _entities[eid-1].coLeft = left;
        _entities[eid-1].coTop = top;
        _entities[eid-1].coRight = right;
        _entities[eid-1].coBottom = bottom;
    }

    function _entityCollisionOffsetLeft (eid) {
        return _entities[eid-1].coLeft;
    }

    function _entityCollisionOffsetTop (eid) {
        return _entities[eid-1].coTop;
    }

    function _entityCollisionOffsetRight (eid) {
        return _entities[eid-1].coRight;
    }

    function _entityCollisionOffsetBottom (eid) {
        return _entities[eid-1].coBottom;
    }


    // Map methods
    // ------------------------------------------------------------------
    function _mapCreate (columns, rows, layers) {
        _map.columns = columns;
        _map.rows = rows;
        _map.layers = layers;
        _map.version = 2;
        _map.isometric = false;

        var layerSize = rows * columns;
        _map_layers = [];
        for (var i=0; i < layers; i++) {
            _map_layers.push(_mapLayerInit());
        }
        _map_layer_info = [];
        for (var i=0; i < layers; i++) {
            _map_layer_info.push({
                id: i+1,
                hidden: false
            });
        }
    }

    async function _mapLoad(filename) {
        try {
            var file = _vfs.getNode(filename, _vfsCwd);
            if (file && file.type == _vfs.FILE) {
                await _mapLoadV2(filename);
                return;
            }
            else {
                var tmpDir = _vfs.getNode("_gxtmp", _vfs.rootDirectory());
                if (!tmpDir) { tmpDir = _vfs.createDirectory("_gxtmp", _vfs.rootDirectory()); }
                file = _vfs.createFile(crypto.randomUUID(), tmpDir);  
                var res = await fetch(filename);
                _vfs.writeData(file, await res.arrayBuffer());
                await _mapLoadV2(_vfs.fullPath(file));
                _vfs.removeFile(file);
                return;
            }
        }
        catch (ex) {
            // if the load fails try falling back to the older JSON format
            _map_loading = true;
            var data = null;
            var file = _vfs.getNode(filename, _vfsCwd);
            if (file && file.type == _vfs.FILE) {
                data = JSON.parse(_vfs.readText(file));
            }
            else {
                data = await _getJSON(filename);
            }
            var parentPath = filename.substring(0, filename.lastIndexOf("/")+1);
            var imagePath = data.tileset.image.substring(data.tileset.image.lastIndexOf("/")+1);
            GX.tilesetCreate(parentPath + imagePath, data.tileset.width, data.tileset.height, data.tileset.tiles, data.tileset.animations);
            GX.mapCreate(data.columns, data.rows, data.layers.length);
            if (data.isometric) {
                GX.mapIsometric(true);
            }
            for (var layer=0; layer < data.layers.length; layer++) {
                for (var row=0; row < GX.mapRows(); row++) {
                    for (var col=0; col < GX.mapColumns(); col++) {
                        GX.mapTile(col, row, layer+1, data.layers[layer][row * GX.mapColumns() + col]);
                    }
                }
            }
            _map_loading = false;
        }
    }
    
    async function _mapLoadV2(filename) {
        _map_loading = true;
        var vfs = GX.vfs();
        var fh = { 
            file: vfs.getNode(filename, vfs.rootDirectory()), 
            pos: 0 
        };
    
        var tmpDir = vfs.getNode("_gxtmp", vfs.rootDirectory());
        if (!tmpDir) { tmpDir = vfs.createDirectory("_gxtmp", vfs.rootDirectory()); }
        
        var version = readInt(fh);
        var columns = readInt(fh);
        var rows = readInt(fh);
        var layers = readInt(fh);
        var isometric = readInt(fh);
        
        slen = readLong(fh);
        
        var data = vfs.readData(fh.file, fh.pos, slen)
        fh.pos += data.byteLength;
        
        // write the raw data out and read it back in as a string
        var ldataFile = vfs.createFile("layer.dat", tmpDir);
        vfs.writeData(ldataFile, data);
        ldataFile = vfs.getNode("layer.dat", tmpDir);
        var ldstr = vfs.readText(ldataFile);//', ldstr);
        vfs.removeFile(ldataFile, tmpDir);
        
        // inflate the compressed data and write it to a temp file
        var ldata = pako.inflate(vfs.textToData(ldstr));
        ldataFile = vfs.createFile("layer-i.dat", tmpDir);
        vfs.writeData(ldataFile, ldata);
    
        // read the data
        ldataFile = vfs.getNode("layer-i.dat", tmpDir);
        ldata = vfs.readData(ldataFile, 0, ldataFile.data.byteLength)
        ldata = new Int16Array(ldata);
        vfs.removeFile(ldataFile, tmpDir);
    
        // read the tileset data
        var tsVersion = readInt(fh);
        var tsFilename = readString(fh);
        var tsWidth = readInt(fh);
        var tsHeight = readInt(fh);
        var tsSize = readLong(fh);
        
        data = vfs.readData(fh.file, fh.pos, tsSize);
        var pngFile = vfs.createFile("tileset.png", tmpDir)
        vfs.writeData(pngFile, data);
        fh.pos += data.byteLength;
    
        fh.pos++;
        
        // read the tileset tiles data
        var asize = readInt(fh);
        var tiles = [];
        for (var i=0; i < 4; i++) { readInt(fh); } //' read the blank 0th element
        for (var i=1; i <= asize; i++) {
            readInt(fh); // not using id currently
            tiles.push([readInt(fh), readInt(fh), readInt(fh)]);
        }
    
        // read the tileset animations data
        asize = readInt(fh);
        var animations = [];
        for (var i=0; i < 3; i++) { readInt(fh); } //' read the first row
        for (var i=1; i <= asize; i++) {
            animations.push([readInt(fh), readInt(fh), readInt(fh)]);
        }
    
        GX.tilesetCreate("/_gxtmp/tileset.png", tsWidth, tsHeight, tiles, animations);
        GX.mapCreate(columns, rows, layers);
        if (isometric) {
            GX.mapIsometric(true);
        }
        var li = 0
        for (var l=0; l <= GX.mapLayers(); l++) {
            if (l > 0) { li++; }
            for (var row=0; row < GX.mapRows(); row++) {
                for (var col=0; col < GX.mapColumns(); col++) {
                    if (l > 0) {
                        GX.mapTile(col, row, l, ldata[li]);
                    }
                    li++;
                }
            }
        }
        
        function readInt(fh) {
            var data = vfs.readData(fh.file, fh.pos, 2);
            var value = (new DataView(data)).getInt16(0, true);
            fh.pos += data.byteLength;
            return value;
        }
        
        function readLong(fh) {
            var data = vfs.readData(fh.file, fh.pos, 4);
            var value = (new DataView(data)).getInt32(0, true);
            fh.pos += data.byteLength;
            return value;
        }
        
        function readString(fh) {
            var slen = readLong(fh);
            data = vfs.readData(fh.file, fh.pos, slen)
            var value = String.fromCharCode.apply(null, new Uint8Array(data))
            fh.pos += data.byteLength;
            return value;
        }
        _map_loading = false;
    }
    
    async function _mapSave (filename) {
        var vfs = GX.vfs();
        var parentPath = vfs.getParentPath(filename);
        filename = vfs.getFileName(filename);
    
        // create the parent path
        var dirs = parentPath.split("/");
        var parentDir = vfs.rootDirectory();
        for (var i=0; i < dirs.length; i++) {
            if (dirs[i] == "") { continue; }
            var p = vfs.getNode(dirs[i], parentDir);
            if (!p) { p = vfs.getNode(dirs[i], parentDir); }
            parentDir = p;
        }
    
        var tmpDir = vfs.getNode("_gxtmp", vfs.rootDirectory());
        if (!tmpDir) { tmpDir = vfs.createDirectory("_gxtmp", vfs.rootDirectory()); }
    
        var file = vfs.createFile(filename, parentDir);
        var fh = { file: file, pos: 0 };
        
        writeInt(fh, 2); // version
        writeInt(fh, GX.mapColumns());
        writeInt(fh, GX.mapRows());
        writeInt(fh, GX.mapLayers());
        writeInt(fh, GX.mapIsometric());
        
        var size = (GX.mapLayers() + 1) * GX.mapColumns() * GX.mapRows() + GX.mapLayers();
        var ldata = new ArrayBuffer(size * 2 + 4);
        var dview = new DataView(ldata);
        var li = GX.mapColumns() * GX.mapRows() * 2 + 1;
        for (var l=1; l <= GX.mapLayers(); l++) {
            if (l > 1) { li+=2; }
            for (var row=0; row < GX.mapRows(); row++) {
                for (var col=0; col < GX.mapColumns(); col++) {
                    if (l == 0) { 
                        dview.setInt16(li+1, 0, true);
                    }
                    else {
                        dview.setInt16(li+1, GX.mapTile(col, row, l), true);
                    }
                    li+=2;
                }
            }
        }

        var cdata = pako.deflate(ldata);
        writeLong(fh, cdata.byteLength);
        vfs.writeData(fh.file, cdata, fh.pos);
        fh.pos += cdata.byteLength;

        // write the tileset data
        writeInt(fh, 2); // version
        writeString(fh, "tileset.gxi");
        writeInt(fh, GX.tilesetWidth());
        writeInt(fh, GX.tilesetHeight());
        
        // write the tileset png data
        var tsfile = vfs.getNode(_tileset.filename);
        writeLong(fh, tsfile.data.byteLength);
        vfs.writeData(fh.file, tsfile.data, fh.pos);
        fh.pos += tsfile.data.byteLength;
        fh.pos++;
        
        // write the tileset tiles data  
        writeInt(fh, _tileset_tiles.length);
        for (var i=0; i < 4; i++) { writeInt(fh, 0); }
        for (var i=0; i < _tileset_tiles.length; i++) {
            writeInt(fh, 0);//i+1);
            writeInt(fh, _tileset_tiles[i].animationId);
            writeInt(fh, _tileset_tiles[i].animationSpeed);
            writeInt(fh, _tileset_tiles[i].animationFrame);
        }

        // write the tileset animations data
        writeInt(fh, _tileset_animations.length);
        for (var i=0; i < 3; i++) { writeInt(fh, 0); }
        for (var i=0; i < _tileset_animations.length; i++) {
            writeInt(fh, _tileset_animations[i].tileId);
            writeInt(fh, _tileset_animations[i].firstFrame);
            writeInt(fh, _tileset_animations[i].nextFrame);
        }
        
    
        function writeInt(fh, value) {
            var data = new Int16Array([value]).buffer;
            vfs.writeData(fh.file, data, fh.pos);
            fh.pos = fh.pos + data.byteLength
        }
        
        function writeLong(fh, value) {
            var data = new Int32Array([value]).buffer; 
            vfs.writeData(fh.file, data, fh.pos);
            fh.pos = fh.pos + data.byteLength
        }
        
        function writeString(fh, value) {
            var slen = value.length;
            writeLong(fh, slen);
            var data = vfs.textToData(value);
            vfs.writeData(fh.file, data, fh.pos);
            fh.pos = fh.pos + data.byteLength
        }
    }
    
    function _getJSON(url) {
        return fetch(url)
            .then((response)=>response.json())
            .then((responseJson)=>{return responseJson});
    }

    function _mapLayerInit(cols, rows) {
        if (cols == undefined) { cols = _map.columns; }
        if (rows == undefined) { rows = _map.rows; }
        var layerSize = rows * cols;
        var layerData = [];
        for (var i=0; i < layerSize; i++) {
            layerData.push({ tile: 0});
        }
        return layerData;
    }

    function _mapColumns() { return _map.columns; }
    function _mapRows() { return _map.rows; }
    function _mapLayers() { return _map.layers; }

    function _mapLayerVisible(layer, visible) {
        if (visible != undefined) {
            _map_layer_info[layer-1].hidden = !visible;
        }
        return _qbBoolean(!_map_layer_info[layer-1].hidden);
    }

    function _mapIsometric(iso) {
        if (iso != undefined) {
            _map.isometric = iso;
            _updateSceneSize();
        }
        return _qbBoolean(_map.isometric);
    }

    function _mapLayerAdd() {
        _map.layers++;
        _map_layer_info.push({
            id: _map.layers,
            hidden: false
        });
        _map_layers.push(_mapLayerInit());
    }

    function _mapLayerInsert (beforeLayer) {
        if (beforeLayer < 1 || beforeLayer > GX.mapLayers()) { return; }

        GX.mapLayerAdd();
        for (var layer = GX.mapLayers(); layer > beforeLayer; layer--) {
            for (var tile = 0; tile <= GX.mapRows() * GX.mapColumns(); tile++) {
                _map_layers[layer-1][tile] = _map_layers[layer - 2][tile];
            }
        }
        _map_layers[beforeLayer-1] = _mapLayerInit();
    }

    function _mapLayerRemove (removeLayer) {
        if (removeLayer < 1 || removeLayer > GX.mapLayers() || GX.mapLayers < 2) { return; }

        for (var layer = removeLayer; layer < GX.mapLayers(); layer++) {
            for (var tile = 0; tile <= GX.mapRows() * GX.mapColumns(); tile++) {
                _map_layers[layer-1][tile] = _map_layers[layer][tile];
            }
        }
        _map_layer_info.pop();
        _map_layers.pop();
        _map.layers = GX.mapLayers() - 1;
    }


    function _mapResize (columns, rows) {
        var tempMap = structuredClone(_map_layers);
        _map_layers = new Array(GX.mapLayers());

        var maxColumns = 0;
        var maxRows = 0;
        if (columns > GX.mapColumns()) {
            maxColumns = GX.mapColumns();
        }
        else {
            maxColumns = columns;
        }
        if (rows > GX.mapRows) {
            maxRows = GX.mapRows();
        }
        else {
            maxRows = rows;
        }

        for (var layer = 1; layer <= GX.mapLayers(); layer++) {
            _map_layers[layer-1] = _mapLayerInit(columns, rows);
            for (var row = 0; row < maxRows; row++) {
                for (var column = 0; column < maxColumns; column++) {
                    if (column >= GX.mapColumns() || row >= GX.mapRows()) {
                        _map_layers[layer-1][row * columns + column].tile = 0;
                    }
                    else { //if (GX.mapColumns() > column && GX.mapRows() > rows) {
                        _map_layers[layer-1][row * columns + column].tile = tempMap[layer-1][row * GX.mapColumns() + column].tile;
                    }
                }
            }
        }

        _map.columns = columns;
        _map.rows = rows;
    }

    function _mapDraw() {
        if (_mapRows() < 1) { return; }

        var tpos = {};
        var srow, scol, row, col;
        var layer;
        var yoffset, prow;
        var t, tx, ty;
        var rowOffset;
        var colOffset;

        var xoffset = GX.sceneX() % GX.tilesetWidth();
        var pcol = Math.floor(GX.sceneX() / GX.tilesetWidth());
        if (GX.mapIsometric()) {
            prow = Math.floor(GX.sceneY() / (GX.tilesetWidth() / 4));
            yoffset = GX.sceneY() % (GX.tilesetWidth() / 4);
        } else {
            prow = Math.floor(GX.sceneY() / GX.tilesetHeight());
            yoffset = GX.sceneY() % GX.tilesetHeight();
        }

        for (var li = 1; li <= GX.mapLayers(); li++) {
            if (!_map_layer_info[li-1].hidden) {
                layer = _map_layer_info[li-1].id;

                srow = 0;
                rowOffset = 0;

                for (row = prow; row <= prow + GX.sceneRows() + 1; row++) { //TODO: currently rendering too many rows for isometric maps
                    scol = 0;
                    if (!GX.mapIsometric()) {
                        colOffset = 0;
                    } else {
                        colOffset = 0;
                        if (row % 2 == 0) { colOffset = GX.tilesetWidth() / 2; }
                    }

                    if (GX.mapIsometric()) {
                        rowOffset = (row - prow + 1) * (GX.tilesetHeight() - GX.tilesetWidth() / 4);
                    }

                    for (col = pcol; col <= pcol + GX.sceneColumns() + 1; col++) {
                        t = GX.mapTile(col, row, layer);
                        if (t > 0) {
                            var t1 = t;
                            t = _tileFrame(t);
                            GX.tilesetPos(t, tpos);
                            tx = Math.floor(scol * GX.tilesetWidth() - xoffset - colOffset);
                            ty = Math.floor(srow * GX.tilesetHeight() - yoffset - rowOffset);
                            GX.spriteDraw(GX.tilesetImage(), tx, ty, tpos.y, tpos.x, GX.tilesetWidth(), GX.tilesetHeight());//, __gx_scene.image
                        }
                        scol = scol + 1;
                    }
                    srow = srow + 1;
                }
            } // layer is not hidden
            _drawEntityLayer(li);
        }

        // Perform tile animation
        for (t = 1; t <= GX.tilesetColumns() * GX.tilesetRows(); t++) {
            _tileFrameNext(t);
        }
    }

    function _mapTilePosAt (x, y, tpos) {
        if (!GX.mapIsometric()) {
            tpos.x = Math.floor((x + GX.sceneX()) / GX.tilesetWidth());
            tpos.y = Math.floor((y + GX.sceneY()) / GX.tilesetHeight());
        } else {
            var tileWidthHalf = GX.tilesetWidth() / 2;
            var tileHeightHalf = GX.tilesetHeight() / 2;
            var sx = x / tileWidthHalf;

            var offset = 0;
            if (sx % 2 == 1) {
                offset = tileWidthHalf;
            }

            tpos.y = (2 * y) / tileHeightHalf;
            tpos.x = (x - offset) / GX.tilesetWidth();
        }
    }

    function _mapTile (col, row, layer, tile) {
        if (col < 0 || col >= GX.mapColumns() || row < 0 || row >= GX.mapRows() || layer > GX.mapLayers()) { return 0; }
        var mpos = row * GX.mapColumns() + col;
        if (tile >= 0) {
            if (col >= 0 && col <= GX.mapColumns() && row >= 0 && row < GX.mapRows()) {
                _map_layers[layer-1][mpos].tile = tile;
            }
        }
        return _map_layers[layer-1][mpos].tile;
    }
/*

    Function GXMapTileDepth (col As Integer, row As Integer)
        If col < 0 Or col >= GXMapColumns Or row < 0 Or row >= GXMapRows Then
            GXMapTileDepth = 0
        Else
            Dim layer As Integer
            For layer = GXMapLayers To 1 Step -1
                If GXMapTile(col, row, layer) > 0 Then
                    GXMapTileDepth = layer
                    Exit Function
                End If
            Next layer
            GXMapTileDepth = 0
        End If
    End Function

    Sub GXMapTileAdd (col As Integer, row As Integer, tile As Integer)
        If tile < 1 Then Exit Sub
        'TODO: check for tile greater than max and exit early

        If (col >= 0 And col <= GXMapColumns And row >= 0 And row <= GXMapRows) Then
            Dim layer As Integer
            For layer = 1 To GXMapLayers
                If GXMapTile(col, row, layer) = 0 Then
                    GXMapTile col, row, layer, tile
                    Exit Sub
                End If
            Next layer
        End If
    End Sub

    Sub GXMapTileRemove (col As Integer, row As Integer)
        If (col >= 0 And col <= GXMapColumns And row >= 0 And row < GXMapRows) Then
            Dim layer As Integer
            For layer = GXMapLayers To 1 Step -1
                If GXMapTile(col, row, layer) Then
                    GXMapTile col, row, layer, 0
                    Exit Sub
                End If
            Next layer
        End If
    End Sub
    */

    function _mapVersion() {
        return _map.version
    }


    // Tileset Methods
    // ----------------------------------------------------------------------------
    async function _tilesetCreate (tilesetFilename, tileWidth, tileHeight, tiles, animations) {
        await GX.tilesetReplaceImage(tilesetFilename, tileWidth, tileHeight);

        _tileset_tiles = [];
        if (tiles != undefined) {
            for (var i=0; i < tiles.length; i++) {
                var tile = tiles[i];
                _tileset_tiles.push({
                    id: i+1,
                    animationId: tile[0],
                    animationSpeed: tile[1],
                    animationFrame: tiles[2]
                });
            }
        }
        else {
            for (var i=0; i < GX.tilesetColumns() * GX.tilesetRows(); i++) {
                _tileset_tiles.push({
                    id: i+1,
                    animationId: 0,
                    animationSpeed: 0,
                    animationFrame: 0
                });
            }
        }

        _tileset_animations = [];
        if (animations != undefined) {
            for (var i=0; i < animations.length; i++) {
                var animation = animations[i];
                _tileset_animations.push({
                    tileId: animation[0],
                    firstFrame: animation[1],
                    nextFrame: animation[2]
                });
            }
        }
    }

    async function _tilesetReplaceImage (tilesetFilename, tilewidth, tileheight) {
        _tileset.filename = tilesetFilename;
        _tileset.width = tilewidth;
        _tileset.height = tileheight;
        var imgLoaded = false;
        _tileset.image = _imageLoad(tilesetFilename, function(img) {
            _tileset.columns = img.width / GX.tilesetWidth();
            _tileset.rows = img.height / GX.tilesetHeight();
            _updateSceneSize();
            imgLoaded = true;
        });
        var waitMillis = 0;
        while (!imgLoaded & waitMillis < 3000) {
            await GX.sleep(10);
            waitMillis += 10;
        }
    }
/*
    Sub GXTilesetLoad (filename As String)
        Open filename For Binary As #1
        __GX_TilesetLoad
        Close #1
    End Sub

    Sub __GX_TilesetLoad
        Dim version As Integer
        version = 1

        ' Save the tileset version
        Get #1, , version

        ' Save the tileset image meta-data
        __gx_tileset.filename = __GX_ReadString
        Get #1, , __gx_tileset.width
        Get #1, , __gx_tileset.height

        ' Read the tileset image data and save to a temporary location
        Dim tsize As Long
        Get #1, , tsize
        Dim tmpfile As String
        Dim tilesetFilename As String
        Dim bytes(tsize) As _Unsigned _Byte
        tmpfile = GXFS_RemoveFileExtension(GXFS_GetFilename(GXTilesetFilename)) + ".gxi"
        If Not _DirExists("./tmp") Then MkDir ("./tmp")
        tilesetFilename = "./tmp/" + tmpfile
        Get #1, , bytes()
        Open tilesetFilename For Binary As #2
        Put #2, , bytes()
        Close #2
        GXTilesetCreate tilesetFilename, GXTilesetWidth, GXTilesetHeight

        ' Read the tileset tile data
        Dim asize As Integer
        Get #1, , asize
        ReDim __gx_tileset_tiles(asize) As GXTile
        Get #1, , __gx_tileset_tiles()

        ' Read the tileset animation data
        Get #1, , asize
        ReDim __gx_tileset_animations(asize) As GXTileFrame
        Get #1, , __gx_tileset_animations()
    End Sub

    Sub GXTilesetSave (filename As String)
        Open filename For Binary As #1
        __GX_TilesetSave
        Close #1
    End Sub

    Sub __GX_TilesetSave
        Dim version As Integer
        version = 1

        ' Save the tileset version
        Put #1, , version

        ' Save the tileset image meta-data
        __GX_WriteString GXTilesetFilename
        Put #1, , __gx_tileset.width
        Put #1, , __gx_tileset.height

        ' Save the tileset image data
        Dim tsize As Long
        Open GXTilesetFilename For Binary As #2
        tsize = LOF(2)
        Put #1, , tsize

        Dim bytes(tsize) As _Unsigned _Byte
        Get #2, , bytes()
        Put #1, , bytes()
        Close #2

        ' Save the tileset tile data
        Dim asize As Integer
        asize = UBound(__gx_tileset_tiles)
        Put #1, , asize
        Put #1, , __gx_tileset_tiles()

        ' Save the tileset animation data
        asize = UBound(__gx_tileset_animations)
        Put #1, , asize
        Put #1, , __gx_tileset_animations()
    End Sub
*/
    function _tilesetPos (tilenum, p) {
        if (GX.tilesetColumns() == 0) {
            p.x = 0;
            p.y = 0;
        } else {
            p.y = Math.floor((tilenum - 1) / GX.tilesetColumns());
            p.y = p.y + 1;
            p.x = (tilenum - 1) % GX.tilesetColumns() + 1;
        }
    }

    function _tilesetWidth() { return _tileset.width; }
    function _tilesetHeight() { return _tileset.height; }
    function _tilesetColumns() { return _tileset.columns; }
    function _tilesetRows() { return _tileset.rows; }
    function _tilesetFilename() { return _tileset.filename; }
    function _tilesetImage() { return _tileset.image; }


    function _tilesetAnimationCreate (tileId, animationSpeed) {
        var frameId = _tileset_animations.length;
        _tileset_animations[frameId] = { tileId: 0, firstFrame: 0, nextFrame: 0 };
        _tileset_animations[frameId].tileId = tileId;
        _tileset_animations[frameId].firstFrame = frameId + 1;
        _tileset_tiles[tileId-1].animationId = frameId + 1;
        _tileset_tiles[tileId-1].animationSpeed = animationSpeed;
    }

    function _tilesetAnimationAdd (firstTileId, addTileId) {
        var firstFrame = _tileset_tiles[firstTileId-1].animationId;

        // find the last frame
        var lastFrame  = firstFrame;
        while (_tileset_animations[lastFrame-1].nextFrame > 0) {
            lastFrame = _tileset_animations[lastFrame-1].nextFrame;
        }

        var frameId = _tileset_animations.length;
        _tileset_animations[frameId] = { tileId: 0, firstFrame: 0, nextFrame: 0 };
        _tileset_animations[frameId].tileId = addTileId;
        _tileset_animations[frameId].firstFrame = firstFrame;
        _tileset_animations[lastFrame-1].nextFrame = frameId + 1;
    }

    function _tilesetAnimationRemove (firstTileId) {
        // TODO: replace with implementation that will remove unused
        //       animation data from the array
        _tileset_tiles[firstTileId-1].animationId = 0;
    }

    function _tilesetAnimationFrames (tileId, tileFrames /* QB Array */) {
        if (tileId < 0 || tileId > GX.tilesetRows() * GX.tilesetColumns()) { return 0; }

        GX.resizeArray(tileFrames, [{l:0,u:0}], 0);
        var frameCount = 0;
        var frame = _tileset_tiles[tileId-1].animationId;
        while (frame > 0) {
            frameCount = frameCount + 1
            GX.resizeArray(tileFrames, [{l:0,u:frameCount}], 0, true);
            GX.arrayValue(tileFrames, [frameCount]).value = _tileset_animations[frame-1].tileId;
            frame = _tileset_animations[frame-1].nextFrame;
        }
        return frameCount;
    }

    function _tilesetAnimationSpeed (tileId, speed) {
        if (tileId > GX.tilesetRows() * GX.tilesetColumns()) { return; }
        if (speed != undefined) {
            _tileset_tiles[tileId-1].animationSpeed = speed;
        }
        return _tileset_tiles[tileId-1].animationSpeed;
    }

    function _tileFrame (tileId) {
        if (tileId < 0 || tileId > _tileset_tiles.length) { return tileId; }
        if (_tileset_tiles[tileId-1].animationId == 0) { return tileId; }

        var currFrame = _tileset_tiles[tileId-1].animationId;
        if (_tileset_tiles[tileId-1].animationFrame > 0) {
            currFrame = _tileset_tiles[tileId-1].animationFrame;
        }

        return _tileset_animations[currFrame-1].tileId;
    }


    function _tileFrameNext (tileId) {
        if (tileId < 0 || tileId > _tileset_tiles.length) { return; }
        if (_tileset_tiles[tileId-1].animationId == 0) { return; }

        var frame = GX.frame() % GX.frameRate() + 1;
        var firstFrame = _tileset_tiles[tileId-1].animationId;
        var animationSpeed = _tileset_tiles[tileId-1].animationSpeed;

        if (frame % Math.round(GX.frameRate() / animationSpeed) == 0) {
            var currFrame = firstFrame;
            if (_tileset_tiles[tileId-1].animationFrame > 0) {
                currFrame = _tileset_tiles[tileId-1].animationFrame;
            }

            var nextFrame = _tileset_animations[currFrame-1].nextFrame;
            if (nextFrame == 0) {
                nextFrame = firstFrame;
            }

            _tileset_tiles[tileId-1].animationFrame = nextFrame;
        }
    }    


    // Miscellaneous Private Methods
    // ---------------------------------------------------------------------------
    function _entityCollide (eid1, eid2) {
        return _rectCollide(
            GX.entityX(eid1), GX.entityY(eid1), GX.entityWidth(eid1), GX.entityHeight(eid1),
            GX.entityX(eid2), GX.entityY(eid2), GX.entityWidth(eid2), GX.entityHeight(eid2));
    }
    
    function _rectCollide(r1x1, r1y1, r1w, r1h, r2x1, r2y1, r2w, r2h) {
        var r1x2 = r1x1 + r1w;
        var r1y2 = r1y1 + r1h;
        var r2x2 = r2x1 + r2w;
        var r2y2 = r2y1 + r2h;

        var collide = 0;
        if (r1x2 >= r2x1) {
            if (r1x1 <= r2x2) {
                if (r1y2 >= r2y1) {
                    if (r1y1 <= r2y2) {
                        collide = -1;
                    }
                }
            }
        }
        return collide;
    }

    async function _sceneMoveEntities() {
        var frameFactor = 1 / GX.frameRate();

        for (var eid = 1; eid <= _entities.length; eid++) {
            if (!_entities[eid-1].screen) {
                //alert(eid + ":" + GX.entityVX(eid));
                await _sceneMoveEntity(eid);

                // apply the move vector to the entity's position
                if (GX.entityVX(eid)) {
                    _entities[eid-1].x = GX.entityX(eid) + GX.entityVX(eid) * frameFactor;
                }
                if (GX.entityVY(eid)) {
                    _entities[eid-1].y = GX.entityY(eid) + GX.entityVY(eid) * frameFactor;
                }
            }
        }
    }

    async function _sceneMoveEntity(eid) {
        var tpos = {};
        var centity = { id: 0 }; // INTEGER
        var tmove = 0;   // INTEGER
        var testx = 0;   // INTEGER
        var testy = 0 ;  // INTEGER

        // Test upward movement
        if (GX.entityVY(eid) < 0) {
            testy = Math.round(GX.entityVY(eid) / GX.frameRate());
            if (testy > -1) { testy = -1; }
            tmove = Math.round(await _entityTestMove(eid, 0, testy, tpos, centity));
            if (tmove == 0) {
                if (GX.entityApplyGravity(eid)) {
                    // reverse the motion
                    GX.entityVY(eid, GX.entityVY(eid) * -.5);
                } else {
                    // stop the motion
                    GX.entityVY(eid, 0);
                }

                // don't let the entity pass into the collision entity or tile
                if (centity.id > 0) {
                    GX.entityPos(eid, GX.entityX(eid), GX.entityY(centity.id) - GX.entityCollisionOffsetBottom(centity.id) + GX.entityHeight(centity.id) - GX.entityCollisionOffsetTop(eid));
                } else {
                    GX.entityPos(eid, GX.entityX(eid), (tpos.y + 1) * GX.tilesetHeight() - GX.entityCollisionOffsetTop(eid));
                }
            }
        }

        if (!GX.entityApplyGravity(eid)) {
            // Test downward movement
            if (GX.entityVY(eid) > 0) {
                testy = Math.round(GX.entityVY(eid) / GX.frameRate());
                if (testy < 1) { testy = 1; }
                tmove = Math.round(await _entityTestMove(eid, 0, testy, tpos, centity));
                if (tmove == 0) {
                    // stop the motion
                    GX.entityVY(eid, 0);

                    // don't let the entity pass into the collision entity or tile
                    if (centity.id > 0) {
                        GX.entityPos(eid, GX.entityX(eid), GX.entityY(centity.id) + GX.entityCollisionOffsetTop(centity.id) - GX.entityHeight(eid) + GX.entityCollisionOffsetBottom(eid));
                    }
                    if (tpos.y > -1) {
                        GX.entityPos(eid, GX.entityX(eid), tpos.y * GX.tilesetHeight() - GX.entityHeight(eid) + GX.entityCollisionOffsetBottom(eid));
                    }
                }
            }
        } else {

            // Apply gravity
            testy = Math.round(GX.entityVY(eid) / GX.frameRate());
            if (testy < 1) { testy = 1; }
            tmove = Math.round(await _entityTestMove(eid, 0, testy, tpos, centity));
            if (tmove == 1) {
                // calculate the number of seconds since the gravity started being applied
                var t = (GX.frame() - _entities[eid-1].jumpstart) / GX.frameRate();
                // adjust the y velocity for gravity
                var g = _gravity * t ** 2 / 2;
                if (g < 1) { g = 1; }
                _entities[eid-1].vy = GX.entityVY(eid) + g;
                if (GX.entityVY(eid) > _terminal_velocity) { GX.entityVY(eid, _terminal_velocity); }

            } else if (GX.entityVY(eid) >= 0) {
                //alert("STOP");
                _entities[eid-1].jumpstart = GX.frame();
                if (GX.entityVY(eid) != 0) {
                    GX.entityVY(eid, 0);

                    // don't let the entity fall through the collision entity or tile
                    if (centity.id > 0) {
                        GX.entityPos(eid, GX.entityX(eid), GX.entityY(centity.id) + GX.entityCollisionOffsetTop(centity.id) - GX.entityHeight(eid) + GX.entityCollisionOffsetBottom(eid));
                    }
                    else {
                        //alert("pos: " + eid + ":" + tpos.y);
                        GX.entityPos(eid, GX.entityX(eid), tpos.y * GX.tilesetHeight() - GX.entityHeight(eid) + GX.entityCollisionOffsetBottom(eid));
                    }
                }
            }
        }

        if (GX.entityVX(eid) > 0) {
            // Test right movement
            testx = Math.round(GX.entityVX(eid) / GX.frameRate());
            if (testx < 1) { testx = 1 };
            tmove = Math.round(await _entityTestMove(eid, testx, 0, tpos, centity));
            if (tmove == 0) {
                // stop the motion
                GX.entityVX(eid, 0);

                // don't let the entity pass into the collision entity or tile
                if (centity.id > 0) {
                    GX.entityPos(eid, GX.entityX(centity.id) + GX.entityCollisionOffsetLeft(centity.id) - GX.entityWidth(eid) + GX.entityCollisionOffsetRight(eid), GX.entityY(eid));
                }
                if (tpos.x > -1) {
                    GX.entityPos(eid, tpos.x * GX.tilesetWidth() - GX.entityWidth(eid) + GX.entityCollisionOffsetRight(eid), GX.entityY(eid));
                }
            }

        } else if (GX.entityVX(eid) < 0) {
            // Test left movement
            testx = Math.round(GX.entityVX(eid) / GX.frameRate());
            if (testx > -1) { testx = -1 };
            tmove = Math.round(await _entityTestMove(eid, testx, 0, tpos, centity));
            if (tmove == 0) {
                // stop the motion
                GX.entityVX(eid, 0);

                // don't let the entity pass into the collision entity or tile
                if (centity.id > 0) {
                    GX.entityPos(eid, GX.entityX(centity.id) + GX.entityWidth(centity.id) - GX.entityCollisionOffsetRight(centity.id) - GX.entityCollisionOffsetLeft(eid), GX.entityY(eid));
                }
                if (tpos.x > -1) {
                    GX.entityPos(eid, (tpos.x + 1) * GX.tilesetWidth() - GX.entityCollisionOffsetLeft(eid), GX.entityY(eid));
                }
            }
        }
    }

    async function _entityTestMove (entity, mx, my, tpos, collisionEntity) {
        tpos.x = -1;
        tpos.y = -1;

        var tcount = 0;
        var tiles = [];
        _entityCollisionTiles(entity, mx, my, tiles, tcount);

        var move = 1;

        // Test for tile collision
        var tile = 0;
        //for (var i = 0; i < tcount; i++) {
        for (var i = 0; i < tiles.length; i++) {
            var e = {};
            e.entity = entity;
            e.event = GX.EVENT_COLLISION_TILE;
            e.collisionTileX = tiles[i].x;
            e.collisionTileY = tiles[i].y;
            e.collisionResult = false;
            
            await _onGameEvent(e);
            if (e.collisionResult) {
                move = 0;
                //tpos = tiles[i];
                tpos.x = tiles[i].x;
                tpos.y = tiles[i].y;
            }
        }

        // Test for entity collision
        var entities = [];
        var ecount = _entityCollision(entity, mx, my, entities);
        for (var i=0; i < ecount; i++) {
            var e = {};
            e.entity = entity;
            e.event = GX.EVENT_COLLISION_ENTITY;
            e.collisionEntity = entities[i];
            e.collisionResult = false;
            await _onGameEvent(e);
            if (e.collisionResult) {
                move = 0;
                collisionEntity.id = entities[i];
            }
        }

        return move;
    }

    function _entityCollide (eid1, eid2) {
        return _rectCollide( 
            GX.entityX(eid1) + GX.entityCollisionOffsetLeft(eid1), 
            GX.entityY(eid1) + GX.entityCollisionOffsetTop(eid1), 
            GX.entityWidth(eid1) - GX.entityCollisionOffsetLeft(eid1) - GX.entityCollisionOffsetRight(eid1) - 1,
            GX.entityHeight(eid1) - GX.entityCollisionOffsetTop(eid1) - GX.entityCollisionOffsetBottom(eid1) - 1,
            GX.entityX(eid2) + GX.entityCollisionOffsetLeft(eid2),
            GX.entityY(eid2) + GX.entityCollisionOffsetTop(eid2),
            GX.entityWidth(eid2) - GX.entityCollisionOffsetLeft(eid2) - GX.entityCollisionOffsetRight(eid2) - 1,
            GX.entityHeight(eid2) - GX.entityCollisionOffsetTop(eid2) - GX.entityCollisionOffsetBottom(eid2) - 1);
    }

    function _entityCollision(eid, movex, movey, entities) {
        var ecount = 0;

        for (var i = 1; i <= _entities.length; i++) {
            if (i != eid) {
                // TODO: only include entities that should be considered (e.g. visible, non-screen-level)
                if (_rectCollide(GX.entityX(eid) + GX.entityCollisionOffsetLeft(eid) + movex, 
                    GX.entityY(eid) + GX.entityCollisionOffsetTop(eid) + movey, 
                    GX.entityWidth(eid) - GX.entityCollisionOffsetLeft(eid) - GX.entityCollisionOffsetRight(eid) - 1,
                    GX.entityHeight(eid) - GX.entityCollisionOffsetTop(eid) - GX.entityCollisionOffsetBottom(eid) - 1,
                    GX.entityX(i) + GX.entityCollisionOffsetLeft(i),
                    GX.entityY(i) + GX.entityCollisionOffsetTop(i),
                    GX.entityWidth(i) - GX.entityCollisionOffsetLeft(i) - GX.entityCollisionOffsetRight(i) - 1,
                    GX.entityHeight(i) - GX.entityCollisionOffsetTop(i) - GX.entityCollisionOffsetBottom(i)-1)) {
                    ecount = ecount + 1;
                    entities.push(i);
                }
            }
        }
        return ecount;
    }

    function _entityCollisionTiles(entity, movex, movey, tiles, tcount) {
        var tx = 0;  // INTEGER
        var ty = 0;  // INTEGER
        var tx0 = 0; // INTEGER
        var txn = 0; // INTEGER
        var ty0 = 0; // INTEGER
        var tyn = 0; // INTEGER
        var x = 0;   // INTEGER
        var y = 0;   // INTEGER
        var i = 0;   // INTEGER
        //var tiles = [];

        if (movex != 0) {
            var startx = Math.round(-1 + GX.entityCollisionOffsetLeft(entity));
            if (movex > 0) { 
                startx = Math.round(GX.entityWidth(entity) + movex - GX.entityCollisionOffsetRight(entity));
            }
            tx = Math.floor((GX.entityX(entity) + startx) / GX.tilesetWidth())

            // This is a real brute force way to find the intersecting tiles.
            // We're basically testing every pixel along the edge of the entity's
            // collision rect and incrementing the collision tile count.
            // With a bit more math I'm sure we could avoid some extra loops here.
            tcount = 0;
            ty0 = 0;
            for (y = GX.entityY(entity) + GX.entityCollisionOffsetTop(entity); y <= GX.entityY(entity) + GX.entityHeight(entity) - 1 - GX.entityCollisionOffsetBottom(entity); y++) {
                ty = Math.floor(y / GX.tilesetHeight());
                if (tcount == 0) { ty0 = ty; }
                if (ty != tyn) {
                    tcount = tcount + 1;
                }
                tyn = ty;
            }

            // Add the range of detected tile positions to the return list
            for (ty = ty0; ty <= tyn; ty++) {
                tiles.push({
                    x: tx,
                    y: ty
                });
            }
        }

        if (movey != 0) {
            var starty = Math.round(-1 + GX.entityCollisionOffsetTop(entity));
            if (movey > 0) { 
                starty = Math.round(GX.entityHeight(entity) + movey - GX.entityCollisionOffsetBottom(entity));
            }
            ty = Math.floor((GX.entityY(entity) + starty) / GX.tilesetHeight());

            // This is a real brute force way to find the intersecting tiles.
            // We're basically testing every pixel along the edge of the entity's
            // collision rect and incrementing the collision tile count.
            // With a bit more math I'm sure we could avoid some extra loops here.
            tcount = 0;
            tx0 = 0;
            for (x = GX.entityX(entity) + GX.entityCollisionOffsetLeft(entity); x <= GX.entityX(entity) + GX.entityWidth(entity) - 1 - GX.entityCollisionOffsetRight(entity); x++) {
                tx = Math.floor(x / GX.tilesetWidth());
                if (tcount == 0) { tx0 = tx; }
                if (tx != txn) {
                    tcount = tcount + 1;
                }
                txn = tx;
            }

            for (tx = tx0; tx <= txn; tx++) {
                tiles.push({
                    x: tx,
                    y: ty
                })
            }
        }
    }

    function _fullScreen(fullscreenFlag, smooth) {
        if (fullscreenFlag != undefined) {
            if (fullscreenFlag) {
                if (!smooth) {
                    _canvas.style.imageRendering = "pixelated";
                }
                else {
                    _canvas.style.imageRendering = undefined;
                }
        
                if (_canvas.requestFullscreen) {
                    _canvas.requestFullscreen();
                    _fullscreenFlag = true;
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    _fullscreenFlag = false;
                }
            }
        }
        return _qbBoolean(_fullscreenFlag);
    }



    // Bitmap Font Methods
    // ----------------------------------------------------------------------------
    function _fontCreate(filename, charWidth, charHeight, charref) {
        var font = {
            // Create a new game entity
            eid: GX.entityCreate(filename, charWidth, charHeight, 1),
            charSpacing: 0,
            lineSpacing: 0
        };

        // Hide the entity as we will not be displaying it as a normal sprite
        GX.entityVisible(font.eid, false);
        _fonts.push(font);
        _font_charmap.push(new Array(256).fill({x:0,y:0}));
        var fid = _fonts.length;

        // map the character codes to the image location
        _fontMapChars(fid, charref);

        return fid;
    }
/*
    Sub GXFontCreate (filename As String, charWidth As Integer, charHeight As Integer, charref As String, uid As String)
        Dim fid As Integer
        fid = GXFontCreate(filename, charWidth, charHeight, charref)
        __GX uid, fid, GXTYPE_FONT
    End Sub
*/
    function _fontWidth (fid) {
        return GX.entityWidth(_fonts[fid-1].eid);
    }

    function _fontHeight (fid) {
        return GX.entityHeight(_fonts[fid-1].eid);
    }

    function _fontCharSpacing (fid, charSpacing) {
        if (charSpacing != undefined) {
            _fonts[fid-1].charSpacing = charSpacing;
        }
        return _fonts[fid-1].charSpacing;
    }

    function _fontLineSpacing (fid, lineSpacing) {
        if (lineSpacing != undefined) {
            _fonts[fid-1].lineSpacing = lineSpacing;
        }
        return _fonts[fid-1].lineSpacing;
    }

    function _drawText (fid, sx, sy, s) {
        if (s == undefined) { return; }
        //alert(fid);
        var x = sx;
        var y = sy;
        var font = _fonts[fid-1];
        var e = _entities[font.eid-1];

        for (var i = 0; i < s.length; i++) {
            var a = s.charCodeAt(i);
            if (a == 10) { // Line feed, move down to the next line
                x = sx;
                y = y + e.height + font.lineSpacing;
            } else if (a != 13) { // Ignore Carriage Return
                if (a != 32) { // Space character, nothing to draw
                    var cpos = _font_charmap[fid-1][a];
                    GX.spriteDraw(e.image, x, y, cpos.y, cpos.x, e.width, e.height); //, __gx_scene.image '0
                }
                x = x + e.width + font.charSpacing;
            }
        }
    }

    function _fontMapChars (fid, charref) {
        var cx = 1;
        var cy = 1;
        for (var i = 0; i < charref.length; i++) {
            var a = charref.charCodeAt(i);
            if (a == 10) {
                cx = 1;
                cy = cy + 1;
            } else {
                if (a >= 33 && a <= 256) {
                    _font_charmap[fid-1][a] = {x: cx, y: cy};
                }
                cx = cx + 1;
            }
        }
    }

    function _fontCreateDefault (fid) {
        var filename = null;
        if (fid == GX.FONT_DEFAULT_BLACK) {
            filename = "gx/__gx_font_default_black.png";
        } else {
            filename = "gx/__gx_font_default.png";
        }

        _fonts[fid-1].eid = GX.entityCreate(filename, 6, 8, 1);
        GX.entityVisible(_fonts[fid-1].eid, false);
        _fontMapChars(fid, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()_-+={}[]|\\,./<>?:;\"'");
        GX.fontLineSpacing(fid, 1);
    }

    // Input Device Methods
    // -----------------------------------------------------------------
    function _mouseInput() {
        // TODO: need to decide whether to keep this here
        //       it is not needed for GX - only to support QB64
        var mi = _mouseInputFlag;
        _mouseInputFlag = false;
        return mi;
    }

    function _mouseX() {
        return Math.round((_mousePos.x - _scene.offsetX) / _scene.scaleX);
    }

    function _mouseY() {
        return Math.round((_mousePos.y - _scene.offsetY) / _scene.scaleY);
    }

    function _mouseButton(button) {
        // TODO: need to decide whether to keep this here
        //       it is not needed for GX - only to support QB64
        return _mouseButtons[button-1];
    }

    function _mouseWheel() {
        var mw = _mouseWheelFlag;
        _mouseWheelFlag = 0;
        return mw;
    }

    function _touchInput() {
        var ti = _touchInputFlag;
        _touchInputFlag = false;
        return ti;
    }

    function _touchX() {
        return _touchPos.x;
    }

    function _touchY() {
        return _touchPos.y;
    }
    
    function _enableTouchMouse(enable) {
        _bindTouchToMouse = enable;
    }

    function _deviceInputTest(di) {
        if (di.deviceType = GX.DEVICE_KEYBOARD) {
            if (di.inputType = GX.DEVICE_BUTTON) {
                return GX.keyDown(di.inputId);
            }
        }
        return _qbBoolean(false);
    }

/*
    Function GXDeviceInputTest% (di As GXDeviceInput)
        Dim dcount As Integer
        dcount = _Devices

        If di.deviceId < 1 Or di.deviceId > dcount Then
            GXDeviceInputTest = GX_FALSE
            Exit Function
        End If

        Dim result As Integer
        Dim dactive As Integer
        dactive = _DeviceInput(di.deviceId)

        If di.inputType = GXDEVICE_BUTTON Then
            $If WIN Then
                If _Button(di.inputId) = di.inputValue Then
                    result = GX_TRUE
                End If
            $Else
                If di.deviceType = GXDEVICE_KEYBOARD Then
                result = __GX_DeviceKeyDown(di.inputId)
                Else
                If _Button(di.inputId) = di.inputValue Then
                result = GX_TRUE
                End If
                End If
            $End If

        ElseIf di.inputType = GXDEVICE_AXIS Then
            If _Axis(di.inputId) = di.inputValue Then
                result = GX_TRUE
            End If
        End If

        GXDeviceInputTest = result
    End Function

    $If LINUX OR MAC Then
        Function __GX_DeviceKeyDown% (inputId As Integer)
        Dim k As KeyEntry
        k = __gx_keymap(inputId)

        Dim result As Integer
        result = GX_FALSE
        If _KeyDown(k.value) Then
        result = GX_TRUE
        ElseIf k.shift <> 0 Then
        If _KeyDown(k.shift) Then result = GX_TRUE
        End If

        __GX_DeviceKeyDown = result
        End Function
    $End If
*/
    function _keyInput (k, di) {
        di.deviceId = GX.DEVICE_KEYBOARD;
        di.deviceType = GX.DEVICE_KEYBOARD;
        di.inputType = GX.DEVICE_BUTTON;
        di.inputId = k;
        di.inputValue = -1;
    }
/*
    Function GXKeyDown% (k As Long)
        Dim di As GXDeviceInput
        GXKeyInput k, di
        GXKeyDown = GXDeviceInputTest(di)
    End Function

    Sub GXDeviceInputDetect (di As GXDeviceInput)
        Dim found As Integer
        Dim dcount As Integer
        dcount = _Devices

        While _DeviceInput
            ' Flush the input buffer
        Wend

        Do
            _Limit 90
            Dim x As Integer
            x = _DeviceInput
            If x Then
                Dim i As Integer
                For i = 1 To _LastButton(x)
                    If _Button(i) Then
                        di.deviceId = x
                        di.deviceType = __GX_DeviceTypeName(x)
                        di.inputType = GXDEVICE_BUTTON
                        di.inputId = i
                        di.inputValue = _Button(i)
                        found = 1
                        Exit Do
                    End If
                Next i

                For i = 1 To _LastAxis(x)
                    If _Axis(i) And Abs(_Axis(i)) = 1 Then
                        di.deviceId = x
                        di.deviceType = __GX_DeviceTypeName(x)
                        di.inputType = GXDEVICE_AXIS
                        di.inputId = i
                        di.inputValue = _Axis(i)
                        found = 1
                        Exit Do
                    End If
                Next i

                For i = 1 To _LastWheel(x)
                    If _Wheel(i) Then
                        di.deviceId = x
                        di.deviceType = __GX_DeviceTypeName(x)
                        di.inputType = GXDEVICE_WHEEL
                        di.inputId = i
                        di.inputValue = _Wheel(i)
                        found = 1
                        Exit Do
                    End If
                Next i
            End If

            $If LINUX OR MAC Then
                ' No device input found, as a workaround let's loop through the key map looking for a keydown
                For i = UBound(__gx_keymap) To 1 Step -1
                Dim keyIsDown As Integer, inputId As Integer
                keyIsDown = GX_FALSE
                If __gx_keymap(i).value <> 0 Then
                'If i > 29 Then
                '    Print i; __gx_keymap(i).value
                '    Dim x: Input x
                'End If
                If _KeyDown(__gx_keymap(i).value) Then
                keyIsDown = GX_TRUE
                inputId = i
                ElseIf __gx_keymap(i).shift <> 0 Then
                If _KeyDown(__gx_keymap(i).shift) Then
                keyIsDown = GX_TRUE
                inputId = i
                End If
                End If
                End If
                If keyIsDown Then
                di.deviceId = GXDEVICE_KEYBOARD
                di.deviceType = __GX_DeviceTypeName(GXDEVICE_KEYBOARD)
                di.inputType = GXDEVICE_BUTTON
                di.inputId = inputId
                di.inputValue = GX_TRUE
                found = 1
                Exit Do
                End If
                Next i
            $End If
        Loop Until found

        While _DeviceInput
            '    Flush the device input buffer
        Wend
        _KeyClear

    End Sub

    Function __GX_DeviceTypeName% (deviceId)
        Dim dname As String
        dname = _Device$(deviceId)

        If InStr(dname, "[KEYBOARD]") Then
            __GX_DeviceTypeName = GXDEVICE_KEYBOARD
        ElseIf InStr(dname, "[MOUSE]") Then
            __GX_DeviceTypeName = GXDEVICE_MOUSE
        ElseIf InStr(dname, "[CONTROLLER]") Then
            __GX_DeviceTypeName = GXDEVICE_CONTROLLER
        End If
    End Function

    Function GXDeviceName$ (deviceId As Integer)
        Dim nstart As Integer, nend As Integer
        Dim dname As String
        dname = _Device$(deviceId)
        If InStr(dname, "[CONTROLLER]") Then
            nstart = InStr(dname, "[NAME]")
            If nstart = 0 Then
                dname = "Controller"
            Else
                nstart = nstart + 7
                nend = InStr(nstart, dname, "]]")
                dname = _Trim$(Mid$(dname, nstart, nend - nstart))
            End If
        ElseIf InStr(dname, "[MOUSE]") Then
            dname = "Mouse"
        ElseIf InStr(dname, "[KEYBOARD]") Then
            dname = "Keyboard"
        End If
        GXDeviceName = dname
    End Function

    Function GXDeviceTypeName$ (dtype As Integer)
        Dim dtypename As String
        Select Case dtype
            Case GXDEVICE_KEYBOARD: dtypename = "KEYBOARD"
            Case GXDEVICE_MOUSE: dtypename = "MOUSE"
            Case GXDEVICE_CONTROLLER: dtypename = "CONTROLLER"
        End Select
        GXDeviceTypeName = dtypename
    End Function

    Function GXInputTypeName$ (itype As Integer)
        Dim itypename As String
        Select Case itype
            Case GXDEVICE_BUTTON: itypename = "BUTTON"
            Case GXDEVICE_AXIS: itypename = "AXIS"
            Case GXDEVICE_WHEEL: itypename = "WHEEL"
        End Select
        GXInputTypeName = itypename
    End Function
*/
    function _keyButtonName (inputId ) {
        var k;
        switch (inputId) {
            case GX.KEY_ESC: k = "Esc"; break;
            case GX.KEY_1: k = "1"; break;
            case GX.KEY_2: k = "2"; break;
            case GX.KEY_3: k = "3"; break;
            case GX.KEY_4: k = "4"; break;
            case GX.KEY_5: k = "5"; break;
            case GX.KEY_6: k = "6"; break;
            case GX.KEY_7: k = "7"; break;
            case GX.KEY_8: k = "8"; break;
            case GX.KEY_9: k = "9"; break;
            case GX.KEY_0: k = "0"; break;
            case GX.KEY_DASH: k = "-"; break;
            case GX.KEY_EQUALS: k = "="; break;
            case GX.KEY_BACKSPACE: k = "Bksp"; break;
            case GX.KEY_TAB: k = "Tab"; break;
            case GX.KEY_Q: k = "Q"; break;
            case GX.KEY_W: k = "W"; break;
            case GX.KEY_E: k = "E"; break;
            case GX.KEY_R: k = "R"; break;
            case GX.KEY_T: k = "T"; break;
            case GX.KEY_Y: k = "Y"; break;
            case GX.KEY_U: k = "U"; break;
            case GX.KEY_I: k = "I"; break;
            case GX.KEY_O: k = "O"; break;
            case GX.KEY_P: k = "P"; break;
            case GX.KEY_LBRACKET: k = "["; break;
            case GX.KEY_RBRACKET: k = "]"; break;
            case GX.KEY_ENTER: k = "Enter"; break;
            case GX.KEY_LCTRL: k = "LCtrl"; break;
            case GX.KEY_A: k = "A"; break;
            case GX.KEY_S: k = "S"; break;
            case GX.KEY_D: k = "D"; break;
            case GX.KEY_F: k = "F"; break;
            case GX.KEY_G: k = "G"; break;
            case GX.KEY_H: k = "H"; break;
            case GX.KEY_J: k = "J"; break;
            case GX.KEY_K: k = "K"; break;
            case GX.KEY_L: k = "L"; break;
            case GX.KEY_SEMICOLON: k = ";"; break;
            case GX.KEY_QUOTE: k = "'"; break;
            case GX.KEY_BACKQUOTE: k = "`"; break;
            case GX.KEY_LSHIFT: k = "LShift"; break;
            case GX.KEY_BACKSLASH: k = "\\"; break;
            case GX.KEY_Z: k = "Z"; break;
            case GX.KEY_X: k = "X"; break;
            case GX.KEY_C: k = "C"; break;
            case GX.KEY_V: k = "V"; break;
            case GX.KEY_B: k = "B"; break;
            case GX.KEY_N: k = "N"; break;
            case GX.KEY_M: k = "M"; break;
            case GX.KEY_COMMA: k = ","; break;
            case GX.KEY_PERIOD: k = "."; break;
            case GX.KEY_SLASH: k = "/"; break;
            case GX.KEY_RSHIFT: k = "RShift"; break;
            case GX.KEY_NUMPAD_MULTIPLY: k = "NPad *"; break;
            case GX.KEY_SPACEBAR: k = "Space"; break;
            case GX.KEY_CAPSLOCK: k = "CapsLk"; break;
            case GX.KEY_F1: k = "F1"; break;
            case GX.KEY_F2: k = "F2"; break;
            case GX.KEY_F3: k = "F3"; break;
            case GX.KEY_F4: k = "F4"; break;
            case GX.KEY_F5: k = "F5"; break;
            case GX.KEY_F6: k = "F6"; break;
            case GX.KEY_F7: k = "F7"; break;
            case GX.KEY_F8: k = "F8"; break;
            case GX.KEY_F9: k = "F9"; break;
            case GX.KEY_PAUSE: k = "Pause"; break;
            case GX.KEY_SCRLK: k = "ScrLk"; break;
            case GX.KEY_NUMPAD_7: k = "NPad 7"; break;
            case GX.KEY_NUMPAD_8: k = "NPad 8"; break;
            case GX.KEY_NUMPAD_9: k = "NPad 9"; break;
            case GX.KEY_NUMPAD_MINUS: k = "-"; break;
            case GX.KEY_NUMPAD_4: k = "NPad 4"; break;
            case GX.KEY_NUMPAD_5: k = "NPad 5"; break;
            case GX.KEY_NUMPAD_6: k = "NPad 6"; break;
            case GX.KEY_NUMPAD_PLUS: k = "+"; break;
            case GX.KEY_NUMPAD_1: k = "NPad 1"; break;
            case GX.KEY_NUMPAD_2: k = "NPad 2"; break;
            case GX.KEY_NUMPAD_3: k = "NPad 3"; break;
            case GX.KEY_NUMPAD_0: k = "NPad 0"; break;
            case GX.KEY_NUMPAD_PERIOD: k = "NPad ."; break;
            case GX.KEY_F11: k = "F11"; break;
            case GX.KEY_F12: k = "F12"; break;
            case GX.KEY_NUMPAD_ENTER: k = "NPad Enter"; break;
            case GX.KEY_RCTRL: k = "RCtrl"; break;
            case GX.KEY_NUMPAD_DIVIDE: k = "NPad /"; break;
            case GX.KEY_NUMLOCK: k = "NumLk"; break;
            case GX.KEY_HOME: k = "Home"; break;
            case GX.KEY_UP: k = "Up"; break;
            case GX.KEY_PAGEUP: k = "PgUp"; break;
            case GX.KEY_LEFT: k = "Left"; break;
            case GX.KEY_RIGHT: k = "Right"; break;
            case GX.KEY_END: k = "End"; break;
            case GX.KEY_DOWN: k = "Down"; break;
            case GX.KEY_PAGEDOWN: k = "PgDn"; break;
            case GX.KEY_INSERT: k = "Ins"; break;
            case GX.KEY_DELETE: k = "Del"; break;
            case GX.KEY_LWIN: k = "LWin"; break;
            case GX.KEY_RWIN: k = "RWin"; break;
            case GX.KEY_MENU: k = "Menu"; break;
        }
        return k;
    }



    // Debugging Methods
    // --------------------------------------------------------------------------
    function _debug(enabled) {
        if (enabled != undefined) {
            __debug.enabled = enabled;
        }
        return _qbBoolean(__debug.enabled);
    }

/*
    Function GXDebugScreenEntities
        GXDebugScreenEntities = __gx_debug.screenEntities
    End Function

    Sub GXDebugScreenEntities (enabled As Integer)
        __gx_debug.screenEntities = enabled
    End Sub
*/
    function _debugFont(font) {
        if (font != undefined) {
            __debug.font = font;
        }
        return __debug.font;
    }

    function _debugTileBorderColor(c) {
        if (c != undefined) {
            _debug.tileBorderColor = c;
        }
        return _debug.tileBorderColor;
    }

    function _debugEntityBorderColor(c) {
        if (c != undefined) {
            _debug.entityBorderColor = c;
        }
        return _debug.entityBorderColor;
    }

    function _debugEntityCollisionColor(c) {
        if (c != undefined) {
            _debug.entityCollisionColor = c;
        }
        return _debug.entityCollisionColor;
    }

    /*
    Sub __GX_DebugMapTile
        Dim t As Integer, tx As Long, ty As Long, depth As Integer, i As Integer
        Dim tpos As GXPosition
        '__GX_MapTilePosAt _MOUSEX, _MOUSEY, tpos
        GXMapTilePosAt GXMouseX, GXMouseY, tpos
        depth = GXMapTileDepth(tpos.x, tpos.y)
        tx = tpos.x * GXTilesetWidth - GXSceneX
        ty = tpos.y * GXTilesetHeight - GXSceneY

        'Dim cdest As Long
        'cdest = _Dest
        '_Dest __gx_scene.image
        Line (tx, ty)-(tx + GXTilesetWidth - 1, ty + GXTilesetHeight - 1), GXDebugTileBorderColor, B , &B1010101010101010
        GXDrawText GXDebugFont, tx, ty - 8, "(" + _Trim$(Str$(tpos.x)) + "," + _Trim$(Str$(tpos.y)) + ")"
        For i = 1 To depth
            t = GXMapTile(tpos.x, tpos.y, i)
            GXDrawText GXDebugFont, tx, ty + GXTilesetHeight + 1 + (i - 1) * 8, _Trim$(Str$(i)) + ":" + _Trim$(Str$(t))
        Next i

        '_Dest cdest
    End Sub

    Sub __GX_DebugEntity (ent As GXEntity, x, y)
        If ent.screen And Not GXDebugScreenEntities Then Exit Sub

        'Dim odest As Long
        'odest = _Dest
        '_Dest __gx_scene.image

        ' Display the entity's position
        GXDrawText GXDebugFont, x, y - 8, "(" + __GX_DebugRound(ent.x, 2) + "," + __GX_DebugRound(ent.y, 2) + ")"

        ' Draw the entity's bounding rect
        Line (x, y)-(x + ent.width - 1, y + ent.height - 1), GXDebugEntityBorderColor, B , &B1010101010101010

        ' Draw the entity's collision rect
        Line (x + ent.coLeft, y + ent.coTop)-(x + ent.width - 1 - ent.coRight, y + ent.height - 1 - ent.coBottom), GXDebugEntityCollisionColor, B ', &B1010101010101010

        '_Dest odest
    End Sub

    Function __GX_DebugRound$ (n As Double, decimalPlaces As Integer)
        Dim n2 As Long
        n2 = _Round(n * 10 ^ decimalPlaces)
        If n2 = 0 Then
            __GX_DebugRound = "0." + String$(decimalPlaces, "0")
        Else
            Dim ns As String, decimal As String
            ns = _Trim$(Str$(n2))
            decimal = Right$(ns, decimalPlaces)
            ns = Left$(ns, Len(ns) - decimalPlaces)
            __GX_DebugRound = ns + "." + decimal
        End If
    End Function
*/
    function _debugFrameRate() {
        var frame = String(GX.frame());
        var frameRate = String(GX.frameRate());
        frameRate = frameRate.padStart(frame.length - frameRate.length, " "); //+ frameRate

        GX.drawText(GX.debugFont(), GX.sceneWidth() - (frame.length + 6) * 6 - 1, 1, "FRAME:" + frame);
        GX.drawText(GX.debugFont(), GX.sceneWidth() - (frameRate.length + 4) * 6 - 1, 9, "FPS:" + frameRate);
    }

    function _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    function _init() {
        _vfsCwd = _vfs.rootDirectory();

        // init
        _fontCreateDefault(GX.FONT_DEFAULT);
        _fontCreateDefault(GX.FONT_DEFAULT_BLACK);

        // keyboard event initialization
        // detect key state for KeyDown method
        addEventListener("keyup", function(event) { 
            if (_scene.active) {
                event.preventDefault();
            }
            _pressedKeys[event.code] = false;
        });
        addEventListener("keydown", function(event) { 
            if (_scene.active) {
                event.preventDefault();
            }
            _pressedKeys[event.code] = true;
        });
    }

    this.ctx = function() { return _ctx; };
    this.canvas = function() { return _canvas; };
    this.vfs = function() { return _vfs; };
    this.vfsCwd = function(cwd) {
        if (cwd != undefined) {
            _vfsCwd = cwd;
        }
        return _vfsCwd;
    };

    this.frame = _frame;
    this.frameRate = _frameRate;

    this.sceneColumns = _sceneColumns;
    this.sceneConstrain = _sceneConstrain;
    this.sceneCreate = _sceneCreate;
    this.sceneDraw = _sceneDraw;
    this.sceneFollowEntity = _sceneFollowEntity;
    this.sceneHeight = _sceneHeight;
    this.sceneMove = _sceneMove;
    this.scenePos = _scenePos;
    this.sceneResize = _sceneResize;
    this.sceneRows = _sceneRows;
    this.sceneScale = _sceneScale;
    this.sceneStart = _sceneStart;
    this.sceneStop = _sceneStop;
    this.sceneUpdate = _sceneUpdate;
    this.sceneWidth = _sceneWidth;
    this.sceneX = _sceneX;
    this.sceneY = _sceneY;
        
    this.spriteDraw = _spriteDraw;
    this.spriteDrawScaled = _spriteDrawScaled;

    this.backgroundAdd = _backgroundAdd;
    this.backgroundWrapFactor = _backgroundWrapFactor;
    this.backgroundClear = _backgroundClear;

    this.soundClose = _soundClose;
    this.soundLoad = _soundLoad;
    this.soundPlay = _soundPlay;
    this.soundRepeat = _soundRepeat;
    this.soundPause = _soundPause;
    this.soundStop = _soundStop;
    this.soundStopAll = _soundStopAll;
    this.soundVolume = _soundVolume;
    this.soundMuted = _soundMuted;

    this.entityCreate = _entityCreate;
    this.screenEntityCreate = _screenEntityCreate;
    this.entityAnimate = _entityAnimate;
	this.entityAnimateStop = _entityAnimateStop;
    this.entityAnimateMode = _entityAnimateMode;
    this.entityX = _entityX;
    this.entityY = _entityY;
    this.entityWidth = _entityWidth;
    this.entityHeight = _entityHeight;
    this.entityMove = _entityMove;
	this.entityPos =  _entityPos;
    this.entityVX = _entityVX;
    this.entityVY = _entityVY;
	this.entityFrameNext = _entityFrameNext;
    this.entityFrames = _entityFrames;
    this.entityFrameSet = _entityFrameSet;
    this.entityType = _entityType;
    this.entityMapLayer = _entityMapLayer;
    this.entityCollisionOffset = _entityCollisionOffset;
    this.entityCollisionOffsetLeft = _entityCollisionOffsetLeft;
    this.entityCollisionOffsetTop = _entityCollisionOffsetTop;
    this.entityCollisionOffsetRight = _entityCollisionOffsetRight;
    this.entityCollisionOffsetBottom = _entityCollisionOffsetBottom;
    this.entityCollide = _entityCollide;
    this.entityApplyGravity = _entityApplyGravity;
    this.entityVisible = _entityVisible;

    this.entityFrame = _entityFrame;
    this.entitySequence = _entitySequence;
    this.entitySequences = _entitySequences;
    this.entityFrames = _entityFrames;


    this.mapColumns = _mapColumns;
    this.mapCreate = _mapCreate;
    this.mapLoad = _mapLoad;
    this.mapDraw = _mapDraw;
    this.mapSave = _mapSave;
    this.mapIsometric = _mapIsometric;
    this.mapLayerAdd = _mapLayerAdd;
    this.mapLayerInsert = _mapLayerInsert;
    this.mapLayerRemove = _mapLayerRemove;
    this.mapLayerInit = _mapLayerInit;
    this.mapLayerVisible = _mapLayerVisible;
    this.mapLayers = _mapLayers;
    this.mapResize = _mapResize;
    this.mapRows = _mapRows;
    this.mapTile = _mapTile;

    this.tilesetColumns = _tilesetColumns;
    this.tilesetCreate = _tilesetCreate;
    this.tilesetFilename = _tilesetFilename;
    this.tilesetHeight = _tilesetHeight;
    this.tilesetImage = _tilesetImage;
    this.tilesetPos = _tilesetPos;
    this.tilesetRows = _tilesetRows;
    this.tilesetWidth = _tilesetWidth;
    this.tilesetReplaceImage = _tilesetReplaceImage;
    this.tilesetAnimationCreate = _tilesetAnimationCreate;
    this.tilesetAnimationAdd = _tilesetAnimationAdd;
    this.tilesetAnimationRemove = _tilesetAnimationRemove;
    this.tilesetAnimationFrames = _tilesetAnimationFrames;
    this.tilesetAnimationSpeed = _tilesetAnimationSpeed;

    this.fontCharSpacing = _fontCharSpacing;
    this.fontCreate = _fontCreate;
    this.fontHeight = _fontHeight;
    this.fontLineSpacing = _fontLineSpacing;
    this.fontWidth = _fontWidth;
    this.drawText = _drawText;

    this.deviceInputTest = _deviceInputTest;
    this.keyInput = _keyInput;
    this.keyButtonName = _keyButtonName;
    this.mouseX = _mouseX;
    this.mouseY = _mouseY;
    this.mouseButton = _mouseButton;
    this.mouseWheel = _mouseWheel;
    this._mouseInput = _mouseInput;
    this.touchX = _touchX;
    this.touchY = _touchY
    this._touchInput = _touchInput;
    this._enableTouchMouse = _enableTouchMouse;

    this.debug = _debug;
    this.debugFont = _debugFont;
    this.debugEntityBorderColor = _debugEntityBorderColor;
    this.debugEntityCollisionColor = _debugEntityCollisionColor;
    this.debugTileBorderColor = _debugTileBorderColor;

    this.fullScreen = _fullScreen;
    this.keyDown = _keyDown;

    this.init = _init;
    this.reset = _reset;
    this.sleep = _sleep;
    this.registerGameEvents = _registerGameEvents;
    this.resourcesLoaded = _resourcesLoaded;
    
    this.sceneActive = function() { return _scene.active; }

    // constants
    this.TRUE = -1;
    this.FALSE = 0;

    this.EVENT_INIT = 1;
    this.EVENT_UPDATE = 2;
    this.EVENT_DRAWBG = 3;
    this.EVENT_DRAWMAP = 4;
    this.EVENT_DRAWSCREEN = 5;
    this.EVENT_MOUSEINPUT = 6;
    this.EVENT_PAINTBEFORE = 7;
    this.EVENT_PAINTAFTER = 8;
    this.EVENT_COLLISION_TILE = 9;
    this.EVENT_COLLISION_ENTITY = 10;
    this.EVENT_PLAYER_ACTION = 11;
    this.EVENT_ANIMATE_COMPLETE = 12;

    this.ANIMATE_LOOP = 0;
    this.ANIMATE_SINGLE = 1;

    this.BG_STRETCH = 1;
    this.BG_SCROLL = 2;
    this.BG_WRAP = 3;

    this.KEY_ESC = 'Escape';
    this.KEY_1 = 'Digit1';
    this.KEY_2 = 'Digit2';
    this.KEY_3 = 'Digit3';
    this.KEY_4 = 'Digit4';
    this.KEY_5 = 'Digit5';
    this.KEY_6 = 'Digit6';
    this.KEY_7 = 'Digit7';
    this.KEY_8 = 'Digit8';
    this.KEY_9 = 'Digit9';
    this.KEY_0 = 'Digit0';
    this.KEY_DASH = 'Minus';
    this.KEY_EQUALS = 'Equal';
    this.KEY_BACKSPACE = 'Backspace';
    this.KEY_TAB = 'Tab';
    this.KEY_Q = 'KeyQ';
    this.KEY_W = 'KeyW';
    this.KEY_E = 'KeyE';
    this.KEY_R = 'KeyR';
    this.KEY_T = 'KeyT';
    this.KEY_Y = 'KeyY';
    this.KEY_U = 'KeyU';
    this.KEY_I = 'KeyI';
    this.KEY_O = 'KeyO';
    this.KEY_P = 'KeyP';
    this.KEY_LBRACKET = 'BracketLeft';
    this.KEY_RBRACKET = 'BracketRight';
    this.KEY_ENTER = 'Enter';
    this.KEY_LCTRL = 'ControlLeft';
    this.KEY_A = 'KeyA';
    this.KEY_S = 'KeyS';
    this.KEY_D = 'KeyD';
    this.KEY_F = 'KeyF';
    this.KEY_G = 'KeyG';
    this.KEY_H = 'KeyH';
    this.KEY_J = 'KeyJ';
    this.KEY_K = 'KeyK';
    this.KEY_L = 'KeyL';
    this.KEY_SEMICOLON = 'Semicolon';
    this.KEY_QUOTE = 'Quote';
    this.KEY_BACKQUOTE = 'Backquote';
    this.KEY_LSHIFT = 'ShiftLeft';
    this.KEY_BACKSLASH = 'Backslash';
    this.KEY_Z = 'KeyZ';
    this.KEY_X = 'KeyX';
    this.KEY_C = 'KeyC';
    this.KEY_V = 'KeyV';
    this.KEY_B = 'KeyB';
    this.KEY_N = 'KeyN';
    this.KEY_M = 'KeyM';
    this.KEY_COMMA = 'Comma';
    this.KEY_PERIOD = 'Period';
    this.KEY_SLASH = 'Slash';
    this.KEY_RSHIFT = 'ShiftRight';
    this.KEY_NUMPAD_MULTIPLY = 'NumpadMultiply';
    this.KEY_SPACEBAR = 'Space';
    this.KEY_CAPSLOCK = 'CapsLock';
    this.KEY_F1 = 'F1';
    this.KEY_F2 = 'F2';
    this.KEY_F3 = 'F3';
    this.KEY_F4 = 'F4';
    this.KEY_F5 = 'F5';
    this.KEY_F6 = 'F6';
    this.KEY_F7 = 'F7';
    this.KEY_F8 = 'F8';
    this.KEY_F9 = 'F9';
    this.KEY_F10 = 'F10';
    this.KEY_PAUSE = 'Pause';
    this.KEY_SCRLK = 'ScrollLock';
    this.KEY_NUMPAD_7 = 'Numpad7';
    this.KEY_NUMPAD_8 = 'Numpad8';
    this.KEY_NUMPAD_9 = 'Numpad9';
    this.KEY_NUMPAD_MINUS = 'NumpadSubtract';
    this.KEY_NUMPAD_4 = 'Numpad4';
    this.KEY_NUMPAD_5 = 'Numpad5';
    this.KEY_NUMPAD_6 = 'Numpad6';
    this.KEY_NUMPAD_PLUS = 'NumpadAdd';
    this.KEY_NUMPAD_1 = 'Numpad1';
    this.KEY_NUMPAD_2 = 'Numpad2';
    this.KEY_NUMPAD_3 = 'Numpad3';
    this.KEY_NUMPAD_0 = 'Numpad0';
    this.KEY_NUMPAD_PERIOD = 'NumpadDecimal';
    this.KEY_F11 = 'F11';
    this.KEY_F12 = 'F12';
    this.KEY_NUMPAD_ENTER = 'NumpadEnter';
    this.KEY_RCTRL = 'ControlRight';
    this.KEY_NUMPAD_DIVIDE = 'NumpadDivide';
    this.KEY_NUMLOCK = 'NumLock';
    this.KEY_HOME = 'Home';
    this.KEY_UP = 'ArrowUp';
    this.KEY_PAGEUP = 'PageUp';
    this.KEY_LEFT = 'ArrowLeft';
    this.KEY_RIGHT = 'ArrowRight';
    this.KEY_END = 'End';
    this.KEY_DOWN = 'ArrowDown';
    this.KEY_PAGEDOWN = 'PageDown';
    this.KEY_INSERT = 'Insert';
    this.KEY_DELETE = 'Delete';
    this.KEY_LWIN = 'MetaLeft';
    this.KEY_RWIN = 'MetaRight';
    this.KEY_MENU = 'ContextMenu';
    this.KEY_LALT = "AltLeft";
    this.KEY_RALT = "AltRight";

    this.ACTION_MOVE_LEFT = 1;
    this.ACTION_MOVE_RIGHT = 2;
    this.ACTION_MOVE_UP = 3;
    this.ACTION_MOVE_DOWN = 4;
    this.ACTION_JUMP = 5;
    this.ACTION_JUMP_RIGHT = 6;
    this.ACTION_JUMP_LEFT = 7;

    this.SCENE_FOLLOW_NONE = 0;                // no automatic scene positioning (default)
    this.SCENE_FOLLOW_ENTITY_CENTER = 1;       // center the view on a specified entity
    this.SCENE_FOLLOW_ENTITY_CENTER_X = 2;     // center the x axis of the scene on the specified entity
    this.SCENE_FOLLOW_ENTITY_CENTER_Y = 3;     // center the y axis of the scene on the specified entity
    this.SCENE_FOLLOW_ENTITY_CENTER_X_POS = 4; // center the x axis of the scene only when moving to the right
    this.SCENE_FOLLOW_ENTITY_CENTER_X_NEG = 5; // center the x axis of the scene only when moving to the left

    this.SCENE_CONSTRAIN_NONE = 0;   // no checking on scene position: can be negative, can exceed map size (default)
    this.SCENE_CONSTRAIN_TO_MAP = 1; // do not allow screen position outside the bounds of the map size

    this.FONT_DEFAULT = 1;       // default bitmap font (white)
    this.FONT_DEFAULT_BLACK = 2; // default bitmap font (black

    this.DEVICE_KEYBOARD = 1;
    this.DEVICE_MOUSE = 2;
    this.DEVICE_CONTROLLER = 3;
    this.DEVICE_BUTTON = 4;
    this.DEVICE_AXIS = 5;
    this.DEVICE_WHEEL = 6;

    this.TYPE_ENTITY = 1;
    this.TYPE_FONT = 2;

    this.CR = "\r";
    this.LF = "\n";
    this.CRLF = "\r\n"



    // Array handling methods
    // TODO: These methods are included here to avoid a circular dependency with qb.js
    //       Implementation should be moved to a separated shared js file
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

};    
    

// Consider moving these to separate optional js files
var GXSTR = new function() {
    this.lPad = function(str, padChar, padLength) {
        return String(str).padStart(padLength, padChar);
    }
    
    this.rPad = function(str, padChar, padLength) {
        return String(str).padEnd(padLength, padChar);
    }

    this.replace = function(str, findStr, replaceStr) {
        return String(str).replaceAll(findStr, replaceStr);
    }
};

GX.init();
