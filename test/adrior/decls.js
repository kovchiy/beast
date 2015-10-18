Beast

.decl('link', {
    noElems:true
})

.decl('abstract', {
    mod: {
        theme: 'classic'
    },
    on: {
        click: function () {
            this.mod('theme', 'modern')
        }
    }
})

.decl('showcase', {
    inherits:'abstract',
    mod: {
        foo:true
    },
    expand: function () {
        this.append(
            this.get('Link'),
            this.get('item'),
            <Foo Size="S" foo="123"/>,
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
    },
    onMod: {
        state: {
            release: function () {
                console.log('state', 'release')
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
                theme:'normal',
                foo:true
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
                <Button>Купить</Button>
            )
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
            console.log('after dom init')
            this.mod('state', 'release')
        })
    }
})