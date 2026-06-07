Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import UT From "lib/test/unit-test.bas"
Import OBJ From "lib/lang/object.bas"

Dim ts: ts = Sys.TimeInMillis

Dim o As Object
ReDim props(0) As String
props = OBJ.Keys(o)

UT.AssertEquals UBound(props), 0

o.firstName = "Bob"
o.lastName = "Smith"
props = OBJ.Keys(o)
UT.AssertEquals UBound(props), 2
UT.AssertEquals props(1), "firstName"
UT.AssertEquals props(2), "lastName"
UT.AssertTrue OBJ.HasProperty(o, "lastName")
UT.AssertFalse OBJ.HasProperty(o, "favoriteColor")

OBJ.SetProperty o, "favorite color", "red"
UT.AssertTrue OBJ.HasProperty(o, "favorite color")
props = OBJ.Keys(o)
UT.AssertEquals UBound(props), 3

Dim o2 As Object
OBJ.Assign o2, o
props = OBJ.Keys(o2)
UT.AssertEquals UBound(props), 3
UT.AssertEquals props(1), "firstName"
UT.AssertEquals props(3), "favorite color"
UT.AssertEquals OBJ.GetProperty(o2, "firstName"), "Bob"
UT.AssertEquals OBJ.GetProperty(o2, "favorite color"), "red"

o2.firstName = "Greg"
OBJ.SetProperty o2, "favorite color", "blue"
UT.AssertEquals OBJ.GetProperty(o2, "firstName"), "Greg"
UT.AssertEquals OBJ.GetProperty(o2, "favorite color"), "blue"
UT.AssertEquals OBJ.GetProperty(o, "firstName"), "Bob"
UT.AssertEquals OBJ.GetProperty(o, "favorite color"), "red"

OBJ.DeleteProperty o2, "lastName"
UT.AssertFalse OBJ.HasProperty(o2, "lastName")
props = OBJ.Keys(o2)
UT.AssertEquals UBound(props), 2
UT.AssertEquals props(1), "firstName"
UT.AssertEquals props(2), "favorite color"

Console.Echo "lib/lang/object tests completed with no errors in " + (Sys.TimeInMillis - ts) + " millisecond(s)"