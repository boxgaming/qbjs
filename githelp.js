var GitHelp = new function() {
    var navhist = [];
    var page = document.getElementById("help-page");
    var sidebar = document.getElementById("help-sidebar");
    var sconverter = new showdown.Converter();
    sconverter.setFlavor("github");
    
    baseUrl = location.protocol + "//" + location.host + location.pathname;
    if (baseUrl.endsWith("/index.html")) {
        baseUrl = baseUrl.replace("/index.html", "");
    }
    alert(baseUrl);
    
    function fixlinks(div, project) {
        var a = div.getElementsByTagName("a");
        for (var i=0; i < a.length; i++) {
            if (a[i].href) {
                var href = a[i].href;
                if (href.startsWith("https://github.com") && href.includes("/wiki/")) {
                    href = href.replace("/wiki/", "/");
                    href = href.replace("github.com", "raw.githubusercontent.com/wiki") + ".md";
                    a[i].href = "javascript:GitHelp.wikinav('" + href + "')";
                }
                else if (href.startsWith("#") || href.startsWith(baseUrl + "/index.html#")) {
                    // do nothing
                }
                else if (href.startsWith(baseUrl + "#") || href.startsWith(baseUrl + "/#")) {
                    a[i].href = href.substring(href.indexOf("#"));
                }
                else if (href.startsWith(baseUrl + "?") ||
                         href.startsWith(baseUrl + "/?") ||
                         href.startsWith(baseUrl + "/index.html?")) {
                    a[i].target = "_blank";
                }
                else if (href.startsWith(baseUrl + "/")) {
                    href = href.replace(baseUrl + "/", "");
                    href = "https://raw.githubusercontent.com/wiki/" + project + "/" + href + ".md";
                    a[i].href = "javascript:GitHelp.wikinav('" + href + "')";
                }
                else {
                    a[i].target = "_blank";
                }
            }
        }
    }
    
    this.navhome = function() {
        navhist = [];
        this.wikinav("https://raw.githubusercontent.com/wiki/boxgaming/qbjs/QBasic-Language-Support.md");
        return false;
    };
    
    this.navback = function() {
        if (navhist.length > 1) {
            navhist.pop();
            var prev = navhist.pop();
            this.wikinav(prev);
        }
        return false;
    };

    this.navto = function(id) {
        document.getElementById(id).scrollIntoView();
    };

    this.wikinav = async function(url) {
        var project;
        var pageName;
        var res = await QB.func_Fetch(url);

        navhist.push(url);
        page.scrollTop = 0;
    
        project = url.replace("https://raw.githubusercontent.com/wiki/", "");
        project = project.substring(0, project.lastIndexOf("/"));
        pageName = url.substring(url.lastIndexOf("/")+1);
        pageName = pageName.replaceAll("-", " ");
        pageName = pageName.replace(".md", "");

        page.innerHTML = "<h1>" + pageName + "</h1>" + sconverter.makeHtml(res.text);
        fixlinks(page, project);
    
        res = await QB.func_Fetch("https://raw.githubusercontent.com/wiki/" + project + "/_Sidebar.md");
        sidebar.innerHTML = sconverter.makeHtml(res.text);
        fixlinks(sidebar, project);
    }
};