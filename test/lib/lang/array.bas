Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import UT From "lib/test/unit-test.bas"
Import JSArray From "lib/lang/array.bas"

Dim ts: ts = Sys.TimeInMillis


Dim colors As Object
colors = JSArray.Create("red", "green", "blue", "orange", "yellow", "white")

UT.AssertEquals JSArray.Length(colors), 6

UT.AssertEquals JSArray.At(colors, 0), "red"
UT.AssertEquals JSArray.At(colors, 2), "blue"
UT.AssertEquals JSArray.At(colors, -1), "white"
UT.AssertEquals JSArray.At(colors, -3), "orange"

UT.AssertEquals JSArray.Item(colors, 0), "red"
UT.AssertEquals JSArray.Item(colors, 3), "orange"

UT.AssertEquals JSArray.IndexOf(colors, "blue"), 2
UT.AssertEquals JSArray.IndexOf(colors, "red"), 0
UT.AssertEquals JSArray.IndexOf(colors, "blue", 3), -1

Dim numbers As Object
numbers = JSArray.Create(5, 7, 3, 4, 2, 5, 1, 6)

UT.AssertEquals JSArray.LastIndexOf(numbers, 5), 5
UT.AssertEquals JSArray.LastIndexOf(numbers, 5, 3), 0

Dim moreColors As Object
moreColors = JSArray.Create(colors, "black", "purple")

UT.AssertEquals JSArray.Length(moreColors), 8
UT.AssertEquals JSArray.At(moreColors, -1), "purple"

Dim otherColors(2) As String
otherColors(1) = "black"
otherColors(2) = "purple"

Dim allColors As Object
allColors = JSArray.Concat(colors, otherColors, "pink", "brown")

UT.AssertEquals JSArray.Length(allColors), 10
UT.AssertEquals JSArray.Item(allColors, 6), "black"
UT.AssertEquals JSArray.Item(allColors, 8), "pink"

JSArray.Clear colors
UT.AssertEquals JSArray.Length(colors), 0

Dim numArray As Object
numArray = JSArray.Create(1, 2, 3, 4)
UT.AssertEquals JSArray.Join(numArray, " | "), "1 | 2 | 3 | 4"

numArray = JSArray.Fill(numArray, 0, 2, 4)
UT.AssertEquals JSArray.Join(numArray), "1,2,0,0"
numArray = JSArray.Fill(numArray, 5, 1)
UT.AssertEquals JSArray.Join(numArray), "1,5,5,5"
numArray = JSArray.Fill(numArray, 6) 
UT.AssertEquals JSArray.Join(numArray), "6,6,6,6"

Dim numbers As Object
numbers = JSArray.Create("one", "two")

JSArray.Push numbers, "three"
UT.AssertEquals JSArray.Length(numbers), 3
UT.AssertEquals JSArray.Join(numbers), "one,two,three"

JSArray.Push numbers, "four", "five", "six"
UT.AssertEquals JSArray.Length(numbers), 6
UT.AssertEquals JSArray.Join(numbers), "one,two,three,four,five,six"

numbers = JSArray.Create("one", "two")

JSArray.Add numbers, "three"
UT.AssertEquals JSArray.Length(numbers), 3
UT.AssertEquals JSArray.Join(numbers), "one,two,three"

JSArray.Add numbers, "four", "five", "six"
UT.AssertEquals JSArray.Length(numbers), 6
UT.AssertEquals JSArray.Join(numbers), "one,two,three,four,five,six"

numbers = JSArray.Create("one", "two")

JSArray.Unshift numbers, "three"
UT.AssertEquals JSArray.Length(numbers), 3
UT.AssertEquals JSArray.Join(numbers), "three,one,two"

JSArray.Unshift numbers, "four", "five", "six"
UT.AssertEquals JSArray.Length(numbers), 6
UT.AssertEquals JSArray.Join(numbers), "four,five,six,three,one,two"

Dim months As Object
months = JSArray.Create("Jan", "Mar", "Apr", "Jul")
JSArray.Insert months, 1, "Feb"
UT.AssertEquals JSArray.Join(months), "Jan,Feb,Mar,Apr,Jul"
JSArray.Insert months, 4, "May", "Jun"
UT.AssertEquals JSArray.Join(months), "Jan,Feb,Mar,Apr,May,Jun,Jul"

months = JSArray.Create("Jan", "Mar", "Apr", "Jul", "Jun")
JSArray.Splice months, 1, 0, "Feb"
UT.AssertEquals JSArray.Join(months), "Jan,Feb,Mar,Apr,Jul,Jun"
JSArray.Splice months, 4, 1, "May"
UT.AssertEquals JSArray.Join(months), "Jan,Feb,Mar,Apr,May,Jun"

numbers = JSArray.Create(1, 2, 3, 5, 4, 7, 7, 5)
JSArray.Remove numbers, 3
UT.AssertEquals JSArray.Join(numbers), "1,2,3,4,7,7,5"
JSArray.Remove numbers, 4, 2
UT.AssertEquals JSArray.Join(numbers), "1,2,3,4,5"

Dim plants As Object
plants = JSArray.Create("broccoli", "cauliflower", "cabbage", "kale", "tomato")
UT.AssertEquals JSArray.Pop(plants), "tomato"
UT.AssertEquals JSArray.Join(plants), "broccoli,cauliflower,cabbage,kale"
UT.AssertEquals JSArray.Pop(plants), "kale"
UT.AssertEquals JSArray.Join(plants), "broccoli,cauliflower,cabbage"

plants = JSArray.Create("broccoli", "cauliflower", "cabbage", "kale", "tomato")
UT.AssertEquals JSArray.Shift(plants), "broccoli"
UT.AssertEquals JSArray.Join(plants), "cauliflower,cabbage,kale,tomato"
UT.AssertEquals JSArray.Shift(plants), "cauliflower"
UT.AssertEquals JSArray.Join(plants), "cabbage,kale,tomato"

Dim animals As Object
animals = JSArray.Create("ant", "bison", "camel", "duck", "elephant")
UT.AssertEquals JSArray.Slice(animals, 2), "camel,duck,elephant"
UT.AssertEquals JSArray.Slice(animals, 2, 4), "camel,duck"
UT.AssertEquals JSArray.Slice(animals, 1, 5), "bison,camel,duck,elephant"

Dim vegetables(3) As String
vegetables(1) = "lettuce"
vegetables(2) = "cabbage"
vegetables(3) = "kale"
UT.AssertTrue JSArray.IsJSArray(animals)
UT.AssertFalse JSArray.IsJSArray(vegetables)
UT.AssertFalse JSArray.IsJSArray("string of text")
UT.AssertFalse JSArray.IsQBArray(animals)
UT.AssertTrue JSArray.IsQBArray(vegetables)
UT.AssertFalse JSArray.IsQBArray("string of text")

numbers = JSArray.Create("one", "two", "three")
JSArray.Reverse numbers
UT.AssertEquals numbers, "three,two,one"

numbers = JSArray.Create(5, 27, 18, 9, 4, 22, 20)
UT.AssertEquals JSArray.Reduce(numbers, @Sum), 105
UT.AssertEquals JSArray.Reduce(numbers, @Sum, 100), 205

colors = JSArray.Create("red", "green", "blue", "orange", "yellow")
UT.AssertEquals JSArray.ReduceRight(colors, @ReverseConcat), "yellow|orange|blue|green|red"
UT.AssertEquals JSArray.ReduceRight(colors, @ReverseConcat2, "COLORS"), "COLORS|5/5:yellow|4/5:orange|3/5:blue|2/5:green|1/5:red"


JSArray.Sort colors
UT.AssertEquals colors, "blue,green,orange,red,yellow"

JSArray.Sort numbers, @SortAsc
UT.AssertEquals JSArray.Join(numbers), "4,5,9,18,20,22,27"

JSArray.Sort numbers, @SortDesc
UT.AssertEquals JSArray.Join(numbers), "27,22,20,18,9,5,4"

Type Person
    As String firstName, lastName
    As Integer age
End Type

Dim people As Object
people = JSArray.Create( _
            CreatePerson("John", "Doe", 23), _
            CreatePerson("Andrew", "Jones", 45), _
            CreatePerson("Mary", "Barnes", 19), _
            CreatePerson("Betty", "Doe", 38), _
            CreatePerson("Howard", "Anderson", 28))

UT.AssertEquals JSArray.Reduce(people, @ToString, ""), "|Doe, John - 23|Jones, Andrew - 45|Barnes, Mary - 19|Doe, Betty - 38|Anderson, Howard - 28"

JSArray.Sort people, @SortByAge
UT.AssertEquals JSArray.Reduce(people, @ToString, ""), "|Barnes, Mary - 19|Doe, John - 23|Anderson, Howard - 28|Doe, Betty - 38|Jones, Andrew - 45"

JSArray.Sort people, @SortByName
UT.AssertEquals JSArray.Reduce(people, @ToString, ""), "|Anderson, Howard - 28|Barnes, Mary - 19|Doe, Betty - 38|Doe, John - 23|Jones, Andrew - 45"

Dim filtered As Object
filtered = JSArray.Filter(numbers, @RangeFilter)
UT.AssertEquals filtered, "22,20,18"


Console.Echo "lib/lang/array - tests completed with no errors in " + (Sys.TimeInMillis - ts) + " millisecond(s)"


Function Sum (accumulator, currentValue)
    Sum = accumulator + currentValue
End Function

Function ReverseConcat (accumulator, currentValue)
    ReverseConcat = accumulator + "|" + currentValue
End Function

Function ReverseConcat2 (accumulator, currentValue, index, array)
    ReverseConcat2 = accumulator + "|" + (index+1) + "/" + array.length + ":" + currentValue
End Function

Function SortAsc (a, b)
    SortAsc = a - b
End Function

Function SortDesc (a, b)
    SortDesc = b - a
End Function

Function SortByName (a, b)
    Dim As String aname, bname
    aname = a.lastName
    bname = b.lastName
    If aname = bname Then
        aname = a.firstName
        bname = b.firstName
    End If
    
    If aname > bname Then
        SortByName = 1
    ElseIf aname < bname Then
        SortByName = -1
    Else
        SortByName = 0
    EndIf
End Function

Function SortByAge (a, b)
    SortByAge = a.age - b.age
End Function

Function ToString (accumulator, p As Person, index)
    ToString = accumulator + "|" + p.lastName + ", " + p.firstName + " - " + p.age
End Sub

Function CreatePerson (firstName As String, lastName As String, age As Integer)
    Dim p As Person
    p.firstName = firstName
    p.lastName = lastName
    p.age = age
    CreatePerson = p
End Function

Function RangeFilter (element)
    RangeFilter = element >= 15 And element <= 25
End Function