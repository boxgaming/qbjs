Export At,  Clear, Concat,  Create, Every, Fill, Filter, IndexOf,
Export Insert, Item, IsJSArray, IsQBArray, Join, LastIndexOf, Length 
Export Pop, Push As Add, Push, Reduce, ReduceRight, Remove, Reverse
Export Shift, Slice, Sort, Splice, Unshift, ToQBArray 

Function At (a As Object, index As Integer)
$If Javascript Then
    return a.at(index);
$End If
End Function

Sub Clear (a As Object)
    a.length = 0
End Sub

Function Concat (a As Object)
    Dim As Integer i, j, isArray
    For j = 1 To arguments.length - 1
        a2 = arguments[j]
        If IsJSArray(a2) Then
$If Javascript Then
            a = a.concat(a2);
$End If
        ElseIf a2._dimensions Then
            Dim i As Integer
            For i = 1 To UBound(a2)
                Push a, a2(i)
            Next i
        Else 
            Push a, a2
        End If
    Next i
    Concat = a
End Function

Function Create 
    Dim i As Integer
    Dim a As Object: a = []
    For i = 0 To arguments.length-1
        a2 = arguments[i];
        a = Concat(a, a2)
    Next i
    Create = a
End Function

Function Every (a As Object, fn As Function)
    fn = PrepareCallback(fn)
$If Javascript Then
    return QB.toBoolean(a.every(fn));    
$End If
End Function

Function Fill (a As Object, value, start, end)
$If Javascript Then
    return a.fill(value, start, end);
$End If
End Function

Function Filter (a As Object, fn As Function)
    fn = PrepareCallback(fn)
$If Javascript Then
    return a.filter(fn);
$End If
End Function

Function IndexOf (a As Object, searchElement, fromIndex)
$If Javascript Then
    return a.indexOf(searchElement, fromIndex);
$End If
End Function

Function IsJSArray (a)
$If Javascript Then
    return QB.toBoolean(Array.isArray(a));
$End If
End Function

Function IsQBArray (a)
    Dim result As Integer
    If a._dimensions Then result = -1
    IsQBArray = result
End Function

Sub Insert (a As Object, index As Integer)
$If Javascript Then
    var values = Array.from(arguments).slice(2);
    a.splice(index, 0, values);
$End If
End Sub

Function Item (a As Object, index As Integer)
$If Javascript Then
    return a[index];
$End If
End Function

Function Join (a As Object, separator)
$If Javascript Then
    return a.join(separator);
$End If    
End Function

Function LastIndexOf (a As Object, searchElement, fromIndex)
$If Javascript Then
    if (fromIndex == undefined) { fromIndex = a.length; }
    return a.lastIndexOf(searchElement, fromIndex);
$End If
End Function

Function Length (a As Object)
    Length = 0
    If a.length Then Length = a.length
End Function

Function Pop (a As Object)
$If Javascript Then
    return a.pop();
$End If
End Function

Sub Push (a As Object)
    Dim i As Integer
    For i = 1 To arguments.length - 1
$If Javascript Then
        a.push(arguments[i]);
$End If
    Next i
End Sub

Function Reduce (a As Object, fn As Function, initialValue)
    fn = PrepareCallback(fn)
$If Javascript Then
    if (initialValue == undefined) { 
        return a.reduce(fn);
    }
    else {
        return a.reduce(fn, initialValue);
    }
$End If
End Function

Function ReduceRight (a As Object, fn As Function, initialValue)
    fn = PrepareCallback(fn)
$If Javascript Then
    if (initialValue == undefined) { 
        return a.reduceRight(fn);
    }
    else {
        return a.reduceRight(fn, initialValue);
    }
$End If
End Function

Sub Remove (a As Object, start, deleteCount)
    If deleteCount = undefined Then deleteCount = 1
$If Javascript Then
    a.splice(start, deleteCount);
$End If
End Sub

Sub Reverse (a As Object)
$If Javascript Then
    a.reverse();
$End If
End Sub

Function Shift (a As Object)
$If Javascript Then
    return a.shift();
$End If
End Function

Function Slice (a, start, end)
$If Javascript Then
    return a.slice(start, end);
$End If
End Function

Sub Sort (a As Object, sortFn As Function)
    If sortFn <> undefined Then sortFn = PrepareCallback(sortFn)
$If Javascript Then
    a.sort(sortFn);
$End If
End Sub

Sub Splice (a As Object, index As Integer, deleteCount)
$If Javascript Then
    var values = Array.from(arguments).slice(3);
    a.splice(index, deleteCount, values);
$End If
End Sub

Sub Unshift (a As Object)
    Dim i As Integer
    For i = arguments.length - 1 To 1 Step -1
$If Javascript Then
        a.unshift(arguments[i]);
$End If
    Next i
End Sub

Function ToQBArray (a As Object)
    Dim qbArray(a.length)
    Dim i As Integer
    For i = 1 To a.length
        qbArray(i) = a[i-1]
    Next i
    ToQBArray = qbArray
End Function

Function PrepareCallback (fn As Function)
$If Javascript Then
    var fs = fn.toString();
    var pstart = fs.indexOf("(")
    var pend = fs.indexOf(")")
    var paramstr = fs.substring(pstart+1, pend-1);
    var params = paramstr.split(",");
    for (var i=0; i < params.length; i++) {
        var idx = params[i].indexOf("/");
        params[i] = params[i].substring(0, idx);
    }
    var bstart = fs.indexOf("{");
    var bend = fs.lastIndexOf("}");
    var body = fs.substring(bstart+1, bend-1);
    if      (params.length == 1) { return new Function(params[0], body); }
    else if (params.length == 2) { return new Function(params[0], params[1], body); }
    else if (params.length == 3) { return new Function(params[0], params[1], params[2], body); }
    else if (params.length == 4) { return new Function(params[0], params[1], params[2], params[3], body); }
$End If
End Function