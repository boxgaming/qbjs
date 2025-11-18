Const LOCAL = "LOCAL"
Const SESSION = "SESSION"

Export LOCAL, SESSION
Export Clear, Get, Key, Length, Set, Remove

Sub Clear (stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    $If Javascript Then
        storage.clear();
    $End If
End Sub

Function Get (key As String, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    $If Javascript Then
        var result = storage.getItem(key);
        if (result == null) { result = ""; }
        Get = result
    $End If
End Function

Function Key (idx As Integer, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    $If Javascript Then
        Key = storage.key(idx);
    $End If
End Function

Function Length (stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    $If Javascript Then
        Length = storage.length;
    $End If
End Function

Sub Set (key As String, value As String, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    $If Javascript Then
        storage.setItem(key, value);
    $End If
End Sub

Sub Remove (key As String, stype As String)
    Dim storage As Object: storage = GetStorage(stype)
    $If Javascript Then
        storage.removeItem(key);
    $End If
End Sub

Function GetStorage(stype As String)
    Dim storage As Object
    $If Javascript Then
        GetStorage = (stype == SESSION) ? sessionStorage : localStorage;
    $End If
End Function