async function __qbjs_run() {
async function __qblib_lib_lang_system_bas() {
/* global constants: */ 
/* shared variables: */ 
/* static method variables: */ 
async function main() {

/* implicit variables: */ 
/* implicit variables: */ 
} await main();

async function func_Await(fn/*SINGLE*/,thisArg/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Await = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return await fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
//-------- END JS native code block --------
return Await;
}
async function sub_Await(fn/*SINGLE*/,thisArg/*SINGLE*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    await fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
//-------- END JS native code block --------
}
async function func_Call(fn/*SINGLE*/,thisArg/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Call = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
//-------- END JS native code block --------
return Call;
}
async function sub_Call(fn/*SINGLE*/,thisArg/*SINGLE*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    fn.apply(thisArg, Array.prototype.slice.call(arguments, 2));
//-------- END JS native code block --------
}
async function func_Construct(className/*SINGLE*/,thisArg/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Construct = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    if (thisArg == undefined) { thisArg = globalThis; }
    return Reflect.construct(thisArg[className], Array.prototype.slice.call(arguments, 2));
//-------- END JS native code block --------
return Construct;
}
async function func_TypeOf(o/*SINGLE*/) {
if (QB.halted()) { return; }; 
var TypeOf = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return typeof o;
//-------- END JS native code block --------
return TypeOf;
}
async function func_IsRunning() {
if (QB.halted()) { return; }; 
var IsRunning = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return QB.toBoolean(QB.running());
//-------- END JS native code block --------
return IsRunning;
}
async function sub_SetTimeout(fnCallback/*SUB*/,millis/*INTEGER*/) {
if (QB.halted()) { return; }; millis = Math.round(millis); 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
        setTimeout(fnCallback, millis);
//-------- END JS native code block --------
}
async function func_TimeInMillis() {
if (QB.halted()) { return; }; 
var TimeInMillis = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return Date.now();
//-------- END JS native code block --------
return TimeInMillis;
}
async function func_ToInteger(value/*SINGLE*/) {
if (QB.halted()) { return; }; 
var ToInteger = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    var result = parseInt(value);
    if (isNaN(result)) {
        result = 0;
    }
    return result;
//-------- END JS native code block --------
return ToInteger;
}
async function func_ToFloat(value/*SINGLE*/) {
if (QB.halted()) { return; }; 
var ToFloat = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    var result = parseFloat(value);
    if (isNaN(result)) {
        result = 0;
    }
    return result;
//-------- END JS native code block --------
return ToFloat;
}
async function func_ToBoolean(value/*SINGLE*/) {
if (QB.halted()) { return; }; 
var ToBoolean = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return value ? -1 : 0;
//-------- END JS native code block --------
return ToBoolean;
}
async function func_ToString(value/*SINGLE*/) {
if (QB.halted()) { return; }; 
var ToString = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return `${value}`;
//-------- END JS native code block --------
return ToString;
}
return {
sub_Await: sub_Await,
func_Await: func_Await,
sub_Call: sub_Call,
func_Call: func_Call,
func_Construct: func_Construct,
func_IsRunning: func_IsRunning,
sub_SetTimeout: sub_SetTimeout,
func_TypeOf: func_TypeOf,
func_TimeInMillis: func_TimeInMillis,
func_ToFloat: func_ToFloat,
func_ToInteger: func_ToInteger,
func_ToBoolean: func_ToBoolean,
func_ToString: func_ToString,
};
}
async function __qblib_lib_lang_array_bas() {
/* global constants: */ 
/* shared variables: */ 
/* static method variables: */ 
async function main() {

/* implicit variables: */ 
/* implicit variables: */ 
} await main();

async function func_At(a/*OBJECT*/,index/*INTEGER*/) {
if (QB.halted()) { return; }; index = Math.round(index); 
var At = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.at(index);
//-------- END JS native code block --------
return At;
}
async function sub_Clear(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   a.length =  0;
}
async function func_Concat(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
var Concat = null;
/* implicit variables: */ var a2 = 0;  /* SINGLE */ var a2 = QB.initArray([{l:0,u: 10}], 0);  /* SINGLE */ 
   var i = 0;  /* INTEGER */ var j = 0;  /* INTEGER */ var isArray = 0;  /* INTEGER */ 
   var ___v5334240 = 0; ___l7055475: for ( j=  1 ;  j <=  arguments.length -  1;  j= j + 1) { if (QB.halted()) { return; } ___v5334240++;   if (___v5334240 % 100 == 0) { await QB.autoLimit(); }
      a2 =  arguments[j];
      if ((await func_IsJSArray(  a2))  ) {
         //-------- BEGIN JS native code block --------
            a = a.concat(a2);
//-------- END JS native code block --------
      } else if ( a2._dimensions ) {
         var i = 0;  /* INTEGER */ 
         var ___v2895625 = 0; ___l5795186: for ( i=  1 ;  i <= (QB.func_UBound(  a2));  i= i + 1) { if (QB.halted()) { return; } ___v2895625++;   if (___v2895625 % 100 == 0) { await QB.autoLimit(); }
            await sub_Push(  a,   QB.arrayValue(a2, [ i]).value);
         } 
      } else {
         await sub_Push(  a,    a2);
      }
   } 
   Concat =  a;
return Concat;
}
async function func_Create() {
if (QB.halted()) { return; }; 
var Create = null;
/* implicit variables: */ var a2 = 0;  /* SINGLE */ 
   var i = 0;  /* INTEGER */ 
   var a = {};  /* OBJECT */ 
   a =  [];
   var ___v7747401 = 0; ___l3019480: for ( i=  0 ;  i <=  arguments.length - 1;  i= i + 1) { if (QB.halted()) { return; } ___v7747401++;   if (___v7747401 % 100 == 0) { await QB.autoLimit(); }
      a2 =  arguments[i];;
      a = (await func_Concat(  a,    a2));
   } 
   Create =  a;
return Create;
}
async function func_Every(a/*OBJECT*/,fn/*FUNCTION*/) {
if (QB.halted()) { return; }; 
var Every = null;
/* implicit variables: */ 
   fn = (await func_PrepareCallback(  fn));
   //-------- BEGIN JS native code block --------
    return QB.toBoolean(a.every(fn));    
//-------- END JS native code block --------
return Every;
}
async function func_Fill(a/*OBJECT*/,value/*SINGLE*/,start/*SINGLE*/,end/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Fill = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.fill(value, start, end);
//-------- END JS native code block --------
return Fill;
}
async function func_Filter(a/*OBJECT*/,fn/*FUNCTION*/) {
if (QB.halted()) { return; }; 
var Filter = null;
/* implicit variables: */ 
   fn = (await func_PrepareCallback(  fn));
   //-------- BEGIN JS native code block --------
    return a.filter(fn);
//-------- END JS native code block --------
return Filter;
}
async function func_IndexOf(a/*OBJECT*/,searchElement/*SINGLE*/,fromIndex/*SINGLE*/) {
if (QB.halted()) { return; }; 
var IndexOf = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.indexOf(searchElement, fromIndex);
//-------- END JS native code block --------
return IndexOf;
}
async function func_IsJSArray(a/*SINGLE*/) {
if (QB.halted()) { return; }; 
var IsJSArray = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return QB.toBoolean(Array.isArray(a));
//-------- END JS native code block --------
return IsJSArray;
}
async function func_IsQBArray(a/*SINGLE*/) {
if (QB.halted()) { return; }; 
var IsQBArray = null;
/* implicit variables: */ 
   var result = 0;  /* INTEGER */ 
   if ( a._dimensions ) {
      result = Math.round(  -  1 );
   }
   IsQBArray =  result;
return IsQBArray;
}
async function sub_Insert(a/*OBJECT*/,index/*INTEGER*/) {
if (QB.halted()) { return; }; index = Math.round(index); 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    var values = Array.from(arguments).slice(2);
    a.splice(index, 0, values);
//-------- END JS native code block --------
}
async function func_Item(a/*OBJECT*/,index/*INTEGER*/) {
if (QB.halted()) { return; }; index = Math.round(index); 
var Item = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a[index];
//-------- END JS native code block --------
return Item;
}
async function func_Join(a/*OBJECT*/,separator/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Join = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.join(separator);
//-------- END JS native code block --------
return Join;
}
async function func_LastIndexOf(a/*OBJECT*/,searchElement/*SINGLE*/,fromIndex/*SINGLE*/) {
if (QB.halted()) { return; }; 
var LastIndexOf = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    if (fromIndex == undefined) { fromIndex = a.length; }
    return a.lastIndexOf(searchElement, fromIndex);
//-------- END JS native code block --------
return LastIndexOf;
}
async function func_Length(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
var Length = null;
/* implicit variables: */ 
   Length =  0;
   if ( a.length ) {
      Length =  a.length;
   }
return Length;
}
async function func_Pop(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
var Pop = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.pop();
//-------- END JS native code block --------
return Pop;
}
async function sub_Push(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var i = 0;  /* INTEGER */ 
   var ___v7607236 = 0; ___l140176: for ( i=  1 ;  i <=  arguments.length -  1;  i= i + 1) { if (QB.halted()) { return; } ___v7607236++;   if (___v7607236 % 100 == 0) { await QB.autoLimit(); }
      //-------- BEGIN JS native code block --------
        a.push(arguments[i]);
//-------- END JS native code block --------
   } 
}
async function func_Reduce(a/*OBJECT*/,fn/*FUNCTION*/,initialValue/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Reduce = null;
/* implicit variables: */ 
   fn = (await func_PrepareCallback(  fn));
   //-------- BEGIN JS native code block --------
    if (initialValue == undefined) { 
        return a.reduce(fn);
    }
    else {
        return a.reduce(fn, initialValue);
    }
//-------- END JS native code block --------
return Reduce;
}
async function func_ReduceRight(a/*OBJECT*/,fn/*FUNCTION*/,initialValue/*SINGLE*/) {
if (QB.halted()) { return; }; 
var ReduceRight = null;
/* implicit variables: */ 
   fn = (await func_PrepareCallback(  fn));
   //-------- BEGIN JS native code block --------
    if (initialValue == undefined) { 
        return a.reduceRight(fn);
    }
    else {
        return a.reduceRight(fn, initialValue);
    }
//-------- END JS native code block --------
return ReduceRight;
}
async function sub_Remove(a/*OBJECT*/,start/*SINGLE*/,deleteCount/*SINGLE*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   if ( deleteCount ==   undefined ) {
      deleteCount =  1;
   }
   //-------- BEGIN JS native code block --------
    a.splice(start, deleteCount);
//-------- END JS native code block --------
}
async function sub_Reverse(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    a.reverse();
//-------- END JS native code block --------
}
async function func_Shift(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
var Shift = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.shift();
//-------- END JS native code block --------
return Shift;
}
async function func_Slice(a/*SINGLE*/,start/*SINGLE*/,end/*SINGLE*/) {
if (QB.halted()) { return; }; 
var Slice = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return a.slice(start, end);
//-------- END JS native code block --------
return Slice;
}
async function sub_Sort(a/*OBJECT*/,sortFn/*FUNCTION*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   if ( sortFn !=   undefined ) {
      sortFn = (await func_PrepareCallback(  sortFn));
   }
   //-------- BEGIN JS native code block --------
    a.sort(sortFn);
//-------- END JS native code block --------
}
async function sub_Splice(a/*OBJECT*/,index/*INTEGER*/,deleteCount/*SINGLE*/) {
if (QB.halted()) { return; }; index = Math.round(index); 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    var values = Array.from(arguments).slice(3);
    a.splice(index, deleteCount, values);
//-------- END JS native code block --------
}
async function sub_Unshift(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var i = 0;  /* INTEGER */ 
   var ___v7090379 = 0; ___l8144900: for ( i=  arguments.length -  1 ;  i >=  1 ;  i= i +  - 1) { if (QB.halted()) { return; } ___v7090379++;   if (___v7090379 % 100 == 0) { await QB.autoLimit(); }
      //-------- BEGIN JS native code block --------
        a.unshift(arguments[i]);
//-------- END JS native code block --------
   } 
}
async function func_ToQBArray(a/*OBJECT*/) {
if (QB.halted()) { return; }; 
var ToQBArray = null;
/* implicit variables: */ 
   var qbArray = QB.initArray([{l:0,u: a.length}], 0);  /* SINGLE */ 
   var i = 0;  /* INTEGER */ 
   var ___v4140327 = 0; ___l453528: for ( i=  1 ;  i <=  a.length;  i= i + 1) { if (QB.halted()) { return; } ___v4140327++;   if (___v4140327 % 100 == 0) { await QB.autoLimit(); }
      QB.arrayValue(qbArray, [ i]).value =  a[i - 1];
   } 
   ToQBArray =  qbArray;
return ToQBArray;
}
async function func_PrepareCallback(fn/*FUNCTION*/) {
if (QB.halted()) { return; }; 
var PrepareCallback = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    var fs = fn.toString();
    var pstart = fs.indexOf("(")
    var pend = fs.indexOf(")")
    var paramstr = fs.substring(pstart+1, pend-1);
    var params = paramstr.split(",");
    for (var i=0; i < params.length; i++) {
        var idx = params[i].indexOf("/");
        params[i] = params[i].substring(0, idx);
    }
    var bstart = fs.indexOf("{");
    var bend = fs.lastIndexOf("}");
    var body = fs.substring(bstart+1, bend-1);
    if      (params.length == 1) { return new Function(params[0], body); }
    else if (params.length == 2) { return new Function(params[0], params[1], body); }
    else if (params.length == 3) { return new Function(params[0], params[1], params[2], body); }
    else if (params.length == 4) { return new Function(params[0], params[1], params[2], params[3], body); }
//-------- END JS native code block --------
return PrepareCallback;
}
return {
func_At: func_At,
sub_Clear: sub_Clear,
func_Concat: func_Concat,
func_Create: func_Create,
func_Every: func_Every,
func_Fill: func_Fill,
func_Filter: func_Filter,
func_IndexOf: func_IndexOf,
sub_Insert: sub_Insert,
func_Item: func_Item,
func_IsJSArray: func_IsJSArray,
func_IsQBArray: func_IsQBArray,
func_Join: func_Join,
func_LastIndexOf: func_LastIndexOf,
func_Length: func_Length,
func_Pop: func_Pop,
sub_Add: sub_Push,
sub_Push: sub_Push,
func_Reduce: func_Reduce,
func_ReduceRight: func_ReduceRight,
sub_Remove: sub_Remove,
sub_Reverse: sub_Reverse,
func_Shift: func_Shift,
func_Slice: func_Slice,
sub_Sort: sub_Sort,
sub_Splice: sub_Splice,
sub_Unshift: sub_Unshift,
func_ToQBArray: func_ToQBArray,
};
}
async function __qblib_lib_lang_string_bas() {
var Sys = await __qblib_lib_lang_system_bas();
var JSArray = await __qblib_lib_lang_array_bas();
/* global constants: */ 
/* shared variables: */ 
/* static method variables: */ 
async function main() {

/* implicit variables: */ 
/* implicit variables: */ 
} await main();

async function func_EndsWith(s/*STRING*/,searchStr/*STRING*/) {
if (QB.halted()) { return; }; 
var EndsWith = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   EndsWith = (await Sys.func_ToBoolean( (await Sys.func_Call(  s.endsWith ,    s,    searchStr))));
return EndsWith;
}
async function func_FormatUsing() {
if (QB.halted()) { return; }; 
var FormatUsing = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
    return QB.formatUsing.apply(QB, arguments);
//-------- END JS native code block --------
return FormatUsing;
}
async function func_Includes(s/*STRING*/,searchStr/*STRING*/) {
if (QB.halted()) { return; }; 
var Includes = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   Includes = (await Sys.func_ToBoolean( (await Sys.func_Call(  s.includes ,    s,    searchStr))));
return Includes;
}
async function func_Match(s/*STRING*/,regex/*STRING*/,g/*OBJECT*/) {
if (QB.halted()) { return; }; 
var Match = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   var jsresult = {};  /* OBJECT */ 
   //-------- BEGIN JS native code block --------
        if (g == undefined) { g = 0; }
        jsresult = [];
        var matches = s.matchAll(new RegExp(regex, "g"));
        for (m of matches) {
            var value = null;
            if (typeof g == "string") { value = m.groups[g]; }
            else { value = m[g]; }
            if (value) { jsresult.push(value); }
        }
//-------- END JS native code block --------
   Match = (await JSArray.func_ToQBArray(  jsresult));
return Match;
}
async function sub_Match(s/*STRING*/,regex/*STRING*/,result/*STRING*/,g/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   result = (await func_Match(  s,    regex,    g));
}
async function func_PadEnd(s/*STRING*/,targetLength/*INTEGER*/,padStr/*STRING*/) {
if (QB.halted()) { return; }; targetLength = Math.round(targetLength); 
var PadEnd = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   PadEnd = (await Sys.func_Call(  s.padEnd ,    s,    targetLength,    padStr));
return PadEnd;
}
async function func_PadStart(s/*STRING*/,targetLength/*INTEGER*/,padStr/*STRING*/) {
if (QB.halted()) { return; }; targetLength = Math.round(targetLength); 
var PadStart = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   PadStart = (await Sys.func_Call(  s.padStart ,    s,    targetLength,    padStr));
return PadStart;
}
async function func_Replace(s/*STRING*/,searchStr/*STRING*/,replaceStr/*STRING*/,regex/*INTEGER*/) {
if (QB.halted()) { return; }; regex = Math.round(regex); 
var Replace = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   if ( regex) {
      Replace = (await Sys.func_Call(  s.replace ,    s,   (await Sys.func_Construct( "RegExp"  , undefined,    searchStr,   "g"))  ,    replaceStr));
   } else {
      Replace = (await Sys.func_Call(  s.replaceAll ,    s,    searchStr,    replaceStr));
   }
return Replace;
}
async function func_Search(s/*STRING*/,regex/*STRING*/) {
if (QB.halted()) { return; }; 
var Search = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   Search = (await Sys.func_Call(  s.search ,    s,   (await Sys.func_Construct( "RegExp"  , undefined,    regex,   "g"))))  +  1;
return Search;
}
async function func_Split(s/*STRING*/,delimiter/*STRING*/,regex/*INTEGER*/) {
if (QB.halted()) { return; }; regex = Math.round(regex); 
var Split = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   if ( delimiter ==   undefined ) {
      delimiter = ",";
   }
   var jsresult = {};  /* OBJECT */ 
   if ( regex) {
      jsresult = (await Sys.func_Call(  s.split ,    s,   (await Sys.func_Construct( "RegExp"  , undefined,    delimiter,   "g"))));
   } else {
      jsresult = (await Sys.func_Call(  s.split ,    s,    delimiter));
   }
   Split = (await JSArray.func_ToQBArray(  jsresult));
return Split;
}
async function sub_Split(s/*STRING*/,delimiter/*STRING*/,result/*STRING*/,regex/*INTEGER*/) {
if (QB.halted()) { return; }; regex = Math.round(regex); 
/* implicit variables: */ 
   var temp = QB.initArray([{l:0,u: 0}], 0);  /* SINGLE */ 
   temp = (await func_Split(  s,    delimiter,    regex));
   var i = 0;  /* INTEGER */ 
   QB.resizeArray(result, [{l:0,u:(QB.func_UBound(  temp))}], 0, false);  /* SINGLE */ 
   var ___v7904800 = 0; ___l8626193: for ( i=  1 ;  i <= (QB.func_UBound(  temp));  i= i + 1) { if (QB.halted()) { return; } ___v7904800++;   if (___v7904800 % 100 == 0) { await QB.autoLimit(); }
      QB.arrayValue(result, [ i]).value = QB.arrayValue(temp, [ i]).value;
   } 
}
async function func_StartsWith(s/*STRING*/,searchStr/*STRING*/) {
if (QB.halted()) { return; }; 
var StartsWith = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   StartsWith = (await Sys.func_ToBoolean( (await Sys.func_Call(  s.startsWith ,    s,    searchStr))));
return StartsWith;
}
async function func_TrimEnd(s/*STRING*/) {
if (QB.halted()) { return; }; 
var TrimEnd = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   TrimEnd = (await Sys.func_Call(  s.trimEnd ,    s));
return TrimEnd;
}
async function func_TrimStart(s/*STRING*/) {
if (QB.halted()) { return; }; 
var TrimStart = null;
/* implicit variables: */ 
   s = (await Sys.func_ToString(  s));
   TrimStart = (await Sys.func_Call(  s.trimStart ,    s));
return TrimStart;
}
return {
func_FormatUsing: func_FormatUsing,
func_EndsWith: func_EndsWith,
func_Includes: func_Includes,
sub_Match: sub_Match,
func_Match: func_Match,
func_PadEnd: func_PadEnd,
func_PadStart: func_PadStart,
func_Replace: func_Replace,
func_Search: func_Search,
sub_Split: sub_Split,
func_Split: func_Split,
func_StartsWith: func_StartsWith,
func_TrimEnd: func_TrimEnd,
func_TrimStart: func_TrimStart,
};
}
async function __qblib_lib_web_dom_bas() {
var SYS = await __qblib_lib_lang_system_bas();
var JSArray = await __qblib_lib_lang_array_bas();
/* global constants: */ 
/* shared variables: */ 
/* static method variables: */ 
async function main() {

/* implicit variables: */ 
   var e = {};  /* OBJECT */ 
   if ( QB._domElements ) {
      e = (await JSArray.func_Pop(  QB._domElements));
      var ___v9619532 = 0; ___l3735362: while ( e) { if (QB.halted()) { return; }___v9619532++;   if (___v9619532 % 100 == 0) { await QB.autoLimit(); }
         await sub_Remove(  e);
         e = (await JSArray.func_Pop(  QB._domElements));
      }
   } else {
      QB._domElements = await JSArray.func_Create();
   }
   if ( QB._domEvents ) {
      e = (await JSArray.func_Pop(  QB._domEvents));
      var ___v562369 = 0; ___l8714458: while ( e) { if (QB.halted()) { return; }___v562369++;   if (___v562369 % 100 == 0) { await QB.autoLimit(); }
         await SYS.sub_Call(  e.target.removeEventListener ,    e.target ,    e.eventType ,    e.callbackFn);
         e = (await JSArray.func_Pop(  QB._domEvents));
      }
   } else {
      QB._domEvents = await JSArray.func_Create();
   }
/* implicit variables: */ 
} await main();

async function sub_Alert(text/*STRING*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  window.alert , undefined,    text);
}
async function func_Confirm(text/*STRING*/) {
if (QB.halted()) { return; }; 
var Confirm = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
        Confirm = QB.toBoolean(confirm(text));
//-------- END JS native code block --------
return Confirm;
}
async function sub_Add(e/*OBJECT*/,parent/*OBJECT*/,beforeElement/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   if ((await SYS.func_TypeOf(  e))  ==  "string"  ) {
      e = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    e));
   }
   if ( parent ==   undefined ||  parent ==  ""  ) {
      parent = await func_Container();
   }
   if ((await SYS.func_TypeOf(  parent))  ==  "string"  ) {
      parent = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    parent));
   }
   if ( beforeElement ==  ""  ) {
      beforeElement =  undefined;
   }
   if ((await SYS.func_TypeOf(  beforeElement))  ==  "string"  ) {
      beforeElement = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    beforeElement));
   }
   await SYS.sub_Call(  parent.insertBefore ,    parent,    e,    beforeElement);
}
async function func_Create(etype/*STRING*/,parent/*OBJECT*/,content/*STRING*/,eid/*STRING*/,beforeElement/*OBJECT*/) {
if (QB.halted()) { return; }; 
var Create = null;
/* implicit variables: */ 
   var e = {};  /* OBJECT */ 
   e = (await SYS.func_Call(  document.createElement ,   await func_Document(),    etype));
   if ( eid !=   undefined &&  eid !=  ""  ) {
      e.id =  eid;
   }
   e.className = "qbjs";
   if ( content !=   undefined ) {
      if ( e.value !=   undefined ) {
         e.value =  content;
      }
      if ( e.innerHTML !=   undefined ) {
         e.innerHTML =  content;
      }
   }
   await SYS.sub_Call(  QB._domElements.push ,    QB._domElements ,    e);
   await sub_Add(  e,    parent,    beforeElement);
   Create =  e;
return Create;
}
async function sub_Create(etype/*STRING*/,parent/*OBJECT*/,content/*STRING*/,eid/*STRING*/,beforeElement/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var e = {};  /* OBJECT */ 
   e = (await func_Create(  etype,    parent,    content,    eid,    beforeElement));
}
async function sub_Event(target/*OBJECT*/,eventType/*STRING*/,callbackFn/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
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
//-------- END JS native code block --------
}
async function func_Container() {
if (QB.halted()) { return; }; 
var Container = null;
/* implicit variables: */ 
   Container = (await func_Get( "gx-container"));
return Container;
}
async function func_Window() {
if (QB.halted()) { return; }; 
var Window = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
        return window;
//-------- END JS native code block --------
return Window;
}
async function func_Document() {
if (QB.halted()) { return; }; 
var Document = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
        return document;
//-------- END JS native code block --------
return Document;
}
async function func_Get(eid/*STRING*/) {
if (QB.halted()) { return; }; 
var Get = null;
/* implicit variables: */ 
   Get = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    eid));
return Get;
}
async function func_GetAttribute(e/*OBJECT*/,attributeName/*STRING*/) {
if (QB.halted()) { return; }; 
var GetAttribute = null;
/* implicit variables: */ 
   if ((await SYS.func_TypeOf(  e))  ==  "string"  ) {
      e = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    e));
   }
   GetAttribute = (await SYS.func_Call(  e.getAttribute ,    e,    attributeName));
return GetAttribute;
}
async function sub_SetAttribute(e/*OBJECT*/,attributeName/*STRING*/,attributeValue/*STRING*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   if ((await SYS.func_TypeOf(  e))  ==  "string"  ) {
      e = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    e));
   }
   await SYS.sub_Call(  e.setAttribute ,    e,    attributeName,    attributeValue);
}
async function func_GetAttributeNames(e/*OBJECT*/) {
if (QB.halted()) { return; }; 
var GetAttributeNames = null;
/* implicit variables: */ 
   if ((await SYS.func_TypeOf(  e))  ==  "string"  ) {
      e = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    e));
   }
   GetAttributeNames = (await JSArray.func_ToQBArray( (await SYS.func_Call(  e.getAttributeNames ,    e))));
return GetAttributeNames;
}
async function func_GetElementsByClassName(className/*STRING*/,e/*OBJECT*/) {
if (QB.halted()) { return; }; 
var GetElementsByClassName = null;
/* implicit variables: */ 
   if ( e ==   undefined ) {
      e = await func_Document();
   } else if ((await SYS.func_TypeOf(  e))  ==  "string"  ) {
      e = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    e));
   }
   var elements = {};  /* OBJECT */ 
   elements = (await SYS.func_Call(  e.getElementsByClassName ,    e,    className));
   GetElementsByClassName = (await JSArray.func_ToQBArray(  elements));
return GetElementsByClassName;
}
async function func_GetImage(imageId/*INTEGER*/) {
if (QB.halted()) { return; }; imageId = Math.round(imageId); 
var GetImage = null;
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
        GetImage = QB.getImage(imageId);
//-------- END JS native code block --------
return GetImage;
}
async function sub_Remove(e/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   if ((await SYS.func_TypeOf(  e))  ==  "string"  ) {
      e = (await SYS.func_Call(  document.getElementById ,   await func_Document(),    e));
   }
   await SYS.sub_Call(  e.remove ,    e);
}
async function func_Prompt(text/*STRING*/,defaultValue/*STRING*/) {
if (QB.halted()) { return; }; 
var Prompt = null;
/* implicit variables: */ 
   var result = '';  /* STRING */ 
   result = (await SYS.func_Call(  window.prompt , undefined,    text,    defaultValue));
   if (! result) {
      result = "";
   }
   Prompt =  result;
return Prompt;
}
async function sub_DialogClose(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  element.close ,    element);
}
async function sub_DialogShowModal(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  element.showModal ,    element);
}
async function sub_DialogShow(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  element.show ,    element);
}
async function sub_Focus(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  element.focus ,    element);
}
async function func_HasFocus(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
var HasFocus = null;
/* implicit variables: */ 
   HasFocus = (await SYS.func_ToBoolean(  document.activeElement ==   element));
return HasFocus;
}
async function sub_SelectAll(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  element.select ,    element);
}
async function sub_RequestFullscreen(element/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  element.requestFullscreen ,    element);
}
async function sub_StopPropagation(e/*OBJECT*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  e.stopPropagation ,    e);
}
async function sub_RequestAnimationFrame(fnCallback/*SUB*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   await SYS.sub_Call(  window.requestAnimationFrame , undefined,    fnCallback);
}
return {
sub_Add: sub_Add,
sub_Alert: sub_Alert,
func_Confirm: func_Confirm,
sub_Create: sub_Create,
func_Create: func_Create,
sub_Event: sub_Event,
func_Container: func_Container,
func_Get: func_Get,
func_GetImage: func_GetImage,
sub_Remove: sub_Remove,
func_GetAttribute: func_GetAttribute,
sub_SetAttribute: sub_SetAttribute,
func_GetAttributeNames: func_GetAttributeNames,
func_GetElementsByClassName: func_GetElementsByClassName,
func_Prompt: func_Prompt,
sub_DialogClose: sub_DialogClose,
sub_DialogShowModal: sub_DialogShowModal,
sub_DialogShow: sub_DialogShow,
sub_Focus: sub_Focus,
func_HasFocus: func_HasFocus,
sub_SelectAll: sub_SelectAll,
sub_RequestFullscreen: sub_RequestFullscreen,
sub_StopPropagation: sub_StopPropagation,
sub_RequestAnimationFrame: sub_RequestAnimationFrame,
func_Document: func_Document,
func_Window: func_Window,
};
}
async function __qblib_lib_web_console_bas() {
var String = await __qblib_lib_lang_string_bas();
/* global constants: */ const NONE  =   "NONE"; const FATAL  =   "FATAL"; const ERROR  =   "ERROR"; const WARN  =   "WARN"; const INFO  =   "INFO"; const DEBUG  =   "DEBUG"; const TRACE  =   "TRACE"; const ALL  =   "ALL"; 
/* shared variables: */ var levelMap = QB.initArray([0], 0); var level = 0; 
/* static method variables: */ 
async function main() {

/* implicit variables: */ 
   QB.resizeArray(levelMap, [{l:0,u: 0}], 0, false);  /* SINGLE */ 
   QB.arrayValue(levelMap, [ NONE]).value =  0;
   QB.arrayValue(levelMap, [ FATAL]).value =  1;
   QB.arrayValue(levelMap, [ ERROR]).value =  2;
   QB.arrayValue(levelMap, [ WARN]).value =  3;
   QB.arrayValue(levelMap, [ INFO]).value =  4;
   QB.arrayValue(levelMap, [ DEBUG]).value =  5;
   QB.arrayValue(levelMap, [ TRACE]).value =  6;
   QB.arrayValue(levelMap, [ ALL]).value =  7;
   level = 0;  /* INTEGER */ 
   level = Math.round(  4 );
/* implicit variables: */ 
} await main();

async function sub_LogLevel(newLevel/*SINGLE*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   level = Math.round( QB.arrayValue(levelMap, [ newLevel]).value );
}
async function func_LogLevel() {
if (QB.halted()) { return; }; 
var LogLevel = null;
/* implicit variables: */ 
   LogLevel =  level;
return LogLevel;
}
async function sub_Log(msg/*STRING*/,msgType/*STRING*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   if ( msgType ==   undefined ) {
      msgType =  INFO;
   }
   var ll = 0;  /* INTEGER */ 
   ll = Math.round( QB.arrayValue(levelMap, [ msgType]).value );
   if ( ll > level) {
      return;
   }
   //-------- BEGIN JS native code block --------
        var t = document.querySelector("#warning-container table");
        if (!t || IDE.mode() != "ide") { 
            console.log(msgType + ":" + msg);
            return; 
        }
        var errorLine = await IDE.getErrorLine(new Error(), 1);
        var tr = document.createElement("tr");
        IDE.addWarningCell(tr, msgType);
        IDE.addWarningCell(tr, ":");
        IDE.addWarningCell(tr, errorLine);
        IDE.addWarningCell(tr, ":");
        IDE.addWarningCell(tr, await func_EscapeHtml(msg), "99%");
        tr.codeLine = errorLine - 1;
        tr.onclick = IDE.gotoWarning;
        t.append(tr);
        var container = document.getElementById("output-content");
        container.scrollTop = container.scrollHeight;
        IDE.changeTab("console");
        IDE.showConsole(true);
//-------- END JS native code block --------
}
async function sub_Echo(msg/*STRING*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   //-------- BEGIN JS native code block --------
        var t = document.querySelector("#warning-container table");
        if (!t || IDE.mode() != "ide") {
            console.log(msg); 
            return;
        }
        var tr = document.createElement("tr");
        IDE.addWarningCell(tr, await func_EscapeHtml(msg));
        tr.firstChild.colSpan = "5";
        t.append(tr);
        var container = document.getElementById("output-content");
        container.scrollTop = container.scrollHeight;
        IDE.changeTab("console");
        IDE.showConsole(true);
//-------- END JS native code block --------
}
async function func_EscapeHtml(text/*STRING*/) {
if (QB.halted()) { return; }; 
var EscapeHtml = null;
/* implicit variables: */ 
   text = (await String.func_Replace(  text,   "&"  ,   "&amp;"));
   text = (await String.func_Replace(  text,   "<"  ,   "&lt;"));
   text = (await String.func_Replace(  text,   ">"  ,   "&gt;"));
   text = (await String.func_Replace(  text,   (QB.func_Chr(  34))  ,   "&quot;"));
   text = (await String.func_Replace(  text,   "'"  ,   "&#039;"));
   EscapeHtml =  text;
return EscapeHtml;
}
return {
NONE: NONE,
FATAL: FATAL,
ERROR: ERROR,
WARN: WARN,
INFO: INFO,
DEBUG: DEBUG,
TRACE: TRACE,
ALL: ALL,
sub_Log: sub_Log,
sub_LogLevel: sub_LogLevel,
func_LogLevel: func_LogLevel,
sub_Echo: sub_Echo,
};
}
var Dom = await __qblib_lib_web_dom_bas();
var Console = await __qblib_lib_web_console_bas();
var String = await __qblib_lib_lang_string_bas();
var JSArray = await __qblib_lib_lang_array_bas();
var Sys = await __qblib_lib_lang_system_bas();
/* global constants: */ 
/* shared variables: */ var keywords = {}; var tbody = {}; var filter = {}; var sconverter = {}; var imgQBJS = ''; var imgQB = ''; var imgQB64 = ''; var imgQBPE = ''; 
/* static method variables: */ 
async function main() {
QB.start(); QB.setTypeMap({ GXPOSITION:[{ name: 'x', type: 'LONG' }, { name: 'y', type: 'LONG' }], GXDEVICEINPUT:[{ name: 'deviceId', type: 'INTEGER' }, { name: 'deviceType', type: 'INTEGER' }, { name: 'inputType', type: 'INTEGER' }, { name: 'inputId', type: 'INTEGER' }, { name: 'inputValue', type: 'INTEGER' }], FETCHRESPONSE:[{ name: 'ok', type: 'INTEGER' }, { name: 'status', type: 'INTEGER' }, { name: 'statusText', type: 'STRING' }, { name: 'text', type: 'STRING' }], KEYWORD:[{ name: 'name', type: 'STRING' }, { name: 'sname', type: 'STRING' }, { name: 'level', type: 'STRING' }, { name: 'levelDetail', type: 'STRING' }, { name: 'qb', type: 'INTEGER' }, { name: 'qbjs', type: 'INTEGER' }, { name: 'qb64', type: 'INTEGER' }, { name: 'qbpe', type: 'INTEGER' }]});
    await GX.registerGameEvents(function(e){});
    QB.sub_Screen(0);

/* implicit variables: */ 
   await QB.sub_IncludeJS( "/qbjs/util/showdown.min.js");
   keywords = {};  /* OBJECT */ tbody = {};  /* OBJECT */ filter = {};  /* OBJECT */ sconverter = {};  /* OBJECT */ 
   sconverter = (await Sys.func_Construct( "Converter"  ,    globalThis.showdown));
   await Sys.sub_Call(  sconverter.setFlavor ,    sconverter,   "github");
   keywords = await JSArray.func_Create();
   imgQBJS = '';  /* STRING */ imgQB = '';  /* STRING */ imgQB64 = '';  /* STRING */ imgQBPE = '';  /* STRING */ 
   imgQBJS = "../../logo.png";
   imgQB = "https://softradar.com/static/products/qbasic/qbasic-logo.jpg";
   imgQB64 = "https://qb64phoenix.com/qb64wiki/images/9/91/Qb64.png";
   imgQBPE = "https://qb64phoenix.com/qb64wiki/images/0/07/Qbpe.png";
   var style = {};  /* OBJECT */ 
   style = (await Dom.func_Create( "style"  ,    document.head));
   style.innerText = "body, table, select { font-size: 14px; color #333 } "  + ".keyword-table { width: 100%; color: #333 } "  + ".keyword-table td { vertical-align: left; padding: 2px 4px } "  + ".keyword-table th { background-color: #ccc; padding: 4px } "  + ".keyword-table td { background-color: #efefef }";
   var panel = {};  /* OBJECT */ var container = {};  /* OBJECT */ var canvas = {};  /* OBJECT */ 
   canvas = (await Dom.func_GetImage(  0));
   canvas.style.display = "none";
   container = await Dom.func_Container();
   container.style.backgroundColor = "#fff";
   container.style.textAlign = "center";
   container.style.overflow = "auto";
   panel = (await Dom.func_Create( "div"));
   panel.style.display = "inline-block";
   panel.style.color = "#333";
   panel.style.textAlign = "left";
   panel.style.width = "75%";
   await Dom.sub_Create( "h1"  ,    panel,   "QBJS - QBasic Family Compatibility");
   var filterPanel = {};  /* OBJECT */ 
   filterPanel = (await Dom.func_Create( "div"  ,    panel));
   filterPanel.style.textAlign = "right";
   await Dom.sub_Create( "span"  ,    filterPanel,   "Filter: ");
   filter = (await Dom.func_Create( "select"  ,    filterPanel));
   await Dom.sub_Create( "option"  ,    filter,   "All");
   await Dom.sub_Create( "option"  ,    filter,   "QBJS");
   await Dom.sub_Create( "option"  ,    filter,   "QBasic");
   await Dom.sub_Create( "option"  ,    filter,   "QB64");
   await Dom.sub_Create( "option"  ,    filter,   "QB64 Phoenix");
   await Dom.sub_Event(  filter,   "change"  ,    sub_RefreshTable);
   await sub_LoadSupported();
   await sub_LoadUnsupported();
   await JSArray.sub_Sort(  keywords,    func_SortByName);
   var table = {};  /* OBJECT */ var tr = {};  /* OBJECT */ var th = {};  /* OBJECT */ var thead = {};  /* OBJECT */ 
   table = (await Dom.func_Create( "table"  ,    panel));
   table.className = "keyword-table";
   thead = (await Dom.func_Create( "thead"  ,    table));
   tr = (await Dom.func_Create( "tr"  ,    thead));
   await Dom.sub_Create( "th"  ,    tr,   "Keyword");
   th = (await Dom.func_Create( "th"  ,    tr,   "Platforms"));
   th.colSpan =  4;
   th = (await Dom.func_Create( "th"  ,    tr,   "QBJS Support Detail"));
   th.colSpan =  2;
   tbody = (await Dom.func_Create( "tbody"  ,    table));
   await sub_RefreshTable();
/* implicit variables: */ 
QB.end();
} await main();

async function sub_RefreshTable() {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   tbody.innerHTML = "";
   var i = 0;  /* INTEGER */ 
   var ___v3640187 = 0; ___l9495566: for ( i=  0 ;  i <= (await JSArray.func_Length(  keywords))  -  1;  i= i + 1) { if (QB.halted()) { return; } ___v3640187++;   if (___v3640187 % 100 == 0) { await QB.autoLimit(); }
      var k = {name:'',sname:'',level:'',levelDetail:'',qb:0,qbjs:0,qb64:0,qbpe:0};  /* KEYWORD */ 
      k = (await JSArray.func_Item(  keywords,    i));
      if ( filter.value ==  "All"  || ( filter.value ==  "QBJS"  &  k.qbjs)  || ( filter.value ==  "QBasic"  &  k.qb)  || ( filter.value ==  "QB64"  &  k.qb64)  || ( filter.value ==  "QB64 Phoenix"  &  k.qbpe)  ) {
         await sub_AddKeywordRow(  tbody,    k);
      }
   } 
}
async function sub_AddKeywordRow(table/*OBJECT*/,k/*KEYWORD*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var tr = {};  /* OBJECT */ var td = {};  /* OBJECT */ 
   tr = (await Dom.func_Create( "tr"  ,    table));
   td = (await Dom.func_Create( "td"  ,    tr,    k.name));
   td.style.whiteSpace = "nowrap";
   td = (await Dom.func_Create( "td"  ,    tr));
   if ( k.qbjs ) {
      await sub_AddImage(  td,    imgQBJS);
   }
   td = (await Dom.func_Create( "td"  ,    tr));
   if ( k.qb ) {
      await sub_AddImage(  td,    imgQB);
   }
   td = (await Dom.func_Create( "td"  ,    tr));
   if ( k.qb64 ) {
      await sub_AddImage(  td,    imgQB64);
   }
   td = (await Dom.func_Create( "td"  ,    tr));
   if ( k.qbpe ) {
      await sub_AddImage(  td,    imgQBPE);
   }
   await Dom.sub_Create( "td"  ,    tr,    k.level);
   await Dom.sub_Create( "td"  ,    tr,    k.levelDetail);
}
async function func_SortByName(a/*SINGLE*/,b/*SINGLE*/) {
if (QB.halted()) { return; }; 
var SortByName = null;
/* implicit variables: */ 
   if ( a.sname < b.sname ) {
      SortByName =  - 1;
   } else if ( a.sname > b.sname ) {
      SortByName =  1;
   }
return SortByName;
}
async function sub_AddImage(parent/*OBJECT*/,path/*STRING*/) {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var img = {};  /* OBJECT */ 
   img = (await Dom.func_Create( "img"  ,    parent));
   img.src =  path;
   img.height = "24";
   img.width = "24";
   img.style.marginRight = "2px";
}
async function func_DownloadText(url/*STRING*/) {
if (QB.halted()) { return; }; 
var DownloadText = null;
/* implicit variables: */ 
   var result = '';  /* STRING */ 
   await QB.sub_Open(url, QB.BINARY, 1);
   if (~(QB.func_EOF(  1))  ) {
      result = (QB.func_Space( (QB.func_LOF(  1))));
      var ___v5248684 = { value: result }; QB.sub_Get(1, undefined, 'STRING', ___v5248684); result = ___v5248684.value;
   }
   QB.sub_Close(1);
   DownloadText =  result;
return DownloadText;
}
async function sub_LoadSupported() {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var idx = 0;  /* INTEGER */ 
   var raw = '';  /* STRING */ var tables = QB.initArray([{l:0,u: 2}], '');  /* STRING */ 
   raw = (await func_DownloadText( "https://raw.githubusercontent.com/wiki/boxgaming/qbjs/Supported-Keywords.md"));
   var i = 0;  /* INTEGER */ 
   var ___v535045 = 0; ___l7671117: for ( i=  1 ;  i <=  5;  i= i + 1) { if (QB.halted()) { return; } ___v535045++;   if (___v535045 % 100 == 0) { await QB.autoLimit(); }
      idx = Math.round( (QB.func_InStr(  raw,   "--|"  + (QB.func_Chr(  10)))) );
      raw = (QB.func_Mid(  raw,    idx + 4));
      idx = Math.round( (QB.func_InStr(  raw,   "|"  + (QB.func_Chr(  10))  + (QB.func_Chr(  10)))) );
      QB.arrayValue(tables, [ i]).value = (QB.func_Mid(  raw,    1 ,    idx - 1));
      if ( i ==   3 ) {
         idx = Math.round( (QB.func_InStr(  raw,   "## QB64PE Keywords")) );
      }
      raw = (QB.func_Mid(  raw,    idx + 2));
   } 
   var ___v4687001 = 0; ___l5924582: for ( i=  1 ;  i <=  5;  i= i + 1) { if (QB.halted()) { return; } ___v4687001++;   if (___v4687001 % 100 == 0) { await QB.autoLimit(); }
      var lines = QB.initArray([{l:0,u: 0}], '');  /* STRING */ 
      lines = (await String.func_Split( QB.arrayValue(tables, [ i]).value  ,   (QB.func_Chr(  10))));
      var j = 0;  /* INTEGER */ 
      var ___v6226967 = 0; ___l2981654: for ( j=  1 ;  j <= (QB.func_UBound(  lines));  j= j + 1) { if (QB.halted()) { return; } ___v6226967++;   if (___v6226967 % 100 == 0) { await QB.autoLimit(); }
         var parts = QB.initArray([{l:0,u: 0}], '');  /* STRING */ 
         await String.sub_Split( QB.arrayValue(lines, [ j]).value  ,   "|"  ,    parts);
         var k = {name:'',sname:'',level:'',levelDetail:'',qb:0,qbjs:0,qb64:0,qbpe:0};  /* KEYWORD */ 
         k.name = QB.arrayValue(parts, [ 2]).value;
         if ((QB.func_Mid(  k.name ,    1 ,    1))  ==  "["  ) {
            idx = Math.round( (QB.func_InStr(  k.name ,   "]")) );
            k.name = (QB.func_Mid(  k.name ,    2 ,    idx - 2));
         }
         k.sname = (QB.func_UCase(  k.name));
         var firstChar = '';  /* STRING */ 
         firstChar = (QB.func_Mid(  k.sname ,    1 ,    1));
         if ( firstChar ==  "_"  |  firstChar ==  "$"  ) {
            k.sname = (QB.func_UCase( (QB.func_Mid(  k.sname ,    2))));
         }
         if ( i ==   1 ) {
            k.qb = Math.round(  -  1 );
         }
         if ( i !=   3 ) {
            k.level = QB.arrayValue(parts, [ 3]).value;
            k.levelDetail = (await Sys.func_Call(  sconverter.makeHtml ,    sconverter,   QB.arrayValue(parts, [ 4]).value));
            if ( i < 3 ) {
               k.qb64 = Math.round(  -  1 );
            }
            k.qbpe = Math.round(  - 1 );
         }
         k.qbjs = Math.round(  - 1 );
         await JSArray.sub_Push(  keywords,    k);
      } 
   } 
}
async function sub_LoadUnsupported() {
if (QB.halted()) { return; }; 
/* implicit variables: */ 
   var idx = 0;  /* INTEGER */ 
   var raw = '';  /* STRING */ var tables = QB.initArray([{l:0,u: 3}], '');  /* STRING */ 
   raw = (await func_DownloadText( "https://raw.githubusercontent.com/wiki/boxgaming/qbjs/Unsupported-Keywords.md"));
   var i = 0;  /* INTEGER */ 
   var ___v2637929 = 0; ___l6478212: for ( i=  1 ;  i <=  3;  i= i + 1) { if (QB.halted()) { return; } ___v2637929++;   if (___v2637929 % 100 == 0) { await QB.autoLimit(); }
      idx = Math.round( (QB.func_InStr(  raw,   "----"  + (QB.func_Chr(  10)))) );
      raw = (QB.func_Mid(  raw,    idx + 4));
      idx = Math.round( (QB.func_InStr(  raw,   "|"  + (QB.func_Chr(  10))  + (QB.func_Chr(  10)))) );
      QB.arrayValue(tables, [ i]).value = (QB.func_Mid(  raw,    1 ,    idx - 1));
      raw = (QB.func_Mid(  raw,    idx + 2));
   } 
   var ___v8298016 = 0; ___l2793421: for ( i=  1 ;  i <=  3;  i= i + 1) { if (QB.halted()) { return; } ___v8298016++;   if (___v8298016 % 100 == 0) { await QB.autoLimit(); }
      var lines = QB.initArray([{l:0,u: 0}], '');  /* STRING */ 
      await String.sub_Split( QB.arrayValue(tables, [ i]).value  ,   (QB.func_Chr(  10))  ,    lines);
      var j = 0;  /* INTEGER */ 
      var ___v5891630 = 0; ___l8246021: for ( j=  1 ;  j <= (QB.func_UBound(  lines));  j= j + 1) { if (QB.halted()) { return; } ___v5891630++;   if (___v5891630 % 100 == 0) { await QB.autoLimit(); }
         if ((QB.func__Trim( QB.arrayValue(lines, [ j]).value))  ==  ""  ) {
            continue;
         }
         var parts = QB.initArray([{l:0,u: 0}], '');  /* STRING */ 
         await String.sub_Split( QB.arrayValue(lines, [ j]).value  ,   "|"  ,    parts);
         var k = {name:'',sname:'',level:'',levelDetail:'',qb:0,qbjs:0,qb64:0,qbpe:0};  /* KEYWORD */ 
         k.name = QB.arrayValue(parts, [ 1]).value;
         if ( i ==   1 ) {
            if ((QB.func_Mid(  k.name ,    1 ,    1))  ==  "_"  ) {
               k.name = (QB.func_Mid(  k.name ,    2 ,   (QB.func_Len(  k.name))  - 2));
            } else {
               k.qb64 = Math.round(  - 1 );
               k.qbpe = Math.round(  - 1 );
            }
         }
         if ( i ==   1 ) {
            k.qb = Math.round(  1 );
         } else if ( i ==   2 ) {
            k.qb64 = Math.round(  - 1 );
            k.qbpe = Math.round(  - 1 );
         } else {
            k.qbpe = Math.round(  - 1 );
         }
         k.sname = (QB.func_UCase(  k.name));
         var firstChar = '';  /* STRING */ 
         firstChar = (QB.func_Mid(  k.sname ,    1 ,    1));
         if ( firstChar ==  "_"  |  firstChar ==  "$"  ) {
            k.sname = (QB.func_UCase( (QB.func_Mid(  k.sname ,    2))));
         }
         var issue = '';  /* STRING */ var issueUrl = '';  /* STRING */ 
         issue = (QB.func__Trim( QB.arrayValue(parts, [ 3]).value));
         if ((QB.func_Mid(  issue,    1 ,    1))  ==  "["  ) {
            k.level = "<i>Planned</i>";
            k.levelDetail = (await Sys.func_Call(  sconverter.makeHtml ,    sconverter,    issue));
         }
         await JSArray.sub_Push(  keywords,    k);
      } 
   } 
}
}