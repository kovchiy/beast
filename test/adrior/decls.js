Beast

Beast.decl('admin-sidebar', {
    expand: function() {
        this.append(
            <Menu stays="open">
                <Menu State="closed"></Menu>
            </Menu>
        )
    }
})

.decl('link', {
    noElems:true
})

.decl('showcase', {
    mod: {
        foo:true
    },
    expand: function () {
        this.append(
            <Foo Size="S" xfoo="123">{
                this.getWithContext()
            }</Foo>,
            <wrap>
                <baz>
                    <bar>$</bar>
                </baz>
            </wrap>
        )
    },
    domInit: function () {
        this.css('display', 'block')
        this.triggerWin('foo')
        console.log(Beast.findNodeById('uniq'))
    },
    onMod: {
        state: {
            release: function () {
                // console.log('state', 'release')
            }
        },
        foo: {
            'true': function () {
                console.log('foo true')
            }
        }
    }
})

.decl('showcase__item', {
    expand: function () {
        this.append(
                this.get('img'),
                this.get('title'),
                this.get('buy')
            )
            .css('font-weight', 'bold')
    },
    on: {
        click: function (e, data) {
            this.parentBlock()
            this.trigger()
        }
    }
})

.decl('showcase__img', {
    tag: 'img',
    expand: function () {
        this.empty()
            .domAttr({
                src: this.text(),
                width: 200
            })
            .css({
                display:'block',
                cursor:'pointer'
            })
            .mod({
                state:'release',
                theme:'normal'
            })
            .param({
                url:'#foo',
                type:'car'
            })
    }
})

.decl('showcase__buy', {
    expand: function () {
        this.implementWith(
                <Button Theme="foo">Купить</Button>
            )
    },
    domInit: function () {
        this.mod('type', 'action')
    },
    on: {
        click: function () {
            this.buy()
        }
    },
    buy: function () {
        console.log('Car was bought')
    }
})

.decl('button', {
    on: {
        click: function () {
            console.log('Button was clicked')
        }
    },
    onWin: {
        'showcase:foo': function () {
        }
    }
})

.decl('showcase__bar', {
    domInit: function () {
        this.parentBlock().afterDomInit(function () {
            this.mod('state', 'release')
        })
    }
})