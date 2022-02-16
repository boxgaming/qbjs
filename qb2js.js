var QBCompiler = new function() {

   // Option _Explicit
   // $Console
   // Only
   const FILE =  1;
   const TEXT =  2;
   const False =  0;
   const True = ! False;
   
   
   
   
   
   var lines = QB.initArray([ 0], {line:0,text:''}); // CODELINE
   var jsLines = QB.initArray([ 0], {line:0,text:''}); // CODELINE
   var methods = QB.initArray([ 0], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}); // METHOD
   var types = QB.initArray([ 0], {line:0,name:'',argc:0,args:''}); // QBTYPE
   var typeVars = QB.initArray([ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var globalVars = QB.initArray([ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var localVars = QB.initArray([ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}); // VARIABLE
   var warnings = QB.initArray([ 0], {line:0,text:''}); // CODELINE
   var currentMethod = ''; // STRING
   var programMethods = 0; // INTEGER
   if ( QB.func_Command() != "" ) {
      sub_QBToJS( QB.func_Command(),  FILE);
      sub_PrintJS();
      QB.halt(); return;
   }

async function sub_QBToJS(source/*STRING*/,sourceType/*INTEGER*/) {
if (QB.halted()) { return; }
   QB.resizeArray(lines, [ 0], {line:0,text:''}, false); // CODELINE
   QB.resizeArray(jsLines, [ 0], {line:0,text:''}, false); // CODELINE
   QB.resizeArray(methods, [ 0], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}, false); // METHOD
   QB.resizeArray(types, [ 0], {line:0,name:'',argc:0,args:''}, false); // QBTYPE
   QB.resizeArray(typeVars, [ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   QB.resizeArray(globalVars, [ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   QB.resizeArray(localVars, [ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
   QB.resizeArray(warnings, [ 0], {line:0,text:''}, false); // CODELINE
   currentMethod = "";
   programMethods =  0;
   if ( sourceType ==  FILE) {
      sub_ReadLinesFromFile( source);
   } else {
      sub_ReadLinesFromText( source);
   }
   sub_FindMethods();
   programMethods = QB.func_UBound( methods);
   sub_InitGX();
   sub_InitQBMethods();
   var selfConvert = 0; // INTEGER
   var isGX = 0; // INTEGER
   isGX =  False;
   if ( sourceType ==  FILE) {
      selfConvert = func_EndsWith( source, "qb2js.bas");
   }
   if ( selfConvert) {
      sub_AddJSLine( 0, "var QBCompiler = new function() {");
   } else if ( sourceType ==  FILE) {
      sub_AddJSLine( 0, "async function init() {");
   }
   if (! selfConvert) {
      sub_AddJSLine( 0, "QB.start();");
   }
   if (! selfConvert) {
      var mtest = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
      if (func_FindMethod("GXOnGameEvent" ,  mtest, "SUB") ) {
         sub_AddJSLine( 0, "    await GX.registerGameEvents(sub_GXOnGameEvent);");
         isGX =  True;
      } else {
         sub_AddJSLine( 0, "    await GX.registerGameEvents(function(e){});");
         sub_AddJSLine( 0, "    QB.sub_Screen(0);");
      }
   }
   sub_AddJSLine( 0, "");
   sub_ConvertLines( 1,  func_MainEnd(), "");
   if (! selfConvert && ! isGX) {
      sub_AddJSLine( 0, "QB.end();");
   }
   sub_ConvertMethods();
   if ( selfConvert) {
      sub_AddJSLine( 0, "this.compile = function(src) {");
      sub_AddJSLine( 0, "   sub_QBToJS(src, TEXT);");
      sub_AddJSLine( 0, "   var js = '';");
      sub_AddJSLine( 0, "   for (var i=1; i<= QB.func_UBound(jsLines); i++) {");
      sub_AddJSLine( 0, "      js += QB.arrayValue(jsLines, [i]).value.text + '\\n';");
      sub_AddJSLine( 0, "   }");
      sub_AddJSLine( 0, "   return js;");
      sub_AddJSLine( 0, "};");
      sub_AddJSLine( 0, "this.getWarnings = function() {");
      sub_AddJSLine( 0, "   var w = [];");
      sub_AddJSLine( 0, "   for (var i=1; i <= QB.func_UBound(warnings); i++) {");
      sub_AddJSLine( 0, "      w.push({");
      sub_AddJSLine( 0, "         line: QB.arrayValue(warnings, [i]).value.line,");
      sub_AddJSLine( 0, "         text: QB.arrayValue(warnings, [i]).value.text");
      sub_AddJSLine( 0, "      });");
      sub_AddJSLine( 0, "   }");
      sub_AddJSLine( 0, "   return w;");
      sub_AddJSLine( 0, "};");
      sub_AddJSLine( 0, "};");
   } else if ( sourceType ==  FILE) {
      sub_AddJSLine( 0, "};");
   }
}
async function sub_PrintJS() {
if (QB.halted()) { return; }
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( jsLines);  i= i + 1) {  if (QB.halted()) { return; }
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
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
   var totalIndent = 0; // INTEGER
   totalIndent =  1;
   var caseCount = 0; // INTEGER
   var loopMode = QB.initArray([ 100], 0); // INTEGER
   var loopLevel = 0; // INTEGER
   var caseVar = ''; // STRING
   var currType = 0; // INTEGER
   for ( i= firstLine;  i <=  lastLine;  i= i + 1) {  if (QB.halted()) { return; }
      indent =  0;
      tempIndent =  0;
      var l = ''; // STRING
      l = QB.func__Trim(QB.arrayValue(lines, [ i]).value .text);
      var parts = QB.initArray([ 0], ''); // STRING
      var c = 0; // INTEGER
      c = func_SLSplit( l, parts);
      var js = ''; // STRING
      js = "";
      var first = ''; // STRING
      first = QB.func_UCase(QB.arrayValue(parts, [ 1]).value);
      if ( jsMode ==  True) {
         if ( first == "$END" ) {
            jsMode =  False;
            sub_AddJSLine( 0, "//-------- END JS native code block --------");
         } else {
            sub_AddJSLine( i, QB.arrayValue(lines, [ i]).value .text);
         }
      } else if ( typeMode ==  True) {
         if ( first == "END" ) {
            var second = ''; // STRING
            second = QB.func_UCase(QB.arrayValue(parts, [ 2]).value);
            if ( second == "TYPE" ) {
               typeMode =  False;
            }
         } else {
            var tvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
            tvar.typeId =  currType;
            tvar.name = QB.arrayValue(parts, [ 1]).value;
            tvar.type = QB.func_UCase(QB.arrayValue(parts, [ 3]).value);
            if ( tvar.type == "_UNSIGNED" ) {
               tvar.type =  tvar.type +" "  +QB.func_UCase(QB.arrayValue(parts, [ 4]).value);
            }
            sub_AddVariable( tvar, typeVars);
         }
      } else {
         if ( first == "CONST" ) {
            js = "const "  +QB.arrayValue(parts, [ 2]).value  +" = "  +func_ConvertExpression(func_Join(parts ,  4,  -1, " "))  +";";
            sub_AddConst(QB.arrayValue(parts, [ 2]).value);
         } else if ( first == "DIM"  ||  first == "REDIM"  ||  first == "STATIC" ) {
            js = func_DeclareVar(parts);
         } else if ( first == "SELECT" ) {
            caseVar =  func_GenJSVar();
            js = "var "  + caseVar +" = "  +func_ConvertExpression(func_Join(parts ,  3,  -1, " "))  +";"  + GX.CRLF;
            js =  js +"switch ("  + caseVar +") {";
            indent =  1;
            caseCount =  0;
         } else if ( first == "CASE" ) {
            if ( caseCount >  0) {
               js = "break;"  + GX.LF;
            }
            if (QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "ELSE" ) {
               js =  js +"default:";
            } else if (QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "IS" ) {
               js =  js +"case "  + caseVar +" "  +func_ConvertExpression(func_Join(parts ,  3,  -1, " "))  +":";
            } else {
               var caseParts = QB.initArray([ 0], ''); // STRING
               var cscount = 0; // INTEGER
               cscount = func_ListSplit(func_Join(parts ,  2,  -1, " ") , caseParts);
               var ci = 0; // INTEGER
               for ( ci= 1;  ci <=  cscount;  ci= ci + 1) {  if (QB.halted()) { return; }
                  if ( ci >  1) {
                     js =  js + GX.CRLF;
                  }
                  js =  js +"case "  +func_ConvertExpression(QB.arrayValue(caseParts, [ ci]).value)  +":";
               }
            }
            caseCount =  caseCount + 1;
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
            for ( fi= 2;  fi <= QB.func_UBound( parts);  fi= fi + 1) {  if (QB.halted()) { return; }
               var fword = ''; // STRING
               fword = QB.func_UCase(QB.arrayValue(parts, [ fi]).value);
               if ( fword == "=" ) {
                  eqIdx =  fi;
               } else if ( fword == "TO" ) {
                  toIdx =  fi;
               } else if ( fword == "STEP" ) {
                  stepIdx =  fi;
                  fstep = func_ConvertExpression(func_Join(parts ,  fi + 1,  -1, " "));
               }
            }
            var fvar = ''; // STRING
            fvar = func_ConvertExpression(func_Join(parts ,  2,  eqIdx - 1, " "));
            var sval = ''; // STRING
            sval = func_ConvertExpression(func_Join(parts ,  eqIdx + 1,  toIdx - 1, " "));
            var uval = ''; // STRING
            uval = func_ConvertExpression(func_Join(parts ,  toIdx + 1,  stepIdx - 1, " "));
            if (QB.func_Left(QB.func__Trim( fstep) ,  1)  == "-" ) {
               fcond = " >= ";
            }
            js = "for ("  + fvar +"="  + sval +"; "  + fvar + fcond + uval +"; "  + fvar +"="  + fvar +" + "  + fstep +") {";
            js =  js +"  if (QB.halted()) { return; }";
            indent =  1;
         } else if ( first == "IF" ) {
            var thenIndex = 0; // INTEGER
            for ( thenIndex= 2;  thenIndex <= QB.func_UBound( parts);  thenIndex= thenIndex + 1) {  if (QB.halted()) { return; }
               if (QB.func_UCase(QB.arrayValue(parts, [ thenIndex]).value)  == "THEN" ) {
                  break;
               }
            }
            js = "if ("  +func_ConvertExpression(func_Join(parts ,  2,  thenIndex - 1, " "))  +") {";
            indent =  1;
         } else if ( first == "ELSEIF" ) {
            js = "} else if ("  +func_ConvertExpression(func_Join(parts ,  2, QB.func_UBound( parts)  - 1, " "))  +") {";
            tempIndent =  -1;
         } else if ( first == "ELSE" ) {
            js = "} else {";
            tempIndent =  -1;
         } else if ( first == "NEXT" ) {
            js =  js +"}";
            indent =  -1;
         } else if ( first == "END" ) {
            if (QB.func_UBound( parts)  ==  1) {
               js = "QB.halt(); return;";
            } else {
               if (QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "SELECT" ) {
                  js = "break;";
               }
               js =  js +"}";
               indent =  -1;
            }
         } else if ( first == "SYSTEM" ) {
            js = "QB.halt(); return;";
         } else if ( first == "$IF" ) {
            if (QB.func_UBound( parts)  ==  2) {
               if (QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "JS"  || QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "JAVASCRIPT" ) {
                  jsMode =  True;
                  js = "//-------- BEGIN JS native code block --------";
               }
            }
         } else if ( first == "DO" ) {
            loopLevel =  loopLevel + 1;
            if (QB.func_UBound( parts)  >  1) {
               if (QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "WHILE" ) {
                  js = "while ("  +func_ConvertExpression(func_Join(parts ,  3,  -1, " "))  +") {";
               } else {
                  js = "while (!("  +func_ConvertExpression(func_Join(parts ,  3,  -1, " "))  +")) {";
               }
               QB.arrayValue(loopMode, [ loopLevel]).value =  1;
            } else {
               js = "do {";
               QB.arrayValue(loopMode, [ loopLevel]).value =  2;
            }
            indent =  1;
            js =  js +"  if (QB.halted()) { return; }";
         } else if ( first == "WHILE" ) {
            loopLevel =  loopLevel + 1;
            js = "while ("  +func_ConvertExpression(func_Join(parts ,  2,  -1, " "))  +") {";
            indent =  1;
            js =  js +"  if (QB.halted()) { return; }";
         } else if ( first == "WEND" ) {
            js = "}";
            loopLevel =  loopLevel - 1;
            indent =  -1;
         } else if ( first == "LOOP" ) {
            if (QB.arrayValue(loopMode, [ loopLevel]).value  ==  1) {
               js = "}";
            } else {
               js = "} while ((";
               if (QB.func_UBound( parts)  <  2) {
                  js =  js +"1));";
               } else {
                  if (QB.func_UCase(QB.arrayValue(parts, [ 2]).value)  == "UNTIL" ) {
                     js = "} while (!(";
                  }
                  js =  js +func_ConvertExpression(func_Join(parts ,  3, QB.func_UBound( parts) , " "))  +"))";
               }
            }
            loopLevel =  loopLevel - 1;
            indent =  -1;
         } else if ( first == "_CONTINUE" ) {
            js = "continue;";
         } else if (QB.func_UCase( l)  == "EXIT FUNCTION" ) {
            js = "return "  + functionName +";";
         } else if (QB.func_UCase( l)  == "EXIT SUB" ) {
            js = "return;";
         } else if ( first == "EXIT" ) {
            js = "break;";
         } else if ( first == "TYPE" ) {
            typeMode =  True;
            var qbtype = {line:0,name:'',argc:0,args:''}; // QBTYPE
            qbtype.line =  i;
            qbtype.name = QB.func_UCase(QB.arrayValue(parts, [ 2]).value);
            sub_AddType( qbtype);
            currType = QB.func_UBound( types);
         } else if ( first == "CALL" ) {
            var subline = ''; // STRING
            subline = QB.func__Trim(func_Join(parts ,  2,  -1, " "));
            var subend = 0; // INTEGER
            subend = QB.func_InStr( subline, "(");
            var subname = ''; // STRING
            if ( subend ==  0) {
               subname =  subline;
            } else {
               subname = QB.func_Left( subline,  subend - 1);
            }
            if (func_FindMethod( subname,  m, "SUB") ) {
               var subargs = ''; // STRING
               subargs = QB.func_Mid( subline, QB.func_Len( subname)  + 2, QB.func_Len( subline)  -QB.func_Len( subname)  - 2);
               js = func_ConvertSub( m,  subargs);
            } else {
               sub_AddWarning( i, "Missing Sub ["  + subname +"], ignoring Call command");
            }
         } else if ( c >  2) {
            var assignment = 0; // INTEGER
            assignment =  0;
            var j = 0; // INTEGER
            for ( j= 1;  j <= QB.func_UBound( parts);  j= j + 1) {  if (QB.halted()) { return; }
               if (QB.arrayValue(parts, [ j]).value  == "=" ) {
                  assignment =  j;
                  break;
               }
            }
            if ( assignment >  0) {
               js = func_RemoveSuffix(func_ConvertExpression(func_Join(parts ,  1,  assignment - 1, " ")))  +" = "  +func_ConvertExpression(func_Join(parts ,  assignment + 1,  -1, " "))  +";";
            } else {
               if (func_FindMethod(QB.arrayValue(parts, [ 1]).value ,  m, "SUB") ) {
                  js = func_ConvertSub( m, func_Join(parts ,  2,  -1, " "));
               } else {
                  js = "// "  + l;
                  sub_AddWarning( i, "Missing/unsupported sub or syntax error");
               }
            }
         } else {
            if (func_FindMethod(QB.arrayValue(parts, [ 1]).value ,  m, "SUB") ) {
               js = func_ConvertSub( m, func_Join(parts ,  2,  -1, " "));
            } else {
               js = "// "  + l;
               sub_AddWarning( i, "Missing/unsupported sub or syntax error");
            }
         }
         if (( indent <  0) ) {
            totalIndent =  totalIndent + indent;
         }
         sub_AddJSLine( i, GXSTR.lPad("" , " " , ( totalIndent + tempIndent)  * 3)  + js);
         if (( indent >  0) ) {
            totalIndent =  totalIndent + indent;
         }
      }
   }
}
function func_ConvertSub(m/*METHOD*/,args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertSub = null;
   var js = ''; // STRING
   if ( m.name == "Line" ) {
      var parts = QB.initArray([ 0], ''); // STRING
      var plen = 0; // INTEGER
      plen = func_SLSplit( args, parts);
      if ( plen >  0) {
         if (QB.func_UCase(QB.arrayValue(parts, [ 1]).value)  == "INPUT" ) {
            m.name = "Line Input";
            m.jsname = "await QB.sub_LineInput";
            args = func_Join(parts ,  2,  -1, " ");
         }
      }
   }
   if ( m.name == "Line" ) {
      js =  m.jsname +"("  +func_ConvertLine( args)  +");";
   } else if ( m.name == "PSet"  ||  m.name == "Circle" ) {
      js =  m.jsname +"("  +func_ConvertPSet( args)  +");";
   } else if ( m.name == "_PrintString" ) {
      js =  m.jsname +"("  +func_ConvertPrintString( args)  +");";
   } else if ( m.name == "Print" ) {
      js =  m.jsname +"("  +func_ConvertPrint( args)  +");";
   } else if ( m.name == "Input"  ||  m.name == "Line Input" ) {
      js = func_ConvertInput( m,  args);
   } else if ( m.name == "Swap" ) {
      js = func_ConvertSwap( m,  args);
   } else {
      js =  m.jsname +"("  +func_ConvertExpression( args)  +");";
   }
   ConvertSub =  js;
return ConvertSub;
}
function func_ConvertLine(args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertLine = null;
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   var sstep = ''; // STRING
   var estep = ''; // STRING
   sstep = "false";
   estep = "false";
   idx = func_FindParamChar( args, ",");
   if ( idx ==  -1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = QB.func_Left( args,  idx - 1);
      theRest = QB.func_Right( args, QB.func_Len( args)  - idx);
   }
   idx = func_FindParamChar( firstParam, "-");
   var startCord = ''; // STRING
   var endCord = ''; // STRING
   if ( idx ==  -1) {
      endCord =  firstParam;
   } else {
      startCord = QB.func_Left( firstParam,  idx - 1);
      endCord = QB.func_Right( firstParam, QB.func_Len( firstParam)  - idx);
   }
   if (QB.func_UCase(QB.func__Trim(QB.func_Left( startCord,  4)))  == "STEP" ) {
      sstep = "true";
   }
   if (QB.func_UCase(QB.func__Trim(QB.func_Left( endCord,  4)))  == "STEP" ) {
      estep = "true";
   }
   idx = QB.func_InStr( startCord, "(");
   startCord = QB.func_Right( startCord, QB.func_Len( startCord)  - idx);
   idx = QB.func__InStrRev( startCord, ")");
   startCord = QB.func_Left( startCord,  idx - 1);
   startCord = func_ConvertExpression( startCord);
   if ((QB.func__Trim( startCord)  == "") ) {
      startCord = "undefined, undefined";
   }
   idx = QB.func_InStr( endCord, "(");
   endCord = QB.func_Right( endCord, QB.func_Len( endCord)  - idx);
   idx = QB.func__InStrRev( endCord, ")");
   endCord = QB.func_Left( endCord,  idx - 1);
   endCord = func_ConvertExpression( endCord);
   theRest = func_ConvertExpression( theRest);
   theRest = GXSTR.replace( theRest, " BF" , " "  +QB.func_Chr( 34)  +"BF"  +QB.func_Chr( 34));
   theRest = GXSTR.replace( theRest, " B" , " "  +QB.func_Chr( 34)  +"B"  +QB.func_Chr( 34));
   ConvertLine =  sstep +", "  + startCord +", "  + estep +", "  + endCord +", "  + theRest;
return ConvertLine;
}
function func_ConvertPSet(args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertPSet = null;
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   var sstep = ''; // STRING
   sstep = "false";
   idx = func_FindParamChar( args, ",");
   if ( idx ==  -1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = QB.func_Left( args,  idx - 1);
      theRest = QB.func_Right( args, QB.func_Len( args)  - idx);
   }
   if (QB.func_UCase(QB.func__Trim(QB.func_Left( firstParam,  4)))  == "STEP" ) {
      sstep = "true";
   }
   idx = QB.func_InStr( firstParam, "(");
   firstParam = QB.func_Right( firstParam, QB.func_Len( firstParam)  - idx);
   idx = QB.func__InStrRev( firstParam, ")");
   firstParam = QB.func_Left( firstParam,  idx - 1);
   firstParam = func_ConvertExpression( firstParam);
   if ((QB.func__Trim( firstParam)  == "") ) {
      firstParam = "undefined, undefined";
   }
   theRest = func_ConvertExpression( theRest);
   ConvertPSet =  sstep +", "  + firstParam +", "  + theRest;
return ConvertPSet;
}
function func_ConvertPrint(args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertPrint = null;
   var pcount = 0; // INTEGER
   var parts = QB.initArray([ 0], ''); // STRING
   pcount = func_PrintSplit( args, parts);
   var js = ''; // STRING
   js = "[";
   var i = 0; // INTEGER
   for ( i= 1;  i <=  pcount;  i= i + 1) {  if (QB.halted()) { return; }
      if ( i >  1) {
         js =  js +",";
      }
      if (QB.arrayValue(parts, [ i]).value  == "," ) {
         js =  js +"QB.COLUMN_ADVANCE";
      } else if (QB.arrayValue(parts, [ i]).value  == ";" ) {
         js =  js +"QB.PREVENT_NEWLINE";
      } else {
         js =  js +func_ConvertExpression(QB.arrayValue(parts, [ i]).value);
      }
   }
   ConvertPrint =  js +"]";
return ConvertPrint;
}
function func_ConvertPrintString(args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertPrintString = null;
   var firstParam = ''; // STRING
   var theRest = ''; // STRING
   var idx = 0; // INTEGER
   idx = func_FindParamChar( args, ",");
   if ( idx ==  -1) {
      firstParam =  args;
      theRest = "";
   } else {
      firstParam = QB.func_Left( args,  idx - 1);
      theRest = QB.func_Right( args, QB.func_Len( args)  - idx);
   }
   idx = QB.func_InStr( firstParam, "(");
   firstParam = QB.func_Right( firstParam, QB.func_Len( firstParam)  - idx);
   idx = QB.func__InStrRev( firstParam, ")");
   firstParam = QB.func_Left( firstParam,  idx - 1);
   ConvertPrintString = func_ConvertExpression( firstParam)  +", "  +func_ConvertExpression( theRest);
return ConvertPrintString;
}
function func_ConvertInput(m/*METHOD*/,args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertInput = null;
   var js = ''; // STRING
   var vname = ''; // STRING
   var pcount = 0; // INTEGER
   var parts = QB.initArray([ 0], ''); // STRING
   var vars = QB.initArray([ 0], ''); // STRING
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
   pcount = func_PrintSplit( args, parts);
   var i = 0; // INTEGER
   for ( i= 1;  i <=  pcount;  i= i + 1) {  if (QB.halted()) { return; }
      p = QB.func__Trim(QB.arrayValue(parts, [ i]).value);
      if ( p == ";" ) {
         if ( i ==  1) {
            preventNewline = "true";
         } else {
            addQuestionPrompt = "true";
         }
      } else if (func_StartsWith( p, QB.func_Chr( 34)) ) {
         prompt =  p;
      } else if ( p != "," ) {
         vcount = QB.func_UBound( vars)  + 1;
         QB.resizeArray(vars, [ vcount], '', true); // STRING
         QB.arrayValue(vars, [ vcount]).value =  p;
      }
   }
   vname =  func_GenJSVar();
   js = "var "  + vname +" = new Array("  +QB.func_Str(QB.func_UBound( vars))  +");"  + GX.LF;
   js =  js + m.jsname +"("  + vname +", "  + preventNewline +", "  + addQuestionPrompt +", "  + prompt +");"  + GX.LF;
   for ( i= 1;  i <= QB.func_UBound( vars);  i= i + 1) {  if (QB.halted()) { return; }
      js =  js +func_ConvertExpression(QB.arrayValue(vars, [ i]).value)  +" = "  + vname +"["  +QB.func_Str( i - 1)  +"];"  + GX.LF;
   }
   ConvertInput =  js;
return ConvertInput;
}
function func_ConvertSwap(m/*METHOD*/,args/*STRING*/) {
if (QB.halted()) { return; }
var ConvertSwap = null;
   var js = ''; // STRING
   var swapArray = ''; // STRING
   swapArray =  func_GenJSVar();
   var swapArgs = QB.initArray([ 0], ''); // STRING
   var swapCount = 0; // INTEGER
   swapCount = func_ListSplit( args, swapArgs);
   var var1 = ''; // STRING
   var var2 = ''; // STRING
   var1 = func_ConvertExpression(QB.arrayValue(swapArgs, [ 1]).value);
   var2 = func_ConvertExpression(QB.arrayValue(swapArgs, [ 2]).value);
   js = "var "  + swapArray +" = ["  + var1 +","  + var2 +"];"  + GX.LF;
   js =  js + m.jsname +"("  + swapArray +");"  + GX.LF;
   js =  js + var1 +" = "  + swapArray +"[0];"  + GX.LF;
   js =  js + var2 +" = "  + swapArray +"[1];";
   ConvertSwap =  js;
return ConvertSwap;
}
function func_GenJSVar() {
if (QB.halted()) { return; }
var GenJSVar = null;
   GenJSVar = "___v"  +QB.func__Trim(QB.func_Str(QB.func__Round( QB.func_Rnd() * 10000000)));
return GenJSVar;
}
function func_FindParamChar(s/*STRING*/,char/*STRING*/) {
if (QB.halted()) { return; }
var FindParamChar = null;
   var idx = 0; // INTEGER
   idx =  -1;
   var c = ''; // STRING
   var quote = 0; // INTEGER
   var paren = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_Len( s);  i= i + 1) {  if (QB.halted()) { return; }
      c = QB.func_Mid( s,  i,  1);
      if ( c == QB.func_Chr( 34) ) {
         quote = ! quote;
      } else if (! quote &&  c == "(" ) {
         paren =  paren + 1;
      } else if (! quote &&  c == ")" ) {
         paren =  paren - 1;
      } else if (! quote &&  paren ==  0 &&  c ==  char) {
         idx =  i;
         break;
      }
   }
   FindParamChar =  idx;
return FindParamChar;
}
function func_DeclareVar(parts/*STRING*/) {
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
   var varnames = QB.initArray([ 0], ''); // STRING
   var vnamecount = 0; // INTEGER
   var findVar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   var asIdx = 0; // INTEGER
   asIdx =  0;
   var js = ''; // STRING
   js = "";
   var preserve = ''; // STRING
   preserve = "false";
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( parts);  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.func_UCase(QB.arrayValue(parts, [ i]).value)  == "AS" ) {
         asIdx =  i;
      }
      if (QB.func_UCase(QB.arrayValue(parts, [ i]).value)  == "_PRESERVE" ) {
         preserve = "true";
      }
      if (QB.func_UCase(QB.arrayValue(parts, [ i]).value)  == "SHARED" ) {
         isGlobal =  True;
      }
   }
   if ( asIdx ==  2 || ( asIdx ==  3 && ( isGlobal ||  preserve == "true"))  || ( asIdx ==  4 &&  isGlobal &&  preserve == "true") ) {
      bvar.type = QB.func_UCase(QB.arrayValue(parts, [ asIdx + 1]).value);
      var nextIdx = 0; // INTEGER
      nextIdx =  asIdx + 2;
      if ( bvar.type == "_UNSIGNED" ) {
         bvar.type =  bvar.type +" "  +QB.func_UCase(QB.arrayValue(parts, [ asIdx + 2]).value);
         nextIdx =  asIdx + 3;
      }
      bvar.typeId = func_FindTypeId( bvar.type);
      vnamecount = func_ListSplit(func_Join(parts ,  nextIdx,  -1, " ") , varnames);
      for ( i= 1;  i <=  vnamecount;  i= i + 1) {  if (QB.halted()) { return; }
         vname = QB.func__Trim(QB.arrayValue(varnames, [ i]).value);
         pstart = QB.func_InStr( vname, "(");
         if ( pstart >  0) {
            bvar.isArray =  True;
            arraySize = func_ConvertExpression(QB.func_Mid( vname,  pstart + 1, QB.func_Len( vname)  - pstart - 1));
            bvar.name = func_RemoveSuffix(QB.func_Left( vname,  pstart - 1));
         } else {
            bvar.isArray =  False;
            arraySize = "";
            bvar.name =  vname;
         }
         bvar.jsname = "";
         if (! bvar.isArray) {
            js =  js +"var "  + bvar.name +" = "  +func_InitTypeValue( bvar.type)  +";";
         } else {
            if (func_FindVariable( bvar.name,  findVar,  True) ) {
               js =  js +"QB.resizeArray("  + bvar.name +", ["  + arraySize +"], "  +func_InitTypeValue( bvar.type)  +", "  + preserve +");";
            } else {
               js =  js +"var "  + bvar.name +" = QB.initArray(["  + arraySize +"], "  +func_InitTypeValue( bvar.type)  +");";
            }
         }
         if ( isGlobal) {
            sub_AddVariable( bvar, globalVars);
         } else {
            sub_AddVariable( bvar, localVars);
         }
         js =  js +" // "  + bvar.type;
         if ( i <  vnamecount) {
            js =  js + GX.LF;
         }
      }
   } else {
      var vpartcount = 0; // INTEGER
      var vparts = QB.initArray([ 0], ''); // STRING
      nextIdx =  0;
      for ( i= 1;  i <= QB.func_UBound( parts);  i= i + 1) {  if (QB.halted()) { return; }
         var p = ''; // STRING
         p = QB.func_UCase(QB.arrayValue(parts, [ i]).value);
         if ( p == "DIM"  ||  p == "REDIM"  ||  p == "SHARED"  ||  p == "_PRESERVE" ) {
            nextIdx =  i + 1;
         }
      }
      vnamecount = func_ListSplit(func_Join(parts ,  nextIdx,  -1, " ") , varnames);
      for ( i= 1;  i <=  vnamecount;  i= i + 1) {  if (QB.halted()) { return; }
         vpartcount = func_SLSplit(QB.arrayValue(varnames, [ i]).value , vparts);
         bvar.name = func_RemoveSuffix(QB.arrayValue(vparts, [ 1]).value);
         if ( vpartcount ==  1) {
            bvar.type = func_DataTypeFromName( bvar.name);
         } else if ( vpartcount ==  3) {
            bvar.type = QB.func_UCase(QB.arrayValue(vparts, [ 3]).value);
         } else if ( vpartcount ==  4) {
            bvar.type = QB.func_UCase(func_Join(vparts ,  3,  -1, " "));
         } else {
         }
         bvar.typeId = func_FindTypeId( bvar.type);
         pstart = QB.func_InStr( bvar.name, "(");
         if ( pstart >  0) {
            bvar.isArray =  True;
            arraySize = func_ConvertExpression(QB.func_Mid( bvar.name,  pstart + 1, QB.func_Len( bvar.name)  - pstart - 1));
            bvar.name = func_RemoveSuffix(QB.func_Left( bvar.name,  pstart - 1));
         } else {
            bvar.isArray =  False;
            arraySize = "";
         }
         bvar.jsname = "";
         if (! bvar.isArray) {
            js =  js +"var "  + bvar.name +" = "  +func_InitTypeValue( bvar.type)  +";";
         } else {
            if (func_FindVariable( bvar.name,  findVar,  True) ) {
               js =  js +"QB.resizeArray("  + bvar.name +", ["  + arraySize +"], "  +func_InitTypeValue( bvar.type)  +", "  + preserve +");";
            } else {
               js =  js +"var "  + bvar.name +" = QB.initArray(["  + arraySize +"], "  +func_InitTypeValue( bvar.type)  +");";
            }
         }
         if ( isGlobal) {
            sub_AddVariable( bvar, globalVars);
         } else {
            sub_AddVariable( bvar, localVars);
         }
         js =  js +" // "  + bvar.type;
         if ( i <  vnamecount) {
            js =  js + GX.LF;
         }
      }
   }
   DeclareVar =  js;
return DeclareVar;
}
function func_InitTypeValue(vtype/*STRING*/) {
if (QB.halted()) { return; }
var InitTypeValue = null;
   var value = ''; // STRING
   if ( vtype == "STRING" ) {
      value = "''";
   } else if ( vtype == "_BIT"  ||  vtype == "_UNSIGNED _BIT"  ||  vtype == "_BYTE"  ||  vtype == "_UNSIGNED _BYTE"  ||  vtype == "INTEGER"  ||  vtype == "_UNSIGNED INTEGER"  ||  vtype == "LONG"  ||  vtype == "_UNSIGNED LONG"  ||  vtype == "_INTEGER64"  ||  vtype == "_UNSIGNED INTEGER64"  ||  vtype == "SINGLE"  ||  vtype == "DOUBLE"  ||  vtype == "_FLOAT"  ||  vtype == "_OFFSET"  ||  vtype == "_UNSIGNED _OFFSET" ) {
      value = "0";
   } else {
      value = "{";
      var typeId = 0; // INTEGER
      typeId = func_FindTypeId( vtype);
      var i = 0; // INTEGER
      for ( i= 1;  i <= QB.func_UBound( typeVars);  i= i + 1) {  if (QB.halted()) { return; }
         if ( typeId == QB.arrayValue(typeVars, [ i]).value .typeId) {
            value =  value +QB.arrayValue(typeVars, [ i]).value .name +":"  +func_InitTypeValue(QB.arrayValue(typeVars, [ i]).value .type)  +",";
         }
      }
      value = QB.func_Left( value, QB.func_Len( value)  - 1)  +"}";
   }
   InitTypeValue =  value;
return InitTypeValue;
}
function func_FindTypeId(typeName/*STRING*/) {
if (QB.halted()) { return; }
var FindTypeId = null;
   var id = 0; // INTEGER
   id =  -1;
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( types);  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.arrayValue(types, [ i]).value .name ==  typeName) {
         id =  i;
         break;
      }
   }
   FindTypeId =  id;
return FindTypeId;
}
function func_ConvertExpression(ex/*STRING*/) {
if (QB.halted()) { return; }
var ConvertExpression = null;
   var c = ''; // STRING
   var js = ''; // STRING
   js = "";
   var word = ''; // STRING
   word = "";
   var bvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
   var stringLiteral = 0; // INTEGER
   var i = 0; // INTEGER
   i =  1;
   while ( i <= QB.func_Len( ex)) {  if (QB.halted()) { return; }
      c = QB.func_Mid( ex,  i,  1);
      if ( c == QB.func_Chr( 34) ) {
         js =  js + c;
         stringLiteral = ! stringLiteral;
      } else if ( stringLiteral) {
         js =  js + c;
      } else {
         if ( c == " "  ||  c == ","  ||  i == QB.func_Len( ex) ) {
            if ( i == QB.func_Len( ex) ) {
               word =  word + c;
            }
            var uword = ''; // STRING
            uword = QB.func_UCase( word);
            if ( uword == "NOT" ) {
               js =  js +"!";
            } else if ( uword == "AND" ) {
               js =  js +" && ";
            } else if ( uword == "OR" ) {
               js =  js +" || ";
            } else if ( uword == "MOD" ) {
               js =  js +" % ";
            } else if ( word == "=" ) {
               js =  js +" == ";
            } else if ( word == "<>" ) {
               js =  js +" != ";
            } else if ( word == "^" ) {
               js =  js +" ** ";
            } else if ( word == ">"  ||  word == ">="  ||  word == "<"  ||  word == "<=" ) {
               js =  js +" "  + word +" ";
            } else {
               if (func_FindVariable( word,  bvar,  False) ) {
                  js =  js +" "  + bvar.jsname;
               } else {
                  if (func_FindMethod( word,  m, "FUNCTION") ) {
                     if ( m.name !=  currentMethod) {
                        js =  js +" "  + m.jsname +"()";
                     } else {
                        js =  js +" "  + word;
                     }
                  } else {
                     js =  js +" "  + word;
                  }
               }
            }
            if ( c == ","  &&  i != QB.func_Len( ex) ) {
               js =  js +",";
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
            i =  i + 1;
            while (! done &&  i <= QB.func_Len( ex)) {  if (QB.halted()) { return; }
               c2 = QB.func_Mid( ex,  i,  1);
               if ( c2 == QB.func_Chr( 34) ) {
                  stringLiteral2 = ! stringLiteral2;
               } else if (! stringLiteral2 &&  c2 == "(" ) {
                  pcount =  pcount + 1;
               } else if (! stringLiteral2 &&  c2 == ")" ) {
                  if ( pcount ==  0) {
                     done =  True;
                  } else {
                     pcount =  pcount - 1;
                  }
               }
               if (! done) {
                  ex2 =  ex2 + c2;
                  i =  i + 1;
               }
            }
            var fneg = ''; // STRING
            fneg = "";
            if (QB.func_Len( word)  >  0) {
               if (QB.func_Left( word,  1)  == "-" ) {
                  fneg = "-";
                  word = QB.func_Mid( word,  2);
               }
            }
            if (func_FindVariable( word,  bvar,  True) ) {
               if (QB.func__Trim( ex2)  == "" ) {
                  js =  js + fneg + bvar.jsname;
               } else {
                  js =  js + fneg +"QB.arrayValue("  + bvar.jsname +", ["  +func_ConvertExpression( ex2)  +"]).value";
               }
            } else if (func_FindMethod( word,  m, "FUNCTION") ) {
               js =  js + fneg + m.jsname +"("  +func_ConvertExpression( ex2)  +")";
            } else {
               if (QB.func__Trim( word)  != "" ) {
                  sub_AddWarning( i, "Missing function or array ["  + word +"]");
               }
               js =  js + fneg +"("  +func_ConvertExpression( ex2)  +")";
            }
            word = "";
         } else {
            word =  word + c;
         }
      }
      i =  i + 1;
   }
   ConvertExpression =  js;
return ConvertExpression;
}
function func_FindVariable(varname/*STRING*/,bvar/*VARIABLE*/,isArray/*INTEGER*/) {
if (QB.halted()) { return; }
var FindVariable = null;
   var found = 0; // INTEGER
   found =  False;
   var i = 0; // INTEGER
   var fvarname = ''; // STRING
   fvarname = QB.func__Trim(QB.func_UCase(func_RemoveSuffix( varname)));
   for ( i= 1;  i <= QB.func_UBound( localVars);  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.arrayValue(localVars, [ i]).value .isArray ==  isArray && QB.func_UCase(QB.arrayValue(localVars, [ i]).value .name)  ==  fvarname) {
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
      for ( i= 1;  i <= QB.func_UBound( globalVars);  i= i + 1) {  if (QB.halted()) { return; }
         if (QB.arrayValue(globalVars, [ i]).value .isArray ==  isArray && QB.func_UCase(QB.arrayValue(globalVars, [ i]).value .name)  ==  fvarname) {
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
function func_FindMethod(mname/*STRING*/,m/*METHOD*/,t/*STRING*/) {
if (QB.halted()) { return; }
var FindMethod = null;
   var found = 0; // INTEGER
   found =  False;
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( methods);  i= i + 1) {  if (QB.halted()) { return; }
      if (QB.arrayValue(methods, [ i]).value .uname == QB.func__Trim(QB.func_UCase(func_RemoveSuffix( mname)))  && QB.arrayValue(methods, [ i]).value .type ==  t) {
         found =  True;
         m.line = QB.arrayValue(methods, [ i]).value .line;
         m.type = QB.arrayValue(methods, [ i]).value .type;
         m.returnType = QB.arrayValue(methods, [ i]).value .returnType;
         m.name = QB.arrayValue(methods, [ i]).value .name;
         m.jsname = QB.arrayValue(methods, [ i]).value .jsname;
         m.uname = QB.arrayValue(methods, [ i]).value .uname;
         m.argc = QB.arrayValue(methods, [ i]).value .argc;
         m.args = QB.arrayValue(methods, [ i]).value .args;
         break;
      }
   }
   FindMethod =  found;
return FindMethod;
}
async function sub_ConvertMethods() {
if (QB.halted()) { return; }
   sub_AddJSLine( 0, "");
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( methods);  i= i + 1) {  if (QB.halted()) { return; }
      if ((QB.arrayValue(methods, [ i]).value .line !=  0) ) {
         var lastLine = 0; // INTEGER
         lastLine = QB.arrayValue(methods, [ i + 1]).value .line - 1;
         if ( lastLine <  0) {
            lastLine = QB.func_UBound( lines);
         }
         QB.resizeArray(localVars, [ 0], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, false); // VARIABLE
         var asyncModifier = ''; // STRING
         if (QB.arrayValue(methods, [ i]).value .type == "SUB" ) {
            asyncModifier = "async ";
         } else {
            asyncModifier = "";
         }
         var methodDec = ''; // STRING
         methodDec =  asyncModifier +"function "  +QB.arrayValue(methods, [ i]).value .jsname +"(";
         if (QB.arrayValue(methods, [ i]).value .argc >  0) {
            var args = QB.initArray([ 0], ''); // STRING
            var c = 0; // INTEGER
            c = func_Split(QB.arrayValue(methods, [ i]).value .args, "," , args);
            var a = 0; // INTEGER
            for ( a= 1;  a <=  c;  a= a + 1) {  if (QB.halted()) { return; }
               var v = 0; // INTEGER
               var parts = QB.initArray([ 0], ''); // STRING
               v = func_Split(QB.arrayValue(args, [ a]).value , ":" , parts);
               methodDec =  methodDec +QB.arrayValue(parts, [ 1]).value  +"/*"  +QB.arrayValue(parts, [ 2]).value  +"*/";
               if ( a <  c) {
                  methodDec =  methodDec +",";
               }
               var bvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
               bvar.name = QB.arrayValue(parts, [ 1]).value;
               bvar.type = QB.arrayValue(parts, [ 2]).value;
               bvar.typeId = func_FindTypeId( bvar.type);
               if (QB.arrayValue(parts, [ 3]).value  == "true" ) {
                  bvar.isArray =  True;
               }
               bvar.jsname = "";
               sub_AddVariable( bvar, localVars);
            }
         }
         methodDec =  methodDec +") {";
         sub_AddJSLine(QB.arrayValue(methods, [ i]).value .line,  methodDec);
         sub_AddJSLine(QB.arrayValue(methods, [ i]).value .line, "if (QB.halted()) { return; }");
         if (QB.arrayValue(methods, [ i]).value .type == "FUNCTION" ) {
            sub_AddJSLine(QB.arrayValue(methods, [ i]).value .line, "var "  +func_RemoveSuffix(QB.arrayValue(methods, [ i]).value .name)  +" = null;");
         }
         currentMethod = QB.arrayValue(methods, [ i]).value .name;
         sub_ConvertLines(QB.arrayValue(methods, [ i]).value .line + 1,  lastLine - 1, QB.arrayValue(methods, [ i]).value .name);
         if (QB.arrayValue(methods, [ i]).value .type == "FUNCTION" ) {
            sub_AddJSLine( lastLine, "return "  +func_RemoveSuffix(QB.arrayValue(methods, [ i]).value .name)  +";");
         }
         sub_AddJSLine( lastLine, "}");
      }
   }
}
async function sub_ReadLinesFromFile(filename/*STRING*/) {
if (QB.halted()) { return; }
   var fline = ''; // STRING
   var lineIndex = 0; // INTEGER
   // Open filename For Input As #1
   while (!(( 1))) {  if (QB.halted()) { return; }
      var ___v7055475 = new Array( 2);
await QB.sub_LineInput(___v7055475, false, false, undefined);
// #1 = ___v7055475[ 0];
 fline = ___v7055475[ 1];

      lineIndex =  lineIndex + 1;
      if (QB.func__Trim( fline)  != "" ) {
         while (func_EndsWith( fline, " _")) {  if (QB.halted()) { return; }
            var nextLine = ''; // STRING
            var ___v5334240 = new Array( 2);
await QB.sub_LineInput(___v5334240, false, false, undefined);
// #1 = ___v5334240[ 0];
 nextLine = ___v5334240[ 1];

            fline = QB.func_Left( fline, QB.func_Len( fline)  - 1)  + nextLine;
         }
         sub_ReadLine( lineIndex,  fline);
      }
   }
   // Close #1
}
async function sub_ReadLinesFromText(sourceText/*STRING*/) {
if (QB.halted()) { return; }
   var sourceLines = QB.initArray([ 0], ''); // STRING
   var lcount = 0; // INTEGER
   var i = 0; // INTEGER
   lcount = func_Split( sourceText,  GX.LF, sourceLines);
   for ( i= 1;  i <=  lcount;  i= i + 1) {  if (QB.halted()) { return; }
      var fline = ''; // STRING
      fline = QB.arrayValue(sourceLines, [ i]).value;
      if (QB.func__Trim( fline)  != "" ) {
         var lineIndex = 0; // INTEGER
         lineIndex =  i;
         while (func_EndsWith( fline, "_")) {  if (QB.halted()) { return; }
            i =  i + 1;
            var nextLine = ''; // STRING
            nextLine = QB.arrayValue(sourceLines, [ i]).value;
            fline = QB.func_Left( fline, QB.func_Len( fline)  - 1)  + nextLine;
         }
         sub_ReadLine( i,  fline);
      }
   }
}
async function sub_ReadLine(lineIndex/*INTEGER*/,fline/*STRING*/) {
if (QB.halted()) { return; }
   var quoteDepth = 0; // INTEGER
   quoteDepth =  0;
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_Len( fline);  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = QB.func_Mid( fline,  i,  1);
      if ( c == QB.func_Chr( 34) ) {
         if ( quoteDepth ==  0) {
            quoteDepth =  1;
         } else {
            quoteDepth =  0;
         }
      }
      if ( quoteDepth ==  0 &&  c == "'" ) {
         fline = QB.func_Left( fline,  i - 1);
         break;
      }
      if ( quoteDepth ==  0 &&  c == ":" ) {
         sub_AddLine( lineIndex, QB.func_Left( fline,  i - 1));
         fline = QB.func_Right( fline, QB.func_Len( fline)  - i);
         i =  0;
      }
   }
   if (QB.func__Trim( fline)  != "" ) {
      sub_AddLine( lineIndex,  fline);
   }
}
async function sub_FindMethods() {
if (QB.halted()) { return; }
   var i = 0; // INTEGER
   var pcount = 0; // INTEGER
   var parts = QB.initArray([ 0], ''); // STRING
   for ( i= 1;  i <= QB.func_UBound( lines);  i= i + 1) {  if (QB.halted()) { return; }
      pcount = func_Split(QB.arrayValue(lines, [ i]).value .text, " " , parts);
      var word = ''; // STRING
      word = QB.func_UCase(QB.arrayValue(parts, [ 1]).value);
      if ( word == "FUNCTION"  ||  word == "SUB" ) {
         var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
         m.line =  i;
         m.type = QB.func_UCase(QB.arrayValue(parts, [ 1]).value);
         m.name = QB.arrayValue(parts, [ 2]).value;
         m.argc =  0;
         m.args = "";
         var args = QB.initArray([ 0], {name:'',type:''}); // ARGUMENT
         if (QB.func_UBound( parts)  >  2) {
            var a = 0; // INTEGER
            var args = ''; // STRING
            args = "";
            for ( a= 3;  a <= QB.func_UBound( parts);  a= a + 1) {  if (QB.halted()) { return; }
               args =  args +QB.arrayValue(parts, [ a]).value  +" ";
            }
            args = QB.func_Mid(QB.func__Trim( args) ,  2, QB.func_Len(QB.func__Trim( args))  - 2);
            var arga = QB.initArray([ 0], ''); // STRING
            m.argc = func_ListSplit( args, arga);
            args = "";
            for ( a= 1;  a <=  m.argc;  a= a + 1) {  if (QB.halted()) { return; }
               var aparts = QB.initArray([ 0], ''); // STRING
               var apcount = 0; // INTEGER
               var argname = ''; // STRING
               var isArray = ''; // STRING
               isArray = "false";
               apcount = func_Split(QB.arrayValue(arga, [ a]).value , " " , aparts);
               argname = QB.arrayValue(aparts, [ 1]).value;
               if (func_EndsWith( argname, "()") ) {
                  isArray = "true";
                  argname = QB.func_Left( argname, QB.func_Len( argname)  - 2);
               }
               if ( apcount ==  3) {
                  args =  args + argname +":"  +QB.func_UCase(QB.arrayValue(aparts, [ 3]).value)  +":"  + isArray;
               } else {
                  args =  args + argname +":"  +func_DataTypeFromName(QB.arrayValue(aparts, [ 1]).value)  +":"  + isArray;
               }
               if ( a !=  m.argc) {
                  args =  args +",";
               }
            }
            m.args =  args;
         }
         sub_AddMethod( m, "");
      }
   }
}
function func_Split(sourceString/*STRING*/,delimiter/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var Split = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr =  sourceString;
   if ( delimiter == " " ) {
      cstr = QB.func_RTrim(QB.func_LTrim( cstr));
      p = QB.func_InStr( cstr, "  ");
      while ( p >  0) {  if (QB.halted()) { return; }
         cstr = QB.func_Mid( cstr,  1,  p - 1)  +QB.func_Mid( cstr,  p + 1);
         p = QB.func_InStr( cstr, "  ");
      }
   }
   curpos =  1;
   arrpos =  0;
   dpos = QB.func_InStr( curpos,  cstr,  delimiter);
   while (!( dpos ==  0)) {  if (QB.halted()) { return; }
      arrpos =  arrpos + 1;
      QB.resizeArray(results, [ arrpos], '', true); // STRING
      QB.arrayValue(results, [ arrpos]).value = QB.func_Mid( cstr,  curpos,  dpos - curpos);
      curpos =  dpos +QB.func_Len( delimiter);
      dpos = QB.func_InStr( curpos,  cstr,  delimiter);
   }
   arrpos =  arrpos + 1;
   QB.resizeArray(results, [ arrpos], '', true); // STRING
   QB.arrayValue(results, [ arrpos]).value = QB.func_Mid( cstr,  curpos);
   Split =  arrpos;
return Split;
}
function func_SLSplit(sourceString/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var SLSplit = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = QB.func__Trim( sourceString);
   QB.resizeArray(results, [ 0], '', false); // STRING
   var lastChar = ''; // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var count = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_Len( cstr);  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = QB.func_Mid( cstr,  i,  1);
      if ( c == QB.func_Chr( 34) ) {
         quoteMode = ! quoteMode;
         result =  result + c;
         if (! quoteMode) {
            result = GXSTR.replace( result, "\\" , "\\\\");
         }
      } else if ( c == " " ) {
         if ( quoteMode) {
            result =  result + c;
         } else if ( lastChar == " " ) {
         } else {
            count = QB.func_UBound( results)  + 1;
            QB.resizeArray(results, [ count], '', true); // STRING
            QB.arrayValue(results, [ count]).value =  result;
            result = "";
         }
      } else {
         result =  result + c;
      }
      lastChar =  c;
   }
   if ( result != "" ) {
      count = QB.func_UBound( results)  + 1;
      QB.resizeArray(results, [ count], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   SLSplit = QB.func_UBound( results);
return SLSplit;
}
function func_ListSplit(sourceString/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var ListSplit = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = QB.func__Trim( sourceString);
   QB.resizeArray(results, [ 0], '', false); // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var count = 0; // INTEGER
   var paren = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_Len( cstr);  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = QB.func_Mid( cstr,  i,  1);
      if ( c == QB.func_Chr( 34) ) {
         quoteMode = ! quoteMode;
         result =  result + c;
      } else if ( quoteMode) {
         result =  result + c;
      } else if ( c == "(" ) {
         paren =  paren + 1;
         result =  result + c;
      } else if ( c == ")" ) {
         paren =  paren - 1;
         result =  result + c;
      } else if ( paren >  0) {
         result =  result + c;
      } else if ( c == "," ) {
         count = QB.func_UBound( results)  + 1;
         QB.resizeArray(results, [ count], '', true); // STRING
         QB.arrayValue(results, [ count]).value =  result;
         result = "";
      } else {
         result =  result + c;
      }
   }
   if ( result != "" ) {
      count = QB.func_UBound( results)  + 1;
      QB.resizeArray(results, [ count], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   ListSplit = QB.func_UBound( results);
return ListSplit;
}
function func_PrintSplit(sourceString/*STRING*/,results/*STRING*/) {
if (QB.halted()) { return; }
var PrintSplit = null;
   var cstr = ''; // STRING
   var p = 0; // LONG
var curpos = 0; // LONG
var arrpos = 0; // LONG
var dpos = 0; // LONG
   cstr = QB.func__Trim( sourceString);
   QB.resizeArray(results, [ 0], '', false); // STRING
   var quoteMode = 0; // INTEGER
   var result = ''; // STRING
   var count = 0; // INTEGER
   var paren = 0; // INTEGER
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_Len( cstr);  i= i + 1) {  if (QB.halted()) { return; }
      var c = ''; // STRING
      c = QB.func_Mid( cstr,  i,  1);
      if ( c == QB.func_Chr( 34) ) {
         quoteMode = ! quoteMode;
         result =  result + c;
      } else if ( quoteMode) {
         result =  result + c;
      } else if ( c == "(" ) {
         paren =  paren + 1;
         result =  result + c;
      } else if ( c == ")" ) {
         paren =  paren - 1;
         result =  result + c;
      } else if ( paren >  0) {
         result =  result + c;
      } else if ( c == ","  ||  c == ";" ) {
         if ( result != "" ) {
            count = QB.func_UBound( results)  + 1;
            QB.resizeArray(results, [ count], '', true); // STRING
            QB.arrayValue(results, [ count]).value =  result;
            result = "";
         }
         count = QB.func_UBound( results)  + 1;
         QB.resizeArray(results, [ count], '', true); // STRING
         QB.arrayValue(results, [ count]).value =  c;
      } else {
         result =  result + c;
      }
   }
   if ( result != "" ) {
      count = QB.func_UBound( results)  + 1;
      QB.resizeArray(results, [ count], '', true); // STRING
      QB.arrayValue(results, [ count]).value =  result;
   }
   PrintSplit = QB.func_UBound( results);
return PrintSplit;
}
async function sub_PrintMethods() {
if (QB.halted()) { return; }
   await QB.sub_Print([""]);
   await QB.sub_Print(["Methods"]);
   await QB.sub_Print(["------------------------------------------------------------"]);
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( methods);  i= i + 1) {  if (QB.halted()) { return; }
      var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
      m = QB.arrayValue(methods, [ i]).value;
      await QB.sub_Print([QB.func_Str( m.line)  +": "  + m.type +" - "  + m.name +" ["  + m.jsname +"] - "  + m.returnType +" - "  + m.args]);
   }
}
async function sub_PrintTypes() {
if (QB.halted()) { return; }
   await QB.sub_Print([""]);
   await QB.sub_Print(["Types"]);
   await QB.sub_Print(["------------------------------------------------------------"]);
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( types);  i= i + 1) {  if (QB.halted()) { return; }
      var t = {line:0,name:'',argc:0,args:''}; // QBTYPE
      t = QB.arrayValue(types, [ i]).value;
      await QB.sub_Print([QB.func_Str( t.line)  +": "  + t.name]);
      var v = 0; // INTEGER
      for ( v= 1;  v <= QB.func_UBound( typeVars);  v= v + 1) {  if (QB.halted()) { return; }
         if (QB.arrayValue(typeVars, [ i]).value .typeId ==  i) {
            await QB.sub_Print(["  -> "  +QB.arrayValue(typeVars, [ v]).value .name +": "  +QB.arrayValue(typeVars, [ v]).value .type]);
         }
      }
   }
}
async function sub_AddMethod(m/*METHOD*/,prefix/*STRING*/) {
if (QB.halted()) { return; }
   var mcount = 0; // SINGLE
   mcount = QB.func_UBound( methods)  + 1;
   QB.resizeArray(methods, [ mcount], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}, true); // METHOD
   if ( m.type == "FUNCTION" ) {
      m.returnType = func_DataTypeFromName( m.name);
   }
   m.uname = QB.func_UCase(func_RemoveSuffix( m.name));
   m.jsname = func_MethodJS( m,  prefix);
   QB.arrayValue(methods, [ mcount]).value =  m;
}
async function sub_AddGXMethod(mtype/*STRING*/,mname/*STRING*/) {
if (QB.halted()) { return; }
   var mcount = 0; // SINGLE
   mcount = QB.func_UBound( methods)  + 1;
   QB.resizeArray(methods, [ mcount], {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}, true); // METHOD
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
   m.type =  mtype;
   m.name =  mname;
   m.uname = QB.func_UCase( m.name);
   m.jsname = func_GXMethodJS(func_RemoveSuffix( mname));
   if ( mtype == "FUNCTION" ) {
      m.returnType = func_DataTypeFromName( mname);
   }
   QB.arrayValue(methods, [ mcount]).value =  m;
}
async function sub_AddQBMethod(mtype/*STRING*/,mname/*STRING*/) {
if (QB.halted()) { return; }
   var m = {line:0,type:'',returnType:'',name:'',uname:'',argc:0,args:'',jsname:''}; // METHOD
   m.type =  mtype;
   m.name =  mname;
   sub_AddMethod( m, "QB.");
}
async function sub_AddLine(lineIndex/*INTEGER*/,fline/*STRING*/) {
if (QB.halted()) { return; }
   var parts = QB.initArray([ 0], ''); // STRING
   var c = 0; // INTEGER
   c = func_Split( fline, " " , parts);
   if (QB.func_UCase(QB.arrayValue(parts, [ 1]).value)  == "IF" ) {
      var thenIndex = 0; // INTEGER
      thenIndex =  0;
      var i = 0; // INTEGER
      for ( i= 1;  i <=  c;  i= i + 1) {  if (QB.halted()) { return; }
         if (QB.func_UCase(QB.arrayValue(parts, [ i]).value)  == "THEN" ) {
            thenIndex =  i;
            break;
         }
      }
      if ( thenIndex !=  c) {
         sub___AddLine( lineIndex, func_Join(parts ,  1,  thenIndex, " "));
         sub___AddLine( lineIndex, func_Join(parts ,  thenIndex + 1,  c, " "));
         sub___AddLine( lineIndex, "End If");
      } else {
         sub___AddLine( lineIndex,  fline);
      }
   } else {
      sub___AddLine( lineIndex,  fline);
   }
}
async function sub___AddLine(lineIndex/*INTEGER*/,fline/*STRING*/) {
if (QB.halted()) { return; }
   var lcount = 0; // INTEGER
   lcount = QB.func_UBound( lines)  + 1;
   QB.resizeArray(lines, [ lcount], {line:0,text:''}, true); // CODELINE
   QB.arrayValue(lines, [ lcount]).value .line =  lineIndex;
   QB.arrayValue(lines, [ lcount]).value .text =  fline;
}
async function sub_AddJSLine(sourceLine/*INTEGER*/,jsline/*STRING*/) {
if (QB.halted()) { return; }
   var lcount = 0; // INTEGER
   lcount = QB.func_UBound( jsLines)  + 1;
   QB.resizeArray(jsLines, [ lcount], {line:0,text:''}, true); // CODELINE
   QB.arrayValue(jsLines, [ lcount]).value .line =  sourceLine;
   QB.arrayValue(jsLines, [ lcount]).value .text =  jsline;
}
async function sub_AddWarning(sourceLine/*INTEGER*/,msgText/*STRING*/) {
if (QB.halted()) { return; }
   var lcount = 0; // INTEGER
   lcount = QB.func_UBound( warnings)  + 1;
   QB.resizeArray(warnings, [ lcount], {line:0,text:''}, true); // CODELINE
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
   sub_AddVariable( v, globalVars);
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
      jsname = QB.func_Mid( vname,  3, QB.func_Len( vname)  - 2);
      if (QB.func_Left( jsname,  1)  == "_" ) {
         jsname = QB.func_Right( jsname, QB.func_Len( jsname)  - 1);
      }
      v.jsname = "GX."  + jsname;
   }
   v.isConst =  True;
   sub_AddVariable( v, globalVars);
}
async function sub_AddGlobal(vname/*STRING*/,vtype/*STRING*/,arraySize/*INTEGER*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type =  vtype;
   v.name =  vname;
   v.isArray =  arraySize >  -1;
   v.arraySize =  arraySize;
   sub_AddVariable( v, globalVars);
}
async function sub_AddLocal(vname/*STRING*/,vtype/*STRING*/,arraySize/*INTEGER*/) {
if (QB.halted()) { return; }
   var v = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
   v.type =  vtype;
   v.name =  vname;
   v.isArray =  arraySize >  -1;
   v.arraySize =  arraySize;
   sub_AddVariable( v, localVars);
}
async function sub_AddVariable(bvar/*VARIABLE*/,vlist/*VARIABLE*/) {
if (QB.halted()) { return; }
   var vcount = 0; // SINGLE
   vcount = QB.func_UBound( vlist)  + 1;
   QB.resizeArray(vlist, [ vcount], {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}, true); // VARIABLE
   if ( bvar.jsname == "" ) {
      bvar.jsname = func_RemoveSuffix( bvar.name);
   }
   QB.arrayValue(vlist, [ vcount]).value =  bvar;
}
async function sub_AddType(t/*QBTYPE*/) {
if (QB.halted()) { return; }
   var tcount = 0; // SINGLE
   tcount = QB.func_UBound( types)  + 1;
   QB.resizeArray(types, [ tcount], {line:0,name:'',argc:0,args:''}, true); // QBTYPE
   QB.arrayValue(types, [ tcount]).value =  t;
}
async function sub_AddSystemType(tname/*STRING*/,args/*STRING*/) {
if (QB.halted()) { return; }
   var t = {line:0,name:'',argc:0,args:''}; // QBTYPE
   t.name =  tname;
   sub_AddType( t);
   var typeId = 0; // INTEGER
   typeId = QB.func_UBound( types);
   var count = 0; // INTEGER
   var pairs = QB.initArray([ 0], ''); // STRING
   count = func_Split( args, "," , pairs);
   var i = 0; // INTEGER
   for ( i= 1;  i <= QB.func_UBound( pairs);  i= i + 1) {  if (QB.halted()) { return; }
      var nv = QB.initArray([ 0], ''); // STRING
      count = func_Split(QB.arrayValue(pairs, [ i]).value , ":" , nv);
      var tvar = {type:'',name:'',jsname:'',isConst:0,isArray:0,arraySize:0,typeId:0}; // VARIABLE
      tvar.typeId =  typeId;
      tvar.name = QB.arrayValue(nv, [ 1]).value;
      tvar.type = QB.func_UCase(QB.arrayValue(nv, [ 2]).value);
      sub_AddVariable( tvar, typeVars);
   }
}
function func_MainEnd() {
if (QB.halted()) { return; }
var MainEnd = null;
   if ( programMethods ==  0) {
      MainEnd = QB.func_UBound( lines);
   } else {
      MainEnd = QB.arrayValue(methods, [ 1]).value .line - 1;
   }
return MainEnd;
}
function func_RemoveSuffix(vname/*STRING*/) {
if (QB.halted()) { return; }
var RemoveSuffix = null;
   var i = 0; // INTEGER
   var done = 0; // INTEGER
   var c = ''; // STRING
   vname = QB.func__Trim( vname);
   i = QB.func_Len( vname);
   while (! done) {  if (QB.halted()) { return; }
      c = QB.func_Mid( vname,  i,  1);
      if ( c == "`"  ||  c == "%"  ||  c == "&"  ||  c == "$"  ||  c == "~"  ||  c == "!" ) {
         i =  i - 1;
      } else {
         done =  True;
      }
   }
   RemoveSuffix = QB.func_Left( vname,  i);
return RemoveSuffix;
}
function func_DataTypeFromName(vname/*STRING*/) {
if (QB.halted()) { return; }
var DataTypeFromName = null;
   var dt = ''; // STRING
   if (func_EndsWith( vname, "$") ) {
      dt = "STRING";
   } else if (func_EndsWith( vname, "`") ) {
      dt = "_BIT";
   } else if (func_EndsWith( vname, "%%") ) {
      dt = "_BYTE";
   } else if (func_EndsWith( vname, "~%") ) {
      dt = "_UNSIGNED INTEGER";
   } else if (func_EndsWith( vname, "%") ) {
      dt = "INTEGER";
   } else if (func_EndsWith( vname, "~&&") ) {
      dt = "_UNSIGNED INTEGER64";
   } else if (func_EndsWith( vname, "&&") ) {
      dt = "_INTEGER64";
   } else if (func_EndsWith( vname, "~&") ) {
      dt = "_UNSIGNED LONG";
   } else if (func_EndsWith( vname, "##") ) {
      dt = "_FLOAT";
   } else if (func_EndsWith( vname, "#") ) {
      dt = "DOUBLE";
   } else if (func_EndsWith( vname, "~%&") ) {
      dt = "_UNSIGNED _OFFSET";
   } else if (func_EndsWith( vname, "%&") ) {
      dt = "_OFFSET";
   } else if (func_EndsWith( vname, "&") ) {
      dt = "LONG";
   } else if (func_EndsWith( vname, "!") ) {
      dt = "SINGLE";
   } else {
      dt = "SINGLE";
   }
   DataTypeFromName =  dt;
return DataTypeFromName;
}
function func_EndsWith(s/*STRING*/,finds/*STRING*/) {
if (QB.halted()) { return; }
var EndsWith = null;
   if (QB.func_Len( finds)  > QB.func_Len( s) ) {
      EndsWith =  False;
      return EndsWith;
   }
   if (QB.func__InStrRev( s,  finds)  == QB.func_Len( s)  -(QB.func_Len( finds)  - 1) ) {
      EndsWith =  True;
   } else {
      EndsWith =  False;
   }
return EndsWith;
}
function func_StartsWith(s/*STRING*/,finds/*STRING*/) {
if (QB.halted()) { return; }
var StartsWith = null;
   if (QB.func_Len( finds)  > QB.func_Len( s) ) {
      StartsWith =  False;
      return StartsWith;
   }
   if (QB.func_InStr( s,  finds)  ==  1) {
      StartsWith =  True;
   } else {
      StartsWith =  False;
   }
return StartsWith;
}
function func_Join(parts/*STRING*/,startIndex/*INTEGER*/,endIndex/*INTEGER*/,delimiter/*STRING*/) {
if (QB.halted()) { return; }
var Join = null;
   if ( endIndex ==  -1) {
      endIndex = QB.func_UBound( parts);
   }
   var s = ''; // STRING
   var i = 0; // INTEGER
   for ( i= startIndex;  i <=  endIndex;  i= i + 1) {  if (QB.halted()) { return; }
      s =  s +QB.arrayValue(parts, [ i]).value;
      if ( i != QB.func_UBound( parts) ) {
         s =  s + delimiter;
      }
   }
   Join =  s;
return Join;
}
function func_MethodJS(m/*METHOD*/,prefix/*STRING*/) {
if (QB.halted()) { return; }
var MethodJS = null;
   var jsname = ''; // STRING
   jsname =  prefix;
   if ( m.type == "FUNCTION" ) {
      jsname =  jsname +"func_";
   } else {
      jsname =  jsname +"sub_";
   }
   var i = 0; // INTEGER
   var c = ''; // STRING
   var a = 0; // INTEGER
   for ( i= 1;  i <= QB.func_Len( m.name);  i= i + 1) {  if (QB.halted()) { return; }
      c = QB.func_Mid( m.name,  i,  1);
      a = QB.func_Asc( c);
      if (( a >=  65 &&  a <=  90)  || ( a >=  97 &&  a <=  122)  || ( a >=  48 &&  a <=  57)  ||  a ==  95 ||  a ==  46) {
         jsname =  jsname + c;
      }
   }
   if ( m.name == "_Limit"  ||  m.name == "_Delay"  ||  m.name == "Sleep"  ||  m.name == "Input"  ||  m.name == "Print"  ||  m.name == "Fetch" ) {
      jsname = "await "  + jsname;
   }
   MethodJS =  jsname;
return MethodJS;
}
function func_GXMethodJS(mname/*STRING*/) {
if (QB.halted()) { return; }
var GXMethodJS = null;
   var jsname = ''; // STRING
   var startIdx = 0; // INTEGER
   if (QB.func_InStr( mname, "GXSTR")  ==  1) {
      jsname = "GXSTR.";
      startIdx =  7;
   } else {
      jsname = "GX.";
      startIdx =  3;
   }
   jsname =  jsname +QB.func_LCase(QB.func_Mid( mname,  startIdx,  1));
   var i = 0; // INTEGER
   var c = ''; // STRING
   var a = 0; // INTEGER
   for ( i= startIdx + 1;  i <= QB.func_Len( mname);  i= i + 1) {  if (QB.halted()) { return; }
      c = QB.func_Mid( mname,  i,  1);
      a = QB.func_Asc( c);
      if (( a >=  65 &&  a <=  90)  || ( a >=  97 &&  a <=  122)  || ( a >=  48 &&  a <=  57)  ||  a ==  95 ||  a ==  46) {
         jsname =  jsname + c;
      }
   }
   if ( mname == "GXMapLoad"  ||  mname == "GXSceneStart" ) {
      jsname = "await "  + jsname;
   }
   GXMethodJS =  jsname;
return GXMethodJS;
}
async function sub_InitGX() {
if (QB.halted()) { return; }
   sub_AddSystemType("GXPOSITION" , "x:LONG,y:LONG");
   sub_AddSystemType("GXDEVICEINPUT" , "deviceId:INTEGER,deviceType:INTEGER,inputType:INTEGER,inputId:INTEGER,inputValue:INTEGER");
   sub_AddGXConst("GX_FALSE");
   sub_AddGXConst("GX_TRUE");
   sub_AddGXConst("GXEVENT_INIT");
   sub_AddGXConst("GXEVENT_UPDATE");
   sub_AddGXConst("GXEVENT_DRAWBG");
   sub_AddGXConst("GXEVENT_DRAWMAP");
   sub_AddGXConst("GXEVENT_DRAWSCREEN");
   sub_AddGXConst("GXEVENT_MOUSEINPUT");
   sub_AddGXConst("GXEVENT_PAINTBEFORE");
   sub_AddGXConst("GXEVENT_PAINTAFTER");
   sub_AddGXConst("GXEVENT_COLLISION_TILE");
   sub_AddGXConst("GXEVENT_COLLISION_ENTITY");
   sub_AddGXConst("GXEVENT_PLAYER_ACTION");
   sub_AddGXConst("GXEVENT_ANIMATE_COMPLETE");
   sub_AddGXConst("GXANIMATE_LOOP");
   sub_AddGXConst("GXANIMATE_SINGLE");
   sub_AddGXConst("GXBG_STRETCH");
   sub_AddGXConst("GXBG_SCROLL");
   sub_AddGXConst("GXBG_WRAP");
   sub_AddGXConst("GXKEY_ESC");
   sub_AddGXConst("GXKEY_1");
   sub_AddGXConst("GXKEY_2");
   sub_AddGXConst("GXKEY_3");
   sub_AddGXConst("GXKEY_4");
   sub_AddGXConst("GXKEY_5");
   sub_AddGXConst("GXKEY_6");
   sub_AddGXConst("GXKEY_7");
   sub_AddGXConst("GXKEY_8");
   sub_AddGXConst("GXKEY_9");
   sub_AddGXConst("GXKEY_0");
   sub_AddGXConst("GXKEY_DASH");
   sub_AddGXConst("GXKEY_EQUALS");
   sub_AddGXConst("GXKEY_BACKSPACE");
   sub_AddGXConst("GXKEY_TAB");
   sub_AddGXConst("GXKEY_Q");
   sub_AddGXConst("GXKEY_W");
   sub_AddGXConst("GXKEY_E");
   sub_AddGXConst("GXKEY_R");
   sub_AddGXConst("GXKEY_T");
   sub_AddGXConst("GXKEY_Y");
   sub_AddGXConst("GXKEY_U");
   sub_AddGXConst("GXKEY_I");
   sub_AddGXConst("GXKEY_O");
   sub_AddGXConst("GXKEY_P");
   sub_AddGXConst("GXKEY_LBRACKET");
   sub_AddGXConst("GXKEY_RBRACKET");
   sub_AddGXConst("GXKEY_ENTER");
   sub_AddGXConst("GXKEY_LCTRL");
   sub_AddGXConst("GXKEY_A");
   sub_AddGXConst("GXKEY_S");
   sub_AddGXConst("GXKEY_D");
   sub_AddGXConst("GXKEY_F");
   sub_AddGXConst("GXKEY_G");
   sub_AddGXConst("GXKEY_H");
   sub_AddGXConst("GXKEY_J");
   sub_AddGXConst("GXKEY_K");
   sub_AddGXConst("GXKEY_L");
   sub_AddGXConst("GXKEY_SEMICOLON");
   sub_AddGXConst("GXKEY_QUOTE");
   sub_AddGXConst("GXKEY_BACKQUOTE");
   sub_AddGXConst("GXKEY_LSHIFT");
   sub_AddGXConst("GXKEY_BACKSLASH");
   sub_AddGXConst("GXKEY_Z");
   sub_AddGXConst("GXKEY_X");
   sub_AddGXConst("GXKEY_C");
   sub_AddGXConst("GXKEY_V");
   sub_AddGXConst("GXKEY_B");
   sub_AddGXConst("GXKEY_N");
   sub_AddGXConst("GXKEY_M");
   sub_AddGXConst("GXKEY_COMMA");
   sub_AddGXConst("GXKEY_PERIOD");
   sub_AddGXConst("GXKEY_SLASH");
   sub_AddGXConst("GXKEY_RSHIFT");
   sub_AddGXConst("GXKEY_NUMPAD_MULTIPLY");
   sub_AddGXConst("GXKEY_SPACEBAR");
   sub_AddGXConst("GXKEY_CAPSLOCK");
   sub_AddGXConst("GXKEY_F1");
   sub_AddGXConst("GXKEY_F2");
   sub_AddGXConst("GXKEY_F3");
   sub_AddGXConst("GXKEY_F4");
   sub_AddGXConst("GXKEY_F5");
   sub_AddGXConst("GXKEY_F6");
   sub_AddGXConst("GXKEY_F7");
   sub_AddGXConst("GXKEY_F8");
   sub_AddGXConst("GXKEY_F9");
   sub_AddGXConst("GXKEY_PAUSE");
   sub_AddGXConst("GXKEY_SCRLK");
   sub_AddGXConst("GXKEY_NUMPAD_7");
   sub_AddGXConst("GXKEY_NUMPAD_8");
   sub_AddGXConst("GXKEY_NUMPAD_9");
   sub_AddGXConst("GXKEY_NUMPAD_MINUS");
   sub_AddGXConst("GXKEY_NUMPAD_4");
   sub_AddGXConst("GXKEY_NUMPAD_5");
   sub_AddGXConst("GXKEY_NUMPAD_6");
   sub_AddGXConst("GXKEY_NUMPAD_PLUS");
   sub_AddGXConst("GXKEY_NUMPAD_1");
   sub_AddGXConst("GXKEY_NUMPAD_2");
   sub_AddGXConst("GXKEY_NUMPAD_3");
   sub_AddGXConst("GXKEY_NUMPAD_0");
   sub_AddGXConst("GXKEY_NUMPAD_PERIOD");
   sub_AddGXConst("GXKEY_F11");
   sub_AddGXConst("GXKEY_F12");
   sub_AddGXConst("GXKEY_NUMPAD_ENTER");
   sub_AddGXConst("GXKEY_RCTRL");
   sub_AddGXConst("GXKEY_NUMPAD_DIVIDE");
   sub_AddGXConst("GXKEY_NUMLOCK");
   sub_AddGXConst("GXKEY_HOME");
   sub_AddGXConst("GXKEY_UP");
   sub_AddGXConst("GXKEY_PAGEUP");
   sub_AddGXConst("GXKEY_LEFT");
   sub_AddGXConst("GXKEY_RIGHT");
   sub_AddGXConst("GXKEY_END");
   sub_AddGXConst("GXKEY_DOWN");
   sub_AddGXConst("GXKEY_PAGEDOWN");
   sub_AddGXConst("GXKEY_INSERT");
   sub_AddGXConst("GXKEY_DELETE");
   sub_AddGXConst("GXKEY_LWIN");
   sub_AddGXConst("GXKEY_RWIN");
   sub_AddGXConst("GXKEY_MENU");
   sub_AddGXConst("GXACTION_MOVE_LEFT");
   sub_AddGXConst("GXACTION_MOVE_RIGHT");
   sub_AddGXConst("GXACTION_MOVE_UP");
   sub_AddGXConst("GXACTION_MOVE_DOWN");
   sub_AddGXConst("GXACTION_JUMP");
   sub_AddGXConst("GXACTION_JUMP_RIGHT");
   sub_AddGXConst("GXACTION_JUMP_LEFT");
   sub_AddGXConst("GXSCENE_FOLLOW_NONE");
   sub_AddGXConst("GXSCENE_FOLLOW_ENTITY_CENTER");
   sub_AddGXConst("GXSCENE_FOLLOW_ENTITY_CENTER_X");
   sub_AddGXConst("GXSCENE_FOLLOW_ENTITY_CENTER_Y");
   sub_AddGXConst("GXSCENE_FOLLOW_ENTITY_CENTER_X_POS");
   sub_AddGXConst("GXSCENE_FOLLOW_ENTITY_CENTER_X_NEG");
   sub_AddGXConst("GXSCENE_CONSTRAIN_NONE");
   sub_AddGXConst("GXSCENE_CONSTRAIN_TO_MAP");
   sub_AddGXConst("GXFONT_DEFAULT");
   sub_AddGXConst("GXFONT_DEFAULT_BLACK");
   sub_AddGXConst("GXDEVICE_KEYBOARD");
   sub_AddGXConst("GXDEVICE_MOUSE");
   sub_AddGXConst("GXDEVICE_CONTROLLER");
   sub_AddGXConst("GXDEVICE_BUTTON");
   sub_AddGXConst("GXDEVICE_AXIS");
   sub_AddGXConst("GXDEVICE_WHEEL");
   sub_AddGXConst("GXTYPE_ENTITY");
   sub_AddGXConst("GXTYPE_FONT");
   sub_AddGXMethod("SUB" , "GXSleep");
   sub_AddGXMethod("FUNCTION" , "GXMouseX");
   sub_AddGXMethod("FUNCTION" , "GXMouseY");
   sub_AddGXMethod("FUNCTION" , "GXSoundLoad");
   sub_AddGXMethod("SUB" , "GXSoundPlay");
   sub_AddGXMethod("SUB" , "GXSoundRepeat");
   sub_AddGXMethod("SUB" , "GXSoundVolume");
   sub_AddGXMethod("SUB" , "GXSoundPause");
   sub_AddGXMethod("SUB" , "GXSoundStop");
   sub_AddGXMethod("SUB" , "GXSoundMuted");
   sub_AddGXMethod("FUNCTION" , "GXSoundMuted");
   sub_AddGXMethod("SUB" , "GXEntityAnimate");
   sub_AddGXMethod("SUB" , "GXEntityAnimateStop");
   sub_AddGXMethod("SUB" , "GXEntityAnimateMode");
   sub_AddGXMethod("FUNCTION" , "GXEntityAnimateMode");
   sub_AddGXMethod("FUNCTION" , "GXScreenEntityCreate");
   sub_AddGXMethod("FUNCTION" , "GXEntityCreate");
   sub_AddGXMethod("SUB" , "GXEntityCreate");
   sub_AddGXMethod("SUB" , "GXEntityVisible");
   sub_AddGXMethod("SUB" , "GXEntityMove");
   sub_AddGXMethod("SUB" , "GXEntityPos");
   sub_AddGXMethod("SUB" , "GXEntityVX");
   sub_AddGXMethod("FUNCTION" , "GXEntityVX");
   sub_AddGXMethod("SUB" , "GXEntityVY");
   sub_AddGXMethod("FUNCTION" , "GXEntityVY");
   sub_AddGXMethod("FUNCTION" , "GXEntityX");
   sub_AddGXMethod("FUNCTION" , "GXEntityY");
   sub_AddGXMethod("FUNCTION" , "GXEntityWidth");
   sub_AddGXMethod("FUNCTION" , "GXEntityHeight");
   sub_AddGXMethod("SUB" , "GXEntityFrameNext");
   sub_AddGXMethod("SUB" , "GXEntityFrameSet");
   sub_AddGXMethod("SUB" , "GXEntityType");
   sub_AddGXMethod("FUNCTION" , "GXEntityType");
   sub_AddGXMethod("FUNCTION" , "GXEntityUID$");
   sub_AddGXMethod("FUNCTION" , "GXFontUID$");
   sub_AddGXMethod("FUNCTION" , "GX");
   sub_AddGXMethod("SUB" , "GXEntityApplyGravity");
   sub_AddGXMethod("FUNCTION" , "GXEntityApplyGravity");
   sub_AddGXMethod("SUB" , "GXEntityCollisionOffset");
   sub_AddGXMethod("FUNCTION" , "GXEntityCollisionOffsetLeft");
   sub_AddGXMethod("FUNCTION" , "GXEntityCollisionOffsetTop");
   sub_AddGXMethod("FUNCTION" , "GXEntityCollisionOffsetRight");
   sub_AddGXMethod("FUNCTION" , "GXEntityCollisionOffsetBottom");
   sub_AddGXMethod("SUB" , "GXFullScreen");
   sub_AddGXMethod("FUNCTION" , "GXFullScreen");
   sub_AddGXMethod("FUNCTION" , "GXBackgroundAdd");
   sub_AddGXMethod("SUB" , "GXBackgroundY");
   sub_AddGXMethod("SUB" , "GXBackgroundHeight");
   sub_AddGXMethod("SUB" , "GXBackgroundClear");
   sub_AddGXMethod("SUB" , "GXSceneEmbedded");
   sub_AddGXMethod("FUNCTION" , "GXSceneEmbedded");
   sub_AddGXMethod("SUB" , "GXSceneCreate");
   sub_AddGXMethod("SUB" , "GXSceneWindowSize");
   sub_AddGXMethod("SUB" , "GXSceneScale");
   sub_AddGXMethod("SUB" , "GXSceneResize");
   sub_AddGXMethod("SUB" , "GXSceneDestroy");
   sub_AddGXMethod("SUB" , "GXCustomDraw");
   sub_AddGXMethod("FUNCTION" , "GXCustomDraw");
   sub_AddGXMethod("SUB" , "GXFrameRate");
   sub_AddGXMethod("FUNCTION" , "GXFrameRate");
   sub_AddGXMethod("FUNCTION" , "GXFrame");
   sub_AddGXMethod("SUB" , "GXSceneDraw");
   sub_AddGXMethod("SUB" , "GXSceneMove");
   sub_AddGXMethod("SUB" , "GXScenePos");
   sub_AddGXMethod("FUNCTION" , "GXSceneX");
   sub_AddGXMethod("FUNCTION" , "GXSceneY");
   sub_AddGXMethod("FUNCTION" , "GXSceneWidth");
   sub_AddGXMethod("FUNCTION" , "GXSceneHeight");
   sub_AddGXMethod("FUNCTION" , "GXSceneColumns");
   sub_AddGXMethod("FUNCTION" , "GXSceneRows");
   sub_AddGXMethod("SUB" , "GXSceneStart");
   sub_AddGXMethod("SUB" , "GXSceneUpdate");
   sub_AddGXMethod("SUB" , "GXSceneFollowEntity");
   sub_AddGXMethod("SUB" , "GXSceneConstrain");
   sub_AddGXMethod("SUB" , "GXSceneStop");
   sub_AddGXMethod("SUB" , "GXMapCreate");
   sub_AddGXMethod("FUNCTION" , "GXMapColumns");
   sub_AddGXMethod("FUNCTION" , "GXMapRows");
   sub_AddGXMethod("FUNCTION" , "GXMapLayers");
   sub_AddGXMethod("SUB" , "GXMapLayerVisible");
   sub_AddGXMethod("FUNCTION" , "GXMapLayerVisible");
   sub_AddGXMethod("SUB" , "GXMapLayerAdd");
   sub_AddGXMethod("SUB" , "GXMapLayerInsert");
   sub_AddGXMethod("SUB" , "GXMapLayerRemove");
   sub_AddGXMethod("SUB" , "GXMapResize");
   sub_AddGXMethod("SUB" , "GXMapDraw");
   sub_AddGXMethod("SUB" , "GXMapTilePosAt");
   sub_AddGXMethod("SUB" , "GXMapTile");
   sub_AddGXMethod("FUNCTION" , "GXMapTile");
   sub_AddGXMethod("FUNCTION" , "GXMapTileDepth");
   sub_AddGXMethod("SUB" , "GXMapTileAdd");
   sub_AddGXMethod("SUB" , "GXMapTileRemove");
   sub_AddGXMethod("FUNCTION" , "GXMapVersion");
   sub_AddGXMethod("SUB" , "GXMapSave");
   sub_AddGXMethod("SUB" , "GXMapLoad");
   sub_AddGXMethod("FUNCTION" , "GXMapIsometric");
   sub_AddGXMethod("SUB" , "GXMapIsometric");
   sub_AddGXMethod("SUB" , "GXSpriteDraw");
   sub_AddGXMethod("SUB" , "GXSpriteDrawScaled");
   sub_AddGXMethod("SUB" , "GXTilesetCreate");
   sub_AddGXMethod("SUB" , "GXTilesetReplaceImage");
   sub_AddGXMethod("SUB" , "GXTilesetLoad");
   sub_AddGXMethod("SUB" , "GXTilesetSave");
   sub_AddGXMethod("SUB" , "GXTilesetPos");
   sub_AddGXMethod("FUNCTION" , "GXTilesetWidth");
   sub_AddGXMethod("FUNCTION" , "GXTilesetHeight");
   sub_AddGXMethod("FUNCTION" , "GXTilesetColumns");
   sub_AddGXMethod("FUNCTION" , "GXTilesetRows");
   sub_AddGXMethod("FUNCTION" , "GXTilesetFilename");
   sub_AddGXMethod("FUNCTION" , "GXTilesetImage");
   sub_AddGXMethod("SUB" , "GXTilesetAnimationCreate");
   sub_AddGXMethod("SUB" , "GXTilesetAnimationAdd");
   sub_AddGXMethod("SUB" , "GXTilesetAnimationRemove");
   sub_AddGXMethod("FUNCTION" , "GXTilesetAnimationFrames");
   sub_AddGXMethod("FUNCTION" , "GXTilesetAnimationSpeed");
   sub_AddGXMethod("SUB" , "GXTilesetAnimationSpeed");
   sub_AddGXMethod("FUNCTION" , "GXFontCreate");
   sub_AddGXMethod("SUB" , "GXFontCreate");
   sub_AddGXMethod("FUNCTION" , "GXFontWidth");
   sub_AddGXMethod("FUNCTION" , "GXFontHeight");
   sub_AddGXMethod("FUNCTION" , "GXFontCharSpacing");
   sub_AddGXMethod("SUB" , "GXFontCharSpacing");
   sub_AddGXMethod("FUNCTION" , "GXFontLineSpacing");
   sub_AddGXMethod("SUB" , "GXFontLineSpacing");
   sub_AddGXMethod("SUB" , "GXDrawText");
   sub_AddGXMethod("FUNCTION" , "GXDebug");
   sub_AddGXMethod("SUB" , "GXDebug");
   sub_AddGXMethod("FUNCTION" , "GXDebugScreenEntities");
   sub_AddGXMethod("SUB" , "GXDebugScreenEntities");
   sub_AddGXMethod("FUNCTION" , "GXDebugFont");
   sub_AddGXMethod("SUB" , "GXDebugFont");
   sub_AddGXMethod("FUNCTION" , "GXDebugTileBorderColor");
   sub_AddGXMethod("SUB" , "GXDebugTileBorderColor");
   sub_AddGXMethod("FUNCTION" , "GXDebugEntityBorderColor");
   sub_AddGXMethod("SUB" , "GXDebugEntityBorderColor");
   sub_AddGXMethod("FUNCTION" , "GXDebugEntityCollisionColor");
   sub_AddGXMethod("SUB" , "GXDebugEntityCollisionColor");
   sub_AddGXMethod("SUB" , "GXKeyInput");
   sub_AddGXMethod("FUNCTION" , "GXKeyDown");
   sub_AddGXMethod("SUB" , "GXDeviceInputDetect");
   sub_AddGXMethod("FUNCTION" , "GXDeviceInputTest");
   sub_AddGXMethod("FUNCTION" , "GXDeviceName");
   sub_AddGXMethod("FUNCTION" , "GXDeviceTypeName");
   sub_AddGXMethod("FUNCTION" , "GXInputTypeName");
   sub_AddGXMethod("FUNCTION" , "GXKeyButtonName");
   sub_AddGXConst("GX_CR");
   sub_AddGXConst("GX_LF");
   sub_AddGXConst("GX_CRLF");
   sub_AddGXMethod("FUNCTION" , "GXSTR_LPad");
   sub_AddGXMethod("FUNCTION" , "GXSTR_RPad");
   sub_AddGXMethod("FUNCTION" , "GXSTR_Replace");
}
async function sub_InitQBMethods() {
if (QB.halted()) { return; }
   sub_AddQBMethod("FUNCTION" , "_Alpha32");
   sub_AddQBMethod("FUNCTION" , "_Atan2");
   sub_AddQBMethod("FUNCTION" , "_Blue");
   sub_AddQBMethod("FUNCTION" , "_Blue32");
   sub_AddQBMethod("SUB" , "_Delay");
   sub_AddQBMethod("FUNCTION" , "_FontWidth");
   sub_AddQBMethod("FUNCTION" , "_Green");
   sub_AddQBMethod("FUNCTION" , "_Green32");
   sub_AddQBMethod("FUNCTION" , "_Height");
   sub_AddQBMethod("FUNCTION" , "_InStrRev");
   sub_AddQBMethod("SUB" , "_Limit");
   sub_AddQBMethod("FUNCTION" , "_KeyDown");
   sub_AddQBMethod("FUNCTION" , "_KeyHit");
   sub_AddQBMethod("FUNCTION" , "_MouseButton");
   sub_AddQBMethod("FUNCTION" , "_MouseInput");
   sub_AddQBMethod("FUNCTION" , "_MouseX");
   sub_AddQBMethod("FUNCTION" , "_MouseY");
   sub_AddQBMethod("FUNCTION" , "_NewImage");
   sub_AddQBMethod("FUNCTION" , "_Pi");
   sub_AddQBMethod("SUB" , "_PrintString");
   sub_AddQBMethod("FUNCTION" , "_PrintWidth");
   sub_AddQBMethod("FUNCTION" , "_Red");
   sub_AddQBMethod("FUNCTION" , "_Red32");
   sub_AddQBMethod("FUNCTION" , "_RGB");
   sub_AddQBMethod("FUNCTION" , "_RGB32");
   sub_AddQBMethod("FUNCTION" , "_Round");
   sub_AddQBMethod("FUNCTION" , "_ScreenExists");
   sub_AddQBMethod("SUB" , "_Title");
   sub_AddQBMethod("FUNCTION" , "_Trim");
   sub_AddQBMethod("FUNCTION" , "_Width");
   sub_AddQBMethod("FUNCTION" , "Abs");
   sub_AddQBMethod("FUNCTION" , "Asc");
   sub_AddQBMethod("FUNCTION" , "Atn");
   sub_AddQBMethod("FUNCTION" , "Chr$");
   sub_AddQBMethod("SUB" , "Circle");
   sub_AddQBMethod("SUB" , "Cls");
   sub_AddQBMethod("SUB" , "Color");
   sub_AddQBMethod("FUNCTION" , "Command$");
   sub_AddQBMethod("FUNCTION" , "Cos");
   sub_AddQBMethod("FUNCTION" , "Exp");
   sub_AddQBMethod("FUNCTION" , "Fix");
   sub_AddQBMethod("SUB" , "Input");
   sub_AddQBMethod("FUNCTION" , "InKey$");
   sub_AddQBMethod("FUNCTION" , "InStr");
   sub_AddQBMethod("FUNCTION" , "Int");
   sub_AddQBMethod("FUNCTION" , "Left$");
   sub_AddQBMethod("FUNCTION" , "LCase$");
   sub_AddQBMethod("FUNCTION" , "Len");
   sub_AddQBMethod("SUB" , "Line");
   sub_AddQBMethod("SUB" , "Locate");
   sub_AddQBMethod("FUNCTION" , "Log");
   sub_AddQBMethod("FUNCTION" , "LTrim$");
   sub_AddQBMethod("FUNCTION" , "Mid$");
   sub_AddQBMethod("SUB" , "Print");
   sub_AddQBMethod("SUB" , "PSet");
   sub_AddQBMethod("FUNCTION" , "Right$");
   sub_AddQBMethod("FUNCTION" , "RTrim$");
   sub_AddQBMethod("FUNCTION" , "Rnd");
   sub_AddQBMethod("SUB" , "Screen");
   sub_AddQBMethod("FUNCTION" , "Sgn");
   sub_AddQBMethod("FUNCTION" , "Sin");
   sub_AddQBMethod("SUB" , "Sleep");
   sub_AddQBMethod("FUNCTION" , "Sqr");
   sub_AddQBMethod("FUNCTION" , "Str$");
   sub_AddQBMethod("SUB" , "Swap");
   sub_AddQBMethod("FUNCTION" , "Tan");
   sub_AddQBMethod("FUNCTION" , "Timer");
   sub_AddQBMethod("FUNCTION" , "UBound");
   sub_AddQBMethod("FUNCTION" , "UCase$");
   sub_AddQBMethod("FUNCTION" , "Val");
   sub_AddSystemType("FETCHRESPONSE" , "ok:INTEGER,status:INTEGER,statusText:STRING,text:STRING");
   sub_AddQBMethod("FUNCTION" , "Fetch");
   sub_AddQBMethod("FUNCTION" , "FromJSON");
   sub_AddQBMethod("FUNCTION" , "ToJSON");
}
this.compile = function(src) {
   sub_QBToJS(src, TEXT);
   var js = '';
   for (var i=1; i<= QB.func_UBound(jsLines); i++) {
      js += QB.arrayValue(jsLines, [i]).value.text + '\n';
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
};
