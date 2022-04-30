Const LOCAL = "LOCAL"
Const SESSION = "SESSION"

Export LOCAL, SESSION
Export Clear, Get, Key, Length, Set, Remove

$If Javascript Then
function _storage(stype) {
    return (stype == SESSION) ? sessionStorage : localStorage;
}
$End If

Sub Clear (stype)
$If Javascript Then
    _storage(stype).clear();
$End If
End Sub

Function Get (key, stype)
$If Javascript Then
    Get = _storage(stype).getItem(key);
$End If
End Function

Function Key (idx, stype)
$If Javascript Then
    Key = _storage(stype).key(idx);
$End If
End Function

Function Length (stype)
$If Javascript Then
    Length = _storage(stype).length;
$End If
End Function

Sub Set (key, value, stype)
$If Javascript Then
    _storage(stype).setItem(key, value);
$End If
End Sub

Sub Remove (key, stype)
$If Javascript Then
    _storage(stype).removeItem(key);
$End If
End Sub