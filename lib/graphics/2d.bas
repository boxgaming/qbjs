Const DEFAULT = "butt"
Const ROUND = "round"
Const SQUARE = "square"

Export DEFAULT, ROUND, SQUARE
Export RotoZoom, SaveImage
Export Triangle, FillTriangle, RoundRect, FillRoundRect, InvertRect
Export Shadow, ShadowOff, LineWidth, LineCap, LineDash, LineDashOff
Export FillCircle, Ellipse, FillEllipse, Curve, Bezier

Sub RotoZoom (centerX As Long, centerY As Long, img As Long, xScale As Single, yScale As Single, rotation As Single)
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

Sub SaveImage (imageId As Long, filepath As String)
    $If Javascript Then
        var vfs = QB.vfs();
        var filename = vfs.getFileName(filepath);
        var ppath = vfs.getParentPath(filepath);
        var pnode = null;
        if (ppath == "") { pnode = QB.vfsCwd(); }
        else { pnode = vfs.getNode(ppath, QB.vfsCwd()); }
        if (!pnode) {
            throw Object.assign(new Error("Path not found: [" + ppath + "]"), { _stackDepth: 1 });
        }
        var img = QB.getImage(imageId);
        var f = vfs.createFile(filename, pnode);
        var complete = false;
        await img.toBlob(async function(b) {
            var ab = await b.arrayBuffer();
            vfs.writeData(f, ab);
            complete = true;
        });
        while (!complete) {
            await GX.sleep(10);
        }
    $End If
    
End Sub

Sub FillCircle (x As Long, y As Long, radius As Long, clr As _Unsigned Long)
    Dim destImg As Long
    destImg = _Dest

    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(destImg).getContext("2d");
        ctx.fillStyle = c.rgba();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    $End If
End Sub

Sub Ellipse(x As Long, y As Long, radiusX As Long, radiusY As Long, rotation As Integer, clr As _Unsigned Long)
    _Ellipse x, y, radiusX, radiusY, rotation, clr, false
End Sub

Sub FillEllipse (x As Long, y As Long, radiusX As Long, radiusY As Long, rotation As Integer, clr As _Unsigned Long)
    _Ellipse x, y, radiusX, radiusY, rotation, clr, true
End Sub

Sub _Ellipse (x As Long, y As Long, radiusX As Long, radiusY As Long, rotation As Integer, clr As _Unsigned Long, fill)
    Dim destImg As Long
    destImg = _Dest
    If rotation = undefined Then 
        rotation = 0
    End If
    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(destImg).getContext("2d");
        if (fill) { 
            ctx.fillStyle = c.rgba();
        } else {
            ctx.strokeStyle = c.rgba();
            ctx.lineWidth = QB.defaultLineWidth();
        }
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, rotation * (Math.PI / 180), 0, 2 * Math.PI);
        if (fill) { 
            ctx.fill();
        } else { 
            ctx.stroke();
        }
    $End If
End Sub

Sub Triangle (x1 As Long, y1 As Long, x2 As Long, y2 As Long, x3 As Long, y3 As Long, clr As _Unsigned Long)
    _Triangle x1, y1, x2, y2, x3, y3, clr, false
End Sub

Sub FillTriangle (x1 As Long, y1 As Long, x2 As Long, y2 As Long, x3 As Long, y3 As Long, clr As _Unsigned Long)
    _Triangle x1, y1, x2, y2, x3, y3, clr, true
End Sub

Sub _Triangle (x1 As Long, y1 As Long, x2 As Long, y2 As Long, x3 As Long, y3 As Long, clr As _Unsigned Long, fill)
    Dim destImg As Long
    destImg = _Dest

    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(destImg).getContext("2d");
        if (fill) { 
            ctx.fillStyle = c.rgba();
        } else {
            ctx.strokeStyle = c.rgba();
            ctx.lineWidth = QB.defaultLineWidth();
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x1, y1);
        if (fill) { 
            ctx.fill();
        } else { 
            ctx.stroke();
        }
    $End If
End Sub

Sub RoundRect (x As Long, y As Long, w As Long, h As Long, radius As Integer, clr As _Unsigned Long)
    _RoundRect x, y, w, h, radius, clr, false
End Sub

Sub FillRoundRect (x As Long, y As Long, w As Long, h As Long, radius As Integer, clr As _Unsigned Long)
    _RoundRect x, y, w, h, radius, clr, true
End Sub

Sub _RoundRect (x As Long, y As Long, w As Long, h As Long, radius As Integer, clr As _Unsigned Long, fill)
    Dim destImg As Long 
    destImg = _Dest

    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(destImg).getContext("2d");
        if (fill) { 
            ctx.fillStyle = c.rgba();
        } else {
            ctx.strokeStyle = c.rgba();
            ctx.lineWidth = QB.defaultLineWidth();
        }
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        if (fill) { 
            ctx.fill();
        } else { 
            ctx.stroke();
        }
    $End If
End Sub

Sub InvertRect (x As Long, y As Long, width As Long, height As Long, fill As Integer)
    Dim destImg As Long 
    destImg = _Dest

    $If Javascript Then
        var ctx = QB.getImage(destImg).getContext("2d");
        ctx.beginPath();
        ctx.globalCompositeOperation="difference";
        if (fill) {
            ctx.fillStyle = "white";
            ctx.rect(x, y, width, height);
            ctx.fill();
        }
        else {
            ctx.strokeStyle = "white";
            ctx.rect(x, y, width, height);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
    $End If
End Sub

Sub Shadow (clr As Long, offsetX As Long, offsetY As Long, blur As Long)
    Dim destImg As Long
    destImg = _Dest

    If offsetX = undefined Then 
        offsetX = 0
    End If
    If offsetY = undefined Then 
        offsetY = 0
    End If
    If blur = undefined Then 
        blur = 0
    End If
    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(destImg).getContext("2d");
        ctx.shadowBlur = blur;
        ctx.shadowColor = c.rgba();
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
    $End If
End Sub

Sub ShadowOff
    Dim destImg As Long
    destImg = _Dest

    $If Javascript Then
        var ctx = QB.getImage(destImg).getContext("2d");
        ctx.shadowBlur = 0;
        ctx.shadowColor = "#000";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    $End If
End Sub

Sub LineWidth (w As Long)
    $If Javascript Then
        QB.defaultLineWidth(w);
    $End If
End Sub

Function LineWidth 
    $If Javascript Then
        LineWidth = QB.defaultLineWidth();
    $End If
End Function

Sub LineCap (cap As String)
    $If Javascript Then
        var ctx = QB.getImage(QB.func__Dest()).getContext("2d");
        ctx.lineCap = cap;
    $End If
End Sub

Function LineCap 
    $If Javascript Then
        var ctx = QB.getImage(QB.func__Dest()).getContext("2d");
        LineCap = ctx.lineCap;
    $End If
End Function

Sub LineDash (dashLen As Integer, dashSpace As Integer)
    $If Javascript Then
        var ctx = QB.getImage(QB.func__Dest()).getContext("2d");
        if (dashLen > 0) {
            var dl = dashLen;
            var ds = dashLen;
            if (dashSpace > 0) {
                ds = dashSpace;
            }
            ctx.setLineDash([dl, ds])
        }
        else {
            ctx.setLineDash([])
        }
    $End If
End Sub

Sub LineDashOff
    $If Javascript Then
        var ctx = QB.getImage(QB.func__Dest()).getContext("2d");
        ctx.setLineDash([])
    $End If
End Sub

Sub Curve (sx As Long, sy As Long, cx As Long, cy As Long, ex As Long, ey as Long, clr As _Unsigned Long)
    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(QB.func__Dest()).getContext("2d");
        ctx.strokeStyle = c.rgba();
        ctx.lineWidth = QB.defaultLineWidth();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();    
    $End If
End Sub

Sub Bezier (sx As Long, sy As Long, cx1 As Long, cy1 As Long, cx2 As Long, cy2 As Long, ex As Long, ey as Long, clr As _Unsigned Long)
    If clr = undefined Then 
        clr = _DefaultColor
    End If

    $If Javascript Then
        var c = QB.colorToRGB(clr);
        var ctx = QB.getImage(QB.func__Dest()).getContext("2d");
        ctx.strokeStyle = c.rgba();
        ctx.lineWidth = QB.defaultLineWidth();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, ex, ey);
        ctx.stroke();    
    $End If
End Sub