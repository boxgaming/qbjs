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

' Colors on 32-bit images are &HAARRGGBB values, not palette indexes (expected values from QB64-PE)
Dim As Long colImg, colPal, colSigned
colImg = _NewImage(4, 1, 32)
colPal = _NewImage(4, 1, 256)
_Dest colImg: _Source colImg
PSet (0, 0), 0
UT.AssertEquals Point(0, 0), 0
PSet (1, 0), -16776961
UT.AssertEquals Hex$(Point(1, 0)), "FF0000FF"
colSigned = CVL(MKL$(&HFF00FF00))
PSet (2, 0), colSigned
UT.AssertEquals Hex$(Point(2, 0)), "FF00FF00"
Cls , _RGB32(10, 20, 30)
Line (0, 0)-(3, 0), 100, BF
UT.AssertEquals Hex$(Point(3, 0)), "FF0A141E"
UT.AssertEquals _Blue32(200), 200
UT.AssertEquals _Alpha32(200), 0
UT.AssertEquals _Red32(&HFF102030), 16
UT.AssertEquals _Blue(200), 200
' Palette images still use palette indexes.  These check that QBJS's palette behavior is
' unchanged: QB64-PE's palette differs slightly (blue 170 here) and its Point returns the index.
UT.AssertEquals _Blue(1, colPal), 168
_Dest colPal: _Source colPal
PSet (0, 0), 4
UT.AssertEquals Hex$(Point(0, 0)), "FFA80000"
_Dest 0: _Source 0
_FreeImage colImg: _FreeImage colPal

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
