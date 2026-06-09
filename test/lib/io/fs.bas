Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import UT From "lib/test/unit-test.bas"
Import FS From "lib/io/fs.bas"

Dim ts: ts = Sys.TimeInMillis

UT.AssertEquals FS.GetParentPath("/foo/bar/myfile.txt"), "/foo/bar"
UT.AssertEquals FS.GetParentPath("c:\windows\system32\virus.exe"), "/windows/system32"
UT.AssertEquals FS.GetParentPath("\\gameserver01\freestuff\doom.exe"), "/gameserver01/freestuff"

UT.AssertEquals FS.GetFilename("/foo/bar/myfile.txt"), "myfile.txt"
UT.AssertEquals FS.GetFilename("c:\windows\system32\virus.exe"), "virus.exe"
UT.AssertEquals FS.GetFilename("\\gameserver01\freestuff\doom.chm"), "doom.chm"

UT.AssertEquals FS.NormalizePath("/test/foo/myfile.bas"), "/test/foo/myfile.bas"
UT.AssertEquals FS.NormalizePath("c:\test\foo\myfile.bas"), "c:/test/foo/myfile.bas"
UT.AssertEquals FS.NormalizePath("/test/foo/./myfile.bas"), "/test/foo/myfile.bas"
UT.AssertEquals FS.NormalizePath("test/foo/.././../monkey/myfile.bas"), "monkey/myfile.bas"
UT.AssertEquals FS.NormalizePath("http://test/./foo/../monkey/myfile.bas"), "http://test/monkey/myfile.bas"
UT.AssertEquals FS.NormalizePath("https://foo.org/bar/../bleh/./moo.txt"), "https://foo.org/bleh/moo.txt"

' TODO: Add tests for following methods
' FS.ListDirectory
' FS.UploadFile
' FS.ReadText
' FS.WriteText

Console.Echo "lib/io/fs - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"