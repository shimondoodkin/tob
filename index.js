// bsd/mit licensed , by Shimon Doodkin
// feel free to copy to your template engines

// wanted functionality:
//0 when my file changed reload this and notify 
//1 rerender parent when a child is updated
//2 notify children when i updated
//3 reload children if required?.

var fs=require("fs");


var dummy_te={ // a dummy template engine, returns a function
 settings:{},
 template:function(f,cb)
 {
  var data=fs.readFileSync(f).toString();
  var fn=function(variables){return "text:"+data+" ; variables:"+JSON.stringify(variables);}; 
  cb(fn);
 }
}

defaultload=function(filename,callback)
{
 console.log(filename);
 dummy_te.template(filename,function(result_template){
  console.log(result_template.toString());
  callback(result_template);
 });
};

/*
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
defaultload=function(filename,callback)
{
 var data=fs.readFileSync(filename);
 //console.log(filename);
 //console.log(data);
 callback(simple_te.template(data.toString()));
};
*/

var tObserver = function(filename,parent,callback)
{
 if(!this.istObserver)
  return new tObserver(filename,parent,callback);
 var self=this;

 self.filename=filename;
 if(parent&&parent.isGetFunction){ parent=parent.self;}
 self.parent=parent;
 if(parent&&parent.add)
 {
  parent.add(self);
 }

 
 //self.get=function(data){return self.template(data);};
 self.get=function(){return self.template.apply(self,arguments);};
 
 self.get.self=self;
 self.get.isGetFunction=true;
 
 self.get.load=function(){return self.load.apply(self,arguments);}
 self.get.reload=function(){return self.reload.apply(self,arguments);}
 self.get.kill  =function(){return self.kill.apply(self,arguments);}
 self.get.notify=function(){return self.notify.apply(self,arguments);}
 self.get.childUpdated=function(){};//function(){return self.childUpdated.apply(self,arguments);}
 self.get.parentUpdated=function(){};//function(){return self.update.apply(self,arguments);}
 self.get.add=function(){return self.add.apply(self,arguments);}
 self.get.remove=function(){return self.remove.apply(self,arguments);}
 // did not worked always returned the last function:
 //for(var x in tObserver.prototype)// proxy all other functions too.
 //{
 // if( x!='template' && typeof tObserver.prototype[x]=='function')
 // {
 //  var fn=self[x];
 //  self.get[x]=function(){return fn.apply(self,arguments);};
 // }
 //}
 var deffered=null;
 this.watch_eventemiter=fs.watchFile(filename,{persistent:false}, this.watch_listener=function (curr, prev)
 {
  if(curr.mtime>prev.mtime)
  {
   if(deffered)clearTimeout(deffered);
   deffered=setTimeout(self.get.reload,500);
  }
 });
 
 self.load();
 return self.get;
};

tObserver.load=defaultload;

tObserver.prototype={
 istObserver:true,
 filename:"",
 data:{},     // unused
 children:[],  // unused
 template:function(){throw new Error("template is undefined"); return undefined;},
 parent:null,  // unused
 watch_eventemiter:null,  
 watch_listener:null,
 config:{}, // unused
 load:function(){
  var self=this;
  //if(this.config.foo)  // unused
  // te.settings.foo=this.config.foo;  // unused
  //exports.load(this.filename,function(template){
  tObserver.load(this.filename,function(template){
   //console.log(template.toString());
   self.template=template;
  });
 },
 reload:function()
 {
  this.load();
  this.notify();  // unused
 },
 kill:function()
 {
  if(this.parent&&this.parent.detach)this.parent.detach(this);// unused
  if(this.watch_eventemiter.listeners('change').length>1)
   this.watch_eventemiter.removeListener('change',this.watch_listener);
  else
   fs.unwatchFile(this.filename);

  for(var i=0;i<this.children.length;i++)
  {
   if(this.children[i].kill) this.children[i].kill();
   delete this.children[i];
  }
  for(var x in this.get) delete this.get[x];
  for(var x in this)  delete this[x];
  delete this;
 },
 notify:function()  // unused
 {
  if(this.parent&&parent.parentUpdated)  parent.parentUpdated();
  for(var i=0;i<this.children.length;i++)
  {
   if(this.children[i].parentUpdated)
    this.children[i].parentUpdated();
   else if(typeof this.children[i]=='function')
    this.children[i](this);
  }
 },
 childUpdated:function(){  // unused
  this.get.childUpdated();
 },
 parentUpdated:function(){  // unused
  this.get.parentUpdated();
 },
 add:function(me)  // unused
 {
  if(me.isGetFunction)
   me=me.self;
  this.children.push(me); 
 },
 remove:function(me)  // unused
 {
  for(var i=0;i<this.children.length;i++)
  {
   if(this.children[i]==me)
    this.children.splice(i);
  }
 }
}


//for(var i=1000;i--;)
//{
// var foo=tObserver("test.html");
// console.log(foo({name:"shimon"}));
// foo.kill();foo=null;
//}

//this=tObserver;
exports.template=tObserver;