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
    this._renderedOnce = false      // Flag if compontent was rendered once at least

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
            if (this._domNode) {
                this.remove(true)
            }
            if (bemNode !== this._parentNode) {
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
    empty: function (dontUnlink) {
        var children

        if (this._isExpandContext) {
            children = this._expandedChildren
            this._expandedChildren = []
        } else {
            children = this._children
            this._children = []
        }

        if (children && !dontUnlink) {
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
        if (this._domNode && this._domNode.parentNode) {
            this._domNode.parentNode.removeChild(this._domNode)
        }

        if (this._parentNode) {
            this._parentNode._children.splice(
                this._parentNode._children.indexOf(this), 1
            )
            this._parentNode = null
        }

        if (!dontUnlink) {
            this._unlink()
        }

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

        // Call expand handler
        if (!this._isExpanded && this._decl && this._decl.commonExpand) {
            this._isExpandContext = true
            this._decl.commonExpand.call(this)
            this._completeExpand()
            this._isExpandContext = false
        }

        // Continue only if parent node is defined
        if (!parentDOMNode && !this._parentNode) {
            return this
        }

        // Create DOM element if there isn't
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

        // Append to DOM tree
        if (parentDOMNode) {
            parentDOMNode.appendChild(
                this._domNode
            )
        } else {
            this._parentNode._domNode.appendChild(
                this._domNode
            )
        }

        // Render children
        for (var i = 0, ii = this._children.length; i < ii; i++) {
            this._renderChildWithIndex(i)
        }

        // Save to global compontens array
        this._bemNodeIndex = Beast._bemNodes.length
        Beast._bemNodes.push(this)

        // For HTML-body remove previous body tag
        if (this._tag === 'body') {
            document.documentElement.replaceChild(this._domNode, document.body)
        }

        // Call mod handlers
        for (modName in this._mod) {
            this._callModHandlers(modName, this._mod[modName])
        }

        // Call DOM init handlers
        this._domInit()

        // Compontent was rendered once at least
        this._renderedOnce = true

        return this
    },

    /**
     * Gets HTML text for current node and its children.
     *
     * @return string
     */
    renderHTML: function () {
        var html = ''

        //TODO: Some recursive routine here

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
        } else if (!this._renderedOnce) {
            this._domNode.appendChild(
                document.createTextNode(child)
            )
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
