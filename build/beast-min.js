"undefined"!=typeof window?window.Beast={}:global.Beast={},function(){Beast._decl={},Beast._declFinished=!1,Beast._httpRequestQueue=[],Beast._bemNodes=[],Beast._reservedDeclProperies={inherits:1,expand:1,mod:1,param:1,domInit:1,domAttr:1,mix:1,on:1,onWin:1,onMod:1,tag:1,noElems:1},Beast.decl=function(e,t){if(t.inherits&&"string"==typeof t.inherits&&(t.inherits=[t.inherits]),t.mix&&"string"==typeof t.mix&&(t.mix=[t.mix]),"undefined"!=typeof Beast._decl[e]){var n=Beast._decl[e];for(item in n)"undefined"==typeof t[item]&&(t[item]=n[item])}return Beast._decl[e]=t,this},Beast.compileDeclarations=function(){function e(t,n,i,s){s.expand&&t.unshift(s.expand),s.param&&t.unshift(function(){this.defineParam(s.param)}),s.mod&&t.unshift(function(){this.defineMod(s.mod)}),s.mix&&t.unshift(function(){this.mix.apply(this,s.mix)}),s.tag&&t.unshift(function(){this.tag(s.tag)}),s.noElems&&t.unshift(function(){this.noElems(s.noElems)}),s.domAttr&&t.unshift(function(){this.domAttr(s.domAttr)}),s.onMod&&t.unshift(function(){for(modName in s.onMod)for(modValue in s.onMod[modName])this.onMod(modName,modValue,s.onMod[modName][modValue])}),s.domInit&&n.unshift(s.domInit),s.on&&n.unshift(function(){for(events in s.on)this.on(events,s.on[events])}),s.onWin&&n.unshift(function(){for(events in s.onWin)this.onWin(events,s.onWin[events])});for(key in s)Beast._reservedDeclProperies[key]||i[key]||(i[key]=s[key]);if(s.inherits)for(var o=s.inherits.length-1,r=0;o>=r;o--){var d=Beast._decl[s.inherits[o]];d&&e(t,n,i,d)}}function t(e,t,n){Beast._decl[n][e]=function(){for(var e=0,n=t.length;n>e;e++)t[e].call(this)}}for(selector in Beast._decl){var n=Beast._decl[selector],i=[],s=[],o={};e(i,s,o,n),t("expand",i,selector),t("domInit",s,selector),n._userMethods=o}},Beast.node=function(e,t){return Beast._declFinished||(Beast._declFinished=!0,Beast.compileDeclarations()),new Beast.BemNode(e,t,Array.prototype.splice.call(arguments,2))},Beast.findNodes=function(){for(var e=[],t=0,n=arguments.length;n>t;t++)for(var i=arguments[t],s=0,o=Beast._bemNodes.length;o>s;s++){var r=Beast._bemNodes[s];r&&r._domClasses.indexOf(i)>=0&&e.push(r)}return e},Beast.require=function(e){function t(){for(var e=!0,t=0,n=Beast._httpRequestQueue.length;n>t;t++){var i=Beast._httpRequestQueue[t];(4!==i.readyState||200!==i.status)&&(e=!1)}if(e){for(var t=0,n=Beast._httpRequestQueue.length;n>t;t++)Beast.appendBML(Beast._httpRequestQueue[t].responseText);Beast._httpRequestQueue=[],Beast.processDOMScripts()}}var n=new XMLHttpRequest;n.open("GET",e),n.onreadystatechange=function(){4===this.readyState&&200===this.status&&t()},n.send(),Beast._httpRequestQueue.push(n)},Beast.appendBML=function(e){var t=Beast.parseBML(e);/^[\s\n]*</.test(e)&&(t+=document.body?".render(document.body);":".render(document.documentElement);");var n=document.createElement("script");n.text=t,document.head.appendChild(n)},Beast.processDOMLinks=function(){for(var e=document.getElementsByTagName("link"),t=[],n=0,i=e.length;i>n;n++){var s=e[n];("bml"===s.type||"bml"===s.rel)&&(Beast.require(s.href),t.push(s))}for(var n=0,i=t.length;i>n;n++)t[n].parentNode.removeChild(t[n])},Beast.processDOMScripts=function(){if(0===Beast._httpRequestQueue.length)for(var e=document.getElementsByTagName("script"),t=0,n=e.length;n>t;t++){var i=e[t],s=i.text;"bml"===i.type&&""!==s&&Beast.appendBML(s)}},"undefined"!=typeof document&&document.addEventListener("DOMContentLoaded",function(){Beast.processDOMLinks(),Beast.processDOMScripts()})}(),function(){function e(e){for(var t,n="",i=0,s="",o=0,r=e.length;r>o;o++)t=e[o],"{"===t&&"\\"!==s?(i++,1===i?""!==n&&(n+="',"):n+=t):i>0&&"}"===t?(i--,0===i?r-1>o&&"{"!==e[o+1]&&(n+=",'"):n+=t):0===i?(0===o&&(n+="'"),"'"===t&&(n+="\\"),n+=t,o===r-1&&(n+="'")):n+=t,s=t;return n}function t(t,n,i){t=t.substr(1),t=n?t.substr(0,t.length-2):t.substr(0,t.length-1);var o=t.split(s),r=o.shift();""===o[o.length-1]&&o.pop();var d="Beast.node('"+r+"', ";if(o.length||i){for(d+="{",i&&(d+="'context':this",o.length&&(d+=", "));o.length;){var h=o.shift().split("=");d+=1===h.length?"'"+h[0]+"':true":"'"+h[0]+"':"+('""'===h[1]?"''":e(h[1].substr(1,h[1].length-1))),0!==o.length&&(d+=", ")}d+="}"}else d+="null";return n&&(d+=")"),d}function n(n){var s;for(n=n.replace(r,"");;){if(s=i.exec(n),null===s)return n;var d,h=s[0],a=s.index;if("/"===h[h.length-2])d=h.length;else{var l=h.indexOf("\n");0>l&&(l=h.indexOf(" ")),0>l&&(l=h.length-1);var _,m,c,u=h.substr(1,l-1),f=new RegExp("<"+u+"(?:[ \n][^>]*)>","g"),p="</"+u+">",N=n.substr(a+1),B=-1,g=0;do d=0===g?N.search(p):c.search(p)+g,m=N.substr(0,d),c=N.substr(d+1),_=m.match(f),B++,g+=d+1;while(null!==_&&_.length>B);d+=1+p.length}for(var v,N=n.substr(a,d),k="",y="",x=[],C=0,b=N.length;b>C;C++)v=N[C],"\n"!==v&&("<"===v&&(x.push(y),y=""),y+=v,">"===v&&(x.push(y),y=""));""!==y&&x.push(N);for(var E,M=!0,C=0,b=x.length;b>C;C++){var v=x[C];if(!o.test(v)){var D=v.substr(0,1),H=v.substr(0,2),I=v.substr(v.length-1),P=v.substr(v.length-2);if("</"!==H||">"!==I)if(M?(M=!1,E=!0):(k+=", ",E=!1),"<"!==D||"/>"!==P)if("<"!==D||">"!==I){if("<"===D)return console.error("Unclosed node:",v);k+=e(v)}else k+=t(v,!1,E);else k+=t(v,!0,E);else k+=")"}}n=n.substr(0,a)+k+n.substr(a+d)}}var i=/<[a-z][^>]+\/?>/i,s=/\s+(?=[^"]+(?:[=$]|$))|"\s+(?=[^=]*=)|"\s*(?=[^="]*$)/,o=/^[\s]*$/,r=/<!--[^]*-->/g;Beast.parseBML=n}(),function(){function e(e,t,n){this._name="",this._nodeName=e,this._attr=t||{},this._isBlock=!1,this._isElem=!1,this._mod={},this._modHandlers={},this._param={},this._domNode=null,this._domAttr={},this._domClasses=null,this._afterDomInitHandlers=[],this._domInited=!1,this._parentBlock=null,this._forcedParentBlock=!1,this._parentNode=null,this._prevParentNode=null,this._children=[],this._expandedChildren=null,this._isExpanded=!1,this._isExpandContext=!1,this._isReplaceContext=!1,this._mix=[],this._tag="div",this._id="",this._noElems=!1,this._implementedNode=null,this._bemNodeIndex=-1,this._css={};var i=e.substr(0,1);this._isBlock=i===i.toUpperCase(),this._isElem=!this._isBlock,this._isBlock&&(this._name=e.toLowerCase(),this._parentBlock=this,this._defineUserMethods());for(key in this._attr){var i=key.substr(0,1);i===i.toUpperCase()?this._mod[key.toLowerCase()]=this._attr[key]:"mix"===key?this._mix=this._attr.mix.split(" "):"context"!==key||this._parentBlock?"block"===key?(this.parentBlock(this._attr.block,!0),this._forcedParentBlock=!0):"tag"===key?this._tag=this._attr.tag:"id"===key?this._id=this._attr.id:this._param[key]=this._attr[key]:this.parentBlock(this._attr.context)}this.append.apply(this,n)}e.prototype={isBlock:function(){return this._isBlock},isElem:function(){return this._isElem},selector:function(){return this._name},id:function(e){return"undefined"==typeof e?this._id:(this._id=e,this._domNode&&(this._domNode.id=e),this)},tag:function(e){return"undefined"==typeof e?this._tag:(this._domNode||(this._tag=e),this)},css:function(e,n){if("object"==typeof e)for(key in e)this.css(key,e[key]);else{if("undefined"==typeof n)return this._domNode?window.getComputedStyle(this._domNode).getPropertyValue(e):this._css[e];"number"==typeof n&&t[e]&&(n+="px"),this._css[e]=n,this._domNode&&this._setDomNodeCSS()}return this},noElems:function(e){return this._noElems=e,this._setParentBlockForChildren(this,this._parentNode,!0),this},parentBlock:function(t,n){if(t){if(this._isElem&&t instanceof e&&t!==this._parentBlock&&!this._forcedParentBlock){if(t._parentBlock._noElems)return this.parentBlock(t._parentNode,n);this._clearUserMethods(),this._parentBlock=t._parentBlock,this._name=this._parentBlock._name+"__"+this._nodeName,this._defineUserMethods(),n||this._setParentBlockForChildren(this,t)}return this}return this._implementedNode?this._implementedNode._parentBlock:this._parentBlock},parentNode:function(t){return t?(t instanceof e&&(this._prevParentNode=this._parentNode,this._parentNode=t),this):this._parentNode},domNode:function(){return this._domNode},domAttr:function(e,t){if("object"==typeof e)for(key in e)this.domAttr(key,e[key]);else{if("undefined"==typeof t)return this._domAttr[e];this._domAttr[e]=t,this._domNode&&this._domNode.setAttribute(e,t)}return this},mix:function(){for(var e=0,t=arguments.length;t>e;e++)this._mix.push(arguments[e]);return this._domNode&&this._setDomNodeClasses(),this},defineMod:function(e){return this._implementedNode&&this._implementedNode._extendProperty("_mod",e),this._extendProperty("_mod",e)},defineParam:function(e){return this._extendProperty("_param",e)},mod:function(e,t,n){if("object"==typeof e)for(key in e)this.mod(key,e[key]);else{if("undefined"==typeof t)return this._mod[e];this._mod[e]!==t&&(this._mod[e]=t,this._implementedNode&&(this._implementedNode._mod[e]=t),this._domNode&&(this._setDomNodeClasses(),this._callModHandlers(e,t,n)))}return this},param:function(e,t){if("object"==typeof e)for(key in e)this.param(key,e[key]);else{if("undefined"==typeof t)return this._param[e];this._param[e]=t}return this},on:function(e,t){for(var n=e.split(" "),i=0,s=n.length;s>i;i++)!function(e,n){e._domNode.addEventListener(n,function(n){t.call(e,n,n.detail)})}(this,n[i]);return this},onWin:function(e,t){for(var n=e.split(" "),i=0,s=n.length;s>i;i++)!function(e,n){window.addEventListener(n,function(n){t.call(e,n,n.detail)})}(this,n[i]);return this},onMod:function(e,t,n){return"undefined"==typeof this._modHandlers[e]&&(this._modHandlers[e]={}),"undefined"==typeof this._modHandlers[e][t]&&(this._modHandlers[e][t]=[]),this._modHandlers[e][t].push(n),this},trigger:function(e,t){return this._domNode&&this._domNode.dispatchEvent(t?new CustomEvent(e,{detail:t}):new Event(e)),this},triggerWin:function(e,t){return this._domNode&&(e=this.parentBlock()._name+":"+e,window.dispatchEvent(t?new CustomEvent(e,{detail:t}):new Event(e))),this},index:function(){for(var e=this._parentNode._children,t=0,n=e.length;n>t;t++)if(e[t]===this)return t},empty:function(){var t;if(this._isExpandContext?(t=this._expandedChildren,this._expandedChildren=[]):(t=this._children,this._children=[]),t)for(var n=0,i=t.length;i>n;n++)t[n]instanceof e&&t[n]._unlink();if(this._domNode)for(;this._domNode.firstChild;)this._domNode.removeChild(this._domNode.firstChild);return this},remove:function(e){return this._domNode&&this._domNode.parentNode.removeChild(this._domNode),this._parentNode&&(this._parentNode._children=this._parentNode._children.splice(this.index(),1)),e||this._unlink(),this},append:function(){for(var t=0,n=arguments.length;n>t;t++){var i=arguments[t];Array.isArray(i)?this.append.apply(this,i):(i instanceof e?(i.parentNode(this),i._isElem&&(this._isBlock?i.parentBlock(this):this._attr.context&&i.parentBlock(this._parentBlock))):"number"==typeof i&&(i=i.toString()),this._domNode&&!this._isReplaceContext?(this._children.push(i),this._renderChildWithIndex(this._children.length-1)):this._isExpandContext?(this._expandedChildren||(this._expandedChildren=[]),this._expandedChildren.push(i)):this._children.push(i))}return this},appendTo:function(e){return this.remove(!0),e.append(this),this},replaceWith:function(t){this._completeExpand();var n,i=this._parentNode;i===t?i=this._prevParentNode:(n=i._children.splice(this.index()),n.shift()),i._isReplaceContext=!0,i.append(t),i._isReplaceContext=!1,n&&(i._children=i._children.concat(n)),this._parentNode=null,t instanceof e&&(t._isBlock&&t._resetParentBlockForChildren(),t.render())},implementWith:function(e){this._setDomNodeClasses(),e._implementedNode=this,e._extendProperty("_mod",this._mod),this._extendProperty("_mod",e._mod),e._defineUserMethods(this._name),this.replaceWith(e)},text:function(){for(var e="",t=0,n=this._children.length;n>t;t++)"string"==typeof this._children[t]&&(e+=this._children[t]);return e},get:function(){if(0===arguments.length)return this._children;for(var e=[],t=0,n=arguments.length;n>t;t++){for(var i,s=arguments[t].split("/"),o=0,r=s.length;r>o;o++){var d=s[o];if(0===o)i=this._filterChildNodes(d);else{var h=i;i=[];for(var a=0,l=h.length;l>a;a++)i=i.concat(this._filterChildNodes.call(h[a],d))}if(0===i.length)break}e=1===n?i:e.concat(i)}return e},getWithContext:function(){for(var t=this.get.apply(this,argumnets),n=0,i=t.length;i>n;n++)t[n]instanceof e&&t[n].parenBlock(this._parentBlock);return t},has:function(){return this.get.apply(this,arguments).length>0},afterDomInit:function(e){return this._domInited?e.call(this):this._afterDomInitHandlers.push(e),this},render:function(e){if(this._expand(),!e&&!this._parentNode)return this;if(!this._domNode){this._domNode=document.createElement(this._tag),this._domNode.bemNode=this,""!==this._id&&(this._domNode.id=this._id),this._setDomNodeClasses(),this._setDomNodeCSS();for(key in this._domAttr)this._domNode.setAttribute(key,this._domAttr[key])}e?e.appendChild(this._domNode):this._parentNode._domNode.appendChild(this._domNode);for(var t=0,n=this._children.length;n>t;t++)this._renderChildWithIndex(t);this._bemNodeIndex=Beast._bemNodes.length,Beast._bemNodes.push(this);for(modName in this._mod)this._callModHandlers(modName,this._mod[modName]);return this._domInit(),this},renderHTML:function(){var e="";return e},_setParentBlockForChildren:function(t,n,i){for(var s=0,o=t._children.length;o>s;s++){var r=t._children[s];r instanceof e&&r._isElem&&(!r._parentBlock||i?r.parentBlock(n):this._setParentBlockForChildren(r,n))}},_filterChildNodes:function(t){for(var n=[],i=0,s=this._children.length;s>i;i++){var o=this._children[i];o instanceof e&&(""===t||t===o._nodeName||o._implementedNode&&t===o._implementedNode._nodeName)&&n.push(o)}return n},_renderChildWithIndex:function(t){var n=this._children[t];n instanceof e?n.render():this._domNode.appendChild(document.createTextNode(n))},_expand:function(){if(!this._isExpanded){var e=Beast._decl[this._name];e&&(this._isExpandContext=!0,e.expand.call(this),this._completeExpand(),this._isExpandContext=!1)}},_completeExpand:function(){this._isExpandContext&&this._expandedChildren&&(this._children=this._expandedChildren,this._expandedChildren=null),this._isExpanded=!0},_domInit:function(){var e=Beast._decl[this._name];if(e&&e.domInit.call(this),this._implementedNode&&(e=Beast._decl[this._implementedNode._name])&&e.domInit.call(this),this._domInited=!0,0!==this._afterDomInitHandlers.length)for(var t=0,n=this._afterDomInitHandlers.length;n>t;t++)this._afterDomInitHandlers[t].call(this)},_callModHandlers:function(e,t,n,i){var s;if(this._modHandlers[e]&&(this._modHandlers[e][t]?s=this._modHandlers[e][t]:value===!1&&this._modHandlers[name][""]?s=this._modHandlers[e][""]:""===value&&this._modHandlers[name][!1]&&(s=this._modHandlers[e][!1])),s){"undefined"==typeof i&&(i=this);for(var o=0,r=s.length;r>o;o++)s[o].call(i,n)}this._implementedNode&&this._implementedNode._callModHandlers(e,t,n,this)},_extendProperty:function(e,t){var n=this[e];for(key in t)"undefined"!=typeof n[key]&&""!==n[key]?this[e][key]=n[key]:this[e][key]=t[key];return this},_setDomNodeClasses:function(e){var t,n=this._name;for(key in this._mod)t=this._mod[key],""!==t&&t!==!1&&(n+=t!==!0?" "+this._name+"_"+key+"_"+t:" "+this._name+"_"+key);this._implementedNode&&(n+=" "+this._implementedNode._setDomNodeClasses(!0));for(var i=0,s=this._mix.length;s>i;i++)n+=" "+this._mix[i];return e?n:(this._domClasses=n.split(" "),void(this._domNode&&(this._domNode.className=n)))},_setDomNodeCSS:function(){var e="";for(name in this._css)(this._css[name]||0===this._css[name])&&(e+=name+":"+this._css[name]+";");""!==e&&this._domNode.setAttribute("style",e)},_resetParentBlockForChildren:function(){for(var t=0,n=this._children.length;n>t;t++){var i=this._children[t];i instanceof e&&i._isElem&&(i.parentBlock(this._parentBlock),i._resetParentBlockForChildren(this._parentBlock))}},_defineUserMethods:function(){var e=arguments[0]||this._name,t=Beast._decl[e];if(t)for(methodName in t._userMethods)this[methodName]=t._userMethods[methodName]},_clearUserMethods:function(){if(""!==this._name&&Beast._decl[this._name]){var e=Beast._decl[this._name]._userMethods;for(methodName in e)this[methodName]=null}},_unlink:function(){this._bemNodeIndex>=0&&(Beast._bemNodes[this._bemNodeIndex]=null)}},Beast.BemNode=e;var t={height:1,width:1,left:1,right:1,bottom:1,top:1,"line-height":1,"font-size":1}}();