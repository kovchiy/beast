/**
 * Beast
 * @version 0.10.0
 * @homepage github.yandex-team.ru/kovchiy/beast
 */
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
;(function () {

var reStartBML     = /<[a-z][^>]+\/?>/i
var reComment      = /<!--[^]*-->/g

/**
 * Looks for '{...}'-substrings and replaces with js-concatinations.
 *
 * @text string Text to parse
 */
function parseText (text) {
    var result = ''
    var openBraceNum = 0
    var prevSymbol = ''
    var symbol

    for (var i = 0, ii = text.length; i < ii; i++) {
        symbol = text[i]

        if (symbol === '{' && prevSymbol !== '\\') {
            openBraceNum++
            if (openBraceNum === 1) {
                if (result !== '') {
                    result += "',"
                }
            } else {
                result += symbol
            }
        } else if (openBraceNum > 0 && symbol === '}') {
            openBraceNum--
            if (openBraceNum === 0) {
                if (i < ii-1 && text[i+1] !== '{') {
                    result += ",'"
                }
            } else {
                result += symbol
            }
        } else if (openBraceNum === 0) {
            if (i === 0) result += "'"
            if (symbol === "'") result += '\\'
            result += symbol
            if (i === ii-1) result += "'"
        } else {
            result += symbol
        }

        prevSymbol = symbol
    }

    return result
}

/**
 * Converts '<foo>...</foo>' to 'Beast.node('foo', ...)'
 *
 * @text   string  Text to parse
 * @single boolean If node is sinle (<node/>)
 * @isRoot boolean If node is root of bml tree, it gets call-context of parent block
 * @return string  Javascript code
 */
function parseNode (text, single, isRoot) {
    text = text.substr(1)
    text = text.substr(
        0, text.length - (single ? 2 : 1)
    )

    var parsed = parseNodeNameAndAttr(text)

    if (isRoot) {
        parsed.attr += (parsed.attr === '' ? '' : ',') + "'context':this"
    }

    if (parsed.attr === '') {
        parsed.attr === 'null'
    }

    return "Beast.node('" + parsed.name + "',{" + parsed.attr + "}" + (single ? ')' : '')
}

/**
 * Parses XML-substring with node name and attributes to json string
 */
function parseNodeNameAndAttr (text) {
    var nodeName
    var attr = ''
    var buffer = ''
    var openQuote = ''
    var attrName
    var escape = false

    for (var i = 0, ii = text.length-1; i <= ii; i++) {
        var s = text[i]

        // last symbol always metters
        if (i === ii && s !== ' ' && s !== '\n' && s !== "'" && s !== '"' && s !== '=') {
            buffer += s
        }

        // node name
        if ((s === ' ' || s === '\n' || i === ii) && typeof nodeName === 'undefined') {
            nodeName = buffer
            buffer = ''
        }
        // boolean attr
        else if ((s === ' ' || s === '\n' || i === ii) && buffer !== '' && openQuote === '') {
            attr += "'"+ buffer +"':true,"
            buffer = ''
        }
        // attr name
        else if (s === '=' && openQuote === '') {
            attrName = buffer
            buffer = ''
        }
        // attr value start
        else if ((s === '"' || s === "'") && openQuote === '') {
            openQuote = s
        }
        // attr value finish
        else if (s === openQuote && !escape) {
            attr += "'"+ attrName +"':"+ (buffer === '' ? 'false' : parseText(buffer)) + ","
            openQuote = ''
            buffer = ''
        }
        // when spaces metter
        else if ((s === ' ' || s === '\n') && openQuote !== '') {
            buffer += s
        }
        // read symbol
        else if (s !== ' ' && s !== '\n') {
            buffer += s
        }

        escape = s === '\\'
    }

    if (attr !== '') {
        attr = attr.substring(0, attr.length-1)
    }

    return {
        name: nodeName,
        attr: attr
    }
}

/**
 * Looks for '<foo><bar>...</bar></foo>'-substrings and replaces with js-equiualents.
 * Algorythm:
 * - Find XML-node in text
 * - First node in siquence is root
 * - If root is sinle then parseNode(root) and finish
 * - Else look for root is closing and there's no opening node
 *   with the same name behind the root
 * - When find whole XML-substring, split it by '<' and parse by element
 *
 * @text   string Text to parse
 * @return string Parsed text
 */
function parseBML (text) {
    var startParams

    text = text.replace(reComment, '')

    do {
        startParams = reStartBML.exec(text)

        if (startParams === null) {
            return text
        }

        var matched = startParams[0]
        var bmlStartsAt = startParams.index
        var bmlEndsAt

        if (matched[matched.length-2] === '/') {
            bmlEndsAt = matched.length
        } else {
            var nameEndsAt = matched.indexOf('\n')
            if (nameEndsAt < 0) nameEndsAt = matched.indexOf(' ')
            if (nameEndsAt < 0) nameEndsAt = matched.length-1

            var name = matched.substr(1, nameEndsAt-1)
            var reOpenedNodesWithSameName = new RegExp('<'+ name +'(?:|[ \n][^>]*)>', 'g')
            var closedNode = '</'+ name +'>'
            var textPortion = text.substr(bmlStartsAt+1)
            var closedNodes = -1
            var openedNodes = 0
            var textBeforeClosedNode
            var textAfterClosedNode
            var indexOffset = 0

            do {
                bmlEndsAt = indexOffset === 0
                    ? textPortion.search(closedNode)
                    : textAfterClosedNode.search(closedNode) + indexOffset

                textBeforeClosedNode = textPortion.substr(0, bmlEndsAt)
                textAfterClosedNode = textPortion.substr(bmlEndsAt + 1)

                openedNodes = textBeforeClosedNode.match(reOpenedNodesWithSameName)
                openedNodes = openedNodes !== null ? openedNodes.length : 0

                closedNodes++
                indexOffset = bmlEndsAt + 1
            } while (
                openedNodes > closedNodes
            )

            bmlEndsAt += 1 + closedNode.length
        }

        var textPortion = text.substr(bmlStartsAt, bmlEndsAt)
        var textPortionReplace = ''
        var buffer = ''
        var splitBML = []
        var current

        for (var i = 0, ii = textPortion.length; i < ii; i++) {
            current = textPortion[i]

            if (current === '\n') {
                continue
            }

            if (current === '<') {
                splitBML.push(buffer)
                buffer = ''
            }

            buffer += current

            if (current === '>') {
                splitBML.push(buffer)
                buffer = ''
            }
        }

        if (buffer !== '') {
            splitBML.push(textPortion)
        }

        var first = true
        var inParentContext

        for (var i = 0, ii = splitBML.length; i < ii; i++) {
            var current = splitBML[i]

            if (isEmptyString(current)) {
                continue
            }

            var firstChar = current.substr(0,1)
            var firstTwoChars = current.substr(0,2)
            var lastChar = current.substr(current.length-1)
            var lastTwoChars = current.substr(current.length-2)

            if (firstTwoChars === '</' && lastChar === '>') {
                textPortionReplace += ')'
                continue
            }

            if (first) {
                first = false
                inParentContext = true
            } else {
                textPortionReplace += ', '
                inParentContext = false
            }

            if (firstChar === '<' && lastTwoChars === '/>') {
                textPortionReplace += parseNode(current, true, inParentContext)
                continue
            }

            if (firstChar === '<' && lastChar === '>') {
                textPortionReplace += parseNode(current, false, inParentContext)
                continue
            }

            if (firstChar === '<') {
                return console.error('Unclosed node:', current)
            }

            textPortionReplace += parseText(current)
        }

        text = text.substr(0, bmlStartsAt) + textPortionReplace + text.substr(bmlStartsAt + bmlEndsAt)
    } while (true)
}

function isEmptyString (str) {
    for (var i = 0, ii = str.length; i < ii; i++) {
        if (str[i] !== ' ') return false
    }
    return true
}

Beast.parseBML = parseBML

})();
;(function () {

/**
 * BEM-node class
 *
 * @nodeName string Starts with capital for block else for elem
 * @attr     object List of attributes
 * @children array  Child nodes
 */
function BemNode (nodeName, attr, children) {
    this._name = ''                 // BEM-name: 'block' or 'block__elem'
    this._nodeName = nodeName       // BML-node name
    this._attr = attr || {}         // BML-node attributes
    this._isBlock = false           // flag if node is block
    this._isElem = false            // flag if node is elem
    this._mod = {}                  // modifiers list
    this._modHandlers = {}          // handlers on modifiers change
    this._param = {}                // parameters list
    this._domNode = null            // DOM-node reference
    this._domAttr = {}              // DOM-attributes
    this._domClasses = null         // DOM-classes
    this._afterDomInitHandlers = [] // Handlers called after DOM-node inited
    this._domInited = false         // Flag if DOM-node inited
    this._parentBlock = null        // parent block bemNode reference
    this._forcedParentBlock = false // flag if parentBlock was set manualy with block param
    this._parentNode = null         // parent bemNode reference
    this._prevParentNode = null     // previous parent node value when parent node redefined
    this._children = []             // list of children
    this._expandedChildren = null   // list of expanded children (for expand method purposes)
    this._isExpanded = false        // if Bem-node was expanded
    this._isExpandContext = false   // when flag is true append modifies expandedChildren
    this._isReplaceContext = false  // when flag is true append don't renders children's DOM
    this._mix = []                  // list of additional CSS-classes
    this._tag = 'div'               // DOM-node name
    this._id = ''                   // Node identifier
    this._noElems = false           // Flag if block can have children
    this._implementedNode = null    // Node wich this node implements
    this._bemNodeIndex = -1         // index in Beast._bemNode array
    this._css = {}                  // css properties
    this._decl = null               // declaration for component

    // Define if block or elem
    var firstLetter = nodeName.substr(0,1)
    this._isBlock = firstLetter === firstLetter.toUpperCase()
    this._isElem = !this._isBlock

    if (this._isBlock) {
        this._name = nodeName.toLowerCase()
        this._decl = Beast._decl[this._name]
        this._parentBlock = this
        this._defineUserMethods()
    }

    // Define mods, params and special params
    for (key in this._attr) {
        var firstLetter = key.substr(0,1)
        if (firstLetter === firstLetter.toUpperCase()) {
            this._mod[key.toLowerCase()] = this._attr[key]
        } else if (key === 'mix') {
            this._mix = this._attr.mix.split(' ')
        } else if (key === 'context' && !this._parentBlock) {
            this.parentBlock(this._attr.context)
        } else if (key === 'block') {
            this.parentBlock(this._attr.block, true)
            this._forcedParentBlock = true
        } else if (key === 'tag') {
            this._tag = this._attr.tag
        } else if (key === 'id') {
            this._id = this._attr.id
        } else {
            this._param[key] = this._attr[key]
        }
    }

    // Append children
    this.append.apply(this, children)
}

BemNode.prototype = {
    /*
     * PUBLIC
     */
    inherited: function () {
        if (!this._decl || !this._decl.inheritedDecls) return this

        var caller = arguments.callee.caller
        if (typeof caller._inherited !== 'undefined') {
            if (caller._inherited !== false) caller._inherited.call(this)
            return this
        }

        var callerPath = this._findCallerPath(caller, this._decl)
        if (typeof callerPath === 'undefined') return this

        for (var i = this._decl.inheritedDecls.length-1; i >= 0; i--) {
            var inheritedCaller = this._decl.inheritedDecls[i]

            for (var j = 0, jj = callerPath.length; j < jj; j++) {
                if (!( inheritedCaller = inheritedCaller[callerPath[j]] )) break
            }

            if (inheritedCaller) {
                arguments.callee.caller._inherited = inheritedCaller
                inheritedCaller.call(this)
                break
            } else {
                arguments.callee.caller._inherited = false
            }
        }

        return this
    },

    /**
     * If node is block
     *
     * @return boolean
     */
    isBlock: function () {
        return this._isBlock
    },

    /**
     * If node is element
     *
     * @return boolean
     */
    isElem: function () {
        return this._isElem
    },

    /**
     * Gets block or element name: 'block' or 'block__element'
     *
     * @return string
     */
    selector: function () {
        return this._name
    },

    /**
     * Gets or sets node's identifier
     *
     * @return string
     */
    id: function (id) {
        if (typeof id === 'undefined') {
            return this._id
        } else {
            this._id = id
            if (this._domNode) {
                this._domNode.id = id
            }
            return this
        }
    },

    /**
     * Gets or sets node's tag name
     *
     * @return string
     */
    tag: function (tag) {
        if (typeof tag === 'undefined') {
            return this._tag
        } else {
            if (!this._domNode) {
                this._tag = tag
            }
            return this
        }
    },

    /**
     * Sets css
     *
     * @name  string        css-property name
     * @value string|number css-property value
     */
    css: function (name, value) {
        if (typeof name === 'object') {
            for (key in name) this.css(key, name[key])
        } else if (typeof value === 'undefined') {
            if (this._domNode) {
                return window.getComputedStyle(this._domNode).getPropertyValue(name)
            } else {
                return this._css[name]
            }
        } else {
            if (typeof value === 'number' && cssPxProperty[name]) {
                value += 'px'
            }

            this._css[name] = value

            if (this._domNode) {
                this._setDomNodeCSS()
            }
        }

        return this
    },

    /**
     * Sets _noElems flag
     *
     * @value  boolean
     */
    noElems: function (value) {
        this._noElems = value
        this._setParentBlockForChildren(this, this._parentBlock._parentNode)
        return this
    },

    /**
     * Only for elements. Gets or sets parent block bemNode reference.
     * Also sets bemNode name adding 'blockName__' before element name.
     * [@bemNode, [@dontAffectChildren]]
     *
     * @bemNode            object  Parent block node
     * @dontAffectChildren boolean If true, children won't get this parent block reference
     */
    parentBlock: function (bemNode, dontAffectChildren) {
        if (bemNode) {
            if (this._isElem
                && bemNode instanceof BemNode
                && bemNode !== this._parentBlock
                && !this._forcedParentBlock) {

                if (bemNode._parentBlock && bemNode._parentBlock._noElems) {
                    return this.parentBlock(bemNode._parentNode, dontAffectChildren)
                }

                this._clearUserMethods()
                this._parentBlock = bemNode._parentBlock
                this._name = this._parentBlock._name + '__' + this._nodeName
                this._decl = Beast._decl[this._name]
                this._defineUserMethods()

                if (!dontAffectChildren) {
                    this._setParentBlockForChildren(this, bemNode)
                }
            }
            return this
        } else {
            return this._implementedNode
                ? this._implementedNode._parentBlock
                : this._parentBlock
        }
    },

    /**
     * Gets or sets parent bemNode reference
     * [@bemNode]
     *
     * @bemNode object parent node
     */
    parentNode: function (bemNode) {
        if (typeof bemNode !== 'undefined') {
            if (bemNode instanceof BemNode) {
                this._prevParentNode = this._parentNode
                this._parentNode = bemNode
            }
            return this
        } else {
            return this._parentNode
        }
    },

    /**
     * Gets DOM-node reference
     */
    domNode: function () {
        return this._domNode
    },

    /**
     * Set or get dom attr
     * @name, [@value]
     *
     * @name  string Attribute name
     * @value string Attribute value
     */
    domAttr: function (name, value, domOnly) {
        if (typeof name === 'object') {
            for (key in name) this.domAttr(key, name[key])
        } else if (typeof value === 'undefined') {
            return this._domAttr[name]
        } else {
            if (!domOnly) {
                this._domAttr[name] = value
            }
            if (this._domNode) {
                if (value === false || value === '') {
                    this._domNode.removeAttribute(name)
                } else {
                    this._domNode.setAttribute(name, value)
                }
            }
        }

        return this
    },

    /**
     * Set additional classes
     */
    mix: function () {
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            this._mix.push(arguments[i])
        }
        if (this._domNode) {
            this._setDomNodeClasses()
        }

        return this
    },

    /**
     * Define modifiers and its default values
     */
    defineMod: function (defaults) {
        if (this._implementedNode) {
            this._implementedNode._extendProperty('_mod', defaults)
        }
        return this._extendProperty('_mod', defaults)
    },

    /**
     * Define parameters and its default values
     */
    defineParam: function (defaults) {
        return this._extendProperty('_param', defaults)
    },

    /**
     * Sets or gets mod.
     * @name, [@value, [@data]]
     *
     * @name  string         Modifier name
     * @value string|boolean Modifier value
     * @data  anything       Additional data
     */
    mod: function (name, value, data) {
        if (typeof name === 'object') {
            for (key in name) this.mod(key, name[key])
        } else if (typeof value === 'undefined') {
            return this._mod[name]
        } else if (this._mod[name] !== value) {
            this._mod[name] = value
            if (this._implementedNode) {
                this._implementedNode._mod[name] = value
            }
            if (this._domNode) {
                this._setDomNodeClasses()
                this._callModHandlers(name, value, data)
            }
        }

        return this
    },

    /**
     * Sets or gets parameter.
     * @name, [@value]
     *
     * @name  string
     * @value anything
     */
    param: function (name, value) {
        if (typeof name === 'object') {
            for (key in name) this.param(key, name[key])
        } else if (typeof value === 'undefined') {
            return this._param[name]
        } else {
            this._param[name] = value
        }

        return this
    },

    /**
     * Sets events handler
     *
     * @events  string   Space splitted event list: 'click' or 'click keypress'
     * @handler function
     */
    on: function (events, handler) {
        var eventsArray = events.split(' ')
        for (var i = 0, ii = eventsArray.length; i < ii; i++) {
            (function (bemNode, event) {
                bemNode._domNode.addEventListener(event, function (e) {
                    handler.call(bemNode, e, e.detail)
                })
            })(this, eventsArray[i])
        }

        return this
    },

    /**
     * Sets modifier change handler
     *
     * @modName  string
     * @modValue string|boolean
     * @handler  function
     */
    onWin: function (events, handler) {
        var eventsArray = events.split(' ')
        for (var i = 0, ii = eventsArray.length; i < ii; i++) {
            (function (bemNode, event) {
                window.addEventListener(event, function (e) {
                    handler.call(bemNode, e, e.detail)
                })
            })(this, eventsArray[i])
        }

        return this
    },

    /**
     * Sets modifier change handler
     *
     * @modName  string
     * @modValue string|boolean
     * @handler  function
     */
    onMod: function (modName, modValue, handler) {
        if (typeof this._modHandlers[modName] === 'undefined') {
            this._modHandlers[modName] = {}
        }
        if (typeof this._modHandlers[modName][modValue] === 'undefined') {
            this._modHandlers[modName][modValue] = []
        }
        this._modHandlers[modName][modValue].push(handler)

        return this
    },

    /**
     * Triggers event
     *
     * @eventName string
     * @data      anything Additional data
     */
    trigger: function (eventName, data) {
        if (this._domNode) {
            this._domNode.dispatchEvent(
                data
                    ? new CustomEvent(eventName, {detail:data})
                    : new Event(eventName)
            )
        }

        return this
    },

    /**
     * Triggers window event
     *
     * @eventName string
     * @data      anything Additional data
     */
    triggerWin: function (eventName, data) {
        if (this._domNode) {
            eventName = this.parentBlock()._name + ':' + eventName
            window.dispatchEvent(
                data
                    ? new CustomEvent(eventName, {detail:data})
                    : new Event(eventName)
            )
        }

        return this
    },

    /**
     * Gets current node index among siblings
     *
     * @return number
     */
    index: function () {
        var siblings = this._parentNode._children
        var dec = 0
        for (var i = 0, ii = siblings.length; i < ii; i++) {
            if (typeof siblings[i] === 'string') dec++
            if (siblings[i] === this) return i-dec
        }
    },

    /**
     * Empties children.
     */
    empty: function () {
        var children

        if (this._isExpandContext) {
            children = this._expandedChildren
            this._expandedChildren = []
        } else {
            children = this._children
            this._children = []
        }

        if (children) {
            for (var i = 0, ii = children.length; i < ii; i++) {
                if (children[i] instanceof BemNode) {
                    children[i]._unlink()
                }
            }
        }

        if (this._domNode) {
            while (this._domNode.firstChild) {
                this._domNode.removeChild(this._domNode.firstChild)
            }
        }

        return this
    },

    /**
     * Removes current node
     */
    remove: function (dontUnlink) {
        if (this._domNode) {
            this._domNode.parentNode.removeChild(this._domNode)
        }

        if (this._parentNode) {
            this._parentNode._children = this._parentNode._children.splice(this.index(), 1)
        }

        if (!dontUnlink) this._unlink()

        return this
    },

    /**
     * Appends new children. If there's no DOM yet,
     * appends to expandedChildren else appends to children
     * and renders its DOM.
     *
     * @children string|object Multiple argument
     */
    append: function () {
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            var child = arguments[i]

            if (child === false || child === null || typeof child === 'undefined') {
                continue
            } else if (Array.isArray(child)) {
                this.append.apply(this, child)
                continue
            } else if (child instanceof BemNode) {
                child.parentNode(this)
                if (child._isElem) {
                    if (this._isBlock) {
                        child.parentBlock(this)
                    } else if (this._attr.context) {
                        child.parentBlock(this._parentBlock)
                    }
                }
            } else if (typeof child === 'number') {
                child = child.toString()
            }

            if (this._domNode && !this._isReplaceContext) {
                this._children.push(child)
                this._renderChildWithIndex(this._children.length-1)
            } else if (this._isExpandContext) {
                if (!this._expandedChildren) this._expandedChildren = []
                this._expandedChildren.push(child)
            } else {
                this._children.push(child)
            }
        }

        return this
    },

    /**
     * Appends node to the target. If current node belongs to another parent,
     * method removes it from the old context.
     *
     * @bemNode object Target
     */
    appendTo: function (bemNode) {
        this.remove(true)
        bemNode.append(this)

        return this
    },

    /**
     * Replaces current bemNode with the new
     */
    replaceWith: function (bemNode) {
        this._completeExpand()

        var parentNode = this._parentNode
        var siblingsAfter

        if (parentNode) {
            if (parentNode === bemNode) {
                parentNode = this._prevParentNode
            } else {
                siblingsAfter = parentNode._children.splice(this.index())
                siblingsAfter.shift()
            }
            parentNode._isReplaceContext = true
            parentNode.append(bemNode)
            parentNode._isReplaceContext = false
        }

        if (siblingsAfter) {
            parentNode._children = parentNode._children.concat(siblingsAfter)
        }

        this._parentNode = null

        if (bemNode instanceof BemNode) {
            if (bemNode._isBlock) {
                bemNode._resetParentBlockForChildren()
            }
            bemNode.render()
        }
    },

    /**
     * Replaces current bemNode with the new wich implemets its declaration
     */
    implementWith: function (bemNode) {
        this._setDomNodeClasses()
        bemNode._implementedNode = this
        bemNode._extendProperty('_mod', this._mod)
        bemNode._extendProperty('_param', this._param)
        this._extendProperty('_mod', bemNode._mod)
        bemNode._defineUserMethods(this._name)
        this.replaceWith(bemNode)
    },

    /**
     * Filters text in children
     *
     * @return string
     */
    text: function () {
        var text = ''
        for (var i = 0, ii = this._children.length; i < ii; i++) {
            if (typeof this._children[i] === 'string') {
                text += this._children[i]
            }
        }

        return text
    },

    /**
     * Finds bemNodes and attributes by paths:
     * - nodeName1 (children)
     * - nodeName1/ (all children of children)
     * - nodeName1/nodeName2 (children of children)
     * - ../nodeName1 (children of parent)
     *
     * @path   string Multiple argument: path to node or attribute
     * @return array  bemNodes collection
     */
    get: function () {
        if (arguments.length === 0) return this._children

        var collections = []

        for (var i = 0, ii = arguments.length; i < ii; i++) {
            var pathItems = arguments[i].split('/')
            var collection

            for (var j = 0, jj = pathItems.length; j < jj; j++) {
                var pathItem = pathItems[j]

                if (j === 0) {
                    collection = this._filterChildNodes(pathItem)
                } else {
                    var prevCollection = collection
                    collection = []
                    for (var k = 0, kk = prevCollection.length; k < kk; k++) {
                        collection = collection.concat(
                            this._filterChildNodes.call(prevCollection[k], pathItem)
                        )
                    }
                }

                if (collection.length === 0) {
                    break
                }
            }

            if (ii === 1) {
                collections = collection
            } else {
                collections = collections.concat(collection)
            }
        }

        return collections
    },

    /**
     * Variation of get() method with current block forcing
     */
    getWithContext: function () {
        var children = this.get.apply(this, arguments)
        for (var i = 0, ii = children.length; i < ii; i++) {
            if (children[i] instanceof BemNode) {
                children[i]._forcedParentBlock = true
            }
        }
        return children
    },

    /**
     * Checks if there are any children
     *
     * @path string Multiple argument: path to node or attribute
     */
    has: function () {
        return this.get.apply(this, arguments).length > 0
    },

    /**
     * Set handler to call afted DOM-node inited
     *
     * @callback function Handler to call
     */
    afterDomInit: function (handler) {
        if (!this._domInited) {
            this._afterDomInitHandlers.push(handler)
        } else {
            handler.call(this)
        }

        return this
    },

    /**
     * Clones itself
     */
    clone: function () {
        var clone = {}
        clone.__proto__ = this.__proto__

        for (key in this) {
            if (key === '_children') {
                var cloneChildren = []
                for (var i = 0, ii = this._children.length; i < ii; i++) {
                    cloneChildren.push(
                        this._children[i] instanceof BemNode
                            ? this._children[i].clone()
                            : this._children[i]
                    )
                }
                clone._children = cloneChildren
            } else {
                clone[key] = this[key]
            }
        }

        return clone
    },

    /**
     * Expands bemNode. Creates DOM-node and appends to the parent bemNode's DOM.
     * Also renders its children. Inits DOM declarations at the end.
     *
     * @parentDOMNode object Parent for the root node attaching
     */
    render: function (parentDOMNode) {
        this._expand()

        if (!parentDOMNode && !this._parentNode) {
            return this
        }

        if (!this._domNode) {
            this._domNode = document.createElement(this._tag)
            this._domNode.bemNode = this

            if (this._id !== '') {
                this._domNode.id = this._id
            }

            this._setDomNodeClasses()
            this._setDomNodeCSS()

            for (key in this._domAttr) {
                this.domAttr(key, this._domAttr[key], true)
            }
        }

        if (parentDOMNode) {
            parentDOMNode.appendChild(
                this._domNode
            )
        } else {
            this._parentNode._domNode.appendChild(
                this._domNode
            )
        }

        for (var i = 0, ii = this._children.length; i < ii; i++) {
            this._renderChildWithIndex(i)
        }

        this._bemNodeIndex = Beast._bemNodes.length
        Beast._bemNodes.push(this)

        if (this._tag === 'body') {
            document.documentElement.replaceChild(this._domNode, document.body)
        }

        for (modName in this._mod) {
            this._callModHandlers(modName, this._mod[modName])
        }

        this._domInit()

        return this
    },

    /**
     * Gets HTML text for current node and its children.
     *
     * @return string
     */
    renderHTML: function () {
        var html = ''

        // Do some recursive routine here

        return html
    },

    /*
     * PRIVATE
     */

    /**
     * Recursive parent block setting
     *
     * @bemNode     object current node with children
     * @parentBlock object paren block reference
     */
    _setParentBlockForChildren: function (bemNode, parentBlock) {
        for (var i = 0, ii = bemNode._children.length; i < ii; i++) {
            var child = bemNode._children[i]
            if (child instanceof BemNode && child._isElem) {
                child.parentBlock(parentBlock)
            }
        }
    },

    /**
     * Collects children by node name
     *
     * @name   string Child node name
     * @return array  Filtered children
     */
    _filterChildNodes: function (name) {
        if (name === '..') {
            return [this._parentNode]
        }

        var collection = []
        for (var i = 0, ii = this._children.length; i < ii; i++) {
            var child = this._children[i]
            if (
                child instanceof BemNode && (
                    name === ''
                    || name === child._nodeName
                    || child._implementedNode && name === child._implementedNode._nodeName
                )
            ) {
                collection.push(child)
            }
        }

        return collection
    },

    /**
     * Creates DOM-node for child with @index and appends to DOM tree
     *
     * @index number Child index
     */
    _renderChildWithIndex: function (index) {
        var child = this._children[index]

        if (child instanceof BemNode) {
            child.render()
        } else {
            this._domNode.appendChild(
                document.createTextNode(child)
            )
        }
    },

    /**
     * Builds expanded children tree to replace the main
     */
    _expand: function () {
        if (this._isExpanded) return

        var decl = this._decl
        if (decl) {
            this._isExpandContext = true
            decl.commonExpand && decl.commonExpand.call(this)
            this._completeExpand()
            this._isExpandContext = false
        }
    },

    /**
     * Change children array to expanded children array
     * after node expanding
     */
    _completeExpand: function () {
        if (this._isExpandContext && this._expandedChildren) {
            this._children = this._expandedChildren
            this._expandedChildren = null
        }
        this._isExpanded = true
    },

    /**
     * Initial instructions for the DOM-element
     */
    _domInit: function () {
        var decl = this._decl
        if (decl) {
            decl.commonDomInit && decl.commonDomInit.call(this)
        }

        if (this._implementedNode && (decl = this._implementedNode._decl)) {
            decl.commonDomInit && decl.commonDomInit.call(this)
        }

        this._domInited = true

        if (this._afterDomInitHandlers.length !== 0) {
            for (var i = 0, ii = this._afterDomInitHandlers.length; i < ii; i++) {
                this._afterDomInitHandlers[i].call(this)
            }
        }
    },

    /**
     * Call modifier change handlers
     *
     * @modName  string
     * @modValue string
     * @data     object Additional data for handler
     */
    _callModHandlers: function (modName, modValue, data, context) {
        var handlers

        if (this._modHandlers[modName]) {
            if (this._modHandlers[modName][modValue]) {
                handlers = this._modHandlers[modName][modValue]
            } else if (modValue === false && this._modHandlers[modName]['']) {
                handlers = this._modHandlers[modName]['']
            } else if (modValue === '' && this._modHandlers[modName][false]) {
                handlers = this._modHandlers[modName][false]
            }
            if (this._modHandlers[modName]['*']) {
                if (handlers) {
                    handlers = handlers.concat(this._modHandlers[modName]['*'])
                } else {
                    handlers = this._modHandlers[modName]['*']
                }
            }
        }

        if (handlers) {
            if (typeof context === 'undefined') context = this
            for (var i = 0, ii = handlers.length; i < ii; i++) {
                handlers[i].call(context, data)
            }
        }

        if (this._implementedNode) {
            this._implementedNode._callModHandlers(modName, modValue, data, this)
        }
    },

    /**
     * Exntends object property with default object
     *
     * @propertyName string
     * @defaults     object
     */
    _extendProperty: function (propertyName, defaults)
    {
        var actuals = this[propertyName]

        for (key in defaults) {
            if (typeof actuals[key] !== 'undefined' && actuals[key] !== '') {
                this[propertyName][key] = actuals[key]
            } else {
                this[propertyName][key] = defaults[key]
            }
        }

        return this
    },

    /**
     * Sets DOM classes
     */
    _setDomNodeClasses: function (returnClassNameOnly) {
        var className = this._name
        var value
        var tail

        for (key in this._mod) {
            value = this._mod[key]
            if (value === '' || value === false) continue

            tail = value === true
                ? '_' + key
                : '_' + key + '_' + value

            className += ' ' + this._name + tail

            for (var i = 0, ii = this._mix.length; i < ii; i++) {
                className += ' ' + this._mix[i] + tail
            }
        }

        if (this._implementedNode) {
            className += ' ' + this._implementedNode._setDomNodeClasses(true)
        }

        for (var i = 0, ii = this._mix.length; i < ii; i++) {
            className += ' ' + this._mix[i]
        }

        if (returnClassNameOnly) {
            return className
        } else {
            this._domClasses = className.split(' ')

            if (this._domNode) {
                this._domNode.className = className
            }
        }
    },

    /**
     * Sets DOM CSS
     */
    _setDomNodeCSS: function () {
        var css = ''

        for (name in this._css) {
            if (this._css[name] || this._css[name] === 0) {
                css += name + ':' + this._css[name] + ';'
            }
        }

        if (css !== '') this._domNode.setAttribute('style', css)
    },

    /**
     * Recursive setting parentBlock as this for child elements
     */
    _resetParentBlockForChildren: function () {
        for (var i = 0, ii = this._children.length; i < ii; i++) {
            var child = this._children[i]
            if (child instanceof BemNode && child._isElem) {
                child.parentBlock(this._parentBlock)
                child._resetParentBlockForChildren(this._parentBlock)
            }
        }
    },

    /**
     * Defines user's methods
     */
    _defineUserMethods: function (selector) {
        var decl = selector ? Beast._decl[selector] : this._decl
        if (decl) {
            for (methodName in decl.userMethods) {
                this[methodName] = decl.userMethods[methodName]
            }
        }
    },

    /**
     * Clears user's methods
     */
    _clearUserMethods: function () {
        if (this._name === '' || !Beast._decl[this._name]) return
        var userMethods = Beast._decl[this._name].userMethods
        for (methodName in userMethods) {
            this[methodName] = null
        }
    },

    /**
     * Unlinks node from the common list of nodes
     */
    _unlink: function () {
        var decl = this._decl
        if (decl) {
            decl.onRemove.call(this)
        }

        if (this._bemNodeIndex >= 0) {
            Beast._bemNodes[this._bemNodeIndex] = null
        }
    },

    /**
     * Finds @path to decl method equal to @caller
     *
     * @caller  function
     * @context object
     * @path    array
     */
    _findCallerPath: function (caller, context, path) {
        if (typeof path === 'undefined') path = []

        for (var key in context) {
            if (typeof context[key] === 'object') {
                var possiblePath = this._findCallerPath(caller, context[key], path.concat(key))
                if (typeof possiblePath !== 'undefined') return path.concat(possiblePath)
            } else if (typeof context[key] === 'function' && context[key] === caller) {
                return path.concat(key)
            }
        }
    }
}

Beast.BemNode = BemNode

var cssPxProperty = {
    height:1,
    width:1,
    left:1,
    right:1,
    bottom:1,
    top:1,
    'line-height':1,
    'font-size':1
}

})();
