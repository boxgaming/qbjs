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

Console.Echo "QB Language - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"