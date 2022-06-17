async function _QBCompiler() {

   // Option _Explicit
   // $Console
   // Only
   const FILE =  1;
   const TEXT =  2;
   const False =  0;
   const True = ! False;
   const OPERATORS = "+-/\\*";
   
   
   
   
   
   
   var lines = QB.initArray([{l:1,u:0}], {line:0,text:''}); // CODELINE
   var jsLines = QB.initArray([{l:1,u:0}], {line:0,text:''}); // CODELINE
   var methods = QB.initArray([{l:1,u:0}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}); // METHOD
   var types = QB.initArray([{l:1,u:0}], {line:0,name:'',argc:0,args:''}); // QBTYPE
   var typeVars = QB.initArray([{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var globalVars = QB.initArray([{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var localVars = QB.initArray([{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var warnings = QB.initArray([{l:1,u:0}], {line:0,text:''}); // CODELINE
   var exportLines = QB.initArray([{l:1,u:0}], ''); // STRING
   var exportConsts = QB.initArray([{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var exportMethods = QB.initArray([{l:1,u:0}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}); // METHOD
   var dataArray = QB.initArray([{l:1,u:0}], ''); // STRING
   var dataLabels = QB.initArray([{l:1,u:0}], {text:'',index:0}); // LABEL
   var modLevel = 0; // INTEGER
   var currentMethod = ''; // STRING
   var currentModule = ''; // STRING
   var programMethods = 0; // INTEGER
   var dataTicker = 0; // INTEGER
   dataTicker =  1;
   if (QB.func_Command() != "" ) {
      await sub_QBToJS( QB.func_Command(),   FILE,  "");
      await sub_PrintJS();
      QB.halt(); return;
   }

async function sub_QBToJS(source/*STRING*/,sourceType/*INTEGER*/,moduleName/*STRING*/) {
if (QB.halted()) { return; }
   currentModule =  moduleName;
   await sub_ResetDataStructures();
   if ( moduleName == "" ) {
      QB.resizeArray(jsLines, [{l:1,u:0}], {line:0,text:''}, false); // CODELINE
   }
   if ( sourceType ==  FILE) {
      await sub_ReadLinesFromFile(  source);
   } else {
      await sub_ReadLinesFromText(  source);
   }
   await sub_FindMethods();
   programMethods = (QB.func_UBound(  methods));
   await sub_InitGX();
   await sub_InitQBMethods();
   var selfConvert = 0; // INTEGER
   var isGX = 0; // INTEGER
   isGX =  False;
   if ( sourceType ==  FILE) {
      selfConvert = (await func_EndsWith(  source,  "qb2js.bas"));
   }
   if ( selfConvert) {
      await sub_AddJSLine(  0,  "async function _QBCompiler() {");
   } else if ( moduleName != "" ) {
      await sub_AddJSLine(  0,  "async function _"   +   moduleName  +  "() {");
   } else if ( sourceType ==  FILE) {
      await sub_AddJSLine(  0,  "async function init() {");
   } else {
      await sub_AddJSLine(  0,  "try {");
   }
   if (! selfConvert &&  moduleName == "" ) {
      await sub_AddJSLine(  0,  "QB.start();");
   }
   if (! selfConvert &&  moduleName == "" ) {
      var mtest = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
      if ((await func_FindMethod( "GXOnGameEvent",   mtest,  "SUB")) ) {
         await sub_AddJSLine(  0,  "    await GX.registerGameEvents(sub_GXOnGameEvent);");
         isGX =  True;
      } else {
         await sub_AddJSLine(  0,  "    await GX.registerGameEvents(function(e){});");
         await sub_AddJSLine(  0,  "    QB.sub_Screen(0);");
      }
   }
   await sub_AddJSLine(  0,  "");
   await sub_InitData();
   await sub_ConvertLines(  1,  await func_MainEnd(),  "");
   if (! selfConvert && ! isGX &&  moduleName == "" ) {
      await sub_AddJSLine(  0,  "QB.end();");
   }
   await sub_ConvertMethods();
   if ( selfConvert) {
      await sub_AddJSLine(  0,  "this.compile = async function(src) {");
      await sub_AddJSLine(  0,  "   await sub_QBToJS(src, TEXT, '');");
      await sub_AddJSLine(  0,  "   var js = '';");
      await sub_AddJSLine(  0,  "   for (var i=1; i<= QB.func_UBound(jsLines); i++) {");
      await sub_AddJSLine(  0,  "      js += '/* ' + i + ':' + this.getSourceLine(i) + ' */ ' + QB.arrayValue(jsLines, [i]).value.text + '\\n';");
      await sub_AddJSLine(  0,  "   }");
      await sub_AddJSLine(  0,  "   return js;");
      await sub_AddJSLine(  0,  "};");
      await sub_AddJSLine(  0,  "this.getWarnings = function() {");
      await sub_AddJSLine(  0,  "   var w = [];");
      await sub_AddJSLine(  0,  "   for (var i=1; i <= QB.func_UBound(warnings); i++) {");
      await sub_AddJSLine(  0,  "      w.push({");
      await sub_AddJSLine(  0,  "         line: QB.arrayValue(warnings, [i]).value.line,");
      await sub_AddJSLine(  0,  "         text: QB.arrayValue(warnings, [i]).value.text");
      await sub_AddJSLine(  0,  "      });");
      await sub_AddJSLine(  0,  "   }");
      await sub_AddJSLine(  0,  "   return w;");
      await sub_AddJSLine(  0,  "};");
      await sub_AddJSLine(  0,  "this.getSourceLine = function(jsLine) {");
      await sub_AddJSLine(  0,  "   if (jsLine == 0) { return 0; }");
      await sub_AddJSLine(  0,  "   var line = QB.arrayValue(jsLines, [jsLine]).value.line;");
      await sub_AddJSLine(  0,  "   line = QB.arrayValue(lines, [line]).value.line;");
      await sub_AddJSLine(  0,  "   return line;");
      await sub_AddJSLine(  0,  "};");
      await sub_AddJSLine(  0,  "");
      await sub_AddJSLine(  0,  "return this;");
      await sub_AddJSLine(  0,  "}");
   } else if ( moduleName != "" ) {
      await sub_AddJSLine(  0,  "return this;");
      await sub_AddJSLine(  0,  "}");
      await sub_AddJSLine(  0,  "const "   +   moduleName  +  " = await _"   +   moduleName  +  "();");
   } else if ( sourceType ==  FILE) {
      await sub_AddJSLine(  0,  "};");
   } else {
      await sub_AddJSLine(  0,  "} catch (error) { console.log(error); throw error; }");
   }
}
async function sub_ResetDataStructures() {
if (QB.halted()) { return; }
   QB.resizeArray(lines, [{l:1,u:0}], {line:0,text:''}, false); // CODELINE
   QB.resizeArray(methods, [{l:1,u:0}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}, false); // METHOD
   QB.resizeArray(types, [{l:1,u:0}], {line:0,name:'',argc:0,args:''}, false); // QBTYPE
   QB.resizeArray(typeVars, [{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   QB.resizeArray(globalVars, [{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   QB.resizeArray(localVars, [{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   QB.resizeArray(warnings, [{l:1,u:0}], {line:0,text:''}, false); // CODELINE
   QB.resizeArray(dataArray, [{l:1,u:0}], '', false); // STRING
   QB.resizeArray(dataLabels, [{l:1,u:0}], {text:'',index:0}, false); // LABEL
   if ( modLevel ==  0) {
      QB.resizeArray(exportMethods, [{l:1,u:0}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}, false); // METHOD
      QB.resizeArray(exportConsts, [{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   }
   currentMethod = "";
   programMethods =  0;
}
async function sub_InitData() {
if (QB.halted()) { return; }
   if ((QB.func_UBound(  dataArray))  <  1) {
      return;
   }
   var ds = ''; // STRING
   ds = "["   +  (await func_Join( dataArray,   1,    -  1,  ","))   +  "]";
   await sub_AddJSLine(  0,  "QB.setData("   +   ds  +  ");");
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  dataLabels));  i= i + 1) {  if (QB.halted()) { return; }
      await sub_AddJSLine(  0,  "QB.setDataLabel('"   +  QB.arrayValue(dataLabels, [ i]).value .text  +  "', "   +  (QB.func_Str( QB.arrayValue(dataLabels, [ i]).value .index))   +  ");");
   }
}
async function sub_PrintJS() {
if (QB.halted()) { return; }
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  jsLines));  i= i + 1) {  if (QB.halted()) { return; }
      await QB.sub_Print([QB.arrayValue(jsLines, [ i]).value .text]);
   }
}
async function sub_ConvertLines(firstLine/*INTEGER*/,lastLine/*INTEGER*/,functionName/*STRING*/) {
if (QB.halted()) { return; }
   var typeMode = 0; // INTEGER
   typeMode =  False;
   var jsMode = 0; // INTEGER
   jsMode =  False;
   var i = 0; // INTEGER
   var indent = 0; // INTEGER
   var tempIndent = 0; // INTEGER
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
   var totalIndent = 0; // INTEGER
   totalIndent =  1;
   var caseCount = 0; // INTEGER
   var loopMode = QB.initArray([{l:1,u:100}], 0); // INTEGER
   var loopLevel = 0; // INTEGER
   var caseVar = ''; // STRING
   var currType = 0; // INTEGER
   for ( i= firstLine;  i <=  lastLine;  i= i + 1) {  if (QB.halted()) { return; }
      indent =  0;
      tempIndent =  0;
      var l = ''; // STRING
      l = (QB.func__Trim( QB.arrayValue(lines, [ i]).value .text));
      var parts = QB.initArray([{l:1,u:0}], ''); // STRING
      var c = 0; // INTEGER
      c = (await func_SLSplit(  l,  parts,   True));
      if ( c <  1) {
         continue;
      }
      var js = ''; // STRING
      js = "";
      var first = ''; // STRING
      first = (QB.func_UCase( QB.arrayValue(parts, [ 1]).value));
      if ( jsMode ==  True) {
         if ( first == "$END" ) {
            jsMode =  False;
            await sub_AddJSLine(  0,  "//-------- END JS native code block --------");
         } else {
            await sub_AddJSLine(  i,  QB.arrayValue(lines, [ i]).value .text);
         }
      } else if ( typeMode ==  True) {
         if ( first == "END" ) {
            var second = ''; // STRING
            second = (QB.func_UCase( QB.arrayValue(parts, [ 2]).value));
            if ( second == "TYPE" ) {
               typeMode =  False;
            }
         } else {
            var tvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
            tvar.typeId =  currType;
            tvar.name = QB.arrayValue(parts, [ 1]).value;
            tvar.type = (QB.func_UCase( QB.arrayValue(parts, [ 3]).value));
            if ( tvar.type == "_UNSIGNED" ) {
               tvar.type =  tvar.type  +  " "   +  (QB.func_UCase( QB.arrayValue(parts, [ 4]).value));
            }
            await sub_AddVariable(  tvar,  typeVars);
         }
      } else {
         if ( first == "CONST" ) {
            js = "const "   +  QB.arrayValue(parts, [ 2]).value   +  " = "   +  (await func_ConvertExpression( (await func_Join( parts,   4,    -  1,  " ")),   i))   +  ";";
            await sub_AddConst( QB.arrayValue(parts, [ 2]).value);
         } else if ( first == "DIM"  ||  first == "REDIM"  ||  first == "STATIC" ) {
            js = (await func_DeclareVar( parts,   i));
         } else if ( first == "SELECT" ) {
            caseVar = await func_GenJSVar();
            js = "var "   +   caseVar  +  " = "   +  (await func_ConvertExpression( (await func_Join( parts,   3,    -  1,  " ")),   i))   +  ";"   +  await func_CRLF();
            js =  js  +  "switch ("   +   caseVar  +  ") {";
            indent =  1;
            caseCount =  0;
         } else if ( first == "CASE" ) {
            if ( caseCount >  0) {
               js = "break;"   +  await func_LF();
            }
            if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "ELSE" ) {
               js =  js  +  "default:";
            } else if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "IS" ) {
               js =  js  +  "case "   +   caseVar  +  " "   +  (await func_ConvertExpression( (await func_Join( parts,   3,    -  1,  " ")),   i))   +  ":";
            } else {
               var caseParts = QB.initArray([{l:1,u:0}], ''); // STRING
               var cscount = 0; // INTEGER
               cscount = (await func_ListSplit( (await func_Join( parts,   2,    -  1,  " ")),  caseParts));
               var ci = 0; // INTEGER
               for ( ci= 1;  ci <=  cscount;  ci= ci + 1) {  if (QB.halted()) { return; }
                  if ( ci >  1) {
                     js =  js  +  await func_CRLF();
                  }
                  js =  js  +  "case "   +  (await func_ConvertExpression( QB.arrayValue(caseParts, [ ci]).value,   i))   +  ":";
               }
            }
            caseCount =  caseCount  +   1;
         } else if ( first == "FOR" ) {
            var fstep = ''; // STRING
            fstep = "1";
            var eqIdx = 0; // INTEGER
            var toIdx = 0; // INTEGER
            var stepIdx = 0; // INTEGER
            var fcond = ''; // STRING
            fcond = " <= ";
            stepIdx =  0;
            var fi = 0; // INTEGER
            for ( fi= 2;  fi <= (QB.func_UBound(  parts));  fi= fi + 1) {  if (QB.halted()) { return; }
               var fword = ''; // STRING
               fword = (QB.func_UCase( QB.arrayValue(parts, [ fi]).value));
               if ( fword == "=" ) {
                  eqIdx =  fi;
               } else if ( fword == "TO" ) {
                  toIdx =  fi;
               } else if ( fword == "STEP" ) {
                  stepIdx =  fi;
                  fstep = (await func_ConvertExpression( (await func_Join( parts,   fi  +   1,    -  1,  " ")),   i));
               }
            }
            var fvar = ''; // STRING
            fvar = (await func_ConvertExpression( (await func_Join( parts,   2,   eqIdx  -   1,  " ")),   i));
            var sval = ''; // STRING
            sval = (await func_ConvertExpression( (await func_Join( parts,   eqIdx  +   1,   toIdx  -   1,  " ")),   i));
            var uval = ''; // STRING
            uval = (await func_ConvertExpression( (await func_Join( parts,   toIdx  +   1,   stepIdx  -   1,  " ")),   i));
            if ((QB.func_Left( (QB.func__Trim(  fstep)),   1))  == "-" ) {
               fcond = " >= ";
            }
            js = "for ("   +   fvar  +  "="   +   sval  +  "; "   +   fvar  +   fcond  +   uval  +  "; "   +   fvar  +  "="   +   fvar  +  " + "   +   fstep  +  ") {";
            js =  js  +  "  if (QB.halted()) { return; }";
            indent =  1;
         } else if ( first == "IF" ) {
            var thenIndex = 0; // INTEGER
            for ( thenIndex= 2;  thenIndex <= (QB.func_UBound(  parts));  thenIndex= thenIndex + 1) {  if (QB.halted()) { return; }
               if ((QB.func_UCase( QB.arrayValue(parts, [ thenIndex]).value))  == "THEN" ) {
                  break;
               }
            }
            js = "if ("   +  (await func_ConvertExpression( (await func_Join( parts,   2,   thenIndex  -   1,  " ")),   i))   +  ") {";
            indent =  1;
         } else if ( first == "ELSEIF" ) {
            js = "} else if ("   +  (await func_ConvertExpression( (await func_Join( parts,   2,  (QB.func_UBound(  parts))   -   1,  " ")),   i))   +  ") {";
            tempIndent =   -  1;
         } else if ( first == "ELSE" ) {
            js = "} else {";
            tempIndent =   -  1;
         } else if ( first == "NEXT" ) {
            js =  js  +  "}";
            indent =   -  1;
         } else if ( first == "END" ) {
            if ((QB.func_UBound(  parts))  ==  1) {
               js = "QB.halt(); return;";
            } else {
               if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "SELECT" ) {
                  js = "break;";
               }
               js =  js  +  "}";
               indent =   -  1;
            }
         } else if ( first == "SYSTEM" ) {
            js = "QB.halt(); return;";
         } else if ( first == "$IF" ) {
            if ((QB.func_UBound(  parts))  >  1) {
               if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "JAVASCRIPT" ) {
                  jsMode =  True;
                  js = "//-------- BEGIN JS native code block --------";
               }
            }
         } else if ( first == "DO" ) {
            loopLevel =  loopLevel  +   1;
            if ((QB.func_UBound(  parts))  >  1) {
               if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "WHILE" ) {
                  js = "while ("   +  (await func_ConvertExpression( (await func_Join( parts,   3,    -  1,  " ")),   i))   +  ") {";
               } else {
                  js = "while (!("   +  (await func_ConvertExpression( (await func_Join( parts,   3,    -  1,  " ")),   i))   +  ")) {";
               }
               QB.arrayValue(loopMode, [ loopLevel]).value =  1;
            } else {
               js = "do {";
               QB.arrayValue(loopMode, [ loopLevel]).value =  2;
            }
            indent =  1;
            js =  js  +  "  if (QB.halted()) { return; }";
         } else if ( first == "WHILE" ) {
            loopLevel =  loopLevel  +   1;
            js = "while ("   +  (await func_ConvertExpression( (await func_Join( parts,   2,    -  1,  " ")),   i))   +  ") {";
            indent =  1;
            js =  js  +  "  if (QB.halted()) { return; }";
         } else if ( first == "WEND" ) {
            js = "}";
            loopLevel =  loopLevel  -   1;
            indent =   -  1;
         } else if ( first == "LOOP" ) {
            if (QB.arrayValue(loopMode, [ loopLevel]).value  ==  1) {
               js = "}";
            } else {
               js = "} while ((";
               if ((QB.func_UBound(  parts))  <  2) {
                  js =  js  +  "1));";
               } else {
                  if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "UNTIL" ) {
                     js = "} while (!(";
                  }
                  js =  js  +  (await func_ConvertExpression( (await func_Join( parts,   3,  (QB.func_UBound(  parts)),  " ")),   i))   +  "))";
               }
            }
            loopLevel =  loopLevel  -   1;
            indent =   -  1;
         } else if ( first == "_CONTINUE" ) {
            js = "continue;";
         } else if ((QB.func_UCase(  l))  == "EXIT FUNCTION" ) {
            js = "return "   +   functionName  +  ";";
         } else if ((QB.func_UCase(  l))  == "EXIT SUB" ) {
            js = "return;";
         } else if ( first == "EXIT" ) {
            js = "break;";
         } else if ( first == "TYPE" ) {
            typeMode =  True;
            var qbtype = {line:0,name:'',argc:0,args:''}; // QBTYPE
            qbtype.line =  i;
            qbtype.name = (QB.func_UCase( QB.arrayValue(parts, [ 2]).value));
            await sub_AddType(  qbtype);
            currType = (QB.func_UBound(  types));
         } else if ( first == "EXPORT" ) {
            if ( c >  1) {
               var exparts = QB.initArray([{l:1,u:0}], ''); // STRING
               var excount = 0; // INTEGER
               excount = (await func_ListSplit( (await func_Join( parts,   2,    -  1,  " ")),  exparts));
               var exi = 0; // INTEGER
               for ( exi= 1;  exi <=  excount;  exi= exi + 1) {  if (QB.halted()) { return; }
                  await sub_ParseExport( QB.arrayValue(exparts, [ exi]).value,   i);
               }
               continue;
            } else {
            }
         } else if ( first == "CALL" ) {
            var subline = ''; // STRING
            subline = (QB.func__Trim( (await func_Join( parts,   2,    -  1,  " "))));
            var subend = 0; // INTEGER
            subend = (QB.func_InStr(  subline,  "("));
            var subname = ''; // STRING
            if ( subend ==  0) {
               subname =  subline;
            } else {
               subname = (QB.func_Left(  subline,   subend  -   1));
            }
            if ((await func_FindMethod(  subname,   m,  "SUB")) ) {
               var subargs = ''; // STRING
               if ( subname ==  subline) {
                  subargs = "";
               } else {
                  subargs = (QB.func_Mid(  subline,  (QB.func_Len(  subname))   +   2,  (QB.func_Len(  subline))   -  (QB.func_Len(  subname))   -   2));
               }
               js = (await func_ConvertSub(  m,   subargs,   i));
            } else {
               await sub_AddWarning(  i,  "Missing Sub ["   +   subname  +  "], ignoring Call command");
            }
         } else if ( c >  2) {
            var assignment = 0; // INTEGER
            assignment =  0;
            var j = 0; // INTEGER
            for ( j= 1;  j <= (QB.func_UBound(  parts));  j= j + 1) {  if (QB.halted()) { return; }
               if (QB.arrayValue(parts, [ j]).value  == "=" ) {
                  assignment =  j;
                  break;
               }
            }
            if ( assignment >  0) {
               js = (await func_RemoveSuffix( (await func_ConvertExpression( (await func_Join( parts,   1,   assignment  -   1,  " ")),   i))))   +  " = "   +  (await func_ConvertExpression( (await func_Join( parts,   assignment  +   1,    -  1,  " ")),   i))   +  ";";
            } else {
               if ((await func_FindMethod( QB.arrayValue(parts, [ 1]).value,   m,  "SUB")) ) {
                  js = (await func_ConvertSub(  m,  (await func_Join( parts,   2,    -  1,  " ")),   i));
               } else {
                  js = "// "   +   l;
                  await sub_AddWarning(  i,  "Missing or unsupported method: '"   +  QB.arrayValue(parts, [ 1]).value   +  "' - ignoring line");
               }
            }
         } else {
            if ((await func_FindMethod( QB.arrayValue(parts, [ 1]).value,   m,  "SUB")) ) {
               js = (await func_ConvertSub(  m,  (await func_Join( parts,   2,    -  1,  " ")),   i));
            } else {
               js = "// "   +   l;
               await sub_AddWarning(  i,  "Missing or unsupported method: '"   +  QB.arrayValue(parts, [ 1]).value   +  "' - ignoring line");
            }
         }
         if (( indent <  0) ) {
            totalIndent =  totalIndent  +   indent;
         }
         await sub_AddJSLine(  i,  (await func_LPad( "",  " ",  ( totalIndent  +   tempIndent)   *   3))   +   js);
         if (( indent >  0) ) {
            totalIndent =  totalIndent  +   indent;
         }
      }
   }
}
async function sub_ParseExport(s/*STRING*/,lineIndex/*INTEGER*/) {
if (QB.halted()) { return; }
   var exportedItem = ''; // STRING
   var ef = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
   var es = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
   var ev = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   var exportName = ''; // STRING
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   var found = 0; // INTEGER
   found =  False;
   var c = 0; // INTEGER
   c = (await func_SLSplit(  s,  parts,   False));
   if ((await func_FindMethod( QB.arrayValue(parts, [ 1]).value,   es,  "SUB")) ) {
      if ( c >  2) {
         exportName = QB.arrayValue(parts, [ 3]).value;
      } else {
         exportName = QB.arrayValue(parts, [ 1]).value;
      }
      exportedItem =  es.jsname;
      es.name =  exportName;
      await sub_AddExportMethod(  es,   currentModule  +  ".",   True);
      exportName = "sub_"   +   exportName;
      await sub_RegisterExport(  exportName,   exportedItem);
      found =  True;
   }
   if ((await func_FindMethod( QB.arrayValue(parts, [ 1]).value,   ef,  "FUNCTION")) ) {
      if ( c >  2) {
         exportName = QB.arrayValue(parts, [ 3]).value;
      } else {
         exportName = QB.arrayValue(parts, [ 1]).value;
      }
      exportedItem =  ef.jsname;
      ef.name =  exportName;
      await sub_AddExportMethod(  ef,   currentModule  +  ".",   True);
      exportName = "func_"   +   exportName;
      await sub_RegisterExport(  exportName,   exportedItem);
      found =  True;
   }
   if ((await func_FindVariable( QB.arrayValue(parts, [ 1]).value,   ev,   False)) ) {
      if ( ev.isConst ==  True) {
         if ( c >  2) {
            exportName = QB.arrayValue(parts, [ 3]).value;
         } else {
            exportName = QB.arrayValue(parts, [ 1]).value;
         }
         exportedItem =  ev.jsname;
         ev.name =  exportName;
         exportedItem =  ev.jsname;
         if ( exportName == "" ) {
            exportName = QB.arrayValue(parts, [ 1]).value;
         }
         ev.name =  exportName;
         await sub_AddExportConst(  currentModule  +  "."   +   exportName);
         await sub_RegisterExport(  exportName,   exportedItem);
         found =  True;
      }
   }
   if (! found) {
      await sub_AddWarning(  lineIndex,  "Invalid export ["   +  QB.arrayValue(parts, [ 1]).value   +  "].  Exported items must be a Sub, Function or Const in the current module.");
   }
}
async function sub_RegisterExport(exportName/*STRING*/,exportedItem/*STRING*/) {
if (QB.halted()) { return; }
   var esize = 0; // SINGLE
   esize = (QB.func_UBound(  exportLines))   +   1;
   QB.resizeArray(exportLines, [{l:1,u:esize}], '', true); // STRING
   QB.arrayValue(exportLines, [ esize]).value = "this."   +   exportName  +  " = "   +   exportedItem  +  ";";
}
async function func_ConvertSub(m/*METHOD*/,args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertSub = null;
   var js = ''; // STRING
   if ( m.name == "Line" ) {
      var parts = QB.initArray([{l:1,u:0}], ''); // STRING
      var plen = 0; // INTEGER
      plen = (await func_SLSplit(  args,  parts,   False));
      if ( plen >  0) {
         if ((QB.func_UCase( QB.arrayValue(parts, [ 1]).value))  == "INPUT" ) {
            m.name = "Line Input";
            m.jsname = "QB.sub_LineInput";
            args = (await func_Join( parts,   2,    -  1,  " "));
         }
      }
   }
   if ( m.name == "Line" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertLine(  args,   lineNumber))   +  ");";
   } else if ( m.name == "Cls" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertCls(  args,   lineNumber))   +  ");";
   } else if ( m.name == "Input"  ||  m.name == "Line Input" ) {
      js = (await func_ConvertInput(  m,   args,   lineNumber));
   } else if ( m.name == "PSet"  ||  m.name == "Circle"  ||  m.name == "PReset"  ||  m.name == "Paint" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertPSet(  args,   lineNumber))   +  ");";
   } else if ( m.name == "Print" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertPrint(  args,   lineNumber))   +  ");";
   } else if ( m.name == "Randomize" ) {
      js = (await func_ConvertRandomize(  m,   args,   lineNumber));
   } else if ( m.name == "Read" ) {
      js = (await func_ConvertRead(  m,   args,   lineNumber));
   } else if ( m.name == "Restore" ) {
      js = (await func_CallMethod(  m))   +  "('"   +  (QB.func_UCase(  args))   +  "');";
   } else if ( m.name == "Swap" ) {
      js = (await func_ConvertSwap(  m,   args,   lineNumber));
   } else if ( m.name == "Window" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertWindow(  args,   lineNumber))   +  ");";
   } else if ( m.name == "_PrintString" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertPrintString(  args,   lineNumber))   +  ");";
   } else if ( m.name == "_PutImage" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertPutImage(  args,   lineNumber))   +  ");";
   } else if ( m.name == "_FullScreen" ) {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertFullScreen(  args))   +  ");";
   } else {
      js = (await func_CallMethod(  m))   +  "("   +  (await func_ConvertMethodParams(  args,   lineNumber))   +  ");";
   }
   ConvertSub =  js;
return ConvertSub;
}
async function func_ConvertFullScreen(args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertFullScreen = null;
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   var argc = 0; // INTEGER
   var mode = ''; // STRING
   mode = "QB.STRETCH";
   var doSmooth = ''; // STRING
   doSmooth = "false";
   argc = (await func_ListSplit(  args,  parts));
   if ( argc >  0) {
      var arg = ''; // STRING
      arg = (QB.func_UCase( QB.arrayValue(parts, [ 1]).value));
      if ( arg == "_OFF" ) {
         mode = "QB.OFF";
      } else if ( arg == "_STRETCH" ) {
         mode = "QB.STRETCH";
      } else if ( arg == "_SQUAREPIXELS" ) {
         mode = "QB.SQUAREPIXELS";
      }
   }
   if ( argc >  1) {
      if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "_SMOOTH" ) {
         doSmooth = "true";
      }
   }
   ConvertFullScreen =  mode  +  ", "   +   doSmooth;
return ConvertFullScreen;
}
async function func_ConvertLine(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertLine = null;
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   var sstep = ''; // STRING
   var estep = ''; // STRING
   sstep = "false";
   estep = "false";
   idx = (await func_FindParamChar(  args,  ","));
   if ( idx ==   -  1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = (QB.func_Left(  args,   idx  -   1));
      theRest = (QB.func_Right(  args,  (QB.func_Len(  args))   -   idx));
   }
   idx = (await func_FindParamChar(  firstParam,  "-"));
   var startCord = ''; // STRING
   var endCord = ''; // STRING
   if ( idx ==   -  1) {
      endCord =  firstParam;
   } else {
      startCord = (QB.func_Left(  firstParam,   idx  -   1));
      endCord = (QB.func_Right(  firstParam,  (QB.func_Len(  firstParam))   -   idx));
   }
   if ((QB.func_UCase( (QB.func__Trim( (QB.func_Left(  startCord,   4))))))  == "STEP" ) {
      sstep = "true";
   }
   if ((QB.func_UCase( (QB.func__Trim( (QB.func_Left(  endCord,   4))))))  == "STEP" ) {
      estep = "true";
   }
   idx = (QB.func_InStr(  startCord,  "("));
   startCord = (QB.func_Right(  startCord,  (QB.func_Len(  startCord))   -   idx));
   idx = (QB.func__InStrRev(  startCord,  ")"));
   startCord = (QB.func_Left(  startCord,   idx  -   1));
   startCord = (await func_ConvertExpression(  startCord,   lineNumber));
   if (((QB.func__Trim(  startCord))  == "") ) {
      startCord = "undefined, undefined";
   }
   idx = (QB.func_InStr(  endCord,  "("));
   endCord = (QB.func_Right(  endCord,  (QB.func_Len(  endCord))   -   idx));
   idx = (QB.func__InStrRev(  endCord,  ")"));
   endCord = (QB.func_Left(  endCord,   idx  -   1));
   endCord = (await func_ConvertExpression(  endCord,   lineNumber));
   theRest = (await func_ConvertExpression(  theRest,   lineNumber));
   theRest = (await func_Replace(  theRest,  " BF",  " "   +  (QB.func_Chr(  34))   +  "BF"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " bf",  " "   +  (QB.func_Chr(  34))   +  "BF"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " bF",  " "   +  (QB.func_Chr(  34))   +  "BF"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " Bf",  " "   +  (QB.func_Chr(  34))   +  "BF"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " B",  " "   +  (QB.func_Chr(  34))   +  "B"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " b",  " "   +  (QB.func_Chr(  34))   +  "B"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " T",  " "   +  (QB.func_Chr(  34))   +  "T"   +  (QB.func_Chr(  34))));
   theRest = (await func_Replace(  theRest,  " t",  " "   +  (QB.func_Chr(  34))   +  "T"   +  (QB.func_Chr(  34))));
   ConvertLine =  sstep  +  ", "   +   startCord  +  ", "   +   estep  +  ", "   +   endCord  +  ", "   +   theRest;
return ConvertLine;
}
async function func_ConvertPutImage(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertPutImage = null;
   var argc = 0; // INTEGER
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   var startCoord = ''; // STRING
var sourceImage = ''; // STRING
var destImage = ''; // STRING
var destCoord = ''; // STRING
var doSmooth = ''; // STRING
   startCoord = (await func_ConvertCoordParam( "",   True,   lineNumber));
   destCoord = (await func_ConvertCoordParam( "",   True,   lineNumber));
   sourceImage = "undefined";
   destImage = "undefined";
   doSmooth = "false";
   if ((await func_EndsWith( (QB.func__Trim( (QB.func_UCase(  args)))),  "_SMOOTH")) ) {
      doSmooth = "true";
      args = (QB.func_Left( (QB.func__Trim(  args)),  (QB.func_Len( (QB.func__Trim(  args))))   -   7));
   }
   argc = (await func_ListSplit(  args,  parts));
   if ( argc >=  1) {
      startCoord = (await func_ConvertCoordParam( QB.arrayValue(parts, [ 1]).value,   True,   lineNumber));
   }
   if ( argc >=  2) {
      sourceImage = (await func_ConvertExpression( QB.arrayValue(parts, [ 2]).value,   lineNumber));
   }
   if ( argc >=  3) {
      if ((QB.func__Trim( QB.arrayValue(parts, [ 3]).value))  != "" ) {
         destImage = (await func_ConvertExpression( QB.arrayValue(parts, [ 3]).value,   lineNumber));
      }
   }
   if ( argc >=  4) {
      destCoord = (await func_ConvertCoordParam( QB.arrayValue(parts, [ 4]).value,   True,   lineNumber));
   }
   if ( argc >=  5) {
      if ((QB.func__Trim( (QB.func_UCase( QB.arrayValue(parts, [ 5]).value))))  == "_SMOOTH" ) {
         doSmooth = "true";
      }
   }
   ConvertPutImage =  startCoord  +  ", "   +   sourceImage  +  ", "   +   destImage  +  ", "   +   destCoord  +  ", "   +   doSmooth;
return ConvertPutImage;
}
async function func_ConvertWindow(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertWindow = null;
   var invertFlag = ''; // STRING
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   var sstep = ''; // STRING
   var estep = ''; // STRING
   invertFlag = "false";
   var kwd = ''; // STRING
   kwd = "SCREEN";
   if (((QB.func_UCase( (QB.func_Left(  args,  (QB.func_Len(  kwd))))))  ==  kwd) ) {
      args = (QB.func_Right(  args,  (QB.func_Len(  args))   -  (QB.func_Len(  kwd))));
      invertFlag = "true";
   }
   args = (QB.func__Trim(  args));
   sstep = "false";
   estep = "false";
   idx = (await func_FindParamChar(  args,  ","));
   if ( idx ==   -  1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = (QB.func_Left(  args,   idx  -   1));
      theRest = (QB.func_Right(  args,  (QB.func_Len(  args))   -   idx));
   }
   idx = (await func_FindParamChar(  firstParam,  "-"));
   var startCord = ''; // STRING
   var endCord = ''; // STRING
   if ( idx ==   -  1) {
      endCord =  firstParam;
   } else {
      startCord = (QB.func_Left(  firstParam,   idx  -   1));
      endCord = (QB.func_Right(  firstParam,  (QB.func_Len(  firstParam))   -   idx));
   }
   idx = (QB.func_InStr(  startCord,  "("));
   startCord = (QB.func_Right(  startCord,  (QB.func_Len(  startCord))   -   idx));
   idx = (QB.func__InStrRev(  startCord,  ")"));
   startCord = (QB.func_Left(  startCord,   idx  -   1));
   startCord = (await func_ConvertExpression(  startCord,   lineNumber));
   if (((QB.func__Trim(  startCord))  == "") ) {
      startCord = "undefined, undefined";
   }
   idx = (QB.func_InStr(  endCord,  "("));
   endCord = (QB.func_Right(  endCord,  (QB.func_Len(  endCord))   -   idx));
   idx = (QB.func__InStrRev(  endCord,  ")"));
   endCord = (QB.func_Left(  endCord,   idx  -   1));
   endCord = (await func_ConvertExpression(  endCord,   lineNumber));
   ConvertWindow =  invertFlag  +  ", "   +   startCord  +  ", "   +   endCord;
return ConvertWindow;
}
async function func_ConvertCls(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertCls = null;
   var argc = 0; // INTEGER
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   argc = (await func_ListSplit(  args,  parts));
   var method = ''; // STRING
var bgcolor = ''; // STRING
   method = "undefined";
   bgcolor = "undefined";
   if ( argc >=  1) {
      if ((QB.func__Trim( QB.arrayValue(parts, [ 1]).value))  != "" ) {
         method = (await func_ConvertExpression( QB.arrayValue(parts, [ 1]).value,   lineNumber));
      }
   }
   if ( argc >=  2) {
      bgcolor = (await func_ConvertExpression( QB.arrayValue(parts, [ 2]).value,   lineNumber));
   }
   ConvertCls =  method  +  ", "   +   bgcolor;
return ConvertCls;
}
async function func_ConvertRandomize(m/*METHOD*/,args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertRandomize = null;
   var uusing = ''; // STRING
   var theseed = ''; // STRING
   uusing = "false";
   theseed =  args;
   if ((QB.func__Trim(  args))  == "" ) {
      theseed = "undefined";
   } else {
      if (((QB.func_UCase( (QB.func__Trim( (QB.func_Left(  args,   5))))))  == "USING") ) {
         uusing = "true";
         theseed = (QB.func__Trim( (QB.func_Right(  args,  (QB.func_Len(  args))   -   5))));
      }
      theseed = (await func_ConvertExpression(  theseed,   lineNumber));
   }
   ConvertRandomize = (await func_CallMethod(  m))   +  "("   +   uusing  +  ", "   +   theseed  +  ")";
return ConvertRandomize;
}
async function func_ConvertRead(m/*METHOD*/,args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertRead = null;
   var js = ''; // STRING
   var vname = ''; // STRING
   var pcount = 0; // INTEGER
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   var vars = QB.initArray([{l:1,u:0}], ''); // STRING
   var vcount = 0; // INTEGER
   var p = ''; // STRING
   pcount = (await func_ListSplit(  args,  parts));
   var i = 0; // INTEGER
   for ( i= 1;  i <=  pcount;  i= i + 1) {  if (QB.halted()) { return; }
      p = (QB.func__Trim( QB.arrayValue(parts, [ i]).value));
      vcount = (QB.func_UBound(  vars))   +   1;
      QB.resizeArray(vars, [{l:1,u:vcount}], '', true); // STRING
      QB.arrayValue(vars, [ vcount]).value =  p;
   }
   vname = await func_GenJSVar();
   js = "var "   +   vname  +  " = new Array("   +  (QB.func_Str( (QB.func_UBound(  vars))))   +  ");"   +  await func_LF();
   js =  js  +  (await func_CallMethod(  m))   +  "("   +   vname  +  ");"   +  await func_LF();
   for ( i= 1;  i <= (QB.func_UBound(  vars));  i= i + 1) {  if (QB.halted()) { return; }
      js =  js  +  (await func_ConvertExpression( QB.arrayValue(vars, [ i]).value,   lineNumber))   +  " = "   +   vname  +  "["   +  (QB.func_Str(  i  -   1))   +  "];"   +  await func_LF();
   }
   ConvertRead =  js;
return ConvertRead;
}
async function func_ConvertCoordParam(param/*STRING*/,hasEndCoord/*INTEGER*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertCoordParam = null;
   if ((QB.func__Trim(  param))  == "" ) {
      if ( hasEndCoord) {
         ConvertCoordParam = "false, undefined, undefined, false, undefined, undefined";
      } else {
         ConvertCoordParam = "false, undefined, undefined";
      }
   } else {
      var js = ''; // STRING
var startCoord = ''; // STRING
var endCoord = ''; // STRING
var sstep = ''; // STRING
var estep = ''; // STRING
      var idx = 0; // INTEGER
      sstep = "false";
      estep = "false";
      idx = (await func_FindParamChar(  param,  "-"));
      if ( idx ==   -  1) {
         startCoord =  param;
         endCoord = "";
      } else {
         startCoord = (QB.func_Left(  param,   idx  -   1));
         endCoord = (QB.func_Right(  param,  (QB.func_Len(  param))   -   idx));
      }
      if ((QB.func_UCase( (QB.func__Trim( (QB.func_Left(  startCoord,   4))))))  == "STEP" ) {
         sstep = "true";
      }
      if ((QB.func_UCase( (QB.func__Trim( (QB.func_Left(  endCoord,   4))))))  == "STEP" ) {
         estep = "true";
      }
      idx = (QB.func_InStr(  startCoord,  "("));
      startCoord = (QB.func_Right(  startCoord,  (QB.func_Len(  startCoord))   -   idx));
      idx = (QB.func__InStrRev(  startCoord,  ")"));
      startCoord = (QB.func_Left(  startCoord,   idx  -   1));
      startCoord = (await func_ConvertExpression(  startCoord,   lineNumber));
      if (((QB.func__Trim(  startCoord))  == "") ) {
         startCoord = "undefined, undefined";
      }
      if ( hasEndCoord) {
         idx = (QB.func_InStr(  endCoord,  "("));
         endCoord = (QB.func_Right(  endCoord,  (QB.func_Len(  endCoord))   -   idx));
         idx = (QB.func__InStrRev(  endCoord,  ")"));
         endCoord = (QB.func_Left(  endCoord,   idx  -   1));
         endCoord = (await func_ConvertExpression(  endCoord,   lineNumber));
         if (((QB.func__Trim(  endCoord))  == "") ) {
            endCoord = "undefined, undefined";
         }
         ConvertCoordParam =  sstep  +  ", "   +   startCoord  +  ", "   +   estep  +  ", "   +   endCoord;
      } else {
         ConvertCoordParam =  sstep  +  ", "   +   startCoord;
      }
   }
return ConvertCoordParam;
}
async function func_ConvertPSet(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertPSet = null;
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   var sstep = ''; // STRING
   sstep = "false";
   idx = (await func_FindParamChar(  args,  ","));
   if ( idx ==   -  1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = (QB.func_Left(  args,   idx  -   1));
      theRest = (QB.func_Right(  args,  (QB.func_Len(  args))   -   idx));
   }
   if ((QB.func_UCase( (QB.func__Trim( (QB.func_Left(  firstParam,   4))))))  == "STEP" ) {
      sstep = "true";
   }
   idx = (QB.func_InStr(  firstParam,  "("));
   firstParam = (QB.func_Right(  firstParam,  (QB.func_Len(  firstParam))   -   idx));
   idx = (QB.func__InStrRev(  firstParam,  ")"));
   firstParam = (QB.func_Left(  firstParam,   idx  -   1));
   firstParam = (await func_ConvertExpression(  firstParam,   lineNumber));
   if (((QB.func__Trim(  firstParam))  == "") ) {
      firstParam = "undefined, undefined";
   }
   theRest = (await func_ConvertExpression(  theRest,   lineNumber));
   ConvertPSet =  sstep  +  ", "   +   firstParam  +  ", "   +   theRest;
return ConvertPSet;
}
async function func_ConvertPrint(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertPrint = null;
   var pcount = 0; // INTEGER
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   pcount = (await func_PrintSplit(  args,  parts));
   var js = ''; // STRING
   js = "[";
   var i = 0; // INTEGER
   for ( i= 1;  i <=  pcount;  i= i + 1) {  if (QB.halted()) { return; }
      if ( i >  1) {
         js =  js  +  ",";
      }
      if (QB.arrayValue(parts, [ i]).value  == "," ) {
         js =  js  +  "QB.COLUMN_ADVANCE";
      } else if (QB.arrayValue(parts, [ i]).value  == ";" ) {
         js =  js  +  "QB.PREVENT_NEWLINE";
      } else {
         js =  js  +  (await func_ConvertExpression( QB.arrayValue(parts, [ i]).value,   lineNumber));
      }
   }
   ConvertPrint =  js  +  "]";
return ConvertPrint;
}
async function func_ConvertPrintString(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertPrintString = null;
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   idx = (await func_FindParamChar(  args,  ","));
   if ( idx ==   -  1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = (QB.func_Left(  args,   idx  -   1));
      theRest = (QB.func_Right(  args,  (QB.func_Len(  args))   -   idx));
   }
   idx = (QB.func_InStr(  firstParam,  "("));
   firstParam = (QB.func_Right(  firstParam,  (QB.func_Len(  firstParam))   -   idx));
   idx = (QB.func__InStrRev(  firstParam,  ")"));
   firstParam = (QB.func_Left(  firstParam,   idx  -   1));
   ConvertPrintString = (await func_ConvertExpression(  firstParam,   lineNumber))   +  ", "   +  (await func_ConvertExpression(  theRest,   lineNumber));
return ConvertPrintString;
}
async function func_ConvertInput(m/*METHOD*/,args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertInput = null;
   var js = ''; // STRING
   var vname = ''; // STRING
   var pcount = 0; // INTEGER
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   var vars = QB.initArray([{l:1,u:0}], ''); // STRING
   var varIndex = 0; // INTEGER
   varIndex =  1;
   var preventNewline = ''; // STRING
   preventNewline = "false";
   var addQuestionPrompt = ''; // STRING
   addQuestionPrompt = "false";
   var prompt = ''; // STRING
   prompt = "undefined";
   var vcount = 0; // INTEGER
   var p = ''; // STRING
   pcount = (await func_PrintSplit(  args,  parts));
   var i = 0; // INTEGER
   for ( i= 1;  i <=  pcount;  i= i + 1) {  if (QB.halted()) { return; }
      p = (QB.func__Trim( QB.arrayValue(parts, [ i]).value));
      if ( p == ";" ) {
         if ( i ==  1) {
            preventNewline = "true";
         } else {
            addQuestionPrompt = "true";
         }
      } else if ((await func_StartsWith(  p,  (QB.func_Chr(  34)))) ) {
         prompt =  p;
      } else if ( p != "," ) {
         vcount = (QB.func_UBound(  vars))   +   1;
         QB.resizeArray(vars, [{l:1,u:vcount}], '', true); // STRING
         QB.arrayValue(vars, [ vcount]).value =  p;
      }
   }
   vname = await func_GenJSVar();
   js = "var "   +   vname  +  " = new Array("   +  (QB.func_Str( (QB.func_UBound(  vars))))   +  ");"   +  await func_LF();
   js =  js  +  (await func_CallMethod(  m))   +  "("   +   vname  +  ", "   +   preventNewline  +  ", "   +   addQuestionPrompt  +  ", "   +   prompt  +  ");"   +  await func_LF();
   for ( i= 1;  i <= (QB.func_UBound(  vars));  i= i + 1) {  if (QB.halted()) { return; }
      if (!(await func_StartsWith( (QB.func__Trim( QB.arrayValue(vars, [ i]).value)),  "#")) ) {
         js =  js  +  (await func_ConvertExpression( QB.arrayValue(vars, [ i]).value,   lineNumber))   +  " = "   +   vname  +  "["   +  (QB.func_Str(  i  -   1))   +  "];"   +  await func_LF();
      }
   }
   ConvertInput =  js;
return ConvertInput;
}
async function func_ConvertSwap(m/*METHOD*/,args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertSwap = null;
   var js = ''; // STRING
   var swapArray = ''; // STRING
   swapArray = await func_GenJSVar();
   var swapArgs = QB.initArray([{l:1,u:0}], ''); // STRING
   var swapCount = 0; // INTEGER
   swapCount = (await func_ListSplit(  args,  swapArgs));
   var var1 = ''; // STRING
   var var2 = ''; // STRING
   var1 = (await func_ConvertExpression( QB.arrayValue(swapArgs, [ 1]).value,   lineNumber));
   var2 = (await func_ConvertExpression( QB.arrayValue(swapArgs, [ 2]).value,   lineNumber));
   js = "var "   +   swapArray  +  " = ["   +   var1  +  ","   +   var2  +  "];"   +  await func_LF();
   js =  js  +  (await func_CallMethod(  m))   +  "("   +   swapArray  +  ");"   +  await func_LF();
   js =  js  +   var1  +  " = "   +   swapArray  +  "[0];"   +  await func_LF();
   js =  js  +   var2  +  " = "   +   swapArray  +  "[1];";
   ConvertSwap =  js;
return ConvertSwap;
}
async function func_GenJSVar() {
if (QB.halted()) { return; }
var GenJSVar = null;
   GenJSVar = "___v"   +  (QB.func__Trim( (QB.func_Str( (QB.func__Round( QB.func_Rnd()  *   10000000))))));
return GenJSVar;
}
async function func_FindParamChar(s/*STRING*/,char/*STRING*/) {
if (QB.halted()) { return; }
var FindParamChar = null;
   var idx = 0; // INTEGER
   idx =   -  1;
   var c = ''; // STRING
   var quote = 0; // INTEGER
   var paren = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  s));  i= i + 1) {  if (QB.halted()) { return; }
      c = (QB.func_Mid(  s,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         quote = ! quote;
      } else if (! quote &&  c == "(" ) {
         paren =  paren  +   1;
      } else if (! quote &&  c == ")" ) {
         paren =  paren  -   1;
      } else if (! quote &&  paren ==  0 &&  c ==  char) {
         idx =  i;
         break;
      }
   }
   FindParamChar =  idx;
return FindParamChar;
}
async function func_DeclareVar(parts/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var DeclareVar = null;
   var vname = ''; // STRING
   var vtype = ''; // STRING
   vtype = "";
   var vtypeIndex = 0; // INTEGER
   vtypeIndex =  4;
   var isGlobal = 0; // INTEGER
   isGlobal =  False;
   var isArray = 0; // INTEGER
   isArray =  False;
   var arraySize = ''; // STRING
   var pstart = 0; // INTEGER
   var bvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   var varnames = QB.initArray([{l:1,u:0}], ''); // STRING
   var vnamecount = 0; // INTEGER
   var findVar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   var asIdx = 0; // INTEGER
   asIdx =  0;
   var js = ''; // STRING
   js = "";
   var preserve = ''; // STRING
   preserve = "false";
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  parts));  i= i + 1) {  if (QB.halted()) { return; }
      if ((QB.func_UCase( QB.arrayValue(parts, [ i]).value))  == "AS" ) {
         asIdx =  i;
      }
      if ((QB.func_UCase( QB.arrayValue(parts, [ i]).value))  == "_PRESERVE" ) {
         preserve = "true";
      }
      if ((QB.func_UCase( QB.arrayValue(parts, [ i]).value))  == "SHARED" ) {
         isGlobal =  True;
      }
   }
   if ( asIdx ==  2 || ( asIdx ==  3 && ( isGlobal ||  preserve == "true"))  || ( asIdx ==  4 &&  isGlobal &&  preserve == "true") ) {
      bvar.type = (QB.func_UCase( QB.arrayValue(parts, [ asIdx  +   1]).value));
      var nextIdx = 0; // INTEGER
      nextIdx =  asIdx  +   2;
      if ( bvar.type == "_UNSIGNED" ) {
         bvar.type =  bvar.type  +  " "   +  (QB.func_UCase( QB.arrayValue(parts, [ asIdx  +   2]).value));
         nextIdx =  asIdx  +   3;
      }
      bvar.typeId = (await func_FindTypeId(  bvar.type));
      vnamecount = (await func_ListSplit( (await func_Join( parts,   nextIdx,    -  1,  " ")),  varnames));
      for ( i= 1;  i <=  vnamecount;  i= i + 1) {  if (QB.halted()) { return; }
         vname = (QB.func__Trim( QB.arrayValue(varnames, [ i]).value));
         pstart = (QB.func_InStr(  vname,  "("));
         if ( pstart >  0) {
            bvar.isArray =  True;
            arraySize = (await func_ConvertExpression( (QB.func_Mid(  vname,   pstart  +   1,  (QB.func_Len(  vname))   -   pstart  -   1)),   lineNumber));
            bvar.name = (await func_RemoveSuffix( (QB.func_Left(  vname,   pstart  -   1))));
         } else {
            bvar.isArray =  False;
            arraySize = "";
            bvar.name =  vname;
         }
         bvar.jsname = "";
         if (! bvar.isArray) {
            js =  js  +  "var "   +   bvar.name  +  " = "   +  (await func_InitTypeValue(  bvar.type))   +  ";";
         } else {
            if ((await func_FindVariable(  bvar.name,   findVar,   True)) ) {
               js =  js  +  "QB.resizeArray("   +   bvar.name  +  ", ["   +  (await func_FormatArraySize(  arraySize))   +  "], "   +  (await func_InitTypeValue(  bvar.type))   +  ", "   +   preserve  +  ");";
            } else {
               js =  js  +  "var "   +   bvar.name  +  " = QB.initArray(["   +  (await func_FormatArraySize(  arraySize))   +  "], "   +  (await func_InitTypeValue(  bvar.type))   +  ");";
            }
         }
         if ( isGlobal) {
            await sub_AddVariable(  bvar,  globalVars);
         } else {
            await sub_AddVariable(  bvar,  localVars);
         }
         js =  js  +  " // "   +   bvar.type;
         if ( i <  vnamecount) {
            js =  js  +  await func_LF();
         }
      }
   } else {
      var vpartcount = 0; // INTEGER
      var vparts = QB.initArray([{l:1,u:0}], ''); // STRING
      nextIdx =  0;
      for ( i= 1;  i <= (QB.func_UBound(  parts));  i= i + 1) {  if (QB.halted()) { return; }
         var p = ''; // STRING
         p = (QB.func_UCase( QB.arrayValue(parts, [ i]).value));
         if ( p == "DIM"  ||  p == "REDIM"  ||  p == "SHARED"  ||  p == "_PRESERVE" ) {
            nextIdx =  i  +   1;
         }
      }
      vnamecount = (await func_ListSplit( (await func_Join( parts,   nextIdx,    -  1,  " ")),  varnames));
      for ( i= 1;  i <=  vnamecount;  i= i + 1) {  if (QB.halted()) { return; }
         vpartcount = (await func_SLSplit2( QB.arrayValue(varnames, [ i]).value,  vparts));
         bvar.name = (await func_RemoveSuffix( QB.arrayValue(vparts, [ 1]).value));
         if ( vpartcount ==  1) {
            bvar.type = (await func_DataTypeFromName(  bvar.name));
         } else if ( vpartcount ==  3) {
            bvar.type = (QB.func_UCase( QB.arrayValue(vparts, [ 3]).value));
         } else if ( vpartcount ==  4) {
            bvar.type = (QB.func_UCase( (await func_Join( vparts,   3,    -  1,  " "))));
         } else {
         }
         bvar.typeId = (await func_FindTypeId(  bvar.type));
         pstart = (QB.func_InStr(  bvar.name,  "("));
         if ( pstart >  0) {
            bvar.isArray =  True;
            arraySize = (await func_ConvertExpression( (QB.func_Mid(  bvar.name,   pstart  +   1,  (QB.func_Len(  bvar.name))   -   pstart  -   1)),   lineNumber));
            bvar.name = (await func_RemoveSuffix( (QB.func_Left(  bvar.name,   pstart  -   1))));
         } else {
            bvar.isArray =  False;
            arraySize = "";
         }
         bvar.jsname = "";
         if (! bvar.isArray) {
            js =  js  +  "var "   +   bvar.name  +  " = "   +  (await func_InitTypeValue(  bvar.type))   +  ";";
         } else {
            if ((await func_FindVariable(  bvar.name,   findVar,   True)) ) {
               js =  js  +  "QB.resizeArray("   +   bvar.name  +  ", ["   +  (await func_FormatArraySize(  arraySize))   +  "], "   +  (await func_InitTypeValue(  bvar.type))   +  ", "   +   preserve  +  ");";
            } else {
               js =  js  +  "var "   +   bvar.name  +  " = QB.initArray(["   +  (await func_FormatArraySize(  arraySize))   +  "], "   +  (await func_InitTypeValue(  bvar.type))   +  ");";
            }
         }
         if ( isGlobal) {
            await sub_AddVariable(  bvar,  globalVars);
         } else {
            await sub_AddVariable(  bvar,  localVars);
         }
         js =  js  +  " // "   +   bvar.type;
         if ( i <  vnamecount) {
            js =  js  +  await func_LF();
         }
      }
   }
   DeclareVar =  js;
return DeclareVar;
}
async function func_FormatArraySize(sizeString/*STRING*/) {
if (QB.halted()) { return; }
var FormatArraySize = null;
   var sizeParams = ''; // STRING
   sizeParams = "";
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   var pcount = 0; // INTEGER
   pcount = (await func_ListSplit(  sizeString,  parts));
   var i = 0; // INTEGER
   for ( i= 1;  i <=  pcount;  i= i + 1) {  if (QB.halted()) { return; }
      var subparts = QB.initArray([{l:1,u:0}], ''); // STRING
      var scount = 0; // INTEGER
      scount = (await func_SLSplit2( QB.arrayValue(parts, [ i]).value,  subparts));
      if ( i >  1) {
         sizeParams =  sizeParams  +  ",";
      }
      if ( scount ==  1) {
         sizeParams =  sizeParams  +  "{l:1,u:"   +  QB.arrayValue(subparts, [ 1]).value   +  "}";
      } else {
         sizeParams =  sizeParams  +  "{l:"   +  QB.arrayValue(subparts, [ 1]).value   +  ",u:"   +  QB.arrayValue(subparts, [ 3]).value   +  "}";
      }
   }
   FormatArraySize =  sizeParams;
return FormatArraySize;
}
async function func_InitTypeValue(vtype/*STRING*/) {
if (QB.halted()) { return; }
var InitTypeValue = null;
   var value = ''; // STRING
   if ( vtype == "STRING" ) {
      value = "''";
   } else if ( vtype == "OBJECT" ) {
      value = "{}";
   } else if ( vtype == "_BIT"  ||  vtype == "_UNSIGNED _BIT"  ||  vtype == "_BYTE"  ||  vtype == "_UNSIGNED _BYTE"  ||  vtype == "INTEGER"  ||  vtype == "_UNSIGNED INTEGER"  ||  vtype == "LONG"  ||  vtype == "_UNSIGNED LONG"  ||  vtype == "_INTEGER64"  ||  vtype == "_UNSIGNED INTEGER64"  ||  vtype == "SINGLE"  ||  vtype == "DOUBLE"  ||  vtype == "_FLOAT"  ||  vtype == "_OFFSET"  ||  vtype == "_UNSIGNED _OFFSET" ) {
      value = "0";
   } else {
      value = "{";
      var typeId = 0; // INTEGER
      typeId = (await func_FindTypeId(  vtype));
      var i = 0; // INTEGER
      for ( i= 1;  i <= (QB.func_UBound(  typeVars));  i= i + 1) {  if (QB.halted()) { return; }
         if ( typeId == QB.arrayValue(typeVars, [ i]).value .typeId) {
            value =  value  +  QB.arrayValue(typeVars, [ i]).value .name  +  ":"   +  (await func_InitTypeValue( QB.arrayValue(typeVars, [ i]).value .type))   +  ",";
         }
      }
      value = (QB.func_Left(  value,  (QB.func_Len(  value))   -   1))   +  "}";
   }
   InitTypeValue =  value;
return InitTypeValue;
}
async function func_FindTypeId(typeName/*STRING*/) {
if (QB.halted()) { return; }
var FindTypeId = null;
   var id = 0; // INTEGER
   id =   -  1;
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  types));  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.arrayValue(types, [ i]).value .name ==  typeName) {
         id =  i;
         break;
      }
   }
   FindTypeId =  id;
return FindTypeId;
}
async function func_ConvertExpression(ex/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertExpression = null;
   var c = ''; // STRING
   var js = ''; // STRING
   js = "";
   var word = ''; // STRING
   word = "";
   var bvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
   var isOperator = 0; // INTEGER
   var stringLiteral = 0; // INTEGER
   var i = 0; // INTEGER
   i =  1;
   while ( i <= (QB.func_Len(  ex))) {  if (QB.halted()) { return; }
      c = (QB.func_Mid(  ex,   i,   1));
      isOperator = (QB.func_InStr(  OPERATORS,   c));
      if ( c == (QB.func_Chr(  34)) ) {
         js =  js  +   c;
         stringLiteral = ! stringLiteral;
      } else if ( stringLiteral) {
         js =  js  +   c;
      } else {
         if ( c == " "  ||  c == ","  ||  isOperator ||  i == (QB.func_Len(  ex)) ) {
            if ( i == (QB.func_Len(  ex)) ) {
               word =  word  +   c;
            }
            var uword = ''; // STRING
            uword = (QB.func_UCase(  word));
            if ( uword == "NOT" ) {
               js =  js  +  "!";
            } else if ( uword == "AND" ) {
               js =  js  +  " && ";
            } else if ( uword == "OR" ) {
               js =  js  +  " || ";
            } else if ( uword == "MOD" ) {
               js =  js  +  " % ";
            } else if ( word == "=" ) {
               js =  js  +  " == ";
            } else if ( word == "<>" ) {
               js =  js  +  " != ";
            } else if ( word == "^" ) {
               js =  js  +  " ** ";
            } else if ( word == ">"  ||  word == ">="  ||  word == "<"  ||  word == "<=" ) {
               js =  js  +  " "   +   word  +  " ";
            } else if ((await func_StartsWith(  word,  "&H"))  || (await func_StartsWith(  word,  "&O"))  || (await func_StartsWith(  word,  "&B")) ) {
               js =  js  +  " QB.func_Val('"   +   word  +  "') ";
            } else {
               if ((await func_FindVariable(  word,   bvar,   False)) ) {
                  js =  js  +  " "   +   bvar.jsname;
               } else {
                  if ((await func_FindMethod(  word,   m,  "FUNCTION")) ) {
                     if ( m.name !=  currentMethod) {
                        js =  js  +  (await func_CallMethod(  m))   +  "()";
                     } else {
                        js =  js  +  " "   +   word;
                     }
                  } else {
                     js =  js  +  " "   +   word;
                  }
               }
            }
            if ( c == ","  &&  i != (QB.func_Len(  ex)) ) {
               js =  js  +  ",";
            } else if ( isOperator) {
               if ( c == "\\" ) {
                  c = "/";
               }
               js =  js  +  " "   +   c  +  " ";
            }
            word = "";
         } else if ( c == "(" ) {
            var done = 0; // INTEGER
            done =  False;
            var pcount = 0; // INTEGER
            pcount =  0;
            var c2 = ''; // STRING
            var ex2 = ''; // STRING
            ex2 = "";
            var stringLiteral2 = 0; // INTEGER
            stringLiteral2 =  False;
            i =  i  +   1;
            while (! done &&  i <= (QB.func_Len(  ex))) {  if (QB.halted()) { return; }
               c2 = (QB.func_Mid(  ex,   i,   1));
               if ( c2 == (QB.func_Chr(  34)) ) {
                  stringLiteral2 = ! stringLiteral2;
               } else if (! stringLiteral2 &&  c2 == "(" ) {
                  pcount =  pcount  +   1;
               } else if (! stringLiteral2 &&  c2 == ")" ) {
                  if ( pcount ==  0) {
                     done =  True;
                  } else {
                     pcount =  pcount  -   1;
                  }
               }
               if (! done) {
                  ex2 =  ex2  +   c2;
                  i =  i  +   1;
               }
            }
            var fneg = ''; // STRING
            fneg = "";
            if ((QB.func_Len(  word))  >  0) {
               if ((QB.func_Left(  word,   1))  == "-" ) {
                  fneg = "-";
                  word = (QB.func_Mid(  word,   2));
               }
            }
            if ((await func_FindVariable(  word,   bvar,   True)) ) {
               if ((QB.func__Trim(  ex2))  == "" ) {
                  js =  js  +   fneg  +   bvar.jsname;
               } else {
                  js =  js  +   fneg  +  "QB.arrayValue("   +   bvar.jsname  +  ", ["   +  (await func_ConvertExpression(  ex2,   lineNumber))   +  "]).value";
               }
            } else if ((await func_FindMethod(  word,   m,  "FUNCTION")) ) {
               js =  js  +   fneg  +  "("   +  (await func_CallMethod(  m))   +  "("   +  (await func_ConvertMethodParams(  ex2,   lineNumber))   +  "))";
            } else {
               if ((QB.func__Trim(  word))  != "" ) {
                  await sub_AddWarning(  lineNumber,  "Missing function or array ["   +   word  +  "]");
               }
               js =  js  +   fneg  +  "("   +  (await func_ConvertExpression(  ex2,   lineNumber))   +  ")";
            }
            word = "";
         } else {
            word =  word  +   c;
         }
      }
      i =  i  +   1;
   }
   ConvertExpression =  js;
return ConvertExpression;
}
async function func_ConvertMethodParams(args/*STRING*/,lineNumber/*INTEGER*/) {
if (QB.halted()) { return; }
var ConvertMethodParams = null;
   var js = ''; // STRING
   var params = QB.initArray([{l:1,u:0}], ''); // STRING
   var argc = 0; // INTEGER
   argc = (await func_ListSplit(  args,  params));
   var i = 0; // INTEGER
   for ( i= 1;  i <=  argc;  i= i + 1) {  if (QB.halted()) { return; }
      if ( i >  1) {
         js =  js  +  ",";
      }
      if ((QB.func__Trim( QB.arrayValue(params, [ i]).value))  == "" ) {
         js =  js  +  " undefined";
      } else {
         js =  js  +  " "   +  (await func_ConvertExpression( QB.arrayValue(params, [ i]).value,   lineNumber));
      }
   }
   ConvertMethodParams =  js;
return ConvertMethodParams;
}
async function func_CallMethod(m/*METHOD*/) {
if (QB.halted()) { return; }
var CallMethod = null;
   var js = ''; // STRING
   if ( m.sync) {
      js = "await ";
   }
   js =  js  +   m.jsname;
   CallMethod =  js;
return CallMethod;
}
async function func_FindVariable(varname/*STRING*/,bvar/*VARIABLE*/,isArray/*INTEGER*/) {
if (QB.halted()) { return; }
var FindVariable = null;
   var found = 0; // INTEGER
   found =  False;
   var i = 0; // INTEGER
   var fvarname = ''; // STRING
   fvarname = (QB.func__Trim( (QB.func_UCase( (await func_RemoveSuffix(  varname))))));
   for ( i= 1;  i <= (QB.func_UBound(  localVars));  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.arrayValue(localVars, [ i]).value .isArray ==  isArray && (QB.func_UCase( QB.arrayValue(localVars, [ i]).value .name))  ==  fvarname) {
         found =  True;
         bvar.type = QB.arrayValue(localVars, [ i]).value .type;
         bvar.name = QB.arrayValue(localVars, [ i]).value .name;
         bvar.jsname = QB.arrayValue(localVars, [ i]).value .jsname;
         bvar.isConst = QB.arrayValue(localVars, [ i]).value .isConst;
         bvar.isArray = QB.arrayValue(localVars, [ i]).value .isArray;
         bvar.arraySize = QB.arrayValue(localVars, [ i]).value .arraySize;
         bvar.typeId = QB.arrayValue(localVars, [ i]).value .typeId;
         break;
      }
   }
   if (! found) {
      for ( i= 1;  i <= (QB.func_UBound(  globalVars));  i= i + 1) {  if (QB.halted()) { return; }
         if (QB.arrayValue(globalVars, [ i]).value .isArray ==  isArray && (QB.func_UCase( QB.arrayValue(globalVars, [ i]).value .name))  ==  fvarname) {
            found =  True;
            bvar.type = QB.arrayValue(globalVars, [ i]).value .type;
            bvar.name = QB.arrayValue(globalVars, [ i]).value .name;
            bvar.jsname = QB.arrayValue(globalVars, [ i]).value .jsname;
            bvar.isConst = QB.arrayValue(globalVars, [ i]).value .isConst;
            bvar.isArray = QB.arrayValue(globalVars, [ i]).value .isArray;
            bvar.arraySize = QB.arrayValue(globalVars, [ i]).value .arraySize;
            bvar.typeId = QB.arrayValue(globalVars, [ i]).value .typeId;
            break;
         }
      }
   }
   FindVariable =  found;
return FindVariable;
}
async function func_FindMethod(mname/*STRING*/,m/*METHOD*/,t/*STRING*/) {
if (QB.halted()) { return; }
var FindMethod = null;
   var found = 0; // INTEGER
   found =  False;
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  methods));  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.arrayValue(methods, [ i]).value .uname == (QB.func__Trim( (QB.func_UCase( (await func_RemoveSuffix(  mname))))))  && QB.arrayValue(methods, [ i]).value .type ==  t) {
         found =  True;
         m.line = QB.arrayValue(methods, [ i]).value .line;
         m.type = QB.arrayValue(methods, [ i]).value .type;
         m.returnType = QB.arrayValue(methods, [ i]).value .returnType;
         m.name = QB.arrayValue(methods, [ i]).value .name;
         m.jsname = QB.arrayValue(methods, [ i]).value .jsname;
         m.uname = QB.arrayValue(methods, [ i]).value .uname;
         m.argc = QB.arrayValue(methods, [ i]).value .argc;
         m.args = QB.arrayValue(methods, [ i]).value .args;
         m.sync = QB.arrayValue(methods, [ i]).value .sync;
         break;
      }
   }
   if (! found) {
      for ( i= 1;  i <= (QB.func_UBound(  exportMethods));  i= i + 1) {  if (QB.halted()) { return; }
         if (QB.arrayValue(exportMethods, [ i]).value .uname == (QB.func__Trim( (QB.func_UCase( (await func_RemoveSuffix(  mname))))))  && QB.arrayValue(exportMethods, [ i]).value .type ==  t) {
            found =  True;
            m.line = QB.arrayValue(exportMethods, [ i]).value .line;
            m.type = QB.arrayValue(exportMethods, [ i]).value .type;
            m.returnType = QB.arrayValue(exportMethods, [ i]).value .returnType;
            m.name = QB.arrayValue(exportMethods, [ i]).value .name;
            m.jsname = QB.arrayValue(exportMethods, [ i]).value .jsname;
            m.uname = QB.arrayValue(exportMethods, [ i]).value .uname;
            m.argc = QB.arrayValue(exportMethods, [ i]).value .argc;
            m.args = QB.arrayValue(exportMethods, [ i]).value .args;
            m.sync = QB.arrayValue(exportMethods, [ i]).value .sync;
            break;
         }
      }
   }
   FindMethod =  found;
return FindMethod;
}
async function sub_ConvertMethods() {
if (QB.halted()) { return; }
   await sub_AddJSLine(  0,  "");
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  methods));  i= i + 1) {  if (QB.halted()) { return; }
      if ((QB.arrayValue(methods, [ i]).value .line !=  0) ) {
         var lastLine = 0; // INTEGER
         lastLine = QB.arrayValue(methods, [ i  +   1]).value .line  -   1;
         if ( lastLine <  0) {
            lastLine = (QB.func_UBound(  lines));
         }
         QB.resizeArray(localVars, [{l:1,u:0}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
         var asyncModifier = ''; // STRING
         asyncModifier = "async ";
         var methodDec = ''; // STRING
         methodDec =  asyncModifier  +  "function "   +  QB.arrayValue(methods, [ i]).value .jsname  +  "(";
         if (QB.arrayValue(methods, [ i]).value .argc >  0) {
            var args = QB.initArray([{l:1,u:0}], ''); // STRING
            var c = 0; // INTEGER
            c = (await func_Split( QB.arrayValue(methods, [ i]).value .args,  ",",  args));
            var a = 0; // INTEGER
            for ( a= 1;  a <=  c;  a= a + 1) {  if (QB.halted()) { return; }
               var v = 0; // INTEGER
               var parts = QB.initArray([{l:1,u:0}], ''); // STRING
               v = (await func_Split( QB.arrayValue(args, [ a]).value,  ":",  parts));
               methodDec =  methodDec  +  QB.arrayValue(parts, [ 1]).value   +  "/*"   +  QB.arrayValue(parts, [ 2]).value   +  "*/";
               if ( a <  c) {
                  methodDec =  methodDec  +  ",";
               }
               var bvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
               bvar.name = QB.arrayValue(parts, [ 1]).value;
               bvar.type = QB.arrayValue(parts, [ 2]).value;
               bvar.typeId = (await func_FindTypeId(  bvar.type));
               if (QB.arrayValue(parts, [ 3]).value  == "true" ) {
                  bvar.isArray =  True;
               }
               bvar.jsname = "";
               await sub_AddVariable(  bvar,  localVars);
            }
         }
         methodDec =  methodDec  +  ") {";
         await sub_AddJSLine( QB.arrayValue(methods, [ i]).value .line,   methodDec);
         await sub_AddJSLine( QB.arrayValue(methods, [ i]).value .line,  "if (QB.halted()) { return; }");
         if (QB.arrayValue(methods, [ i]).value .type == "FUNCTION" ) {
            await sub_AddJSLine( QB.arrayValue(methods, [ i]).value .line,  "var "   +  (await func_RemoveSuffix( QB.arrayValue(methods, [ i]).value .name))   +  " = null;");
         }
         currentMethod = QB.arrayValue(methods, [ i]).value .name;
         await sub_ConvertLines( QB.arrayValue(methods, [ i]).value .line  +   1,   lastLine  -   1,  QB.arrayValue(methods, [ i]).value .name);
         if (QB.arrayValue(methods, [ i]).value .type == "FUNCTION" ) {
            await sub_AddJSLine(  lastLine,  "return "   +  (await func_RemoveSuffix( QB.arrayValue(methods, [ i]).value .name))   +  ";");
         }
         await sub_AddJSLine(  lastLine,  "}");
      }
   }
   for ( i= 1;  i <= (QB.func_UBound(  exportLines));  i= i + 1) {  if (QB.halted()) { return; }
      await sub_AddJSLine(  i,  QB.arrayValue(exportLines, [ i]).value);
   }
   QB.resizeArray(exportLines, [{l:1,u:0}], '', false); // STRING
}
async function sub_ReadLinesFromFile(filename/*STRING*/) {
if (QB.halted()) { return; }
   var fline = ''; // STRING
   var lineIndex = 0; // INTEGER
   var rawJS = 0; // SINGLE
   // Open filename For Input As #1
   while (!(( 1))) {  if (QB.halted()) { return; }
      var ___v7055475 = new Array( 2);
QB.sub_LineInput(___v7055475, false, false, undefined);
 fline = ___v7055475[ 1];

      lineIndex =  lineIndex  +   1;
      if ((QB.func__Trim(  fline))  != "" ) {
         while ((await func_EndsWith(  fline,  " _"))) {  if (QB.halted()) { return; }
            var nextLine = ''; // STRING
            var ___v5334240 = new Array( 2);
QB.sub_LineInput(___v5334240, false, false, undefined);
 nextLine = ___v5334240[ 1];

            fline = (QB.func_Left(  fline,  (QB.func_Len(  fline))   -   1))   +   nextLine;
         }
         rawJS = (await func_ReadLine(  lineIndex,   fline,   rawJS));
      }
   }
   // Close #1
}
async function sub_ReadLinesFromText(sourceText/*STRING*/) {
if (QB.halted()) { return; }
   var sourceLines = QB.initArray([{l:1,u:0}], ''); // STRING
   var rawJS = 0; // SINGLE
   var lcount = 0; // INTEGER
   var i = 0; // INTEGER
   lcount = (await func_Split(  sourceText,  await func_LF(),  sourceLines));
   for ( i= 1;  i <=  lcount;  i= i + 1) {  if (QB.halted()) { return; }
      var fline = ''; // STRING
      fline = QB.arrayValue(sourceLines, [ i]).value;
      if ((QB.func__Trim(  fline))  != "" ) {
         var lineIndex = 0; // INTEGER
         lineIndex =  i;
         if ((await func_StartsWith( (QB.func_UCase(  fline)),  "IMPORT")) ) {
            var parts = QB.initArray([{l:1,u:0}], ''); // STRING
            var pcount = 0; // INTEGER
            pcount = (await func_SLSplit(  fline,  parts,   False));
            if ( pcount ==  4) {
               var moduleName = ''; // STRING
               var sourceUrl = ''; // STRING
               var importRes = {ok:0,status:0,statusText:'',text:''}; // FETCHRESPONSE
               moduleName = QB.arrayValue(parts, [ 2]).value;
               sourceUrl = (QB.func_Mid( QB.arrayValue(parts, [ 4]).value,   2,  (QB.func_Len( QB.arrayValue(parts, [ 4]).value))   -   2));
               await QB.sub_Fetch(  sourceUrl,   importRes);
               modLevel =  modLevel  +   1;
               await sub_QBToJS(  importRes.text,   TEXT,   moduleName);
               await sub_ResetDataStructures();
               modLevel =  modLevel  -   1;
               continue;
            }
         }
         while ((await func_EndsWith(  fline,  "_"))) {  if (QB.halted()) { return; }
            i =  i  +   1;
            var nextLine = ''; // STRING
            nextLine = QB.arrayValue(sourceLines, [ i]).value;
            fline = (QB.func_Left(  fline,  (QB.func_Len(  fline))   -   1))   +   nextLine;
         }
         rawJS = (await func_ReadLine(  i,   fline,   rawJS));
      }
   }
}
async function func_ReadLine(lineIndex/*INTEGER*/,fline/*STRING*/,rawJS/*INTEGER*/) {
if (QB.halted()) { return; }
var ReadLine = null;
   var quoteDepth = 0; // INTEGER
   quoteDepth =  0;
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  fline));  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = (QB.func_Mid(  fline,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         if ( quoteDepth ==  0) {
            quoteDepth =  1;
         } else {
            quoteDepth =  0;
         }
      }
      if ( quoteDepth ==  0 &&  c == "'" ) {
         fline = (QB.func_Left(  fline,   i  -   1));
         break;
      }
   }
   ReadLine =  rawJS;
   if ((QB.func__Trim(  fline))  == "" ) {
      return ReadLine;
   }
   var word = ''; // STRING
   var words = QB.initArray([{l:1,u:0}], ''); // STRING
   var wcount = 0; // INTEGER
   wcount = (await func_SLSplit(  fline,  words,   False));
   if ( rawJS) {
      await sub_AddLine(  lineIndex,   fline);
      return ReadLine;
   }
   if ((QB.func_UCase( QB.arrayValue(words, [ 1]).value))  == "$IF"  &&  wcount >  1) {
      if ((QB.func_UCase( QB.arrayValue(words, [ 2]).value))  == "JAVASCRIPT" ) {
         rawJS =  True;
         await sub_AddLine(  lineIndex,   fline);
         ReadLine =  rawJS;
         return ReadLine;
      }
   }
   if ((QB.func_UCase( QB.arrayValue(words, [ 1]).value))  == "$END" ) {
      if ( rawJS) {
         rawJS = ! rawJS;
      }
      await sub_AddLine(  lineIndex,   fline);
      ReadLine =  rawJS;
      return ReadLine;
   }
   var index = 0; // INTEGER
   if ( wcount ==  1) {
      if ((await func_EndsWith( QB.arrayValue(words, [ 1]).value,  ":")) ) {
         index = (QB.func_UBound(  dataLabels))   +   1;
         QB.resizeArray(dataLabels, [{l:1,u:index}], {text:'',index:0}, true); // LABEL
         QB.arrayValue(dataLabels, [ index]).value .text = (QB.func_Left( (QB.func_UCase( QB.arrayValue(words, [ 1]).value)),  (QB.func_Len( QB.arrayValue(words, [ 1]).value))   -   1));
         QB.arrayValue(dataLabels, [ index]).value .index = (QB.func_UBound(  dataArray));
         return ReadLine;
      }
   }
   if ((QB.func_UCase( QB.arrayValue(words, [ 1]).value))  == "DATA" ) {
      var dstr = ''; // STRING
      dstr = (await func_Join( words,   2,    -  1,  " "));
      var dcount = 0; // INTEGER
      var de = QB.initArray([{l:1,u:0}], ''); // STRING
      dcount = (await func_ListSplit(  dstr,  de));
      for ( i= 1;  i <=  dcount;  i= i + 1) {  if (QB.halted()) { return; }
         index = (QB.func_UBound(  dataArray))   +   1;
         QB.resizeArray(dataArray, [{l:1,u:index}], '', true); // STRING
         QB.arrayValue(dataArray, [ index]).value = QB.arrayValue(de, [ i]).value;
      }
      return ReadLine;
   }
   var ifIdx = 0; // INTEGER
var thenIdx = 0; // INTEGER
var elseIdx = 0; // INTEGER
   for ( i= 1;  i <=  wcount;  i= i + 1) {  if (QB.halted()) { return; }
      word = (QB.func_UCase( QB.arrayValue(words, [ i]).value));
      if ( word == "IF" ) {
         ifIdx =  i;
      } else if ( word == "THEN" ) {
         thenIdx =  i;
      } else if ( word == "ELSE" ) {
         elseIdx =  i;
      }
   }
   if ( thenIdx >  0 &&  thenIdx <  wcount) {
      await sub_AddLine(  lineIndex,  (await func_Join( words,   1,   thenIdx,  " ")));
      if ( elseIdx >  0) {
         await sub_AddSubLines(  lineIndex,  (await func_Join( words,   thenIdx  +   1,   elseIdx  -   1,  " ")));
         await sub_AddLine(  lineIndex,  "Else");
         await sub_AddSubLines(  lineIndex,  (await func_Join( words,   elseIdx  +   1,    -  1,  " ")));
      } else {
         await sub_AddSubLines(  lineIndex,  (await func_Join( words,   thenIdx  +   1,    -  1,  " ")));
      }
      await sub_AddLine(  lineIndex,  "End If");
   } else {
      await sub_AddSubLines(  lineIndex,   fline);
   }
return ReadLine;
}
async function sub_AddSubLines(lineIndex/*INTEGER*/,fline/*STRING*/) {
if (QB.halted()) { return; }
   var quoteDepth = 0; // INTEGER
   quoteDepth =  0;
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  fline));  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = (QB.func_Mid(  fline,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         if ( quoteDepth ==  0) {
            quoteDepth =  1;
         } else {
            quoteDepth =  0;
         }
      }
      if ( quoteDepth ==  0 &&  c == ":" ) {
         await sub_AddLine(  lineIndex,  (QB.func_Left(  fline,   i  -   1)));
         fline = (QB.func_Right(  fline,  (QB.func_Len(  fline))   -   i));
         i =  0;
      }
   }
   await sub_AddLine(  lineIndex,   fline);
}
async function sub_FindMethods() {
if (QB.halted()) { return; }
   var i = 0; // INTEGER
   var pcount = 0; // INTEGER
   var rawJS = 0; // INTEGER
   var parts = QB.initArray([{l:1,u:0}], ''); // STRING
   for ( i= 1;  i <= (QB.func_UBound(  lines));  i= i + 1) {  if (QB.halted()) { return; }
      pcount = (await func_Split( QB.arrayValue(lines, [ i]).value .text,  " ",  parts));
      var word = ''; // STRING
      word = (QB.func_UCase( QB.arrayValue(parts, [ 1]).value));
      if ( word == "$IF"  &&  pcount >  1) {
         if ((QB.func_UCase( QB.arrayValue(parts, [ 2]).value))  == "JAVASCRIPT" ) {
            rawJS =  True;
         }
      }
      if ( word == "$END"  &&  rawJS) {
         rawJS =  False;
      }
      if ( rawJS) {
         continue;
      }
      if ( word == "FUNCTION"  ||  word == "SUB" ) {
         var mstr = ''; // STRING
         var argstr = ''; // STRING
         var pstart = 0; // INTEGER
         var mname = ''; // STRING
         var pend = 0; // SINGLE
         mstr = (await func_Join( parts,   2,    -  1,  " "));
         pstart = (QB.func_InStr(  mstr,  "("));
         if ( pstart ==  0) {
            argstr = "";
            mname =  mstr;
         } else {
            mname = (QB.func__Trim( (QB.func_Left(  mstr,   pstart  -   1))));
            mstr = (QB.func_Mid(  mstr,   pstart  +   1));
            pend = (QB.func__InStrRev(  mstr,  ")"));
            argstr = (QB.func_Left(  mstr,   pend  -   1));
         }
         var arga = QB.initArray([{l:1,u:0}], ''); // STRING
         var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
         m.line =  i;
         m.type =  word;
         m.name =  mname;
         m.argc = (await func_ListSplit(  argstr,  arga));
         m.args = "";
         var args = QB.initArray([{l:1,u:0}], {name:'',type:''}); // ARGUMENT
         if ((QB.func_UBound(  arga))  >  0) {
            var a = 0; // INTEGER
            var args = ''; // STRING
            args = "";
            for ( a= 1;  a <=  m.argc;  a= a + 1) {  if (QB.halted()) { return; }
               var aparts = QB.initArray([{l:1,u:0}], ''); // STRING
               var apcount = 0; // INTEGER
               var argname = ''; // STRING
               var isArray = ''; // STRING
               isArray = "false";
               apcount = (await func_Split( QB.arrayValue(arga, [ a]).value,  " ",  aparts));
               argname = QB.arrayValue(aparts, [ 1]).value;
               if ((await func_EndsWith(  argname,  "()")) ) {
                  isArray = "true";
                  argname = (QB.func_Left(  argname,  (QB.func_Len(  argname))   -   2));
               }
               if ( apcount ==  3) {
                  args =  args  +   argname  +  ":"   +  (QB.func_UCase( QB.arrayValue(aparts, [ 3]).value))   +  ":"   +   isArray;
               } else {
                  args =  args  +   argname  +  ":"   +  (await func_DataTypeFromName( QB.arrayValue(aparts, [ 1]).value))   +  ":"   +   isArray;
               }
               if ( a !=  m.argc) {
                  args =  args  +  ",";
               }
            }
            m.args =  args;
         }
         await sub_AddMethod(  m,  "",   True);
      }
   }
}
async function func_Split(sourceString/*STRING*/,delimiter/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var Split = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr =  sourceString;
   if ( delimiter == " " ) {
      cstr = (QB.func_RTrim( (QB.func_LTrim(  cstr))));
      p = (QB.func_InStr(  cstr,  "  "));
      while ( p >  0) {  if (QB.halted()) { return; }
         cstr = (QB.func_Mid(  cstr,   1,   p  -   1))   +  (QB.func_Mid(  cstr,   p  +   1));
         p = (QB.func_InStr(  cstr,  "  "));
      }
   }
   curpos =  1;
   arrpos =  0;
   dpos = (QB.func_InStr(  curpos,   cstr,   delimiter));
   while (!( dpos ==  0)) {  if (QB.halted()) { return; }
      arrpos =  arrpos  +   1;
      QB.resizeArray(results, [{l:1,u:arrpos}], '', true); // STRING
      QB.arrayValue(results, [ arrpos]).value = (QB.func_Mid(  cstr,   curpos,   dpos  -   curpos));
      curpos =  dpos  +  (QB.func_Len(  delimiter));
      dpos = (QB.func_InStr(  curpos,   cstr,   delimiter));
   }
   arrpos =  arrpos  +   1;
   QB.resizeArray(results, [{l:1,u:arrpos}], '', true); // STRING
   QB.arrayValue(results, [ arrpos]).value = (QB.func_Mid(  cstr,   curpos));
   Split =  arrpos;
return Split;
}
async function func_SLSplit(sourceString/*STRING*/,results/*STRING*/,escapeStrings/*INTEGER*/) {
if (QB.halted()) { return; }
var SLSplit = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = (QB.func__Trim(  sourceString));
   QB.resizeArray(results, [{l:1,u:0}], '', false); // STRING
   var lastChar = ''; // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var count = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  cstr));  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = (QB.func_Mid(  cstr,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         quoteMode = ! quoteMode;
         result =  result  +   c;
         if (! quoteMode &&  escapeStrings) {
            result = (await func_Replace(  result,  "\\",  "\\\\"));
         }
      } else if ( c == " " ) {
         if ( quoteMode) {
            result =  result  +   c;
         } else if ( lastChar == " " ) {
         } else {
            count = (QB.func_UBound(  results))   +   1;
            QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
            QB.arrayValue(results, [ count]).value =  result;
            result = "";
         }
      } else {
         result =  result  +   c;
      }
      lastChar =  c;
   }
   if ( result != "" ) {
      count = (QB.func_UBound(  results))   +   1;
      QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   SLSplit = (QB.func_UBound(  results));
return SLSplit;
}
async function func_SLSplit2(sourceString/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var SLSplit2 = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = (QB.func__Trim(  sourceString));
   QB.resizeArray(results, [{l:1,u:0}], '', false); // STRING
   var lastChar = ''; // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var paren = 0; // INTEGER
   var count = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  cstr));  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = (QB.func_Mid(  cstr,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         quoteMode = ! quoteMode;
         result =  result  +   c;
      } else if ( quoteMode) {
         result =  result  +   c;
      } else if ( c == "(" ) {
         paren =  paren  +   1;
         result =  result  +   c;
      } else if ( c == ")" ) {
         paren =  paren  -   1;
         result =  result  +   c;
      } else if ( paren >  0) {
         result =  result  +   c;
      } else if ( c == " " ) {
         if ( lastChar == " " ) {
         } else {
            count = (QB.func_UBound(  results))   +   1;
            QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
            QB.arrayValue(results, [ count]).value =  result;
            result = "";
         }
      } else {
         result =  result  +   c;
      }
      lastChar =  c;
   }
   if ( result != "" ) {
      count = (QB.func_UBound(  results))   +   1;
      QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   SLSplit2 = (QB.func_UBound(  results));
return SLSplit2;
}
async function func_ListSplit(sourceString/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var ListSplit = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = (QB.func__Trim(  sourceString));
   QB.resizeArray(results, [{l:1,u:0}], '', false); // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var count = 0; // INTEGER
   var paren = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  cstr));  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = (QB.func_Mid(  cstr,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         quoteMode = ! quoteMode;
         result =  result  +   c;
      } else if ( quoteMode) {
         result =  result  +   c;
      } else if ( c == "(" ) {
         paren =  paren  +   1;
         result =  result  +   c;
      } else if ( c == ")" ) {
         paren =  paren  -   1;
         result =  result  +   c;
      } else if ( paren >  0) {
         result =  result  +   c;
      } else if ( c == "," ) {
         count = (QB.func_UBound(  results))   +   1;
         QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
         QB.arrayValue(results, [ count]).value =  result;
         result = "";
      } else {
         result =  result  +   c;
      }
   }
   if ( result != "" ) {
      count = (QB.func_UBound(  results))   +   1;
      QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   ListSplit = (QB.func_UBound(  results));
return ListSplit;
}
async function func_PrintSplit(sourceString/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var PrintSplit = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = (QB.func__Trim(  sourceString));
   QB.resizeArray(results, [{l:1,u:0}], '', false); // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var count = 0; // INTEGER
   var paren = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  cstr));  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = (QB.func_Mid(  cstr,   i,   1));
      if ( c == (QB.func_Chr(  34)) ) {
         quoteMode = ! quoteMode;
         result =  result  +   c;
      } else if ( quoteMode) {
         result =  result  +   c;
      } else if ( c == "(" ) {
         paren =  paren  +   1;
         result =  result  +   c;
      } else if ( c == ")" ) {
         paren =  paren  -   1;
         result =  result  +   c;
      } else if ( paren >  0) {
         result =  result  +   c;
      } else if ( c == ","  ||  c == ";" ) {
         if ( result != "" ) {
            count = (QB.func_UBound(  results))   +   1;
            QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
            QB.arrayValue(results, [ count]).value =  result;
            result = "";
         }
         count = (QB.func_UBound(  results))   +   1;
         QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
         QB.arrayValue(results, [ count]).value =  c;
      } else {
         result =  result  +   c;
      }
   }
   if ( result != "" ) {
      count = (QB.func_UBound(  results))   +   1;
      QB.resizeArray(results, [{l:1,u:count}], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   PrintSplit = (QB.func_UBound(  results));
return PrintSplit;
}
async function sub_PrintMethods() {
if (QB.halted()) { return; }
   await QB.sub_Print([""]);
   await QB.sub_Print(["Methods"]);
   await QB.sub_Print(["------------------------------------------------------------"]);
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  methods));  i= i + 1) {  if (QB.halted()) { return; }
      var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
      m = QB.arrayValue(methods, [ i]).value;
      await QB.sub_Print([(QB.func_Str(  m.line))   +  ": "   +   m.type  +  " - "   +   m.name  +  " ["   +   m.jsname  +  "] - "   +   m.returnType  +  " - "   +   m.args]);
   }
}
async function sub_PrintTypes() {
if (QB.halted()) { return; }
   await QB.sub_Print([""]);
   await QB.sub_Print(["Types"]);
   await QB.sub_Print(["------------------------------------------------------------"]);
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  types));  i= i + 1) {  if (QB.halted()) { return; }
      var t = {line:0,name:'',argc:0,args:''}; // QBTYPE
      t = QB.arrayValue(types, [ i]).value;
      await QB.sub_Print([(QB.func_Str(  t.line))   +  ": "   +   t.name]);
      var v = 0; // INTEGER
      for ( v= 1;  v <= (QB.func_UBound(  typeVars));  v= v + 1) {  if (QB.halted()) { return; }
         if (QB.arrayValue(typeVars, [ i]).value .typeId ==  i) {
            await QB.sub_Print(["  -> "   +  QB.arrayValue(typeVars, [ v]).value .name  +  ": "   +  QB.arrayValue(typeVars, [ v]).value .type]);
         }
      }
   }
}
async function func_CopyMethod(fromMethod/*METHOD*/,toMethod/*METHOD*/) {
if (QB.halted()) { return; }
var CopyMethod = null;
   toMethod.type =  fromMethod.type;
   toMethod.name =  fromMethod.name;
return CopyMethod;
}
async function sub_AddMethod(m/*METHOD*/,prefix/*STRING*/,sync/*INTEGER*/) {
if (QB.halted()) { return; }
   var mcount = 0; // SINGLE
   mcount = (QB.func_UBound(  methods))   +   1;
   QB.resizeArray(methods, [{l:1,u:mcount}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}, true); // METHOD
   if ( m.type == "FUNCTION" ) {
      m.returnType = (await func_DataTypeFromName(  m.name));
   }
   m.uname = (QB.func_UCase( (await func_RemoveSuffix(  m.name))));
   m.jsname = (await func_MethodJS(  m,   prefix));
   m.sync =  sync;
   QB.arrayValue(methods, [ mcount]).value =  m;
}
async function sub_AddExportMethod(m/*METHOD*/,prefix/*STRING*/,sync/*INTEGER*/) {
if (QB.halted()) { return; }
   var mcount = 0; // SINGLE
   mcount = (QB.func_UBound(  exportMethods))   +   1;
   QB.resizeArray(exportMethods, [{l:1,u:mcount}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}, true); // METHOD
   if ( m.type == "FUNCTION" ) {
      m.returnType = (await func_DataTypeFromName(  m.name));
   }
   m.uname = (QB.func_UCase( (await func_RemoveSuffix(  m.name))));
   m.jsname = (await func_MethodJS(  m,   prefix));
   m.uname = (QB.func_UCase(  prefix))   +   m.uname;
   m.name =  prefix  +   m.name;
   m.sync =  sync;
   QB.arrayValue(exportMethods, [ mcount]).value =  m;
}
async function sub_AddExportConst(vname/*STRING*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type = "CONST";
   v.name =  vname;
   v.isConst =  True;
   await sub_AddVariable(  v,  exportConsts);
}
async function sub_AddGXMethod(mtype/*STRING*/,mname/*STRING*/,sync/*INTEGER*/) {
if (QB.halted()) { return; }
   var mcount = 0; // SINGLE
   mcount = (QB.func_UBound(  methods))   +   1;
   QB.resizeArray(methods, [{l:1,u:mcount}], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}, true); // METHOD
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
   m.type =  mtype;
   m.name =  mname;
   m.uname = (QB.func_UCase(  m.name));
   m.sync =  sync;
   m.jsname = (await func_GXMethodJS( (await func_RemoveSuffix(  mname))));
   if ( mtype == "FUNCTION" ) {
      m.returnType = (await func_DataTypeFromName(  mname));
   }
   QB.arrayValue(methods, [ mcount]).value =  m;
}
async function sub_AddQBMethod(mtype/*STRING*/,mname/*STRING*/,sync/*INTEGER*/) {
if (QB.halted()) { return; }
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:'',sync:0}; // METHOD
   m.type =  mtype;
   m.name =  mname;
   await sub_AddMethod(  m,  "QB.",   sync);
}
async function sub_AddLine(lineIndex/*INTEGER*/,fline/*STRING*/) {
if (QB.halted()) { return; }
   await sub___AddLine(  lineIndex,   fline);
}
async function sub___AddLine(lineIndex/*INTEGER*/,fline/*STRING*/) {
if (QB.halted()) { return; }
   var lcount = 0; // INTEGER
   lcount = (QB.func_UBound(  lines))   +   1;
   QB.resizeArray(lines, [{l:1,u:lcount}], {line:0,text:''}, true); // CODELINE
   QB.arrayValue(lines, [ lcount]).value .line =  lineIndex;
   QB.arrayValue(lines, [ lcount]).value .text =  fline;
}
async function sub_AddJSLine(sourceLine/*INTEGER*/,jsline/*STRING*/) {
if (QB.halted()) { return; }
   var lcount = 0; // INTEGER
   lcount = (QB.func_UBound(  jsLines))   +   1;
   QB.resizeArray(jsLines, [{l:1,u:lcount}], {line:0,text:''}, true); // CODELINE
   QB.arrayValue(jsLines, [ lcount]).value .line =  sourceLine;
   QB.arrayValue(jsLines, [ lcount]).value .text =  jsline;
}
async function sub_AddWarning(sourceLine/*INTEGER*/,msgText/*STRING*/) {
if (QB.halted()) { return; }
   var lcount = 0; // INTEGER
   lcount = (QB.func_UBound(  warnings))   +   1;
   QB.resizeArray(warnings, [{l:1,u:lcount}], {line:0,text:''}, true); // CODELINE
   var l = 0; // INTEGER
   if (( sourceLine >  0) ) {
      l = QB.arrayValue(lines, [ sourceLine]).value .line;
   }
   QB.arrayValue(warnings, [ lcount]).value .line =  l;
   QB.arrayValue(warnings, [ lcount]).value .text =  msgText;
}
async function sub_AddConst(vname/*STRING*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type = "CONST";
   v.name =  vname;
   v.isConst =  True;
   await sub_AddVariable(  v,  globalVars);
}
async function sub_AddGXConst(vname/*STRING*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type = "CONST";
   v.name =  vname;
   if ( vname == "GX_TRUE" ) {
      v.jsname = "true";
   } else if ( vname == "GX_FALSE" ) {
      v.jsname = "false";
   } else {
      var jsname = ''; // STRING
      jsname = (QB.func_Mid(  vname,   3,  (QB.func_Len(  vname))   -   2));
      if ((QB.func_Left(  jsname,   1))  == "_" ) {
         jsname = (QB.func_Right(  jsname,  (QB.func_Len(  jsname))   -   1));
      }
      v.jsname = "GX."   +   jsname;
   }
   v.isConst =  True;
   await sub_AddVariable(  v,  globalVars);
}
async function sub_AddQBConst(vname/*STRING*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type = "CONST";
   v.name =  vname;
   v.jsname = "QB."   +   vname;
   v.isConst =  True;
   await sub_AddVariable(  v,  globalVars);
}
async function sub_AddGlobal(vname/*STRING*/,vtype/*STRING*/,arraySize/*INTEGER*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type =  vtype;
   v.name =  vname;
   v.isArray =  arraySize >   -  1;
   v.arraySize =  arraySize;
   await sub_AddVariable(  v,  globalVars);
}
async function sub_AddLocal(vname/*STRING*/,vtype/*STRING*/,arraySize/*INTEGER*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type =  vtype;
   v.name =  vname;
   v.isArray =  arraySize >   -  1;
   v.arraySize =  arraySize;
   await sub_AddVariable(  v,  localVars);
}
async function sub_AddVariable(bvar/*VARIABLE*/,vlist/*VARIABLE*/) {
if (QB.halted()) { return; }
   var vcount = 0; // SINGLE
   vcount = (QB.func_UBound(  vlist))   +   1;
   QB.resizeArray(vlist, [{l:1,u:vcount}], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, true); // VARIABLE
   var nvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   nvar.type =  bvar.type;
   nvar.name =  bvar.name;
   nvar.jsname =  bvar.jsname;
   nvar.isConst =  bvar.isConst;
   nvar.isArray =  bvar.isArray;
   nvar.arraySize =  bvar.arraySize;
   nvar.typeId =  bvar.typeId;
   if ( nvar.jsname == "" ) {
      nvar.jsname = (await func_RemoveSuffix(  nvar.name));
   }
   QB.arrayValue(vlist, [ vcount]).value =  nvar;
}
async function sub_AddType(t/*QBTYPE*/) {
if (QB.halted()) { return; }
   var tcount = 0; // SINGLE
   tcount = (QB.func_UBound(  types))   +   1;
   QB.resizeArray(types, [{l:1,u:tcount}], {line:0,name:'',argc:0,args:''}, true); // QBTYPE
   QB.arrayValue(types, [ tcount]).value =  t;
}
async function sub_AddSystemType(tname/*STRING*/,args/*STRING*/) {
if (QB.halted()) { return; }
   var t = {line:0,name:'',argc:0,args:''}; // QBTYPE
   t.name =  tname;
   await sub_AddType(  t);
   var typeId = 0; // INTEGER
   typeId = (QB.func_UBound(  types));
   var count = 0; // INTEGER
   var pairs = QB.initArray([{l:1,u:0}], ''); // STRING
   count = (await func_Split(  args,  ",",  pairs));
   var i = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_UBound(  pairs));  i= i + 1) {  if (QB.halted()) { return; }
      var nv = QB.initArray([{l:1,u:0}], ''); // STRING
      count = (await func_Split( QB.arrayValue(pairs, [ i]).value,  ":",  nv));
      var tvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
      tvar.typeId =  typeId;
      tvar.name = QB.arrayValue(nv, [ 1]).value;
      tvar.type = (QB.func_UCase( QB.arrayValue(nv, [ 2]).value));
      await sub_AddVariable(  tvar,  typeVars);
   }
}
async function func_MainEnd() {
if (QB.halted()) { return; }
var MainEnd = null;
   if ( programMethods ==  0) {
      MainEnd = (QB.func_UBound(  lines));
   } else {
      MainEnd = QB.arrayValue(methods, [ 1]).value .line  -   1;
   }
return MainEnd;
}
async function func_RemoveSuffix(vname/*STRING*/) {
if (QB.halted()) { return; }
var RemoveSuffix = null;
   var i = 0; // INTEGER
   var done = 0; // INTEGER
   var c = ''; // STRING
   vname = (QB.func__Trim(  vname));
   i = (QB.func_Len(  vname));
   while (! done) {  if (QB.halted()) { return; }
      c = (QB.func_Mid(  vname,   i,   1));
      if ( c == "`"  ||  c == "%"  ||  c == "&"  ||  c == "$"  ||  c == "~"  ||  c == "!" ) {
         i =  i  -   1;
      } else {
         done =  True;
      }
   }
   RemoveSuffix = (QB.func_Left(  vname,   i));
return RemoveSuffix;
}
async function func_DataTypeFromName(vname/*STRING*/) {
if (QB.halted()) { return; }
var DataTypeFromName = null;
   var dt = ''; // STRING
   if ((await func_EndsWith(  vname,  "$")) ) {
      dt = "STRING";
   } else if ((await func_EndsWith(  vname,  "`")) ) {
      dt = "_BIT";
   } else if ((await func_EndsWith(  vname,  "%%")) ) {
      dt = "_BYTE";
   } else if ((await func_EndsWith(  vname,  "~%")) ) {
      dt = "_UNSIGNED INTEGER";
   } else if ((await func_EndsWith(  vname,  "%")) ) {
      dt = "INTEGER";
   } else if ((await func_EndsWith(  vname,  "~&&")) ) {
      dt = "_UNSIGNED INTEGER64";
   } else if ((await func_EndsWith(  vname,  "&&")) ) {
      dt = "_INTEGER64";
   } else if ((await func_EndsWith(  vname,  "~&")) ) {
      dt = "_UNSIGNED LONG";
   } else if ((await func_EndsWith(  vname,  "##")) ) {
      dt = "_FLOAT";
   } else if ((await func_EndsWith(  vname,  "#")) ) {
      dt = "DOUBLE";
   } else if ((await func_EndsWith(  vname,  "~%&")) ) {
      dt = "_UNSIGNED _OFFSET";
   } else if ((await func_EndsWith(  vname,  "%&")) ) {
      dt = "_OFFSET";
   } else if ((await func_EndsWith(  vname,  "&")) ) {
      dt = "LONG";
   } else if ((await func_EndsWith(  vname,  "!")) ) {
      dt = "SINGLE";
   } else {
      dt = "SINGLE";
   }
   DataTypeFromName =  dt;
return DataTypeFromName;
}
async function func_EndsWith(s/*STRING*/,finds/*STRING*/) {
if (QB.halted()) { return; }
var EndsWith = null;
   if ((QB.func_Len(  finds))  > (QB.func_Len(  s)) ) {
      EndsWith =  False;
      return EndsWith;
   }
   if ((QB.func__InStrRev(  s,   finds))  == (QB.func_Len(  s))   -  ((QB.func_Len(  finds))   -   1) ) {
      EndsWith =  True;
   } else {
      EndsWith =  False;
   }
return EndsWith;
}
async function func_StartsWith(s/*STRING*/,finds/*STRING*/) {
if (QB.halted()) { return; }
var StartsWith = null;
   if ((QB.func_Len(  finds))  > (QB.func_Len(  s)) ) {
      StartsWith =  False;
      return StartsWith;
   }
   if ((QB.func_InStr(  s,   finds))  ==  1) {
      StartsWith =  True;
   } else {
      StartsWith =  False;
   }
return StartsWith;
}
async function func_Join(parts/*STRING*/,startIndex/*INTEGER*/,endIndex/*INTEGER*/,delimiter/*STRING*/) {
if (QB.halted()) { return; }
var Join = null;
   if ( endIndex ==   -  1) {
      endIndex = (QB.func_UBound(  parts));
   }
   var s = ''; // STRING
   var i = 0; // INTEGER
   for ( i= startIndex;  i <=  endIndex;  i= i + 1) {  if (QB.halted()) { return; }
      s =  s  +  QB.arrayValue(parts, [ i]).value;
      if ( i != (QB.func_UBound(  parts)) ) {
         s =  s  +   delimiter;
      }
   }
   Join =  s;
return Join;
}
async function func_LPad(s/*STRING*/,padChar/*STRING*/,swidth/*INTEGER*/) {
if (QB.halted()) { return; }
var LPad = null;
   var padding = ''; // STRING
   padding = (QB.func_String(  swidth  -  (QB.func_Len(  s)),   padChar));
   LPad =  padding  +   s;
return LPad;
}
async function func_Replace(s/*STRING*/,searchString/*STRING*/,newString/*STRING*/) {
if (QB.halted()) { return; }
var Replace = null;
   var ns = ''; // STRING
   var i = 0; // INTEGER
   var slen = 0; // INTEGER
   slen = (QB.func_Len(  searchString));
   for ( i= 1;  i <= (QB.func_Len(  s));  i= i + 1) {  if (QB.halted()) { return; }
      if ((QB.func_Mid(  s,   i,   slen))  ==  searchString) {
         ns =  ns  +   newString;
         i =  i  +   slen  -   1;
      } else {
         ns =  ns  +  (QB.func_Mid(  s,   i,   1));
      }
   }
   Replace =  ns;
return Replace;
}
async function func_LF() {
if (QB.halted()) { return; }
var LF = null;
   LF = (QB.func_Chr(  10));
return LF;
}
async function func_CR() {
if (QB.halted()) { return; }
var CR = null;
   CR = (QB.func_Chr(  13));
return CR;
}
async function func_CRLF() {
if (QB.halted()) { return; }
var CRLF = null;
   CRLF = await func_CR()  +  await func_LF();
return CRLF;
}
async function func_MethodJS(m/*METHOD*/,prefix/*STRING*/) {
if (QB.halted()) { return; }
var MethodJS = null;
   var jsname = ''; // STRING
   jsname =  prefix;
   if ( m.type == "FUNCTION" ) {
      jsname =  jsname  +  "func_";
   } else {
      jsname =  jsname  +  "sub_";
   }
   var i = 0; // INTEGER
   var c = ''; // STRING
   var a = 0; // INTEGER
   for ( i= 1;  i <= (QB.func_Len(  m.name));  i= i + 1) {  if (QB.halted()) { return; }
      c = (QB.func_Mid(  m.name,   i,   1));
      a = (QB.func_Asc(  c));
      if (( a >=  65 &&  a <=  90)  || ( a >=  97 &&  a <=  122)  || ( a >=  48 &&  a <=  57)  ||  a ==  95 ||  a ==  46) {
         jsname =  jsname  +   c;
      }
   }
   MethodJS =  jsname;
return MethodJS;
}
async function func_GXMethodJS(mname/*STRING*/) {
if (QB.halted()) { return; }
var GXMethodJS = null;
   var jsname = ''; // STRING
   var startIdx = 0; // INTEGER
   if ((QB.func_InStr(  mname,  "GXSTR"))  ==  1) {
      jsname = "GXSTR.";
      startIdx =  7;
   } else {
      jsname = "GX.";
      startIdx =  3;
   }
   jsname =  jsname  +  (QB.func_LCase( (QB.func_Mid(  mname,   startIdx,   1))));
   var i = 0; // INTEGER
   var c = ''; // STRING
   var a = 0; // INTEGER
   for ( i= startIdx  +   1;  i <= (QB.func_Len(  mname));  i= i + 1) {  if (QB.halted()) { return; }
      c = (QB.func_Mid(  mname,   i,   1));
      a = (QB.func_Asc(  c));
      if (( a >=  65 &&  a <=  90)  || ( a >=  97 &&  a <=  122)  || ( a >=  48 &&  a <=  57)  ||  a ==  95 ||  a ==  46) {
         jsname =  jsname  +   c;
      }
   }
   if ( mname == "GXMapLoad"  ||  mname == "GXSceneStart" ) {
      jsname = "await "   +   jsname;
   }
   GXMethodJS =  jsname;
return GXMethodJS;
}
async function sub_InitGX() {
if (QB.halted()) { return; }
   await sub_AddSystemType( "GXPOSITION",  "x:LONG,y:LONG");
   await sub_AddSystemType( "GXDEVICEINPUT",  "deviceId:INTEGER,deviceType:INTEGER,inputType:INTEGER,inputId:INTEGER,inputValue:INTEGER");
   await sub_AddGXConst( "GX_FALSE");
   await sub_AddGXConst( "GX_TRUE");
   await sub_AddGXConst( "GXEVENT_INIT");
   await sub_AddGXConst( "GXEVENT_UPDATE");
   await sub_AddGXConst( "GXEVENT_DRAWBG");
   await sub_AddGXConst( "GXEVENT_DRAWMAP");
   await sub_AddGXConst( "GXEVENT_DRAWSCREEN");
   await sub_AddGXConst( "GXEVENT_MOUSEINPUT");
   await sub_AddGXConst( "GXEVENT_PAINTBEFORE");
   await sub_AddGXConst( "GXEVENT_PAINTAFTER");
   await sub_AddGXConst( "GXEVENT_COLLISION_TILE");
   await sub_AddGXConst( "GXEVENT_COLLISION_ENTITY");
   await sub_AddGXConst( "GXEVENT_PLAYER_ACTION");
   await sub_AddGXConst( "GXEVENT_ANIMATE_COMPLETE");
   await sub_AddGXConst( "GXANIMATE_LOOP");
   await sub_AddGXConst( "GXANIMATE_SINGLE");
   await sub_AddGXConst( "GXBG_STRETCH");
   await sub_AddGXConst( "GXBG_SCROLL");
   await sub_AddGXConst( "GXBG_WRAP");
   await sub_AddGXConst( "GXKEY_ESC");
   await sub_AddGXConst( "GXKEY_1");
   await sub_AddGXConst( "GXKEY_2");
   await sub_AddGXConst( "GXKEY_3");
   await sub_AddGXConst( "GXKEY_4");
   await sub_AddGXConst( "GXKEY_5");
   await sub_AddGXConst( "GXKEY_6");
   await sub_AddGXConst( "GXKEY_7");
   await sub_AddGXConst( "GXKEY_8");
   await sub_AddGXConst( "GXKEY_9");
   await sub_AddGXConst( "GXKEY_0");
   await sub_AddGXConst( "GXKEY_DASH");
   await sub_AddGXConst( "GXKEY_EQUALS");
   await sub_AddGXConst( "GXKEY_BACKSPACE");
   await sub_AddGXConst( "GXKEY_TAB");
   await sub_AddGXConst( "GXKEY_Q");
   await sub_AddGXConst( "GXKEY_W");
   await sub_AddGXConst( "GXKEY_E");
   await sub_AddGXConst( "GXKEY_R");
   await sub_AddGXConst( "GXKEY_T");
   await sub_AddGXConst( "GXKEY_Y");
   await sub_AddGXConst( "GXKEY_U");
   await sub_AddGXConst( "GXKEY_I");
   await sub_AddGXConst( "GXKEY_O");
   await sub_AddGXConst( "GXKEY_P");
   await sub_AddGXConst( "GXKEY_LBRACKET");
   await sub_AddGXConst( "GXKEY_RBRACKET");
   await sub_AddGXConst( "GXKEY_ENTER");
   await sub_AddGXConst( "GXKEY_LCTRL");
   await sub_AddGXConst( "GXKEY_A");
   await sub_AddGXConst( "GXKEY_S");
   await sub_AddGXConst( "GXKEY_D");
   await sub_AddGXConst( "GXKEY_F");
   await sub_AddGXConst( "GXKEY_G");
   await sub_AddGXConst( "GXKEY_H");
   await sub_AddGXConst( "GXKEY_J");
   await sub_AddGXConst( "GXKEY_K");
   await sub_AddGXConst( "GXKEY_L");
   await sub_AddGXConst( "GXKEY_SEMICOLON");
   await sub_AddGXConst( "GXKEY_QUOTE");
   await sub_AddGXConst( "GXKEY_BACKQUOTE");
   await sub_AddGXConst( "GXKEY_LSHIFT");
   await sub_AddGXConst( "GXKEY_BACKSLASH");
   await sub_AddGXConst( "GXKEY_Z");
   await sub_AddGXConst( "GXKEY_X");
   await sub_AddGXConst( "GXKEY_C");
   await sub_AddGXConst( "GXKEY_V");
   await sub_AddGXConst( "GXKEY_B");
   await sub_AddGXConst( "GXKEY_N");
   await sub_AddGXConst( "GXKEY_M");
   await sub_AddGXConst( "GXKEY_COMMA");
   await sub_AddGXConst( "GXKEY_PERIOD");
   await sub_AddGXConst( "GXKEY_SLASH");
   await sub_AddGXConst( "GXKEY_RSHIFT");
   await sub_AddGXConst( "GXKEY_NUMPAD_MULTIPLY");
   await sub_AddGXConst( "GXKEY_SPACEBAR");
   await sub_AddGXConst( "GXKEY_CAPSLOCK");
   await sub_AddGXConst( "GXKEY_F1");
   await sub_AddGXConst( "GXKEY_F2");
   await sub_AddGXConst( "GXKEY_F3");
   await sub_AddGXConst( "GXKEY_F4");
   await sub_AddGXConst( "GXKEY_F5");
   await sub_AddGXConst( "GXKEY_F6");
   await sub_AddGXConst( "GXKEY_F7");
   await sub_AddGXConst( "GXKEY_F8");
   await sub_AddGXConst( "GXKEY_F9");
   await sub_AddGXConst( "GXKEY_PAUSE");
   await sub_AddGXConst( "GXKEY_SCRLK");
   await sub_AddGXConst( "GXKEY_NUMPAD_7");
   await sub_AddGXConst( "GXKEY_NUMPAD_8");
   await sub_AddGXConst( "GXKEY_NUMPAD_9");
   await sub_AddGXConst( "GXKEY_NUMPAD_MINUS");
   await sub_AddGXConst( "GXKEY_NUMPAD_4");
   await sub_AddGXConst( "GXKEY_NUMPAD_5");
   await sub_AddGXConst( "GXKEY_NUMPAD_6");
   await sub_AddGXConst( "GXKEY_NUMPAD_PLUS");
   await sub_AddGXConst( "GXKEY_NUMPAD_1");
   await sub_AddGXConst( "GXKEY_NUMPAD_2");
   await sub_AddGXConst( "GXKEY_NUMPAD_3");
   await sub_AddGXConst( "GXKEY_NUMPAD_0");
   await sub_AddGXConst( "GXKEY_NUMPAD_PERIOD");
   await sub_AddGXConst( "GXKEY_F11");
   await sub_AddGXConst( "GXKEY_F12");
   await sub_AddGXConst( "GXKEY_NUMPAD_ENTER");
   await sub_AddGXConst( "GXKEY_RCTRL");
   await sub_AddGXConst( "GXKEY_NUMPAD_DIVIDE");
   await sub_AddGXConst( "GXKEY_NUMLOCK");
   await sub_AddGXConst( "GXKEY_HOME");
   await sub_AddGXConst( "GXKEY_UP");
   await sub_AddGXConst( "GXKEY_PAGEUP");
   await sub_AddGXConst( "GXKEY_LEFT");
   await sub_AddGXConst( "GXKEY_RIGHT");
   await sub_AddGXConst( "GXKEY_END");
   await sub_AddGXConst( "GXKEY_DOWN");
   await sub_AddGXConst( "GXKEY_PAGEDOWN");
   await sub_AddGXConst( "GXKEY_INSERT");
   await sub_AddGXConst( "GXKEY_DELETE");
   await sub_AddGXConst( "GXKEY_LWIN");
   await sub_AddGXConst( "GXKEY_RWIN");
   await sub_AddGXConst( "GXKEY_MENU");
   await sub_AddGXConst( "GXACTION_MOVE_LEFT");
   await sub_AddGXConst( "GXACTION_MOVE_RIGHT");
   await sub_AddGXConst( "GXACTION_MOVE_UP");
   await sub_AddGXConst( "GXACTION_MOVE_DOWN");
   await sub_AddGXConst( "GXACTION_JUMP");
   await sub_AddGXConst( "GXACTION_JUMP_RIGHT");
   await sub_AddGXConst( "GXACTION_JUMP_LEFT");
   await sub_AddGXConst( "GXSCENE_FOLLOW_NONE");
   await sub_AddGXConst( "GXSCENE_FOLLOW_ENTITY_CENTER");
   await sub_AddGXConst( "GXSCENE_FOLLOW_ENTITY_CENTER_X");
   await sub_AddGXConst( "GXSCENE_FOLLOW_ENTITY_CENTER_Y");
   await sub_AddGXConst( "GXSCENE_FOLLOW_ENTITY_CENTER_X_POS");
   await sub_AddGXConst( "GXSCENE_FOLLOW_ENTITY_CENTER_X_NEG");
   await sub_AddGXConst( "GXSCENE_CONSTRAIN_NONE");
   await sub_AddGXConst( "GXSCENE_CONSTRAIN_TO_MAP");
   await sub_AddGXConst( "GXFONT_DEFAULT");
   await sub_AddGXConst( "GXFONT_DEFAULT_BLACK");
   await sub_AddGXConst( "GXDEVICE_KEYBOARD");
   await sub_AddGXConst( "GXDEVICE_MOUSE");
   await sub_AddGXConst( "GXDEVICE_CONTROLLER");
   await sub_AddGXConst( "GXDEVICE_BUTTON");
   await sub_AddGXConst( "GXDEVICE_AXIS");
   await sub_AddGXConst( "GXDEVICE_WHEEL");
   await sub_AddGXConst( "GXTYPE_ENTITY");
   await sub_AddGXConst( "GXTYPE_FONT");
   await sub_AddGXMethod( "SUB",  "GXSleep",   True);
   await sub_AddGXMethod( "FUNCTION",  "GXMouseX",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMouseY",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSoundLoad",   False);
   await sub_AddGXMethod( "SUB",  "GXSoundPlay",   False);
   await sub_AddGXMethod( "SUB",  "GXSoundRepeat",   False);
   await sub_AddGXMethod( "SUB",  "GXSoundVolume",   False);
   await sub_AddGXMethod( "SUB",  "GXSoundPause",   False);
   await sub_AddGXMethod( "SUB",  "GXSoundStop",   False);
   await sub_AddGXMethod( "SUB",  "GXSoundMuted",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSoundMuted",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityAnimate",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityAnimateStop",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityAnimateMode",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityAnimateMode",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXScreenEntityCreate",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityCreate",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityCreate",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityVisible",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityMove",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityPos",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityVX",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityVX",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityVY",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityVY",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityX",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityY",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityWidth",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityHeight",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityFrameNext",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityFrameSet",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityType",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityType",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityUID$",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFontUID$",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityApplyGravity",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityApplyGravity",   False);
   await sub_AddGXMethod( "SUB",  "GXEntityCollisionOffset",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityCollisionOffsetLeft",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityCollisionOffsetTop",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityCollisionOffsetRight",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXEntityCollisionOffsetBottom",   False);
   await sub_AddGXMethod( "SUB",  "GXFullScreen",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFullScreen",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXBackgroundAdd",   False);
   await sub_AddGXMethod( "SUB",  "GXBackgroundY",   False);
   await sub_AddGXMethod( "SUB",  "GXBackgroundHeight",   False);
   await sub_AddGXMethod( "SUB",  "GXBackgroundClear",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneEmbedded",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneEmbedded",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneCreate",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneWindowSize",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneScale",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneResize",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneDestroy",   False);
   await sub_AddGXMethod( "SUB",  "GXCustomDraw",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXCustomDraw",   False);
   await sub_AddGXMethod( "SUB",  "GXFrameRate",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFrameRate",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFrame",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneDraw",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneMove",   False);
   await sub_AddGXMethod( "SUB",  "GXScenePos",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneX",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneY",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneWidth",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneHeight",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneColumns",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSceneRows",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneStart",   True);
   await sub_AddGXMethod( "SUB",  "GXSceneUpdate",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneFollowEntity",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneConstrain",   False);
   await sub_AddGXMethod( "SUB",  "GXSceneStop",   False);
   await sub_AddGXMethod( "SUB",  "GXMapCreate",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapColumns",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapRows",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapLayers",   False);
   await sub_AddGXMethod( "SUB",  "GXMapLayerVisible",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapLayerVisible",   False);
   await sub_AddGXMethod( "SUB",  "GXMapLayerAdd",   False);
   await sub_AddGXMethod( "SUB",  "GXMapLayerInsert",   False);
   await sub_AddGXMethod( "SUB",  "GXMapLayerRemove",   False);
   await sub_AddGXMethod( "SUB",  "GXMapResize",   False);
   await sub_AddGXMethod( "SUB",  "GXMapDraw",   False);
   await sub_AddGXMethod( "SUB",  "GXMapTilePosAt",   False);
   await sub_AddGXMethod( "SUB",  "GXMapTile",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapTile",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapTileDepth",   False);
   await sub_AddGXMethod( "SUB",  "GXMapTileAdd",   False);
   await sub_AddGXMethod( "SUB",  "GXMapTileRemove",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXMapVersion",   False);
   await sub_AddGXMethod( "SUB",  "GXMapSave",   False);
   await sub_AddGXMethod( "SUB",  "GXMapLoad",   True);
   await sub_AddGXMethod( "FUNCTION",  "GXMapIsometric",   False);
   await sub_AddGXMethod( "SUB",  "GXMapIsometric",   False);
   await sub_AddGXMethod( "SUB",  "GXSpriteDraw",   False);
   await sub_AddGXMethod( "SUB",  "GXSpriteDrawScaled",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetCreate",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetReplaceImage",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetLoad",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetSave",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetPos",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetWidth",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetHeight",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetColumns",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetRows",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetFilename",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetImage",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetAnimationCreate",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetAnimationAdd",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetAnimationRemove",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetAnimationFrames",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXTilesetAnimationSpeed",   False);
   await sub_AddGXMethod( "SUB",  "GXTilesetAnimationSpeed",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFontCreate",   False);
   await sub_AddGXMethod( "SUB",  "GXFontCreate",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFontWidth",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFontHeight",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFontCharSpacing",   False);
   await sub_AddGXMethod( "SUB",  "GXFontCharSpacing",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXFontLineSpacing",   False);
   await sub_AddGXMethod( "SUB",  "GXFontLineSpacing",   False);
   await sub_AddGXMethod( "SUB",  "GXDrawText",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDebug",   False);
   await sub_AddGXMethod( "SUB",  "GXDebug",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDebugScreenEntities",   False);
   await sub_AddGXMethod( "SUB",  "GXDebugScreenEntities",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDebugFont",   False);
   await sub_AddGXMethod( "SUB",  "GXDebugFont",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDebugTileBorderColor",   False);
   await sub_AddGXMethod( "SUB",  "GXDebugTileBorderColor",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDebugEntityBorderColor",   False);
   await sub_AddGXMethod( "SUB",  "GXDebugEntityBorderColor",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDebugEntityCollisionColor",   False);
   await sub_AddGXMethod( "SUB",  "GXDebugEntityCollisionColor",   False);
   await sub_AddGXMethod( "SUB",  "GXKeyInput",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXKeyDown",   False);
   await sub_AddGXMethod( "SUB",  "GXDeviceInputDetect",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDeviceInputTest",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDeviceName",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXDeviceTypeName",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXInputTypeName",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXKeyButtonName",   False);
   await sub_AddGXConst( "GX_CR");
   await sub_AddGXConst( "GX_LF");
   await sub_AddGXConst( "GX_CRLF");
   await sub_AddGXMethod( "FUNCTION",  "GXSTR_LPad",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSTR_RPad",   False);
   await sub_AddGXMethod( "FUNCTION",  "GXSTR_Replace",   False);
}
async function sub_InitQBMethods() {
if (QB.halted()) { return; }
   await sub_AddQBMethod( "FUNCTION",  "_Alpha",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Alpha32",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Acos",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Acosh",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Atanh",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Asin",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Asinh",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Atan2",   False);
   await sub_AddQBMethod( "FUNCTION",  "_AutoDisplay",   False);
   await sub_AddQBMethod( "SUB",  "_AutoDisplay",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Blue",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Blue32",   False);
   await sub_AddQBMethod( "FUNCTION",  "_CopyImage",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Cosh",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Coth",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Csch",   False);
   await sub_AddQBMethod( "FUNCTION",  "_D2R",   False);
   await sub_AddQBMethod( "SUB",  "_Delay",   True);
   await sub_AddQBMethod( "FUNCTION",  "_Dest",   False);
   await sub_AddQBMethod( "SUB",  "_Dest",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Display",   False);
   await sub_AddQBMethod( "SUB",  "_Display",   False);
   await sub_AddQBMethod( "FUNCTION",  "_FontWidth",   False);
   await sub_AddQBMethod( "SUB",  "_FreeImage",   False);
   await sub_AddQBMethod( "SUB",  "_FullScreen",   False);
   await sub_AddQBMethod( "FUNCTION",  "_FullScreen",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Green",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Green32",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Height",   False);
   await sub_AddQBMethod( "FUNCTION",  "_InStrRev",   False);
   await sub_AddQBMethod( "SUB",  "_Limit",   True);
   await sub_AddQBMethod( "SUB",  "_KeyClear",   False);
   await sub_AddQBMethod( "FUNCTION",  "_KeyDown",   False);
   await sub_AddQBMethod( "FUNCTION",  "_KeyHit",   False);
   await sub_AddQBMethod( "FUNCTION",  "_LoadImage",   True);
   await sub_AddQBMethod( "FUNCTION",  "_MouseButton",   False);
   await sub_AddQBMethod( "FUNCTION",  "_MouseInput",   False);
   await sub_AddQBMethod( "FUNCTION",  "_MouseX",   False);
   await sub_AddQBMethod( "FUNCTION",  "_MouseY",   False);
   await sub_AddQBMethod( "FUNCTION",  "_NewImage",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Pi",   False);
   await sub_AddQBMethod( "SUB",  "_PrintString",   False);
   await sub_AddQBMethod( "FUNCTION",  "_PrintWidth",   False);
   await sub_AddQBMethod( "SUB",  "_PutImage",   False);
   await sub_AddQBMethod( "FUNCTION",  "_R2D",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Red",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Red32",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Resize",   False);
   await sub_AddQBMethod( "FUNCTION",  "_ResizeHeight",   False);
   await sub_AddQBMethod( "FUNCTION",  "_ResizeWidth",   False);
   await sub_AddQBMethod( "FUNCTION",  "_RGB",   False);
   await sub_AddQBMethod( "FUNCTION",  "_RGBA",   False);
   await sub_AddQBMethod( "FUNCTION",  "_RGB32",   False);
   await sub_AddQBMethod( "FUNCTION",  "_RGBA32",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Round",   False);
   await sub_AddQBMethod( "FUNCTION",  "_ScreenExists",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Sech",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Sinh",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Source",   False);
   await sub_AddQBMethod( "SUB",  "_Source",   False);
   await sub_AddQBMethod( "SUB",  "_SndClose",   False);
   await sub_AddQBMethod( "FUNCTION",  "_SndOpen",   False);
   await sub_AddQBMethod( "SUB",  "_SndPlay",   False);
   await sub_AddQBMethod( "SUB",  "_SndLoop",   False);
   await sub_AddQBMethod( "SUB",  "_SndPause",   False);
   await sub_AddQBMethod( "SUB",  "_SndStop",   False);
   await sub_AddQBMethod( "SUB",  "_SndVol",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Tanh",   False);
   await sub_AddQBMethod( "SUB",  "_Title",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Trim",   False);
   await sub_AddQBMethod( "FUNCTION",  "_Width",   False);
   await sub_AddQBMethod( "FUNCTION",  "Abs",   False);
   await sub_AddQBMethod( "FUNCTION",  "Asc",   False);
   await sub_AddQBMethod( "FUNCTION",  "Atn",   False);
   await sub_AddQBMethod( "SUB",  "Beep",   False);
   await sub_AddQBMethod( "FUNCTION",  "Chr$",   False);
   await sub_AddQBMethod( "SUB",  "Circle",   False);
   await sub_AddQBMethod( "SUB",  "Cls",   False);
   await sub_AddQBMethod( "SUB",  "Color",   False);
   await sub_AddQBMethod( "FUNCTION",  "Command$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Cos",   False);
   await sub_AddQBMethod( "FUNCTION",  "Csrlin",   False);
   await sub_AddQBMethod( "FUNCTION",  "Cvi",   False);
   await sub_AddQBMethod( "FUNCTION",  "Cvl",   False);
   await sub_AddQBMethod( "SUB",  "Draw",   False);
   await sub_AddQBMethod( "FUNCTION",  "Exp",   False);
   await sub_AddQBMethod( "FUNCTION",  "Fix",   False);
   await sub_AddQBMethod( "FUNCTION",  "Hex$",   False);
   await sub_AddQBMethod( "SUB",  "Input",   True);
   await sub_AddQBMethod( "FUNCTION",  "InKey$",   False);
   await sub_AddQBMethod( "FUNCTION",  "InStr",   False);
   await sub_AddQBMethod( "FUNCTION",  "Int",   False);
   await sub_AddQBMethod( "FUNCTION",  "LBound",   False);
   await sub_AddQBMethod( "FUNCTION",  "Left$",   False);
   await sub_AddQBMethod( "FUNCTION",  "LCase$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Len",   False);
   await sub_AddQBMethod( "SUB",  "Line",   False);
   await sub_AddQBMethod( "SUB",  "Locate",   False);
   await sub_AddQBMethod( "FUNCTION",  "Log",   False);
   await sub_AddQBMethod( "FUNCTION",  "LTrim$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Mid$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Mki$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Mkl$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Oct$",   False);
   await sub_AddQBMethod( "SUB",  "Paint",   False);
   await sub_AddQBMethod( "FUNCTION",  "Point",   False);
   await sub_AddQBMethod( "FUNCTION",  "Pos",   False);
   await sub_AddQBMethod( "SUB",  "PReset",   False);
   await sub_AddQBMethod( "SUB",  "Print",   True);
   await sub_AddQBMethod( "SUB",  "PSet",   False);
   await sub_AddQBMethod( "SUB",  "Randomize",   False);
   await sub_AddQBMethod( "SUB",  "Restore",   False);
   await sub_AddQBMethod( "FUNCTION",  "Right$",   False);
   await sub_AddQBMethod( "FUNCTION",  "RTrim$",   False);
   await sub_AddQBMethod( "SUB",  "Read",   False);
   await sub_AddQBMethod( "FUNCTION",  "Rnd",   False);
   await sub_AddQBMethod( "SUB",  "Screen",   False);
   await sub_AddQBMethod( "FUNCTION",  "Sgn",   False);
   await sub_AddQBMethod( "FUNCTION",  "Sin",   False);
   await sub_AddQBMethod( "SUB",  "Sleep",   True);
   await sub_AddQBMethod( "FUNCTION",  "Space",   False);
   await sub_AddQBMethod( "FUNCTION",  "String",   False);
   await sub_AddQBMethod( "FUNCTION",  "Sqr",   False);
   await sub_AddQBMethod( "FUNCTION",  "Str$",   False);
   await sub_AddQBMethod( "SUB",  "Swap",   False);
   await sub_AddQBMethod( "FUNCTION",  "Tan",   False);
   await sub_AddQBMethod( "FUNCTION",  "Time$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Timer",   False);
   await sub_AddQBMethod( "FUNCTION",  "UBound",   False);
   await sub_AddQBMethod( "FUNCTION",  "UCase$",   False);
   await sub_AddQBMethod( "FUNCTION",  "Val",   False);
   await sub_AddQBMethod( "FUNCTION",  "Varptr",   False);
   await sub_AddQBMethod( "SUB",  "Window",   False);
   await sub_AddQBMethod( "SUB",  "IncludeJS",   True);
   await sub_AddSystemType( "FETCHRESPONSE",  "ok:INTEGER,status:INTEGER,statusText:STRING,text:STRING");
   await sub_AddQBMethod( "FUNCTION",  "Fetch",   True);
   await sub_AddQBMethod( "SUB",  "Fetch",   True);
   await sub_AddQBMethod( "FUNCTION",  "FromJSON",   False);
   await sub_AddQBMethod( "FUNCTION",  "ToJSON",   False);
}
this.compile = async function(src) {
   await sub_QBToJS(src, TEXT, '');
   var js = '';
   for (var i=1; i<= QB.func_UBound(jsLines); i++) {
      js += '/* ' + i + ':' + this.getSourceLine(i) + ' */ ' + QB.arrayValue(jsLines, [i]).value.text + '\n';
   }
   return js;
};
this.getWarnings = function() {
   var w = [];
   for (var i=1; i <= QB.func_UBound(warnings); i++) {
      w.push({
         line: QB.arrayValue(warnings, [i]).value.line,
         text: QB.arrayValue(warnings, [i]).value.text
      });
   }
   return w;
};
this.getSourceLine = function(jsLine) {
   if (jsLine == 0) { return 0; }
   var line = QB.arrayValue(jsLines, [jsLine]).value.line;
   line = QB.arrayValue(lines, [line]).value.line;
   return line;
};

return this;
}
