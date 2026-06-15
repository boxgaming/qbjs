Import UT From "lib/test/unit-test.bas"
Import Console From "lib/web/console.bas"
Import Sys From "lib/lang/system.bas"
'$Include: 'lib/compatibility/qb64pe.bi'

Dim ts: ts = Sys.TimeInMillis

b64$ = _Base64Encode$("This is a test string.")
UT.AssertEquals b64$, "VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg=="
UT.AssertEquals _Base64Decode$(b64$), "This is a test string."

UT.AssertEquals _Clamp(45, 50, 100), 50
UT.AssertEquals _Clamp(72, 50, 100), 72
UT.AssertEquals _Clamp(101, 50, 100), 100

url$ = _EncodeURL("http://somewhere.com?foo=two words&bar=more spaces here")
UT.AssertEquals url$, "http://somewhere.com?foo=two%20words&bar=more%20spaces%20here"
UT.AssertEquals _DecodeURL(url$), "http://somewhere.com?foo=two words&bar=more spaces here"

UT.AssertEquals _IIF(9 > 8, "nine", "eight"), "nine"
UT.AssertEquals _IIF("same" <> "same", "YES!", "NO!"), "NO!"
UT.AssertEquals _IIF(1 = 1, "identity", "fail"), "identity"

UT.AssertEquals _LogMinLevel, 2
'_LogError "This is an error"
'_LogWarn "This is a warning"
'_LogInfo "This is informational"
'_LogTrace "this is a trace message - it should not appear"
_LogMinLevel 4
UT.AssertEquals _LogMinLevel, 4
'_LogTrace "this trace message should actually appear"

UT.AssertEquals _Max(23, 54), 54
UT.AssertEquals _Max(82.5, -3.129), 82.5
UT.AssertEquals _Min(23, 54), 23
UT.AssertEquals _Min(82.5, -3.129), -3.129

For i = 100 To 50 Step -10: Circle (200, 200), i, 14: Next i
_SaveImage "test.png"
UT.AssertTrue _FileExists("test.png")
Kill "test.png"
Cls

UT.AssertEquals _ToStr$(23.4), "23.4"

_WriteFile "test.txt", "This is a test text file."
UT.AssertTrue _FileExists("test.txt")
UT.AssertEquals _ReadFile("test.txt"), "This is a test text file."
Kill "test.txt"

UT.AssertEquals _UFontHeight(16), 16
UT.AssertEquals _UPrintWidth("Test String"), 88

Console.Echo "lib/compatibility/qb64pe - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"