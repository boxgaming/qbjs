let VFS = function() {
    this.FILE = Symbol("FILE");
    this.DIRECTORY = Symbol("DIRECTORY");

    let _root = { toString: function() { return "/"; }};

    this.rootDirectory = function() {
        return _root;
    };

    this.reset = function() {
        _root = { toString: function() { return "/"; }};
    }

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

    this.readText = function(file) {
        let offset = 0;
        let view = new Uint8Array(file.data);
        let c = null;
        let str = "";
        while (offset < file.data.byteLength) {
            c = String.fromCharCode(view[offset]);
            str += c
            offset++;
        }
        return str;
    };

    this.writeData = function(file, data, offset) {
        if (offset == undefined) { offset = 0; }

        let start = file.data.slice(0, offset);
        let end = file.data.slice(offset + data.byteLength, file.data.byteLength);
        file.data = start;

        if (start.byteLength < offset) {
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
                if (node == undefined) {
                    return null;
                }
            }
        }
        return node;
    };

    this.getDataURL = async function(file) {
        let blob = null;
        let type = this.getTypeFromName(file.name);
        if (type) {
            blob = new Blob([file.data], { type: type });
        } 
        else {
            blob = new Blob([file.data]);
        }
        let dataUrl = await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)}).then(e => e.target.result);
        return dataUrl;
    };

    this.dataURLToBlob = function(dataURL) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(dataURL.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);

        // create a view into the buffer
        var ia = new Uint8Array(ab);

        // set the bytes of the buffer to the correct values
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var blob = new Blob([ab], {type: mimeString});
        return blob;
    };

    this.getTypeFromName = function(filename) {
        var parts = filename.split(".");
        if (parts.length < 2) { return null; }
        var ext = parts.pop();
        return types[ext];
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

    const types = {
    //   File Extension   MIME Type
        'abs':           'audio/x-mpeg',
        'ai':            'application/postscript',
        'aif':           'audio/x-aiff',
        'aifc':          'audio/x-aiff',
        'aiff':          'audio/x-aiff',
        'aim':           'application/x-aim',
        'art':           'image/x-jg',
        'asf':           'video/x-ms-asf',
        'asx':           'video/x-ms-asf',
        'au':            'audio/basic',
        'avi':           'video/x-msvideo',
        'avx':           'video/x-rad-screenplay',
        'bas':           'text/qbjs',
        'bcpio':         'application/x-bcpio',
        'bi':            'text/qbjs',
        'bin':           'application/octet-stream',
        'bm':            'text/qbjs',
        'bmp':           'image/bmp',
        'body':          'text/html',
        'c':             'text/x-csrc',
        'cc':            'text/x-c++src',
        'cdf':           'application/x-cdf',
        'cer':           'application/pkix-cert',
        'class':         'application/java',
        'cpio':          'application/x-cpio',
        'cpp':           'text/x-c++src',
        'cs':            'text/x-csharp',
        'csh':           'application/x-csh',
        'css':           'text/css',
        'cxx':           'text/x-c++src',
        'dib':           'image/bmp',
        'doc':           'application/msword',
        'dtd':           'application/xml-dtd',
        'dv':            'video/x-dv',
        'dvi':           'application/x-dvi',
        'eot':           'application/vnd.ms-fontobject',
        'eps':           'application/postscript',
        'etx':           'text/x-setext',
        'exe':           'application/octet-stream',
        'gif':           'image/gif',
        'gtar':          'application/x-gtar',
        'gz':            'application/x-gzip',
        'h':             'text/x-csrc',
        'hdf':           'application/x-hdf',
        'hqx':           'application/mac-binhex40',
        'htc':           'text/x-component',
        'htm':           'text/html',
        'html':          'text/html',
        'hpp':           'text/x-c++src',
        'ief':           'image/ief',
        'jad':           'text/vnd.sun.j2me.app-descriptor',
        'jar':           'application/java-archive',
        'java':          'text/x-java',
        'jnlp':          'application/x-java-jnlp-file',
        'jpe':           'image/jpeg',
        'jpeg':          'image/jpeg',
        'jpg':           'image/jpeg',
        'js':            'application/javascript',
        'jsf':           'text/plain',
        'json':          'application/json',
        'jspf':          'text/plain',
        'kar':           'audio/midi',
        'latex':         'application/x-latex',
        'm3u':           'audio/x-mpegurl',
        'mac':           'image/x-macpaint',
        'man':           'text/troff',
        'mathml':        'application/mathml+xml',
        'md':            'text/markdown',
        'me':            'text/troff',
        'mid':           'audio/midi',
        'midi':          'audio/midi',
        'mif':           'application/x-mif',
        'mov':           'video/quicktime',
        'movie':         'video/x-sgi-movie',
        'mp1':           'audio/mpeg',
        'mp2':           'audio/mpeg',
        'mp3':           'audio/mpeg',
        'mp4':           'video/mp4',
        'mpa':           'audio/mpeg',
        'mpe':           'video/mpeg',
        'mpeg':          'video/mpeg',
        'mpega':         'audio/x-mpeg',
        'mpg':           'video/mpeg',
        'mpv2':          'video/mpeg2',
        'ms':            'application/x-wais-source',
        'nc':            'application/x-netcdf',
        'oda':           'application/oda',
        'odb':           'application/vnd.oasis.opendocument.database',
        'odc':           'application/vnd.oasis.opendocument.chart',
        'odf':           'application/vnd.oasis.opendocument.formula',
        'odg':           'application/vnd.oasis.opendocument.graphics',
        'odi':           'application/vnd.oasis.opendocument.image',
        'odm':           'application/vnd.oasis.opendocument.text-master',
        'odp':           'application/vnd.oasis.opendocument.presentation',
        'ods':           'application/vnd.oasis.opendocument.spreadsheet',
        'odt':           'application/vnd.oasis.opendocument.text',
        'otg':           'application/vnd.oasis.opendocument.graphics-template',
        'oth':           'application/vnd.oasis.opendocument.text-web',
        'otp':           'application/vnd.oasis.opendocument.presentation-template',
        'ots':           'application/vnd.oasis.opendocument.spreadsheet-template',
        'ott':           'application/vnd.oasis.opendocument.text-template',
        'ogx':           'application/ogg',
        'ogv':           'video/ogg',
        'oga':           'audio/ogg',
        'ogg':           'audio/ogg',
        'otf':           'application/x-font-opentype',
        'spx':           'audio/ogg',
        'flac':          'audio/flac',
        'anx':           'application/annodex',
        'axa':           'audio/annodex',
        'axv':           'video/annodex',
        'xspf':          'application/xspf+xml',
        'pbm':           'image/x-portable-bitmap',
        'pct':           'image/pict',
        'pdf':           'application/pdf',
        'php':           'text/x-php',
        'pgm':           'image/x-portable-graymap',
        'pic':           'image/pict',
        'pict':          'image/pict',
        'pls':           'audio/x-scpls',
        'png':           'image/png',
        'pnm':           'image/x-portable-anymap',
        'pnt':           'image/x-macpaint',
        'ppm':           'image/x-portable-pixmap',
        'ppt':           'application/vnd.ms-powerpoint',
        'pps':           'application/vnd.ms-powerpoint',
        'ps':            'application/postscript',
        'psd':           'image/vnd.adobe.photoshop',
        'py':            'text/x-python',
        'qt':            'video/quicktime',
        'qti':           'image/x-quicktime',
        'qtif':          'image/x-quicktime',
        'ras':           'image/x-cmu-raster',
        'rdf':           'application/rdf+xml',
        'rgb':           'image/x-rgb',
        'rm':            'application/vnd.rn-realmedia',
        'roff':          'text/troff',
        'rtf':           'application/rtf',
        'rtx':           'text/richtext',
        'sfnt':          'application/font-sfnt',
        'sh':            'application/x-sh',
        'shar':          'application/x-shar',
        'sit':           'application/x-stuffit',
        'snd':           'audio/basic',
        'sql':           'text/x-sql',
        'src':           'application/x-wais-source',
        'sv4cpio':       'application/x-sv4cpio',
        'sv4crc':        'application/x-sv4crc',
        'svg':           'image/svg+xml',
        'svgz':          'image/svg+xml',
        'swf':           'application/x-shockwave-flash',
        't':             'text/troff',
        'tar':           'application/x-tar',
        'tcl':           'application/x-tcl',
        'tex':           'application/x-tex',
        'texi':          'application/x-texinfo',
        'texinfo':       'application/x-texinfo',
        'tif':           'image/tiff',
        'tiff':          'image/tiff',
        'tr':            'text/troff',
        'tsv':           'text/tab-separated-values',
        'ttf':           'application/x-font-ttf',
        'txt':           'text/plain',
        'ulw':           'audio/basic',
        'ustar':         'application/x-ustar',
        'vxml':          'application/voicexml+xml',
        'xbm':           'image/x-xbitmap',
        'xht':           'application/xhtml+xml',
        'xhtml':         'application/xhtml+xml',
        'xls':           'application/vnd.ms-excel',
        'xml':           'application/xml',
        'xpm':           'image/x-xpixmap',
        'xsl':           'application/xml',
        'xslt':          'application/xslt+xml',
        'xul':           'application/vnd.mozilla.xul+xml',
        'xwd':           'image/x-xwindowdump',
        'vsd':           'application/vnd.visio',
        'wav':           'audio/x-wav',
        'wbmp':          'image/vnd.wap.wbmp',
        'webm':          'audio/webm',
        'webp':          'image/webp',
        'wml':           'text/vnd.wap.wml',
        'wmlc':          'application/vnd.wap.wmlc',
        'wmls':          'text/vnd.wap.wmlsc',
        'wmlscriptc':    'application/vnd.wap.wmlscriptc',
        'wmv':           'video/x-ms-wmv',
        'woff':          'application/font-woff',
        'woff2':         'application/font-woff2',
        'wrl':           'model/vrml',
        'wspolicy':      'application/wspolicy+xml',
        'z':             'application/x-compress',
        'zip':           'application/zip'
    };
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


