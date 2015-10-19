if (typeof window !== 'undefined') {
    window.Beast = {}
} else {
    global.Beast = {}
}

;(function () {

Beast._decl = {}                // declarations from Bease.decl()
Beast._declFinished = false     // flag turns true after the first Beast.node() call
Beast._httpRequestQueue = []    // queue of required bml-files with link tag
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
    tag:1,
    noElems:1
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
Beast.compileDeclarations = function () {
    function collectDeclHandlers (expandHandlers, initHandlers, userMethods, decl) {
        if (decl.expand) {
            expandHandlers.unshift(decl.expand)
        }
        if (decl.param) {
            expandHandlers.unshift(function () {
                this.defineParam(decl.param)
            })
        }
        if (decl.mod) {
            expandHandlers.unshift(function () {
                this.defineMod(decl.mod)
            })
        }
        if (decl.mix) {
            expandHandlers.unshift(function () {
                this.mix.apply(this, decl.mix)
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
        if (decl.domInit) {
            initHandlers.unshift(decl.domInit)
        }
        if (decl.on) {
            initHandlers.unshift(function () {
                for (events in decl.on) {
                    this.on(events, decl.on[events])
                }
            })
        }
        if (decl.onWin) {
            initHandlers.unshift(function () {
                for (events in decl.onWin) {
                    this.onWin(events, decl.onWin[events])
                }
            })
        }
        for (key in decl) {
            if (!Beast._reservedDeclProperies[key] && !userMethods[key]) {
                userMethods[key] = decl[key]
            }
        }
        if (decl.inherits) {
            for (var i = decl.inherits.length-1, ii = 0; i >= ii; i--) {
                var inheritedDecl = Beast._decl[decl.inherits[i]]
                if (inheritedDecl) {
                    collectDeclHandlers(expandHandlers, initHandlers, userMethods, inheritedDecl)
                }
            }
        }
    }

    function defineCommonHandler (commonHandlerName, handlers, selector) {
        Beast._decl[selector][commonHandlerName] = function () {
            for (var i = 0, ii = handlers.length; i < ii; i++) {
                handlers[i].call(this)
            }
        }
    }

    for (selector in Beast._decl) {
        var decl = Beast._decl[selector]
        var expandHandlers = []
        var initHandlers = []
        var userMethods = {}

        collectDeclHandlers(expandHandlers, initHandlers, userMethods, decl)
        defineCommonHandler('expand', expandHandlers, selector)
        defineCommonHandler('domInit', initHandlers, selector)
        decl._userMethods = userMethods
    }
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
        Beast.compileDeclarations()
    }

    return new Beast.BemNode(
        name,
        attr,
        Array.prototype.splice.call(arguments, 2)
    )
}

/**
 * Finds BEM-nodes by selector in @arguments
 *
 * @return array Nodes found
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
 * Require declaration script
 *
 * @url string Path to script file
 */
Beast.require = function (url) {
    function checkQueueReady () {
        var isReady = true
        for (var i = 0, ii = Beast._httpRequestQueue.length; i < ii; i++) {
            var xhr = Beast._httpRequestQueue[i]
            if (xhr.readyState !== 4 || xhr.status !== 200) {
                isReady = false
            }
        }
        if (isReady) {
            for (var i = 0, ii = Beast._httpRequestQueue.length; i < ii; i++) {
                Beast.appendBML(
                    Beast._httpRequestQueue[i].responseText
                )
            }
            Beast._httpRequestQueue = []
            Beast.processDOMScripts()
        }
    }

    var xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            checkQueueReady()
        }
    }
    xhr.send()

    Beast._httpRequestQueue.push(xhr)
}

/**
 * Parses and attaches declaration to <head>-node.
 * If there's only XML inside, appends node to document.body.
 *
 * @text string Text to parse and attach
 */
Beast.appendBML = function (text) {
    var parsedText = Beast.parseBML(text)
    if (/^[\s\n]*</.test(text)) {
        parsedText = parsedText + '.render(document.body);'
    }

    var script = document.createElement('script')
    script.text = parsedText
    document.head.appendChild(script)
}

/**
 * Converts <link type="bml"/> tag to Beast::require() method
 */
Beast.processDOMLinks = function () {
    var links = document.getElementsByTagName('link')
    for (var i = 0, ii = links.length; i < ii; i++) {
        var link = links[i]

        if (link.type === 'bml' || link.rel === 'bml') {
            Beast.require(link.href)
        }
    }
}

/**
 * Converts <script type="bml"/> tag to Beast::appendBML() method
 */
Beast.processDOMScripts = function () {
    if (Beast._httpRequestQueue.length !== 0) return

    var scripts = document.getElementsByTagName('script')
    for (var i = 0, ii = scripts.length; i < ii; i++) {
        var script = scripts[i]
        var text = script.text

        if (script.type === 'bml' && text !== '') {
            Beast.appendBML(text)
        }
    }
}

/**
 * On DOM loaded init Beast
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        Beast.processDOMLinks()
        Beast.processDOMScripts()
    })
}

})();
