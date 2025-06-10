(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("text", function(conf, parserConf) {
    return {
        token: function(stream, state) {
          stream.next(); // Move to the next character
          return null; // No specific styling
        }
      };
});

CodeMirror.defineMIME("text/plain", "text");

});
