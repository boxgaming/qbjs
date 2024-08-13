Const LOCAL = "LOCAL"
Const SESSION = "SESSION"

Export LOCAL, SESSION
Export Clear, Get, Key, Length, Set, Remove

$If Javascript Then
    function _storage(stype) {
        return (stype == SESSION) ? sessionStorage : localStorage;
    }
$End If

Sub Clear (stype As String)
    $If Javascript Then
        _storage(stype).clear();
    $End If
End Sub

Function Get (key As String, stype As String)
    $If Javascript Then
        var result = _storage(stype).getItem(key);
        if (result == null) { result = ""; }
        Get = result
    $End If
End Function

Function Key (idx As Integer, stype As String)
    $If Javascript Then
        Key = _storage(stype).key(idx);
    $End If
End Function

Function Length (stype As String)
    $If Javascript Then
        Length = _storage(stype).length;
    $End If
End Function

Sub Set (key As String, value As String, stype As String)
    $If Javascript Then
        _storage(stype).setItem(key, value);
    $End If
End Sub

Sub Remove (key As String, stype As String)
    $If Javascript Then
        _storage(stype).removeItem(key);
    $End If
End Sub