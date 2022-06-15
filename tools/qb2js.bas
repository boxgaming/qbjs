Option _Explicit
$Console:Only
'$ExeIcon:'./../gx/resource/gx.ico'

Const FILE = 1
Const TEXT = 2
Const False = 0
Const True = Not False

Type CodeLine
    line As Integer
    text As String
End Type

Type Method
    line As Integer
    type As String
    returnType As String
    name As String
    uname As String
    argc As Integer
    args As String
    jsname As String
    sync As Integer
End Type

Type Argument
    name As String
    type As String
End Type

Type QBType
    line As Integer
    name As String
    argc As Integer
    args As String
End Type

Type Variable
    type As String
    name As String
    jsname As String
    isConst As Integer
    isArray As Integer
    arraySize As Integer
    typeId As Integer
End Type

Type Label
    text As String
    index As Integer
End Type

ReDim Shared As CodeLine lines(0)
ReDim Shared As CodeLine jsLines(0)
ReDim Shared As Method methods(0)
ReDim Shared As QBType types(0)
ReDim Shared As Variable typeVars(0)
ReDim Shared As Variable globalVars(0)
ReDim Shared As Variable localVars(0)
ReDim Shared As CodeLine warnings(0)
ReDim Shared As String exportLines(0)
ReDim Shared As Variable exportConsts(0)
ReDim Shared As Method exportMethods(0)
ReDim Shared As String dataArray(0)
ReDim Shared As Label dataLabels(0)
Dim Shared modLevel As Integer
Dim Shared As String currentMethod
Dim Shared As String currentModule
Dim Shared As Integer programMethods
Dim Shared As Integer dataTicker
dataTicker = 1

' Only execute the conversion from the native version if we have been passed the
' source file to convert on the command line
If Command$ <> "" Then
    QBToJS Command$, FILE, ""
    PrintJS
    System
End If

'$Include: 'qb2js.bi'

Sub QBToJS (source As String, sourceType As Integer, moduleName As String)
    currentModule = moduleName

    ResetDataStructures
    If moduleName = "" Then ReDim As CodeLine jsLines(0)

    If sourceType = FILE Then
        ReadLinesFromFile source
    Else
        ReadLinesFromText source
    End If

    FindMethods
    programMethods = UBound(methods)
    InitGX
    InitQBMethods

    ' Detect whether we are converting ourself to javascript. If so:
    '   1) Place the converted code into an object named QB6Compiler
    '   2) Forgo initializing the game events and default screen
    '   3) Add an externally callable javascript function named "compile"
    '      which will allow us to call the converter from a web application
    Dim selfConvert As Integer
    Dim isGX As Integer: isGX = False
    If sourceType = FILE Then selfConvert = EndsWith(source, "qb2js.bas")

    If selfConvert Then
        AddJSLine 0, "async function _QBCompiler() {"

    ElseIf moduleName <> "" Then
        AddJSLine 0, "async function _" + moduleName + "() {"

    ElseIf sourceType = FILE Then
        AddJSLine 0, "async function init() {"
    End If

    If Not selfConvert And moduleName = "" Then AddJSLine 0, "QB.start();"

    If Not selfConvert And moduleName = "" Then
        Dim mtest As Method
        If FindMethod("GXOnGameEvent", mtest, "SUB") Then
            AddJSLine 0, "    await GX.registerGameEvents(sub_GXOnGameEvent);"
            isGX = True
        Else
            AddJSLine 0, "    await GX.registerGameEvents(function(e){});"
            AddJSLine 0, "    QB.sub_Screen(0);"
        End If
    End If
    AddJSLine 0, ""

    InitData

    ConvertLines 1, MainEnd, ""
    If Not selfConvert And Not isGX And moduleName = "" Then AddJSLine 0, "QB.end();"
    'If Not selfConvert And moduleName = "" Then End
    ConvertMethods


    If selfConvert Then
        AddJSLine 0, "this.compile = async function(src) {"
        AddJSLine 0, "   await sub_QBToJS(src, TEXT, '');"
        AddJSLine 0, "   var js = '';"
        AddJSLine 0, "   for (var i=1; i<= QB.func_UBound(jsLines); i++) {"
        AddJSLine 0, "      js += QB.arrayValue(jsLines, [i]).value.text + '\n';"
        AddJSLine 0, "   }"
        AddJSLine 0, "   return js;"
        AddJSLine 0, "};"
        AddJSLine 0, "this.getWarnings = function() {"
        AddJSLine 0, "   var w = [];"
        AddJSLine 0, "   for (var i=1; i <= QB.func_UBound(warnings); i++) {"
        AddJSLine 0, "      w.push({"
        AddJSLine 0, "         line: QB.arrayValue(warnings, [i]).value.line,"
        AddJSLine 0, "         text: QB.arrayValue(warnings, [i]).value.text"
        AddJSLine 0, "      });"
        AddJSLine 0, "   }"
        AddJSLine 0, "   return w;"
        AddJSLine 0, "};"
        AddJSLine 0, "return this;"
        AddJSLine 0, "}"

    ElseIf moduleName <> "" Then
        AddJSLine 0, "return this;"
        AddJSLine 0, "}"
        AddJSLine 0, "const " + moduleName + " = await _" + moduleName + "();"

    ElseIf sourceType = FILE Then
        AddJSLine 0, "};"
    End If
End Sub

Sub ResetDataStructures
    ReDim As CodeLine lines(0)
    ReDim As Method methods(0)
    ReDim As QBType types(0)
    ReDim As Variable typeVars(0)
    ReDim As Variable globalVars(0)
    ReDim As Variable localVars(0)
    ReDim As CodeLine warnings(0)
    ReDim As String dataArray(0)
    ReDim As Label dataLabels(0)
    If modLevel = 0 Then
        ReDim As Method exportMethods(0)
        ReDim As Variable exportConsts(0)
    End If
    currentMethod = ""
    programMethods = 0
End Sub

Sub InitData
    If UBound(dataArray) < 1 Then Exit Sub

    Dim ds As String
    ds = "[" + Join(dataArray(), 1, -1, ",") + "]"
    AddJSLine 0, "QB.setData(" + ds + ");"

    Dim i As Integer
    For i = 1 To UBound(dataLabels)
        AddJSLine 0, "QB.setDataLabel('" + dataLabels(i).text + "', " + Str$(dataLabels(i).index) + ");"
    Next i
End Sub

Sub PrintJS
    Dim i As Integer
    For i = 1 To UBound(jsLines)
        Print jsLines(i).text
    Next i
End Sub

Sub ConvertLines (firstLine As Integer, lastLine As Integer, functionName As String)
    Dim typeMode As Integer: typeMode = False
    Dim jsMode As Integer: jsMode = False
    Dim i As Integer
    Dim indent As Integer
    Dim tempIndent As Integer
    Dim m As Method
    Dim totalIndent As Integer
    totalIndent = 1
    Dim caseCount As Integer
    Dim loopMode(100) As Integer ' TODO: only supports 100 levels of do/loop nesting
    Dim loopLevel As Integer
    Dim caseVar As String
    Dim currType As Integer

    For i = firstLine To lastLine
        indent = 0
        tempIndent = 0
        Dim l As String
        l = _Trim$(lines(i).text)
        ReDim As String parts(0)
        Dim c As Integer
        c = SLSplit(l, parts(), True)

        Dim js As String
        js = ""
        Dim first As String
        first = UCase$(parts(1))

        If jsMode = True Then
            If first = "$END" Then
                jsMode = False
                AddJSLine 0, "//-------- END JS native code block --------"
            Else
                AddJSLine i, lines(i).text
            End If

        ElseIf typeMode = True Then
            If first = "END" Then
                Dim second As String: second = UCase$(parts(2))
                If second = "TYPE" Then
                    typeMode = False
                End If
            Else
                Dim tvar As Variable
                tvar.typeId = currType
                tvar.name = parts(1)
                tvar.type = UCase$(parts(3))
                If tvar.type = "_UNSIGNED" Then tvar.type = tvar.type + " " + UCase$(parts(4))
                AddVariable tvar, typeVars()
            End If
        Else
            If first = "CONST" Then
                ' TODO: add support for comma-separated list of constants
                js = "const " + parts(2) + " = " + ConvertExpression(Join(parts(), 4, -1, " ")) + ";"
                AddConst parts(2)

            ElseIf first = "DIM" Or first = "REDIM" Or first = "STATIC" Then
                js = DeclareVar(parts())


            ElseIf first = "SELECT" Then
                caseVar = GenJSVar
                js = "var " + caseVar + " = " + ConvertExpression(Join(parts(), 3, -1, " ")) + ";" + CRLF
                js = js + "switch (" + caseVar + ") {"
                indent = 1
                caseCount = 0

            ElseIf first = "CASE" Then
                If caseCount > 0 Then js = "break;" + LF
                If UCase$(parts(2)) = "ELSE" Then
                    js = js + "default:"
                ElseIf UCase$(parts(2)) = "IS" Then
                    js = js + "case " + caseVar + " " + ConvertExpression(Join(parts(), 3, -1, " ")) + ":"
                Else
                    ReDim As String caseParts(0)
                    Dim cscount As Integer
                    cscount = ListSplit(Join(parts(), 2, -1, " "), caseParts())
                    Dim ci As Integer
                    For ci = 1 To cscount
                        If ci > 1 Then js = js + CRLF
                        js = js + "case " + ConvertExpression(caseParts(ci)) + ":"
                    Next ci
                End If
                caseCount = caseCount + 1

            ElseIf first = "FOR" Then
                Dim fstep As String: fstep = "1"
                Dim eqIdx As Integer
                Dim toIdx As Integer
                Dim stepIdx As Integer
                Dim fcond As String: fcond = " <= "
                stepIdx = 0
                Dim fi As Integer
                For fi = 2 To UBound(parts)
                    Dim fword As String
                    fword = UCase$(parts(fi))
                    If fword = "=" Then
                        eqIdx = fi
                    ElseIf fword = "TO" Then
                        toIdx = fi
                    ElseIf fword = "STEP" Then
                        stepIdx = fi
                        fstep = ConvertExpression(Join(parts(), fi + 1, -1, " "))
                    End If
                Next fi
                Dim fvar As String
                fvar = ConvertExpression(Join(parts(), 2, eqIdx - 1, " "))
                Dim sval As String
                sval = ConvertExpression(Join(parts(), eqIdx + 1, toIdx - 1, " "))
                Dim uval As String
                uval = ConvertExpression(Join(parts(), toIdx + 1, stepIdx - 1, " "))

                If Left$(_Trim$(fstep), 1) = "-" Then fcond = " >= "

                js = "for (" + fvar + "=" + sval + "; " + fvar + fcond + uval + "; " + fvar + "=" + fvar + " + " + fstep + ") {"
                js = js + "  if (QB.halted()) { return; }"

                'If UBound(parts) = 8 Then fstep = parts(8)
                'js = "for (" + parts(2) + "=" + parts(4) + "; " + parts(2) + " <= " + ConvertExpression(parts(6)) + "; " + parts(2) + "=" + parts(2) + "+" + fstep + ") {"
                indent = 1

            ElseIf first = "IF" Then
                Dim thenIndex As Integer
                For thenIndex = 2 To UBound(parts)
                    If UCase$(parts(thenIndex)) = "THEN" Then Exit For
                Next thenIndex

                js = "if (" + ConvertExpression(Join(parts(), 2, thenIndex - 1, " ")) + ") {"
                indent = 1

            ElseIf first = "ELSEIF" Then
                js = "} else if (" + ConvertExpression(Join(parts(), 2, UBound(parts) - 1, " ")) + ") {"
                tempIndent = -1

            ElseIf first = "ELSE" Then
                js = "} else {"
                tempIndent = -1

            ElseIf first = "NEXT" Then
                js = js + "}"
                indent = -1

            ElseIf first = "END" Then
                If UBound(parts) = 1 Then
                    js = "QB.halt(); return;"
                Else
                    If UCase$(parts(2)) = "SELECT" Then js = "break;"
                    js = js + "}"
                    indent = -1
                End If

            ElseIf first = "SYSTEM" Then
                js = "QB.halt(); return;"

            ElseIf first = "$IF" Then
                If UBound(parts) > 1 Then
                    If UCase$(parts(2)) = "JAVASCRIPT" Then
                        jsMode = True
                        js = "//-------- BEGIN JS native code block --------"
                    End If
                End If

            ElseIf first = "DO" Then
                loopLevel = loopLevel + 1
                If UBound(parts) > 1 Then
                    If UCase$(parts(2)) = "WHILE" Then
                        js = "while (" + ConvertExpression(Join(parts(), 3, -1, " ")) + ") {"
                    Else
                        js = "while (!(" + ConvertExpression(Join(parts(), 3, -1, " ")) + ")) {"
                    End If
                    loopMode(loopLevel) = 1
                Else
                    js = "do {"
                    loopMode(loopLevel) = 2
                End If
                indent = 1
                js = js + "  if (QB.halted()) { return; }"


            ElseIf first = "WHILE" Then
                loopLevel = loopLevel + 1
                js = "while (" + ConvertExpression(Join(parts(), 2, -1, " ")) + ") {"
                indent = 1
                js = js + "  if (QB.halted()) { return; }"

            ElseIf first = "WEND" Then
                js = "}"
                loopLevel = loopLevel - 1
                indent = -1

            ElseIf first = "LOOP" Then
                If loopMode(loopLevel) = 1 Then
                    js = "}"
                Else
                    js = "} while (("
                    If UBound(parts) < 2 Then
                        js = js + "1));"
                    Else
                        If UCase$(parts(2)) = "UNTIL" Then js = "} while (!("
                        js = js + ConvertExpression(Join(parts(), 3, UBound(parts), " ")) + "))"
                    End If
                End If
                loopLevel = loopLevel - 1
                indent = -1

            ElseIf first = "_CONTINUE" Then
                js = "continue;"

            ElseIf UCase$(l) = "EXIT FUNCTION" Then
                js = "return " + functionName + ";"

            ElseIf UCase$(l) = "EXIT SUB" Then
                js = "return;"

            ElseIf first = "EXIT" Then
                js = "break;"

            ElseIf first = "TYPE" Then
                typeMode = True
                Dim qbtype As QBType
                qbtype.line = i
                qbtype.name = UCase$(parts(2))
                AddType qbtype
                currType = UBound(types)

            ElseIf first = "EXPORT" Then
                If c > 1 Then
                    Dim exparts(0) As String
                    Dim excount As Integer
                    excount = ListSplit(Join(parts(), 2, -1, " "), exparts())

                    Dim exi As Integer
                    For exi = 1 To excount
                        ParseExport exparts(exi), i
                    Next exi
                    _Continue
                Else
                    ' TODO: add syntax warning
                End If

            ElseIf first = "CALL" Then
                Dim subline As String
                subline = _Trim$(Join(parts(), 2, -1, " "))

                Dim subend As Integer
                subend = InStr(subline, "(")

                Dim subname As String
                If subend = 0 Then
                    subname = subline
                Else
                    subname = Left$(subline, subend - 1)
                End If

                If FindMethod(subname, m, "SUB") Then
                    Dim subargs As String
                    If subname = subline Then
                        subargs = ""
                    Else
                        subargs = Mid$(subline, Len(subname) + 2, Len(subline) - Len(subname) - 2)
                    End If
                    js = ConvertSub(m, subargs)
                Else
                    AddWarning i, "Missing Sub [" + subname + "], ignoring Call command"
                End If

            ElseIf c > 2 Then
                Dim assignment As Integer
                assignment = 0
                Dim j As Integer
                For j = 1 To UBound(parts)
                    If parts(j) = "=" Then
                        assignment = j
                        Exit For
                    End If
                Next j

                If assignment > 0 Then
                    'This is a variable assignment
                    js = RemoveSuffix(ConvertExpression(Join(parts(), 1, assignment - 1, " "))) + " = " + ConvertExpression(Join(parts(), assignment + 1, -1, " ")) + ";"

                Else
                    If FindMethod(parts(1), m, "SUB") Then
                        js = ConvertSub(m, Join(parts(), 2, -1, " "))
                    Else
                        js = "// " + l
                        AddWarning i, "Missing/unsupported sub or syntax error"
                    End If
                End If


            Else
                If FindMethod(parts(1), m, "SUB") Then
                    js = ConvertSub(m, Join(parts(), 2, -1, " "))
                Else
                    js = "// " + l
                    AddWarning i, "Missing/unsupported sub or syntax error"
                End If
            End If

            If (indent < 0) Then totalIndent = totalIndent + indent
            AddJSLine i, LPad("", " ", (totalIndent + tempIndent) * 3) + js
            If (indent > 0) Then totalIndent = totalIndent + indent

        End If

    Next i

End Sub

Sub ParseExport (s As String, lineIndex As Integer)
    Dim exportedItem As String
    Dim ef As Method
    Dim es As Method
    Dim ev As Variable
    Dim exportName As String
    Dim parts(0) As String
    Dim found As Integer: found = False

    Dim c As Integer
    c = SLSplit(s, parts(), False)

    If FindMethod(parts(1), es, "SUB") Then
        If c > 2 Then
            exportName = parts(3)
        Else
            exportName = parts(1)
        End If
        exportedItem = es.jsname
        es.name = exportName
        AddExportMethod es, currentModule + ".", True
        exportName = "sub_" + exportName
        RegisterExport exportName, exportedItem
        found = True
    End If

    If FindMethod(parts(1), ef, "FUNCTION") Then
        If c > 2 Then
            exportName = parts(3)
        Else
            exportName = parts(1)
        End If
        exportedItem = ef.jsname
        ef.name = exportName
        AddExportMethod ef, currentModule + ".", True
        exportName = "func_" + exportName
        RegisterExport exportName, exportedItem
        found = True
    End If

    If FindVariable(parts(1), ev, False) Then
        If ev.isConst = True Then
            If c > 2 Then
                exportName = parts(3)
            Else
                exportName = parts(1)
            End If
            exportedItem = ev.jsname
            ev.name = exportName
            exportedItem = ev.jsname
            If exportName = "" Then exportName = parts(1)
            ev.name = exportName
            AddExportConst currentModule + "." + exportName
            RegisterExport exportName, exportedItem
            found = True
        End If
    End If

    If Not found Then
        AddWarning lineIndex, "Invalid export [" + parts(1) + "].  Exported items must be a Sub, Function or Const in the current module."
    End If

End Sub

Sub RegisterExport (exportName As String, exportedItem As String)
    Dim esize
    esize = UBound(exportLines) + 1
    ReDim _Preserve exportLines(esize) As String
    exportLines(esize) = "this." + exportName + " = " + exportedItem + ";"
End Sub

Function ConvertSub$ (m As Method, args As String)
    ' This actually converts the parameters passed to the sub
    Dim js As String

    ' Let's handle the weirdo Line Input command which has a space
    ' TODO: this may have issues if used in combination with Input
    If m.name = "Line" Then
        Dim parts(0) As String
        Dim plen As Integer
        plen = SLSplit(args, parts(), False)
        If plen > 0 Then
            If UCase$(parts(1)) = "INPUT" Then
                m.name = "Line Input"
                'm.jsname = "await QB.sub_LineInput"
                m.jsname = "QB.sub_LineInput"
                args = Join(parts(), 2, -1, " ")
            End If
        End If
    End If

    ' Handle special cases for methods which take ranges and optional parameters
    If m.name = "Line" Then
        js = CallMethod(m) + "(" + ConvertLine(args) + ");"

    ElseIf m.name = "Cls" Then
        js = CallMethod(m) + "(" + ConvertCls(args) + ");"

    ElseIf m.name = "Input" Or m.name = "Line Input" Then
        js = ConvertInput(m, args)

    ElseIf m.name = "PSet" Or m.name = "Circle" Or m.name = "PReset" Or m.name = "Paint" Then
        js = CallMethod(m) + "(" + ConvertPSet(args) + ");"

    ElseIf m.name = "Print" Then
        js = CallMethod(m) + "(" + ConvertPrint(args) + ");"

    ElseIf m.name = "Randomize" Then
        js = ConvertRandomize(m, args)

    ElseIf m.name = "Read" Then
        js = ConvertRead(m, args)

    ElseIf m.name = "Restore" Then
        js = CallMethod(m) + "('" + UCase$(args) + "');"

    ElseIf m.name = "Swap" Then
        js = ConvertSwap(m, args)

    ElseIf m.name = "Window" Then
        js = CallMethod(m) + "(" + ConvertWindow(args) + ");"

    ElseIf m.name = "_PrintString" Then
        js = CallMethod(m) + "(" + ConvertPrintString(args) + ");"

    ElseIf m.name = "_PutImage" Then
        js = CallMethod(m) + "(" + ConvertPutImage(args) + ");"

    ElseIf m.name = "_FullScreen" Then
        js = CallMethod(m) + "(" + ConvertFullScreen(args) + ");"
    Else
        'js = CallMethod(m) + "(" + ConvertExpression(args) + ");"
        js = CallMethod(m) + "(" + ConvertMethodParams(args) + ");"
    End If

    ConvertSub = js
End Function

Function ConvertFullScreen$ (args As String)
    ReDim parts(0) As String
    Dim argc As Integer
    Dim mode As String: mode = "QB.STRETCH"
    Dim doSmooth As String: doSmooth = "false"

    argc = ListSplit(args, parts())
    If argc > 0 Then
        Dim arg As String
        arg = UCase$(parts(1))
        If arg = "_OFF" Then
            mode = "QB.OFF"
        ElseIf arg = "_STRETCH" Then
            mode = "QB.STRETCH"
        ElseIf arg = "_SQUAREPIXELS" Then
            mode = "QB.SQUAREPIXELS"
        End If
    End If
    If argc > 1 Then
        If UCase$(parts(2)) = "_SMOOTH" Then doSmooth = "true"
    End If

    ConvertFullScreen = mode + ", " + doSmooth
End Function

Function ConvertLine$ (args As String)
    ' TODO: This does not yet handle dash patterns
    Dim firstParam As String
    Dim theRest As String
    Dim idx As Integer
    Dim sstep As String
    Dim estep As String
    sstep = "false"
    estep = "false"

    idx = FindParamChar(args, ",")
    If idx = -1 Then
        firstParam = args
        theRest = ""
    Else
        firstParam = Left$(args, idx - 1)
        theRest = Right$(args, Len(args) - idx)
    End If

    idx = FindParamChar(firstParam, "-")
    Dim startCord As String
    Dim endCord As String
    If idx = -1 Then
        endCord = firstParam
    Else
        startCord = Left$(firstParam, idx - 1)
        endCord = Right$(firstParam, Len(firstParam) - idx)
    End If

    If UCase$(_Trim$(Left$(startCord, 4))) = "STEP" Then
        sstep = "true"
    End If
    If UCase$(_Trim$(Left$(endCord, 4))) = "STEP" Then
        estep = "true"
    End If

    idx = InStr(startCord, "(")
    startCord = Right$(startCord, Len(startCord) - idx)
    idx = _InStrRev(startCord, ")")
    startCord = Left$(startCord, idx - 1)
    startCord = ConvertExpression(startCord)
    If (_Trim$(startCord) = "") Then startCord = "undefined, undefined"

    idx = InStr(endCord, "(")
    endCord = Right$(endCord, Len(endCord) - idx)
    idx = _InStrRev(endCord, ")")
    endCord = Left$(endCord, idx - 1)
    endCord = ConvertExpression(endCord)

    theRest = ConvertExpression(theRest)
    ' TODO: fix this nonsense
    theRest = Replace(theRest, " BF", " " + Chr$(34) + "BF" + Chr$(34))
    theRest = Replace(theRest, " bf", " " + Chr$(34) + "BF" + Chr$(34))
    theRest = Replace(theRest, " bF", " " + Chr$(34) + "BF" + Chr$(34))
    theRest = Replace(theRest, " Bf", " " + Chr$(34) + "BF" + Chr$(34))
    theRest = Replace(theRest, " B", " " + Chr$(34) + "B" + Chr$(34))
    theRest = Replace(theRest, " b", " " + Chr$(34) + "B" + Chr$(34))
    theRest = Replace(theRest, " T", " " + Chr$(34) + "T" + Chr$(34))
    theRest = Replace(theRest, " t", " " + Chr$(34) + "T" + Chr$(34))

    ConvertLine = sstep + ", " + startCord + ", " + estep + ", " + endCord + ", " + theRest
End Function

Function ConvertPutImage$ (args As String)
    Dim argc As Integer
    ReDim parts(0) As String
    Dim As String startCoord, sourceImage, destImage, destCoord, doSmooth
    startCoord = ConvertCoordParam("", True)
    destCoord = ConvertCoordParam("", True)
    sourceImage = "undefined"
    destImage = "undefined"

    doSmooth = "false"
    If EndsWith(_Trim$(UCase$(args)), "_SMOOTH") Then
        doSmooth = "true"
        args = Left$(_Trim$(args), Len(_Trim$(args)) - 7)
    End If

    argc = ListSplit(args, parts())
    If argc >= 1 Then startCoord = ConvertCoordParam(parts(1), True)
    If argc >= 2 Then sourceImage = ConvertExpression(parts(2))
    If argc >= 3 Then
        If _Trim$(parts(3)) <> "" Then destImage = ConvertExpression(parts(3))
    End If
    If argc >= 4 Then destCoord = ConvertCoordParam(parts(4), True)
    If argc >= 5 Then
        If _Trim$(UCase$(parts(5))) = "_SMOOTH" Then doSmooth = "true"
    End If

    ConvertPutImage = startCoord + ", " + sourceImage + ", " + destImage + ", " + destCoord + ", " + doSmooth
End Function

Function ConvertWindow$ (args As String)
    Dim As String invertFlag
    Dim firstParam As String
    Dim theRest As String
    Dim idx As Integer
    Dim sstep As String
    Dim estep As String
    invertFlag = "false"

    Dim kwd As String
    kwd = "SCREEN"
    If (UCase$(Left$(args, Len(kwd))) = kwd) Then
        args = Right$(args, Len(args) - Len(kwd))
        invertFlag = "true"
    End If
    args = _Trim$(args)

    sstep = "false"
    estep = "false"

    idx = FindParamChar(args, ",")
    If idx = -1 Then
        firstParam = args
        theRest = ""
    Else
        firstParam = Left$(args, idx - 1)
        theRest = Right$(args, Len(args) - idx)
    End If

    idx = FindParamChar(firstParam, "-")
    Dim startCord As String
    Dim endCord As String
    If idx = -1 Then
        endCord = firstParam
    Else
        startCord = Left$(firstParam, idx - 1)
        endCord = Right$(firstParam, Len(firstParam) - idx)
    End If

    idx = InStr(startCord, "(")
    startCord = Right$(startCord, Len(startCord) - idx)
    idx = _InStrRev(startCord, ")")
    startCord = Left$(startCord, idx - 1)
    startCord = ConvertExpression(startCord)
    If (_Trim$(startCord) = "") Then startCord = "undefined, undefined"

    idx = InStr(endCord, "(")
    endCord = Right$(endCord, Len(endCord) - idx)
    idx = _InStrRev(endCord, ")")
    endCord = Left$(endCord, idx - 1)
    endCord = ConvertExpression(endCord)

    ConvertWindow = invertFlag + ", " + startCord + ", " + endCord
End Function

Function ConvertCls$ (args As String)
    Dim argc As Integer
    ReDim parts(0) As String
    argc = ListSplit(args, parts())

    Dim As String method, bgcolor
    method = "undefined"
    bgcolor = "undefined"

    If argc >= 1 Then
        If _Trim$(parts(1)) <> "" Then method = ConvertExpression(parts(1))
    End If
    If argc >= 2 Then bgcolor = ConvertExpression(parts(2))

    ConvertCls$ = method + ", " + bgcolor
End Function

Function ConvertRandomize$ (m As Method, args As String)
    Dim uusing As String
    Dim theseed As String
    uusing = "false"
    theseed = args
    If _Trim$(args) = "" Then
        theseed = "undefined"
    Else
        If (UCase$(_Trim$(Left$(args, 5))) = "USING") Then
            uusing = "true"
            theseed = _Trim$(Right$(args, Len(args) - 5))
            theseed = ConvertExpression(theseed)
        End If
    End If
    ConvertRandomize = CallMethod(m) + "(" + uusing + ", " + theseed + ")"
End Function

Function ConvertRead$ (m As Method, args As String)
    Dim js As String
    Dim vname As String
    Dim pcount As Integer
    ReDim parts(0) As String
    ReDim vars(0) As String
    Dim vcount As Integer
    Dim p As String
    pcount = ListSplit(args, parts())
    Dim i As Integer
    For i = 1 To pcount
        p = _Trim$(parts(i))
        vcount = UBound(vars) + 1
        ReDim _Preserve As String vars(vcount)
        vars(vcount) = p
    Next i
    vname = GenJSVar
    js = "var " + vname + " = new Array(" + Str$(UBound(vars)) + ");" + LF
    js = js + CallMethod(m) + "(" + vname + ");" + LF
    For i = 1 To UBound(vars)
        js = js + ConvertExpression(vars(i)) + " = " + vname + "[" + Str$(i - 1) + "];" + LF
    Next i
    ConvertRead$ = js
End Function

Function ConvertCoordParam$ (param As String, hasEndCoord As Integer)
    If _Trim$(param) = "" Then
        If hasEndCoord Then
            ConvertCoordParam = "false, undefined, undefined, false, undefined, undefined"
        Else
            ConvertCoordParam = "false, undefined, undefined"
        End If
    Else
        Dim As String js, startCoord, endCoord, sstep, estep
        Dim As Integer idx
        sstep = "false"
        estep = "false"

        idx = FindParamChar(param, "-")
        If idx = -1 Then
            startCoord = param
            endCoord = ""
        Else
            startCoord = Left$(param, idx - 1)
            endCoord = Right$(param, Len(param) - idx)
        End If

        If UCase$(_Trim$(Left$(startCoord, 4))) = "STEP" Then
            sstep = "true"
        End If
        If UCase$(_Trim$(Left$(endCoord, 4))) = "STEP" Then
            estep = "true"
        End If

        idx = InStr(startCoord, "(")
        startCoord = Right$(startCoord, Len(startCoord) - idx)
        idx = _InStrRev(startCoord, ")")
        startCoord = Left$(startCoord, idx - 1)
        startCoord = ConvertExpression(startCoord)
        If (_Trim$(startCoord) = "") Then startCoord = "undefined, undefined"

        If hasEndCoord Then
            idx = InStr(endCoord, "(")
            endCoord = Right$(endCoord, Len(endCoord) - idx)
            idx = _InStrRev(endCoord, ")")
            endCoord = Left$(endCoord, idx - 1)
            endCoord = ConvertExpression(endCoord)
            If (_Trim$(endCoord) = "") Then endCoord = "undefined, undefined"

            ConvertCoordParam$ = sstep + ", " + startCoord + ", " + estep + ", " + endCoord
        Else
            ConvertCoordParam$ = sstep + ", " + startCoord
        End If

    End If
End Function

Function ConvertPSet$ (args As String)
    Dim firstParam As String
    Dim theRest As String
    Dim idx As Integer
    Dim sstep As String
    sstep = "false"

    idx = FindParamChar(args, ",")
    If idx = -1 Then
        firstParam = args
        theRest = ""
    Else
        firstParam = Left$(args, idx - 1)
        theRest = Right$(args, Len(args) - idx)
    End If

    If UCase$(_Trim$(Left$(firstParam, 4))) = "STEP" Then
        sstep = "true"
    End If

    idx = InStr(firstParam, "(")
    firstParam = Right$(firstParam, Len(firstParam) - idx)
    idx = _InStrRev(firstParam, ")")
    firstParam = Left$(firstParam, idx - 1)
    firstParam = ConvertExpression(firstParam)
    If (_Trim$(firstParam) = "") Then firstParam = "undefined, undefined"

    theRest = ConvertExpression(theRest)

    ConvertPSet = sstep + ", " + firstParam + ", " + theRest
End Function

Function ConvertPrint$ (args As String)
    Dim pcount As Integer
    Dim parts(0) As String
    pcount = PrintSplit(args, parts())

    Dim js As String
    js = "["

    Dim i As Integer
    For i = 1 To pcount
        If i > 1 Then js = js + ","

        If parts(i) = "," Then
            js = js + "QB.COLUMN_ADVANCE"

        ElseIf parts(i) = ";" Then
            js = js + "QB.PREVENT_NEWLINE"

        Else
            js = js + ConvertExpression(parts(i))
        End If
    Next i

    ConvertPrint = js + "]"
End Function

Function ConvertPrintString$ (args As String)
    Dim firstParam As String
    Dim theRest As String
    Dim idx As Integer

    idx = FindParamChar(args, ",")
    If idx = -1 Then
        firstParam = args
        theRest = ""
    Else
        firstParam = Left$(args, idx - 1)
        theRest = Right$(args, Len(args) - idx)
    End If

    idx = InStr(firstParam, "(")
    firstParam = Right$(firstParam, Len(firstParam) - idx)
    idx = _InStrRev(firstParam, ")")
    firstParam = Left$(firstParam, idx - 1)

    ConvertPrintString = ConvertExpression(firstParam) + ", " + ConvertExpression(theRest)
End Function

Function ConvertInput$ (m As Method, args As String)
    Dim js As String
    Dim vname As String
    Dim pcount As Integer
    ReDim parts(0) As String
    ReDim vars(0) As String
    Dim varIndex As Integer: varIndex = 1
    Dim preventNewline As String: preventNewline = "false"
    Dim addQuestionPrompt As String: addQuestionPrompt = "false"
    Dim prompt As String: prompt = "undefined"
    Dim vcount As Integer

    Dim p As String
    pcount = PrintSplit(args, parts())
    Dim i As Integer
    For i = 1 To pcount
        p = _Trim$(parts(i))
        If p = ";" Then
            If i = 1 Then
                preventNewline = "true"
            Else
                addQuestionPrompt = "true"
            End If
        ElseIf StartsWith(p, Chr$(34)) Then
            prompt = p
        ElseIf p <> "," Then
            vcount = UBound(vars) + 1
            ReDim _Preserve As String vars(vcount)
            vars(vcount) = p
        End If
    Next i

    vname = GenJSVar '"___i" + _Trim$(Str$(_Round(Rnd * 10000000)))
    js = "var " + vname + " = new Array(" + Str$(UBound(vars)) + ");" + LF
    js = js + CallMethod(m) + "(" + vname + ", " + preventNewline + ", " + addQuestionPrompt + ", " + prompt + ");" + LF
    For i = 1 To UBound(vars)
        If Not StartsWith(_Trim$(vars(i)), "#") Then ' special case to prevent file references from being output during self-compilation
            js = js + ConvertExpression(vars(i)) + " = " + vname + "[" + Str$(i - 1) + "];" + LF
        End If
    Next i
    ConvertInput = js
End Function

Function ConvertSwap$ (m As Method, args As String)
    Dim js As String
    Dim swapArray As String: swapArray = GenJSVar
    Dim swapArgs(0) As String
    Dim swapCount As Integer
    swapCount = ListSplit(args, swapArgs())
    Dim var1 As String
    Dim var2 As String
    var1 = ConvertExpression(swapArgs(1))
    var2 = ConvertExpression(swapArgs(2))
    js = "var " + swapArray + " = [" + var1 + "," + var2 + "];" + LF
    js = js + CallMethod(m) + "(" + swapArray + ");" + LF
    js = js + var1 + " = " + swapArray + "[0];" + LF
    js = js + var2 + " = " + swapArray + "[1];"
    ConvertSwap = js
End Function

Function GenJSVar$
    GenJSVar = "___v" + _Trim$(Str$(_Round(Rnd * 10000000)))
End Function

Function FindParamChar (s As String, char As String)
    Dim idx As Integer
    idx = -1

    Dim c As String
    Dim quote As Integer
    Dim paren As Integer
    Dim i As Integer
    For i = 1 To Len(s)
        c = Mid$(s, i, 1)
        If c = Chr$(34) Then
            quote = Not quote
        ElseIf Not quote And c = "(" Then
            paren = paren + 1
        ElseIf Not quote And c = ")" Then
            paren = paren - 1
        ElseIf Not quote And paren = 0 And c = char Then
            idx = i
            Exit For
        End If
    Next i

    FindParamChar = idx
End Function

Function DeclareVar$ (parts() As String)

    Dim vname As String
    Dim vtype As String: vtype = ""
    Dim vtypeIndex As Integer: vtypeIndex = 4
    Dim isGlobal As Integer: isGlobal = False
    Dim isArray As Integer: isArray = False
    Dim arraySize As String
    Dim pstart As Integer
    Dim bvar As Variable
    Dim varnames(0) As String
    Dim vnamecount As Integer
    Dim findVar As Variable
    Dim asIdx As Integer
    asIdx = 0
    Dim js As String: js = ""
    Dim preserve As String: preserve = "false"

    Dim i As Integer
    For i = 1 To UBound(parts)
        If UCase$(parts(i)) = "AS" Then asIdx = i
        If UCase$(parts(i)) = "_PRESERVE" Then preserve = "true"
        If UCase$(parts(i)) = "SHARED" Then isGlobal = True
    Next i


    If asIdx = 2 Or _
       (asIdx = 3 And (isGlobal Or preserve = "true")) Or _
       (asIdx = 4 And isGlobal And preserve = "true") Then

        ' Handle Dim As syntax
        bvar.type = UCase$(parts(asIdx + 1))
        Dim nextIdx As Integer
        nextIdx = asIdx + 2
        If bvar.type = "_UNSIGNED" Then
            bvar.type = bvar.type + " " + UCase$(parts(asIdx + 2))
            nextIdx = asIdx + 3
        End If
        bvar.typeId = FindTypeId(bvar.type)

        vnamecount = ListSplit(Join(parts(), nextIdx, -1, " "), varnames())
        For i = 1 To vnamecount
            vname = _Trim$(varnames(i))
            pstart = InStr(vname, "(")
            If pstart > 0 Then
                bvar.isArray = True
                arraySize = ConvertExpression(Mid$(vname, pstart + 1, Len(vname) - pstart - 1))
                bvar.name = RemoveSuffix(Left$(vname, pstart - 1))
            Else
                bvar.isArray = False
                arraySize = ""
                bvar.name = vname
            End If
            bvar.jsname = ""

            ' TODO: this code is in two places - refactor into a separate function
            If Not bvar.isArray Then
                js = js + "var " + bvar.name + " = " + InitTypeValue(bvar.type) + ";"

            Else
                If FindVariable(bvar.name, findVar, True) Then
                    js = js + "QB.resizeArray(" + bvar.name + ", [" + FormatArraySize(arraySize) + "], " + InitTypeValue(bvar.type) + ", " + preserve + ");"
                Else
                    js = js + "var " + bvar.name + " = QB.initArray([" + FormatArraySize(arraySize) + "], " + InitTypeValue(bvar.type) + ");"
                End If
            End If

            If isGlobal Then
                AddVariable bvar, globalVars()
            Else
                AddVariable bvar, localVars()
            End If

            js = js + " // " + bvar.type

            If i < vnamecount Then js = js + LF
        Next i


    Else
        'Handle traditional syntax
        Dim vpartcount As Integer
        Dim vparts(0) As String
        nextIdx = 0
        For i = 1 To UBound(parts)
            Dim p As String
            p = UCase$(parts(i))
            If p = "DIM" Or p = "REDIM" Or p = "SHARED" Or p = "_PRESERVE" Then
                nextIdx = i + 1
            End If
        Next i

        vnamecount = ListSplit(Join(parts(), nextIdx, -1, " "), varnames())
        For i = 1 To vnamecount

            vpartcount = SLSplit2(varnames(i), vparts())
            bvar.name = RemoveSuffix(vparts(1))
            If vpartcount = 1 Then
                bvar.type = DataTypeFromName(bvar.name)
            ElseIf vpartcount = 3 Then
                bvar.type = UCase$(vparts(3))
            ElseIf vpartcount = 4 Then
                bvar.type = UCase$(Join(vparts(), 3, -1, " "))
            Else
                ' Log error?
            End If
            bvar.typeId = FindTypeId(bvar.type)


            pstart = InStr(bvar.name, "(")
            If pstart > 0 Then
                bvar.isArray = True
                arraySize = ConvertExpression(Mid$(bvar.name, pstart + 1, Len(bvar.name) - pstart - 1))
                bvar.name = RemoveSuffix(Left$(bvar.name, pstart - 1))
            Else
                bvar.isArray = False
                arraySize = ""
                'bvar.name = vname
            End If
            bvar.jsname = ""


            ' TODO: this code is in two places - refactor into a separate function
            If Not bvar.isArray Then
                js = js + "var " + bvar.name + " = " + InitTypeValue(bvar.type) + ";"

            Else
                If FindVariable(bvar.name, findVar, True) Then
                    js = js + "QB.resizeArray(" + bvar.name + ", [" + FormatArraySize(arraySize) + "], " + InitTypeValue(bvar.type) + ", " + preserve + ");"
                Else
                    js = js + "var " + bvar.name + " = QB.initArray([" + FormatArraySize(arraySize) + "], " + InitTypeValue(bvar.type) + ");"
                End If
            End If

            If isGlobal Then
                AddVariable bvar, globalVars()
            Else
                AddVariable bvar, localVars()
            End If

            js = js + " // " + bvar.type

            If i < vnamecount Then js = js + LF
        Next i
    End If

    DeclareVar = js
End Function

Function FormatArraySize$ (sizeString As String)
    Dim sizeParams As String: sizeParams = ""
    ReDim parts(0) As String
    Dim pcount As Integer
    pcount = ListSplit(sizeString, parts())
    Dim i As Integer
    For i = 1 To pcount
        ReDim subparts(0) As String
        Dim scount As Integer
        scount = SLSplit2(parts(i), subparts())

        If i > 1 Then sizeParams = sizeParams + ","

        If scount = 1 Then
            sizeParams = sizeParams + "{l:1,u:" + subparts(1) + "}"
        Else
            sizeParams = sizeParams + "{l:" + subparts(1) + ",u:" + subparts(3) + "}"
        End If
    Next i
    FormatArraySize = sizeParams
End Function

Function InitTypeValue$ (vtype As String)
    Dim value As String
    If vtype = "STRING" Then
        value = "''"
    ElseIf vtype = "OBJECT" Then
        value = "{}"
    ElseIf vtype = "_BIT" Or vtype = "_UNSIGNED _BIT" Or vtype = "_BYTE" Or vtype = "_UNSIGNED _BYTE" Or _
           vtype = "INTEGER" Or vtype = "_UNSIGNED INTEGER" Or vtype = "LONG" Or vtype = "_UNSIGNED LONG" Or _
           vtype = "_INTEGER64" Or vtype = "_UNSIGNED INTEGER64" Or _
           vtype = "SINGLE" Or vtype = "DOUBLE" Or vtype = "_FLOAT" Or _
           vtype = "_OFFSET" Or vtype = "_UNSIGNED _OFFSET" Then
        value = "0"
    Else ' Custom Type
        value = "{"
        Dim typeId As Integer
        typeId = FindTypeId(vtype)
        Dim i As Integer
        For i = 1 To UBound(typeVars)
            If typeId = typeVars(i).typeId Then
                value = value + typeVars(i).name + ":" + InitTypeValue(typeVars(i).type) + ","
            End If
        Next i
        value = Left$(value, Len(value) - 1) + "}"
    End If

    InitTypeValue = value
End Function

Function FindTypeId (typeName As String)
    Dim id As Integer
    id = -1
    Dim i As Integer
    For i = 1 To UBound(types)
        If types(i).name = typeName Then
            id = i
            Exit For
        End If
    Next i
    FindTypeId = id
End Function

Function ConvertExpression$ (ex As String)
    Dim c As String
    Dim js As String: js = ""
    Dim word As String: word = ""
    Dim bvar As Variable
    Dim m As Method

    Dim stringLiteral As Integer
    Dim i As Integer: i = 1
    While i <= Len(ex)
        c = Mid$(ex, i, 1)

        If c = Chr$(34) Then
            js = js + c
            stringLiteral = Not stringLiteral

        ElseIf stringLiteral Then
            js = js + c

        Else
            If c = " " Or c = "," Or i = Len(ex) Then
                If i = Len(ex) Then word = word + c
                Dim uword As String: uword = UCase$(word)
                If uword = "NOT" Then
                    js = js + "!"
                ElseIf uword = "AND" Then
                    js = js + " && "
                ElseIf uword = "OR" Then
                    js = js + " || "
                ElseIf uword = "MOD" Then
                    js = js + " % "
                ElseIf word = "=" Then
                    js = js + " == "
                ElseIf word = "<>" Then
                    js = js + " != "
                ElseIf word = "^" Then
                    js = js + " ** "
                ElseIf word = ">" Or word = ">=" Or word = "<" Or word = "<=" Then
                    js = js + " " + word + " "

                ElseIf StartsWith(word, "&H") Or StartsWith(word, "&O") Or StartsWith(word, "&B") Then
                    js = js + " QB.func_Val('" + word + "') "

                Else
                    If FindVariable(word, bvar, False) Then
                        js = js + " " + bvar.jsname
                    Else
                        ' TODO: Need a more sophisticated way to determine whether
                        '       the return value is being assigned in the method.
                        '       Currently, this does not support recursive calls.
                        If FindMethod(word, m, "FUNCTION") Then
                            If m.name <> currentMethod Then
                                js = js + CallMethod$(m) + "()"
                            Else
                                js = js + " " + word
                            End If
                        Else
                            js = js + " " + word
                        End If

                    End If
                End If
                If c = "," And i <> Len(ex) Then js = js + ","
                word = ""

            ElseIf c = "(" Then
                ' Find the end of the group
                Dim done As Integer: done = False
                Dim pcount As Integer: pcount = 0
                Dim c2 As String
                Dim ex2 As String: ex2 = ""
                Dim stringLiteral2 As Integer
                stringLiteral2 = False
                i = i + 1
                While Not done And i <= Len(ex)
                    c2 = Mid$(ex, i, 1)
                    If c2 = Chr$(34) Then
                        stringLiteral2 = Not stringLiteral2
                    ElseIf Not stringLiteral2 And c2 = "(" Then
                        pcount = pcount + 1
                    ElseIf Not stringLiteral2 And c2 = ")" Then
                        If pcount = 0 Then
                            done = True
                        Else
                            pcount = pcount - 1
                        End If
                    End If

                    If Not done Then
                        ex2 = ex2 + c2
                        i = i + 1
                    End If
                Wend

                ' Determine whether the current word is a function or array variable
                Dim fneg As String
                fneg = ""
                If Len(word) > 0 Then
                    If Left$(word, 1) = "-" Then
                        fneg = "-"
                        word = Mid$(word, 2)
                    End If
                End If
                If FindVariable(word, bvar, True) Then
                    If _Trim$(ex2) = "" Then
                        ' This is the case where the array variable is being passed as a parameter
                        js = js + fneg + bvar.jsname
                    Else
                        ' This is the case where a dimension is specified in order to retrieve or set a value in the array
                        js = js + fneg + "QB.arrayValue(" + bvar.jsname + ", [" + ConvertExpression(ex2) + "]).value"
                    End If
                ElseIf FindMethod(word, m, "FUNCTION") Then
                    'js = js + fneg + "(" + CallMethod(m) + "(" + ConvertExpression(ex2) + "))"
                    js = js + fneg + "(" + CallMethod(m) + "(" + ConvertMethodParams(ex2) + "))"
                Else
                    If _Trim$(word) <> "" Then AddWarning i, "Missing function or array [" + word + "]"
                    ' nested condition
                    js = js + fneg + "(" + ConvertExpression(ex2) + ")"
                End If
                word = ""

            Else
                word = word + c
            End If
        End If
        i = i + 1
    Wend
    ConvertExpression = js
End Function

' Handle optional parameters
Function ConvertMethodParams$ (args As String)
    Dim js As String
    ReDim params(0) As String
    Dim argc As Integer
    argc = ListSplit(args, params())
    Dim i As Integer
    For i = 1 To argc
        If i > 1 Then js = js + ","
        If _Trim$(params(i)) = "" Then
            js = js + " undefined"
        Else
            js = js + " " + ConvertExpression(params(i))
        End If
    Next i
    ConvertMethodParams = js
End Function

Function CallMethod$ (m As Method)
    Dim js As String
    If m.sync Then js = "await "
    js = js + m.jsname
    CallMethod = js
End Function

Function FindVariable (varname As String, bvar As Variable, isArray As Integer)
    Dim found As Integer: found = False
    Dim i As Integer
    Dim fvarname As String
    fvarname = _Trim$(UCase$(RemoveSuffix(varname)))
    For i = 1 To UBound(localVars)
        If localVars(i).isArray = isArray And UCase$(localVars(i).name) = fvarname Then
            found = True
            bvar.type = localVars(i).type
            bvar.name = localVars(i).name
            bvar.jsname = localVars(i).jsname
            bvar.isConst = localVars(i).isConst
            bvar.isArray = localVars(i).isArray
            bvar.arraySize = localVars(i).arraySize
            bvar.typeId = localVars(i).typeId
            Exit For
        End If
    Next i
    If Not found Then
        For i = 1 To UBound(globalVars)
            If globalVars(i).isArray = isArray And UCase$(globalVars(i).name) = fvarname Then
                found = True
                bvar.type = globalVars(i).type
                bvar.name = globalVars(i).name
                bvar.jsname = globalVars(i).jsname
                bvar.isConst = globalVars(i).isConst
                bvar.isArray = globalVars(i).isArray
                bvar.arraySize = globalVars(i).arraySize
                bvar.typeId = globalVars(i).typeId
                Exit For
            End If
        Next i
    End If

    FindVariable = found
End Function

Function FindMethod (mname As String, m As Method, t As String)
    Dim found As Integer: found = False
    Dim i As Integer
    For i = 1 To UBound(methods)
        If methods(i).uname = _Trim$(UCase$(RemoveSuffix(mname))) And methods(i).type = t Then
            found = True
            m.line = methods(i).line
            m.type = methods(i).type
            m.returnType = methods(i).returnType
            m.name = methods(i).name
            m.jsname = methods(i).jsname
            m.uname = methods(i).uname
            m.argc = methods(i).argc
            m.args = methods(i).args
            m.sync = methods(i).sync
            Exit For
        End If
    Next i
    If Not found Then
        For i = 1 To UBound(exportMethods)
            If exportMethods(i).uname = _Trim$(UCase$(RemoveSuffix(mname))) And exportMethods(i).type = t Then
                found = True
                m.line = exportMethods(i).line
                m.type = exportMethods(i).type
                m.returnType = exportMethods(i).returnType
                m.name = exportMethods(i).name
                m.jsname = exportMethods(i).jsname
                m.uname = exportMethods(i).uname
                m.argc = exportMethods(i).argc
                m.args = exportMethods(i).args
                m.sync = exportMethods(i).sync
                Exit For
            End If
        Next i

    End If
    FindMethod = found
End Function

Sub ConvertMethods ()
    AddJSLine 0, ""
    Dim i As Integer
    For i = 1 To UBound(methods)
        If (methods(i).line <> 0) Then
            Dim lastLine As Integer
            lastLine = methods(i + 1).line - 1
            If lastLine < 0 Then lastLine = UBound(lines)

            ' clear the local variables
            ReDim As Variable localVars(0)

            ' TODO: figure out how to make needed functions have the async modifier
            '       at the moment just applying it to all subs
            Dim asyncModifier As String
            'If methods(i).type = "SUB" Then
            asyncModifier = "async "
            'Else
            'asyncModifier = ""
            'End If
            Dim methodDec As String
            methodDec = asyncModifier + "function " + methods(i).jsname + "("
            If methods(i).argc > 0 Then
                ReDim As String args(0)
                Dim c As Integer
                c = Split(methods(i).args, ",", args())
                Dim a As Integer
                For a = 1 To c
                    Dim v As Integer
                    ReDim As String parts(0)
                    v = Split(args(a), ":", parts())
                    methodDec = methodDec + parts(1) + "/*" + parts(2) + "*/"
                    If a < c Then methodDec = methodDec + ","

                    ' add the parameter to the local variables
                    Dim bvar As Variable
                    bvar.name = parts(1)
                    bvar.type = parts(2)
                    bvar.typeId = FindTypeId(bvar.type)
                    If parts(3) = "true" Then
                        bvar.isArray = True
                    End If
                    bvar.jsname = ""
                    AddVariable bvar, localVars()

                Next a
            End If
            methodDec = methodDec + ") {"
            AddJSLine methods(i).line, methodDec
            AddJSLine methods(i).line, "if (QB.halted()) { return; }"
            If methods(i).type = "FUNCTION" Then
                AddJSLine methods(i).line, "var " + RemoveSuffix(methods(i).name) + " = null;"
            End If
            currentMethod = methods(i).name


            ConvertLines methods(i).line + 1, lastLine - 1, methods(i).name
            If methods(i).type = "FUNCTION" Then
                AddJSLine lastLine, "return " + RemoveSuffix(methods(i).name) + ";"
            End If
            AddJSLine lastLine, "}"
        End If
    Next i

    ' Add the export lines
    For i = 1 To UBound(exportLines)
        AddJSLine i, exportLines(i)
    Next i
    ReDim exportLines(0) As String
End Sub


Sub ReadLinesFromFile (filename As String)
    Dim fline As String
    Dim lineIndex As Integer
    Dim rawJS
    Open filename For Input As #1
    Do Until EOF(1)
        Line Input #1, fline
        lineIndex = lineIndex + 1

        If _Trim$(fline) <> "" Then ' remove all blank lines

            While EndsWith(fline, " _")
                Dim nextLine As String
                Line Input #1, nextLine
                fline = Left$(fline, Len(fline) - 1) + nextLine
            Wend

            rawJS = ReadLine(lineIndex, fline, rawJS)
        End If
    Loop
    Close #1
End Sub

Sub ReadLinesFromText (sourceText As String)
    ReDim As String sourceLines(0)
    Dim rawJS
    Dim lcount As Integer
    Dim i As Integer
    lcount = Split(sourceText, LF, sourceLines())
    For i = 1 To lcount
        Dim fline As String
        fline = sourceLines(i)

        If _Trim$(fline) <> "" Then ' remove all blank lines

            Dim lineIndex As Integer
            lineIndex = i

            If StartsWith(UCase$(fline), "IMPORT") Then
                ReDim parts(0) As String
                Dim pcount As Integer
                pcount = SLSplit(fline, parts(), False)
                If pcount = 4 Then
                    Dim moduleName As String
                    Dim sourceUrl As String
                    Dim importRes As FetchResponse
                    moduleName = parts(2)
                    sourceUrl = Mid$(parts(4), 2, Len(parts(4)) - 2)
                    Fetch sourceUrl, importRes
                    modLevel = modLevel + 1
                    QBToJS importRes.text, TEXT, moduleName
                    ResetDataStructures
                    modLevel = modLevel - 1

                    _Continue
                End If
            End If

            While EndsWith(fline, "_")
                i = i + 1
                Dim nextLine As String
                nextLine = sourceLines(i)
                fline = Left$(fline, Len(fline) - 1) + nextLine
            Wend

            rawJS = ReadLine(i, fline, rawJS)
        End If
    Next i
End Sub

Function ReadLine (lineIndex As Integer, fline As String, rawJS As Integer)
    ' Step 1: Remove any comments from the line
    Dim quoteDepth As Integer
    quoteDepth = 0
    Dim i As Integer
    For i = 1 To Len(fline)
        Dim c As String
        c = Mid$(fline, i, 1)
        If c = Chr$(34) Then
            If quoteDepth = 0 Then
                quoteDepth = 1
            Else
                quoteDepth = 0
            End If
        End If
        If quoteDepth = 0 And c = "'" Then
            fline = Left$(fline, i - 1)
            Exit For
        End If
    Next i

    ReadLine = rawJS

    'If (_Trim$(LCase$(Left$(fline, 4))) = "data") Then
    '    'AddLineTop dataTicker, fline
    '    'AddSubLinesTop dataTicker, fline
    '    AddLine dataTicker, fline
    '    AddSubLines dataTicker, fline
    '    Exit Function
    'End If
    'If (_Trim$(LCase$(Left$(fline, 6))) = "_label") Then
    '    'AddLineTop dataTicker, fline
    '    AddLine dataTicker, fline
    '    Exit Function
    'End If

    If _Trim$(fline) = "" Then Exit Function

    Dim word As String
    Dim words(0) As String
    Dim wcount As Integer
    wcount = SLSplit(fline, words(), False)

    ' Step 2: Determine whether native js is being included
    If rawJS Then
        AddLine lineIndex, fline
        Exit Function
    End If
    If UCase$(words(1)) = "$IF" And wcount > 1 Then
        If UCase$(words(2)) = "JAVASCRIPT" Then
            rawJS = True
            AddLine lineIndex, fline
            ReadLine = rawJS
            Exit Function
        End If
    End If
    If UCase$(words(1)) = "$END" Then
        If rawJS Then rawJS = Not rawJS
        AddLine lineIndex, fline
        ReadLine = rawJS
        Exit Function
    End If

    ' Step 3: Determine whether this line contains a data statement or line label
    Dim index As Integer
    If wcount = 1 Then
        If EndsWith(words(1), ":") Then
            index = UBound(dataLabels) + 1
            ReDim _Preserve As Label dataLabels(index)
            dataLabels(index).text = Left$(UCase$(words(1)), Len(words(1)) - 1)
            dataLabels(index).index = UBound(dataArray)
            Exit Function
        End If
    End If
    If UCase$(words(1)) = "DATA" Then
        Dim dstr As String
        dstr = Join(words(), 2, -1, " ")
        Dim dcount As Integer
        ReDim As String de(0)
        dcount = ListSplit(dstr, de())

        For i = 1 To dcount
            index = UBound(dataArray) + 1
            ReDim _Preserve As String dataArray(index)
            dataArray(index) = de(i)
        Next i
        Exit Function
    End If

    ' Step 4: Determine whether this line contains a single line if/then or if/then/else statement
    Dim As Integer ifIdx, thenIdx, elseIdx
    For i = 1 To wcount
        word = UCase$(words(i))
        If word = "IF" Then
            ifIdx = i
        ElseIf word = "THEN" Then
            thenIdx = i
        ElseIf word = "ELSE" Then
            elseIdx = i
        End If
    Next i


    If thenIdx > 0 And thenIdx < wcount Then
        AddLine lineIndex, Join(words(), 1, thenIdx, " ")
        If elseIdx > 0 Then
            AddSubLines lineIndex, Join(words(), thenIdx + 1, elseIdx - 1, " ")
            AddLine lineIndex, "Else"
            AddSubLines lineIndex, Join(words(), elseIdx + 1, -1, " ")
        Else
            AddSubLines lineIndex, Join(words(), thenIdx + 1, -1, " ")
        End If
        AddLine lineIndex, "End If"

    Else
        AddSubLines lineIndex, fline
    End If
End Function

Sub AddSubLines (lineIndex As Integer, fline As String)
    Dim quoteDepth As Integer
    quoteDepth = 0
    Dim i As Integer
    For i = 1 To Len(fline)
        Dim c As String
        c = Mid$(fline, i, 1)
        If c = Chr$(34) Then
            If quoteDepth = 0 Then
                quoteDepth = 1
            Else
                quoteDepth = 0
            End If
        End If
        If quoteDepth = 0 And c = ":" Then
            AddLine lineIndex, Left$(fline, i - 1)
            fline = Right$(fline, Len(fline) - i)
            i = 0
        End If
    Next i

    AddLine lineIndex, fline
End Sub

'Sub AddSubLinesTop (lineIndex As Integer, fline As String)
'    Dim quoteDepth As Integer
'    quoteDepth = 0
'    Dim i As Integer
'    For i = 1 To Len(fline)
'        Dim c As String
'        c = Mid$(fline, i, 1)
'        If c = Chr$(34) Then
'            If quoteDepth = 0 Then
'                quoteDepth = 1
'            Else
'                quoteDepth = 0
'            End If
'        End If
'        If quoteDepth = 0 And c = ":" Then
'            AddLineTop lineIndex, Left$(fline, i - 1)
'            fline = Right$(fline, Len(fline) - i)
'            i = 0
'        End If
'    Next i

'    AddLineTop lineIndex, fline
'End Sub

Sub FindMethods
    Dim i As Integer
    Dim pcount As Integer
    Dim rawJS As Integer
    ReDim As String parts(0)
    For i = 1 To UBound(lines)
        pcount = Split(lines(i).text, " ", parts())
        Dim word As String: word = UCase$(parts(1))


        If word = "$IF" And pcount > 1 Then
            If UCase$(parts(2)) = "JAVASCRIPT" Then rawJS = True
        End If
        If word = "$END" And rawJS Then rawJS = False
        If rawJS Then _Continue

        If word = "FUNCTION" Or word = "SUB" Then

            Dim m As Method
            m.line = i
            m.type = UCase$(parts(1))
            m.name = parts(2)
            m.argc = 0
            m.args = ""
            ReDim As Argument args(0)

            If UBound(parts) > 2 Then
                Dim a As Integer
                Dim args As String
                args = ""
                For a = 3 To UBound(parts)
                    args = args + parts(a) + " "
                Next a
                args = Mid$(_Trim$(args), 2, Len(_Trim$(args)) - 2)
                ReDim As String arga(0)
                m.argc = ListSplit(args, arga())
                args = ""
                For a = 1 To m.argc
                    ReDim As String aparts(0)
                    Dim apcount As Integer
                    Dim argname As String
                    Dim isArray As String: isArray = "false"
                    apcount = Split(arga(a), " ", aparts())
                    argname = aparts(1)
                    If EndsWith(argname, "()") Then
                        isArray = "true"
                        argname = Left$(argname, Len(argname) - 2)
                    End If
                    If apcount = 3 Then
                        args = args + argname + ":" + UCase$(aparts(3)) + ":" + isArray
                    Else
                        args = args + argname + ":" + DataTypeFromName(aparts(1)) + ":" + isArray
                    End If
                    If a <> m.argc Then
                        args = args + ","
                    End If
                Next a
                m.args = args
            End If

            AddMethod m, "", True
        End If
    Next i
End Sub

' TODO: look at refactoring this - do we really need 3 different variations of a split function?
Function Split (sourceString As String, delimiter As String, results() As String)
    ' Modified version of:
    ' https://www.qb64.org/forum/index.php?topic=1073.msg102711#msg102711
    Dim cstr As String
    Dim As Long p, curpos, arrpos, dpos

    ' Make a copy of the source string
    cstr = sourceString

    ' Special case if the delimiter is space, remove all excess space
    If delimiter = " " Then
        cstr = RTrim$(LTrim$(cstr))
        p = InStr(cstr, "  ")
        While p > 0
            cstr = Mid$(cstr, 1, p - 1) + Mid$(cstr, p + 1)
            p = InStr(cstr, "  ")
        Wend
    End If
    curpos = 1
    arrpos = 0
    dpos = InStr(curpos, cstr, delimiter)
    Do Until dpos = 0
        arrpos = arrpos + 1
        ReDim _Preserve As String results(arrpos)
        results(arrpos) = Mid$(cstr, curpos, dpos - curpos)
        curpos = dpos + Len(delimiter)
        dpos = InStr(curpos, cstr, delimiter)
    Loop
    arrpos = arrpos + 1
    ReDim _Preserve As String results(arrpos)
    results(arrpos) = Mid$(cstr, curpos)

    Split = arrpos
End Function


' String literal-aware split
Function SLSplit (sourceString As String, results() As String, escapeStrings As Integer)
    Dim cstr As String
    Dim As Long p, curpos, arrpos, dpos

    cstr = _Trim$(sourceString)

    ReDim As String results(0)

    Dim lastChar As String
    Dim quoteMode As Integer
    Dim result As String
    Dim count As Integer
    Dim i As Integer
    For i = 1 To Len(cstr)
        Dim c As String
        c = Mid$(cstr, i, 1)

        If c = Chr$(34) Then
            quoteMode = Not quoteMode
            result = result + c

            ' This is not the most intuitive place for this...
            ' If we find a string then escape any backslashes
            If Not quoteMode And escapeStrings Then
                result = Replace(result, "\", "\\")
            End If

        ElseIf c = " " Then
            If quoteMode Then
                result = result + c

            ElseIf lastChar = " " Then
                ' extra space, move along

            Else
                count = UBound(results) + 1
                ReDim _Preserve As String results(count)
                results(count) = result
                result = ""
            End If
        Else
            result = result + c
        End If

        lastChar = c
    Next i

    ' add the leftover last segment
    If result <> "" Then
        count = UBound(results) + 1
        ReDim _Preserve As String results(count)
        results(count) = result
    End If

    SLSplit = UBound(results)
End Function

' String literal-aware split - copy
Function SLSplit2 (sourceString As String, results() As String)
    Dim cstr As String
    Dim As Long p, curpos, arrpos, dpos

    cstr = _Trim$(sourceString)

    ReDim As String results(0)

    Dim lastChar As String
    Dim quoteMode As Integer
    Dim result As String
    Dim paren As Integer
    Dim count As Integer
    Dim i As Integer
    For i = 1 To Len(cstr)
        Dim c As String
        c = Mid$(cstr, i, 1)

        If c = Chr$(34) Then
            quoteMode = Not quoteMode
            result = result + c

        ElseIf quoteMode Then
            result = result + c

        ElseIf c = "(" Then
            paren = paren + 1
            result = result + c

        ElseIf c = ")" Then
            paren = paren - 1
            result = result + c

        ElseIf paren > 0 Then
            result = result + c

        ElseIf c = " " Then
            If lastChar = " " Then
                ' extra space, move along

            Else
                count = UBound(results) + 1
                ReDim _Preserve As String results(count)
                results(count) = result
                result = ""
            End If
        Else
            result = result + c
        End If

        lastChar = c
    Next i

    ' add the leftover last segment
    If result <> "" Then
        count = UBound(results) + 1
        ReDim _Preserve As String results(count)
        results(count) = result
    End If

    SLSplit2 = UBound(results)
End Function


Function ListSplit (sourceString As String, results() As String)
    Dim cstr As String
    Dim As Long p, curpos, arrpos, dpos

    cstr = _Trim$(sourceString)

    ReDim As String results(0)

    Dim quoteMode As Integer
    Dim result As String
    Dim count As Integer
    Dim paren As Integer
    Dim i As Integer
    For i = 1 To Len(cstr)
        Dim c As String
        c = Mid$(cstr, i, 1)

        If c = Chr$(34) Then
            quoteMode = Not quoteMode
            result = result + c

        ElseIf quoteMode Then
            result = result + c

        ElseIf c = "(" Then
            paren = paren + 1
            result = result + c

        ElseIf c = ")" Then
            paren = paren - 1
            result = result + c

        ElseIf paren > 0 Then
            result = result + c

        ElseIf c = "," Then

            count = UBound(results) + 1
            ReDim _Preserve As String results(count)
            results(count) = result
            result = ""
        Else
            result = result + c
        End If

    Next i

    ' add the leftover last segment
    If result <> "" Then
        count = UBound(results) + 1
        ReDim _Preserve As String results(count)
        results(count) = result
    End If

    ListSplit = UBound(results)
End Function

' TODO: This copy and paste approach has gotten completely out of hand.
'       I need to just bite the bullet and really implement a genericized
'       version that can be used for multiple scenarios
Function PrintSplit (sourceString As String, results() As String)
    Dim cstr As String
    Dim As Long p, curpos, arrpos, dpos

    cstr = _Trim$(sourceString)

    ReDim As String results(0)

    Dim quoteMode As Integer
    Dim result As String
    Dim count As Integer
    Dim paren As Integer
    Dim i As Integer
    For i = 1 To Len(cstr)
        Dim c As String
        c = Mid$(cstr, i, 1)

        If c = Chr$(34) Then
            quoteMode = Not quoteMode
            result = result + c

        ElseIf quoteMode Then
            result = result + c

        ElseIf c = "(" Then
            paren = paren + 1
            result = result + c

        ElseIf c = ")" Then
            paren = paren - 1
            result = result + c

        ElseIf paren > 0 Then
            result = result + c

        ElseIf c = "," Or c = ";" Then
            ' add the previous expression
            If result <> "" Then
                count = UBound(results) + 1
                ReDim _Preserve As String results(count)
                results(count) = result
                result = ""
            End If

            ' add the delimiter too
            count = UBound(results) + 1
            ReDim _Preserve As String results(count)
            results(count) = c
        Else
            result = result + c
        End If

    Next i

    ' add the leftover last segment
    If result <> "" Then
        count = UBound(results) + 1
        ReDim _Preserve As String results(count)
        results(count) = result
    End If

    PrintSplit = UBound(results)
End Function



Sub PrintMethods
    Print ""
    Print "Methods"
    Print "------------------------------------------------------------"
    Dim i As Integer
    For i = 1 To UBound(methods)
        Dim m As Method
        m = methods(i)
        Print Str$(m.line) + ": " + m.type + " - " + m.name + " [" + m.jsname + "] - " + m.returnType + " - " + m.args
    Next i
End Sub

Sub PrintTypes
    Print ""
    Print "Types"
    Print "------------------------------------------------------------"
    Dim i As Integer
    For i = 1 To UBound(types)
        Dim t As QBType
        t = types(i)
        Print Str$(t.line) + ": " + t.name ' + " - " + m.args
        Dim v As Integer
        For v = 1 To UBound(typeVars)
            If typeVars(i).typeId = i Then
                Print "  -> " + typeVars(v).name + ": " + typeVars(v).type
            End If
        Next v
    Next i
End Sub

Function CopyMethod (fromMethod As Method, toMethod As Method)
    toMethod.type = fromMethod.type
    toMethod.name = fromMethod.name
End Function

Sub AddMethod (m As Method, prefix As String, sync As Integer)
    Dim mcount: mcount = UBound(methods) + 1
    ReDim _Preserve As Method methods(mcount)
    If m.type = "FUNCTION" Then
        m.returnType = DataTypeFromName(m.name)
    End If
    m.uname = UCase$(RemoveSuffix(m.name))
    m.jsname = MethodJS(m, prefix)
    m.sync = sync
    methods(mcount) = m
End Sub


Sub AddExportMethod (m As Method, prefix As String, sync As Integer)
    Dim mcount: mcount = UBound(exportMethods) + 1
    ReDim _Preserve As Method exportMethods(mcount)
    If m.type = "FUNCTION" Then
        m.returnType = DataTypeFromName(m.name)
    End If
    m.uname = UCase$(RemoveSuffix(m.name))
    m.jsname = MethodJS(m, prefix)
    m.uname = UCase$(prefix) + m.uname
    m.name = prefix + m.name
    m.sync = sync
    exportMethods(mcount) = m
End Sub

Sub AddExportConst (vname As String)
    Dim v As Variable
    v.type = "CONST"
    v.name = vname
    v.isConst = True
    AddVariable v, exportConsts()
End Sub


Sub AddGXMethod (mtype As String, mname As String, sync As Integer)
    Dim mcount: mcount = UBound(methods) + 1
    ReDim _Preserve As Method methods(mcount)
    Dim m As Method
    m.type = mtype
    m.name = mname
    m.uname = UCase$(m.name)
    m.sync = sync
    m.jsname = GXMethodJS(RemoveSuffix(mname))
    If mtype = "FUNCTION" Then
        m.returnType = DataTypeFromName(mname)
    End If
    methods(mcount) = m
End Sub

Sub AddQBMethod (mtype As String, mname As String, sync As Integer)
    Dim m As Method
    m.type = mtype
    m.name = mname
    AddMethod m, "QB.", sync
End Sub

'Sub AddLineTop (lineIndex As Integer, fline As String)
'    Dim lcount As Integer: lcount = UBound(lines) + 1
'    ReDim _Preserve As CodeLine lines(lcount)
'    Dim j As Integer
'    For j = UBound(lines) To dataTicker Step -1
'        lines(j).line = lines(j - 1).line
'        lines(j).text = lines(j - 1).text
'    Next
'    lines(dataTicker).line = dataTicker
'    lines(dataTicker).text = fline
'    dataTicker = dataTicker + 1
'End Sub

Sub AddLine (lineIndex As Integer, fline As String)
    __AddLine lineIndex, fline
End Sub

Sub __AddLine (lineIndex As Integer, fline As String)
    Dim lcount As Integer: lcount = UBound(lines) + 1
    ReDim _Preserve As CodeLine lines(lcount)
    lines(lcount).line = lineIndex
    lines(lcount).text = fline
End Sub

Sub AddJSLine (sourceLine As Integer, jsline As String)
    Dim lcount As Integer: lcount = UBound(jsLines) + 1
    ReDim _Preserve As CodeLine jsLines(lcount)
    jsLines(lcount).line = sourceLine
    jsLines(lcount).text = jsline
End Sub

Sub AddWarning (sourceLine As Integer, msgText As String)
    Dim lcount As Integer: lcount = UBound(warnings) + 1
    ReDim _Preserve As CodeLine warnings(lcount)
    Dim l As Integer
    If (sourceLine > 0) Then
        l = lines(sourceLine).line
    End If

    warnings(lcount).line = l
    warnings(lcount).text = msgText
End Sub


Sub AddConst (vname As String)
    Dim v As Variable
    v.type = "CONST"
    v.name = vname
    v.isConst = True
    AddVariable v, globalVars()
End Sub

Sub AddGXConst (vname As String)
    Dim v As Variable
    v.type = "CONST"
    v.name = vname
    If vname = "GX_TRUE" Then
        v.jsname = "true"
    ElseIf vname = "GX_FALSE" Then
        v.jsname = "false"
    Else
        Dim jsname As String
        jsname = Mid$(vname, 3, Len(vname) - 2)
        If Left$(jsname, 1) = "_" Then jsname = Right$(jsname, Len(jsname) - 1)
        v.jsname = "GX." + jsname
    End If
    v.isConst = True
    AddVariable v, globalVars()
End Sub

Sub AddQBConst (vname As String)
    Dim v As Variable
    v.type = "CONST"
    v.name = vname
    v.jsname = "QB." + vname
    v.isConst = True
    AddVariable v, globalVars()
End Sub

Sub AddGlobal (vname As String, vtype As String, arraySize As Integer)
    Dim v As Variable
    v.type = vtype
    v.name = vname
    v.isArray = arraySize > -1
    v.arraySize = arraySize
    AddVariable v, globalVars()
End Sub

Sub AddLocal (vname As String, vtype As String, arraySize As Integer)
    Dim v As Variable
    v.type = vtype
    v.name = vname
    v.isArray = arraySize > -1
    v.arraySize = arraySize
    AddVariable v, localVars()
End Sub

Sub AddVariable (bvar As Variable, vlist() As Variable)
    Dim vcount: vcount = UBound(vlist) + 1
    ReDim _Preserve As Variable vlist(vcount)
    Dim nvar As Variable
    nvar.type = bvar.type
    nvar.name = bvar.name
    nvar.jsname = bvar.jsname
    nvar.isConst = bvar.isConst
    nvar.isArray = bvar.isArray
    nvar.arraySize = bvar.arraySize
    nvar.typeId = bvar.typeId

    If nvar.jsname = "" Then nvar.jsname = RemoveSuffix(nvar.name)
    vlist(vcount) = nvar
End Sub

Sub AddType (t As QBType)
    Dim tcount: tcount = UBound(types) + 1
    ReDim _Preserve As QBType types(tcount)
    types(tcount) = t
End Sub

Sub AddSystemType (tname As String, args As String)
    Dim t As QBType
    t.name = tname
    AddType t
    Dim typeId As Integer
    typeId = UBound(types)
    Dim count As Integer
    ReDim As String pairs(0)
    count = Split(args, ",", pairs())
    Dim i As Integer
    For i = 1 To UBound(pairs)
        ReDim As String nv(0)
        count = Split(pairs(i), ":", nv())
        Dim tvar As Variable
        tvar.typeId = typeId
        tvar.name = nv(1)
        tvar.type = UCase$(nv(2))
        AddVariable tvar, typeVars()
    Next i
End Sub

Function MainEnd
    If programMethods = 0 Then
        MainEnd = UBound(lines)
    Else
        MainEnd = methods(1).line - 1
    End If
End Function

Function RemoveSuffix$ (vname As String)
    Dim i As Integer
    Dim done As Integer
    Dim c As String
    vname = _Trim$(vname)
    i = Len(vname)
    While Not done
        c = Mid$(vname, i, 1)
        If c = "`" Or c = "%" Or c = "&" Or c = "$" Or c = "~" Or c = "!" Then
            i = i - 1
        Else
            done = True
        End If
    Wend
    RemoveSuffix = Left$(vname, i)
End Function

Function DataTypeFromName$ (vname As String)
    Dim dt As String
    If EndsWith(vname, "$") Then
        dt = "STRING"
    ElseIf EndsWith(vname, "`") Then
        dt = "_BIT"
    ElseIf EndsWith(vname, "%%") Then
        dt = "_BYTE"
    ElseIf EndsWith(vname, "~%") Then
        dt = "_UNSIGNED INTEGER"
    ElseIf EndsWith(vname, "%") Then
        dt = "INTEGER"
    ElseIf EndsWith(vname, "~&&") Then
        dt = "_UNSIGNED INTEGER64"
    ElseIf EndsWith(vname, "&&") Then
        dt = "_INTEGER64"
    ElseIf EndsWith(vname, "~&") Then
        dt = "_UNSIGNED LONG"
    ElseIf EndsWith(vname, "##") Then
        dt = "_FLOAT"
    ElseIf EndsWith(vname, "#") Then
        dt = "DOUBLE"
    ElseIf EndsWith(vname, "~%&") Then
        dt = "_UNSIGNED _OFFSET"
    ElseIf EndsWith(vname, "%&") Then
        dt = "_OFFSET"
    ElseIf EndsWith(vname, "&") Then
        dt = "LONG"
    ElseIf EndsWith(vname, "!") Then
        dt = "SINGLE"
    Else
        dt = "SINGLE"
    End If

    DataTypeFromName = dt
End Function

Function EndsWith (s As String, finds As String)
    If Len(finds) > Len(s) Then
        EndsWith = False
        Exit Function
    End If
    If _InStrRev(s, finds) = Len(s) - (Len(finds) - 1) Then
        EndsWith = True
    Else
        EndsWith = False
    End If
End Function

Function StartsWith (s As String, finds As String)
    If Len(finds) > Len(s) Then
        StartsWith = False
        Exit Function
    End If
    If InStr(s, finds) = 1 Then
        StartsWith = True
    Else
        StartsWith = False
    End If
End Function

Function Join$ (parts() As String, startIndex As Integer, endIndex As Integer, delimiter As String)

    If endIndex = -1 Then endIndex = UBound(parts)
    Dim s As String
    Dim i As Integer
    For i = startIndex To endIndex
        s = s + parts(i)
        If i <> UBound(parts) Then
            s = s + delimiter
        End If
    Next i
    Join = s
End Function

Function LPad$ (s As String, padChar As String, swidth As Integer)
    Dim padding As String
    padding = String$(swidth - Len(s), padChar)
    LPad = padding + s
End Function

Function Replace$ (s As String, searchString As String, newString As String)
    Dim ns As String
    Dim i As Integer

    Dim slen As Integer
    slen = Len(searchString)

    For i = 1 To Len(s) '- slen + 1
        If Mid$(s, i, slen) = searchString Then
            ns = ns + newString
            i = i + slen - 1
        Else
            ns = ns + Mid$(s, i, 1)
        End If
    Next i

    Replace = ns
End Function

' Pseudo-constants
Function LF$: LF = Chr$(10): End Function
Function CR$: CR = Chr$(13): End Function
Function CRLF$: CRLF = CR + LF: End Function


Function MethodJS$ (m As Method, prefix As String)
    Dim jsname As String
    jsname = prefix
    If m.type = "FUNCTION" Then
        jsname = jsname + "func_"
    Else
        jsname = jsname + "sub_"
    End If

    Dim i As Integer
    Dim c As String
    Dim a As Integer
    For i = 1 To Len(m.name)
        c = Mid$(m.name, i, 1)
        a = Asc(c)
        ' uppercase, lowercase, numbers, - and .
        If (a >= 65 And a <= 90) Or (a >= 97 And a <= 122) Or _
           (a >= 48 And a <= 57) Or _
           a = 95 Or a = 46 Then
            jsname = jsname + c
        End If
    Next i

    MethodJS = jsname
End Function

Function GXMethodJS$ (mname As String)
    Dim jsname As String
    Dim startIdx As Integer
    If InStr(mname, "GXSTR") = 1 Then
        jsname = "GXSTR."
        startIdx = 7
    Else
        jsname = "GX."
        startIdx = 3
    End If
    jsname = jsname + LCase$(Mid$(mname, startIdx, 1))

    Dim i As Integer
    Dim c As String
    Dim a As Integer
    For i = startIdx + 1 To Len(mname)
        c = Mid$(mname, i, 1)
        a = Asc(c)
        ' uppercase, lowercase, numbers, - and .
        If (a >= 65 And a <= 90) Or (a >= 97 And a <= 122) Or _
           (a >= 48 And a <= 57) Or _
           a = 95 Or a = 46 Then
            jsname = jsname + c
        End If
    Next i

    If mname = "GXMapLoad" Or mname = "GXSceneStart" Then
        jsname = "await " + jsname
    End If

    GXMethodJS = jsname
End Function

Sub InitGX
    AddSystemType "GXPOSITION", "x:LONG,y:LONG"
    AddSystemType "GXDEVICEINPUT", "deviceId:INTEGER,deviceType:INTEGER,inputType:INTEGER,inputId:INTEGER,inputValue:INTEGER"


    AddGXConst "GX_FALSE"
    AddGXConst "GX_TRUE"
    AddGXConst "GXEVENT_INIT"
    AddGXConst "GXEVENT_UPDATE"
    AddGXConst "GXEVENT_DRAWBG"
    AddGXConst "GXEVENT_DRAWMAP"
    AddGXConst "GXEVENT_DRAWSCREEN"
    AddGXConst "GXEVENT_MOUSEINPUT"
    AddGXConst "GXEVENT_PAINTBEFORE"
    AddGXConst "GXEVENT_PAINTAFTER"
    AddGXConst "GXEVENT_COLLISION_TILE"
    AddGXConst "GXEVENT_COLLISION_ENTITY"
    AddGXConst "GXEVENT_PLAYER_ACTION"
    AddGXConst "GXEVENT_ANIMATE_COMPLETE"
    AddGXConst "GXANIMATE_LOOP"
    AddGXConst "GXANIMATE_SINGLE"
    AddGXConst "GXBG_STRETCH"
    AddGXConst "GXBG_SCROLL"
    AddGXConst "GXBG_WRAP"
    AddGXConst "GXKEY_ESC"
    AddGXConst "GXKEY_1"
    AddGXConst "GXKEY_2"
    AddGXConst "GXKEY_3"
    AddGXConst "GXKEY_4"
    AddGXConst "GXKEY_5"
    AddGXConst "GXKEY_6"
    AddGXConst "GXKEY_7"
    AddGXConst "GXKEY_8"
    AddGXConst "GXKEY_9"
    AddGXConst "GXKEY_0"
    AddGXConst "GXKEY_DASH"
    AddGXConst "GXKEY_EQUALS"
    AddGXConst "GXKEY_BACKSPACE"
    AddGXConst "GXKEY_TAB"
    AddGXConst "GXKEY_Q"
    AddGXConst "GXKEY_W"
    AddGXConst "GXKEY_E"
    AddGXConst "GXKEY_R"
    AddGXConst "GXKEY_T"
    AddGXConst "GXKEY_Y"
    AddGXConst "GXKEY_U"
    AddGXConst "GXKEY_I"
    AddGXConst "GXKEY_O"
    AddGXConst "GXKEY_P"
    AddGXConst "GXKEY_LBRACKET"
    AddGXConst "GXKEY_RBRACKET"
    AddGXConst "GXKEY_ENTER"
    AddGXConst "GXKEY_LCTRL"
    AddGXConst "GXKEY_A"
    AddGXConst "GXKEY_S"
    AddGXConst "GXKEY_D"
    AddGXConst "GXKEY_F"
    AddGXConst "GXKEY_G"
    AddGXConst "GXKEY_H"
    AddGXConst "GXKEY_J"
    AddGXConst "GXKEY_K"
    AddGXConst "GXKEY_L"
    AddGXConst "GXKEY_SEMICOLON"
    AddGXConst "GXKEY_QUOTE"
    AddGXConst "GXKEY_BACKQUOTE"
    AddGXConst "GXKEY_LSHIFT"
    AddGXConst "GXKEY_BACKSLASH"
    AddGXConst "GXKEY_Z"
    AddGXConst "GXKEY_X"
    AddGXConst "GXKEY_C"
    AddGXConst "GXKEY_V"
    AddGXConst "GXKEY_B"
    AddGXConst "GXKEY_N"
    AddGXConst "GXKEY_M"
    AddGXConst "GXKEY_COMMA"
    AddGXConst "GXKEY_PERIOD"
    AddGXConst "GXKEY_SLASH"
    AddGXConst "GXKEY_RSHIFT"
    AddGXConst "GXKEY_NUMPAD_MULTIPLY"
    AddGXConst "GXKEY_SPACEBAR"
    AddGXConst "GXKEY_CAPSLOCK"
    AddGXConst "GXKEY_F1"
    AddGXConst "GXKEY_F2"
    AddGXConst "GXKEY_F3"
    AddGXConst "GXKEY_F4"
    AddGXConst "GXKEY_F5"
    AddGXConst "GXKEY_F6"
    AddGXConst "GXKEY_F7"
    AddGXConst "GXKEY_F8"
    AddGXConst "GXKEY_F9"
    AddGXConst "GXKEY_PAUSE"
    AddGXConst "GXKEY_SCRLK"
    AddGXConst "GXKEY_NUMPAD_7"
    AddGXConst "GXKEY_NUMPAD_8"
    AddGXConst "GXKEY_NUMPAD_9"
    AddGXConst "GXKEY_NUMPAD_MINUS"
    AddGXConst "GXKEY_NUMPAD_4"
    AddGXConst "GXKEY_NUMPAD_5"
    AddGXConst "GXKEY_NUMPAD_6"
    AddGXConst "GXKEY_NUMPAD_PLUS"
    AddGXConst "GXKEY_NUMPAD_1"
    AddGXConst "GXKEY_NUMPAD_2"
    AddGXConst "GXKEY_NUMPAD_3"
    AddGXConst "GXKEY_NUMPAD_0"
    AddGXConst "GXKEY_NUMPAD_PERIOD"
    AddGXConst "GXKEY_F11"
    AddGXConst "GXKEY_F12"
    AddGXConst "GXKEY_NUMPAD_ENTER"
    AddGXConst "GXKEY_RCTRL"
    AddGXConst "GXKEY_NUMPAD_DIVIDE"
    AddGXConst "GXKEY_NUMLOCK"
    AddGXConst "GXKEY_HOME"
    AddGXConst "GXKEY_UP"
    AddGXConst "GXKEY_PAGEUP"
    AddGXConst "GXKEY_LEFT"
    AddGXConst "GXKEY_RIGHT"
    AddGXConst "GXKEY_END"
    AddGXConst "GXKEY_DOWN"
    AddGXConst "GXKEY_PAGEDOWN"
    AddGXConst "GXKEY_INSERT"
    AddGXConst "GXKEY_DELETE"
    AddGXConst "GXKEY_LWIN"
    AddGXConst "GXKEY_RWIN"
    AddGXConst "GXKEY_MENU"
    AddGXConst "GXACTION_MOVE_LEFT"
    AddGXConst "GXACTION_MOVE_RIGHT"
    AddGXConst "GXACTION_MOVE_UP"
    AddGXConst "GXACTION_MOVE_DOWN"
    AddGXConst "GXACTION_JUMP"
    AddGXConst "GXACTION_JUMP_RIGHT"
    AddGXConst "GXACTION_JUMP_LEFT"
    AddGXConst "GXSCENE_FOLLOW_NONE"
    AddGXConst "GXSCENE_FOLLOW_ENTITY_CENTER"
    AddGXConst "GXSCENE_FOLLOW_ENTITY_CENTER_X"
    AddGXConst "GXSCENE_FOLLOW_ENTITY_CENTER_Y"
    AddGXConst "GXSCENE_FOLLOW_ENTITY_CENTER_X_POS"
    AddGXConst "GXSCENE_FOLLOW_ENTITY_CENTER_X_NEG"
    AddGXConst "GXSCENE_CONSTRAIN_NONE"
    AddGXConst "GXSCENE_CONSTRAIN_TO_MAP"
    AddGXConst "GXFONT_DEFAULT"
    AddGXConst "GXFONT_DEFAULT_BLACK"
    AddGXConst "GXDEVICE_KEYBOARD"
    AddGXConst "GXDEVICE_MOUSE"
    AddGXConst "GXDEVICE_CONTROLLER"
    AddGXConst "GXDEVICE_BUTTON"
    AddGXConst "GXDEVICE_AXIS"
    AddGXConst "GXDEVICE_WHEEL"
    AddGXConst "GXTYPE_ENTITY"
    AddGXConst "GXTYPE_FONT"

    AddGXMethod "SUB", "GXSleep", True
    AddGXMethod "FUNCTION", "GXMouseX", False
    AddGXMethod "FUNCTION", "GXMouseY", False
    AddGXMethod "FUNCTION", "GXSoundLoad", False
    AddGXMethod "SUB", "GXSoundPlay", False
    AddGXMethod "SUB", "GXSoundRepeat", False
    AddGXMethod "SUB", "GXSoundVolume", False
    AddGXMethod "SUB", "GXSoundPause", False
    AddGXMethod "SUB", "GXSoundStop", False
    AddGXMethod "SUB", "GXSoundMuted", False
    AddGXMethod "FUNCTION", "GXSoundMuted", False
    AddGXMethod "SUB", "GXEntityAnimate", False
    AddGXMethod "SUB", "GXEntityAnimateStop", False
    AddGXMethod "SUB", "GXEntityAnimateMode", False
    AddGXMethod "FUNCTION", "GXEntityAnimateMode", False
    AddGXMethod "FUNCTION", "GXScreenEntityCreate", False
    AddGXMethod "FUNCTION", "GXEntityCreate", False
    AddGXMethod "SUB", "GXEntityCreate", False
    AddGXMethod "SUB", "GXEntityVisible", False
    AddGXMethod "SUB", "GXEntityMove", False
    AddGXMethod "SUB", "GXEntityPos", False
    AddGXMethod "SUB", "GXEntityVX", False
    AddGXMethod "FUNCTION", "GXEntityVX", False
    AddGXMethod "SUB", "GXEntityVY", False
    AddGXMethod "FUNCTION", "GXEntityVY", False
    AddGXMethod "FUNCTION", "GXEntityX", False
    AddGXMethod "FUNCTION", "GXEntityY", False
    AddGXMethod "FUNCTION", "GXEntityWidth", False
    AddGXMethod "FUNCTION", "GXEntityHeight", False
    AddGXMethod "SUB", "GXEntityFrameNext", False
    AddGXMethod "SUB", "GXEntityFrameSet", False
    AddGXMethod "SUB", "GXEntityType", False
    AddGXMethod "FUNCTION", "GXEntityType", False
    AddGXMethod "FUNCTION", "GXEntityUID$", False
    AddGXMethod "FUNCTION", "GXFontUID$", False
    AddGXMethod "SUB", "GXEntityApplyGravity", False
    AddGXMethod "FUNCTION", "GXEntityApplyGravity", False
    AddGXMethod "SUB", "GXEntityCollisionOffset", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetLeft", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetTop", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetRight", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetBottom", False
    AddGXMethod "SUB", "GXFullScreen", False
    AddGXMethod "FUNCTION", "GXFullScreen", False
    AddGXMethod "FUNCTION", "GXBackgroundAdd", False
    AddGXMethod "SUB", "GXBackgroundY", False
    AddGXMethod "SUB", "GXBackgroundHeight", False
    AddGXMethod "SUB", "GXBackgroundClear", False
    AddGXMethod "SUB", "GXSceneEmbedded", False
    AddGXMethod "FUNCTION", "GXSceneEmbedded", False
    AddGXMethod "SUB", "GXSceneCreate", False
    AddGXMethod "SUB", "GXSceneWindowSize", False
    AddGXMethod "SUB", "GXSceneScale", False
    AddGXMethod "SUB", "GXSceneResize", False
    AddGXMethod "SUB", "GXSceneDestroy", False
    AddGXMethod "SUB", "GXCustomDraw", False
    AddGXMethod "FUNCTION", "GXCustomDraw", False
    AddGXMethod "SUB", "GXFrameRate", False
    AddGXMethod "FUNCTION", "GXFrameRate", False
    AddGXMethod "FUNCTION", "GXFrame", False
    AddGXMethod "SUB", "GXSceneDraw", False
    AddGXMethod "SUB", "GXSceneMove", False
    AddGXMethod "SUB", "GXScenePos", False
    AddGXMethod "FUNCTION", "GXSceneX", False
    AddGXMethod "FUNCTION", "GXSceneY", False
    AddGXMethod "FUNCTION", "GXSceneWidth", False
    AddGXMethod "FUNCTION", "GXSceneHeight", False
    AddGXMethod "FUNCTION", "GXSceneColumns", False
    AddGXMethod "FUNCTION", "GXSceneRows", False
    AddGXMethod "SUB", "GXSceneStart", True
    AddGXMethod "SUB", "GXSceneUpdate", False
    AddGXMethod "SUB", "GXSceneFollowEntity", False
    AddGXMethod "SUB", "GXSceneConstrain", False
    AddGXMethod "SUB", "GXSceneStop", False
    AddGXMethod "SUB", "GXMapCreate", False
    AddGXMethod "FUNCTION", "GXMapColumns", False
    AddGXMethod "FUNCTION", "GXMapRows", False
    AddGXMethod "FUNCTION", "GXMapLayers", False
    AddGXMethod "SUB", "GXMapLayerVisible", False
    AddGXMethod "FUNCTION", "GXMapLayerVisible", False
    AddGXMethod "SUB", "GXMapLayerAdd", False
    AddGXMethod "SUB", "GXMapLayerInsert", False
    AddGXMethod "SUB", "GXMapLayerRemove", False
    AddGXMethod "SUB", "GXMapResize", False
    AddGXMethod "SUB", "GXMapDraw", False
    AddGXMethod "SUB", "GXMapTilePosAt", False
    AddGXMethod "SUB", "GXMapTile", False
    AddGXMethod "FUNCTION", "GXMapTile", False
    AddGXMethod "FUNCTION", "GXMapTileDepth", False
    AddGXMethod "SUB", "GXMapTileAdd", False
    AddGXMethod "SUB", "GXMapTileRemove", False
    AddGXMethod "FUNCTION", "GXMapVersion", False
    AddGXMethod "SUB", "GXMapSave", False
    AddGXMethod "SUB", "GXMapLoad", True
    AddGXMethod "FUNCTION", "GXMapIsometric", False
    AddGXMethod "SUB", "GXMapIsometric", False
    AddGXMethod "SUB", "GXSpriteDraw", False
    AddGXMethod "SUB", "GXSpriteDrawScaled", False
    AddGXMethod "SUB", "GXTilesetCreate", False
    AddGXMethod "SUB", "GXTilesetReplaceImage", False
    AddGXMethod "SUB", "GXTilesetLoad", False
    AddGXMethod "SUB", "GXTilesetSave", False
    AddGXMethod "SUB", "GXTilesetPos", False
    AddGXMethod "FUNCTION", "GXTilesetWidth", False
    AddGXMethod "FUNCTION", "GXTilesetHeight", False
    AddGXMethod "FUNCTION", "GXTilesetColumns", False
    AddGXMethod "FUNCTION", "GXTilesetRows", False
    AddGXMethod "FUNCTION", "GXTilesetFilename", False
    AddGXMethod "FUNCTION", "GXTilesetImage", False
    AddGXMethod "SUB", "GXTilesetAnimationCreate", False
    AddGXMethod "SUB", "GXTilesetAnimationAdd", False
    AddGXMethod "SUB", "GXTilesetAnimationRemove", False
    AddGXMethod "FUNCTION", "GXTilesetAnimationFrames", False
    AddGXMethod "FUNCTION", "GXTilesetAnimationSpeed", False
    AddGXMethod "SUB", "GXTilesetAnimationSpeed", False
    AddGXMethod "FUNCTION", "GXFontCreate", False
    AddGXMethod "SUB", "GXFontCreate", False
    AddGXMethod "FUNCTION", "GXFontWidth", False
    AddGXMethod "FUNCTION", "GXFontHeight", False
    AddGXMethod "FUNCTION", "GXFontCharSpacing", False
    AddGXMethod "SUB", "GXFontCharSpacing", False
    AddGXMethod "FUNCTION", "GXFontLineSpacing", False
    AddGXMethod "SUB", "GXFontLineSpacing", False
    AddGXMethod "SUB", "GXDrawText", False
    AddGXMethod "FUNCTION", "GXDebug", False
    AddGXMethod "SUB", "GXDebug", False
    AddGXMethod "FUNCTION", "GXDebugScreenEntities", False
    AddGXMethod "SUB", "GXDebugScreenEntities", False
    AddGXMethod "FUNCTION", "GXDebugFont", False
    AddGXMethod "SUB", "GXDebugFont", False
    AddGXMethod "FUNCTION", "GXDebugTileBorderColor", False
    AddGXMethod "SUB", "GXDebugTileBorderColor", False
    AddGXMethod "FUNCTION", "GXDebugEntityBorderColor", False
    AddGXMethod "SUB", "GXDebugEntityBorderColor", False
    AddGXMethod "FUNCTION", "GXDebugEntityCollisionColor", False
    AddGXMethod "SUB", "GXDebugEntityCollisionColor", False
    AddGXMethod "SUB", "GXKeyInput", False
    AddGXMethod "FUNCTION", "GXKeyDown", False
    AddGXMethod "SUB", "GXDeviceInputDetect", False
    AddGXMethod "FUNCTION", "GXDeviceInputTest", False
    AddGXMethod "FUNCTION", "GXDeviceName", False
    AddGXMethod "FUNCTION", "GXDeviceTypeName", False
    AddGXMethod "FUNCTION", "GXInputTypeName", False
    AddGXMethod "FUNCTION", "GXKeyButtonName", False

    ' Supporting Libraries
    AddGXConst "GX_CR"
    AddGXConst "GX_LF"
    AddGXConst "GX_CRLF"

    AddGXMethod "FUNCTION", "GXSTR_LPad", False
    AddGXMethod "FUNCTION", "GXSTR_RPad", False
    AddGXMethod "FUNCTION", "GXSTR_Replace", False

End Sub

Sub InitQBMethods
    ' QB64 Methods
    ' ----------------------------------------------------------
    AddQBMethod "FUNCTION", "_Alpha", False
    AddQBMethod "FUNCTION", "_Alpha32", False
    AddQBMethod "FUNCTION", "_Acos", False
    AddQBMethod "FUNCTION", "_Acosh", False
    AddQBMethod "FUNCTION", "_Atanh", False
    AddQBMethod "FUNCTION", "_Asin", False
    AddQBMethod "FUNCTION", "_Asinh", False
    AddQBMethod "FUNCTION", "_Atan2", False
    AddQBMethod "FUNCTION", "_AutoDisplay", False
    AddQBMethod "SUB", "_AutoDisplay", False
    AddQBMethod "FUNCTION", "_Blue", False
    AddQBMethod "FUNCTION", "_Blue32", False
    AddQBMethod "FUNCTION", "_Ceil", False
    AddQBMethod "FUNCTION", "_CopyImage", False
    AddQBMethod "FUNCTION", "_Cosh", False
    AddQBMethod "FUNCTION", "_Coth", False
    AddQBMethod "FUNCTION", "_Csch", False
    AddQBMethod "FUNCTION", "_D2G", False
    AddQBMethod "FUNCTION", "_D2R", False
    AddQBMethod "SUB", "_Delay", True
    AddQBMethod "FUNCTION", "_Dest", False
    AddQBMethod "SUB", "_Dest", False
    AddQBMethod "FUNCTION", "_Display", False
    AddQBMethod "SUB", "_Display", False
    AddQBMethod "FUNCTION", "_FontWidth", False
    AddQBMethod "SUB", "_FreeImage", False
    AddQBMethod "SUB", "_FullScreen", False
    AddQBMethod "FUNCTION", "_FullScreen", False
    AddQBMethod "FUNCTION", "_G2D", False
    AddQBMethod "FUNCTION", "_G2R", False
    AddQBMethod "FUNCTION", "_Green", False
    AddQBMethod "FUNCTION", "_Green32", False
    AddQBMethod "FUNCTION", "_Height", False
    AddQBMethod "FUNCTION", "_Hypot", False
    AddQBMethod "FUNCTION", "_InStrRev", False
    AddQBMethod "SUB", "_Limit", True
    AddQBMethod "SUB", "_KeyClear", False
    AddQBMethod "FUNCTION", "_KeyDown", False
    AddQBMethod "FUNCTION", "_KeyHit", False
    AddQBMethod "FUNCTION", "_LoadImage", True
    AddQBMethod "FUNCTION", "_MouseButton", False
    AddQBMethod "FUNCTION", "_MouseInput", False
    AddQBMethod "FUNCTION", "_MouseX", False
    AddQBMethod "FUNCTION", "_MouseY", False
    AddQBMethod "FUNCTION", "_NewImage", False
    AddQBMethod "FUNCTION", "_Pi", False
    AddQBMethod "SUB", "_PrintString", False
    AddQBMethod "FUNCTION", "_PrintWidth", False
    AddQBMethod "SUB", "_PutImage", False
    AddQBMethod "FUNCTION", "_R2D", False
    AddQBMethod "FUNCTION", "_R2G", False
    AddQBMethod "FUNCTION", "_Readbit", False
    AddQBMethod "FUNCTION", "_Red", False
    AddQBMethod "FUNCTION", "_Red32", False
    AddQBMethod "FUNCTION", "_Resetbit", False
    AddQBMethod "FUNCTION", "_Resize", False
    AddQBMethod "FUNCTION", "_ResizeHeight", False
    AddQBMethod "FUNCTION", "_ResizeWidth", False
    AddQBMethod "FUNCTION", "_RGB", False
    AddQBMethod "FUNCTION", "_RGBA", False
    AddQBMethod "FUNCTION", "_RGB32", False
    AddQBMethod "FUNCTION", "_RGBA32", False
    AddQBMethod "FUNCTION", "_Round", False
    AddQBMethod "FUNCTION", "_ScreenExists", False
    AddQBMethod "FUNCTION", "_Sech", False
    AddQBMethod "FUNCTION", "_Setbit", False
    AddQBMethod "FUNCTION", "_Shl", False
    AddQBMethod "FUNCTION", "_Shr", False
    AddQBMethod "FUNCTION", "_Sinh", False
    AddQBMethod "FUNCTION", "_Source", False
    AddQBMethod "SUB", "_Source", False
    AddQBMethod "SUB", "_SndClose", False
    AddQBMethod "FUNCTION", "_SndOpen", False
    AddQBMethod "SUB", "_SndPlay", False
    AddQBMethod "SUB", "_SndLoop", False
    AddQBMethod "SUB", "_SndPause", False
    AddQBMethod "SUB", "_SndStop", False
    AddQBMethod "SUB", "_SndVol", False
    AddQBMethod "FUNCTION", "_Strcmp", False
    AddQBMethod "FUNCTION", "_Stricmp", False
    AddQBMethod "FUNCTION", "_Tanh", False
    AddQBMethod "SUB", "_Title", False
    AddQBMethod "FUNCTION", "_Togglebit", False
    AddQBMethod "FUNCTION", "_Trim", False
    AddQBMethod "FUNCTION", "_Width", False

    ' QB 4.5 Methods
    ' ---------------------------------------------------------------------------
    AddQBMethod "FUNCTION", "Abs", False
    AddQBMethod "FUNCTION", "Asc", False
    AddQBMethod "FUNCTION", "Atn", False
    AddQBMethod "SUB", "Beep", False
    AddQBMethod "FUNCTION", "Chr$", False
    AddQBMethod "SUB", "Circle", False
    AddQBMethod "SUB", "Cls", False
    AddQBMethod "SUB", "Color", False
    AddQBMethod "FUNCTION", "Command$", False
    AddQBMethod "FUNCTION", "Cos", False
    AddQBMethod "FUNCTION", "Csrlin", False
    AddQBMethod "FUNCTION", "Cvi", False
    AddQBMethod "FUNCTION", "Cvl", False
    AddQBMethod "SUB", "Draw", False
    AddQBMethod "FUNCTION", "Exp", False
    AddQBMethod "FUNCTION", "Fix", False
    AddQBMethod "FUNCTION", "Hex$", False
    AddQBMethod "SUB", "Input", True
    AddQBMethod "FUNCTION", "InKey$", False
    AddQBMethod "FUNCTION", "InStr", False
    AddQBMethod "FUNCTION", "Int", False
    AddQBMethod "FUNCTION", "LBound", False
    AddQBMethod "FUNCTION", "Left$", False
    AddQBMethod "FUNCTION", "LCase$", False
    AddQBMethod "FUNCTION", "Len", False
    AddQBMethod "SUB", "Line", False
    AddQBMethod "SUB", "Locate", False
    AddQBMethod "FUNCTION", "Log", False
    AddQBMethod "FUNCTION", "LTrim$", False
    AddQBMethod "FUNCTION", "Mid$", False
    AddQBMethod "FUNCTION", "Mki$", False
    AddQBMethod "FUNCTION", "Mkl$", False
    AddQBMethod "FUNCTION", "Oct$", False
    AddQBMethod "SUB", "Paint", False
    AddQBMethod "FUNCTION", "Point", False
    AddQBMethod "FUNCTION", "Pos", False
    AddQBMethod "SUB", "PReset", False
    AddQBMethod "SUB", "Print", True
    AddQBMethod "SUB", "PSet", False
    AddQBMethod "SUB", "Randomize", False
    AddQBMethod "SUB", "Restore", False
    AddQBMethod "FUNCTION", "Right$", False
    AddQBMethod "FUNCTION", "RTrim$", False
    AddQBMethod "SUB", "Read", False
    AddQBMethod "FUNCTION", "Rnd", False
    AddQBMethod "SUB", "Screen", False
    AddQBMethod "FUNCTION", "Sgn", False
    AddQBMethod "FUNCTION", "Sin", False
    AddQBMethod "SUB", "Sleep", True
    AddQBMethod "FUNCTION", "Space", False
    AddQBMethod "FUNCTION", "String", False
    AddQBMethod "FUNCTION", "Sqr", False
    AddQBMethod "FUNCTION", "Str$", False
    AddQBMethod "SUB", "Swap", False
    AddQBMethod "FUNCTION", "Tan", False
    AddQBMethod "FUNCTION", "Time$", False
    AddQBMethod "FUNCTION", "Timer", False
    AddQBMethod "FUNCTION", "UBound", False
    AddQBMethod "FUNCTION", "UCase$", False
    AddQBMethod "FUNCTION", "Val", False
    AddQBMethod "FUNCTION", "Varptr", False
    AddQBMethod "SUB", "Window", False

    ' QBJS-only language features
    ' --------------------------------------------------------------------------------
    AddQBMethod "SUB", "IncludeJS", True

    ' Undocumented at present
    AddSystemType "FETCHRESPONSE", "ok:INTEGER,status:INTEGER,statusText:STRING,text:STRING"
    AddQBMethod "FUNCTION", "Fetch", True
    AddQBMethod "SUB", "Fetch", True
    AddQBMethod "FUNCTION", "FromJSON", False
    AddQBMethod "FUNCTION", "ToJSON", False

End Sub
