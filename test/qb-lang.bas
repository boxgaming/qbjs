Import UT From "lib/test/unit-test.bas"
Import Console From "lib/web/console.bas"
Import Sys From "lib/lang/system.bas"

Dim ts: ts = Sys.TimeInMillis

UT.AssertTrue -1 EQV -1
UT.AssertFalse -1 EQV 0
UT.AssertFalse 0 EQV -1
UT.AssertTrue 0 EQV 0

count = 0: For i = 1 To 12: count = count + 1: Next i
UT.AssertEquals count, 12
count = 0: For i = 26 To 1 Step -1: count = count + 1: Next i
UT.AssertEquals count, 26
count = 0: For i = 1 To 20 Step 5: count = count + 1: Next i
UT.AssertEquals count, 4
count = 0: For i = 20 To 1 Step -10: count = count + 1: Next i
UT.AssertEquals count, 2

st = 1: count = 0: For i = 1 To 12 Step st: count = count + 1: Next i
UT.AssertEquals count, 12
st = -1: count = 0: For i = 26 To 1 Step st: count = count + 1: Next i
UT.AssertEquals count, 26
st = 5: count = 0: For i=1 To 20 Step st: count = count + 1: Next i
UT.AssertEquals count, 4
st = -10: count = 0: For i = 20 To 1 Step st: count = count + 1: Next i
UT.AssertEquals count, 2

' value literal suffixes
UT.AssertEquals 5#, 5
UT.AssertEquals 100000&, 100000
UT.AssertEquals 3.5!, 3.5
UT.AssertEquals 42%, 42

' variable names containing periods (issue #159)
dot.a = 5
UT.AssertEquals dot.a, 5
dot.b.c = 7
UT.AssertEquals dot.b.c, 7
dot.1 = 9
UT.AssertEquals dot.1, 9
dot.name$ = "hi"
UT.AssertEquals dot.name$, "hi"
dot.int% = 2.6
UT.AssertEquals dot.int%, 3
dot.arr(3) = 11
UT.AssertEquals dot.arr(3), 11
Dim dot.dim As Integer
dot.dim = 4
UT.AssertEquals dot.dim, 4
sum.dot = 0: For dot.i = 1 To 3: sum.dot = sum.dot + dot.i: Next dot.i
UT.AssertEquals sum.dot, 6
UT.AssertEquals DotParam(4), 8
' custom type elements still take precedence once the variable is declared
Type DotType
    x As Integer
End Type
lang.x = 1
Dim lang As DotType
lang.x = 2
UT.AssertEquals lang.x, 2

Console.Echo "QB Language - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"

Function DotParam (dot.v)
    DotParam = dot.v * 2
End Function
