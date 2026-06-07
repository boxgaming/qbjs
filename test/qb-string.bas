Import UT From "lib/test/unit-test.bas"
Import Console From "lib/web/console.bas"
Import Sys From "lib/lang/system.bas"

Dim ts: ts = Sys.TimeInMillis

'ASC 
UT.AssertEquals Asc("ABC"), 65
UT.AssertEquals Asc("ABC", 2), 66

' TODO: implement tests for the remaining keywords

''ASC (statement) - not implemented
'HEX$
'INSTR
'LCASE$
'LEFT$
'LEN
''LSET - not implemented
'LTRIM$
'MID$ (function)
'MID$ (statement)
'MKD$
''MKDMBF$ (function) - not implemented
'MKI$
'MKL$
'MKS$
''MKSMBF$ (function) - not implemented
'OCT$
'RIGHT$
'- RSET (statement) - not implemented
'RTRIM$
'SPACE$
'STR$
'STRING$
'SWAP
'UCASE$
'VAL

Console.Echo "QB String Keyword tests completed with no errors in " + (Sys.TimeInMillis - ts) + " millisecond(s)"