Option _Explicit
$Console:Only
'$ExeIcon:'./../gx/resource/gx.ico'

'1) Edit this file as needed.
'2) Compile to EXE only.
'3) In console, run:    qb2js qb2js.bas > ../qb2js.js

Const FILE = 1, TEXT = 2
Const MWARNING = 0, MERROR = 1
Const False = 0
Const True = Not False
Const PrintDataTypes = True
' Additional Debugging output - should be set to false for final build
Const PrintLineMapping = False
Const PrintTokenizedLine = False

Type Module
    name As String
    path As String
End Type

Type CodeLine
    line As Integer
    text As String
    mtype As Integer
    moduleId As Integer
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
    builtin As Integer
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

Type Container
    mode As Integer
    type As String
    label As String
    line As Integer
End Type

ReDim Shared As Module modules(0)
ReDim Shared As CodeLine lines(0)
ReDim Shared As CodeLine jsLines(0)
ReDim Shared As Method methods(0)
ReDim Shared As Method localMethods(0)
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
Dim Shared As String jsReservedWords(54)
Dim Shared modLevel As Integer
Dim Shared As String currentMethod
Dim Shared As String currentModule
Dim Shared As Integer currentModuleId
Dim Shared As Integer programMethods
Dim Shared As Integer constVarLine
Dim Shared As Integer sharedVarLine
Dim Shared As Integer staticVarLine
Dim Shared As Integer implicitVarLine
Dim Shared As String condWords(4)
Dim Shared As Integer forceSelfConvert
Dim Shared As Integer optionExplicit
Dim Shared As Integer optionExplicitArray

' Only execute the conversion from the native version if we have been passed the
' source file to convert on the command line
If Command$ <> "" Then
    QBToJS Command$, FILE, ""
    PrintJS
    System
End If

'$Include: 'qb2js.bi'

Sub QBToJS (source As String, sourceType As Integer, moduleName As String)
    condWords(1) = "IF": condWords(2) = "ELSEIF": condWords(3) = "WHILE": condWords(4) = "UNTIL"
    currentModule = moduleName

    ResetDataStructures
    If moduleName = "" Then
        ReDim As CodeLine jsLines(0)
        currentModuleId = 0
    End If

    If sourceType = FILE Then
        ReadLinesFromFile source
    Else
        ReadLinesFromText source
    End If

    FindMethods
    programMethods = UBound(methods)
    InitGX
    InitQBMethods
    InitJSReservedWords

    ' Detect whether we are converting ourself to javascript. If so:
    '   1) Place the converted code into an object named QB6Compiler
    '   2) Forgo initializing the game events and default screen
    '   3) Add an externally callable javascript function named "compile"
    '      which will allow us to call the converter from a web application
    Dim selfConvert As Integer
    Dim isGX As Integer: isGX = False
    If sourceType = FILE Then selfConvert = EndsWith(source, "qb2js.bas")
    If forceSelfConvert Then selfConvert = True

    If selfConvert Then
        AddJSLine 0, "if (typeof QB == 'undefined' && module) { QB = require('./qb-console.js').QB(); }"
        AddJSLine 0, "async function _QBCompiler() {"

    ElseIf moduleName <> "" Then
        AddJSLine 0, "async function _" + moduleName + "() {"

    ElseIf sourceType = FILE Then
        AddJSLine 0, "async function init() {"
    End If

    ' Add a placeholder lines for constants, shared variables and static method variables
    ' These lines will be appended to as shared variable declarations are encountered
    AddJSLine 0, "/* global constants: */ "
    constVarLine = UBound(jsLines)
    AddJSLine 0, "/* shared variables: */ "
    sharedVarLine = UBound(jsLines)
    AddJSLine 0, "/* static method variables: */ "
    staticVarLine = UBound(jsLines)

    AddJSLine 0, "async function main() {"

    If Not selfConvert And moduleName = "" Then AddJSLine 0, "QB.start();"

    If Not selfConvert And moduleName = "" Then
        Dim mtest As Method
        If FindMethod("GXOnGameEvent", mtest, "SUB", True) Then
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
    AddJSLine 0, "} await main();"

    ConvertMethods

    If Not selfConvert And moduleName = "" Then InitTypes

    If selfConvert Then
        AddJSLine 0, "async function compile(src) {"
        AddJSLine 0, "   await sub_QBToJS(src, TEXT, '');"
        AddJSLine 0, "   var js = '';"
        AddJSLine 0, "   for (var i=1; i<= QB.func_UBound(jsLines); i++) {"
        If PrintLineMapping Then
            AddJSLine 0, "      js += '/* ' + i + ':' + this.getSourceLine(i) + ' */ ' + QB.arrayValue(jsLines, [i]).value.text + '\n';"
        Else
            AddJSLine 0, "      js += QB.arrayValue(jsLines, [i]).value.text + '\n';"
        End If
        AddJSLine 0, "   }"
        AddJSLine 0, "   return js;"
        AddJSLine 0, "}"
        AddJSLine 0, "function getWarnings() {"
        AddJSLine 0, "   var w = [];"
        AddJSLine 0, "   for (var i=1; i <= QB.func_UBound(warnings); i++) {"
        AddJSLine 0, "      w.push({"
        AddJSLine 0, "         line: QB.arrayValue(warnings, [i]).value.line,"
        AddJSLine 0, "         text: QB.arrayValue(warnings, [i]).value.text,"
        AddJSLine 0, "         mtype: QB.arrayValue(warnings, [i]).value.mtype,"
        AddJSLine 0, "         moduleId: QB.arrayValue(warnings, [i]).value.moduleId"
        AddJSLine 0, "      });"
        AddJSLine 0, "   }"
        AddJSLine 0, "   return w;"
        AddJSLine 0, "}"
        AddJSLine 0, "function _getMethods(methods) {"
        AddJSLine 0, "   var m = [];"
        AddJSLine 0, "   for (var i=1; i <= QB.func_UBound(methods); i++) {"
        AddJSLine 0, "      var lidx = QB.arrayValue(methods, [i]).value.line;"
        AddJSLine 0, "      m.push({"
        AddJSLine 0, "         line: QB.arrayValue(lines, [lidx]).value.line,"
        AddJSLine 0, "         type: QB.arrayValue(methods, [i]).value.type,"
        AddJSLine 0, "         returnType: QB.arrayValue(methods, [i]).value.returnType,"
        AddJSLine 0, "         name: QB.arrayValue(methods, [i]).value.name,"
        AddJSLine 0, "         uname: QB.arrayValue(methods, [i]).value.uname,"
        AddJSLine 0, "         jsname: QB.arrayValue(methods, [i]).value.jsname,"
        AddJSLine 0, "         argc: QB.arrayValue(methods, [i]).value.argc,"
        AddJSLine 0, "         args: QB.arrayValue(methods, [i]).value.args"
        AddJSLine 0, "      });"
        AddJSLine 0, "   }"
        AddJSLine 0, "   return m;"
        AddJSLine 0, "}"
        AddJSLine 0, "function getMethods() { return _getMethods(methods); }"
        AddJSLine 0, "function getExportMethods() { return _getMethods(exportMethods); }"
        AddJSLine 0, "function getExportConsts() {"
        AddJSLine 0, "   var c = [];"
        AddJSLine 0, "   for (var i=1; i <= QB.func_UBound(exportConsts); i++) {"
        AddJSLine 0, "      c.push({"
        AddJSLine 0, "         name: QB.arrayValue(exportConsts, [i]).value.name,"
        AddJSLine 0, "         jsname: QB.arrayValue(exportConsts, [i]).value.jsname"
        AddJSLine 0, "      });"
        AddJSLine 0, "   }"
        AddJSLine 0, "   return c;"
        AddJSLine 0, "}"
        AddJSLine 0, "function getSourceLine(jsLine) {"
        AddJSLine 0, "   if (jsLine == 0) { return 0; }"
        AddJSLine 0, "   var line = QB.arrayValue(jsLines, [jsLine]).value.line;"
        AddJSLine 0, "   line = QB.arrayValue(lines, [line]).value.line;"
        AddJSLine 0, "   return line;"
        AddJSLine 0, "}"
        AddJSLine 0, "function getModule(id) {"
        AddJSLine 0, "   return QB.arrayValue(modules, [id]).value;"
        AddJSLine 0, "}"
        AddJSLine 0, "function setSelfConvert() { sub_SetSelfConvert(); }"
        AddJSLine 0, ""
        AddJSLine 0, "return {"
        AddJSLine 0, "   compile: compile,"
        AddJSLine 0, "   getWarnings: getWarnings,"
        AddJSLine 0, "   getMethods: getMethods,"
        AddJSLine 0, "   getExportMethods: getExportMethods,"
        AddJSLine 0, "   getExportConsts: getExportConsts,"
        AddJSLine 0, "   getSourceLine: getSourceLine,"
        AddJSLine 0, "   getModule: getModule,"
        AddJSLine 0, "   setSelfConvert: setSelfConvert,"
        AddJSLine 0, "};"
        AddJSLine 0, "}"
        AddJSLine 0, "if (typeof module != 'undefined') { module.exports.QBCompiler = _QBCompiler; }"

    ElseIf moduleName <> "" Then
        AddJSLine 0, "}"
        AddJSLine 0, "const " + moduleName + " = await _" + moduleName + "();"

    ElseIf sourceType = FILE Then
        AddJSLine 0, "};"
    End If
End Sub

Sub SetSelfConvert ()
    forceSelfConvert = True
End Sub

Sub InitTypes
    Dim As Integer i, j, jsidx
    Dim As String typestr
    typestr = "{ "

    ' Find the insertion point
    For i = 1 To UBound(jsLines)
        If jsLines(i).text = "QB.start();" Then
            jsidx = i
            Exit For
        End If
    Next i

    For i = 1 To UBound(types)
        typestr = typestr + types(i).name + ":["

        Dim idx As Integer
        idx = 0
        For j = 1 To UBound(typeVars)
            If typeVars(j).typeId = i Then
                If idx > 0 Then typestr = typestr + ", "
                typestr = typestr + "{ name: '" + typeVars(j).name + "', type: '" + typeVars(j).type + "' }"
                idx = idx + 1
            End If
        Next j

        typestr = typestr + "]"
        If i < UBound(types) Then typestr = typestr + ", "
    Next i

    typestr = typestr + "}"

    jsLines(jsidx).text = jsLines(jsidx).text + " QB.setTypeMap(" + typestr + ");"
End Sub

Sub ResetDataStructures
    ReDim As CodeLine lines(0)
    ReDim As Method methods(0)
    ReDim As QBType types(0)
    ReDim As Variable typeVars(0)
    ReDim As Variable globalVars(0)
    ReDim As Variable localVars(0)
    ReDim As String dataArray(0)
    ReDim As Label dataLabels(0)
    If modLevel = 0 Then
        ReDim As CodeLine warnings(0)
        ReDim As Method exportMethods(0)
        ReDim As Variable exportConsts(0)
        ReDim As Module modules(0)
    End If
    currentMethod = ""
    programMethods = 0
    staticVarLine = 0
    optionExplicit = False
    optionExplicitArray = False
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
    Dim ignoreMode As Integer: ignoreMode = False
    Dim As Integer i, j
    Dim indent As Integer
    Dim tempIndent As Integer
    Dim m As Method
    Dim totalIndent As Integer
    totalIndent = 1
    Dim caseCount As Integer
    Dim containers(10000) As Container ' TODO: replace hardcoded limit?
    Dim cindex As Integer
    Dim caseVar As String
    Dim currType As Integer
    Dim loopIndex As String
    Dim sfix As String
    Dim ctype As String

    ' Add a line as a placeholder for implicit variable declarations
    AddJSLine firstLine, "/* implicit variables: */ "
    implicitVarLine = UBound(jsLines)

    For i = firstLine To lastLine
        'AddWarning i, Right$("    " + Str$(cindex), 4) + "|" + lines(i).text
        indent = 0
        tempIndent = 0
        Dim l As String
        l = _Trim$(lines(i).text)
        'Handle ? shorthand for print
        If Left$(l, 1) = "?" And Mid$(l, 2, 1) <> " " Then
            l = "Print " + Mid$(l, 2)
        End If

        'Handle MID$() sub syntax
        If UCase$(Left$(l, 5)) = "MID$(" Then
            l = Left$(l, 4) + " " + Mid$(l, 5)
        End If

        ReDim As String parts(0)
        Dim c As Integer
        c = SLSplit(l, parts(), True)
        If c < 1 Then _Continue

        If PrintTokenizedLine Then AddJSLine 0, "//// " + Join(parts(), 1, -1, "|")

        Dim js As String
        js = ""
        Dim first As String
        first = UCase$(parts(1))

        sfix = FixCondition(first, parts(), 1, "")
        If sfix <> "" Then first = sfix

        If jsMode = True Then
            If Left$(first, 4) = "$END" Then
                If jsMode Then
                    jsMode = False
                    AddJSLine 0, "//-------- END JS native code block --------"
                End If
            Else
                AddJSLine i, lines(i).text
            End If

        ElseIf ignoreMode = True Then
            If Left$(first, 4) = "$END" Then ignoreMode = False

        ElseIf Left$(first, 4) = "$END" Then
            ' shrug

        ElseIf first = "$ELSE" Or first = "$ELSEIF" Then
            ignoreMode = True

        ElseIf typeMode = True Then
            If first = "END" Then
                Dim second As String: second = UCase$(parts(2))
                If second = "TYPE" Then
                    typeMode = False
                End If
            Else
                DeclareTypeVar parts(), currType, i
            End If
        Else
            CheckParen lines(i).text, i

            If first = "CONST" Then
                ReDim As String constParts(0)
                Dim As Integer constCount
                constCount = ListSplit(Join(parts(), 2, -1, " "), constParts())
                Dim constIdx As Integer
                For constIdx = 1 To constCount
                    Dim eqi As Integer
                    eqi = InStr(constParts(constIdx), "=")
                    If eqi < 1 Then
                        AddWarning i, "Invalid Const syntax: [" + constParts(constIdx) + "]"
                    Else
                        Dim As String cleft, cright
                        cleft = Left$(constParts(constIdx), eqi - 1)
                        cright = Mid$(constParts(constIdx), eqi + 1)
                        If functionName = "" Then
                            jsLines(constVarLine).text = jsLines(constVarLine).text + "const " + cleft + " = " + ConvertExpression(cright, i) + "; "
                        Else
                            js = js + "const " + cleft + " = " + ConvertExpression(cright, i) + "; "
                        End If
                        AddConst _Trim$(cleft), functionName
                    End If
                Next constIdx

            ElseIf first = "OPTION" Then
                second = UCase$(_Trim$(parts(2)))
                If second = "_EXPLICIT" Or second = "EXPLICIT" Then
                    optionExplicit = True
                ElseIf second = "_EXPLICITARRAY" Or second = "EXPLICITARRAY" Then
                    optionExplicitArray = True
                End If

            ElseIf first = "DIM" Or first = "REDIM" Or first = "STATIC" Or first = "SHARED" Then
                js = DeclareVar(parts(), i)


            ElseIf first = "SELECT" Then
                cindex = cindex + 1
                containers(cindex).type = "SELECT CASE"
                containers(cindex).line = i

                caseVar = GenJSVar
                js = "var " + caseVar + " = " + ConvertExpression(Join(parts(), 3, -1, " "), i) + "; "
                js = js + "switch (" + caseVar + ") {"
                indent = 1
                caseCount = 0

            ElseIf first = "CASE" Then
                If caseCount > 0 Then js = "break; "
                If UCase$(parts(2)) = "ELSE" Then
                    js = js + "default:"
                ElseIf UCase$(parts(2)) = "IS" Then
                    js = js + "case " + caseVar + " " + ConvertExpression(Join(parts(), 3, -1, " "), i) + ":"
                Else
                    ReDim As String caseParts(0)
                    Dim cscount As Integer
                    cscount = ListSplit(Join(parts(), 2, -1, " "), caseParts())
                    Dim ci As Integer
                    For ci = 1 To cscount
                        js = js + "case " + ConvertExpression(caseParts(ci), i) + ": "
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
                        fstep = ConvertExpression(Join(parts(), fi + 1, -1, " "), i)
                    End If
                Next fi
                Dim fvar As String
                fvar = ConvertExpression(Join(parts(), 2, eqIdx - 1, " "), i)
                Dim sval As String
                sval = ConvertExpression(Join(parts(), eqIdx + 1, toIdx - 1, " "), i)
                Dim uval As String
                uval = ConvertExpression(Join(parts(), toIdx + 1, stepIdx - 1, " "), i)

                If Left$(_Trim$(fstep), 1) = "-" Then fcond = " >= "

                cindex = cindex + 1
                containers(cindex).type = "FOR"
                containers(cindex).label = GenJSLabel
                containers(cindex).line = i

                loopIndex = GenJSVar
                js = "var " + loopIndex + " = 0; " + containers(cindex).label + ":"
                js = js + " for (" + fvar + "=" + sval + "; " + fvar + fcond + uval + "; " + fvar + "=" + fvar + " + " + fstep + ") {"
                js = js + " if (QB.halted()) { return; } "
                js = js + loopIndex + "++; "
                js = js + "  if (" + loopIndex + " % 100 == 0) { await QB.autoLimit(); }"

                indent = 1

            ElseIf first = "IF" Then
                cindex = cindex + 1
                containers(cindex).type = "IF"
                containers(cindex).line = i

                Dim thenIndex As Integer
                For thenIndex = 2 To UBound(parts)
                    If UCase$(parts(thenIndex)) = "THEN" Then Exit For
                Next thenIndex

                js = "if (" + ConvertExpression(Join(parts(), 2, thenIndex - 1, " "), i) + ") {"
                indent = 1

            ElseIf first = "ELSEIF" Then
                js = "} else if (" + ConvertExpression(Join(parts(), 2, UBound(parts) - 1, " "), i) + ") {"
                tempIndent = -1

            ElseIf first = "ELSE" Then
                js = "} else {"
                tempIndent = -1

            ElseIf first = "NEXT" Then
                If c > 1 Then
                    ReDim nparts(0) As String
                    Dim npcount As Integer
                    Dim npi As Integer
                    npcount = ListSplit(Join(parts(), 2, -1, " "), nparts())
                    For npi = 1 To npcount
                        If CheckBlockEnd(containers(), cindex, first, i) Then
                            js = js + "} "
                            indent = -1
                            cindex = cindex - 1
                        Else
                            Exit For
                        End If
                    Next npi
                Else
                    If CheckBlockEnd(containers(), cindex, first, i) Then
                        js = js + "}"
                        indent = -1
                        cindex = cindex - 1
                    End If
                End If

            ElseIf first = "END" Or first = "ENDIF" Then
                If UBound(parts) = 1 And first = "END" Then
                    js = "QB.halt(); return;"
                ElseIf UBound(parts) = 1 And first = "ENDIF" Then
                    If CheckBlockEnd(containers(), cindex, "ENDIF", i) Then
                        js = js + "}"
                        indent = -1
                        cindex = cindex - 1
                    End If
                Else
                    second = UCase$(parts(2))
                    If second = "IF" Then
                        If CheckBlockEnd(containers(), cindex, "END IF", i) Then
                            js = js + "}"
                            indent = -1
                            cindex = cindex - 1
                        End If
                    ElseIf second = "SELECT" Then
                        If CheckBlockEnd(containers(), cindex, "END SELECT", i) Then
                            js = "break;" + " }"
                            indent = -1
                            cindex = cindex - 1
                        End If
                    Else
                        AddError i, "Syntax error after END"
                    End If
                End If

            ElseIf first = "SYSTEM" Then
                js = "QB.halt(); return;"

            ElseIf first = "$NOPREFIX" Then
                ' nothing to do here, keywords prefixes are optional

            ElseIf first = "$IF" Then
                If UBound(parts) > 1 Then
                    If UCase$(parts(2)) = "JAVASCRIPT" Then
                        jsMode = True
                        js = "//-------- BEGIN JS native code block --------"
                    ElseIf UCase$(parts(2)) <> "WEB" Then
                        ignoreMode = True
                    End If
                End If

            ElseIf first = "DO" Then
                cindex = cindex + 1
                containers(cindex).label = GenJSLabel
                containers(cindex).type = "DO"
                containers(cindex).line = i

                loopIndex = GenJSVar
                js = "var " + loopIndex + " = 0; " + containers(cindex).label + ":"

                If UBound(parts) > 1 Then
                    sfix = FixCondition(UCase$(parts(2)), parts(), 2, "DO ")

                    If UCase$(parts(2)) = "WHILE" Then
                        js = js + " while (" + ConvertExpression(Join(parts(), 3, -1, " "), i) + ") {"
                    Else
                        js = js + " while (!(" + ConvertExpression(Join(parts(), 3, -1, " "), i) + ")) {"
                    End If
                    containers(cindex).mode = 1
                Else
                    js = js + " do {"
                    containers(cindex).mode = 2
                End If
                indent = 1
                js = js + " if (QB.halted()) { return; }"
                js = js + loopIndex + "++; "
                js = js + "  if (" + loopIndex + " % 100 == 0) { await QB.autoLimit(); }"


            ElseIf first = "WHILE" Then
                cindex = cindex + 1
                containers(cindex).label = GenJSLabel
                containers(cindex).type = "WHILE"
                containers(cindex).line = i

                loopIndex = GenJSVar
                js = "var " + loopIndex + " = 0; " + containers(cindex).label + ":"
                js = js + " while (" + ConvertExpression(Join(parts(), 2, -1, " "), i) + ") {"
                js = js + " if (QB.halted()) { return; }"
                js = js + loopIndex + "++; "
                js = js + "  if (" + loopIndex + " % 100 == 0) { await QB.autoLimit(); }"

                indent = 1

            ElseIf first = "WEND" Then
                'ctype = ""
                'If cindex > 0 Then ctype = containers(cindex).type
                'If ctype <> "WHILE" Then
                '    AddWarning i, "WEND without WHILE"
                'Else
                If CheckBlockEnd(containers(), cindex, first, i) Then
                    js = "}"
                    cindex = cindex - 1
                    indent = -1
                End If

            ElseIf first = "LOOP" Then
                If CheckBlockEnd(containers(), cindex, first, i) Then
                    If containers(cindex).mode = 1 Then
                        js = "}"
                    Else
                        sfix = FixCondition(UCase$(parts(2)), parts(), 2, "LOOP ")

                        js = "} while (("
                        If UBound(parts) < 2 Then
                            js = js + "1));"
                        Else
                            If UCase$(parts(2)) = "UNTIL" Then js = "} while (!("
                            js = js + ConvertExpression(Join(parts(), 3, UBound(parts), " "), i) + "))"
                        End If
                    End If
                    cindex = cindex - 1
                    indent = -1
                End If

            ElseIf first = "_CONTINUE" Or first = "CONTINUE" Then
                js = "continue;"

            ElseIf first = "EXIT" Then
                second = ""
                If UBound(parts) > 1 Then second = UCase$(parts(2))

                If second = "FUNCTION" Then
                    js = "return " + RemoveSuffix(functionName) + ";"

                ElseIf second = "SUB" Then
                    js = "return;"

                ElseIf second = "DO" Or second = "WHILE" Or second = "FOR" Then
                    Dim lli As Integer
                    For lli = cindex To 0 Step -1
                        If lli > 0 Then
                            If containers(lli).type = second Then Exit For
                        End If
                    Next lli
                    If lli > 0 Then
                        js = "break " + containers(lli).label + ";"
                    Else
                        AddError i, "EXIT " + second + " without " + second
                    End If

                Else
                    AddError i, "Syntax error after EXIT"
                End If

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

                If FindMethod(subname, m, "SUB", True) Then
                    Dim subargs As String
                    If subname = subline Then
                        subargs = ""
                    Else
                        subargs = Mid$(subline, Len(subname) + 2, Len(subline) - Len(subname) - 2)
                    End If
                    js = ConvertSub(m, subargs, i)
                Else
                    AddWarning i, "Missing Sub [" + subname + "], ignoring Call command"
                End If

            ElseIf c > 2 Or first = "LET" Then
                Dim assignment As Integer
                assignment = 0
                For j = 1 To UBound(parts)
                    If parts(j) = "=" Then
                        If j > 1 Then
                            If UCase$(parts(j - 1)) = "_CLIPBOARD$" Then Exit For
                            If UCase$(parts(j - 1)) = "_CLIPBOARDIMAGE" Then Exit For
                            If UCase$(parts(1)) = "MID$" Then Exit For
                        End If

                        assignment = j
                        Exit For
                    End If
                Next j

                Dim asnVarIndex
                asnVarIndex = 1
                If first = "LET" Then asnVarIndex = 2

                If assignment > 0 Then
                    ' This is a variable assignment
                    Dim As String leftSide, rightSide
                    leftSide = _Trim$(Join(parts(), asnVarIndex, assignment - 1, " "))
                    rightSide = _Trim$(Join(parts(), assignment + 1, -1, " "))
                    js = RemoveSuffix(ConvertExpression(leftSide, i)) + " = " + ConvertExpression(rightSide, i) + ";"
                Else
                    ' Check to see if there was no space left between the sub name and initial paren
                    Dim parendx As Integer
                    parendx = InStr(parts(1), "(")
                    If parendx > 0 Then
                        ' If so, resplit the line with a space between
                        Dim As String sname, arg1
                        sname = Mid$(parts(1), 1, parendx - 1)
                        arg1 = Mid$(parts(1), parendx)
                        c = SLSplit(sname + " " + arg1 + Join(parts(), 2, -1, " "), parts(), True)
                    End If

                    If FindMethod(parts(1), m, "SUB", True) Then
                        js = ConvertSub(m, Join(parts(), 2, -1, " "), i)
                    Else
                        js = "// " + l
                        AddWarning i, "Missing or unsupported method: '" + parts(1) + "' - ignoring line"
                    End If
                End If


            Else
                If FindMethod(parts(1), m, "SUB", True) Then
                    js = ConvertSub(m, Join(parts(), 2, -1, " "), i)
                Else
                    js = "// " + l
                    If first = "GOTO" Then
                        AddWarning i, "Missing or unsupported method: '<a href='https://xkcd.com/292/' target='_blank'>GOTO</a>'"
                    Else
                        AddWarning i, "Missing or unsupported method: '" + parts(1) + "' - ignoring line"
                    End If
                End If
            End If

            If (indent < 0) Then totalIndent = totalIndent + indent
            If js <> "" Then AddJSLine i, LPad("", " ", (totalIndent + tempIndent) * 3) + js
            If (indent > 0) Then totalIndent = totalIndent + indent

        End If

    Next i

    If cindex > 0 Then
        AddError containers(cindex).line, containers(cindex).type + " without " + EndPhraseFor(containers(cindex).type)
    End If

End Sub

Function IsValidVarname (varname As String)
    Dim As String vname, s
    Dim As Integer i, c, valid
    valid = True
    vname = _Trim$(varname)
    ' Check for reserved words
    If vname = "true" Or vname = "false" Then IsValidVarname = False: Exit Function
    vname = UCase$(RemoveSuffix(vname))
    If vname = "TO" Or vname = "UNDEFINED" Then
        IsValidVarname = False
        Exit Function
    End If
    ' Check for function or sub references
    ' TODO: This check should be removed after a proper method reference is implemented in the language
    If Mid$(vname, 1, 4) = "SUB_" Or Mid$(vname, 1, 5) = "FUNC_" Then
        IsValidVarname = False
        Exit Function
    End If
    ' Check to see if the name contains valid characters
    c = Asc(Mid$(vname, 1, 1))
    If (c >= 65 And c <= 90) Or c = 95 Then
        For i = 2 To Len(vname)
            c = Asc(Mid$(vname, i, 1))
            If (c >= 65 And c <= 90) Or (c >= 48 And c <= 57) Or c = 95 Then
                ' valid character
            Else
                valid = False
                Exit For
            End If
        Next i
    Else
        valid = False
    End If
    IsValidVarname = valid
End Function

Function BeginPhraseFor$ (endPhrase As String)
    Dim bp As String
    Select Case endPhrase
        Case "NEXT": bp = "FOR"
        Case "LOOP": bp = "DO"
        Case "WEND": bp = "WHILE"
        Case "END IF", "ENDIF": bp = "IF"
        Case "END SELECT": bp = "SELECT CASE"
    End Select
    BeginPhraseFor = bp
End Function

Function EndPhraseFor$ (beginPhrase As String)
    Dim ep As String
    Select Case beginPhrase
        Case "FOR": ep = "NEXT"
        Case "DO": ep = "LOOP"
        Case "WHILE": ep = "WEND"
        Case "IF": ep = "END IF"
        Case "SELECT CASE": ep = "END SELECT"
    End Select
    EndPhraseFor = ep
End Function

Function CheckBlockEnd (cstack() As Container, cindex As Integer, endPhrase As String, lineNumber As Integer)
    Dim As String ctype, beginPhrase
    Dim success As Integer
    success = True
    beginPhrase = BeginPhraseFor(endPhrase)
    If cindex > 0 Then ctype = cstack(cindex).type
    If ctype <> beginPhrase Then
        AddError lineNumber, endPhrase + " without " + beginPhrase
        success = False
    End If

    CheckBlockEnd = success
End Function

Function FixCondition$ (word As String, parts() As String, idx As Integer, prefix As String)
    ' The fact that we are doing this probably means we need to improve the initial "tokenizer"
    ' Is this is a condition keyword with no space between the keyword and the open paren?
    FixCondition = ""
    Dim As Integer c, j
    For j = 0 To UBound(condWords)
        If InStr(word, condWords(j) + "(") = 1 Then
            ' If so, resplit the line with a space between
            Dim As String a1
            a1 = Mid$(parts(idx), Len(condWords(j)) + 1)
            c = SLSplit(prefix + condWords(j) + " " + a1 + Join(parts(), idx + 1, -1, " "), parts(), True)
            FixCondition = condWords(j)
            Exit For
        End If
    Next j
End Function

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

    If FindMethod(parts(1), es, "SUB", False) Then
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

    If FindMethod(parts(1), ef, "FUNCTION", False) Then
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
        ' TODO: this is not actually being reported - warnings seem to be cleared after module compilation is complete
        AddWarning lineIndex, "Invalid export [" + parts(1) + "].  Exported items must be a Sub, Function or Const in the current module."
    End If

End Sub

Sub RegisterExport (exportName As String, exportedItem As String)
    Dim esize
    esize = UBound(exportLines) + 1
    ReDim _Preserve exportLines(esize) As String
    exportLines(esize) = exportName + ": " + exportedItem + ","
End Sub

Function ConvertSub$ (m As Method, args As String, lineNumber As Integer)
    ' This actually converts the parameters passed to the sub
    Dim js As String

    ' Let's handle the weirdo Line Input command which has a space;
    ' _Clipboard$ and _ClipboardImage SUBs too.
    ' TODO: this may have issues if used in combination with Input
    If m.name = "Line" Or m.name = "_Clipboard$" Or m.name = "_ClipboardImage" Then
        Dim parts(0) As String
        Dim plen As Integer
        plen = SLSplit(args, parts(), False)
        If plen > 0 Then
            If UCase$(parts(1)) = "INPUT" Then
                m.name = "Line Input"
                m.jsname = "QB.sub_LineInput"
                args = Join(parts(), 2, -1, " ")
                m.sync = True
            ElseIf parts(1) = "=" Then
                Select Case m.name
                    Case "_Clipboard$"
                        m.jsname = "QB.sub__Clipboard"
                    Case "_ClipboardImage"
                        m.jsname = "QB.sub__ClipboardImage"
                End Select
                args = Join(parts(), 2, -1, " ")
            End If
        End If
    End If

    ' Handle special cases for methods which take ranges and optional parameters
    If m.name = "Line" Then
        js = CallMethod(m) + "(" + ConvertLine(args, lineNumber) + ");"

    ElseIf m.name = "Cls" Then
        js = CallMethod(m) + "(" + ConvertCls(args, lineNumber) + ");"

    ElseIf m.name = "Open" Then
        js = CallMethod(m) + "(" + ConvertOpen(args, lineNumber) + ");"

    ElseIf m.name = "Close" Then
        js = CallMethod(m) + "(" + Replace(args, "#", "") + ");"

        'ElseIf m.name = "Get" Then
        '    js = ConvertGet(m, args, lineNumber)

    ElseIf m.name = "Input" Then
        If StartsWith(_Trim$(args), "#") Then
            m.jsname = "QB.sub_InputFromFile"
            js = ConvertFileInput(m, args, lineNumber)
        Else
            m.jsname = "QB.sub_Input"
            js = ConvertInput(m, args, lineNumber)
        End If

    ElseIf m.name = "Line Input" Then
        If StartsWith(_Trim$(args), "#") Then
            m.jsname = "QB.sub_LineInputFromFile"
            js = ConvertFileLineInput(m, args, lineNumber)
            m.name = "Line"
            m.jsname = "QB.sub_Line"
        Else
            js = ConvertInput(m, args, lineNumber)
            m.name = "Line"
            m.jsname = "QB.sub_Line"
            m.sync = False
        End If

    ElseIf m.name = "Mid$" Then
        js = ConvertSubMid(m, args, lineNumber)

    ElseIf m.name = "Name" Then
        js = CallMethod(m) + "(" + ConvertSubName(args, lineNumber) + ");"

    ElseIf m.name = "PSet" Or m.name = "Circle" Or m.name = "PReset" Or m.name = "Paint" Then
        js = CallMethod(m) + "(" + ConvertPSet(args, lineNumber) + ");"

    ElseIf m.name = "?" Or m.name = "Print" Then
        'js = CallMethod(m) + "(" + ConvertPrint(args, lineNumber) + ");"
        m.name = "Print"
        js = ConvertPrint(m, args, lineNumber)

    ElseIf m.name = "Put" Or m.name = "Get" Then
        js = ConvertPut(m, args, lineNumber)

    ElseIf m.name = "Randomize" Then
        js = ConvertRandomize(m, args, lineNumber)

    ElseIf m.name = "Read" Then
        js = ConvertRead(m, args, lineNumber)

    ElseIf m.name = "Restore" Then
        js = CallMethod(m) + "('" + UCase$(args) + "');"

    ElseIf m.name = "Swap" Then
        js = ConvertSwap(m, args, lineNumber)

    ElseIf m.name = "Window" Then
        js = CallMethod(m) + "(" + ConvertWindow(args, lineNumber) + ");"

    ElseIf m.name = "Write" Then
        js = ConvertWrite(m, args, lineNumber)

    ElseIf m.name = "_PrintString" Or m.name = "PrintString" Then
        js = CallMethod(m) + "(" + ConvertPrintString(args, lineNumber) + ");"

    ElseIf m.name = "_PutImage" Or m.name = "PutImage" Then
        js = CallMethod(m) + "(" + ConvertPutImage(args, lineNumber) + ");"

    ElseIf m.name = "_FullScreen" Or m.name = "FullScreen" Then
        js = CallMethod(m) + "(" + ConvertFullScreen(args) + ");"

    Else
        js = CallMethod(m) + "(" + ConvertMethodParams(args, lineNumber) + ");"
    End If

    ConvertSub = js
End Function

Function ConvertPut$ (m As Method, args As String, lineNumber As Integer)
    ReDim parts(0) As String
    Dim argc As Integer
    argc = ListSplit(args, parts())

    If argc < 3 Then
        AddWarning lineNumber, "Syntax error"
        Exit Function
    End If

    Dim As String fh, position, vname
    fh = _Trim$(parts(1))
    position = _Trim$(parts(2))
    vname = _Trim$(parts(3))
    vname = Replace(vname, "()", "")

    fh = Replace(fh, "#", "")
    If position = "" Then position = "undefined"

    Dim v As Variable
    If Not FindVariable(vname, v, False) Then
        If Not FindVariable(vname, v, True) Then
            AddWarning lineNumber, "Invalid variable '" + vname + "'"
            Exit Function
        End If
    End If

    If m.name = "Put" Then
        ConvertPut = CallMethod(m) + "(" + fh + ", " + position + ", '" + v.type + "', " + v.jsname + ");"
    Else ' Get
        Dim As String js, varobj
        varobj = GenJSVar
        js = "var " + varobj + " = { value: " + v.jsname + " }; "
        js = js + CallMethod(m) + "(" + fh + ", " + position + ", '" + v.type + "', " + varobj + "); "
        js = js + v.jsname + " = " + varobj + ".value;"
        ConvertPut = js
    End If

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
        If arg = "_OFF" Or arg = "OFF" Then
            mode = "QB.OFF"
        ElseIf arg = "_STRETCH" Or arg = "STRETCH" Then
            mode = "QB.STRETCH"
        ElseIf arg = "_SQUAREPIXELS" Or arg = "SQUAREPIXELS" Then
            mode = "QB.SQUAREPIXELS"
        End If
    End If
    If argc > 1 Then
        If UCase$(parts(2)) = "_SMOOTH" Or UCase$(parts(2)) = "SMOOTH" Then doSmooth = "true"
    End If

    ConvertFullScreen = mode + ", " + doSmooth
End Function

Function ConvertOpen$ (args As String, lineNumber As Integer)
    Dim argc As Integer
    ReDim parts(0) As String
    Dim As String filename, mode, handle
    argc = SLSplit(args, parts(), False)
    If argc < 5 Then
        AddWarning lineNumber, "Syntax Error in Open statement"
        Exit Function
    End If

    If UCase$(parts(2)) <> "FOR" Then
        AddWarning lineNumber, "Syntax Error in Open statement"
        Exit Function
    End If

    If UCase$(parts(4)) <> "AS" Then
        AddWarning lineNumber, "Syntax Error in Open statement"
        Exit Function
    End If

    filename = parts(1)
    mode = "QB." + UCase$(parts(3))
    handle = Replace(parts(5), "#", "")

    ConvertOpen = filename + ", " + mode + ", " + handle
End Function

Function ConvertLine$ (args As String, lineNumber As Integer)
    Dim argc As Integer
    ReDim parts(0) As String
    Dim As String coord, lcolor, mode, style
    coord = ConvertCoordParam("", True, lineNumber)
    lcolor = "undefined"
    mode = "undefined"
    style = "undefined"

    argc = ListSplit(args, parts())
    If argc >= 1 Then coord = ConvertCoordParam(parts(1), True, lineNumber)
    If argc >= 2 And _Trim$(parts(2)) <> "" Then lcolor = ConvertExpression(parts(2), lineNumber)
    If argc >= 3 And _Trim$(parts(3)) <> "" Then mode = "'" + UCase$(_Trim$(parts(3))) + "'"
    If argc >= 4 And _Trim$(parts(4)) <> "" Then style = ConvertExpression(parts(4), lineNumber)

    ConvertLine = coord + ", " + lcolor + ", " + mode + ", " + style
End Function

Function ConvertPutImage$ (args As String, lineNumber As Integer)
    Dim argc As Integer
    ReDim parts(0) As String
    Dim As String startCoord, sourceImage, destImage, destCoord, doSmooth
    startCoord = ConvertCoordParam("", True, lineNumber)
    destCoord = ConvertCoordParam("", True, lineNumber)
    sourceImage = "undefined"
    destImage = "undefined"

    doSmooth = "false"
    If EndsWith(_Trim$(UCase$(args)), "_SMOOTH") Or EndsWith(_Trim$(UCase$(args)), "SMOOTH") Then
        doSmooth = "true"
        args = Left$(_Trim$(args), Len(_Trim$(args)) - 7)
    End If

    argc = ListSplit(args, parts())
    If argc >= 1 Then startCoord = ConvertCoordParam(parts(1), True, lineNumber)
    If argc >= 2 Then sourceImage = ConvertExpression(parts(2), lineNumber)
    If argc >= 3 Then
        If _Trim$(parts(3)) <> "" Then destImage = ConvertExpression(parts(3), lineNumber)
    End If
    If argc >= 4 Then destCoord = ConvertCoordParam(parts(4), True, lineNumber)
    If argc >= 5 Then
        If _Trim$(UCase$(parts(5))) = "_SMOOTH" Or _Trim$(UCase$(parts(5))) = "SMOOTH" Then doSmooth = "true"
    End If

    ConvertPutImage = startCoord + ", " + sourceImage + ", " + destImage + ", " + destCoord + ", " + doSmooth
End Function

Function ConvertWindow$ (args As String, lineNumber As Integer)
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
    startCord = ConvertExpression(startCord, lineNumber)
    If (_Trim$(startCord) = "") Then startCord = "undefined, undefined"

    idx = InStr(endCord, "(")
    endCord = Right$(endCord, Len(endCord) - idx)
    idx = _InStrRev(endCord, ")")
    endCord = Left$(endCord, idx - 1)
    endCord = ConvertExpression(endCord, lineNumber)

    ConvertWindow = invertFlag + ", " + startCord + ", " + endCord
End Function

Function ConvertCls$ (args As String, lineNumber As Integer)
    Dim argc As Integer
    ReDim parts(0) As String
    argc = ListSplit(args, parts())

    Dim As String method, bgcolor
    method = "undefined"
    bgcolor = "undefined"

    If argc >= 1 Then
        If _Trim$(parts(1)) <> "" Then method = ConvertExpression(parts(1), lineNumber)
    End If
    If argc >= 2 Then bgcolor = ConvertExpression(parts(2), lineNumber)

    ConvertCls$ = method + ", " + bgcolor
End Function

Function ConvertSubMid$ (m As Method, args As String, lineNumber As Integer)
    Dim js As String
    Dim midArgs(0) As String

    Dim idx As Integer
    idx = InStr(args, "(")
    args = Right$(args, Len(args) - idx)
    idx = _InStrRev(args, ")")
    args = Left$(args, idx-1) + Right$(args, Len(args) - idx)
    args = Replace(args, "=", ",")

    Dim argc As Integer
    argc = ListSplit(args, midArgs())

    Dim var1 As String
    Dim var2 As String
    Dim startPosition As String
    Dim length As String

    If argc = 4 Then
        var1 = ConvertExpression(midArgs(1), lineNumber)
        startPosition = ConvertExpression(midArgs(2), lineNumber)
        length = ConvertExpression(midArgs(3), lineNumber)
        var2 = ConvertExpression(midArgs(4), lineNumber)
    ElseIf argc = 3 Then
        var1 = ConvertExpression(midArgs(1), lineNumber)
        startPosition = ConvertExpression(midArgs(2), lineNumber)
        length = "undefined"
        var2 = ConvertExpression(midArgs(3), lineNumber)
    Else
        AddError lineNumber, "Syntax error; expected MID$(var1$, start%[, length%]) = var2$"
        Exit Function
    End If
    js = var1 + " = " + CallMethod(m) + "(" + var1 + "," + startPosition + "," + length + "," + var2 + "); "
    ConvertSubMid = js
End Function

Function ConvertSubName$ (args As String, lineNumber As Integer)
    Dim argc As Integer
    ReDim parts(0) As String
    Dim asIndex As Integer

    argc = SLSplit2(args, parts())

    Dim i As Integer
    For i = 1 To argc
        If UCase$(parts(i)) = "AS" Then asIndex = i
    Next i

    If asIndex = 0 Or asIndex = argc Then
        AddWarning lineNumber, "Syntax Error"
        ConvertSubName$ = "undefined, undefined"
    Else
        Dim As String oldname, newname
        oldname = Join(parts(), 1, asIndex - 1, " ")
        newname = Join(parts(), asIndex + 1, -1, " ")
        ConvertSubName$ = ConvertExpression(oldname, lineNumber) + ", " + ConvertExpression(newname, lineNumber)
    End If
End Function

Function ConvertRandomize$ (m As Method, args As String, lineNumber As Integer)
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
        End If
        theseed = ConvertExpression(theseed, lineNumber)
    End If
    ConvertRandomize = CallMethod(m) + "(" + uusing + ", " + theseed + ")"
End Function

Function ConvertRead$ (m As Method, args As String, lineNumber As Integer)
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
    js = "var " + vname + " = new Array(" + Str$(UBound(vars)) + "); " '+ LF
    js = js + CallMethod(m) + "(" + vname + "); " '+ LF
    For i = 1 To UBound(vars)
        js = js + ConvertExpression(vars(i), lineNumber) + " = " + vname + "[" + Str$(i - 1) + "]; " '+ LF
    Next i
    ConvertRead$ = js
End Function

Function ConvertCoordParam$ (param As String, hasEndCoord As Integer, lineNumber As Integer)
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

        If UCase$(Left$(_Trim$(startCoord), 4)) = "STEP" Then
            sstep = "true"
        End If
        If UCase$(Left$(_Trim$(endCoord), 4)) = "STEP" Then
            estep = "true"
        End If

        idx = InStr(startCoord, "(")
        startCoord = Right$(startCoord, Len(startCoord) - idx)
        idx = _InStrRev(startCoord, ")")
        startCoord = Left$(startCoord, idx - 1)
        startCoord = ConvertExpression(startCoord, lineNumber)
        If (_Trim$(startCoord) = "") Then startCoord = "undefined, undefined"

        If hasEndCoord Then
            idx = InStr(endCoord, "(")
            endCoord = Right$(endCoord, Len(endCoord) - idx)
            idx = _InStrRev(endCoord, ")")
            endCoord = Left$(endCoord, idx - 1)
            endCoord = ConvertExpression(endCoord, lineNumber)
            If (_Trim$(endCoord) = "") Then endCoord = "undefined, undefined"

            ConvertCoordParam$ = sstep + ", " + startCoord + ", " + estep + ", " + endCoord
        Else
            ConvertCoordParam$ = sstep + ", " + startCoord
        End If

    End If
End Function

Function ConvertPSet$ (args As String, lineNumber As Integer)
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
    firstParam = ConvertExpression(firstParam, lineNumber)
    If (_Trim$(firstParam) = "") Then firstParam = "undefined, undefined"

    theRest = ConvertExpression(theRest, lineNumber)

    ConvertPSet = sstep + ", " + firstParam + ", " + theRest
End Function

Function ConvertPrint$ (m As Method, args As String, lineNumber As Integer)
    Dim fh As String
    Dim pcount As Integer
    Dim startIdx As Integer
    Dim parts(0) As String
    pcount = PrintSplit(args, parts())
    startIdx = 1

    m.jsname = "QB.sub_Print"
    If pcount > 0 Then
        If StartsWith(_Trim$(parts(1)), "#") Then
            fh = Replace(_Trim$(parts(1)), "#", "")
            m.jsname = "QB.sub_PrintToFile"
            startIdx = 3
            If _Trim$(parts(2)) <> "," Then
                AddWarning lineNumber, "Syntax error, missing expected ','"
                startIdx = 2
            End If
        End If
    End If

    Dim js As String
    js = CallMethod(m) + "("

    If fh <> "" Then
        js = js + fh + ", "
    End If

    js = js + "["
    Dim i As Integer
    For i = startIdx To pcount
        If i > startIdx Then js = js + ","

        If parts(i) = "," Then
            js = js + "QB.COLUMN_ADVANCE"

        ElseIf parts(i) = ";" Then
            js = js + "QB.PREVENT_NEWLINE"

        Else
            js = js + ConvertExpression(parts(i), lineNumber)
        End If
    Next i

    ConvertPrint = js + "]);"
End Function

Function ConvertWrite$ (m As Method, args As String, lineNumber As Integer)
    Dim fh As String
    Dim pcount As Integer
    Dim startIdx As Integer
    Dim parts(0) As String
    pcount = ListSplit(args, parts())
    startIdx = 1

    m.jsname = "QB.sub_Write"
    If pcount > 0 Then
        If StartsWith(_Trim$(parts(1)), "#") Then
            fh = Replace(_Trim$(parts(1)), "#", "")
            m.jsname = "QB.sub_WriteToFile"
            startIdx = 2
        End If
    End If

    Dim js As String
    js = CallMethod(m) + "("

    If fh <> "" Then
        js = js + fh + ", "
    End If

    js = js + "["
    Dim i As Integer
    For i = startIdx To pcount
        If i > startIdx Then js = js + ","

        Dim t As String
        t = "UNKNOWN"
        Dim v As Variable
        Dim isVar As Integer
        isVar = FindVariable(parts(i), v, False)
        If isVar Then
            t = v.type
        ElseIf StartsWith(parts(i), Chr$(34)) Then
            t = "STRING"
        End If

        If isVar Then
            js = js + "{ type:'" + t + "', value:" + _Trim$(ConvertExpression(parts(i), lineNumber)) + "}"
        Else
            js = js + "{ type:'" + t + "', value:'" + Replace(_Trim$(ConvertExpression(parts(i), lineNumber)), "'", "\'") + "'}"
        End If
    Next i

    ConvertWrite = js + "]);"
End Function

Function ConvertPrintString$ (args As String, lineNumber As Integer)
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

    ConvertPrintString = ConvertExpression(firstParam, lineNumber) + ", " + ConvertExpression(theRest, lineNumber)
End Function

Function ConvertFileLineInput$ (m As Method, args As String, lineNumber As Integer)
    Dim js As String
    Dim fh As String
    Dim vname As String
    Dim retvar As String
    Dim pcount As Integer
    ReDim parts(0) As String

    pcount = ListSplit(args, parts())
    If pcount <> 2 Then
        AddWarning lineNumber, "Syntax error"
        ConvertFileLineInput = ""
        Exit Function
    End If

    fh = Replace(_Trim$(parts(1)), "#", "")
    retvar = _Trim$(parts(2))

    vname = GenJSVar
    js = "var " + vname + " = new Array(1); "
    js = js + CallMethod(m) + "(" + fh + ", " + vname + "); "
    js = js + ConvertExpression(retvar, lineNumber) + " = " + vname + "[0]; "

    ConvertFileLineInput = js
End Function

Function ConvertInput$ (m As Method, args As String, lineNumber As Integer)
    Dim js As String
    Dim vname As String
    Dim pcount As Integer
    ReDim parts(0) As String
    ReDim vars(0) As String
    Dim varIndex As Integer: varIndex = 1
    Dim preventNewline As String: preventNewline = "false"
    Dim addQuestionPrompt As String: addQuestionPrompt = "false"
    Dim promptStr As String: promptStr = "undefined"
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
            promptStr = p
        ElseIf p <> "," Then
            vcount = UBound(vars) + 1
            ReDim _Preserve As String vars(vcount)
            vars(vcount) = p
        End If
    Next i

    vname = GenJSVar
    js = "var " + vname + " = new Array(" + Str$(UBound(vars)) + "); "
    js = js + CallMethod(m) + "(" + vname + ", " + preventNewline + ", " + addQuestionPrompt + ", " + promptStr + "); "
    For i = 1 To UBound(vars)
        ' Convert to appropriate variable type on assignment
        Dim vartype As String
        vartype = GetVarType(vars(i))
        If vartype = "_BIT" Or vartype = "_BYTE" Or vartype = "INTEGER" Or vartype = "LONG" Or vartype = "_INTEGER64" Or vartype = "_OFFSET" Or _
           vartype = "_UNSIGNED _BIT" Or vartype = "_UNSIGNED _BYTE" Or vartype = "_UNSIGNED INTEGER" Or vartype = "_UNSIGNED LONG" Or vartype = "_UNSIGNED _INTEGER64" Or vartype = "_UNSIGNED _OFFSET" Then
            js = js + ConvertExpression(vars(i), lineNumber) + " = QB.toInteger(" + vname + "[" + Str$(i - 1) + "]); "
        ElseIf vartype = "SINGLE" Or vartype = "DOUBLE" Or vartype = "_FLOAT" Then
            js = js + ConvertExpression(vars(i), lineNumber) + " = QB.toFloat(" + vname + "[" + Str$(i - 1) + "]); "
        Else
            js = js + ConvertExpression(vars(i), lineNumber) + " = " + vname + "[" + Str$(i - 1) + "]; "
        End If
        'End If
    Next i
    ConvertInput = js
End Function

Function ConvertFileInput$ (m As Method, args As String, lineNumber As Integer)
    Dim js As String
    Dim fh As String
    Dim vname As String
    Dim retvar As String
    Dim pcount As Integer
    ReDim parts(0) As String

    pcount = ListSplit(args, parts())
    If pcount < 2 Then
        AddWarning lineNumber, "Syntax error"
        ConvertFileInput = ""
        Exit Function
    End If

    fh = Replace(_Trim$(parts(1)), "#", "")
    retvar = _Trim$(parts(2))

    vname = GenJSVar
    js = "var " + vname + " = new Array(" + Str$(UBound(parts) - 1) + "); "
    js = js + CallMethod(m) + "(" + fh + ", " + vname + "); "

    Dim i As Integer
    For i = 2 To UBound(parts)
        ' Convert to appropriate variable type on assignment
        Dim vartype As String
        vartype = GetVarType(parts(i))
        If vartype = "_BIT" Or vartype = "_BYTE" Or vartype = "INTEGER" Or vartype = "LONG" Or vartype = "_INTEGER64" Or vartype = "_OFFSET" Or _
           vartype = "_UNSIGNED _BIT" Or vartype = "_UNSIGNED _BYTE" Or vartype = "_UNSIGNED INTEGER" Or vartype = "_UNSIGNED LONG" Or vartype = "_UNSIGNED _INTEGER64" Or vartype = "_UNSIGNED _OFFSET" Then
            js = js + ConvertExpression(parts(i), lineNumber) + " = QB.toInteger(" + vname + "[" + Str$(i - 2) + "]); "
        ElseIf vartype = "SINGLE" Or vartype = "DOUBLE" Or vartype = "_FLOAT" Then
            js = js + ConvertExpression(parts(i), lineNumber) + " = QB.toFloat(" + vname + "[" + Str$(i - 2) + "]); "
        Else
            js = js + ConvertExpression(parts(i), lineNumber) + " = " + vname + "[" + Str$(i - 2) + "]; "
        End If
    Next i

    ConvertFileInput = js
End Function


Function GetVarType$ (vname As String)
    Dim vartype As String
    vartype = "UNKNOWN"

    ReDim parts(0) As String
    Dim pcount As Integer
    Dim found As Integer
    Dim v As Variable
    Dim pidx As Integer
    pcount = Split(vname, ".", parts())
    If pcount = 1 Then
        pidx = InStr(vname, "(")
        If pidx Then vname = Left$(vname, pidx - 1)
        found = FindVariable(vname, v, False)
        If Not found Then found = FindVariable(vname, v, True)
        If found Then
            vartype = v.type
        End If
    Else
        vname = parts(1)
        pidx = InStr(vname, "(")
        If pidx Then vname = Left$(vname, pidx - 1)
        found = FindVariable(vname, v, False)
        If Not found Then found = FindVariable(vname, v, True)

        If found Then
            Dim typeId As Integer
            typeId = FindTypeId(v.type)

            Dim i As Integer
            Dim j As Integer
            For i = 2 To pcount

                For j = 1 To UBound(typeVars)
                    If typeVars(j).typeId = typeId And typeVars(j).name = parts(i) Then
                        vartype = typeVars(j).type
                        typeId = FindTypeId(vartype)
                    End If
                Next j

            Next i
        End If
    End If


    GetVarType = vartype
End Function

Function ConvertSwap$ (m As Method, args As String, lineNumber As Integer)
    Dim js As String
    Dim swapArray As String: swapArray = GenJSVar
    Dim swapArgs(0) As String
    Dim swapCount As Integer
    swapCount = ListSplit(args, swapArgs())
    Dim var1 As String
    Dim var2 As String
    var1 = ConvertExpression(swapArgs(1), lineNumber)
    var2 = ConvertExpression(swapArgs(2), lineNumber)
    js = "var " + swapArray + " = [" + var1 + "," + var2 + "]; "
    js = js + CallMethod(m) + "(" + swapArray + "); "
    js = js + var1 + " = " + swapArray + "[0]; "
    js = js + var2 + " = " + swapArray + "[1];"
    ConvertSwap = js
End Function

Function GenJSVar$
    GenJSVar = "___v" + GenJSName
End Function

Function GenJSLabel$
    GenJSLabel = "___l" + GenJSName
End Function

Function GenJSName$
    GenJSName$ = _Trim$(Str$(_Round(Rnd * 10000000)))
End Function

Function FindParamChar (s As String, ch As String)
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
        ElseIf Not quote And paren = 0 And c = ch Then
            idx = i
            Exit For
        End If
    Next i

    FindParamChar = idx
End Function

Sub DeclareTypeVar (parts() As String, typeId As Integer, lineNumber As Integer)

    Dim vname As String
    Dim vtype As String: vtype = ""
    Dim vtypeIndex As Integer: vtypeIndex = 4
    Dim isGlobal As Integer: isGlobal = False
    Dim isArray As Integer: isArray = False
    Dim isStatic As Integer: isStatic = False
    Dim arraySize As String
    Dim pstart As Integer
    Dim bvar As Variable
    Dim varnames(0) As String
    Dim vnamecount As Integer
    Dim findVar As Variable
    Dim asIdx As Integer
    asIdx = 0
    bvar.typeId = typeId


    Dim i As Integer
    For i = 1 To UBound(parts)
        If UCase$(parts(i)) = "AS" Then asIdx = i
    Next i

    If asIdx = 1 Then

        ' Handle Dim As syntax
        bvar.type = UCase$(parts(asIdx + 1))
        Dim nextIdx As Integer
        nextIdx = asIdx + 2
        If bvar.type = "_UNSIGNED" Or bvar.type = "UNSIGNED" Then
            bvar.type = NormalizeType("_UNSIGNED " + UCase$(parts(asIdx + 2)))
            nextIdx = asIdx + 3
        End If
        'bvar.typeId = FindTypeId(bvar.type)

        vnamecount = ListSplit(Join(parts(), nextIdx, -1, " "), varnames())
        For i = 1 To vnamecount
            vname = _Trim$(varnames(i))
            pstart = InStr(vname, "(")
            If pstart > 0 Then
                bvar.isArray = True
                arraySize = ConvertExpression(Mid$(vname, pstart + 1, Len(vname) - pstart - 1), lineNumber)
                bvar.name = RemoveSuffix(Left$(vname, pstart - 1))
            Else
                bvar.isArray = False
                arraySize = ""
                bvar.name = vname
            End If
            AddVariable bvar, typeVars()
        Next i

    Else
        'Handle traditional syntax
        bvar.name = parts(1)
        bvar.type = UCase$(parts(3))
        If bvar.type = "_UNSIGNED" Or bvar.type = "UNSIGNED" Then bvar.type = NormalizeType("_UNSIGNED " + UCase$(parts(4)))
        'bvar.typeId = FindTypeId(bvar.type)
        AddVariable bvar, typeVars()
    End If

End Sub

Function DeclareVar$ (parts() As String, lineNumber As Integer)

    Dim vname As String
    Dim vtype As String: vtype = ""
    Dim vtypeIndex As Integer: vtypeIndex = 4
    Dim isGlobal As Integer: isGlobal = False
    Dim isShared As Integer: isShared = False
    Dim isArray As Integer: isArray = False
    Dim isStatic As Integer: isStatic = False
    Dim arraySize As String
    Dim pstart As Integer
    Dim bvar As Variable
    Dim varnames(0) As String
    Dim vnamecount As Integer
    Dim findVar As Variable
    Dim asIdx As Integer
    asIdx = 0
    Dim js As String: js = ""
    Dim bPreserve As String: bPreserve = "false"

    If UCase$(parts(1)) = "STATIC" Then
        If currentMethod = "" Then
            AddWarning lineNumber, "STATIC must be used within a SUB/FUNCTION"
            DeclareVar = ""
            Exit Function
        Else
            isStatic = True
        End If
    ElseIf UCase$(parts(1)) = "SHARED" Then
        If currentMethod = "" Then
            AddWarning lineNumber, "SHARED must be used within a SUB/FUNCTION"
            DeclareVar = ""
            Exit Function
        Else
            isShared = True
        End If
    End If

    Dim i As Integer
    For i = 1 To UBound(parts)
        If UCase$(parts(i)) = "AS" Then asIdx = i
        If UCase$(parts(i)) = "_PRESERVE" Or UCase$(parts(i)) = "PRESERVE" Then bPreserve = "true"
        If UCase$(parts(i)) = "SHARED" Then isGlobal = True
    Next i


    If asIdx = 2 Or _
       (asIdx = 3 And (isGlobal Or bPreserve = "true") And Not isShared) Or _
       (asIdx = 4 And isGlobal And bPreserve = "true") Then

        ' Handle Dim As syntax
        bvar.type = UCase$(parts(asIdx + 1))
        Dim nextIdx As Integer
        nextIdx = asIdx + 2
        If bvar.type = "_UNSIGNED" Or bvar.type = "UNSIGNED" Then
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
                arraySize = ConvertExpression(Mid$(vname, pstart + 1, Len(vname) - pstart - 1), lineNumber)
                bvar.name = RemoveSuffix(Left$(vname, pstart - 1))
            Else
                bvar.isArray = False
                arraySize = ""
                bvar.name = vname
            End If

            js = RegisterVar(bvar, js, isGlobal, isStatic, bPreserve, arraySize)
        Next i


    Else
        'Handle traditional syntax
        Dim vpartcount As Integer
        Dim vparts(0) As String
        nextIdx = 0
        For i = 1 To UBound(parts)
            Dim p As String
            p = UCase$(parts(i))
            If p = "DIM" Or p = "REDIM" Or p = "SHARED" Or p = "_PRESERVE" Or p = "PRESERVE" Or p = "STATIC" Then
                nextIdx = i + 1
            End If
        Next i

        vnamecount = ListSplit(Join(parts(), nextIdx, -1, " "), varnames())
        For i = 1 To vnamecount

            vpartcount = SLSplit2(varnames(i), vparts())
            If vpartcount = 1 Then
                bvar.type = DataTypeFromName(vparts(1))
            ElseIf vpartcount = 3 Then
                bvar.type = UCase$(vparts(3))
            ElseIf vpartcount = 4 Then
                bvar.type = UCase$(Join(vparts(), 3, -1, " "))
            Else
                ' Log error?
                AddError lineNumber, "Syntax Error"
            End If
            bvar.name = RemoveSuffix(vparts(1))
            bvar.typeId = FindTypeId(bvar.type)


            pstart = InStr(bvar.name, "(")
            If pstart > 0 Then
                bvar.isArray = True
                arraySize = ConvertExpression(Mid$(bvar.name, pstart + 1, Len(bvar.name) - pstart - 1), lineNumber)
                bvar.name = RemoveSuffix(Left$(bvar.name, pstart - 1))
            Else
                bvar.isArray = False
                arraySize = ""
            End If

            js = RegisterVar(bvar, js, isGlobal, isStatic, bPreserve, arraySize)
        Next i
    End If

    If isStatic Then
        jsLines(staticVarLine).text = jsLines(staticVarLine).text + js
        DeclareVar = "/* static variable(s): " + Join(parts(), 1, -1, " ") + " */"
    ElseIf isShared Then
        DeclareVar = "/* shared variable(s): " + Join(parts(), 1, -1, " ") + " */"
    Else
        DeclareVar = js
    End If
End Function

Function RegisterVar$ (bvar As Variable, js As String, isGlobal As Integer, isStatic As Integer, bPreserve As String, arraySize As String)
    Dim findVar As Variable
    Dim varExists As Integer

    bvar.jsname = RemoveSuffix(bvar.name)
    If isStatic Then
        bvar.jsname = "$" + currentMethod + "__" + bvar.jsname
    End If
    bvar.type = NormalizeType(bvar.type)

    varExists = FindVariable(bvar.name, findVar, bvar.isArray)

    If isGlobal Then
        AddVariable bvar, globalVars()
    Else
        AddVariable bvar, localVars()
    End If

    If Not bvar.isArray Then
        Dim v As String: v = "var "
        If isGlobal Then
            If Not varExists Then
                jsLines(sharedVarLine).text = jsLines(sharedVarLine).text + "var " + bvar.jsname + " = " + InitTypeValue(bvar.type) + "; "
            End If
            v = ""
        End If
     
        js = js + v + bvar.jsname + " = " + InitTypeValue(bvar.type) + "; "
        ' If this is a FUNCTION or SUB type we also need to make sure this method name is registered in the current scope
        If bvar.type = "SUB" Or bvar.type = "FUNCTION" Then
            Dim m As Method
            If FindMethod(bvar.name, m, bvar.type, False) < 1 Then
                m.name = bvar.name
                m.type = bvar.type
                AddLocalMethod m
            End If
        End If
    Else
        If isGlobal And Not varExists Then
            jsLines(sharedVarLine).text = jsLines(sharedVarLine).text + "var " + bvar.jsname + " = QB.initArray([0], " + InitTypeValue(bvar.type) + "); "
            varExists = True
        End If

        If varExists Then
            js = js + "QB.resizeArray(" + bvar.jsname + ", [" + FormatArraySize(arraySize) + "], " + InitTypeValue(bvar.type) + ", " + bPreserve + "); "
        Else
            js = js + "var " + bvar.jsname + " = QB.initArray([" + FormatArraySize(arraySize) + "], " + InitTypeValue(bvar.type) + "); "
        End If
    End If

    If PrintDataTypes Then js = js + " /* " + bvar.type + " */ "

    RegisterVar = js
End Function

Sub RegisterImplicitVar (varname As String, dataType As String, arraySize As String)
    Dim ivar As Variable
    ivar.name = RemoveSuffix(varname)
    ivar.type = dataType
    If arraySize <> "" Then ivar.isArray = True
    jsLines(implicitVarLine).text = jsLines(implicitVarLine).text + RegisterVar(ivar, "", False, False, "", arraySize)
End Sub

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

        Dim As Integer j, toIndex
        toIndex = 0
        For j = 0 To scount
            If "TO" = UCase$(subparts(j)) Then
                toIndex = j
                Exit For
            End If
        Next j

        If toIndex = 0 Then
            sizeParams = sizeParams + "{l:0,u:" + subparts(1) + "}"
        Else
            ' This must be the "x To y" format
            Dim As String lb, ub
            lb = Join(subparts(), 1, toIndex - 1, " ")
            ub = Join(subparts(), toIndex + 1, -1, " ")
            sizeParams = sizeParams + "{l:" + lb + ",u:" + ub + "}"
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
    ElseIf vtype = "FUNCTION" Or vtype = "SUB" Then
        value = "function() { return 0; }"
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

Function ConvertExpression$ (ex As String, lineNumber As Integer)
    Dim c As String
    Dim js As String: js = ""
    Dim word As String: word = ""
    Dim bvar As Variable
    Dim m As Method
    Dim intdiv As Integer

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
            If c = " " Or c = "," Or i = Len(ex) Then ' isOperator Or i = Len(ex) Then
                If i = Len(ex) Then word = word + c
                Dim uword As String: uword = UCase$(_Trim$(word))
                If uword = "NOT" Then
                    js = js + "~"
                ElseIf uword = "AND" Then
                    js = js + " & "
                ElseIf uword = "OR" Then
                    js = js + " | "
                ElseIf uword = "MOD" Then
                    js = js + " % "
                ElseIf uword = "XOR" Then
                    js = js + " ^ "
                ElseIf uword = "=" Then
                    js = js + " == "
                ElseIf uword = "<>" Then
                    js = js + " != "
                ElseIf uword = "^" Then
                    js = js + " ** "
                ElseIf uword = "\" Then
                    js = js + " \ " ' mark this expression as containing an integer division
                    intdiv = True ' we'll handle the necessary adjustments at the end of the loop

                ElseIf StartsWith(uword, "&H") Or StartsWith(uword, "&O") Or StartsWith(uword, "&B") Then
                    js = js + " QB.func_Val('" + uword + "') "

                ElseIf StartsWith(uword, "@") Then
                    ' Handle method pointer references
                    Dim mref As String
                    Dim fres As Integer
                    mref = Mid$(_Trim$(word), 2)
                    fres = FindMethod(mref, m, "FUNCTION", False)
                    If fres < 1 Then fres = FindMethod(mref, m, "SUB", False)
                    If fres Then
                        js = js + " " + m.jsname
                    Else
                        AddError lineNumber, "Missing or invalid method reference (" + mref + ")"
                    End If
                Else
                    If FindVariable(word, bvar, False) Then
                        js = js + " " + bvar.jsname
                    Else
                        If FindMethod(word, m, "FUNCTION", True) Then
                            If m.name <> currentMethod Then
                                js = js + CallMethod$(m) + "()"
                            Else
                                js = js + " " + word
                            End If
                        Else
                            ' Check for implicit variable declaration
                            If FindVariable(word, bvar, True) Then
                                js = js + " " + bvar.jsname
                            Else
                                Dim varname As String
                                varname = _Trim$(word)
                                If IsValidVarname(varname) Then
                                    Dim dt As String
                                    dt = DataTypeFromName(varname)
                                    If optionExplicit Then
                                        AddError lineNumber, "Variable '" + RemoveSuffix(varname) + "' (" + dt + ") not defined"
                                    Else
                                        RegisterImplicitVar varname, dt, ""
                                        If FindVariable(varname, bvar, False) Then
                                            js = js + " " + bvar.jsname
                                        Else
                                            AddError i, "Implicit variable declaration error"
                                        End If
                                    End If
                                Else
                                    js = js + " " + word
                                End If
                            End If
                        End If

                    End If
                End If
                If c = "," And i <> Len(ex) Then
                    js = js + ","
                End If
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
                        js = js + fneg + "QB.arrayValue(" + bvar.jsname + ", [" + ConvertExpression(ex2, lineNumber) + "]).value"
                    End If
                ElseIf FindMethod(word, m, "FUNCTION", True) Then
                    js = js + fneg + "(" + CallMethod(m) + "(" + ConvertMethodParams(ex2, lineNumber) + "))"
                Else
                    varname = _Trim$(word)
                    If varname <> "" Then
                        If optionExplicit Or optionExplicitArray Then
                            AddError lineNumber, "Missing function or array [" + word + "]"
                            js = js + fneg + "(" + ConvertExpression(ex2, lineNumber) + ")"
                        Else
                            ' determine how many dimensions are referenced in ex2
                            ReDim params(0) As String
                            Dim As String arraySize
                            Dim As Integer argc, ai
                            argc = ListSplit(ex2, params())
                            ' construct the array size string
                            arraySize = "10"
                            For ai = 2 To argc: arraySize = arraySize + ", 10": Next ai
                            dt = DataTypeFromName(varname)
                            RegisterImplicitVar varname, dt, arraySize
                            If FindVariable(varname, bvar, True) Then
                                If _Trim$(ex2) = "" Then
                                    ' This is the case where the array variable is being passed as a parameter
                                    js = js + fneg + bvar.jsname
                                Else
                                    ' This is the case where a dimension is specified in order to retrieve or set a value in the array
                                    js = js + fneg + "QB.arrayValue(" + bvar.jsname + ", [" + ConvertExpression(ex2, lineNumber) + "]).value"
                                End If
                            Else
                                AddError i, "Implicit variable declaration error"
                            End If
                        End If
                    Else
                        js = js + fneg + "(" + ConvertExpression(ex2, lineNumber) + ")"
                    End If
                End If
                word = ""

            Else
                word = word + c
            End If
        End If
        i = i + 1
    Wend
    If intdiv Then
        js = ConvertIntDiv(js)
    End If
    ConvertExpression = js
End Function

Function ConvertIntDiv$ (s As String)
    Dim As Integer idx, sidx, eidx, smode, qmode, pcount, ci
    Dim As String c ', part
    idx = InStr(s, "\")
    While idx > 0
        ' search for the position to insert the beginning of the round operation
        smode = 0: qmode = 0: pcount = 0
        For sidx = idx - 1 To 1 Step -1
            c = Mid$(s, sidx, 1)
            If c = " " Then
                If smode = 0 Then
                    ' Move along
                ElseIf smode = 1 Then
                    If pcount <= 0 Then
                        ' See if a minus sign precedes the token
                        For ci = sidx - 1 To 1 Step -1
                            c = Mid$(s, ci, 1)
                            If c <> " " Then
                                If c = "-" Then sidx = ci
                                Exit For
                            End If
                        Next ci
                        Exit For
                    End If
                    smode = 0
                End If
            Else
                If smode = 0 Then smode = 1
                If c = Chr$(34) Then
                    qmode = Not qmode
                ElseIf c = ")" And Not qmode Then
                    pcount = pcount + 1
                ElseIf c = "(" And Not qmode Then
                    pcount = pcount - 1
                End If
            End If
        Next sidx

        pcount = Abs(pcount)
        ' search for the position to insert the end of the round operation
        smode = 0: qmode = 0
        For eidx = idx + 1 To Len(s)
            c = Mid$(s, eidx, 1)
            If c = " " Or c = "-" Then
                If smode = 0 Then
                    ' Move along
                ElseIf smode = 1 Then
                    If pcount = 0 Then Exit For
                    smode = 0
                End If
            Else
                If smode = 0 Then smode = 1
                If c = Chr$(34) Then
                    qmode = Not qmode
                ElseIf c = ")" And Not qmode Then
                    pcount = pcount - 1
                ElseIf c = "(" And Not qmode Then
                    pcount = pcount + 1
                End If
            End If
        Next eidx

        s = Left$(s, sidx) + " QB.func_Fix(QB.func_Cint(" + _
            Mid$(s, sidx + 1, idx - sidx - 1) + ") / QB.func_Cint(" + _
            Mid$(s, idx + 1, eidx - idx - 1) + "))" + Mid$(s, eidx)

        idx = InStr(s, "\")
    Wend
    
    ConvertIntDiv = s
End Function


' Handle optional parameters
Function ConvertMethodParams$ (args As String, lineNumber As Integer)
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
            js = js + " " + ConvertExpression(params(i), lineNumber)
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

Function FindMethodOld (mname As String, m As Method, t As String, includeBuiltIn As Integer)
    Dim found As Integer: found = False
    Dim i As Integer
    For i = 1 To UBound(methods)
        If (Not includeBuiltIn) And methods(i).builtin Then
            ' Skip it
        ElseIf methods(i).uname = _Trim$(UCase$(RemoveSuffix(mname))) And methods(i).type = t Then
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
    FindMethodOld = found
End Function

Function FindMethod (mname As String, m As Method, t As String, includeBuiltIn As Integer)
    Dim umname As String: umname = _Trim$(UCase$(RemoveSuffix(mname)))
    Dim found As Integer: found = 0
    Dim i As Integer
    For i = 1 To UBound(localMethods)
        If localMethods(i).uname = umname Then
            found = True
            m.line = localMethods(i).line
            m.type = localMethods(i).type
            m.returnType = localMethods(i).returnType
            m.name = localMethods(i).name
            m.jsname = localMethods(i).jsname
            m.uname = localMethods(i).uname
            m.argc = localMethods(i).argc
            m.args = localMethods(i).args
            m.sync = localMethods(i).sync
            found = i
           Exit For
       End If
    Next i
    If Not found Then
        For i = 1 To UBound(methods)
            If (Not includeBuiltIn) And methods(i).builtin Then
                ' Skip it
            ElseIf methods(i).uname = umname And methods(i).type = t Then
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
                found = i
                Exit For
            End If
        Next i
        If Not found Then
            For i = 1 To UBound(exportMethods)
                If exportMethods(i).uname = umname And exportMethods(i).type = t Then
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
                    found = i
                    Exit For
                End If
            Next i
        End If
    End If
    FindMethod = found
End Function

Sub ConvertMethods ()
    AddJSLine 0, ""

    Dim i As Integer
    For i = 1 To UBound(methods)
        If (methods(i).line <> 0) Then
            'currentMethod = methods(i).name

            Dim lastLine As Integer
            lastLine = methods(i + 1).line - 1
            If lastLine < 0 Then lastLine = UBound(lines)

            ' clear the local variables and methods
            ReDim As Method localMethods(0)
            ReDim As Variable localVars(0)
            Dim intConv As String
            intConv = ""

            ' All program methods are defined as async as we do not know whether
            ' a synchronous wait will occur downstream
            Dim methodDec As String
            methodDec = "async function " + methods(i).jsname + "("
            If methods(i).argc > 0 Then
                ReDim As String args(0)
                Dim c As Integer
                c = Split(methods(i).args, ",", args())
                Dim a As Integer
                For a = 1 To c
                    Dim v As Integer
                    ReDim As String parts(0)
                    v = Split(args(a), ":", parts())
                    methodDec = methodDec + RemoveSuffix(parts(1)) + "/*" + parts(2) + "*/"
                    If a < c Then methodDec = methodDec + ","

                    ' add the parameter to the local variables
                    Dim bvar As Variable
                    bvar.name = RemoveSuffix(parts(1))
                    bvar.type = NormalizeType(parts(2))
                    bvar.typeId = FindTypeId(bvar.type)
                    If parts(3) = "true" Then
                        bvar.isArray = True
                    End If
                    bvar.jsname = ""
                    AddVariable bvar, localVars()

                    ' convert integer parameters from floating point (or string)
                    If Not bvar.isArray Then
                        Dim typeName As String
                        typeName = UCase$(bvar.type)
                        If typeName = "_BIT" Or typeName = "_UNSIGNED _BIT" Or _
                           typeName = "_BYTE" Or typeName = "_UNSIGNED _BYTE" Or _
                           typeName = "INTEGER" Or typeName = "_UNSIGNED INTEGER" Or _
                           typeName = "LONG" Or typeName = "_UNSIGNED LONG" Or _
                           typeName = "_INTEGER64" Or typeName = "_UNSIGNED _INTEGER64" Then
                            ' lookup the variable to get the jsname
                            Dim varIsArray As Integer
                            If FindVariable(bvar.name, bvar, varIsArray) Then
                                intConv = intConv + bvar.jsname + " = Math.round(" + bvar.jsname + "); "
                            End If

                        ElseIf typeName = "FUNCTION" Or typeName = "SUB" Then
                            Dim m As Method
                            m.name = bvar.name
                            m.type = bvar.type
                            AddLocalMethod m
                        End If
                    End If
                Next a
            End If
            methodDec = methodDec + ") {"

            AddJSLine methods(i).line, methodDec
            AddJSLine methods(i).line, "if (QB.halted()) { return; }; " + intConv
            If methods(i).type = "FUNCTION" Then
                AddJSLine methods(i).line, "var " + RemoveSuffix(methods(i).name) + " = null;"
                Dim fvar As Variable
                fvar.name = RemoveSuffix(methods(i).name)
                fvar.type = DataTypeFromName(methods(i).name)
                AddVariable fvar, localVars()
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
    If UBound(exportLines) > 0 Then
        AddJSLine 0, "return {"
        For i = 1 To UBound(exportLines)
            AddJSLine i, exportLines(i)
        Next i
        AddJSLine 0, "};"
        ReDim exportLines(0) As String
    End If
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

            If StartsWith(LTrim$(UCase$(fline)), "IMPORT") Then
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

                    Dim mcount As Integer
                    mcount = UBound(modules) + 1
                    ReDim _Preserve modules(mcount) As Module
                    modules(mcount).name = moduleName
                    modules(mcount).path = sourceUrl
                    currentModuleId = mcount

                    QBToJS importRes.text, TEXT, moduleName
                    ResetDataStructures
                    modLevel = modLevel - 1
                    currentModuleId = currentModuleId - 1
                    currentModule = ""
                    
                    _Continue
                End If
            End If

            fline = Replace(fline, CR, "")
            While EndsWith(fline, " _")
                i = i + 1
                Dim nextLine As String
                nextLine = Replace(sourceLines(i), CR, "")
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
        Dim As String c, c4
        c = Mid$(fline, i, 1)
        c4 = UCase$(Mid$(fline, i, 4))
        If c = Chr$(34) Then
            If quoteDepth = 0 Then
                quoteDepth = 1
            Else
                quoteDepth = 0
            End If
        End If
        If quoteDepth = 0 And (c = "'" Or c4 = "REM ") Then
            fline = Left$(fline, i - 1)
            Exit For
        End If
    Next i

    ReadLine = rawJS

    If _Trim$(fline) = "" Then Exit Function

    Dim word As String
    Dim words(0) As String
    Dim wcount As Integer
    wcount = SLSplit(fline, words(), False)

    ' Step 2: Determine whether native js is being included
    If Left$(UCase$(words(1)), 4) = "$END" Then
        If rawJS Then rawJS = Not rawJS
        AddLine lineIndex, fline
        ReadLine = rawJS
        Exit Function
    End If
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

    ' If there is content before the IF, split it into individual lines
    If ifIdx > 1 Then
        ' Unless it is an END IF
        If UCase$(words(ifIdx - 1)) <> "END" Then
            AddSubLines lineIndex, Join(words(), 1, ifIdx - 1, " ")
        End If
    End If

    If thenIdx > 0 And thenIdx < wcount Then
        AddLine lineIndex, Join(words(), ifIdx, thenIdx, " ")
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

    If quoteDepth <> 0 Then AddError UBound(lines), "Unterminated string constant"
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
        If Left$(word, 4) = "$END" And rawJS Then rawJS = False
        If rawJS Then _Continue

        If word = "FUNCTION" Or word = "SUB" Then
            ' Find start and end parameters, if present to get argument list
            Dim mstr As String
            Dim argstr As String
            Dim pstart As Integer
            Dim mname As String
            Dim pend
            mstr = Join(parts(), 2, -1, " ")
            pstart = InStr(mstr, "(")
            If pstart = 0 Then
                argstr = ""
                mname = mstr
            Else
                mname = _Trim$(Left$(mstr, pstart - 1))
                mstr = Mid$(mstr, pstart + 1)
                pend = _InStrRev(mstr, ")")
                argstr = Left$(mstr, pend - 1)
            End If

            ReDim As String arga(0)

            Dim m As Method
            m.line = i
            m.type = word
            m.name = mname
            m.argc = ListSplit(argstr, arga())
            m.args = ""
            ReDim As Argument args(0)

            If UBound(arga) > 0 Then
                Dim a As Integer
                Dim args As String
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
                    If apcount > 2 Then
                        Dim typeName As String
                        typeName = UCase$(aparts(3))
                        If apcount > 3 Then
                            If typeName = "UNSIGNED" Or typeName = "_UNSIGNED" Then
                                typeName = NormalizeType("_UNSIGNED " + UCase$(aparts(4)))
                            End If
                        End If
                        'args = args + argname + ":" + UCase$(aparts(3)) + ":" + isArray
                        args = args + argname + ":" + typeName + ":" + isArray
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
        Dim As String c, c2
        c = Mid$(cstr, i, 1)
        c2 = Mid$(cstr, i, 2)

        Dim oplen As Integer
        oplen = FindOperator(c, c2)

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

        ElseIf oplen Then
            If quoteMode Then
                If oplen = 2 Then
                    result = result + c2
                    i = i + 1
                Else
                    result = result + c
                End If
            Else
                If result <> "" Then
                    count = UBound(results) + 1
                    ReDim _Preserve As String results(count)
                    results(count) = result
                End If
                count = UBound(results) + 1
                ReDim _Preserve As String results(count)
                If oplen = 2 Then
                    results(count) = c2
                    i = i + 1
                Else
                    results(count) = c
                End If
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

Function FindOperator (c As String, c2 As String)

    If c2 = ">=" Then
        FindOperator = 2
    ElseIf c2 = "<=" Then
        FindOperator = 2
    ElseIf c2 = "<>" Then
        FindOperator = 2
    ElseIf c = "=" Then
        FindOperator = 1
    ElseIf c = "+" Then
        FindOperator = 1
    ElseIf c = "-" Then
        FindOperator = 1
    ElseIf c = "/" Then
        FindOperator = 1
    ElseIf c = "\" Then
        FindOperator = 1
    ElseIf c = "*" Then
        FindOperator = 1
    ElseIf c = "^" Then
        FindOperator = 1
    ElseIf c = "," Then
        FindOperator = 1
    Else
        FindOperator = 0
    End If
End Function

Sub CheckParen (sourceString As String, lineNumber As Long)
    Dim i As Integer
    Dim quoteMode As Integer
    Dim paren As Integer
    For i = 1 To Len(sourceString)
        Dim c As String
        c = Mid$(sourceString, i, 1)

        If c = Chr$(34) Then
            quoteMode = Not quoteMode

        ElseIf quoteMode Then
            ' skip the remaining checks and move to the next char

        ElseIf c = "(" Then
            paren = paren + 1

        ElseIf c = ")" Then
            paren = paren - 1
        End If
    Next i

    If paren < 0 Then
        AddError lineNumber, "Missing ("
    ElseIf paren > 0 Then
        AddError lineNumber, "Missing )"
    End If
End Sub

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

Sub CopyMethod (fromMethod As Method, toMethod As Method)
    toMethod.type = fromMethod.type
    toMethod.name = fromMethod.name
    toMethod.returnType = fromMethod.returnType
    toMethod.name = fromMethod.name
    toMethod.uname = fromMethod.uname
    toMethod.argc = fromMethod.argc
    toMethod.args = fromMethod.args
    toMethod.jsname = fromMethod.jsname
    toMethod.sync = fromMethod.sync
End Sub

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

Sub AddLocalMethod (m As Method)
    Dim mcount: mcount = UBound(localMethods) + 1
    ReDim _Preserve As Method localMethods(mcount)
    m.uname = UCase$(RemoveSuffix(m.name))
    m.jsname = m.name
    m.sync = True
    localMethods(mcount) = m
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
    m.builtin = True
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
    m.builtin = True
    AddMethod m, "QB.", sync
    If InStr(mname, "_") = 1 Then
        ' Register the method again without the "_" prefix
        Dim m2 As Method
        CopyMethod methods(UBound(methods)), m2
        m2.name = Mid$(mname, 2)
        m2.uname = UCase$(RemoveSuffix(m2.name))
        m2.builtin = True
        Dim mcount: mcount = UBound(methods) + 1
        ReDim _Preserve As Method methods(mcount)
        methods(mcount) = m2
    End If
End Sub

Sub AddNativeMethod (mtype As String, mname As String, jsname As String, sync As Integer)
    Dim m As Method
    m.type = mtype
    m.name = mname
    m.uname = UCase$(m.name)
    m.jsname = jsname
    m.sync = sync
    m.builtin = True

    Dim mcount: mcount = UBound(methods) + 1
    ReDim _Preserve As Method methods(mcount)
    methods(mcount) = m
End Sub

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
    warnings(lcount).moduleId = currentModuleId
End Sub

Sub AddError (sourceLine As Integer, msgText As String)
    AddWarning sourceLine, msgText
    warnings(UBound(warnings)).mtype = MERROR
End Sub

Sub AddConst (vname As String, methodName As String)
    Dim v As Variable
    v.type = "CONST"
    v.name = vname
    v.isConst = True
    If methodName = "" Then
        AddVariable v, globalVars()
    Else
        AddVariable v, localVars()
    End If
End Sub

Sub AddGXConst (vname As String)
    Dim v As Variable
    v.type = "CONST"
    v.name = vname
    If vname = "GX_TRUE" Then
        v.jsname = "GX.TRUE"
    ElseIf vname = "GX_FALSE" Then
        v.jsname = "GX.FALSE"
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
    If InStr(vname, "_") = 1 Then
        Dim v2 As Variable
        v2.type = v.type
        v2.name = Mid$(v.name, 2)
        v2.jsname = v.jsname
        v2.isConst = v.isConst
        AddVariable v2, globalVars()
    End If
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
    nvar.type = NormalizeType(bvar.type)
    nvar.name = bvar.name
    nvar.jsname = bvar.jsname
    nvar.isConst = bvar.isConst
    nvar.isArray = bvar.isArray
    nvar.arraySize = bvar.arraySize
    nvar.typeId = bvar.typeId

    If nvar.jsname = "" Then
        nvar.jsname = RemoveSuffix(nvar.name)
        bvar.jsname = nvar.jsname
    End If
    If IsJSReservedWord(nvar.jsname) Then
        nvar.jsname = nvar.jsname + "_" + GenJSName$
        bvar.jsname = nvar.jsname
    End If

    vlist(vcount) = nvar
End Sub

Function NormalizeType$ (itype As String)
    ' Replace non-underscore prefixed type names with the underscore version
    Dim otype As String

    If itype = "BIT" Then
        otype = "_BIT"
    ElseIf itype = "_UNSIGNED BIT" Then
        otype = "_UNSIGNED _BIT"
    ElseIf itype = "BYTE" Then
        otype = "_BYTE"
    ElseIf itype = "_UNSIGNED BYTE" Then
        otype = "_UNSIGNED _BYTE"
    ElseIf itype = "INTEGER64" Then
        otype = "_INTEGER64"
    ElseIf itype = "_UNSIGNED INTEGER64" Then
        otype = "_UNSIGNED _INTEGER64"
    ElseIf itype = "FLOAT" Then
        otype = "_FLOAT"
    ElseIf itype = "OFFSET" Then
        otype = "_OFFSET"
    ElseIf itype = "_UNSIGNED OFFSET" Then
        otype = "_UNSIGNED _OFFSET"
    Else
        otype = itype
    End If

    NormalizeType = otype
End Function

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
        If c = "`" Or c = "%" Or c = "&" Or c = "$" Or c = "~" Or c = "!" Or c = "#" Then
            i = i - 1
        Else
            done = True
        End If
    Wend
    RemoveSuffix = Left$(vname, i)
End Function

Function IsJSReservedWord (vname As String)
    Dim As Integer found, i
    For i = 1 To UBound(jsReservedWords)
        If jsReservedWords(i) = vname Then
            found = True
            Exit For
        End If
    Next i
    IsJSReservedWord = found
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

        If a = 46 Then
            ' replace period with underscore
            jsname = jsname + "_"

        ElseIf (a >= 65 And a <= 90) Or (a >= 97 And a <= 122) Or _
           (a >= 48 And a <= 57) Or a = 95 Then
            ' uppercase, lowercase, numbers, and -
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
        If (a >= 65 And a <= 90) Or (a >= 97 And a <= 122) Or (a >= 48 And a <= 57) Or a = 95 Or a = 46 Then
            jsname = jsname + c
        End If
    Next i

    GXMethodJS = jsname
End Function

Sub InitJSReservedWords
    jsReservedWords(1) = "abstract"
    jsReservedWords(2) = "arguments"
    jsReservedWords(3) = "await"
    jsReservedWords(4) = "boolean"
    jsReservedWords(5) = "break"
    ' byte, case
    jsReservedWords(6) = "catch"
    jsReservedWords(7) = "char"
    jsReservedWords(8) = "class"
    ' const, continue
    jsReservedWords(9) = "debugger"
    jsReservedWords(10) = "default"
    jsReservedWords(11) = "delete"
    ' do, double, else
    jsReservedWords(12) = "enum"
    jsReservedWords(13) = "eval"
    ' export
    jsReservedWords(14) = "extends"
    jsReservedWords(15) = "false"
    jsReservedWords(16) = "final"
    jsReservedWords(17) = "finally"
    ' float, for, function, goto, if
    jsReservedWords(18) = "implements"
    ' import, in
    jsReservedWords(19) = "instanceof"
    ' int
    jsReservedWords(20) = "interface"
    ' let, long
    jsReservedWords(21) = "native"
    jsReservedWords(22) = "new"
    jsReservedWords(23) = "null"
    jsReservedWords(24) = "package"
    jsReservedWords(25) = "private"
    jsReservedWords(26) = "protected"
    jsReservedWords(27) = "public"
    ' return, short, static
    jsReservedWords(28) = "super"
    jsReservedWords(29) = "switch"
    jsReservedWords(30) = "synchronized"
    jsReservedWords(31) = "this"
    jsReservedWords(32) = "throw"
    jsReservedWords(33) = "throws"
    jsReservedWords(34) = "transient"
    jsReservedWords(35) = "true"
    jsReservedWords(36) = "try"
    jsReservedWords(37) = "typeof"
    jsReservedWords(38) = "var"
    jsReservedWords(39) = "void"
    jsReservedWords(40) = "volitile"
    ' while
    jsReservedWords(41) = "with"
    jsReservedWords(42) = "yield"
    jsReservedWords(43) = "window"
    jsReservedWords(44) = "document"
    jsReservedWords(45) = "location"
    jsReservedWords(46) = "global"
    jsReservedWords(47) = "history"
    jsReservedWords(48) = "setTimeout"
    jsReservedWords(49) = "setInterval"
    jsReservedWords(50) = "alert"
    jsReservedWords(51) = "confirm"
    jsReservedWords(52) = "prompt"
    jsReservedWords(53) = "require"
    jsReservedWords(54) = "process"
End Sub

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
    AddGXMethod "FUNCTION", "GXSoundLoad", True
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
    AddGXMethod "FUNCTION", "GXEntityVisible", False
    AddGXMethod "SUB", "GXEntityVisible", False
    AddGXMethod "FUNCTION", "GXEntityMapLayer", False
    AddGXMethod "SUB", "GXEntityMapLayer", False
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
    AddGXMethod "FUNCTION", "GXEntityFrame", False
    AddGXMethod "FUNCTION", "GXEntityFrames", False
    AddGXMethod "SUB", "GXEntityFrames", False
    AddGXMethod "SUB", "GXEntityFrameSet", False
    AddGXMethod "FUNCTION", "GXEntitySequence", False
    AddGXMethod "FUNCTION", "GXEntitySequences", False
    AddGXMethod "SUB", "GXEntityType", False
    AddGXMethod "FUNCTION", "GXEntityType", False
    AddGXMethod "FUNCTION", "GXEntityUID$", False
    AddGXMethod "FUNCTION", "GXFontUID$", False
    AddGXMethod "SUB", "GXEntityApplyGravity", False
    AddGXMethod "FUNCTION", "GXEntityApplyGravity", False
    AddGXMethod "FUNCTION", "GXEntityCollide", False
    AddGXMethod "SUB", "GXEntityCollisionOffset", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetLeft", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetTop", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetRight", False
    AddGXMethod "FUNCTION", "GXEntityCollisionOffsetBottom", False
    AddGXMethod "SUB", "GXFullScreen", False
    AddGXMethod "FUNCTION", "GXFullScreen", False
    AddGXMethod "FUNCTION", "GXBackgroundAdd", False
    AddGXMethod "SUB", "GXBackgroundWrapFactor", False
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
    AddGXMethod "SUB", "GXSceneUpdate", True
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
    AddGXMethod "SUB", "GXTilesetCreate", True
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
    ' QB64 Constants
    ' ----------------------------------------------------------
    AddQBConst "_KEEPBACKGROUND"
    AddQBConst "_ONLYBACKGROUND"
    AddQBConst "_FILLBACKGROUND"
    AddQBConst "_OFF"
    AddQBConst "_STRETCH"
    AddQBConst "_SQUAREPIXELS"
    AddQBConst "_SMOOTH"

    ' QB64 Methods
    ' ----------------------------------------------------------
    AddQBMethod "FUNCTION", "_Alpha", False
    AddQBMethod "FUNCTION", "_Alpha32", False
    AddQBMethod "FUNCTION", "_Acos", False
    AddQBMethod "FUNCTION", "_Acosh", False
    AddQBMethod "FUNCTION", "_Arccot", False
    AddQBMethod "FUNCTION", "_Arccsc", False
    AddQBMethod "FUNCTION", "_Arcsec", False
    AddQBMethod "FUNCTION", "_Atanh", False
    AddQBMethod "FUNCTION", "_Asin", False
    AddQBMethod "FUNCTION", "_Asinh", False
    AddQBMethod "FUNCTION", "_Atan2", False
    AddQBMethod "FUNCTION", "_AutoDisplay", False
    AddQBMethod "SUB", "_AutoDisplay", False
    AddQBMethod "FUNCTION", "_BackgroundColor", False
    AddQBMethod "FUNCTION", "_Blue", False
    AddQBMethod "FUNCTION", "_Blue32", False
    AddQBMethod "FUNCTION", "_CapsLock", False
    AddQBMethod "FUNCTION", "_Ceil", False
    AddQBMethod "FUNCTION", "_Clipboard$", True
    AddQBMethod "SUB", "_Clipboard$", False
    AddQBMethod "FUNCTION", "_ClipboardImage", True
    AddQBMethod "SUB", "_ClipboardImage", True
    AddQBMethod "FUNCTION", "_CommandCount", False
    AddQBMethod "FUNCTION", "_CopyImage", False
    AddQBMethod "FUNCTION", "_Cosh", False
    AddQBMethod "FUNCTION", "_Cot", False
    AddQBMethod "FUNCTION", "_Coth", False
    AddQBMethod "FUNCTION", "_Csc", False
    AddQBMethod "FUNCTION", "_Csch", False
    AddQBMethod "FUNCTION", "_CWD$", False
    AddQBMethod "FUNCTION", "_D2G", False
    AddQBMethod "FUNCTION", "_D2R", False
    AddQBMethod "FUNCTION", "_DefaultColor", False
    AddQBMethod "FUNCTION", "_Deflate", False
    AddQBMethod "SUB", "_Delay", True
    AddQBMethod "FUNCTION", "_DesktopHeight", False
    AddQBMethod "FUNCTION", "_DesktopWidth", False
    AddQBMethod "FUNCTION", "_Dest", False
    AddQBMethod "SUB", "_Dest", False
    AddQBMethod "FUNCTION", "_Dir", False
    AddQBMethod "FUNCTION", "_DirExists", False
    AddQBMethod "FUNCTION", "_Display", False
    AddQBMethod "SUB", "_Display", False
    AddQBMethod "SUB", "_Echo", False
    AddQBMethod "FUNCTION", "_EnvironCount", False
    AddQBMethod "FUNCTION", "_FileExists", True
    AddQBMethod "FUNCTION", "_Font", False
    AddQBMethod "SUB", "_Font", False
    AddQBMethod "FUNCTION", "_FontHeight", False
    AddQBMethod "FUNCTION", "_FontWidth", False
    AddQBMethod "SUB", "_FreeFont", False
    AddQBMethod "SUB", "_FreeImage", False
    AddQBMethod "SUB", "_FullScreen", False
    AddQBMethod "FUNCTION", "_FullScreen", False
    AddQBMethod "FUNCTION", "_G2D", False
    AddQBMethod "FUNCTION", "_G2R", False
    AddQBMethod "FUNCTION", "_Green", False
    AddQBMethod "FUNCTION", "_Green32", False
    AddQBMethod "FUNCTION", "_Height", False
    AddQBMethod "FUNCTION", "_Hypot", False
    AddQBMethod "FUNCTION", "_Inflate", False
    AddQBMethod "FUNCTION", "_InStrRev", False
    AddQBMethod "SUB", "_Limit", True
    AddQBMethod "SUB", "_KeyClear", False
    AddQBMethod "FUNCTION", "_KeyDown", False
    AddQBMethod "FUNCTION", "_KeyHit", False
    AddQBMethod "FUNCTION", "_LoadFont", True
    AddQBMethod "FUNCTION", "_LoadImage", True
    AddQBMethod "FUNCTION", "_MouseButton", False
    AddQBMethod "FUNCTION", "_MouseInput", False
    AddQBMethod "SUB", "_MouseShow", False
    AddQBMethod "SUB", "_MouseHide", False
    AddQBMethod "FUNCTION", "_MouseWheel", False
    AddQBMethod "FUNCTION", "_MouseX", False
    AddQBMethod "FUNCTION", "_MouseY", False
    AddQBMethod "FUNCTION", "_NewImage", False
    AddQBMethod "FUNCTION", "_NumLock", False
    AddQBMethod "FUNCTION", "_OS$", False
    AddQBMethod "FUNCTION", "_Pi", False
    AddQBMethod "SUB", "_PaletteColor", False
    AddQBMethod "FUNCTION", "_PrintMode", False
    AddQBMethod "SUB", "_PrintMode", False
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
    AddQBMethod "SUB", "_ScreenMove", False
    AddQBMethod "FUNCTION", "_ScreenX", False
    AddQBMethod "FUNCTION", "_ScreenY", False
    AddQBMethod "FUNCTION", "_ScrollLock", False
    AddQBMethod "FUNCTION", "_Sec", False
    AddQBMethod "FUNCTION", "_Sech", False
    AddQBMethod "FUNCTION", "_Setbit", False
    AddQBMethod "FUNCTION", "_Shl", False
    AddQBMethod "FUNCTION", "_Shr", False
    AddQBMethod "FUNCTION", "_Sinh", False
    AddQBMethod "FUNCTION", "_Source", False
    AddQBMethod "SUB", "_Source", False
    AddQBMethod "SUB", "_SndClose", False
    AddQBMethod "FUNCTION", "_SndOpen", True
    AddQBMethod "SUB", "_SndPlay", False
    AddQBMethod "SUB", "_SndLoop", False
    AddQBMethod "SUB", "_SndPause", False
    AddQBMethod "SUB", "_SndStop", False
    AddQBMethod "SUB", "_SndVol", False
    AddQBMethod "FUNCTION", "_StartDir$", False
    AddQBMethod "FUNCTION", "_Strcmp", False
    AddQBMethod "FUNCTION", "_Stricmp", False
    AddQBMethod "FUNCTION", "_Tanh", False
    AddQBMethod "FUNCTION", "_Title", False
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
    AddQBMethod "FUNCTION", "Cdbl", False
    AddQBMethod "SUB", "ChDir", False
    AddQBMethod "FUNCTION", "Cint", False
    AddQBMethod "FUNCTION", "Clng", False
    AddQBMethod "SUB", "Close", False
    AddQBMethod "FUNCTION", "Csng", False
    AddQBMethod "SUB", "Circle", False
    AddQBMethod "SUB", "Cls", False
    AddQBMethod "SUB", "Color", False
    AddQBMethod "FUNCTION", "Command$", False
    AddQBMethod "FUNCTION", "Cos", False
    AddQBMethod "FUNCTION", "Csrlin", False
    AddQBMethod "FUNCTION", "Cvi", False
    AddQBMethod "FUNCTION", "Cvl", False
    AddQBMethod "FUNCTION", "Date$", False
    AddQBMethod "SUB", "Draw", False
    AddQBMethod "FUNCTION", "Environ", False
    AddQBMethod "SUB", "Environ", False
    AddQBMethod "SUB", "Error", False
    AddQBMethod "FUNCTION", "EOF", False
    AddQBMethod "FUNCTION", "Exp", False
    AddQBMethod "SUB", "Files", True
    AddQBMethod "FUNCTION", "Fix", False
    AddQBMethod "FUNCTION", "FreeFile", False
    AddQBMethod "SUB", "Get", False
    AddQBMethod "FUNCTION", "Put", False
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
    AddQBMethod "FUNCTION", "Loc", False
    AddQBMethod "SUB", "Locate", False
    AddQBMethod "FUNCTION", "LOF", False
    AddQBMethod "FUNCTION", "Log", False
    AddQBMethod "FUNCTION", "LTrim$", False
    AddQBMethod "SUB", "Kill", False
    AddQBMethod "FUNCTION", "Mid$", False
    AddQBMethod "SUB", "Mid$", False
    AddQBMethod "SUB", "MkDir", False
    AddQBMethod "FUNCTION", "Mki$", False
    AddQBMethod "FUNCTION", "Mkl$", False
    AddQBMethod "SUB", "Name", False
    AddQBMethod "FUNCTION", "Oct$", False
    AddQBMethod "SUB", "Open", True
    AddQBMethod "SUB", "Paint", False
    AddQBMethod "SUB", "Play", True
    AddQBMethod "FUNCTION", "Point", False
    AddQBMethod "FUNCTION", "Pos", False
    AddQBMethod "SUB", "PReset", False
    AddQBMethod "SUB", "Print", True
    AddQBMethod "SUB", "?", True
    AddQBMethod "SUB", "PSet", False
    AddQBMethod "SUB", "Put", False
    AddQBMethod "SUB", "Randomize", False
    AddQBMethod "SUB", "Restore", False
    AddQBMethod "FUNCTION", "Right$", False
    AddQBMethod "FUNCTION", "RTrim$", False
    AddQBMethod "SUB", "Read", False
    AddQBMethod "SUB", "RmDir", False
    AddQBMethod "FUNCTION", "Rnd", False
    AddQBMethod "FUNCTION", "Screen", False
    AddQBMethod "SUB", "Screen", False
    AddQBMethod "FUNCTION", "Seek", False
    AddQBMethod "SUB", "Seek", False
    AddQBMethod "FUNCTION", "Sgn", False
    AddQBMethod "FUNCTION", "Sin", False
    AddQBMethod "SUB", "Sleep", True
    AddQBMethod "SUB", "Sound", True
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
    AddQBMethod "SUB", "Write", True

    ' QBJS-only language features
    ' --------------------------------------------------------------------------------
    AddQBMethod "SUB", "IncludeJS", True

    AddNativeMethod "FUNCTION", "JSON.Parse", "JSON.parse", False
    AddNativeMethod "FUNCTION", "JSON.Stringify", "JSON.stringify", False

    ' Undocumented at present
    AddSystemType "FETCHRESPONSE", "ok:INTEGER,status:INTEGER,statusText:STRING,text:STRING"
    AddQBMethod "FUNCTION", "Fetch", True
    AddQBMethod "SUB", "Fetch", True

End Sub
