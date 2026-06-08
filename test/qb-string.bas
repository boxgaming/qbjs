Import UT From "lib/test/unit-test.bas"
Import Console From "lib/web/console.bas"
Import Sys From "lib/lang/system.bas"

Dim ts: ts = Sys.TimeInMillis

'ASC 
UT.AssertEquals Asc("ABC"), 65
UT.AssertEquals Asc("ABC", 2), 66

''ASC (statement) - not implemented

'HEX$
UT.AssertEquals Hex$(8), "8"
UT.AssertEquals Hex$(15), "F"
UT.AssertEquals Hex$(16), "10"
UT.AssertEquals Hex$(13.2), "D"
UT.AssertEquals Hex$(13.5), "E"
UT.AssertEquals Hex$(234), "EA"
' Negative values do not match QB64
UT.AssertEquals Hex$(-234), "-EA"    ' QB64: FF16

'INSTR
UT.AssertEquals InStr$("foobar", "foo"), 1
UT.AssertEquals InStr$("foobar", "bar"), 4
UT.AssertEquals InStr$("foobar", "no"), 0

'LCASE$
UT.AssertEquals LCase$("ABCabc#!345XxYyZz"), "abcabc#!345xxyyzz"

'LEFT$
UT.AssertEquals Left$("The quick brown fox...", 3), "The"
UT.AssertEquals Left$("The quick brown fox...", 200), "The quick brown fox..."
UT.AssertEquals Left$("The quick brown fox...", 0), ""

'LEN
UT.AssertEquals Len(""), 0
UT.AssertEquals Len("This is a test string"), 21

''LSET - not implemented

'LTRIM$
UT.AssertEquals LTrim$("  Test string  "), "Test string  "

'MID$ (function)
UT.AssertEquals Mid$("The quick brown fox...", 1, 3), "The"
UT.AssertEquals Mid$("The quick brown fox...", 5, 5), "quick"
UT.AssertEquals Mid$("The quick brown fox...", 17), "fox..."

'MID$ (statement)
s$ = "The quick brown fox jumped over the lazy dog."
Mid$(s$, 5, 5) = "slow" 
UT.AssertEquals s$, "The slow brown fox jumped over the lazy dog."
Mid$(s$, 20) = "took a nap."
UT.AssertEquals s$, "The slow brown fox took a nap."
Mid$(s$, 10, 9) = "ape"
UT.AssertEquals s$, "The slow ape took a nap."
Mid$(s$, 10, 3) = "catalog"
UT.AssertEquals s$, "The slow cat took a nap."

' TODO: implement tests for the remaining keywords
'MKD$
''MKDMBF$ (function) - not implemented
'MKI$
'MKL$
'MKS$
''MKSMBF$ (function) - not implemented

'OCT$
UT.AssertEquals Oct$(8), "10"
UT.AssertEquals Oct$(15), "17"
UT.AssertEquals Oct$(16), "20"
UT.AssertEquals Oct$(13.2), "15"
UT.AssertEquals Oct$(13.5), "16"
UT.AssertEquals Oct$(234), "352"
' Negative values do not match QB64
UT.AssertEquals Oct$(-234), "-352"    ' QB64: 177426

'RIGHT$
UT.AssertEquals Right$("The quick brown fox...", 3), "..."
UT.AssertEquals Right$("The quick brown fox...", 200), "The quick brown fox..."
UT.AssertEquals Right$("The quick brown fox...", 0), ""

'- RSET (statement) - not implemented

'RTRIM$
UT.AssertEquals RTrim$("  Test string  "), "  Test string"

'SPACE$
UT.AssertEquals Space$(10), "          "

'STR$
UT.AssertEquals Str$(3), " 3"
UT.AssertEquals Str$(5.23), " 5.23"
UT.AssertEquals Str$(-23.789), "-23.789"

'STRING$
UT.AssertEquals String$(10, " "), "          "
UT.AssertEquals String$(5, "!"), "!!!!!"
UT.AssertEquals String$(3, 42), "***"
UT.AssertEquals String$(6, 1), ""

'SWAP
a$ = "one": b$ = "two": anum = 1: bnum = 2
SWAP a$, b$
UT.AssertEquals a$, "two"
UT.AssertEquals b$, "one"
SWAP anum, bnum
UT.AssertEquals anum, 2
UT.AssertEquals bnum, 1

'UCASE$
UT.AssertEquals UCase$("ABCabc#!345XxYyZz"), "ABCABC#!345XXYYZZ"

'VAL
UT.AssertEquals Val("23.4"), 23.4
UT.AssertEquals Val("9382"), 9382
UT.AssertEquals Val("&O123"), 83
UT.AssertEquals Val("&HF3B8"), 62392
UT.AssertEquals Val("&hf3b8"), 62392
UT.AssertEquals Val("&B0110010"), 50
' QBJS ignores the second type parameter
'UT.AssertEquals Val("32.456", Integer), 32
'UT.AssertEquals Val("32.456", Long), 32

' TODO: implement tests for the remaining keywords
'_CLIPBOARD$ (function) returns the current STRING contents of the system Clipboard.
'_CLIPBOARD$ (statement) sets the STRING contents of the current system Clipboard.
'_CONTROLCHR (statement) OFF allows the control characters to be used as text characters. ON(default) can use them as commands.
'_CONTROLCHR (function) returns the current state of _CONTROLCHR as 1 when OFF and 0 when ON.
'_CV (function) used to convert _MK$ ASCII string values to numerical values.
'_MK$ (function) converts any numerical type into an ASCII string value that must be converted back using _CV.
'_STRCMP (function) compares the relationship between two strings.
'_STRICMP (function) compares the relationship between two strings, without regard for case-sensitivity.

'_TRIM
UT.AssertEquals _Trim$("  Test string  "), "Test string"

Console.Echo "QB String Keyword - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"