let VFS = function() {
    this.FILE = Symbol("FILE");
    this.DIRECTORY = Symbol("DIRECTORY");

    let _root = { toString: function() { return "/"; }};

    this.rootDirectory = function() {
        return _root;
    };

    this.fullPath = function(node) {
        if (node == _root) { return "/" };

        var n = node;
        var path = "";
        while (n.name) {
            path = "/" + n.name + path;
            n = n.parent;
        }
        return path;
    };

    this.getParentPath = function(path) {
        var parts = this.tokenizePath(path);
        var path = "";
        if (parts.length < 2) {
            if (parts.isFullpath) { return "/"; }
            else { return ""; }
        }
        for (var i=0; i < parts.length-1; i++) {
            path += "/" + parts[i];
        }
        return path;
    };

    this.getFileName = function(path) {
        var parts = this.tokenizePath(path);
        return parts[parts.length-1];
    };

    this.createFile = function(path, parent) {
        if (parent == undefined) { parent = _root; }
        let fsnode = { type: this.FILE, name: path, data: new ArrayBuffer(0), parent: parent, toString: function() { return this.name; }};
        parent[path] = fsnode;
        return fsnode;
    };

    this.createDirectory = function(path, parent) {
        if (parent == undefined) { parent = _root; }
        let fsnode = { type: this.DIRECTORY, name: path, parent: parent, toString: function() { return this.name; }};
        parent[path] = fsnode;

        return fsnode;
    };

    this.getChildren = function(parent, type) {
        if (parent == undefined) { parent = _root; }

        let nodes = [];
        for (var e in parent) {
            if (type == undefined || (parent[e] && parent[e].type == type)) {
                if ((parent[e].type == this.FILE || parent[e].type == this.DIRECTORY) && e != "parent") {
                    nodes.push(parent[e]);
                }
            }
        }
        nodes.sort();
        return nodes;
    };

    this.writeText = function(file, text) {
        file.data = appendBuffer(file.data, this.textToData(text));
    };

    this.textToData = function(text) {
        let chars = [];
        for (let i=0; i < text.length; i++) {
            chars.push(text.charCodeAt(i));
        }
        return new Uint8Array(chars).buffer;
    };

    this.readLine = function(file, offset) {
        if (offset == undefined) { offset = 0; }
        if (offset >= file.data.byteLength) {
            throw new Error("Input past end of file");
        }
        let view = new Uint8Array(file.data);
        let c = null;
        let str = "";
        while (offset < file.data.byteLength && c != "\n") {
            c = String.fromCharCode(view[offset]);
            if (c != "\n") {
                str += c;
            }
            offset++;
        }
        return str;
    };

    this.writeData = function(file, data, offset) {
        if (offset == undefined) { offset = 0; }
        //else { offset--; }

        /*if (file.data.byteLength == 0) {
            file.data = data;
            return;
        }*/
        let start = file.data.slice(0, offset);
        let end = file.data.slice(offset + data.byteLength, file.data.byteLength);
        file.data = start;
        //alert("sb: " + start.byteLength + "  o: " + offset);
        if (start.byteLength < offset) {
            //alert(offset - start.byteLength);
            file.data = appendBuffer(file.data, new ArrayBuffer(offset - start.byteLength));
        }
        file.data = appendBuffer(file.data, data);
        file.data = appendBuffer(file.data, end);
    };

    this.readData = function(file, offset, length) {
        return file.data.slice(offset, offset + length);
    };

    this.getNode = function(path, parent) {
        let parts = this.tokenizePath(path);
        if (parts.isRoot) {
            return _root;
        }
        if (parts.isFullpath) {
            parent = _root;
        }
        let node = null;
        for (let i=0; i < parts.length; i++) {
            if (parts[i] == ".") {
                // move along, nothing to see here
            }
            else if (parts[i] == "..") {
                if (node.parent == undefined) {
                    node = _root;
                }
                else {
                    node = node.parent;
                    parent = node;
                }
            }
            else {
                node = parent[parts[i]];
                parent = node;
            }
        }
        return node;
    };

    this.getDataURL = async function(file) {
        //return "data:image/jpeg," + base64ArrayBuffer(file.data);
        let blob = new Blob([file.data]);
        let dataUrl = await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)}).then(e => e.target.result);
        return dataUrl;
    };

    this.renameNode = function(node, newName) {
        // TODO: move the file if the newName includes a path
        var parent = node.parent;
        parent[node.name] = undefined;
        node.name = newName;
        parent[node.name] = node;
    };

    this.removeFile = function(file, parent) {
        if (typeof file == "string") {
            file = this.getNode(file, parent);
        }
        if (file && file.type == this.FILE) {
            let parent = file.parent;
            delete parent[file.name];
        }
        else {
            throw new Error("File not found");
        }
    };
    
    this.removeDirectory = function(directory, parent) {
        if (typeof directory == "string") {
            directory = this.getNode(directory, parent);
        }
        if (directory && directory.type == this.DIRECTORY) {
            var childNodes = this.getChildren(directory);
            if (childNodes.length == 0) {
                let parent = directory.parent;
                delete parent[directory.name];
            }
            else {
                // TODO: probably throw an exception
            }
        }
        else {
            // TODO: probably throw an exception
        }
    };

    this.tokenizePath = function(path) {
        path = path.replaceAll("\\","/");
        let parts = path.split("/");
        parts.isFullpath = false;
        if (path.indexOf("/") == 0) {
            parts.isFullpath = true;
        }
        if (parts[0].match(/[A-Z|a-z]:/)) {
            parts.shift();
            parts.isFullpath = true;
        }
        if (parts[0] == "") {
            while (parts.length > 0 && parts[0] == "") {
                parts.shift();
            }
        }
        if (parts.isFullpath && parts.length == 0) {
            parts.isRoot = true;
        }
        else {
            parts.isRoot = false;
        }
        return parts;
    };

    function appendBuffer(buffer1, buffer2) {
        let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;        
    }
}


if (!ArrayBuffer.prototype.slice) {
    ArrayBuffer.prototype.slice = function (start, end) {
        let that = new Uint8Array(this);
        if (end == undefined) end = that.length;
        let result = new ArrayBuffer(end - start);
        let resultArray = new Uint8Array(result);
        for (let i = 0; i < resultArray.length; i++)
           resultArray[i] = that[i + start];
        return result;
    }
}
