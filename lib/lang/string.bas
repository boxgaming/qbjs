Import Sys From "./system.bas"
Import JSArray From "./array.bas"
Option Explicit

Export FormatUsing, EndsWith, Includes, Match, PadEnd, PadStart
Export Replace, Search, Split, StartsWith, TrimEnd, TrimStart

Function EndsWith (s As String, searchStr As String)
    s = Sys.ToString(s)
    EndsWith = Sys.ToBoolean(Sys.Call(s.endsWith, s, searchStr))
End Function

Function FormatUsing
$If Javascript Then
    return QB.formatUsing.apply(QB, arguments);
$End If
End Function

Function Includes (s As String, searchStr As String)
    s = Sys.ToString(s)
    Includes = Sys.ToBoolean(Sys.Call(s.includes, s, searchStr))
End Function

Function Match (s As String, regex As String, g As Object)
    s = Sys.ToString(s)
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
    s = Sys.ToString(s)
    result = Match(s, regex, g)
End Function

Function PadEnd (s As String, targetLength As Integer, padStr As String)
    s = Sys.ToString(s)
    PadEnd = Sys.Call(s.padEnd, s, targetLength, padStr)
End Function

Function PadStart (s As String, targetLength As Integer, padStr As String)
    s = Sys.ToString(s)
    PadStart = Sys.Call(s.padStart, s, targetLength, padStr)
End Function

Function Replace (s As String, searchStr As String, replaceStr As String, regex As Integer)
    s = Sys.ToString(s)
    If regex Then
        Replace = Sys.Call(s.replace, s, Sys.Construct("RegExp", searchStr, "g"), replaceStr)
    Else
        Replace = Sys.Call(s.replaceAll, s, searchStr, replaceStr)
    End If
End Function

Function Search (s As String, regex As String)
    s = Sys.ToString(s)
    Search = Sys.Call(s.search, s, Sys.Contstruct("RegExp", regex, "g")) + 1
End Function

Function Split (s As String, delimiter As String, regex As Integer)
    s = Sys.ToString(s)
    If delimiter = undefined Then delimiter = ","
    Dim jsresult As Object
    If regex Then
        jsresult = Sys.Call(s.split, s, Sys.Construct("RegExp", delimiter, "g"))
    Else
        jsresult = Sys.Call(s.split, s, delimiter)
    End If
    Split = JSArray.ToQBArray(jsresult)
End Function

Sub Split (s As String, delimiter As String, result() As String, regex As Integer)
    s = Sys.ToString(s)
    Split = Split(s, delimiter, regex)
End Sub

Function StartsWith (s As String, searchStr As String)
    s = Sys.ToString(s)
    StartsWith = Sys.ToBoolean(Sys.Call(s.startsWith, s, searchStr))
End Function

Function TrimEnd (s As String)
    s = Sys.ToString(s)
    TrimEnd = Sys.Call(s.trimEnd, s)
End Function

Function TrimStart (s As String)
    s = Sys.ToString(s)
    TrimStart = Sys.Call(s.trimStart, s)
End Function