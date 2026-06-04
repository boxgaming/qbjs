Import Sys From "lib/lang/system.bas"
Import JSArray From "lib/lang/array.bas"
Option Explicit

Export EndsWith, Includes, Match, PadEnd, PadStart, Replace
Export Search, Split, StartsWith, TrimEnd, TrimStart

Function EndsWith (s As String, searchStr As String)
    EndsWith = Sys.ToBoolean(Sys.Call(s.endsWith, s, searchStr))
End Function

Function Includes (s As String, searchStr As String)
    Includes = Sys.ToBoolean(Sys.Call(s.includes, s, searchStr))
End Function

Function Match (s As String, regex As String, g As Object)
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
    Match = JSArray.ToQBArray(jsresult)
End Function

Sub Match (s As String, regex As String, result() As String, g As Object)
    result = Match(s, regex, g)
End Function

Function PadEnd (s As String, targetLength As Integer, padStr As String)
    PadEnd = Sys.Call(s.padEnd, s, targetLength, padStr)
End Function

Function PadStart (s As String, targetLength As Integer, padStr As String)
    PadStart = Sys.Call(s.padStart, s, targetLength, padStr)
End Function

Function Replace (s As String, searchStr As String, replaceStr As String, regex As Integer)
    If regex Then
        Replace = Sys.Call(s.replace, s, Sys.InstanceOf("RegExp", searchStr, "g"), replaceStr)
    Else
        Replace = Sys.Call(s.replaceAll, s, searchStr, replaceStr)
    End If
End Function

Function Search (s As String, regex As String)
    Search = Sys.Call(s.search, s, Sys.InstanceOf("RegExp", regex, "g")) + 1
End Function

Function Split (s As String, delimiter As String, regex As Integer)
    If delimiter = undefined Then delimiter = ","
    Dim jsresult As Object
    If regex Then
        jsresult = Sys.Call(s.split, s, Sys.InstanceOf("RegExp", delimiter, "g"))
    Else
        jsresult = Sys.Call(s.split, s, delimiter)
    End If
    Split = JSArray.ToQBArray(jsresult)
End Function

Sub Split (s As String, delimiter As String, result() As String, regex As Integer)
    Split = Split(s, delimiter, regex)
End Sub

Function StartsWith (s As String, searchStr As String)
    StartsWith = Sys.ToBoolean(Sys.Call(s.startsWith, s, searchStr))
End Function

Function TrimEnd (s As String)
    TrimEnd = Sys.Call(s.trimEnd, s)
End Function

Function TrimStart (s As String)
    TrimStart = Sys.Call(s.trimStart, s)
End Function