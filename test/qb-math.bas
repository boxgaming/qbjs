Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import UT From "lib/test/unit-test.bas"

Dim ts: ts = Sys.TimeInMillis

UT.AssertEquals Abs(25), 25
UT.AssertEquals Abs(-25), 25
UT.AssertEquals Abs(34.56), 34.56
UT.AssertEquals Abs(-34.56), 34.56

' More digits of precision than QB64
UT.AssertEquals Atn(2), 1.1071487177940904     ' QB64: 1.107149
UT.AssertEquals Atn(-1.5), -0.982793723247329  ' QB64: -.9827937

' Does not equal QB64 result
'UT.AssertEquals CDbl(3.1256487985479845621), 3.125648798547985

UT.AssertEquals CInt(3980.39020883), 3980
UT.AssertEquals CInt(3980.59020883), 3981
UT.AssertEquals CLng(3980.39020883), 3980
UT.AssertEquals CLng(3980.59020883), 3981

' More digits of precision than QB64
UT.AssertEquals Cos(2),  -0.4161468365471424   ' QB64: -.4161468
UT.AssertEquals Cos(-1.25), 0.3153223623952687 ' QB64: .3153224

' This method only returns the orignial value
'UT.AssertEquals CSng(975.341222), 975.3412

' More digits of precision than QB64
UT.AssertEquals Exp(7), 1096.6331584284585     ' QB64: 1096.633    

UT.AssertEquals Fix(23.2319), 23
UT.AssertEquals Fix(23.98), 23
UT.AssertEquals Fix(-3.2), -3
UT.AssertEquals Fix(-3.67), -3

UT.AssertEquals Int(23.2319), 23
UT.AssertEquals Int(23.98), 23
UT.AssertEquals Int(-3.2), -4
UT.AssertEquals Int(-3.67), -4

' More digits of precision than QB64
UT.AssertEquals Log(1), 0
UT.AssertEquals Log(2.1), 0.7419373447293773   ' QB64: .7419373

' More digits of precision than QB64
UT.AssertEquals Sin(0), 0
UT.AssertEquals Sin(1), 0.8414709848078965     ' QB64: .841471
UT.AssertEquals Sin(1.45), 0.9927129910375885  ' QB64: .992713

' More digits of precision than QB64
UT.AssertEquals Sqr(9), 3
UT.AssertEquals Sqr(8), 2.8284271247461903     ' QB64: 2.828427

' More digits of precision than QB64
UT.AssertEquals Tan(1),   1.5574077246549023   ' QB64: 1.557408
UT.AssertEquals Tan(3.4), 0.26431690086742515  ' QB64: .2643169

UT.AssertEquals _Round(1.49), 1
UT.AssertEquals _Round(1.5), 2
UT.AssertEquals _Round(-1.49), -1
UT.AssertEquals _Round(-1.5), -2

Console.Echo "QB Math Keyword tests completed with no errors in " + (Sys.TimeInMillis - ts) + " millisecond(s)"