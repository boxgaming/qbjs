Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import FS From "lib/io/fs.bas"
Import UT From "lib/test/unit-test.bas"

Dim ts: ts = Sys.TimeInMillis
Dim CRLF As String: CRLF = Chr$(13) + Chr$(10)

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

Open "test.txt" For Output As #1
Print #1, ""
Print #1, "second line"
Close #1
Dim st As String
Open "test.txt" For Input As #1
Input #1, st
Print st
UT.AssertEquals st, ""
Close #1
Kill "test.txt"

MkDir "foo"
UT.AssertTrue _DirExists("foo")
UT.AssertTrue _DirExists("foo/")
RmDir "foo"
MkDir "test/"
UT.AssertTrue _DirExists("test")
UT.AssertTrue _DirExists("test///")
RmDir "test"

Console.Echo "QB File I/O - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"