Const NONE = "NONE"
Const FATAL = "FATAL"
Const ERROR = "ERROR"
Const WARN = "WARN"
Const INFO = "INFO"
Const DEBUG = "DEBUG"
Const TRACE = "TRACE"
Const ALL = "ALL"

Export NONE, FATAL, ERROR, WARN, INFO, DEBUG, TRACE, ALL
Export Log, LogLevel, Echo

Dim Shared levelMap(0)
levelMap(NONE) = 0
levelMap(FATAL) = 1
levelMap(ERROR) = 2
levelMap(WARN) = 3
levelMap(INFO) = 4
levelMap(DEBUG) = 5
levelMap(TRACE) = 6
levelMap(ALL) = 7
Dim Shared level As Integer
level = 4

Sub LogLevel (newLevel)
    level = levelMap(newLevel)
End Sub

Function LogLevel
    LogLevel = level
End Function

Sub Log (msg As String, msgType As String)
    If msgType = undefined Then msgType = INFO
    Dim ll As Integer
    ll = levelMap(msgType)
    If ll > level Then Exit Sub

    $If Javascript Then
        var t = document.querySelector("#warning-container table");
        var errorLine = await getErrorLine(new Error(), 1);
        if (!t || appMode != "ide") { 
            console.log(msgType + ":" + errorLine + ":" + msg);
            return; 
        }
        var tr = document.createElement("tr");
        addWarningCell(tr, msgType);
        addWarningCell(tr, ":");
        addWarningCell(tr, errorLine);
        addWarningCell(tr, ":");
        addWarningCell(tr, await func_EscapeHtml(msg), "99%");
        tr.codeLine = errorLine - 1;
        tr.onclick = gotoWarning;
        t.append(tr);
        var container = document.getElementById("output-content");
        container.scrollTop = container.scrollHeight;
        changeTab("console");
    $End If
End Sub

Sub Echo (msg As String)
    $If Javascript Then
        var t = document.querySelector("#warning-container table");
        if (!t || appMode != "ide") {
            console.log(msg); 
            return;
        }
        var tr = document.createElement("tr");
        addWarningCell(tr, await func_EscapeHtml(msg));
        tr.firstChild.colSpan = "5";
        t.append(tr);
        var container = document.getElementById("output-content");
        container.scrollTop = container.scrollHeight;
        changeTab("console");
    $End If
End Sub

Function EscapeHtml (text As String)
    text = GXSTR_Replace(text, "&", "&amp;")
    text = GXSTR_Replace(text, "<", "&lt;")
    text = GXSTR_Replace(text, ">", "&gt;")
    text = GXSTR_Replace(text, Chr$(34), "&quot;")
    text = GXSTR_Replace(text, "'", "&#039;")
    EscapeHtml = text
End Function