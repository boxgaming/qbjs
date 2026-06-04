Import SYS From "lib/lang/System.bas"
Import JSArray From "lib/lang/array.bas"

Export Add, Alert, Confirm, Create, Event, Container, Get, GetImage, Remove
Export GetAttribute, SetAttribute, GetAttributeNames, GetElementsByClassName
Export Prompt, DialogClose, DialogShowModal, DialogShow, Focus, HasFocus, SelectAll
Export RequestFullscreen, StopPropagation, RequestAnimationFrame, Document, Window

Dim e As Object
If QB._domElements Then
    e = JSArray.Pop(QB._domElements)
    While e
        Remove e
        e = JSArray.Pop(QB._domElements)
    Wend 
Else
    QB._domElements = JSArray.Create
End If

If QB._domEvents Then
    e = JSArray.Pop(QB._domEvents)
    While e
        Sys.Call e.target.removeEventListener, e.target, e.eventType, e.callbackFn
    e = JSArray.Pop(QB._domEvents)
    Wend
Else
    QB._domEvents = JSArray.Create
End If


Sub Alert (text As String)
    Sys.Call window.alert, , text 
End Sub

Function Confirm (text As String)
    $If Javascript Then
        Confirm = QB.toBoolean(confirm(text));
    $End If
End Function

Sub Add (e As Object, parent As Object, beforeElement As Object)
    If Sys.TypeOf(e) = "string" Then e = Sys.Call(document.getElementById, document, e)
    If parent = undefined OrElse parent = "" Then parent = Container
    If Sys.TypeOf(parent) = "string" Then parent = Sys.Call(document.getElementById, document, parent)
    If beforeElement = "" Then beforeElement = undefined
    If Sys.TypeOf(beforeElement) = "string" Then beforeElement = Sys.Call(document.getElementById, document, beforeElement)
    Sys.Call parent.insertBefore, parent, e, beforeElement
End Sub

Function Create (etype As String, parent As Object, content As String, eid As String, beforeElement As Object)
    Dim e As Object
    e = Sys.Call(document.createElement, document, etype)
    If eid <> undefined AndAlso eid <> "" Then e.id = eid
    e.className = "qbjs"

    If content <> undefined Then
        If e.value <> undefined Then e.value = content
        If e.innerHTML <> undefined Then e.innerHTML = content
    End If

    Sys.Call QB._domElements.push, QB._domElements, e
    Add e, parent, beforeElement
    Create = e
End Function

Sub Create (etype As String, parent As Object, content As String, eid As String, beforeElement As Object) 
    Dim e As Object: e = Create(etype, parent, content, eid, beforeElement)
End Sub

Sub Event (target As Object, eventType As String, callbackFn As Object)
    $If Javascript Then
        if (typeof target == "string") {
            target = document.getElementById(target);
        }
        var callbackWrapper = async function(event) {
            var result = await callbackFn(event);
            if (result == false) {
                event.preventDefault();
            }
            return result;
        }
        target.addEventListener(eventType, callbackWrapper);
        QB._domEvents.push({ target: target, eventType: eventType, callbackFn: callbackWrapper});
    $End If
End Sub

Function Container
    Container = Get("gx-container")
End Function

Function Window
    $If Javascript Then
        return window;
    $End If
End Function

Function Document
    $If Javascript Then
        return document;
    $End If
End Function

Function Get (eid As String)
    Get = Sys.Call(document.getElementById, document, eid)
End Function

Function GetAttribute (e As Object, attributeName As String)
    If Sys.TypeOf(e) = "string" Then e = Sys.Call(document.getElementById, document, e)
    GetAttribute = Sys.Call(e.getAttribute, e, attributeName)
End Function

Sub SetAttribute (e As Object, attributeName As String, attributeValue As String)
    If Sys.TypeOf(e) = "string" Then e = Sys.Call(document.getElementById, document, e)
    Sys.Call e.setAttribute, e, attributeName, attributeValue
End Sub

Function GetAttributeNames (e As Object)
    If Sys.TypeOf(e) = "string" Then e = Sys.Call(document.getElementById, document, e)
    GetAttributeNames = JSArray.ToQBArray(Sys.Call(e.getAttributeNames, e))
End Function

Function GetElementsByClassName (className As String, e As Object)
    If e = undefined Then 
        e = Document
    ElseIf Sys.TypeOf(e) = "string" Then
        e = Sys.Call(document.getElementById, document, e)
    End If
    Dim elements As Object
    elements = Sys.Call(e.getElementsByClassName, e, className)
    GetElementsByClassName = JSArray.ToQBArray(elements)
End Function

Function GetImage (imageId As Integer)
    $If Javascript Then
        GetImage = QB.getImage(imageId);
    $End If
End Function

Sub Remove (e As Object)
    If Sys.TypeOf(e) = "string" Then e = Sys.Call(document.getElementById, document, e)
    Sys.Call e.remove, e
End Sub

Function Prompt (text As String, defaultValue As String)
    Dim result As String
    result = Sys.Call(window.prompt, , text, defaultValue)
    If Negate result Then result = ""
    Prompt = result
End Function

Sub DialogClose (element As Object)
    Sys.Call element.close, element
End Sub

Sub DialogShowModal (element As Object)
    Sys.Call element.showModal, element
End Sub

Sub DialogShow(element As Object)
    Sys.Call element.show, element
End Sub

Sub Focus (element As Object)
    Sys.Call element.focus, element
End Sub

Function HasFocus (element As Object)
    HasFocus = Sys.Call(element.hasFocus, element)
End Function

Sub SelectAll (element As Object)
    Sys.Call element.select, element
End Sub

Sub RequestFullscreen (element As Object)
    Sys.Call element.requestFullscreen, element
End Sub

Sub StopPropagation (e As Object)
    Sys.Call e.stopPropagation, e
End Sub

Sub RequestAnimationFrame (fnCallback As Sub)
    Sys.Call requestAnimationFrame, , fnCallback
End Sub