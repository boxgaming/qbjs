Const ALL = 0
Const FILE = 1
Const DIRECTORY = 2

Export ALL, FILE, DIRECTORY
Export ListDirectory, DownloadFile, UploadFile

Function ListDirectory(dirpath As String, listMode As Integer)
    If dirpath = undefined Then dirpath = ""
    If listMode = undefined Then listMode = ALL

    Dim children As Object

    $If Javascript Then
        var vfs = QB.vfs();
        var pnode = null;
        if (dirpath == "") {
            pnode = QB.vfsCwd();
        }
        else {
            pnode = vfs.getNode(dirpath, QB.vfsCwd());
        }
        if (!pnode) {
            throw Object.assign(new Error("Path not found: [" + dirpath + "]"), { _stackDepth: 1 });
        }
        var mode = null;
        if (listMode == DIRECTORY) {
            mode = vfs.DIRECTORY;
        }
        else if (listMode == FILE) {
            mode = vfs.FILE;
        }
        children = vfs.getChildren(pnode, mode);
    $End If
    
    Dim type, i As Integer
    Dim results(children.length) As Object
    For i = 0 To children.length - 1
        results(i+1).name = children[i].name
        $If Javascript Then
            if (children[i].type == vfs.FILE) { 
                type = FILE;
            }
            else {
                type = DIRECTORY;
            }
        $End If
        results(i+1).type = type
    Next i

    ListDirectory = results
End Function

Sub DownloadFile(filepath As String)
    $If Javascript Then
        var vfs = QB.vfs();
        var file = vfs.getNode(filepath, QB.vfsCwd());
        if (!file || file.type != vfs.FILE) {
            throw Object.assign(new Error("File not found: [" + filepath + "]"), { _stackDepth: 1 });
        }
        await QB.downloadFile(new Blob([file.data]), file.name);
    $End If
End Sub

Sub UploadFile(destpath As String, filter As String, fnCallback)
    $If Javascript Then
        var vfs = QB.vfs();
        var parentDir = null;
        if (destpath == undefined || destpath == "") {
            parentDir = QB.vfsCwd();
        }
        else {
            parentDir = vfs.getNode(destpath, QB.vfsCwd());
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
    $End If
End Sub
