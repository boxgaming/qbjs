$IncludeOnce
Import __FS From "lib/io/fs.bas"
Import __Sys From "lib/lang/system.bas"
Import __String From "lib/lang/string.bas"
Import __Dom From "lib/web/dom.bas"
Import __Console From "lib/web/console.bas"
Import __GFX From "lib/graphics/2d.bas"

Dim Shared As Object __PEUI
__InitPEUI

' _ADLER32 - returns the Adler-31 checksum of any arbitrary string.

'_BASE64ENCODE$ - encodes a string containing binary or textual data into Base64 format.	
Function _Base64Encode$ (value As String)
    _Base64Encode$ = __Sys.Call(globalThis.btoa, , value)
End Function

'_BASE64DECODE$ - decodes a Base64-encoded string back to its original binary or textual representation.
Function _Base64Decode$ (value As String)
    _Base64Decode$ = __Sys.Call(globalThis.atob, , value)
End Function

'_Brightness32 - returns the brightness value (HSB colorspace) of a given 32-bit ARGB color.
'_Cast - performs a C-like cast of a numerical value to a specified numerical type.

' _CLAMP - forces the given numeric value into a specific range, returning either the given value as is,
'          or the closest boundary if the range is exceeded.
Function _Clamp (value, minVal, maxVal)
    _Clamp = __Sys.Call(Math.min, , __Sys.Call(Math.max, , value, minVal), maxVal)
End Function

' _ColorChooserDialog - displays a standard color picker dialog box.
Function _ColorChooserDialog (stitle As String, defaultColor As Unsigned Long)
    __PEUI.dialogMode = "colorpicker"
    __PEUI.inputPanel.style.display = "none"
    __PEUI.dlgMsgPanel.style.display = "none"
    __PEUI.colorPanel.style.display = "block"
    __PEUI.btnOk.style.display = "inline-block"
    __PEUI.btnYes.style.display = "none"
    __PEUI.btnNo.style.display = "none"
    __PEUI.btnCancel.style.display = "inline-block"

    If stitle = undefined Then stitle = "Color"
    __PEUI.dlgTitle.innerHTML = stitle
    __Dom.Focus __PEUI.ctrlColor
    __Dom.DialogShowModal __PEUI.dialog

    If defaultColor <> undefined Then
        Dim hex As String
        hex = "#" + __String.PadStart(Hex$(_Red(defaultColor), 2, "0")) + __String.PadStart(Hex$(_Green(defaultColor), 2, "0")) + __String.PadStart(Hex$(_Blue(defaultColor), 2, "0"))
        __PEUI.ctrlColor.value = hex
        __PEUI.txtHex.value = hex
    End If

    While __PEUI.dialogMode <> "": Limit 30: WEnd
    _ColorChooserDialog = __PEUI.dialogResult
End Function

' _CompileDate$ - returns the date when a program was compiled.	
' _CompileTime$ - returns the time in the day when a program was compiled.	
' _CompilerVersion$ - returns the compiler version used to compile a program.	
' _CRC32 - returns the Crc-32 checksum of any arbitrary string.

' _DECODEURL$ - the counterpart for _ENCODEURL$, it returns the decoded plain text URL of the given encoded URL.	
Function _DecodeURL$ (url As String)
    _DecodeURL$ = __Sys.Call(globalThis.decodeURI, , url)
End Function

' _EMBEDDED$ - used to recall the data of a file which was earlier embedded into the EXE file using the $EMBED metacommand.	

' _ENCODEURL$ - returns the so called percent encoded representation of the given URL.	
Function _EncodeURL$ (url As String)
    _EncodeURL$ = __Sys.Call(globalThis.encodeURI, , url)
End Function

' _FILES$ - returns a file or directory name that matches the specified pattern.	
' _FULLPATH$ - returns an absolute or full path name for the specified relative path name.	
' _HSB32 - specifies a color using the HSB colorspace and returns the 32-bit ARGB color value representing the color with the specified hue, saturation and brightness.	
' _HSBA32 - specifies a color using the HSB colorspace and returns the 32-bit ARGB color value representing the color with the specified hue, saturation, brightness and opacity level (alpha channel).	
' _HUE32 - returns the hue value (HSB colorspace) of a given 32-bit ARGB color.

' _IIF - a conditional operator-like feature allowing conditional evaluations with short-circuiting behavior.	
Function _IIF (expression, truePart, falsePart)
    If expression Then _IIF = truePart Else _IIF = falsePart
End Function

' _INPUTBOX$ - displays a prompt in a dialog box	
Function _InputBox$ (stitle As String, message As String, defaultValue As String)
    message = __String.Replace(message, Chr$(10), "<br>")

    Dim passwordMode
    If defaultValue = "" Then passwordMode = -1
    If defaultValue = undefined Then defaultValue = ""

'    If dialogType = undefined Then dialogType = "ok"
'    dialogType = LCase$(dialogType)
    __PEUI.dialogMode = "inputbox"
    __PEUI.inputPanel.style.display = "block"
    __PEUI.dlgMsgPanel.style.display = "none"
    __PEUI.colorPanel.style.display = "none"
    __PEUI.btnOk.style.display = "inline-block"
    __PEUI.btnYes.style.display = "none"
    __PEUI.btnNo.style.display = "none"
    __PEUI.btnCancel.style.display = "inline-block"

    If passwordMode Then
        __PEUI.txtInput.type = "password"
    Else
        __PEUI.txtInput.type = "input"
    End If

    __PEUI.dlgTitle.innerHTML = stitle
    __PEUI.inputPrompt.innerHTML = message
    __PEUI.txtInput.value = defaultValue
    __Dom.Focus __PEUI.txtInput
    __Dom.SelectAll __PEUI.txtInput
    __Dom.DialogShowModal __PEUI.dialog

    While __PEUI.dialogMode <> "": Limit 30: WEnd
    _InputBox$ = __PEUI.dialogResult
End Function

' _LOGERROR - writes a log message at the Error level with an accompanying stacktrace.	
Sub _LogError (message As String)
    __Console.Log message, __Console.ERROR
End Sub

' _LOGINFO - writes a log message at the Information level.	
Sub _LogInfo (message As String)
    __Console.Log message, __Console.INFO
End Sub

' _LOGMINLEVEL - returns the current minimum logging level that is being output.	
Function _LogMinLevel
    Dim minLevel As Integer
    Select Case __Console.LogLevel
        Case 0:    minLevel = 5 ' NONE
        Case 1, 2: minLevel = 4 ' ERROR (or FATAL)
        Case 3:    minLevel = 3 ' WARN
        Case 4:    minLevel = 2 ' INFO
        Case 5, 6: minLevel = 1 ' TRACE (or DEBUG)
    End Select
    _LogMinLevel = minLevel
End Function

' This method does not exist in QB64PE but is added here as a convenience to set the log level
Sub _LogMinLevel (minLevel As Integer)
    Select Case minLevel
        Case 1: __Console.LogLevel __Console.TRACE
        Case 2: __Console.LogLevel __Console.INFO
        Case 3: __Console.LogLevel __Console.WARN
        Case 4: __Console.LogLevel __Console.ERROR
        Case 5: __Console.LogLevel __Console.NONE
    End Select
End Sub

' _LOGTRACE - statement writes a log message at the Trace level.	
Sub _LogTrace (message As String)
    __Console.Log message, __Console.TRACE
End Sub

' _LOGWARN - writes a log message at the Warning level.	
Sub _LogWarn (message As String)
    __Console.Log message, __Console.WARN
End Sub

' _MAX - returns the greater of two given numeric values.	
Function _Max (value1, value2)
    _Max = __Sys.Call(Math.max, , value1, value2)
End Function

' _MD5$ - returns the MD5 hash value of any arbitrary string.	

' _MESSAGEBOX (statement) - displays a message dialog box.	
Sub _MessageBox (stitle As String, message As String, iconType As String)
    Dim result: result = _MessageBox(stitle, message, "ok", iconType)
End Sub

' _MESSAGEBOX (function) - displays a message dialog box, which presents a message and returns the button ID clicked by the user.	
Function _MessageBox (stitle As String, message As String, dialogType As String, iconType As String, defaultButton As Integer)
    message = __String.Replace(message, Chr$(10), "<br>")
    If dialogType = undefined Then dialogType = "ok"
    dialogType = LCase$(dialogType)
    __PEUI.dialogMode = dialogType
    __PEUI.inputPanel.style.display = "none"
    __PEUI.dlgMsgPanel.style.display = "grid"
    __PEUI.colorPanel.style.display = "none"
    __PEUI.btnOk.style.display = "none"
    __PEUI.btnYes.style.display = "none"
    __PEUI.btnNo.style.display = "none"
    __PEUI.btnCancel.style.display = "none"
    Select Case dialogType
        Case "ok"
            __PEUI.btnOk.style.display = "inline-block"
        Case "okcancel"
            __PEUI.btnOk.style.display = "inline-block"
            __PEUI.btnCancel.style.display = "inline-block"
        Case "yesno"
            __PEUI.btnYes.style.display = "inline-block"
            __PEUI.btnNo.style.display = "inline-block"
        Case "yesnocancel"
            __PEUI.btnYes.style.display = "inline-block"
            __PEUI.btnNo.style.display = "inline-block"
            __PEUI.btnCancel.style.display = "inline-block"
        Case Else
            __PEUI.btnOk.style.display = "inline-block"
    End Select

    If iconType = undefined Then iconType = "info"
    __PEUI.imgInfo.style.display = "none"
    __PEUI.imgWarning.style.display = "none"
    __PEUI.imgError.style.display = "none"
    __PEUI.imgQuestion.style.display = "none"
    Select Case iconType
        Case "info":     __PEUI.imgInfo.style.display = "inline"
        Case "warning":  __PEUI.imgWarning.style.display = "inline"
        Case "error":    __PEUI.imgError.style.display = "inline"
        Case "question": __PEUI.imgQuestion.style.display = "inline"
        Case Else:       __PEUI.imgInfo.style.display = "inline"
    End Select

    If defaultButton = undefined Then defaultButton = "ok"
    Select Case defaultButton
        Case "ok": __Dom.Focus __PEUI.btnOk
        Case "yes": __Dom.Focus __PEUI.btnYes
        Case "no": __Dom.Focus __PEUI.btnNo
        Case "cancel": __Dom.Focus __PEUI.btnCancel
    End Select

    __PEUI.dlgTitle.innerHTML = stitle
    __PEUI.dlgMsg.innerHTML = message
    __Dom.DialogShowModal __PEUI.dialog

    While __PEUI.dialogMode <> "": Limit 30: WEnd
    _MessageBox = __PEUI.dialogResult
End Function

' _MIN - returns the lesser of two given numeric values.	
Function _Min (value1, value2)
    _Min = __Sys.Call(Math.min, , value1, value2)
End Function

' _MOUSEHIDDEN - returns a boolean value according to the current mouse cursor state (hidden or visible).	
' _MIDISOUNDBANK - enables _SNDOPEN to use an external FM Bank or SoundFont when playing MIDI files.

' _NOTIFYPOPUP - shows a system notification.	
Sub _NotifyPopup (title As String, message As String, iconType As String)
    Dim iconUrl As String
    If iconType = "warning" Then
        iconUrl = __PEUI.imgWarning.src
    ElseIf iconType = "error" Then
        iconUrl = __PEUI.imgError.src
    Else
        iconUrl = __PEUI.imgInfo.src
    End If

$If Javascript Then
    if (Notification.permission != "granted") {
        await Notification.requestPermission();
    }
    if (Notification.permission == "granted") {
        new Notification(title, {
            body: message,
            icon: iconUrl
        });
    }
$End If
End Sub

' _OPENFILEDIALOG$ - displays a standard dialog box that prompts the user to open a file.	

' _READFILE$ - returns the complete contents of a file in a single string, but without the usual overhead.	
Function _ReadFile$ (filename As String)
    _ReadFile$ = __FS.ReadText(filename)
End Function

' _ROR - rotates the bits of a numerical value to the right.	
' _ROL - rotates the bits of a numerical value to the left.	
' _SATURATION32 - returns the saturation value (HSB colorspace) of a given 32-bit ARGB color.	
' _SAVEFILEDIALOG$ - displays a standard dialog box that prompts the user to save a file.	

' _SAVEIMAGE - saves the contents of an image or screen page to an image file.	
'              requirements parameter is ignored - only png is supported
Sub _SaveImage (filename As String, fileHandle, requirements As String)
    If fileHandle = undefined Then fileHandle = 0
    __GFX.SaveImage fileHandle, filename
End Sub

' _SELECTFOLDERDIALOG$ - displays a dialog box that enables the user to select a folder (directory).	
' _SNDRAWBATCH - plays a batch of sound wave sample frequencies created by a program.	
' _STATUSCODE - gives the HTTP status code of an HTTP response that was opened using _OPENCLIENT.	

' _TOSTR$ - returns the STRING representation of a numerical value. It's a successor of the legacy STR$ function.
Function _ToStr$ (value)
    _ToStr$ = _Trim$(Str$(value))
End Function

' _UCHARPOS - calculates the starting pixel positions of every codepoint of the text string (0 being the starting pixel position of the first codepoint).	
' _UFONTHEIGHT - returns the global glyph height (incl. ascender/descender) of a font loaded by _LOADFONT.	
Function _UFontHeight (fontHandle As Integer)
    _UFontHeight = _FontHeight(fontHandle)
End Function

' _ULINESPACING - returns the vertical line spacing (distance between two consecutive baselines) in pixels.	

' _UPRINTWIDTH - returns the width in pixels of the text string specified.	
Function _UPrintWidth (text As String utfEncoding As Integer, fontHandle As Integer)
    _UPrintWidth = _PrintWidth(text, fontHandle)
End Function

' _UPRINTSTRING - prints ASCII / UNICODE text strings using graphic column and row coordinate positions.	
' _WAVE - defines the waveform shape for a specified audio channel when used with SOUND or PLAY.	

' _WRITEFILE - writes a string into a new file, overwriting an existing file of the same name.
Sub _WriteFile (filename As String, contents As String)
    __FS.WriteText filename, contents
End Sub

Sub __InitPEUI
    __PEUI.dialogMode = ""
    __PEUI.dialogResult = 0
    __PEUI.dialog = __Dom.Create("dialog")
    __PEUI.dialog.style.fontFamily = "Tahoma, sans-serif"
    __PEUI.dialog.style.fontSize = "12px"
    __PEUI.dialog.style.padding = "0";
    __PEUI.dialog.style.borderRadius = "10px"
    __PEUI.dialog.style.backgroundColor = "#ddd"
    __PEUI.dlgTitle = __Dom.Create("div", __PEUI.dialog)
    __PEUI.dlgTitle.style.textAlign = "left"
    __PEUI.dlgTitle.style.padding = "10px"
    
    __PEUI.dlgMsgPanel = __Dom.Create("div", __PEUI.dialog)
    __PEUI.dlgMsgPanel.style.display = "grid"
    __PEUI.dlgMsgPanel.style.gridTemplateColumns = "70px auto"
    __PEUI.dlgMsgPanel.style.backgroundColor = "#efefef"
    __PEUI.dlgImgPanel = __Dom.Create("div", __PEUI.dlgMsgPanel)
    __PEUI.dlgImgPanel.style.padding = "20px"
    __PEUI.imgInfo     = __PE_CreateImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABGdBTUEAALGOfPtRkwAAAj5JREFUSInNl8FLIlEcxz8zMkhFKYXiklEsER2COixUwoJXT9uxW+8/WPfYKTp1bPoPZm8d6zTXQNgKPCh4CAlxWSVRCi0qZJDZw1PTzWjanKHPbd483mfee/Ob+T6FNyB00y5WG5zkSn3t8aUoc+EARjKhOB3r1Y5CN+2j80vqLT+MR2BsEvwT4NNkh5YFzVu4v4G7CkFfk43V+Vcf4sWb+8dpe/fwlLoWgtACaCPOpmI9Qi1P0Kqxs7nOj29fBjoGNgrdtI1UAaaXYXTKmfBfHq6hnEV8/Txw9s8aVr7/tDNXTZhde1rO/6Vlwe8zVj75yRxs9bnU3guhm8OTghxjdo3MVROhm/ZA8f5xWi6vQ6m9t4i9t+hYbqQK7B+nu/KuePfwVO7pMGY6SD69LB29YqGbdl0LvelFUrYvULYvnMtHp6hroe6SqwBH55eyZNwmtCBdHXG95Xdep20c73Ev2oh0AarQTZvxyNsGeA/jEYRu2mqx2pCfQa8Ym6RYbaCe5Ery2+sV/glOcqV2OblRQi/RdqmvdnQJKW5Z3hnbLjW+FJX/U69o3hJfiqLOhQPyJ+4V9zfMhQOoRjKhcFfxTnxXwUgmFBUg6GvK5OA21qN0dV6ujdV5qOXdF9fy0tURG8mEErRqMq64xcM1QavWjUHdOt7ZXIdy1p3SallQzkpHm74cJHTTNn79GV704Sl3idhMX+j7GGEPIHOwpYjYDBRS79vzh2sopBCxmWdSPlyg78XzI8xLDzGsQ9tfuusEVrCBTSAAAAAASUVORK5CYII=")
    __PEUI.imgWarning  = __PE_CreateImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAfCAYAAACGVs+MAAAABGdBTUEAALGOfPtRkwAAAUJJREFUSIm9l8EOgjAQRAfkwFXi3f7/X/AneDfxZkgwrIemumBpd7fgJCRcOjvzuokIFIh6R9Q7KvFoSg5jGoqOA0BtPUi9IzoDdPbvVh87gWnA3PnX08NOwkQgtEftnxIKtitg7QH4d+M+qAMs2jMXKwU9gVX7ICsFVYBoe+ZkoaAjsNE+yEJBHCDZnrlpKcgJRNo3V/9waSmIAojaM0cNBRmBzN2vpaGQDaBqz1ylFPK2yvZBUgrJAKb2zFlCIW1tbB8kobAZoKg9c89R2LYvbB+UoxANsEt7NiFFIT5ip/ZBKQo/AXZtz6ZsUfj9JlS0f93kGeYu/u246HlIezYpRmE5Snn3sV/DlGK78AlwaHs2bU3huwOGzdfsQNB6F2r8qz2byCl4AuMAugDV8w8BAFALVHdPoaLeEcbyP5kmtQ5vFTTQxSflDb4AAAAASUVORK5CYII=")
    __PEUI.imgError    = __PE_CreateImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABGdBTUEAALGOfPtRkwAAAwRJREFUSInNlz9IG3EUx7+/X3JiktOIKRpQh0IN2FpEBBFFukgHxQwOzewoEdy8LnXQxWYTUjJm6mAHh5Q6FBcJDVJwKGoDKnRQIS2NJDF/pJe7X4ckZy6XcL/YUPyO717uc+/lfX/3jqAJxSQ/y11d4NfXL7p4z/gUHH0DmHz7jvDeyzQxJvnZ5d4ubIUbuNsIugWCTiuBUP6lzIBMkeFaZkj8YSjYOtA/M2v6EA0vxsMhdhQMoFfOwmOnsFG+SgoqcJpX8VMQ8Xx5FUOLS3UZdYMxyc8SkW2MiBQugbt7OiVlhm9ZFW6vr271hsAn7wumnp9gwmnBPZmaZAYcpBXQJ88wF9nX3U3XwJjkbxkUAAQCTDgtUM9PEJP8rC44Hg6xRGS7ZdBaeCKyjXg4pME18FEwgBGR6qBEdMIR3IFlcJgbZBkchiO4AyI6dfARkeIoGNBiFOUW98pZwyDZN8Owjk5ywytQ6+gk7Jth3TWXQNArZ7WWUwC43NuFx270y+3WGlg2AyJ2msLvKu0Ey2Zwu7VmyPHYKS73du8qthVu6vpUOTtGbnnBFF4LzS0vQDk7NuTZaIkFADQm+Zm7rfE0mcF5oRW52whikp/R3NUFuk3GuBG8WSgAdAsEuasLkPceF3vpsnJZqBYEoCkoyofK52Sx9B/z+ra28mah1SzOo7/1oiiXz6PaVvNarVoVFu0Zn0KmaE6uN0g8VqtVpsjQMz4F6ugbwLVJyY2ml9fn1bqWGRx9A6XX4senj9h0l6UpaLM5FUVTCua//yYUAAq2DhTU+0HRxAlXUEssVIarf2YWp3kjuX1lndsytfD2lXVDzmleRf/MLFC9gXwYe8zGaE73hiKiE/bNMG631rh9ahkcRvvKOvKvF8GyaS2elBkOVQdeHf4gOnA8HGLxwBtMd7V2EUDZQtGUgqHVDW350w6QocUl4vb6cJBWuH3NCz1IK3B7fbqN82EsewAwF9knrnkfoikFyX8oPSkzRFMKXPM+AxQPbqGv1n//hGn0EK36aPsLmWfpjvxjpsIAAAAASUVORK5CYII=")
    __PEUI.imgQuestion = __PE_CreateImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABGdBTUEAALGOfPtRkwAABJ5JREFUSImtl19oU1cYwH/3Xm/+ddimtWmsfwpWi0q1fZijKF3VgbiHOhBB+tA+6Ihs4JOsQh/2sIeCEQdD3GgfxlgcYSDC7F4sbrQGRfwDXYnrxgxY6WrW2MXMpvlzk3v2kCZNmps/Zfuecr7z5fzO953vO/c7EusQl9srZoNhfNOBAn33/lZanHZGB/ukateqaOhye8XYPT/htJX0xi3oNQ50ix0hq5kF0knkeBg5GkJ5M4ddidN7qL3iJkpOXr0xKYY94yyaNqM59iFUW2ZC5FuJwrEASVtCDT2lIRVkqP8Y50/1GDIMlS63V3gmZkhu7SJtc6zSKkDzFUo0hOnlQ/qP7DH0vkjRde6KmPozRmLHUYRsKgmVY6+R9CQI0C11udDn20rpJOYXE3RutfFg5EIBq2DgcnvFt3cDJaGSFkVd8LPDtsy77dtpcdoBmH42zw9TCySbOtHNdQURkXQN84sJBnp2Fnie+3H1xqQY/Pon4juPG0LleJgDyu9cdr1Pd0fr2kAx+1eY0599xyOtDd1cWxAhKZ3EMnsH99n3cmcuZyeHPeMkt3aVDK+UTnKiq43ujlYiSzHG7vsZ9owzHZgHoKXJzu1LZ3G8frLm7AVCVkk632bYM55Ty9kQL5o2l0+kFRm772f3mS84+eUUn05qHBj6kXOXvweg9i0r/Uf2oiyHctCspK2NLCpOXG6vyIHH7vnRHPsqZu/124859fkEQedRUvVtpG2NJB2dfPM4kvO892A7cixUAM0uo9XvYeyef9XjcNpauU4FBOIbSTa/UxQIIatElmIF4V0LBRCqjXDKkgG73F6R3rilPJRMyRhBQaAsL7DdWQ+AbzqAbms0tANI1zTjcnuFPBsMo9c4Kl4ORnUKgg2R55w/vpuWpkxpee78slpSa6AI0K2bmA2GkX3TAXSLvSy0QJEP/fsPzuwD90cfAHDtpo9AoiGzSQMogG6uwzcdyJzxqjfVQ9VXv3KmU2Xkk9MAXB9/zAXPI7SGvSWhAELaAPl1vB6oEg1xsk0qgH741V2STQfKQvOTTmblcqgWigDln+dc+jgT3rH7fs6OPCDRfLAwciWgkq5lwN37W5Hj4aqhALIWzSXTtZs+tMaO6j1NROje34rc4rQjR0N5xuWha2Xyt8WqPM3q5ViIFqcdeXSwT1LezFUPFYJa64bV8TqgAEp0ntHBvkyK2ZU4QW0JodZUhAJEYimsJy4BoKu2qqFSKopdTfAym1y9h9pRQ0+rgrJSi0UeV4CCQA3P0HuoPfM3gNHBPqkhFUTJnnUZKIAcf03s1kVity4iJyJVQZX4Kxr0hVwzkKvjof5jmF4+NCgt4wvfUEpAJV3DtPCEof5jueni1mfyGYnth1euPWOoKTSV8RTQzbUkN3WUhZrnfQwc3mXc+mSl69wVMTW3TGJbT8kPQ5HnFaCd22qKmj2ZNfJg5II00LMTy+wdlFioaLFqoUr8FZa5nxk4vKsIauhxVnINveJEq99j3CiUKBk1PEODvrD+hj5fck+YlIV0TTO6dRO6uS73lZF0DTkRQY6FUKLz2NXEf3vClNrE//Vo+xfo7I9sJMH4KgAAAABJRU5ErkJggg==")
    __PEUI.dlgMsg = __Dom.Create("div", __PEUI.dlgMsgPanel)
    __PEUI.dlgMsg.style.textAlign = "left"
    __PEUI.dlgMsg.style.paddingTop = "25px"
    __PEUI.dlgMsg.style.paddingRight = "20px"
    __PEUI.dlgMsg.style.maxWidth = "330px"

    __PEUI.inputPanel = __Dom.Create("div", __PEUI.dialog)
    __PEUI.inputPanel.style.padding = "10px"
    __PEUI.inputPanel.style.backgroundColor = "#efefef"
    __PEUI.inputPanel.style.maxWidth = "330px"
    __PEUI.inputPrompt = __Dom.Create("div", __PEUI.inputPanel)
    __PEUI.inputPrompt.style.textAlign = "left"
    __PEUI.inputPrompt.style.marginBottom = "10px"
    __PEUI.txtInput = __Dom.Create("input", __PEUI.inputPanel)
    __PEUI.txtInput.style.width = "310px"

    __PEUI.colorPanel = __Dom.Create("div", __PEUI.dialog)
    __PEUI.colorPanel.style.padding = "10px"
    __PEUI.colorPanel.style.backgroundColor = "#efefef"
    __PEUI.ctrlColor = __Dom.Create("input", __PEUI.colorPanel)
    __PEUI.ctrlColor.type = "color"
    __PEUI.ctrlColor.style.verticalAlign = "middle"
    __PEUI.txtHex = __Dom.Create("input", __PEUI.colorPanel)
    __PEUI.txtHex.style.verticalAlign = "middle"
    __PEUI.txtHex.readOnly = true
    __PEUI.txtHex.style.height = "20px"
    __PEUI.txtHex.style.width = "60px"

    __PEUI.btnPanel =  __Dom.Create("div", __PEUI.dialog)
    __PEUI.btnPanel.style.padding = "10px"
    __PEUI.btnPanel.style.textAlign = "right"
    __PEUI.btnOk =     __PE_CreateButton("OK")
    __PEUI.btnYes =    __PE_CreateButton("Yes")
    __PEUI.btnNo =     __PE_CreateButton("No")
    __PEUI.btnCancel = __PE_CreateButton("Cancel")

    __Dom.Event __PEUI.txtInput, "keydown", @__PE_AcceptKeydown
    __Dom.Event __PEUI.ctrlColor, "input", @__PE_OnChangeColor
End Sub

Function __PE_CreateImage(url As String)
    Dim img As Object
    img = __Dom.Create("img", __PEUI.dlgImgPanel)
    img.src = url
    __PE_CreateImage = img
End Function

Function __PE_CreateButton (text As String)
    Dim btn As Object
    btn = __Dom.Create("button", __PEUI.btnPanel, text)
    btn.style.minWidth = "80px"
    btn.style.marginLeft = "5px"
    __Dom.Event btn, "click", @__PE_CloseDialog
    __Dom.Event btn, "keydown", @__PE_AcceptKeydown
    __PE_CreateButton = btn
End Function

Sub __PE_CloseDialog (event As Object)
    If __PEUI.dialogMode = "inputbox" Then
        __PEUI.dialogResult = ""
        If event.target = __PEUI.btnOk Then __PEUI.dialogResult = __PEUI.txtInput.value

    ElseIf __PEUI.dialogMode = "colorpicker" Then
        __PEUI.dialogResult = 0
        If event.target = __PEUI.btnOk Then
            Dim c As Object
            c = __PE_HexToRGB(__PEUI.ctrlColor.value)
            __PEUI.dialogResult = _RGB(c.r, c.g, c.b)
        End If
    Else 'msgbox logic
        If event.target = __PEUI.btnOk OrElse event.target = __PEUI.btnYes Then
            __PEUI.dialogResult = 1
        ElseIf event.target = __PEUI.btnCancel Then
            __PEUI.dialogResult = 0
        ElseIf event.target = __PEUI.btnNo Then
            If __PEUI.dialogMode = "yesnocancel" Then __PEUI.dialogResult = 2 Else __PEUI.dialogResult = 0
        End If
    End If
    __PEUI.dialogMode = ""
    __Sys.Call __PEUI.dialog.close, __PEUI.dialog
End Sub

Sub __PE_OnChangeColor (event)
    __PEUI.txtHex.value = __PEUI.ctrlColor.value
End Sub

Sub __PE_AcceptKeydown (event As Object)
    __Dom.StopPropagation event
    If event.target = __PEUI.txtInput Then
        If event.key = "Enter" Then __Sys.Call __PEUI.btnOk.click, __PEUI.btnOk
    End If
End Sub

Function __PE_HexToRGB (hex As String)
$If Javascript Then
    hex = hex.replace(/^#/, "");

    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return { r, g, b };
$End If
End Function