compile();

async function compile(src) {
    const qbc = await require("./qb2js.js").QBCompiler();
    const fs = require("fs");

    const data = fs.readFileSync(process.argv[2], "utf8");
    var result = "async function __qbjs_run() {\n" + await qbc.compile(data) + "\n}";
    fs.writeFileSync(process.argv[3], result, "utf8");
    
    var warnings = qbc.getWarnings();
    for (var i=0; i < warnings.length; i++) {
        var mtype = warnings[i].mtype ? "ERROR" : "WARN";
        console.log(mtype + ":" + warnings[i].line + ":" + warnings[i].text);
    }
}