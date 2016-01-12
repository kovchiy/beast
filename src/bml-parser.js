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
