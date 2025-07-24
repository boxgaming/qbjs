Export EndsWith, Includes, Match, PadEnd, PadStart, Replace
Export Search, Split, StartsWith, TrimEnd, TrimStart

Function EndsWith (s As String, searchStr As String)
    $If Javascript Then
        EndsWith = QB.toBoolean(s.endsWith(searchStr));
    $End If
End Function

Function Includes (s As String, searchStr As String)
    $If Javascript Then
        Includes = QB.toBoolean(s.includes(searchStr));
    $End If
End Function

Sub Match (s As String, regex As String, result() As String, g As Object)
    Dim jsresult As Object
    $If Javascript Then
        if (g == undefined) { g = 0; }
        jsresult = [];
        var matches = s.matchAll(new RegExp(regex, "g"));
        for (m of matches) {
            var value = null;
            if (typeof g == "string") { value = m.groups[g]; }
            else { value = m[g]; }
            if (value) { jsresult.push(value); }
        }
    $End If
    ToQBArray jsresult, result
End Function

Function PadEnd (s As String, targetLength As Integer, padStr As String)
    $If Javascript Then
        PadEnd = s.padEnd(targetLength, padStr);
    $End If
End Function

Function PadStart (s As String, targetLength As Integer, padStr As String)
    $If Javascript Then
        PadStart = s.padStart(targetLength, padStr);
    $End If
End Function

Function Replace (s As String, searchStr As String, replaceStr As String, regex As Integer)
    $If Javascript Then
        if (regex) {
            Replace = s.replace(new RegExp(searchStr, "g"), replaceStr);
        }
        else {
            Replace = s.replaceAll(searchStr, replaceStr);
        }
    $End If
End Function

Sub ToQBArray (jsArray As Object, result() As String)
    Dim i, part As String
    If jsArray Then
        ReDim result(jsArray.length) As String
        For i = 1 To jsArray.length
            $If Javascript Then
                part = jsArray[i-1];
            $End If
            result(i) = part
        Next i
    Else
        ReDim result(0) As String
    End If
End Sub

Function Search(s As String, regex As String)
    $If Javascript Then
        Search = s.search(new RegExp(regex, "g")) + 1;
    $End If
End Function

Sub Split (s As String, delimiter As String, result() As String, regex As Integer)
    Dim jsresult As Object
    $If Javascript Then
        if (regex) {
            jsresult = s.split(new RegExp(delimiter, "g"));
        }
        else {
            jsresult = s.split(delimiter);
        }
    $End If
    ToQBArray jsresult, result
End Sub

Function StartsWith (s As String, searchStr As String)
    $If Javascript Then
        StartsWith = QB.toBoolean(s.startsWith(searchStr));
    $End If
End Function

Function TrimEnd (s As String)
    $If Javascript Then
        TrimEnd = s.trimEnd();
    $End If
End Function

Function TrimStart (s As String)
    $If Javascript Then
        TrimStart = s.trimStart();
    $End If
End Function