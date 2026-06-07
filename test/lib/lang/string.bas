Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import UT From "lib/test/unit-test.bas"
Import String From "lib/lang/string.bas"

Dim ts: ts = Sys.TimeInMillis

UT.AssertTrue String.EndsWith("foobar", "bar")
UT.AssertFalse String.EndsWith("foobar", "foo")

UT.AssertTrue String.Includes("foobar", "oba")
UT.AssertFalse String.Includes("foobar", "monkey")

ReDim results(0) As String
results = String.Match("foobar barfly nomatch", "bar")
UT.AssertEquals UBound(results), 2
UT.AssertEquals results(1), "bar"
UT.AssertEquals results(2), "bar"
results = String.Match("foobar barfly nomatch", "[^\s]*bar[^\s]*")
UT.AssertEquals UBound(results), 2
UT.AssertEquals results(1), "foobar"
UT.AssertEquals results(2), "barfly"
results = String.Match("|one|two|three|", "\|([a-z]+)", 1)
UT.AssertEquals UBound(results), 3
UT.AssertEquals results(1), "one"
UT.AssertEquals results(2), "two"
UT.AssertEquals results(3), "three"

UT.AssertEquals String.PadEnd("test", 8), "test    "
UT.AssertEquals String.PadEnd("test", 10, "0"), "test000000"

UT.AssertEquals String.PadStart("test", 8), "    test"
UT.AssertEquals String.PadStart("test", 10, "0"), "000000test"

UT.AssertEquals String.Replace("The quick brown fox...", "fox", "hippo"), "The quick brown hippo..."
UT.AssertEquals String.Replace("<body><h1>Header text</h1></body>", "<(\/)?h1>", "<$1h2>", -1), "<body><h2>Header text</h2></body>"

UT.AssertEquals String.Search("<html><body style='background-color:red'>Error page</body></html>", "<body.*>"), 7

results = String.Split("orange,red,blue,green")
UT.AssertEquals UBound(results), 4
UT.AssertEquals results(2), "red"
UT.AssertEquals results(4), "green"
results = String.Split("here is another  test", " ")
UT.AssertEquals UBound(results), 5
UT.AssertEquals results(3), "another"
UT.AssertEquals results(4), ""
results = String.Split("here is another  test", "\s+", -1)
UT.AssertEquals UBound(results), 4
UT.AssertEquals results(4), "test"

UT.AssertTrue String.StartsWith("foobar", "foo")
UT.AssertFalse String.StartsWith("foobar", "bar")

Console.Echo "lib/lang/string tests completed with no errors in " + (Sys.TimeInMillis - ts) + " millisecond(s)"