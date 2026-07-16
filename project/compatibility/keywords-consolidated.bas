IncludeJS "/qbjs/util/showdown.min.js"
Import Dom From "lib/web/dom.bas"
Import Console From "lib/web/console.bas"
Import String From "lib/lang/string.bas"
Import JSArray From "lib/lang/array.bas"
Import Sys From "lib/lang/system.bas"
Option Explicit

Type Keyword
    As String name, sname, level, levelDetail
    As Integer qb, qbjs, qb64, qbpe
End Type

Dim Shared As Object keywords, tbody, filter, sconverter
sconverter = Sys.Construct("Converter", globalThis.showdown)
Sys.Call sconverter.setFlavor, sconverter, "github"
keywords = JSArray.Create

Dim Shared As String imgQBJS, imgQB, imgQB64, imgQBPE
imgQBJS = "../../logo.png"
imgQB = "https://softradar.com/static/products/qbasic/qbasic-logo.jpg"
imgQB64 = "https://qb64phoenix.com/qb64wiki/images/9/91/Qb64.png"
imgQBPE = "https://qb64phoenix.com/qb64wiki/images/0/07/Qbpe.png"

Dim As Object style
style = Dom.Create("style", document.head)
style.innerText = "body, table, select { font-size: 14px; color #333 } " + _
    ".keyword-table { width: 100%; color: #333 } " + _
    ".keyword-table td { vertical-align: left; padding: 2px 4px } " + _
    ".keyword-table th { background-color: #ccc; padding: 4px } " + _
    ".keyword-table td { background-color: #efefef }"

Dim As Object panel, container, canvas
canvas = Dom.GetImage(0)
canvas.style.display = "none"
container = Dom.Container
container.style.backgroundColor = "#fff"
container.style.textAlign = "center"
container.style.overflow = "auto"
panel = Dom.Create("div")
panel.style.display = "inline-block"
panel.style.color = "#333"
panel.style.textAlign = "left"
panel.style.width = "75%"
Dom.Create "h1", panel, "QBJS - QBasic Family Compatibility"

Dim As Object filterPanel
filterPanel = Dom.Create("div", panel)
filterPanel.style.textAlign = "right"
Dom.Create "span", filterPanel, "Filter: "
filter = Dom.Create("select", filterPanel)
Dom.Create "option", filter, "All"
Dom.Create "option", filter, "QBJS"
Dom.Create "option", filter, "QBasic"
Dom.Create "option", filter, "QB64"
Dom.Create "option", filter, "QB64 Phoenix"
Dom.Event filter, "change", @RefreshTable

LoadSupported
LoadUnsupported
JSArray.Sort keywords, @SortByName

Dim As Object table, tr, th, thead
table = Dom.Create("table", panel)
table.className = "keyword-table"
thead = Dom.Create("thead", table)
tr = Dom.Create("tr", thead)
Dom.Create "th", tr, "Keyword"
th = Dom.Create("th", tr, "Platforms")
th.colSpan = 4
th = Dom.Create("th", tr, "QBJS Support Detail")
th.colSpan = 2
tbody = Dom.Create("tbody", table)

RefreshTable

Sub RefreshTable
    tbody.innerHTML = ""
    Dim i As Integer
    For i = 0 To JSArray.Length(keywords) - 1
        Dim k As Keyword
        k = JSArray.Item(keywords, i)
        If filter.value = "All" OrElse _
          (filter.value = "QBJS" And k.qbjs) OrElse _
          (filter.value = "QBasic" And k.qb) OrElse _
          (filter.value = "QB64" And k.qb64) OrElse _
          (filter.value = "QB64 Phoenix" And k.qbpe) Then
            AddKeywordRow tbody, k
        End If
    Next i
End Sub

Sub AddKeywordRow (table As Object, k As Keyword)
    Dim As Object tr, td
    tr = Dom.Create("tr", table)
    td = Dom.Create("td", tr, k.name)
    td.style.whiteSpace = "nowrap"
    td = Dom.Create("td", tr): If k.qbjs Then AddImage td, imgQBJS
    td = Dom.Create("td", tr): If k.qb Then AddImage td, imgQB
    td = Dom.Create("td", tr): If k.qb64 Then AddImage td, imgQB64
    td = Dom.Create("td", tr): If k.qbpe Then AddImage td, imgQBPE
    Dom.Create "td", tr, k.level
    Dom.Create "td", tr, k.levelDetail
End Sub

Function SortByName (a, b)
    If a.sname < b.sname Then
        SortByName = -1
    ElseIf a.sname > b.sname Then
        SortByName = 1
    End If
End FUnction

Sub AddImage (parent As Object, path As String)
    Dim img As Object
    img = Dom.Create("img", parent)
    img.src = path
    img.height = "24"
    img.width = "24"
    img.style.marginRight = "2px"
End Sub

Function DownloadText (url As String)
    Dim result As String
    Open url For Binary As #1
    If Not EOF(1) Then
        result = Space$(LOF(1))
        Get #1, , result
    End If
    Close #1
    DownloadText = result
End Function

Sub LoadSupported
    Dim As Integer idx
    Dim As String raw, tables(2)
    raw = DownloadText("https://raw.githubusercontent.com/wiki/boxgaming/qbjs/Supported-Keywords.md")

    Dim i As Integer
    For i = 1 To 5
        idx = InStr(raw, "--|" + Chr$(10))
        raw = Mid$(raw, idx+4)
        
        idx = InStr(raw, "|" + Chr$(10) + Chr$(10))
        tables(i) = Mid$(raw, 1, idx-1)

        If i = 3 Then idx = InStr(raw, "## QB64PE Keywords")
        raw = Mid$(raw, idx+2)
    Next i
    
    For i = 1 To 5
        Dim lines(0) As String
        lines = String.Split(tables(i), Chr$(10))
        Dim j As Integer
        For j = 1 To UBound(lines)
            Dim parts(0) As String
            String.Split lines(j), "|", parts
            Dim k As Keyword
            k.name = parts(2)
            If Mid$(k.name, 1, 1) = "[" Then
                idx = InStr(k.name, "]")
                k.name = Mid$(k.name, 2, idx-2)
            End If
            k.sname = UCase$(k.name)
            Dim firstChar As String
            firstChar = Mid$(k.sname, 1, 1)
            If firstChar = "_" Or firstChar = "$" Then k.sname = UCase$(Mid$(k.sname, 2))
            If i = 1 Then k.qb = -1
            If i <> 3 Then
                k.level = parts(3)
                k.levelDetail = Sys.Call(sconverter.makeHtml, sconverter, parts(4))
                If i < 3 Then k.qb64 = -1
                k.qbpe = -1
            End If
            k.qbjs = -1
            
            JSArray.Push keywords, k
        Next j
    Next i
End Sub

Sub LoadUnsupported
    Dim As Integer idx
    Dim As String raw, tables(3)
    raw = DownloadText("https://raw.githubusercontent.com/wiki/boxgaming/qbjs/Unsupported-Keywords.md")
    
    Dim i As Integer
    For i = 1 To 3
        idx = InStr(raw, "----" + Chr$(10))
        raw = Mid$(raw, idx+4)
        
        idx = InStr(raw, "|" + Chr$(10) + Chr$(10))
        tables(i) = Mid$(raw, 1, idx-1)
        raw = Mid$(raw, idx+2)
    Next i
    
    For i = 1 To 3
        Dim lines(0) As String
        String.Split tables(i), Chr$(10), lines
        Dim j As Integer
        For j = 1 To UBound(lines)
            If Trim(lines(j)) = "" Then Continue
            Dim parts(0) As String
            String.Split lines(j), "|", parts
            Dim k As Keyword
            k.name = parts(1)
            If i = 1 Then
                If Mid$(k.name, 1, 1) = "_" Then
                    k.name = Mid$(k.name, 2, Len(k.name)-2)
                Else
                    k.qb64 = -1
                    k.qbpe = -1
                End If
            End If
            If i = 1 Then 
                k.qb = 1
            ElseIf i = 2 Then 
                k.qb64 = -1
                k.qbpe = -1
            Else
                k.qbpe = -1
            End If
            k.sname = UCase$(k.name)
            Dim firstChar As String
            firstChar = Mid$(k.sname, 1, 1)
            If firstChar = "_" Or firstChar = "$" Then k.sname = UCase$(Mid$(k.sname, 2))
            Dim As String issue, issueUrl
            issue = Trim$(parts(3))
            If Mid$(issue, 1, 1) = "[" Then
                k.level = "<i>Planned</i>"
                k.levelDetail = Sys.Call(sconverter.makeHtml, sconverter, issue)
            End If
            JSArray.Push keywords, k
        Next j
    Next i
End Sub