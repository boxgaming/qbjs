Option Explicit
Export Assign, Create, GetProperty, HasProperty, Keys, SetProperty, DeleteProperty

Sub Assign (target As Object, source As Object)
$If Javascript Then
    Object.assign(target, source);
$End If
End Sub

Function Create (proto As Object)
$If Javascript Then
    return Object.create(proto);
$End If
End Sub

Function GetProperty (obj As Object, pname As String)
$If Javascript Then
    return obj[pname];
$End If
End Function

Function HasProperty (obj As Object, pname As String)
$If Javascript Then
    return (obj[pname] != undefined) ? -1 : 0;
$End If
End Function

Function Keys (obj As Object)
    Dim k As Object
$If Javascript Then
    k = Object.keys(obj);
$End If
    Dim i As Integer
    Dim results(k.length) As Object
    For i = 0 To k.length - 1
        results(i+1) = k[i]
    Next i
    Keys = results
End Function

Sub SetProperty (obj As Object, pname As String, pvalue As Object)
$If Javascript Then
    obj[pname] = pvalue;
$End If
End Sub

Sub DeleteProperty (obj As Object, pname As String)
$If Javascript Then
    delete obj[pname];
$End If
End Sub