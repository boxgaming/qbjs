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

async function init() {
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
        document.getElementById("gx-load-screen").style.display = "block";
    }

    // initialize the code editor
    editor = CodeMirror(document.querySelector("#code"), {
        lineNumbers: true,
        tabSize: 4,
        indentUnit: 4,
        value: qbcode,
        module: "qbjs",
        theme: "qbjs",
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

    document.getElementsByClassName("CodeMirror-cursor")[0].innerHTML = " ";


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

async function runProgram() {
    document.getElementById("gx-load-screen").style.display = "none";

    if (sizeMode == "max") {
        slideLeft();
    }
    GX.reset();
    QB.start();
    var qbCode = editor.getValue();
    if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
    var jsCode = await QBCompiler.compile(qbCode);

    await displayWarnings();

    var jsDiv = document.getElementById("js-code");
    jsDiv.innerHTML = jsCode;
    window.onresize();

    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        var codeFn = new AsyncFunction(jsCode);
        await codeFn();
    }
    catch (error) {
        console.error(error);

        // find the source line, if possible
        var srcLine = "";
        if (error.line) {
            srcLine = error.line - 1;
        }
        var stack = error.stack.split("\n");
        for (var i=0; i < stack.length; i++) {
            // chrome
            if (stack[i].trim().startsWith("at eval (eval at runProgram")) {
                var idx = stack[i].indexOf("<anonymous>:");
                var pos = stack[i].substring(idx + 12); 
                pos = pos.substring(0, pos.length - 1);   
                pos = pos.split(":");
                srcLine = pos[0] - 2;
            }
            // firefox
            else if (stack[i].trim().indexOf("> AsyncFunction:") > -1) {
                var idx = stack[i].indexOf("> AsyncFunction:");
                var pos = stack[i].substring(idx + 16); 
                pos = pos.split(":");
                srcLine = pos[0] - 2;
            }
        }

        if (!isNaN(srcLine)) {
            srcLine = QBCompiler.getSourceLine(srcLine);
        }

        var table = document.getElementById("warning-table");
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

        /*var wdiv = document.getElementById("warning-container");
        var div = document.createElement("div");
        div.innerHTML = error.name + ": " + error.message + "\n" + error.stack;
        wdiv.appendChild(div); */
        consoleVisible = true;
        window.onresize();
        QB.halt();
        GX.sceneStop();
    }
    document.getElementById("gx-container").focus();

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

    var mode = document.getElementById("share-mode").value;
    var codeShare = document.getElementById("share-code");
    var url = baseUrl + "?";
    if (mode) {
        url += "mode=" + mode + "&";
    }
    url += "code=" + b64;
    codeShare.value = url;
    var shareDialog = document.getElementById("share-dialog");
    if (!shareDialog.open) {
        shareDialog.showModal();
    }
    codeShare.focus();
    codeShare.select();

    var exportVisible = (mode == "play" || mode == "auto");
    document.getElementById("export-button").style.display = (exportVisible) ? "block" : "none";
}

async function exportProgram() {
    var zip = new JSZip();

    var qbCode = editor.getValue();
    if (!QBCompiler) { QBCompiler = await _QBCompiler(); }
    var jsCode = "async function __qbjs_run() {\n" + await QBCompiler.compile(qbCode) + "\n}";

    var mode = document.getElementById("share-mode").value;
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
    //alert("addVFSFiles: " + parent);
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
        const link = document.createElement("a");
        link.href = URL.createObjectURL(progFile);
        link.download = "program.bas";
        link.click();
        link.remove();
    }

    // save a project .zip file
    else {
        var zip = new JSZip();
        zip.file("main.bas", editor.getValue());

        var vfs = QB.vfs();
        var node = vfs.getNode("/");
        addVFSFiles(vfs, zip, node);
        
        zip.generateAsync({type:"blob"}).then(function(content) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "project.zip";
            link.click();
            link.remove();
        });
    }
}

async function openProject() {
    var f = document.getElementById("file-input");
    f.click();
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
document.getElementById("file-input").onchange = onOpenProject;

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
            var fileList = document.getElementById("prog-sel-sources");
            fileList.innerHTML = "";
            for (var i=0; i < basFiles.length; i++) {
                var opt = new Option(basFiles[i], basFiles[i]);
                fileList.append(opt);
            }
            var progSelDlg = document.getElementById("prog-sel-dialog");
            progSelDlg.showModal();
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
    var fileList = document.getElementById("prog-sel-sources");
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

function closeProgSelDlg() {
    var progSelDlg = document.getElementById("prog-sel-dialog");
    progSelDlg.close();
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
    var url = document.getElementById("share-code").value;
    open(url, "_blank");
}

function closeDialog() {
    document.getElementById("share-dialog").close();
}

async function displayWarnings() {
    var wstr = "";
    var w = await QBCompiler.getWarnings();
    warnCount = w.length;

    var wdiv = document.getElementById("warning-container");
    wdiv.innerHTML = "";
    var table = document.createElement("table");
    table.width = "100%";
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
            tr.onclick = gotoWarning; /*function() {
                if (selectedError ) { selectedError.style.backgroundColor = "transparent"; }
                editor.setCursor({ line: this.codeLine}); 
                this.style.backgroundColor = "#333";
                selectedError = this;
            };*/
        }
    }
    if (!consoleVisible && w.length > 0) {
        consoleVisible = true;
    }
}

function gotoWarning() {
    if (selectedError ) { selectedError.style.backgroundColor = "transparent"; }
                editor.setCursor({ line: this.codeLine}); 
                this.style.backgroundColor = "#333";
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
    window.dispatchEvent(new Event('resize'));
    //window.onresize();
}

function changeTab(tabName) {
    if (tabName == currTab) { return; }
    document.getElementById("tab-" + currTab).classList.remove("active");
    document.getElementById("tab-" + tabName).classList.add("active");
    currTab = tabName;

    if (currTab == "console") {
        document.getElementById("warning-container").style.display = "block";
        document.getElementById("js-code").style.display = "none";
        document.getElementById("fs-browser").style.display = "none";
    }
    else if (currTab == "js") {
        document.getElementById("warning-container").style.display = "none";
        document.getElementById("fs-browser").style.display = "none";
        document.getElementById("js-code").style.display = "block";
    }
    else if (currTab == "fs") {
        document.getElementById("fs-browser").style.display = "block";
        document.getElementById("warning-container").style.display = "none";
        document.getElementById("js-code").style.display = "none";
        refreshFS();
    }
}

function displayTypes() {
    var tstr = "";
    var t = QBCompiler.getTypes();
    for (var i=0; i < t.length; i++) {
        tstr += t[i].name
    }
    var wdiv = document.getElementById("warning-container");
    wdiv.innerHTML = tstr;
}

function slideLeft() {
    document.getElementById("slider-right").style.display = "block";
    if (sizeMode == "max" && window.innerWidth >= 1200) {
        sizeMode = "normal"
    }
    else {
        sizeMode = "min"
        document.getElementById("slider-left").style.display = "none";
    }
    //window.onresize();
    window.dispatchEvent(new Event('resize'));
}

function slideRight() {
    document.getElementById("slider-left").style.display = "block";
    if (sizeMode == "min" && window.innerWidth >= 1200) {
        sizeMode = "normal"
    }
    else {
        sizeMode = "max"
        document.getElementById("slider-right").style.display = "none";
    }
    //window.onresize();
    window.dispatchEvent(new Event('resize'));
}

window.onresize = function() {
    if (!editor) { return; }

    var f = document.getElementById("gx-container");
    var jsDiv = document.getElementById("output-container");

    if (appMode == "play" || appMode == "auto") {
        f.style.left = "0px";
        f.style.top = "0px";
        f.style.width = window.innerWidth;
        f.style.height = window.innerHeight;
        f.style.border = "0px";
        document.getElementById("code-container").style.display = "none";
        document.getElementById("slider").style.display = "none";
        document.getElementById("show-js-container").style.display = "none";
        document.getElementById("game-container").style.left = "0px";
        document.getElementById("game-container").style.top = "0px";
        jsDiv.style.display = "none";
        document.getElementById("logo").style.display = "none";
    }
    else {
        var cmwidth = 600;
        if (sizeMode == "min") {
            cmwidth = 0;
            editor.getWrapperElement().style.display = "none";
            document.getElementById("code").style.borderRight = "0";
            document.getElementById("game-container").style.display = "block";
            document.getElementById("edit-button").style.display = "block";
        }
        else if (sizeMode == "max") {
            cmwidth = window.innerWidth - 25;
            document.getElementById("game-container").style.display = "none";
            document.getElementById("code").style.borderRight = "1px solid #666";
            document.getElementById("slider").style.border = "1px solid #666";
            document.getElementById("slider").style.borderLeft = "0";
            editor.getWrapperElement().style.display = "block";
            document.getElementById("edit-button").style.display = "none";
        }
        else {
            editor.getWrapperElement().style.display = "block";
            document.getElementById("game-container").style.display = "block";
            document.getElementById("code").style.borderRight = "1px solid #666";
            document.getElementById("slider").style.border = "0";
            document.getElementById("edit-button").style.display = "none";
        }

        document.getElementById("game-container").style.left = (cmwidth + 20) + "px";
        f.style.width = (window.innerWidth - (cmwidth + 35)) + "px";
        jsDiv.style.width = f.style.width;            

        document.getElementById("slider").style.left = (cmwidth + 12) + "px";

        if (consoleVisible) { 
            f.style.height = (window.innerHeight - 337) + "px";
            jsDiv.style.display = "block";
            jsDiv.style.top = (window.innerHeight - 327) + "px";
            document.getElementById("toggle-console").innerHTML = "Hide Console";
            /*if (currTab == "console") {
                document.getElementById("warning-container").style.display = "block";
                document.getElementById("js-code").style.display = "none";
            }
            else {
                document.getElementById("warning-container").style.display = "none";
                document.getElementById("js-code").style.display = "block";
            }*/
        }
        else {
            f.style.height = (window.innerHeight - 50) + "px";
            jsDiv.style.display = "none";
            document.getElementById("toggle-console").innerHTML = "Show Console";
        }
        document.getElementById("show-js-container").style.top = (window.innerHeight - 45) + "px";
        document.getElementById("show-js-container").style.right = "5px";
        
        editor.setSize(cmwidth, window.innerHeight - 79);
        //document.getElementById("code").style.height = (window.innerHeight - 50) + "px";
        document.getElementById("code").style.height = (window.innerHeight - 79) + "px";
        document.getElementById("slider").style.height = (window.innerHeight - 50) + "px";
    }
    //QB.resize(f.style.width.replace("px", ""), f.style.height.replace("px", ""));
    QB.resize(f.clientWidth, f.clientHeight);
}
window.onresize();

function checkButtonState() {
    var stopButton = document.getElementById("stop-button");
    if (GX.sceneActive() || QB.running()) {
        stopButton.style.display = "inline";
    }
    else {
        stopButton.style.display = "none";
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

    var contents = document.getElementById("fs-contents");
    while (contents.firstChild) {
        contents.removeChild(contents.firstChild);
    }

    if (!node) {
        // TODO: better error reporting
        return;
    }

    currPath = vfs.fullPath(node)
    document.getElementById("fs-url").innerHTML = currPath;

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

var dropArea = document.getElementById("output-content");
dropArea.addEventListener("drop", fileDrop, false);
dropArea.addEventListener("dragover", fileDragOver, false);
dropArea.addEventListener("dragenter", fileDragEnter, false);
dropArea.addEventListener("dragleave", fileDragLeave, false);
