' HTTP 1.1 Compliant Web Server
' Author: luke
' Source: https://www.qb64.org/forum/index.php?topic=2052.0
' This program is made available for you to use, modify and distribute it as you wish,
' all under the condition you do not claim original authorship.
'$ExeIcon:'./../gx/resource/gx.ico'
$Console:Only
Option _Explicit
DefLng A-Z

Const MAX_CONNECTIONS = 8
Dim PORT As Integer: PORT = 8080
If _CommandCount > 0 Then
    PORT = Val(Command$(1))
End If

Const FALSE = 0
Const TRUE = -1
Dim Shared CRLF As String
CRLF = Chr$(13) + Chr$(10)
Const HTTP_10 = 1
Const HTTP_11 = 11
Const HTTP_GET = 1
Const HTTP_HEAD = 2
Const HTTP_POST = 3
Type connection_t
    handle As Long
    read_buf As String
    http_version As Integer
    method As Integer
    request_uri As String
End Type

Type http_error_t
    code As Integer
    message As String
    connection As Integer
End Type

Type file_error_t
    failed As Integer
    code As Integer
End Type

Dim i
Dim num_active_connections
Dim server_handle
Dim Shared Connections(1 To MAX_CONNECTIONS) As connection_t
Dim Shared Http_error_info As http_error_t
Dim Shared File_error_info As file_error_t

On Error GoTo error_handler

server_handle = _OpenHost("TCP/IP:" + LTrim$(Str$(PORT)))
Print "Listening on port:" + Str$(PORT)
Do
    If num_active_connections < MAX_CONNECTIONS Then
        Dim new_connection
        new_connection = _OpenConnection(server_handle)
        If new_connection Then
            num_active_connections = num_active_connections + 1
            For i = 1 To MAX_CONNECTIONS
                If Connections(i).handle = 0 Then
                    Dim empty_connection As connection_t
                    Connections(i) = empty_connection
                    Connections(i).handle = new_connection
                    num_active_connections = num_active_connections - 1
                    Exit For
                End If
            Next i
        End If
    End If

    For i = 1 To MAX_CONNECTIONS
        If Connections(i).handle Then
            Dim buf$
            Get #Connections(i).handle, , buf$
            If buf$ <> "" Then
                Connections(i).read_buf = Connections(i).read_buf + buf$
                process_request i
                http_error_complete:
            End If
        End If
    Next i
    _Limit 240
Loop



error_handler:
If Err = 100 Then 'HTTP error
    Print "HTTP error"; Http_error_info.code; Http_error_info.message; " for connection"; Http_error_info.connection
    Resume http_error_complete
End If
Print "error"; Err; "on line"; _ErrorLine
End

file_error_handler:
File_error_info.failed = TRUE
File_error_info.code = Err
Resume Next

Sub http_send_status (c, code, message As String)
    Dim s$
    s$ = "HTTP/1.1" + Str$(code) + " " + message + CRLF
    Put #Connections(c).handle, , s$
End Sub

Sub http_send_header (c, header As String, value As String)
    Dim s$
    s$ = header + ": " + value + CRLF
    Put #Connections(c).handle, , s$
End Sub

Sub http_end_headers (c)
    Put #Connections(c).handle, , CRLF
End Sub

Sub http_send_body (c, body As String)
    Put #Connections(c).handle, , body
End Sub

Sub http_do_get (c)
    Dim filepath As String, filedata As String
    Dim fh
    filepath = get_requested_filesystem_path(c)
    Print filepath
    If Not _FileExists(filepath) Then http_error 404, "Not Found", c

    On Error GoTo file_error_handler
    fh = FreeFile
    File_error_info.failed = FALSE
    Open filepath For Binary As #fh
    On Error GoTo error_handler
    If File_error_info.failed Then http_error 403, "Permission Denied", c

    'Doing this all in one go isn't healthy for a number of reasons (memory usage, starving other clients)
    'It should be done in chunks in the main loop
    filedata = Space$(LOF(fh))
    Get #fh, , filedata
    Close #fh
    http_send_status c, 200, "OK"
    http_send_header c, "Content-Length", LTrim$(Str$(Len(filedata)))
    If InStr(filepath, ".svg") Then
        http_send_header c, "Content-Type", "image/svg+xml"
    ElseIf InStr(filepath, ".js") Then
        http_send_header c, "Content-Type", "text/javascript"
    End If
    http_send_header c, "Access-Control-Allow-Origin", "true"
    http_send_header c, "Connection", "close"
    http_end_headers c
    http_send_body c, filedata
    close_connection c
End Sub

Sub http_do_head (c)
    Print "http_do_head"
    Dim s$
    s$ = "HTTP/1.1 200 OK" + CRLF + CRLF
    Put #Connections(c).handle, , s$
End Sub

Sub http_do_post (c)
    Print "POST"
    Print Connections(c).request_uri
    Dim path As String
    path = Right$(Connections(c).request_uri, Len(Connections(c).request_uri) - 1)
    Dim idx As Integer
    idx = _InStrRev(path, "/")
    path = Left$(path, idx)

    Dim basFile As String
    basFile = path + "game.bas"
    Dim jsFile As String
    jsFile = path + "game.js"

    If _FileExists(basFile) Then Kill basFile
    Dim fh
    fh = FreeFile
    Open basFile For Binary As #fh
    Put #fh, , Connections(c).read_buf
    Close #fh

    Shell "qb2js " + basFile + " > " + jsFile

    close_connection c
End Sub

Sub close_connection (c)
    Close #Connections(c).handle
    Connections(c).handle = 0
End Sub

Function get_requested_filesystem_path$ (c)
    '7230 5.3 also 3986 for URI
    'Origin form only for now
    Dim raw_path As String
    raw_path = Connections(c).request_uri
    If Left$(raw_path, 1) <> "/" Then http_error 400, "Malformed URI", c

    Dim hash, questionmark, path_len
    hash = InStr(raw_path, "#") 'Clients shouldn't be sending fragments, but we will gracefully ignore them
    questionmark = InStr(raw_path, "?")
    path_len = Len(raw_path)
    If hash > 0 Then path_len = hash - 1
    'If questionmark > 0 And questionmark < hash Then path_len = questionmark - 1
    If questionmark > 0 Then path_len = questionmark - 1
    ' Query strings are ignored for now

    'Dim cwd As String
    'cwd = _CWD$
    '$If WIN Then
    '    'raw_path = GXSTR_Replace(raw_path, "/", "\")
    '    cwd = GXSTR_Replace(cwd, "\", "/")
    '$End If
    Dim path As String
    path = Left$(raw_path, path_len)
    Print "--> " + path

    If Right$(path, 1) = "/" Then path = path + "index.html"

    'get_requested_filesystem_path = _StartDir$ + cannonicalise_path(percent_decode(Left$(raw_path, path_len)))
    get_requested_filesystem_path = _StartDir$ + cannonicalise_path(percent_decode(path))
End Function

Function percent_decode$ (raw_string As String)
    Dim final_string As String, hexchars As String
    Dim i, c
    For i = 1 To Len(raw_string)
        c = Asc(raw_string, i)
        If c = 37 Then '%
            hexchars = Mid$(raw_string, i + 1, 2)
            If Len(hexchars) = 2 And InStr("0123456789abcdefABCDEF", Left$(hexchars, 1)) > 0 And InStr("0123456789abcdefABCDEF", Right$(hexchars, 1)) > 0 Then
                final_string = final_string + Chr$(Val("&H" + hexchars))
            Else
                'String ends in something like "%1", or is invalid hex characters
                final_string = final_string + "%" + hexchars
            End If
            i = i + Len(hexchars)
        Else
            final_string = final_string + Chr$(c)
        End If
    Next i
    percent_decode = final_string
End Function


Function cannonicalise_path$ (raw_path As String)
    Dim path As String
    ReDim segments(1 To 1) As String
    Dim i, uplevels
    split raw_path, "/", segments()
    For i = UBound(segments) To 1 Step -1
        If segments(i) = "." Or segments(i) = "" Then
            _Continue
        ElseIf segments(i) = ".." Then
            uplevels = uplevels + 1
        Else
            If uplevels = 0 Then
                path = "/" + segments(i) + path
            Else
                uplevels = uplevels - 1
            End If
        End If
    Next i
    If path = "" Then path = "/"
    'Note: if uplevels > 0 at this point, the path attempted to go above the root
    'This is usually a client trying to be naughty
    cannonicalise_path = path
End Function

'https://www.qb64.org/forum/index.php?topic=1607.0
Sub split (SplitMeString As String, delim As String, loadMeArray() As String)
    Dim curpos As Long, arrpos As Long, LD As Long, dpos As Long 'fix use the Lbound the array already has
    curpos = 1: arrpos = LBound(loadMeArray): LD = Len(delim)
    dpos = InStr(curpos, SplitMeString, delim)
    Do Until dpos = 0
        loadMeArray(arrpos) = Mid$(SplitMeString, curpos, dpos - curpos)
        arrpos = arrpos + 1
        If arrpos > UBound(loadMeArray) Then ReDim _Preserve loadMeArray(LBound(loadMeArray) To UBound(loadMeArray) + 1000) As String
        curpos = dpos + LD
        dpos = InStr(curpos, SplitMeString, delim)
    Loop
    loadMeArray(arrpos) = Mid$(SplitMeString, curpos)
    ReDim _Preserve loadMeArray(LBound(loadMeArray) To arrpos) As String 'get the ubound correct
End Sub


Sub process_request (c)
    Dim eol
    Dim l As String
    Do
        eol = InStr(Connections(c).read_buf, CRLF)
        If eol = 0 Then Exit Sub
        l = Left$(Connections(c).read_buf, eol - 1)
        Connections(c).read_buf = Mid$(Connections(c).read_buf, eol + 2)
        If Connections(c).http_version = 0 Then 'First line not yet read
            process_start_line c, l
        Else
            If l = "" Then
                'headers complete; act upon request now
                Select Case Connections(c).method
                    Case HTTP_GET
                        http_do_get c
                    Case HTTP_POST
                        http_do_post c
                    Case HTTP_HEAD
                        http_do_head c
                End Select
                Exit Sub
            Else
                process_header c, l
            End If
        End If
    Loop
End Sub

Sub process_start_line (c, l As String)
    '7230 3.1.1
    'METHOD uri HTTP/x.y
    Dim sp1, sp2
    sp1 = InStr(l, " ")
    If sp1 = 0 Then http_error 400, "Bad Request", c

    '7231 4.3
    Select Case Left$(l, sp1 - 1)
        Case "GET"
            Connections(c).method = HTTP_GET
        Case "HEAD"
            Connections(c).method = HTTP_HEAD
        Case "POST"
            Connections(c).method = HTTP_POST
        Case Else
            http_error 501, "Not Implemented", c
    End Select

    sp2 = InStr(sp1 + 1, l, " ")
    If sp2 = 0 Or sp2 - sp1 = 1 Then http_error 400, "Bad Request", c
    Connections(c).request_uri = Mid$(l, sp1 + 1, sp2 - sp1 - 1)

    '7230 2.6
    If Mid$(l, sp2 + 1, 5) <> "HTTP/" Then
        http_error 400, "Bad Request", c
    End If
    Select Case Mid$(l, sp2 + 6)
        Case "1.0"
            Connections(c).http_version = HTTP_10
        Case "1.1"
            Connections(c).http_version = HTTP_11
        Case Else
            http_error 505, "HTTP Version Not Supported", c
    End Select
End Sub

Sub process_header (c, l As String)
    'All headers ignored for now
End Sub

Sub http_error (code, message As String, connection)
    http_send_status connection, code, message
    http_send_header connection, "Content-Length", "0"
    http_send_header connection, "Connection", "close"
    http_end_headers connection
    close_connection connection
    Http_error_info.code = code
    Http_error_info.message = message
    Http_error_info.connection = connection
    Error 100
End Sub
