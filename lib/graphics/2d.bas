Export RotoZoom, FillCircle, FillEllipse, FillTriangle

Sub RotoZoom(centerX As Long, centerY As Long, img As Long, xScale As Single, yScale As Single, rotation As Single)
    Dim newImage As Long
    Dim imgWidth, imgHeight
    imgWidth = _Width(img)
    imgHeight = _Height(img)
    Dim destImg As Long
    destImage = _Dest

$If Javascript Then
    var origImg = QB.getImage(img);
    var cx = imgWidth / 2.0;
    var cy = imgHeight / 2.0;
    
    var destImg = QB.getImage(destImg);
    var ctx = destImg.getContext("2d");
    ctx.save();

    ctx.translate(centerX, centerY);
    ctx.rotate((Math.PI / 180) * rotation);
    ctx.scale(xScale, yScale);
    ctx.drawImage(origImg, -cx, -cy);
    
    ctx.restore();
$End If
End Sub


Sub FillCircle(x As Long, y As Long, radius As Long, clr As _Unsigned Long)
    Dim As Long r, g, b, a, destImg
    r = _Red(clr)
    g = _Green(clr)
    b = _Blue(clr)
    a = _Alpha(clr)
    destImg = _Dest

$If Javascript Then
    var ctx = QB.getImage(destImg).getContext("2d");
    ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")"
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
$End If
End Sub


Sub FillEllipse(x As Long, y As Long, radiusX As Long, radiusY As Long, rotation As Integer, clr As _Unsigned Long)
    Dim As Long r, g, b, a, destImg
    r = _Red(clr)
    g = _Green(clr)
    b = _Blue(clr)
    a = _Alpha(clr)
    destImg = _Dest
    If rotation = undefined Then 
        rotation = 0
    End If

$If Javascript Then
    var ctx = QB.getImage(destImg).getContext("2d");
    ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")"
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation * (Math.PI / 180), 0, 2 * Math.PI);
    ctx.fill();
$End If
End Sub

Sub FillTriangle(x1 As Long, y1 As Long, x2 As Long, y2 As Long, x3 As Long, y3 As Long, clr As _Unsigned Long)
    Dim As Long r, g, b, a, destImg
    r = _Red(clr)
    g = _Green(clr)
    b = _Blue(clr)
    a = _Alpha(clr)
    destImg = _Dest

$If Javascript Then
    var ctx = QB.getImage(destImg).getContext("2d");
    ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")"
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x1, y1);
    ctx.fill();
$End If
End Sub