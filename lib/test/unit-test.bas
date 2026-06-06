Export AssertEquals, AssertTrue, AssertFalse

Sub AssertEquals (value1, value2)
$If Javascript Then
    if (value1 != value2) {
        throw Object.assign(new Error(value1 + " <> " + value2), { _stackDepth: 1 });
    }
$End If
End Sub

Sub AssertTrue (value)
$If Javascript Then
    if (!value) {
        throw Object.assign(new Error(value + " is not true"), { _stackDepth: 1 });
    }
$End If
End Sub

Sub AssertFalse (value)
$If Javascript Then
    if (value) {
        throw Object.assign(new Error(value + " is not false"), { _stackDepth: 1 });
    }
$End If
End Sub