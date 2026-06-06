Option Explicit
Export Await, Call, InstanceOf, IsRunning, SetTimeout, TypeOf, TimeInMillis
Export ToFloat, ToInteger, ToBoolean, ToString

Function Await (fn, thisArg)
$If Javascript Then
    return await fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
$End If
End Function

Sub Await (fn, thisArg)
$If Javascript Then
    await fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
$End If
End Sub

Function Call (fn, thisArg)
$If Javascript Then
    return fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
$End If
End Function

Sub Call (fn, thisArg)
$If Javascript Then
    fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
$End If
End Sub

Function InstanceOf (className)
$If Javascript Then
    return Reflect.construct(globalThis[className], Array.prototype.slice.call(arguments, 1));
$End If
End Function

Function TypeOf (o)
$If Javascript Then
    return typeof o;
$End If
End Function

Function IsRunning
$If Javascript Then
    return QB.toBoolean(QB.running());
$End If
End Function

Sub SetTimeout (fnCallback As Sub, millis As Integer)
    $If Javascript Then
        setTimeout(fnCallback, millis);
    $End If
End Sub

Function TimeInMillis
$If Javascript Then
    return Date.now();
$End If
End Function

Function ToInteger (value) 
$If Javascript Then
    var result = parseInt(value);
    if (isNaN(result)) {
        result = 0;
    }
    return result;
$End If
End Function

Function ToFloat (value)
$If Javascript Then 
    var result = parseFloat(value);
    if (isNaN(result)) {
        result = 0;
    }
    return result;
$End If
End Function

Function ToBoolean (value)
$If Javascript Then 
    return value ? -1 : 0;
$End If
End Function

Function ToString (value)
$If Javascript Then
    return `${value}`;
$End If
End Function