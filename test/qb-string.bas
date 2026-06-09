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

'MKD$ | CVD
UT.AssertEquals MKD$(23495.239810983), "M*YÏñÖ@"
UT.AssertEquals CVD("M*YÏñÖ@"), 23495.239810983

'MKDMBF$ | CVDMBF - not implemented

'MKI$ | CVI
UT.AssertEquals MKI$(12345), "90"
UT.AssertEquals CVI("90"), 12345
UT.AssertEquals CVI(MKI$(78.23)), 78

'MKL$ | CVL
UT.AssertEquals CVL(MKL$(33)), 33
UT.AssertEquals CVL(MKL$(398029890)), 398029890

'MKS$ | CVS
UT.AssertEquals CVS(MKS$(-1034)), -1034
sval = CVS(MKS$(27.432))
UT.AssertEquals _Round(sval * 1000) / 1000, 27.432
' slight difference in precision vs QB64
' QB64: 27.432  QBJS: 27.43199920654297

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


' QB64 Keywords
' -----------------------------------------------------------------
_Clipboard$ = "clipboard test text"
UT.AssertEquals _Clipboard$, "clipboard test text"

'_CONTROLCHR (statement) - not implemented
'_CONTROLCHR (function) - not implemented
'_CV (function) - not implemented
'_MK$ (function) - not implemented

'_STRCMP
UT.AssertEquals _StrCmp("ABCDE", "abcde"), -1
UT.AssertEquals _StrCmp("ABCDE", "12345"), 1
UT.AssertEquals _StrCmp("same", "same"), 0
UT.AssertEquals _StrCmp("XYZ", "ABC"), 1

'_STRICMP
UT.AssertEquals _StriCmp("ABCDE", "abcde"), 0 
UT.AssertEquals _StriCmp("ABCDE", "12345"), 1
UT.AssertEquals _StriCmp("same", "same"), 0
UT.AssertEquals _StriCmp("XYZ", "ABC"), 1

'_TRIM
UT.AssertEquals _Trim$("  Test string  "), "Test string"

Console.Echo "QB String Keyword - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"