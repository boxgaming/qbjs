Import Sys From "lib/lang/system.bas"
Import Console From "lib/web/console.bas"
Import FS From "lib/io/fs.bas"
Import UT From "lib/test/unit-test.bas"

Dim ts: ts = Sys.TimeInMillis

' _PutImage: swapped corners mirror, rectangles are inclusive (expected values from QB64-PE)
' The 4x2 source has a distinct blue value (1-8) in each pixel; PixelRow$ reads them back.
Dim As Long piSrc, piDst
Dim As Integer px, py
piSrc = _NewImage(4, 2, 32)
piDst = _NewImage(8, 4, 32)
_Dest piSrc
For py = 0 To 1: For px = 0 To 3: PSet (px, py), _RGB32(0, 0, 1 + px + py * 4): Next: Next
_Dest piDst

Cls , _RGB32(0, 0, 0): _PutImage (0, 0)-(3, 1), piSrc, piDst
UT.AssertEquals PixelRow$(piDst, 0), "12340000"
UT.AssertEquals PixelRow$(piDst, 1), "56780000"
Cls , _RGB32(0, 0, 0): _PutImage (3, 0)-(0, 1), piSrc, piDst
UT.AssertEquals PixelRow$(piDst, 0), "43210000"
UT.AssertEquals PixelRow$(piDst, 1), "87650000"
Cls , _RGB32(0, 0, 0): _PutImage (0, 1)-(3, 0), piSrc, piDst
UT.AssertEquals PixelRow$(piDst, 0), "56780000"
UT.AssertEquals PixelRow$(piDst, 1), "12340000"
Cls , _RGB32(0, 0, 0): _PutImage (0, 0)-(3, 1), piSrc, piDst, (3, 0)-(0, 1)
UT.AssertEquals PixelRow$(piDst, 0), "43210000"
Cls , _RGB32(0, 0, 0): _PutImage (3, 0)-(0, 1), piSrc, piDst, (3, 0)-(0, 1)
UT.AssertEquals PixelRow$(piDst, 0), "12340000"
Cls , _RGB32(0, 0, 0): _PutImage (0, 0)-(7, 3), piSrc, piDst
UT.AssertEquals PixelRow$(piDst, 0), "11223344"
UT.AssertEquals PixelRow$(piDst, 3), "55667788"
Cls , _RGB32(0, 0, 0): _PutImage (7, 0)-(0, 3), piSrc, piDst
UT.AssertEquals PixelRow$(piDst, 0), "44332211"
Cls , _RGB32(0, 0, 0): _PutImage (2, 0), piSrc, piDst, (3, 0)-(0, 1)
UT.AssertEquals PixelRow$(piDst, 0), "00432100"
Cls , _RGB32(0, 0, 0): _PutImage (0, 0)-(5, 1), piSrc, piDst, (0, 0)-(9, 1)
UT.AssertEquals PixelRow$(piDst, 0), "13000000"
Cls , _RGB32(0, 0, 0): _PutImage (4, 1)-Step(-3, 1), piSrc, piDst
UT.AssertEquals PixelRow$(piDst, 1), "04321000"
_Dest 0: _Source 0
_FreeImage piSrc: _FreeImage piDst
Dim c As Unsigned Integer
c = _RGBA(100, 200, 255, 100)

Circle (100, 100), 50, c
UT.AssertEquals _Alpha(c), 100
UT.AssertEquals _Alpha32(c), 100

Console.Echo "QB Graphics - tests completed with no errors* in " + (Sys.TimeInMillis - ts) + " millisecond(s)"

Function PixelRow$ (img As Long, y As Integer)
    Dim x As Integer, s As String
    _Source img
    For x = 0 To _Width(img) - 1
        s = s + Hex$(_Blue32(Point(x, y)))
    Next x
    PixelRow = s
End Function
