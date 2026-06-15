$If WEB Then
Import __FS From "lib/io/fs.bas"
Import __Sys From "lib/lang/system.bas"
Import __Dom From "lib/web/dom.bas"
Import __Console From "lib/web/console.bas"
Import __GFX From "lib/graphics/2d.bas"

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
    _InputBox$ = __Dom.Prompt(message, defaultValue)
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
    __Dom.Alert message
End Sub

' _MESSAGEBOX (function) - displays a message dialog box, which presents a message and returns the button ID clicked by the user.	
Function _MessageBox (stitle As String, message As String, dialogType As String, iconType As String, defaultButton As Integer)
    Dim result
    result = __Dom.Confirm(message)
    If result Then _MessageBox = 1 Else _MessageBox = 0
End Function

' _MIN - returns the lesser of two given numeric values.	
Function _Min (value1, value2)
    _Min = __Sys.Call(Math.min, , value1, value2)
End Function

' _MOUSEHIDDEN - returns a boolean value according to the current mouse cursor state (hidden or visible).	
' _MIDISOUNDBANK - enables _SNDOPEN to use an external FM Bank or SoundFont when playing MIDI files.	
' _NOTIFYPOPUP - shows a system notification.	
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
$End If