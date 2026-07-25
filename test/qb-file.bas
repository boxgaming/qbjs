Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import FS From "lib/io/fs.bas"
Import UT From "lib/test/unit-test.bas"

Dim ts: ts = Sys.TimeInMillis
Dim CRLF As String
$If JavaScript Then
    CRLF = "\r\n"
$End If

Open "test.txt" For Output As #1
Print #1, "This is a test"; "."
Close #1
UT.AssertEquals FS.ReadText("test.txt"), "This is a test." + CRLF
Kill "test.txt"

Open "test.txt" For Output As #1
Print #1, 3;
Close #1
UT.AssertEquals FS.ReadText("test.txt"), " 3 "
Kill "test.txt"

Open "test.txt" For Output As #1
Print #1, "n="; 42;
Close #1
UT.AssertEquals FS.ReadText("test.txt"), "n= 42 "
Kill "test.txt"

Open "test.txt" For Output As #1
Print #1, "This is the first line."
Print #1, "This is the second line."
Close #1
Dim st As String
Open "test.txt" For Input As #1
Line Input #1, st
Close #1
UT.AssertEquals st, "This is the first line."
Kill "test.txt"

Console.Echo "QB File I/O - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"