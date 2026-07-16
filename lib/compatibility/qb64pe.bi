$IncludeOnce
Import __FS From "lib/io/fs.bas"
Import __Sys From "lib/lang/system.bas"
Import __String From "lib/lang/string.bas"
Import __Dom From "lib/web/dom.bas"
Import __Console From "lib/web/console.bas"
Import __GFX From "lib/graphics/2d.bas"

' PE Constants
' -------------------------------------------------------------------------------------------------------
'Boolean values
CONST _TRUE = -1, _FALSE = 0
'Relations (e.g. SGN and _STRCMP, _STRICMP)
CONST _LESS = -1, _EQUAL = 0, _GREATER = 1
'State values (_OPENHOST/CLIENT/CONNECTION, _LOAD/COPYIMAGE, _LOADFONT, _SNDOPEN[RAW])
CONST _HOST_FAILED = 0, _CLIENT_FAILED = 0, _CONNECTION_FAILED = 0
CONST _INVALID_IMAGE = -1, _LOADFONT_FAILED = 0, _SNDOPEN_FAILED = 0
'Some strings (see also _ASC* and _CHR* section below)
CONST _STR_EMPTY = ""
CONST _STR_CRLF = CHR$(13) + CHR$(10), _STR_LF = CHR$(10) 'for native use _STR_NAT_EOL below
$IF WIN THEN
    CONST _STR_NAT_EOL = CHR$(13) + CHR$(10)
$ELSE
    CONST _STR_NAT_EOL = CHR$(10)
$END IF

'Some math
CONST _E = EXP(1.0)

'Logging values for _LOGMINLEVEL
CONST _LOG_TRACE = 1
CONST _LOG_INFO = 2
CONST _LOG_WARN = 3
CONST _LOG_ERROR = 4
CONST _LOG_NONE = 5

'Base time values
CONST _SECS_IN_MIN = 60, _MINS_IN_HOUR = 60, _HOURS_IN_DAY = 24
CONST _DAYS_IN_WEEK = 7, _DAYS_IN_YEAR = 365
'Derived time values
CONST _SECS_IN_HOUR = _MINS_IN_HOUR * _SECS_IN_MIN
CONST _SECS_IN_DAY = _HOURS_IN_DAY * _SECS_IN_HOUR
CONST _SECS_IN_WEEK = _DAYS_IN_WEEK * _SECS_IN_DAY
CONST _SECS_IN_YEAR = _DAYS_IN_YEAR * _SECS_IN_DAY
CONST _SECS_IN_LEAPYEAR = _SECS_IN_YEAR + _SECS_IN_DAY
CONST _MINS_IN_DAY = _HOURS_IN_DAY * _MINS_IN_HOUR
CONST _MINS_IN_WEEK = _DAYS_IN_WEEK * _MINS_IN_DAY
CONST _MINS_IN_YEAR = _DAYS_IN_YEAR * _MINS_IN_DAY
CONST _MINS_IN_LEAPYEAR = _MINS_IN_YEAR + _MINS_IN_DAY
CONST _HOURS_IN_WEEK = _DAYS_IN_WEEK * _HOURS_IN_DAY
CONST _HOURS_IN_YEAR = _DAYS_IN_YEAR * _HOURS_IN_DAY
CONST _HOURS_IN_LEAPYEAR = _HOURS_IN_YEAR + _HOURS_IN_DAY
CONST _DAYS_IN_LEAPYEAR = _DAYS_IN_YEAR + 1
CONST _WEEKS_IN_YEAR = _DAYS_IN_YEAR / _DAYS_IN_WEEK
CONST _WEEKS_IN_LEAPYEAR = _DAYS_IN_LEAPYEAR / _DAYS_IN_WEEK

'Binary size factors
CONST _ONE_KB = 1024 '            ' 2^10
CONST _ONE_MB = _ONE_KB * _ONE_KB ' 2^20
CONST _ONE_GB = _ONE_MB * _ONE_KB ' 2^30
CONST _ONE_TB = _ONE_GB * _ONE_KB ' 2^40
CONST _ONE_PB = _ONE_TB * _ONE_KB ' 2^50
CONST _ONE_EB = _ONE_PB * _ONE_KB ' 2^60

'Sizes of elementary integer types (in bytes)
CONST _SIZE_OF_BYTE = 1
CONST _SIZE_OF_INTEGER = 2
CONST _SIZE_OF_LONG = 4
CONST _SIZE_OF_INTEGER64 = 8
'Sizes of elementary floating point types (in bytes)
CONST _SIZE_OF_SINGLE = 4
CONST _SIZE_OF_DOUBLE = 8
CONST _SIZE_OF_FLOAT = 32
'Sizes of elementary pointer types (in bytes)
$IF 32BIT THEN
    CONST _SIZE_OF_OFFSET = 4
$ELSE
    CONST _SIZE_OF_OFFSET = 8
$END IF

'Limits of elementary integer types (min/max values)
CONST _BIT_MIN = -1, _BIT_MAX = 0
CONST _UBIT_MIN = 0, _UBIT_MAX = 1
CONST _BYTE_MIN = -128, _BYTE_MAX = 127
CONST _UBYTE_MIN = 0, _UBYTE_MAX = 255
CONST _INTEGER_MIN = -32768, _INTEGER_MAX = 32767
CONST _UINTEGER_MIN = 0, _UINTEGER_MAX = 65535
CONST _LONG_MIN = -2147483648, _LONG_MAX = 2147483647
CONST _ULONG_MIN = 0, _ULONG_MAX = 4294967295
CONST _INTEGER64_MIN = -9223372036854775808, _INTEGER64_MAX = 9223372036854775807
CONST _UINTEGER64_MIN = 0, _UINTEGER64_MAX = 18446744073709551615
'Limits of elementary floating point types (min/max values)
CONST _SINGLE_MIN = __PE_FCONST("-3.402823E+38"), _SINGLE_MAX = __PE_FCONST("3.402823E+38")
CONST _SINGLE_MIN_FRAC = __PE_FCONST("1.175494E-38")
CONST _DOUBLE_MIN = __PE_FCONST("-1.797693134862315E+308"), _DOUBLE_MAX = __PE_FCONST("1.797693134862315E+308")
CONST _DOUBLE_MIN_FRAC = __PE_FCONST("2.225073858507201E-308")
CONST _FLOAT_MIN = _DOUBLE_MIN, _FLOAT_MAX = _DOUBLE_MAX
CONST _FLOAT_MIN_FRAC = _DOUBLE_MIN_FRAC
'Limits of elementary pointer types (min/max values)
$IF 32BIT THEN
    CONST _OFFSET_MIN = -2147483648, _OFFSET_MAX = 2147483647
    CONST _UOFFSET_MIN = 0, _UOFFSET_MAX = 4294967295
$ELSE
    CONST _OFFSET_MIN = -9223372036854775808, _OFFSET_MAX = 9223372036854775807
    CONST _UOFFSET_MIN = 0, _UOFFSET_MAX = 18446744073709551615
$END IF

'Control char codes (ASC + CHR$)
CONST _ASC_NUL = 0, _CHR_NUL = CHR$(0) '     Null
CONST _ASC_SOH = 1, _CHR_SOH = CHR$(1) '     Start of Heading
CONST _ASC_STX = 2, _CHR_STX = CHR$(2) '     Start of Text
CONST _ASC_ETX = 3, _CHR_ETX = CHR$(3) '     End of Text
CONST _ASC_EOT = 4, _CHR_EOT = CHR$(4) '     End of Transmission
CONST _ASC_ENQ = 5, _CHR_ENQ = CHR$(5) '     Enquiry
CONST _ASC_ACK = 6, _CHR_ACK = CHR$(6) '     Acknowledge
CONST _ASC_BEL = 7, _CHR_BEL = CHR$(7) '     Bell
CONST _ASC_BS = 8, _CHR_BS = CHR$(8) '       Backspace
CONST _ASC_HT = 9, _CHR_HT = CHR$(9) '       Horizontal Tab
CONST _ASC_LF = 10, _CHR_LF = CHR$(10) '     Line Feed
CONST _ASC_VT = 11, _CHR_VT = CHR$(11) '     Vertical Tab
CONST _ASC_FF = 12, _CHR_FF = CHR$(12) '     Form Feed
CONST _ASC_CR = 13, _CHR_CR = CHR$(13) '     Carriage Return
CONST _ASC_SO = 14, _CHR_SO = CHR$(14) '     Shift Out
CONST _ASC_SI = 15, _CHR_SI = CHR$(15) '     Shift In
CONST _ASC_DLE = 16, _CHR_DLE = CHR$(16) '   Data Link Escape
CONST _ASC_DC1 = 17, _CHR_DC1 = CHR$(17) '   Device Control 1
CONST _ASC_DC2 = 18, _CHR_DC2 = CHR$(18) '   Device Control 2
CONST _ASC_DC3 = 19, _CHR_DC3 = CHR$(19) '   Device Control 3
CONST _ASC_DC4 = 20, _CHR_DC4 = CHR$(20) '   Device Control 4
CONST _ASC_NAK = 21, _CHR_NAK = CHR$(21) '   Negative Acknowledge
CONST _ASC_SYN = 22, _CHR_SYN = CHR$(22) '   Synchronous Idle
CONST _ASC_ETB = 23, _CHR_ETB = CHR$(23) '   End of Transmission Block
CONST _ASC_CAN = 24, _CHR_CAN = CHR$(24) '   Cancel
CONST _ASC_EM = 25, _CHR_EM = CHR$(25) '     End of Medium
CONST _ASC_SUB = 26, _CHR_SUB = CHR$(26) '   Substitute
CONST _ASC_ESC = 27, _CHR_ESC = CHR$(27) '   Escape
CONST _ASC_FS = 28, _CHR_FS = CHR$(28) '     File Separator
CONST _ASC_GS = 29, _CHR_GS = CHR$(29) '     Group Separator
CONST _ASC_RS = 30, _CHR_RS = CHR$(30) '     Record Separator
CONST _ASC_US = 31, _CHR_US = CHR$(31) '     Unit Separator
CONST _ASC_DEL = 127, _CHR_DEL = CHR$(127) ' Delete
'Normal char codes (exluding 0-9/Aa-Zz)
CONST _ASC_SPACE = 32, _CHR_SPACE = CHR$(32)
CONST _ASC_EXCLAMATION = 33, _CHR_EXCLAMATION = CHR$(33) '               !
CONST _ASC_QUOTE = 34, _CHR_QUOTE = CHR$(34) '                           "
CONST _ASC_HASH = 35, _CHR_HASH = CHR$(35) '                             #
CONST _ASC_DOLLAR = 36, _CHR_DOLLAR = CHR$(36) '                         $
CONST _ASC_PERCENT = 37, _CHR_PERCENT = CHR$(37) '                       %
CONST _ASC_AMPERSAND = 38, _CHR_AMPERSAND = CHR$(38) '                   &
CONST _ASC_APOSTROPHE = 39, _CHR_APOSTROPHE = CHR$(39) '                 '
CONST _ASC_LEFTBRACKET = 40, _CHR_LEFTBRACKET = CHR$(40) '               (
CONST _ASC_RIGHTBRACKET = 41, _CHR_RIGHTBRACKET = CHR$(41) '             )
CONST _ASC_ASTERISK = 42, _CHR_ASTERISK = CHR$(42) '                     *
CONST _ASC_PLUS = 43, _CHR_PLUS = CHR$(43) '                             +
CONST _ASC_COMMA = 44, _CHR_COMMA = CHR$(44) '                           ,
CONST _ASC_MINUS = 45, _CHR_MINUS = CHR$(45) '                           -
CONST _ASC_FULLSTOP = 46, _CHR_FULLSTOP = CHR$(46) '                     .
CONST _ASC_FORWARDSLASH = 47, _CHR_FORWARDSLASH = CHR$(47) '             /
CONST _ASC_COLON = 58, _CHR_COLON = CHR$(58) '                           :
CONST _ASC_SEMICOLON = 59, _CHR_SEMICOLON = CHR$(59) '                   ;
CONST _ASC_LESSTHAN = 60, _CHR_LESSTHAN = CHR$(60) '                     <
CONST _ASC_EQUAL = 61, _CHR_EQUAL = CHR$(61) '                           =
CONST _ASC_GREATERTHAN = 62, _CHR_GREATERTHAN = CHR$(62) '               >
CONST _ASC_QUESTION = 63, _CHR_QUESTION = CHR$(63) '                     ?
CONST _ASC_ATSIGN = 64, _CHR_ATSIGN = CHR$(64) '                         @
CONST _ASC_LEFTSQUAREBRACKET = 91, _CHR_LEFTSQUAREBRACKET = CHR$(91) '   [
CONST _ASC_BACKSLASH = 92, _CHR_BACKSLASH = CHR$(92) '                   \
CONST _ASC_RIGHTSQUAREBRACKET = 93, _CHR_RIGHTSQUAREBRACKET = CHR$(93) ' ]
CONST _ASC_CARET = 94, _CHR_CARET = CHR$(94) '                           ^
CONST _ASC_UNDERSCORE = 95, _CHR_UNDERSCORE = CHR$(95) '                 _
CONST _ASC_GRAVE = 96, _CHR_GRAVE = CHR$(96) '                           `
CONST _ASC_LEFTCURLYBRACKET = 123, _CHR_LEFTCURLYBRACKET = CHR$(123) '   {
CONST _ASC_VERTICALBAR = 124, _CHR_VERTICALBAR = CHR$(124) '             |
CONST _ASC_RIGHTCURLYBRACKET = 125, _CHR_RIGHTCURLYBRACKET = CHR$(125) ' }
CONST _ASC_TILDE = 126, _CHR_TILDE = CHR$(126) '                         ~

'_KEYDOWN/_KEYHIT codes
CONST _KEY_LSHIFT = 100304, _KEY_RSHIFT = 100303
CONST _KEY_LCTRL = 100306, _KEY_RCTRL = 100305
CONST _KEY_LALT = 100308, _KEY_RALT = 100307
CONST _KEY_LAPPLE = 100310, _KEY_RAPPLE = 100309
CONST _KEY_F1 = 15104, _KEY_F2 = 15360, _KEY_F3 = 15616, _KEY_F4 = 15872
CONST _KEY_F5 = 16128, _KEY_F6 = 16384, _KEY_F7 = 16640, _KEY_F8 = 16896
CONST _KEY_F9 = 17152, _KEY_F10 = 17408, _KEY_F11 = 34048, _KEY_F12 = 34304
CONST _KEY_INSERT = 20992, _KEY_DELETE = 21248
CONST _KEY_HOME = 18176, _KEY_END = 20224
CONST _KEY_PAGEUP = 18688, _KEY_PAGEDOWN = 20736
CONST _KEY_LEFT = 19200, _KEY_RIGHT = 19712, _KEY_UP = 18432, _KEY_DOWN = 20480
CONST _KEY_BACKSPACE = 8, _KEY_TAB = 9, _KEY_ENTER = 13, _KEY_ESC = 27

'ERROR codes (ERROR n triggers an error, n = ERR will return the last occurred error)
CONST _ERR_NONE = 0 'for compare with ERR only !!
CONST _ERR_NEXT_WITHOUT_FOR = 1
CONST _ERR_SYNTAX_ERROR = 2
CONST _ERR_RETURN_WITHOUT_GOSUB = 3
CONST _ERR_OUT_OF_DATA = 4
CONST _ERR_ILLEGAL_FUNCTION_CALL = 5
CONST _ERR_OVERFLOW = 6
CONST _ERR_OUT_OF_MEMORY = 7
CONST _ERR_LABEL_NOT_DEFINED = 8
CONST _ERR_SUBSCRIPT_OUT_OF_RANGE = 9
CONST _ERR_DUPLICATE_DEFINITION = 10
CONST _ERR_DIVISION_BY_ZERO = 11
CONST _ERR_ILLEGAL_IN_DIRECT_MODE = 12
CONST _ERR_TYPE_MISMATCH = 13
CONST _ERR_OUT_OF_STRING_SPACE = 14
CONST _ERR_STRING_FORMULA_TOO_COMPLEX = 16
CONST _ERR_CANNOT_CONTINUE = 17
CONST _ERR_FUNCTION_NOT_DEFINED = 18
CONST _ERR_NO_RESUME = 19
CONST _ERR_RESUME_WITHOUT_ERROR = 20
CONST _ERR_DEVICE_TIMEOUT = 24
CONST _ERR_DEVICE_FAULT = 25
CONST _ERR_FOR_WITHOUT_NEXT = 26
CONST _ERR_OUT_OF_PAPER = 27
CONST _ERR_WHILE_WITHOUT_WEND = 29
CONST _ERR_WEND_WITHOUT_WHILE = 30
CONST _ERR_DUPLICATE_LABEL = 33
CONST _ERR_SUBPROGRAM_NOT_DEFINED = 35
CONST _ERR_ARGUMENT_COUNT_MISMATCH = 37
CONST _ERR_ARRAY_NOT_DEFINED = 38
CONST _ERR_VARIABLE_REQUIRED = 40
CONST _ERR_FIELD_OVERFLOW = 50
CONST _ERR_INTERNAL_ERROR = 51
CONST _ERR_BAD_FILE_NAME_OR_NUMBER = 52
CONST _ERR_FILE_NOT_FOUND = 53
CONST _ERR_BAD_FILE_MODE = 54
CONST _ERR_FILE_ALREADY_OPEN = 55
CONST _ERR_FIELD_STATEMENT_ACTIVE = 56
CONST _ERR_DEVICE_IO_ERROR = 57
CONST _ERR_FILE_ALREADY_EXISTS = 58
CONST _ERR_BAD_RECORD_LENGTH = 59
CONST _ERR_DISK_FULL = 61
CONST _ERR_INPUT_PAST_END_OF_FILE = 62
CONST _ERR_BAD_RECORD_NUMBER = 63
CONST _ERR_BAD_FILE_NAME = 64
CONST _ERR_TOO_MANY_FILES = 67
CONST _ERR_DEVICE_UNAVAILABLE = 68
CONST _ERR_COMMUNICATION_BUFFER_OVERFLOW = 69
CONST _ERR_PERMISSION_DENIED = 70
CONST _ERR_DISK_NOT_READY = 71
CONST _ERR_DISK_MEDIA_ERROR = 72
CONST _ERR_FEATURE_UNAVAILABLE = 73
CONST _ERR_RENAME_ACROSS_DISKS = 74
CONST _ERR_PATH_FILE_ACCESS_ERROR = 75
CONST _ERR_PATH_NOT_FOUND = 76
CONST _ERR_INVALID_HANDLE = 258
' ---------------------------------------------------------------------------

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
Function _FullPath$ (path As String)
    Dim parentPath As String
    parentPath = CWD$
    If parentPath <> "/" Then parentPath = parentPath + "/"
    _FullPath$ = __FS.NormalizePath(parentPath + path)
End Function

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
    If stitle = undefined Then stitle = "&nbsp;"
    If message = undefined Then message = "&nbsp;"
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
Function _MouseHidden
    Dim canvas As Object
    canvas = __Dom.GetImage(0)
    If canvas.style.cursor = "none" Then _MouseHidden = -1 Else _MouseHidden = 0
End Function

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
' _ULINESPACING - returns the vertical line spacing (distance between two consecutive baselines) in pixels.	
' _UPRINTWIDTH - returns the width in pixels of the text string specified.	
' _UPRINTSTRING - prints ASCII / UNICODE text strings using graphic column and row coordinate positions.	
' _WAVE - defines the waveform shape for a specified audio channel when used with SOUND or PLAY.	

' _WRITEFILE - writes a string into a new file, overwriting an existing file of the same name.
Sub _WriteFile (filename As String, contents As String)
    __FS.WriteText filename, contents
End Sub

' Internal library methods
' ------------------------------------------------------------------------------
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

FUNCTION __PE_FCONST (numstr As String)
$If Javascript Then
    return numstr * 1
$End If
END FUNCTION