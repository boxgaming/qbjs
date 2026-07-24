Export AssertEquals, AssertTrue, AssertFalse, AssertError

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

Sub AssertError (testMethod, errorMsg)
$If Javascript Then
    var errorThrown = false;
    var actualMsg = "";
    try {
        await testMethod();
    }
    catch (e) {
        errorThrown = true;
        console.log(e);
        actualMsg = e.message;
    }
    if (!errorThrown) {
        throw Object.assign(new Error("Expected error was not thrown."), { _stackDepth: 1 });
    }
    else {
        if (errorMsg != undefined) {
            if (errorMsg != actualMsg) {
                throw Object.assign(new Error("Error message [" + actualMsg + "] does not match expected [" + errorMsg + "]."), { _stackDepth: 1 });
            }
        }
    }
$End If
End Sub