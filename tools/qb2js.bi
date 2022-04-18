' Define web-only types and methods needed for compilation
Type FetchResponse
    ok As Integer
    status As Integer
    statusText As String
    text As String
End Type

Sub Fetch (url As String, response As FetchResponse): End Sub
