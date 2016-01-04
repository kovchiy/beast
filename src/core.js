if (typeof window !== 'undefined') {
    window.Beast = {}
    document.addEventListener('DOMContentLoaded', function () {
        Beast.init()
    })
} else {
    global.Beast = {}
}

;(function () {

Beast._decl = {}                // declarations from Bease.decl()
Beast._declFinished = false     // flag turns true after the first Beast.node() call
Beast._httpRequestQueue = []    // queue of required bml-files with link tag
Beast._cssLinksToLoad = 0       // num of <link rel="stylesheet"> in the <head>
Beast._isReady = false          // if all styles and scripts are loaded
Beast._onReadyCallbacks = []    // functions to call when sources are ready
Beast._bemNodes = []            // ever initialized bem nodes
Beast._reservedDeclProperies = {
    inherits:1,
    expand:1,
    mod:1,
    param:1,
    domInit:1,
    domAttr:1,
    mix:1,
    on:1,
    onWin:1,
    onMod:1,
    onRemove:1,
    tag:1,
    noElems:1,
    inheritedDecls:1,
    userMethods:1,
    commonExpand:1,
    commonDomInit:1
}

/**
 * Declaration standart fields:
 * - inherits string|array Inherited declarations by selector
 * - expand   function     Expand instructions
 * - mod      object       Default modifiers
 * - noElems  object       If block can have elements
 * - param    object       Default parameters
 * - domInit  function     DOM inititial instructions
 * - mix      string|array Additional CSS-classes
 * - on       object       Event handlers
 * - onWin    object       Window event hadnlers
 * - onMod    object       Modifier change actions
 * - tag      string       DOM tag name
 *
 * @selector string 'block' or 'block__elem'
 * @decl     object
 */
Beast.decl = function (selector, decl) {
    if (typeof selector === 'object') {
        for (key in selector) Beast.decl(key, selector[key])
        return this
    }
    if (decl.inherits && typeof decl.inherits === 'string') {
        decl.inherits = [decl.inherits]
    }
    if (decl.mix && typeof decl.mix === 'string') {
        decl.mix = [decl.mix]
    }
    if (typeof Beast._decl[selector] !== 'undefined') {
        var oldDecl = Beast._decl[selector]
        for (item in oldDecl) {
            if (typeof decl[item] === 'undefined') {
                decl[item] = oldDecl[item]
            }
        }
    }
    Beast._decl[selector] = decl

    return this
}

/**
 * Compiles declaration fileds to methods, makes inheritances
 */
Beast._compileDeclarations = function () {
    function extend (obj, extObj) {
        for (var key in extObj) {
            if (typeof obj[key] === 'undefined') {
                obj[key] = extObj[key]
            } else if (typeof extObj[key] === 'object') {
                extend(obj[key], extObj[key])
            }
        }
    }

    function compileCommonHandler (commonHandlerName, handlers, decl) {
        if (handlers.length === 0) return

        decl[commonHandlerName] = function () {
            for (var i = 0, ii = handlers.length; i < ii; i++) {
                handlers[i].call(this)
            }
        }
    }

    for (var selector in Beast._decl) (function (decl) {

        // Extend decl with inherited rules
        if (decl.inherits) {
            for (var i = decl.inherits.length-1; i >= 0; i--) {
                var inheritedDecl = Beast._decl[decl.inherits[i]]
                if (inheritedDecl) {
                    extend(decl, inheritedDecl)
                    if (!decl.inheritedDecls) decl.inheritedDecls = []
                    decl.inheritedDecls.push(inheritedDecl)
                }
            }
        }

        // Compile expand rules to methods array
        var expandHandlers = []
        if (decl.expand) {
            expandHandlers.unshift(decl.expand)
        }
        if (decl.param) {
            expandHandlers.unshift(function () {
                this.defineParam(decl.param)
            })
        }
        if (decl.mix) {
            expandHandlers.unshift(function () {
                this.mix.apply(this, decl.mix)
            })
        }
        if (decl.inherits) {
            expandHandlers.unshift(function () {
                this.mix.apply(this, decl.inherits)
            })
        }
        if (decl.mod) {
            expandHandlers.unshift(function () {
                this.defineMod(decl.mod)
            })
        }
        if (decl.tag) {
            expandHandlers.unshift(function () {
                this.tag(decl.tag)
            })
        }
        if (decl.noElems) {
            expandHandlers.unshift(function () {
                this.noElems(decl.noElems)
            })
        }
        if (decl.domAttr) {
            expandHandlers.unshift(function () {
                this.domAttr(decl.domAttr)
            })
        }
        if (decl.onMod) {
            expandHandlers.unshift(function () {
                for (modName in decl.onMod) {
                    for (modValue in decl.onMod[modName]) {
                        this.onMod(modName, modValue, decl.onMod[modName][modValue])
                    }
                }
            })
        }

        // Compile domInit rules to methods array
        var domInitHandlers = []
        if (decl.domInit) {
            domInitHandlers.unshift(decl.domInit)
        }
        if (decl.on) {
            domInitHandlers.unshift(function () {
                for (events in decl.on) {
                    this.on(events, decl.on[events])
                }
            })
        }
        if (decl.onWin) {
            domInitHandlers.unshift(function () {
                for (events in decl.onWin) {
                    this.onWin(events, decl.onWin[events])
                }
            })
        }

        // Compile common handlers
        compileCommonHandler('commonExpand', expandHandlers, decl)
        compileCommonHandler('commonDomInit', domInitHandlers, decl)

        // Extract user methods
        decl.userMethods = {}
        for (var key in decl) {
            if (Beast._reservedDeclProperies[key] !== 1) {
                decl.userMethods[key] = decl[key]
            }
        }

    })(Beast._decl[selector])
}

/**
 * Creates bemNode object
 *
 * @name    string         Node name
 * @attr    object         Node attributes
 * @content string|bemNode Last multiple argument
 * @return  BemNode
 */
Beast.node = function (name, attr) {
    // No more Beast.decl() after the first Beast.node() call
    if (!Beast._declFinished) {
        Beast._declFinished = true
        Beast._compileDeclarations()
    }

    return new Beast.BemNode(
        name,
        attr,
        Array.prototype.splice.call(arguments, 2)
    )
}

/**
 * Finds BEM-nodes by selector
 * @arguments array Selectors
 * @return    array Nodes found
 */
Beast.findNodes = function () {
    var nodesFound = []

    for (var j = 0, jj = arguments.length; j < jj; j++) {
        var selector = arguments[j]
        for (var i = 0, ii = Beast._bemNodes.length; i < ii; i++) {
            var node = Beast._bemNodes[i]
            if (node && node._domClasses.indexOf(selector) >= 0) {
                nodesFound.push(node)
            }
        }
    }

    return nodesFound
}

/**
 * Finds BEM-node by id
 * @id     string  ID
 * @return BemNode Node found
 */
Beast.findNodeById = function (id) {
    for (var i = 0, ii = Beast._bemNodes.length; i < ii; i++) {
        var node = Beast._bemNodes[i]
        if (node && node._id === id) {
            return node
        }
    }
}

/**
 * Checks if all <link> are loaded
 */
Beast._checkIfReady = function () {
    if (Beast._isReady) return

    var isReady = true

    for (var i = 0, ii = Beast._httpRequestQueue.length; i < ii; i++) {
        var xhr = Beast._httpRequestQueue[i]
        if (xhr.readyState !== 4 || xhr.status !== 200) {
            isReady = false
        }
    }
    if (document.styleSheets.length < Beast._cssLinksToLoad) {
        isReady = false
    }

    if (isReady) {
        for (var i = 0, ii = Beast._httpRequestQueue.length; i < ii; i++) {
            Beast.evalBml(
                Beast._httpRequestQueue[i].responseText
            )
        }
        Beast._httpRequestQueue = []
        Beast._processBmlScripts()

        Beast._isReady = true
        for (var i = 0, ii = Beast._onReadyCallbacks.length; i < ii; i++) {
            Beast._onReadyCallbacks[i]()
        }
    }
}

/**
 * Set callback when Beast is ready
 *
 * @callback function Function to call
 */
Beast.onReady = function (callback) {
    if (Beast._isReady) {
        callback()
    } else {
        this._onReadyCallbacks.push(callback)
    }
}

/**
 * Require declaration script
 *
 * @url string Path to script file
 */
Beast._require = function (url) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            Beast._checkIfReady()
        }
    }
    Beast._httpRequestQueue.push(xhr)
    xhr.send()
}

/**
 * Parses and attaches declaration to <head>-node.
 * If there's only XML inside, appends node to document.body.
 *
 * @text string Text to parse and attach
 */
Beast.evalBml = function (text) {
    var parsedText = Beast.parseBML(text)
    if (/^[\s\n]*</.test(text)) {
        parsedText = parsedText + (
            document.body
                ? '.render(document.body)'
                : '.render(document.documentElement)'
        )
    }

    eval(parsedText)
}

/**
 * Converts <script type="bml"/> tag to Beast::evalBml() method
 */
Beast._processBmlScripts = function () {
    var scripts = document.getElementsByTagName('script')

    for (var i = 0, ii = scripts.length; i < ii; i++) {
        var script = scripts[i]
        var text = script.text

        if (script.type === 'bml' && text !== '') {
            Beast.evalBml(text)
        }
    }
}

/**
 * Initialize Beast
 */
Beast.init = function () {
    var links = document.getElementsByTagName('link')
    var bmlLinks = []

    for (var i = 0, ii = links.length; i < ii; i++) {
        var link = links[i]
        if (link.type === 'bml' || link.rel === 'bml') {
            Beast._require(link.href)
            bmlLinks.push(link)
        }
        if (link.rel === 'stylesheet') {
            Beast._cssLinksToLoad++
            link.onload = link.onerror = function () {
                Beast._checkIfReady()
            }
        }
    }

    for (var i = 0, ii = bmlLinks.length; i < ii; i++) {
        bmlLinks[i].parentNode.removeChild(bmlLinks[i])
    }

    Beast._checkIfReady()
}

})();