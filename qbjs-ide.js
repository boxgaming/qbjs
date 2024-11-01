var IDE = new function() {

    var QBCompiler = null; 
    // if code has been passed on the query string load it into the editor
    var qbcode = "";
    var url = location.href;
    var sizeMode = "normal";
    var appMode = "ide";
    var consoleVisible = false;
    var currTab = "js";
    var currMethodTab = "methods";
    var editor;
    var selectedError = null;
    var currPath = "/";
    var mainProg = null;
    var theme = "qbjs";
    var splitWidth = 600;
    var splitHeight = 327;
    var sliding = false;
    var vsliding = false;
    var _e = {
        ideTheme:         _el("ide-theme"),
        loadScreen:       _el("gx-load-screen"),
        jsCode:           _el("js-code"),
        warningContainer: _el("warning-container"),
        gxContainer:      _el("gx-container"),
        shareMode:        _el("share-mode"),
        shareCode:        _el("share-code"),
        shareDialog:      _el("share-dialog"),
        exportButton:     _el("export-button"),
        fileInput:        _el("file-input"),
        progSelSources:   _el("prog-sel-sources"),
        progSelDialog:    _el("prog-sel-dialog"),
        optionsDialog:    _el("options-dialog"),
        aboutDialog:      _el("about-dialog"),
        methodsDialog:    _el("methods-dialog"),
        toolbar:          _el("toolbar"),
        tbConsoleShow:    _el("toolbar-button-console-show"),
        tbConsoleHide:    _el("toolbar-button-console-hide"),
        tbSlideRight:     _el("toolbar-button-slide-right"),
        tbSlideLeft:      _el("toolbar-button-slide-left"),
        tbRun:            _el("toolbar-button-run"),
        tbStop:           _el("toolbar-button-stop"),
        outputContainer:  _el("output-container"),
        outputContent:    _el("output-content"),
        codeContainer:    _el("code-container"),
        rightPanel:       _el("game-container"),
        slider:           _el("slider"),
        vslider:          _el("vslider"),
        fsBrowser:        _el("fs-browser"),
        fsContents:       _el("fs-contents"),
        fsUrl:            _el("fs-url"),
        code:             _el("code"),
        themePicker:      _el("theme-picker"),
        help:             _el("help"),
        helpSidebar:      _el("help-sidebar"),
        helpPage:         _el("help-page"),
        helpContainer:    _el("help-container")
    };

    function _el(id) {
        return document.getElementById(id);
    }

    async function _init() {
        document.body.style.display = "initial";

        if (window.innerWidth < 1200) {
            sizeMode = "max";
        }

        var srcUrl = null;
        if (url && (url.indexOf("?") || url.indexOf("#"))) {
            var pindex = url.indexOf("?");
            if (pindex == -1) {
                pindex = url.indexOf("#");
            }
            var queryString = url.substring(pindex + 1);
            var nvpairs = queryString.split("&");
            for (var i = 0; i < nvpairs.length; i++) {
                var pname = "";
                var pvalue = "";
                var nvidx = nvpairs[i].indexOf("=");
                if (nvidx > -1) {
                    pname = nvpairs[i].substring(0, nvidx);
                    pvalue = nvpairs[i].substring(nvidx + 1);

                    if (pname == "qbcode") {
                        var zin = new Shorty();
                        qbcode = zin.inflate(atob(pvalue));
                        break;
                    }
                    else if (pname == "code") {
                        qbcode = LZUTF8.decompress(pvalue, { inputEncoding: "Base64" });
                    }
                    else if (pname == "gzcode") {
                        var strData = atob(pvalue);
                        var charData = strData.split("").map(function(x){return x.charCodeAt(0);});
                        var binData = new Uint8Array(charData);
                        var data = pako.inflate(binData);
                        qbcode = String.fromCharCode.apply(null, new Uint16Array(data));
                    }
                    else if (pname == "mode") {
                        appMode = pvalue;
                    }
                    else if (pname == "src") {
                        srcUrl = decodeURIComponent(pvalue);
                    }
                    else if (pname == "main") {
                        mainProg = pvalue;
                    }
                }
            }
        }
        if (appMode == "play") {
            _e.loadScreen.style.display = "block";
        }
        else if (appMode == "ide") {
            var stheme = localStorage.getItem("@@_theme");
            if (stheme && stheme != "") {
                theme = stheme;
            }
            _e.ideTheme.href = "codemirror/themes/" + theme + ".css";
            GitHelp.navhome();
        }

        // initialize the code editor
        editor = CodeMirror(document.querySelector("#code"), {
            lineNumbers: true,
            tabSize: 4,
            indentUnit: 4,
            value: qbcode,
            module: "qbjs",
            theme: theme,
            height: "auto",
            styleActiveLine: true,
            smartIndent: false,
            specialChars: /[\u0009-\u000d\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\u202d\u202e\u2066\u2067\u2069\ufeff\ufff9-\ufffc]/,
            extraKeys: {
                "Tab": function(cm) {
                    cm.replaceSelection("    ", "end");
                }
            }
        });
        editor.setSize(600, 600);
        editor.on("beforeChange", (cm, change) => {
            if (change.origin === "paste") {
                const newText = change.text.map(line => line.replace(/\t/g, "    "));
                change.update(null, null, newText);
            }
        });

        // if IDE mode, capture the F5 event
        if (appMode != "play" && appMode != "auto") {
            window.addEventListener("keydown", function(event) {
                // run
                if (event.code == 'F5') {
                    if (event.shiftKey) {
                        QB.halt();
                        GX.sceneStop();
                    }
                    else if (!QB.running() && !GX.sceneActive()) {
                        event.preventDefault();
                        _runProgram();
                    }
                }
                // compile
                else if (event.code == 'F11') {
                    event.preventDefault();
                    shareProgram();
                }
                // show method dialog
                else if (event.code == "F2") {
                    event.preventDefault();
                    _showMethodDialog();
                }
            });
        }
        if (appMode == "ide" && !inIframe()) {
            editor.focus();
        }
        
        if (srcUrl) {
            var res = await fetch(srcUrl);
            var contentType = res.headers.get("Content-Type");
            if (contentType == "application/zip" ||
                contentType == "application/zip-compressed" ||
                contentType == "application/x-zip-compressed") {
                // load a project
                await loadProject(await res.arrayBuffer(), mainProg, function() {
                    if (appMode == "auto") {
                        _runProgram();
                    }
                });
            }
            else {
                // otherwise, assume a single source file
                var decoder = new TextDecoder("iso-8859-1");
                qbcode = decoder.decode(await res.arrayBuffer());
                editor.setValue(qbcode);
            }
        }

        var warnCount = 0;
        _changeTab("console");
        window.onresize();

        if (appMode == "auto") {
            _runProgram();
        }
    }    

    function _getErrorLine(error, stackDepth) {
        if (!stackDepth)  {
            stackDepth = 0;
        }
        else if (error._stackDepth) {
            stackDepth = error._stackDepth;
        }

        var cdepth = 0;
        var srcLine = "";
        if (error.line) { // safari
            srcLine = error.line - 1;
        }

        if (!error.stack) { return 0; }

        var stack = error.stack.split("\n");
        for (var i=0; i < stack.length; i++) {
            // chrome
            if (stack[i].trim().indexOf("(eval at _runProgram") > -1) {
                if (cdepth == stackDepth) {
                    var idx = stack[i].indexOf("<anonymous>:");
                    var pos = stack[i].substring(idx + 12); 
                    pos = pos.substring(0, pos.length - 1);   
                    pos = pos.split(":");
                    srcLine = pos[0] - 2;
                }
                cdepth++;
            }
            // firefox
            else if (stack[i].trim().indexOf("> AsyncFunction:") > -1) {
                if (cdepth == stackDepth) {
                    var idx = stack[i].indexOf("> AsyncFunction:");
                    var pos = stack[i].substring(idx + 16); 
                    pos = pos.split(":");
                    srcLine = pos[0] - 2;
                }
                cdepth++;
            }
        }

        if (!isNaN(srcLine)) {
            srcLine = QBCompiler.getSourceLine(srcLine);
        }

        return srcLine;
    }

    async function _showMethodDialog() {
        // compile the source
        var qbCode = editor.getValue();
        if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
        var jsCode = await QBCompiler.compile(qbCode);
        
        var mbody = document.getElementById("methods-content");
        mbody.innerHTML = "";
        _addMethods(mbody, QBCompiler.getMethods(), _gotoMethod);

        var imports = QBCompiler.getExportMethods();
        var consts = QBCompiler.getExportConsts();
        for (var i=0; i < consts.length; i++) {
            var obj = consts[i];
            obj.uname = obj.name.toUpperCase();
            obj.args = "";
            obj.type = "CONST";
            imports.push(obj);
        }
        mbody = document.getElementById("imports-content");
        mbody.innerHTML = "";
        _addMethods(mbody, imports);

        _showDialog(_e.methodsDialog);
    }
    
    function _gotoMethod(e) {
        editor.setCursor({ line: e.target.parentNode.line - 1 }); 
        _closeDialog();
    };

    function _addMethods(mbody, methods, fnCallback) {
        methods.sort((a, b) => a.uname.localeCompare(b.uname));
        for (var i=0; i < methods.length; i++) {
            if (methods[i].jsname.indexOf("GX.") == -1 &&
                methods[i].jsname.indexOf("GXSTR.") == -1 &&
                methods[i].jsname.indexOf("QB.") == -1 &&
                methods[i].jsname.indexOf("JSON.") == -1) {
                    var tr = document.createElement("tr");
                    tr.line = methods[i].line;
                    var td = document.createElement("td");
                    td.innerHTML = methods[i].name;
                    tr.appendChild(td);
                    td = document.createElement("td");
                    td.className = "method-type";
                    td.innerHTML = methods[i].type;
                    tr.appendChild(td);
                    td = document.createElement("td");
                    tr.appendChild(td);
                    td.innerHTML = formatMethodArgs(methods[i].args);
                    mbody.appendChild(tr);
                    tr.onclick = fnCallback;
            }
        }
    }

    function formatMethodArgs(argstr) {
        var result = "";
        var args = argstr.split(",");
        if (args.length < 2 && args[0] == "") {
            return result;
        }
        for (var i=0; i < args.length; i++) {
            var nv = args[i].split(":");
            if (result != "") {
                result += ", ";
            }
            result += nv[0] + " <span class='method-arg-type'>As " + nv[1] + "</span>";
        }
        return result;
    }

    async function _runProgram() {
        _e.loadScreen.style.display = "none";

        if (sizeMode == "max") {
            _slideLeft();
        }
        GX.reset();
        QB.start();
        var qbCode = editor.getValue();
        if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
        var jsCode = await QBCompiler.compile(qbCode);

        await displayWarnings();

        if (_hasError()) {
            consoleVisible = true;
            window.onresize();
            QB.halt();
            GX.sceneStop();
            return false;
        }

        _e.jsCode.innerHTML = jsCode;
        window.onresize();

        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            var codeFn = new AsyncFunction(jsCode);
            await codeFn();
        }
        catch (error) {
            console.error(error);

            // find the source line, if possible
            var srcLine = await _getErrorLine(error);

            var table = _el("warning-table");
            if (table) {
                tr = document.createElement("tr");
                _addWarningCell(tr, "ERROR");
                _addWarningCell(tr, ":");
                _addWarningCell(tr, srcLine);
                _addWarningCell(tr, ":");
                _addWarningCell(tr, "<div style='white-space:pre'>" + error.message + "\n<div style='color:#666'>" + error.stack + "</div></div>", "99%");
                tr.codeLine = srcLine - 1;
                tr.onclick = _gotoWarning;
                table.append(tr);
            }

            consoleVisible = true;
            window.onresize();
            QB.halt();
            GX.sceneStop();
        }
        _e.gxContainer.focus();

        return false;
    }

    function _hasError() {
        var warnings = QBCompiler.getWarnings();
        for (var i=0; i < warnings.length; i++) {
            if (warnings[i].mtype == 1) {
                return true;
            }
        }
        return false;
    }

    function _stopProgram() {
        QB.halt();
        GX.sceneStop();
    }

    function _shareProgram() {
        var zout = new Shorty();
        var b64 = LZUTF8.compress(editor.getValue(), { outputEncoding: "Base64" });
        var baseUrl = location.href.split('?')[0];

        var mode = _e.shareMode.value;
        var codeShare = _e.shareCode;
        var url = baseUrl + "?";
        if (mode) {
            url += "mode=" + mode + "&";
        }
        url += "code=" + b64;
        codeShare.value = url;
        if (!_e.shareDialog.open) {
            _e.shareDialog.showModal();
        }
        codeShare.focus();
        codeShare.select();

        var exportVisible = (mode == "play" || mode == "auto");
        _e.exportButton.title = (exportVisible) ? "" : "Select Play or Auto mode to enable Export";
        if (exportVisible) { 
            _e.exportButton.classList.remove("disabled");
        }
        else {
            _e.exportButton.classList.add("disabled");
        }
    }

    function _changeTheme(newTheme) {
        theme = newTheme;
        _e.ideTheme.href = "codemirror/themes/" + theme + ".css";
        editor.setOption("theme", theme);
        localStorage.setItem("@@_theme", theme);
    }

    function _showOptionDialog() {
        _e.themePicker.value = theme;
        _showDialog(_e.optionsDialog);
    }

    function _showDialog(dlg) {
        if (typeof dlg == "string") {
            dlg = _el(dlg);
        }
        if (!dlg.open) {
            dlg.showModal();
        }
    }

    async function _exportProgram() {
        var mode = _e.shareMode.value;
        if (mode == "") { return; }

        var zip = new JSZip();

        var qbCode = editor.getValue();
        if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
        var jsCode = "async function __qbjs_run() {\n" + await QBCompiler.compile(qbCode) + "\n}";

        var mode = _e.shareMode.value;
        zip.file("index.html", await getFile("export/" + mode + ".html", "text"));
        zip.file("program.js", jsCode);
        zip.file("fullscreen.svg", await getFile("export/fullscreen.svg", "blob"));
        zip.file("fullscreen-hover.svg", await getFile("export/fullscreen-hover.svg", "blob"));
        zip.file("logo.png", await getFile("export/logo.png", "blob"));
        zip.file("qbjs.woff2", await getFile("qbjs.woff2", "blob"));
        zip.file("play.png", await getFile("play.png", "blob"));
        zip.file("qbjs.css", await getFile("export/qbjs.css", "text"));
        zip.file("qb.js", await getFile("qb.js", "text"));
        zip.file("vfs.js", await getFile("vfs.js", "text"));

        zip.file("pako.2.1.0.min.js", await getFile("util/pako.2.1.0.min.js", "text"));
        
        zip.file("gx/gx.js", await getFile("gx/gx.js", "text"));
        zip.file("gx/__gx_font_default.png", await getFile("gx/__gx_font_default.png", "blob"));
        zip.file("gx/__gx_font_default_black.png", await getFile("gx/__gx_font_default_black.png", "blob"));

        // include vfs content
        var vfs = QB.vfs();
        var node = vfs.getNode("/");
        addVFSFiles(vfs, zip, node);
        
        zip.generateAsync({type:"blob", compression:"DEFLATE"}).then(function(content) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "program.zip";
            link.click();
            link.remove();
        });
    }

    function addVFSFiles(vfs, zip, parent) {
        var files = vfs.getChildren(parent, vfs.FILE);
        for (var i=0; i < files.length; i++) {
            var f = files[i];
            var path = vfs.fullPath(f).substring(1);
            zip.file(path, f.data);
        }

        var dirs = vfs.getChildren(parent, vfs.DIRECTORY);
        for (var i=0; i < dirs.length; i++) {
            addVFSFiles(vfs, zip, dirs[i]);
        }
    }

    async function _saveProject() {
        var vfs = QB.vfs();
        var node = vfs.getNode("/");
        var count = vfs.getChildren(node, vfs.FILE).length;
        if (count < 1) {
            count = vfs.getChildren(node, vfs.DIRECTORY).length;
        }

        // save a single .bas file
        if (count == 0) {
            var progFile = new Blob([ editor.getValue() ]);
            QB.downloadFile(progFile, "program.bas");
        }

        // save a project .zip file
        else {
            var zip = new JSZip();
            zip.file("main.bas", editor.getValue());

            var vfs = QB.vfs();
            var node = vfs.getNode("/");
            addVFSFiles(vfs, zip, node);
            
            zip.generateAsync({type:"blob",compression:"DEFLATE"}).then(function(content) {
                QB.downloadFile(content, "project.zip");
            });
        }
    }

    async function _openProject() {
        _e.fileInput.click();
    }

    async function onOpenProject(event) {
        var f = event.target.files[0];

        // load a single BASIC source file
        if (f.name.toLowerCase().endsWith(".bas") || f.type.startsWith("text/")) {
            var fr = new FileReader();
            fr.onload = function() {
                editor.setValue(fr.result);
            }
            fr.readAsText(f);
        }

        // load a project from a zip file
        else if (f.name.endsWith(".zip") || f.type == "application/x-zip-compressed") {
            await loadProject(f);
        }

    }
    _e.fileInput.onchange = onOpenProject;

    async function loadProject(zipData, mainFilename, fnCallback) {
        if (!mainFilename) {
            mainFilename = "main.bas";
        }
        else {
            mainFilename = mainFilename.toLowerCase();
        }
        var vfs = GX.vfs();
        vfs.reset();
        JSZip.loadAsync(zipData).then(async function(zip) {
            var basFiles = [];
            var fnames = "";
            var mainFound = false;
            // determine if there is only a single directory,
            // if so move the contents to the root
            var singleDir = null;
            var rootDirs = {};
            var rootFiles = false;
            for (let [filename, file] of Object.entries(zip.files)) {
                var fidx = filename.indexOf("/");
                var dir = filename.substring(0,fidx+1);
                rootDirs[dir] = 1;
            }
            rootDirs = Object.keys(rootDirs);
            if (rootDirs.length == 1) {
                singleDir = rootDirs[0];
            }
            for (let [filename, file] of Object.entries(zip.files)) {
                var vfsFilename = filename;
                if (singleDir) {
                    vfsFilename = filename.substring(singleDir.length);
                }
                var parentDir = dirFromPath(vfs.getParentPath(vfsFilename));
                if (vfsFilename.toLowerCase() == mainFilename) {
                    var text = await zip.file(filename).async("text");
                    editor.setValue(text);
                    mainFound = true;
                }
                else {
                    if (zip.file(filename)) {
                        var fdata = await zip.file(filename).async("arraybuffer");
                        var f = vfs.createFile(vfs.getFileName(vfsFilename), parentDir);
                        vfs.writeData(f, fdata);
                        if (vfsFilename.toLowerCase().endsWith(".bas")) {
                            basFiles.push(vfsFilename);
                        }
                    }
                }
            }
            if (!mainFound) {
                var fileList = _e.progSelSources;
                fileList.innerHTML = "";
                for (var i=0; i < basFiles.length; i++) {
                    var opt = new Option(basFiles[i], basFiles[i]);
                    fileList.append(opt);
                }
                _showDialog(_e.progSelDialog);
            }

            _refreshFS();
            if (fnCallback) {
                fnCallback();
            }
        });

        function dirFromPath(path) {
            var vfs = GX.vfs();
            if (path == "") { return vfs.rootDirectory(); }
            
            var dirnames = path.split("/");
            var dirpath = ""
            var parent = vfs.rootDirectory();
            for (var i=0; i < dirnames.length; i++) {
                dirpath += "/" + dirnames[i];
                var dir = vfs.getNode(dirpath);
                if (!dir) {
                    dir = vfs.createDirectory(dirnames[i], parent);
                }
                parent = dir;   
            }
            return parent;
        }
    }

    function _onSelMainProg() {
        var fileList = _e.progSelSources;
        if (fileList.value == "") {
            alert("No file selected.");
        }
        else {
            var vfs = GX.vfs();
            var file = vfs.getNode("/" + fileList.value);
            editor.setValue(vfs.readText(file));
            vfs.removeFile(file);
            _closeDialog();
        }
    }

    async function getFile(path, type) {
        var file = await fetch(path);
        if (type == "text") {
            return await file.text();
        }
        else if (type == "blob") {
            return await file.blob();
        }
    }

    function _testShare() {
        open(_e.shareCode.value, "_blank");
    }

    function _closeDialog() {
        _e.shareDialog.close();
        _e.progSelDialog.close();
        _e.optionsDialog.close();
        _e.aboutDialog.close();
        _e.methodsDialog.close();
    }

    async function displayWarnings() {
        var wstr = "";
        var w = await QBCompiler.getWarnings();
        warnCount = w.length;

        var wdiv = _e.warningContainer;
        wdiv.innerHTML = "";
        var table = document.createElement("table");
        table.style.width = "100%";
        table.id = "warning-table";
        table.cellPadding = 2;
        table.cellSpacing = 0;
        table.style.cursor = "default";
        wdiv.appendChild(table);

        selectedError = null;
        if (warnCount > 0) {
            for (var i=0; i < w.length; i++) {
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");
                var td3 = document.createElement("td");
                var mtype = (w[i].mtype == 1) ? "ERROR": "WARN";
                _addWarningCell(tr, mtype);
                _addWarningCell(tr, ":");
                _addWarningCell(tr, w[i].line);
                _addWarningCell(tr, ":");
                _addWarningCell(tr, w[i].text, "99%");
                table.append(tr);
                tr.codeLine = w[i].line - 1;
                tr.onclick = _gotoWarning;
            }
        }
        if (!consoleVisible && w.length > 0) {
            consoleVisible = true;
        }
    }

    function _gotoWarning() {
        if (selectedError ) { selectedError.classList.remove("selected"); }
        editor.setCursor({ line: this.codeLine}); 
        this.classList.add("selected");
        selectedError = this;
    }

    function _addWarningCell(tr, text, width) {
        var td = document.createElement("td");
        td.innerHTML = text;
        td.vAlign = "top";
        if (width != undefined) {
            td.width = width;
        }
        tr.append(td);
    }

    function _showConsole(force) {
        consoleVisible = !consoleVisible;
        if (force != undefined) {
            consoleVisible = force;
        }
        if (!consoleVisible) {
            _e.tbConsoleShow.style.display = "inline-block";
            _e.tbConsoleHide.style.display = "none";

        }
        else {
            _e.tbConsoleHide.style.display = "inline-block";
            _e.tbConsoleShow.style.display = "none";
        }
        window.dispatchEvent(new Event('resize'));
    }

    function _changeTab(tabName) {
        if (tabName == currTab) { return; }
        _el("tab-" + currTab).classList.remove("active");
        _el("tab-" + tabName).classList.add("active");
        currTab = tabName;

        if (currTab == "console") {
            _e.warningContainer.style.display = "block";
            _e.jsCode.style.display = "none";
            _e.fsBrowser.style.display = "none";
            _e.help.style.display = "none";
        }
        else if (currTab == "js") {
            _e.warningContainer.style.display = "none";
            _e.fsBrowser.style.display = "none";
            _e.jsCode.style.display = "block";
            _e.help.style.display = "none";
        }
        else if (currTab == "fs") {
            _e.fsBrowser.style.display = "block";
            _e.warningContainer.style.display = "none";
            _e.jsCode.style.display = "none";
            _e.help.style.display = "none";
            _refreshFS();
        }
        else if (currTab == "help") { 
            _e.warningContainer.style.display = "none";
            _e.jsCode.style.display = "none";
            _e.fsBrowser.style.display = "none";
            _e.help.style.display = "block";
        }
    }

    function _changeMethodTab(tabName) {
        if (tabName == currMethodTab) { return; }
        _el("tab-" + currMethodTab).classList.remove("active");
        _el("tab-" + tabName).classList.add("active");
        currMethodTab = tabName;

        if (currMethodTab == "methods") {
            _el("methods").style.display = "block";
            _el("imports").style.display = "none";
        }
        else if (currMethodTab == "imports") {
            _el("methods").style.display = "none";
            _el("imports").style.display = "block";
        }
    }

    function _showHelp(page) {
        _changeTab("help");
        var helpUrl = "";
        if (page == "language")      { GitHelp.wikinav("https://raw.githubusercontent.com/wiki/boxgaming/qbjs/QBasic-Language-Support.md"); }
        else if (page == "keywords") { GitHelp.wikinav("https://raw.githubusercontent.com/wiki/boxgaming/qbjs/Supported-Keywords.md"); }
        else if (page == "samples")  { GitHelp.wikinav("https://raw.githubusercontent.com/wiki/boxgaming/qbjs/Samples.md"); }
        else                         { GitHelp.navhome(); }
        consoleVisible = false;
        _showConsole();
    }

    function displayTypes() {
        var tstr = "";
        var t = QBCompiler.getTypes();
        for (var i=0; i < t.length; i++) {
            tstr += t[i].name
        }
        var wdiv = _e.warningContainer;
        wdiv.innerHTML = tstr;
    }

    function _slideLeft() {
        _e.tbSlideRight.style.display = "inline-block";
        if (sizeMode == "max" && window.innerWidth >= 1200) {
            sizeMode = "normal"
        }
        else {
            sizeMode = "min"
            _e.tbSlideLeft.style.display = "none";
        }
        window.dispatchEvent(new Event('resize'));
    }

    function _slideRight() {
        _e.tbSlideLeft.style.display = "inline-block";
        if (sizeMode == "min" && window.innerWidth >= 1200) {
            sizeMode = "normal"
        }
        else {
            sizeMode = "max"
            _e.tbSlideRight.style.display = "none";
        }
        window.dispatchEvent(new Event('resize'));
    }

    window.onresize = function() {
        if (!editor) { return; }

        var f = _e.gxContainer;
        var jsDiv = _e.outputContainer;

        if (appMode == "play" || appMode == "auto") {
            f.style.left = "0px";
            f.style.top = "0px";
            f.style.width = window.innerWidth + "px";
            f.style.height = window.innerHeight + "px";
            f.style.border = "0px";
            _e.codeContainer.style.display = "none";
            _e.slider.style.display = "none";
            _e.rightPanel.style.left = "0px";
            _e.rightPanel.style.top = "0px";
            _e.rightPanel.style.right = "0px";
            _e.rightPanel.style.bottom = "0px";
            _e.rightPanel.style.backgroundColor = "#000";
            _e.toolbar.style.display = "none";
            jsDiv.style.display = "none";
            _e.vslider.style.display = "none";
            splitHeight = 0;
        }
        else {
            var cmwidth = splitWidth;
            if (sizeMode == "min") {
                cmwidth = -10;
                editor.getWrapperElement().style.display = "none";
                _e.rightPanel.style.display = "block";
                _e.slider.style.display = "none";
            }
            else if (sizeMode == "max") {
                cmwidth = window.innerWidth - 12;
                _e.rightPanel.style.display = "none";
                _e.slider.style.display = "none";
                editor.getWrapperElement().style.display = "block";
            }
            else {
                editor.getWrapperElement().style.display = "block";
                _e.rightPanel.style.display = "block";
                _e.slider.style.display = "block";
            }

            _e.rightPanel.style.left = (cmwidth + 15) + "px";
            f.style.width = (window.innerWidth - (cmwidth + 22)) + "px";
            jsDiv.style.width = f.style.width;            

            _e.slider.style.left = (cmwidth + 7) + "px";

            if (consoleVisible) { 
                _e.vslider.style.display = "block";
                f.style.height = (window.innerHeight - splitHeight) + "px";
                jsDiv.style.display = "block";
                jsDiv.style.top = (window.innerHeight - splitHeight + 10) + "px";
                _e.outputContent.style.height = (splitHeight - 77) + "px";
                _e.helpContainer.style.height = (splitHeight - 110) + "px";
            }
            else {
                _e.vslider.style.display = "none";
                f.style.height = (window.innerHeight - 40) + "px";
                jsDiv.style.display = "none";
            }
            
            editor.setSize(cmwidth, window.innerHeight - 40);
            _e.code.style.height = (window.innerHeight - 40) + "px";
            _e.slider.style.height = (window.innerHeight - 40) + "px";
        }
        QB.resize(f.clientWidth, f.clientHeight);
    }
    window.onresize();


    function checkButtonState() {
        var stopButton = _e.tbStop;
        var runButton = _e.tbRun;
        if (GX.sceneActive() || QB.running()) {
            stopButton.style.display = "inline-block";
            runButton.style.display = "none";
        }
        else {
            stopButton.style.display = "none";
            runButton.style.display = "inline-block";
        }
        setTimeout(checkButtonState, 100);
    }
    checkButtonState();
    _init();

    // Virtual File System Viewer
    function _refreshFS() {
        var vfs = QB.vfs();
        var node = vfs.getNode(currPath);
        if (!node) {
            currPath = "/";
            node = vfs.getNode(currPath);
        }

        var contents = _e.fsContents;
        while (contents.firstChild) {
            contents.removeChild(contents.firstChild);
        }

        if (!node) {
            // TODO: better error reporting
            return;
        }

        currPath = vfs.fullPath(node)
        _e.fsUrl.innerHTML = currPath;

        if (currPath != "/") {
            var a = document.createElement("a");
            a.className = "fs-dir";
            a.innerHTML = "..";
            a.fullpath = currPath + "/..";
            a.onclick = function() { chdir(this.fullpath); };
            contents.appendChild(a);
            contents.appendChild(document.createElement("span"));
        }

        var folders = vfs.getChildren(node, vfs.DIRECTORY);
        for (var i=0; i < folders.length; i++) {
            var a = document.createElement("a");
            a.className = "fs-dir";
            a.innerHTML = folders[i].name;
            a.fullpath = vfs.fullPath(folders[i]);
            a.onclick = function() { chdir(this.fullpath); };
            contents.appendChild(a);
            a = document.createElement("a");
            a.className = "fs-delete";
            a.vfsnode = folders[i];
            a.onclick = function() { deleteDir(this.vfsnode); };
            contents.appendChild(a);
        }

        var files = vfs.getChildren(node, vfs.FILE);
        for (var i=0; i < files.length; i++) {
            var a = document.createElement("a");
            a.className = "fs-file";
            a.innerHTML = files[i].name;
            a.fullpath = vfs.fullPath(files[i]);
            a.onclick = function() { saveFile(this.fullpath); };
            contents.appendChild(a);
            a = document.createElement("a");
            a.className = "fs-delete";
            a.vfsnode = files[i];
            a.onclick = function() { deleteFile(this.vfsnode); };
            contents.appendChild(a);
        }

        function deleteFile(node) {
            if (confirm("This will permanently delete file '" + node.name + "'.\nAre you sure you wish to continue?")) {
                vfs.removeFile(node);
                _refreshFS();
            }
        }

        function deleteDir(node) {
            if (vfs.getChildren(node).length > 0) {
                alert("Directory is not empty.");
                return;
            }
            if (confirm("This will permanently delete directory '" + node.name + "'.\nAre you sure you wish to continue?")) {
                vfs.removeDirectory(node);
                _refreshFS();
            }
        }
    }

    function _onNewDirectory() {
        var vfs = QB.vfs();
        var parent = vfs.getNode(currPath);
        var dirname = prompt("Enter new directory name");
        if (dirname && dirname != "") {
            vfs.createDirectory(dirname, parent);
            _refreshFS();
        }
    }

    function chdir(path) {
        currPath = path;
        _refreshFS();
    }

    function saveFile(path) {
        var vfs = QB.vfs();
        var fileNode = vfs.getNode(path);
        var fileBlob = new Blob([fileNode.data]);
        var url = URL.createObjectURL(fileBlob);

        var link = document.createElement("a");
        link.href = url;
        link.download = fileNode.name;
        link.click();
    }

    async function fileDrop(e) {
        if (currTab != "fs") { return; }
        e.stopPropagation();
        e.preventDefault();
        dropArea.style.backgroundColor = "transparent";

        var dt = e.dataTransfer;
        var files = dt.files;

        var vfs = QB.vfs();
        var parentDir = vfs.getNode(currPath);
        var fr = new FileReader();

        for (var i=0; i < files.length; i++) {
            var f = files[i];
            if (!f.type && f.size%4096 == 0) { 
                // this is a folder, skip
                continue;
            }
            
            var file = vfs.createFile(f.name, parentDir);
            var data = await f.arrayBuffer();
            vfs.writeData(file, data);
        }

        _refreshFS();
    }

    function _onUploadFile() {
        _uploadFile(_e.fsUrl.innerHTML, null, function() {
            _refreshFS();
        });
    }

    function _uploadFile(destpath, filter, fnCallback) {
        var vfs = QB.vfs();
        var parentDir = null;
        if (destpath == undefined || destpath == "" || destpath == "/") {
            parentDir = vfs.rootDirectory(); //QB.vfsCwd();
        }
        else {
            parentDir = vfs.getNode(destpath, vfs.rootDirectory()); //QB.vfsCwd());
            if (!parentDir) {
                throw Object.assign(new Error("Path not found: [" + destpath + "]"), { _stackDepth: 1 });
            }
            else if (parentDir && parentDir.type != vfs.DIRECTORY) {
                throw Object.assign(new Error("Path is not a directory: [" + destpath + "]"), { _stackDepth: 1 });
            }
        }
        var fileInput = document.getElementById("upload-file-input");
        if (fileInput == null) {
            fileInput = document.createElement("input");
            fileInput.id = "upload-file-input";
            fileInput.type = "file";
        }
        fileInput.value = null;
        if (filter != undefined) {
            fileInput.accept = filter;
        }
        fileInput.onchange = function(event) {
            if (event.target.files.length > 0) {
                var f = event.target.files[0];
                var fr = new FileReader();
                fr.onload = function() {
                    var file = vfs.createFile(f.name, parentDir);
                    vfs.writeData(file, fr.result);
                    
                    if (fnCallback) {
                        fnCallback(vfs.fullPath(file));
                    }
                }
                fr.readAsArrayBuffer(f);
            }
        };
        fileInput.click();
    }

    function _convert437ToUTF() {
        var str = editor.getValue();
        editor.setValue(QB.convertToUTF(str));
    }

    function _convertUTFTo437() {
        var str = editor.getValue();
        editor.setValue(QB.convertTo437(str));
    }

    _e.slider.addEventListener("mousedown", function(event) {
        sliding = true;
    });
    _e.vslider.addEventListener("mousedown", function(event) {
        vsliding = true;
    });

    window.addEventListener("mousemove", function(event) {
        if (!sliding && !vsliding) { return; }
        if (sliding) {
            splitWidth = event.pageX - 10;
            window.onresize();
        }
        else {
            splitHeight = window.innerHeight - event.pageY + 35;
            window.onresize();
        }
    });

    window.addEventListener("mouseup", function() {
        sliding = false;
        vsliding = false;
    });



    function fileDragEnter(e) {
        if (currTab != "fs") { return; }
        e.stopPropagation();
        e.preventDefault();

        dropArea.style.backgroundColor = "rgb(255,255,255,.1)";
    }

    function fileDragLeave(e) {
        if (currTab != "fs") { return; }
        e.stopPropagation();
        e.preventDefault();

        dropArea.style.backgroundColor = "transparent";
    }

    function fileDragOver(e) {
        if (currTab != "fs") { return; }
        e.stopPropagation();
        e.preventDefault();
    }

    var dropArea = _e.outputContent;
    dropArea.addEventListener("drop", fileDrop, false);
    dropArea.addEventListener("dragover", fileDragOver, false);
    dropArea.addEventListener("dragenter", fileDragEnter, false);
    dropArea.addEventListener("dragleave", fileDragLeave, false);

    if (!inIframe() && appMode == "ide") {
        addEventListener("beforeunload", function(e) {
            e.preventDefault();
            return e.returnValue = "stop";
        });
    }

    function inIframe () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    this.mode = function() { return appMode; }
    this.getErrorLine = _getErrorLine;
    this.runProgram = _runProgram;
    this.stopProgram = _stopProgram;
    this.shareProgram = _shareProgram;
    this.changeTheme = _changeTheme;
    this.showOptionDialog = _showOptionDialog;
    this.showMethodDialog = _showMethodDialog;
    this.showDialog = _showDialog;
    this.exportProgram = _exportProgram;
    this.saveProject = _saveProject;
    this.openProject = _openProject;
    this.onSelMainProg = _onSelMainProg;
    this.testShare = _testShare;
    this.closeDialog = _closeDialog;
    this.gotoWarning = _gotoWarning;
    this.addWarningCell = _addWarningCell;
    this.showConsole = _showConsole;
    this.changeTab = _changeTab;
    this.changeMethodTab = _changeMethodTab;
    this.showHelp = _showHelp;
    this.slideLeft = _slideLeft;
    this.slideRight = _slideRight;
    this.refreshFS = _refreshFS;
    this.onNewDirectory = _onNewDirectory;
    this.onUploadFile = _onUploadFile;
    this.uploadFile = _uploadFile;
    this.convert437ToUTF = _convert437ToUTF;
    this.convertUTFTo437 = _convertUTFTo437;
};