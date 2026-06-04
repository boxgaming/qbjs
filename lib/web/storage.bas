Import Sys From "lib/lang/system.bas"

Const LOCAL = "LOCAL"
Const SESSION = "SESSION"

Export LOCAL, SESSION
Export Clear, Get, Key, Length, Set, Remove

Sub Clear (stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    Sys.Call storage.clear, storage
End Sub

Function Get (key As String, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    Dim result As String
    result = Sys.Call(storage.getItem, storage, key)
    If Negate result Then result = ""
    Get = result
End Function

Function Key (idx As Integer, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    Key = Sys.Call(storage.key, storage, idx)
End Function

Function Length (stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    Length = storage.length;
End Function

Sub Set (key As String, value As String, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    Sys.Call storage.setItem, storage, key, value
End Sub

Sub Remove (key As String, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    Sys.Call storage.removeItem, storage, key
End Sub

Function GetStorage(stype As String)
    Dim storage As Object
    If stype = SESSION Then GetStorage = sessionStorage Else GetStorage = localStorage
End Function