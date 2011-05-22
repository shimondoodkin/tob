
var simple_te={ // a simple template engine, returns a function, from underscore.js
  settings:{
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  },
  template : function(str, data) {
    var c  = simple_te.settings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  }
};


var template=require('./index.js');

var fs=require('fs');
template.load=function(filename,callback)
{
 var data=fs.readFileSync(filename);
 //console.log(filename);
 //console.log(data);
 callback(simple_te.template(data.toString()));
};

var test=template('test.html');
setInterval(function(){
console.log(test({name:"Shimon Doodkin"}));
},1000);
//foo.kill();foo=null; 