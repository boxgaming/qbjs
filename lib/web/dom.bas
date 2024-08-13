Export Add, Alert, Confirm, Create, Event, Container, Get, GetImage, Remove, Prompt

$If Javascript Then
    if (QB._domElements) {
        var e = null;    
        while (e = QB._domElements.pop()) {
            e.remove();
        }
    }
    else { 
        QB._domElements = []; 
    }

    if (QB._domEvents) {
        while (e = QB._domEvents.pop()) {
            e.target.removeEventListener(e.eventType, e.callbackFn);
        }
    }
    else {
        QB._domEvents = [];
    }
$End If

Sub Alert (text As String) 
    $If Javascript Then
        alert(text);
    $End If
End Sub

Function Confirm (text As String) 
    $If Javascript Then
        Confirm = confirm(text) ? -1 : 0;
    $End If
End Function

Sub Add (e As Object, parent As Object, beforeElement As Object)
    $If Javascript Then
        if (typeof e == "string") {
            e = document.getElementById(e);
        }

        if (parent == undefined || parent == "") {
            parent = await func_Container(); 
        }
        else if (typeof parent == "string") {
            parent = document.getElementById(parent);
        }

        if (beforeElement == undefined || beforeElement == "") {
            beforeElement = null;
        }
        else if (typeof beforeElement == "string") {
            beforeElement = document.getElementById(beforeElement);
        }
        
        parent.insertBefore(e, beforeElement);
    $End If
End Sub

Function Create (etype As String, parent As Object, content As String, eid As String, beforeElement As Object)
    $If Javascript Then
        var e = document.createElement(etype); 
        if (eid != undefined && eid != "") {
            e.id = eid;
        }
        e.className = "qbjs";
        
        if (content != undefined) {
            if (e.value != undefined) {
                e.value = content;
            }
            if (e.innerHTML != undefined) {
                e.innerHTML = content;
            }
        }

        QB._domElements.push(e);
        await sub_Add(e, parent, beforeElement);
        Create = e;
    $End If    
End Function

Sub Create (etype As String, parent As Object, content As String, eid As String, beforeElement As Object) 
    Dim e
    e = Create(etype, parent, content, eid, beforeElement)
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
    $If Javascript Then
        Container = document.getElementById("gx-container");
    $End If
End Function

Function Get (eid As String)
    $If Javascript Then
        Get = document.getElementById(eid);
    $End If
End Function

Function GetImage (imageId As Integer) 
    $If Javascript Then
        GetImage = QB.getImage(imageId);
    $End If
End Function

Sub Remove (e As Object)
    $If Javascript Then
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        if (e != undefined && e != null) {
            e.remove();
        }
    $End If
End Sub

Function Prompt (text As String, defaultValue As String)
    Dim result As String
    $If Javascript Then
        result = prompt(text, defaultValue);
        if (!result) { result = ""; }
    $End If
    Prompt = result;
End Function