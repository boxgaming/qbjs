Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import FS From "lib/io/fs.bas"
Import UT From "lib/test/unit-test.bas"

Dim ts: ts = Sys.TimeInMillis
Dim c As Unsigned Integer
c = _RGBA(100, 200, 255, 100)

Circle (100, 100), 50, c
UT.AssertEquals _Alpha(c), 100
UT.AssertEquals _Alpha32(c), 100

Console.Echo "QB Graphics - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"