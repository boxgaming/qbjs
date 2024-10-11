compile();

async function compile(src) {
    const qbc = await require("./qb2js.js").QBCompiler();
    const fs = require("fs");

    const sourceFile = process.argv[2];
    const data = fs.readFileSync(sourceFile, "utf8");

    var result = "";
    if (sourceFile.endsWith("qb2js.bas")) {
        qbc.setSelfConvert();
        result = await qbc.compile(data);
    }
    else {
        result = "async function __qbjs_run() {\n" + await qbc.compile(data) + "\n}";
    }
    fs.writeFileSync(process.argv[3], result, "utf8");
    
    var warnings = qbc.getWarnings();
    for (var i=0; i < warnings.length; i++) {
        var mtype = warnings[i].mtype ? "ERROR" : "WARN";
        console.log(mtype + ":" + warnings[i].line + ":" + warnings[i].text);
    }
}