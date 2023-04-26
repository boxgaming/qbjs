var QBCompiler = null; 
// if code has been passed on the query string load it into the editor
var qbcode = "";
var url = location.href;
var sizeMode = "normal";
var appMode = "ide";
var consoleVisible = false;
var currTab = "js";
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
};

function _el(id) {
    return document.getElementById(id);
}

async function init() {
    _e.ideTheme.href = "codemirror/themes/" + theme + ".css";
    document.body.style.display = "initial";

    if (window.innerWidth < 1200) {
        sizeMode = "max";
    }

    var srcUrl = null;
    if (url && url.indexOf("?")) {
        var queryString = url.substring(url.indexOf("?")+1);
        var nvpairs = queryString.split("&");
        for (var i = 0; i < nvpairs.length; i++) {
            var nv = nvpairs[i].split("=");
            if (nv[0] == "qbcode") {
                var zin = new Shorty();
                qbcode = zin.inflate(atob(nv[1]));
                break;
            }
            else if (nv[0] == "code") {
                qbcode = LZUTF8.decompress(nv[1], { inputEncoding: "Base64" });
            }
            else if (nv[0] == "mode") {
                appMode = nv[1];
            }
            else if (nv[0] == "src") {
                srcUrl = nv[1];
            }
            else if (nv[0] == "main") {
                mainProg = nv[1];
            }
        }
    }
    if (appMode == "play") {
        _e.loadScreen.style.display = "block";
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
                event.preventDefault();
                runProgram();
            }
            // compile
            else if (event.code == 'F11') {
                event.preventDefault();
                shareProgram();
            }
        });
    }
    
    if (srcUrl) {
        var res = await fetch(nv[1]);
        var contentType = res.headers.get("Content-Type");
        if (contentType == "application/zip") {
            // load a project
            await loadProject(await res.arrayBuffer(), mainProg);
            // TODO: shouldn't have to do this
            //qbcode = editor.getValue();
        }
        else {
            // otherwise, assume a single source file
            var decoder = new TextDecoder("iso-8859-1");
            qbcode = decoder.decode(await res.arrayBuffer());
            editor.setValue(qbcode);
        }
    }

    var warnCount = 0;
    changeTab("console");
    window.onresize();

    if (appMode == "auto") {
        runProgram();
    }
}    

async function getErrorLine(error, stackDepth) {
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
    var stack = error.stack.split("\n");
    for (var i=0; i < stack.length; i++) {
        // chrome
        if (stack[i].trim().indexOf("(eval at runProgram") > -1) {
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

async function runProgram() {
    _e.loadScreen.style.display = "none";

    if (sizeMode == "max") {
        slideLeft();
    }
    GX.reset();
    QB.start();
    var qbCode = editor.getValue();
    if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
    var jsCode = await QBCompiler.compile(qbCode);

    await displayWarnings();

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
        var srcLine = await getErrorLine(error);
        console.log("returned: " + srcLine);

        var table = _el("warning-table");
        if (table) {
            tr = document.createElement("tr");
            addWarningCell(tr, "ERROR");
            addWarningCell(tr, ":");
            addWarningCell(tr, srcLine);
            addWarningCell(tr, ":");
            addWarningCell(tr, "<div style='white-space:pre'>" + error.message + "\n<div style='color:#666'>" + error.stack + "</div></div>", "99%");
            tr.codeLine = srcLine - 1;
            tr.onclick = gotoWarning;
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

function stopProgram() {
    QB.halt();
    GX.sceneStop();
}

function shareProgram() {
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
    _e.exportButton.style.display = (exportVisible) ? "block" : "none";
}

function changeTheme(newTheme) {
    theme = newTheme;
    _e.ideTheme.href = "codemirror/themes/" + theme + ".css";
    editor.setOption("theme", theme);
}

function showDialog(dlg) {
    if (typeof dlg == "string") {
        dlg = _el(dlg);
    }
    if (!dlg.open) {
        dlg.showModal();
    }
}

async function exportProgram() {
    var zip = new JSZip();

    var qbCode = editor.getValue();
    if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
    var jsCode = "async function __qbjs_run() {\n" + await QBCompiler.compile(qbCode) + "\n}";

    var mode = _e.shareMode.value;
    zip.file("index.html", await getFile("export/" + mode + ".html", "text"));
    zip.file("program.js", jsCode);
    zip.file("fullscreen.png", await getFile("export/fullscreen.png", "blob"));
    zip.file("logo.png", await getFile("logo.png", "blob"));
    zip.file("dosvga.ttf", await getFile("dosvga.ttf", "blob"));
    zip.file("play.png", await getFile("play.png", "blob"));
    zip.file("qbjs.css", await getFile("export/qbjs.css", "text"));
    zip.file("qb.js", await getFile("qb.js", "text"));
    zip.file("vfs.js", await getFile("vfs.js", "text"));

    zip.file("gx/gx.js", await getFile("gx/gx.js", "text"));
    zip.file("gx/__gx_font_default.png", await getFile("gx/__gx_font_default.png", "blob"));
    zip.file("gx/__gx_font_default_black.png", await getFile("gx/__gx_font_default_black.png", "blob"));

    // include vfs content
    var vfs = QB.vfs();
    var node = vfs.getNode("/");
    addVFSFiles(vfs, zip, node);
    
    zip.generateAsync({type:"blob"}).then(function(content) {
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

async function saveProject() {
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
        
        zip.generateAsync({type:"blob"}).then(function(content) {
            QB.downloadFile(content, "project.zip");
        });
    }
}

async function openProject() {
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

async function loadProject(zipData, mainFilename) {
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
        for (let [filename, file] of Object.entries(zip.files)) {
            fnames += filename + " - " + zip.files[filename].name + "\n";
            var parentDir = dirFromPath(vfs.getParentPath(filename));
            if (filename.toLowerCase() == mainFilename) {
                var text = await zip.file(filename).async("text");
                editor.setValue(text);
                mainFound = true;
            }
            else {
                console.log(filename);
                if (zip.file(filename)) {
                    var fdata = await zip.file(filename).async("arraybuffer");
                    var f = vfs.createFile(vfs.getFileName(filename), parentDir);
                    vfs.writeData(f, fdata);
                    if (filename.toLowerCase().endsWith(".bas")) {
                        basFiles.push(filename);
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
            showDialog(_e.progSelDialog);
        }

        refreshFS();
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

function onSelMainProg() {
    var fileList = _e.progSelSources;
    if (fileList.value == "") {
        alert("No file selected.");
    }
    else {
        var vfs = GX.vfs();
        var file = vfs.getNode("/" + fileList.value);
        editor.setValue(vfs.readText(file));
        vfs.removeFile(file);
        closeProgSelDlg();
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

function testShare() {
    open(_e.shareCode.value, "_blank");
}

function closeDialog() {
    _e.shareDialog.close();
    _e.progSelDialog.close();
    _e.optionsDialog.close();
    _e.aboutDialog.close();
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
            addWarningCell(tr, "WARN");
            addWarningCell(tr, ":");
            addWarningCell(tr, w[i].line);
            addWarningCell(tr, ":");
            addWarningCell(tr, w[i].text, "99%");
            table.append(tr);
            tr.codeLine = w[i].line - 1;
            tr.onclick = gotoWarning;
        }
    }
    if (!consoleVisible && w.length > 0) {
        consoleVisible = true;
    }
}

function gotoWarning() {
    if (selectedError ) { selectedError.classList.remove("selected"); }
    editor.setCursor({ line: this.codeLine}); 
    this.classList.add("selected");
    selectedError = this;
};

function addWarningCell(tr, text, width) {
    var td = document.createElement("td");
    td.innerHTML = text;
    td.vAlign = "top";
    if (width != undefined) {
        td.width = width;
    }
    tr.append(td);
}

function showConsole() {
    consoleVisible = !consoleVisible;
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

function changeTab(tabName) {
    if (tabName == currTab) { return; }
    _el("tab-" + currTab).classList.remove("active");
    _el("tab-" + tabName).classList.add("active");
    currTab = tabName;

    if (currTab == "console") {
        _e.warningContainer.style.display = "block";
        _e.jsCode.style.display = "none";
        _e.fsBrowser.style.display = "none";
    }
    else if (currTab == "js") {
        _e.warningContainer.style.display = "none";
        _e.fsBrowser.style.display = "none";
        _e.jsCode.style.display = "block";
    }
    else if (currTab == "fs") {
        _e.fsBrowser.style.display = "block";
        _e.warningContainer.style.display = "none";
        _e.jsCode.style.display = "none";
        refreshFS();
    }
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

function slideLeft() {
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

function slideRight() {
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
        f.style.width = window.innerWidth;
        f.style.height = window.innerHeight;
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
            f.style.height = (window.innerHeight - splitHeight) + "px";
            jsDiv.style.display = "block";
            jsDiv.style.top = (window.innerHeight - splitHeight + 10) + "px";
            _e.outputContent.style.height = (splitHeight - 77) + "px";
        }
        else {
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
init();

// Virtual File System Viewer
function refreshFS() {
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
            refreshFS();
        }
    }

    function deleteDir(node) {
        if (vfs.getChildren(node).length > 0) {
            alert("Directory is not empty.");
            return;
        }
        if (confirm("This will permanently delete directory '" + node.name + "'.\nAre you sure you wish to continue?")) {
            vfs.removeDirectory(node);
            refreshFS();
        }
    }
}

function onNewDirectory() {
    var vfs = QB.vfs();
    var parent = vfs.getNode(currPath);
    var dirname = prompt("Enter new directory name");
    if (dirname && dirname != "") {
        vfs.createDirectory(dirname, parent);
        refreshFS();
    }
}

function chdir(path) {
    currPath = path;
    refreshFS();
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
    console.log(files);

    var vfs = QB.vfs();
    var parentDir = vfs.getNode(currPath);
    var fr = new FileReader();

    console.log(files.length);
    for (var i=0; i < files.length; i++) {
        console.log("processing[" + i + "]...");

        var f = files[i];
        if (!f.type && f.size%4096 == 0) { 
            // this is a folder, skip
            console.log(" -> skipping folder [" + i + "]");
            continue;
        }
        
        var file = vfs.createFile(f.name, parentDir);
        var data = await f.arrayBuffer();
        console.log(data);        
        vfs.writeData(file, data);
    }

    refreshFS();
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