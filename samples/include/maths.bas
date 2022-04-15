Export increment As Plus1
Export factorial AS Factorial

Function increment (num)
    increment = num + 1
End Function

Function factorial (num)
    Dim res
    $If Javascript Then
        if (num === 0 || num === 1) {
            num = 1;
        }
        else {
            for (var i = num - 1; i >= 1; i--) {
                num *= i;
            }
       }
    $End If 
    factorial = num
End Function