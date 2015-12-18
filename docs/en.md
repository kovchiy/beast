![Beast](//github.com/kovchiy/beast/blob/master/images/cover.png)

[BEM-methodology]: https://en.bem.info/method/
[i-bem.js]: https://en.bem.info/technology/i-bem/v2/i-bem-js/
[bh]: https://github.com/bem/bh
[React]: http://facebook.github.io/react/

* [Beast](#beast)
* [BML-markup](#bmlmarkup)
* [Component](#component)
* [Declaration](#declaration)
  * [Expansion](#declaration-expand)
  * [Behavior](#declaration-dominit)
  * [Declaration inheritance](#declaration-inheritance)
  * [User methods](#declaration-usermethods)
* [Summary](#declaration-final)
* [Reference](#ref)
  * [BML](#ref-bml)
    * [block](#ref-bml-block)
    * [context](#ref-bml-context)
    * [mix](#ref-bml-mix)
    * [tag](#ref-bml-tag)
    * [id](#ref-bml-id)
  * [BemNode](#ref-bemnode)
    * [isBlock](#ref-bemnode-isblock)
    * [isElem](#ref-bemnode-iselem)
    * [selector](#ref-bemnode-selector)
    * [id](#ref-bemnode-id)
    * [parentBlock](#ref-bemnode-parentblock)
    * [parentNode](#ref-bemnode-parentnode)
    * [domNode](#ref-bemnode-domnode)
    * [defineMod](#ref-bemnode-definemod)
    * [defineParam](#ref-bemnode-defineparam)
    * [mix](#ref-bemnode-mix)
    * [mod](#ref-bemnode-mod)
    * [param](#ref-bemnode-param)
    * [domAttr](#ref-bemnode-domattr)
    * [css](#ref-bemnode-css)
    * [on](#ref-bemnode-on)
    * [onWin](#ref-bemnode-onwin)
    * [onMod](#ref-bemnode-onmod)
    * [trigger](#ref-bemnode-trigger)
    * [triggerWin](#ref-bemnode-triggerwin)
    * [index](#ref-bemnode-index)
    * [empty](#ref-bemnode-empty)
    * [remove](#ref-bemnode-remove)
    * [append](#ref-bemnode-append)
    * [appendTo](#ref-bemnode-appendto)
    * [replaceWith](#ref-bemnode-replacewith)
    * [implementWith](#ref-bemnode-implementwith)
    * [text](#ref-bemnode-text)
    * [get](#ref-bemnode-get)
    * [getWithContext](#ref-bemnode-getwithcontext)
    * [has](#ref-bemnode-has)
    * [afterDomInit](#ref-bemnode-afterDomInit)
    * [render](#ref-bemnode-render)
    * [renderHTML](#ref-bemnode-renderhtml)
  * [Beast.decl()](#ref-decl)
    * [inherits](#ref-decl-inherits)
    * [expand](#ref-decl-expand)
    * [mod](#ref-decl-mod)
    * [param](#ref-decl-param)
    * [mix](#ref-decl-mix)
    * [tag](#ref-decl-tag)
    * [domAttr](#ref-decl-domattr)
    * [noElems](#ref-decl-noelems)
    * [domInit](#ref-decl-dominit)
    * [on](#ref-decl-on)
    * [onWin](#ref-decl-onwin)
    * [onMod](#ref-decl-onmod)
  * [Addon methods](#ref-beast)
    * [node](#ref-beast-node)
    * [findNodes](#ref-beast-findnodes)
    * [findNodeById](#ref-beast-findnodebyid)
    * [require](#ref-beast-require)
    * [parseBML](#ref-beast-parsebml)
* [Recipes](#recipes)
  * [Hello, world](#recipes-helloworld)
  * [Code style](#recipes-codestyle)
  * [Strict API](#recipes-api)
  * [Component's interaction](#recipes-interaction)
  * [CSS](#recipes-css)
  * [Complex expansion](#recipes-expand)
* [Project examples](#examples)

<a name="beast"/>
# Beast

Beast is the tool for creating web-interfaces. It covers development cycle from templating to component's interactions. It is derived from several principals and methodologies like:
* [BEM-methodology]
* [i-bem-js]
* [bh]
* [React]

So the main idea behind it is that interface is built from components. Each component has it's own unique BEM selector, bound data, and expansion and behavior rules based on those properties.

There are three points:
* Usage of BML-markup (superset of XML)
* Component methods
* Component's declarations of the expansion and behavior

---

![](http://jing.yandex-team.ru/files/kovchiy/ME3050430039_2.jpg)

<a name="bmlmarkup"/>
## BML-MARKUP

Every UI is a semantic hierarchy. One component incorporates others, some of them depend on context, some of them are not. _Block_ is for independent components. Blocks can consist of child components called _elements_. Blocks and elements have properties whcih could change them, those properties are _modifiers_. Those could be state, type, behavior, theme etc.

XML is pretty common way of describing hierarchy. It helps to see the content and properties of described entity. Content could be text, other entity or mix of both. Lets look at a simple example of the hierarchy - browser interface:

```xml
<Browser>
    <head>
        <Tabs>
            <tab State="active">Yandex</tab>
            <tab State="release">Lenta.ru</tab>
            <newtab/>
        </Tabs>
        <Addressbar>https://yandex.ru</Addressbar>
    </head>
    <content>
        <Webview State="active" url="https://yandex.ru"/>
        <Webview State="release" url="http://lenta.ru"/>
    </content>
</Browser>
```

In this particular case _blocks_ are the following entities:
* Browser
* Tabs
* Addressbar
* Webview

Names of the independent components (_blocks_) start with the capital letter. This helps us see the start of the new independent entity in or hierarchy. Names of the all dependent items(_elements_, which has no purpose outside of it's parent) start with lower letter.

_Elements_ form closed system of components which interact with each other. _Block_ in that case is the border of this bound system, and it could have some properties which are related to all the _elements_.

Elements in the browser example could have attributes. Attributes could be of two types: _modifier_ or _parameter_.
As said before _modifiers_ describe some of the component's properties which most of the time could be observed:
* state(up/down/disabled)
* theme(light/dark)
* etc.

_Params_ on the other hand is properties which are not related to a look of the components, but attributes which contain some useful information for the work of the component:
* URL
* identifiers
* counters
* logic data
* etc.

_Modifier's_ name starts with the capital letter, _property_ name starts with the lower letter.

HTML markup of the BML browser example is going to look like this:
```xml
<div class="browser">
    <div class="browser__head">
        <div class="tabs">
            <div class="tabs__tab tabs__tab_state_active">Yandex</div>
            <div class="tabs__tab tabs__tab_state_release">Lenta.ru</div>
            <div class="tabs__newtab"></div>
        </div>
        <div class="addressbar">https://yandex.ru</div>
    </div>
    <div class="browser__content">
        <div class="webview webview_state_active"></div>
        <div class="webview webview_state_release"></div>
    </div>
</div>
```

All the semantics from the BML markup goes into classes of the HTML markup. Basically `Browser` was transformed into `div class="browser"` and `tabs` inside `Browser` is now `div class ="browser__tabs"`. Now it is simple to describe interface with CSS:

```css
.browser {
  background-color: #555;
}

.browser__tabs {
  background-color: #EEE;
}

.webview {
    position:absolute;
    top:0;
    bottom:0;
    left:0;
    right:0;
}
.webview_state_release {
    display:none;
}
.webview_state_active {
    display:block;
}
```

This notation helps browser to render all the css styles more efficiently because there are no cascading styles, ad it helps identify component and it automatically gets it's own unique selector, so there is no selectors clash. Using preprocessors/postrocessors are highly advised, because it removes necessity of writing long selectors.

```less
.webview {
    position:absolute;
    top:0;
    bottom:0;
    left:0;
    right:0;
    &_state {
        &_release {
            display:none;
        }
        &_active {
            display:block;
        }
    }
}
```

BML-разметка предварительно компилируется в js-эквивалент (HTML-разметка генерируется после):
```js
Beast.node(
    'Browser',
    {'context':this},
    Beast.node(
        'head',
        null,
        Beast.node(
            'Tabs',
            null,
            Beast.node('tab', {'State':'active'}, 'Yandex'),
            Beast.node('tab', {'State':'release'}, 'Lenta.ru'),
            Beast.node('newtab', null)
        ),
        Beast.node('Addressbar', null, 'https://yandex.ru')
    ),
    Beast.node(
        'content',
        null,
        Beast.node('Webview', {'State':'active', 'url':'https://yandex.ru'}),
        Beast.node('Webview', {'State':'release', 'url':'http://lenta.ru'})
    )
)
```

А раз конечный формат — javascript, ничто не мешает использовать его элементы в BML:
```xml
<Button id="{Math.random()}">Save</Button>
```

На самом же деле, парсер обрабатывает только подстроки вида `<item>...</item>`; и всё, что снаружи, остается всё тем же javascript. Поэтому можно писать так:

```js
var label = "Save"
var node = <Button>{label}</Button>
```

В HTML-файл BML-разметка подключается двумя способами: либо тегом `link` с указанием `type="bml"` и адресом до файла, либо тегом `script` тоже с указанием `type="bml"`, а внутри BML-дерево.

```xml
<html>
    <head>
        <script src="beast.js"></script>
        <link type="bml" href="browser.bml"/>
        <script type="bml">
            <Browser>...</Browser>
        </script>
    </head>
</html>
```

Для карткости теги `html` и `head` можно опускать — браузер сам сгенерирует эту структуру. И, если содержимое `<script type="bml">` будет начинаться и заканчиваться BML-разметкой, парсер автоматически допишет финальный метод генерации и присоединения `Beast.node(...).render(document.body)` — так DOM-дерево станет дочерним элементом тега `body`. Рекомендуется также всегда указывать в начале кодировку utf-8. В итоге содержимое HTML-файла сократится до такого:

```xml
<meta charset="utf8">
<script src="beast.js"></script>
<link type="bml" href="browser.bml"/>

<script type="bml">
    <Browser>...</Browser>
</script>
```

Хорошей практикой считается подключение через `link` файлов с декларациями, а в `script` хранение общей разметки экрана или страницы.

---

![](http://jing.yandex-team.ru/files/kovchiy/beast-bemnode-24234.jpg)

<a name="component"/>
## Компонент (BemNode)

В javascript BML-разметка компилируется во вложенные друг в друга компоненты — экземпляры класса BemNode.

```js
var button = <Button>Найти</Button>
↓
var button = Beast.node('Button', null, 'Найти')
↓
var button = new Beast.BemNode('Button', null, ['Найти'])
```

Методы BemNode могут модифицировать свой экземпляр: определять содержимое, поведение, параметры и так далее.

```js
var button = <Button>Найти</Button>
var text = button.text()

button
    .tag('button')
    .empty()
    .append(<label tag="span">{text}</label>)
    .render(document.body)
    .on('click', function () {
        console.log('clicked')
    })
```

Работа с компонентами ведется внутри деклараций. Соответствие компонента и декларации устанавливается через селектор. Декларации исполняются в момент вызова метода `render()`. Метод `render` вызывается автоматичсеки при создании корневого компонента внутри тега `<script type="bml">`:

```xml
<meta charset="utf8">
<script type="text/javascript" src="beast.js"></script>
<link type="bml" href="browser.bml"/>

<script type="bml">
    <Browser>...</Browser>
</script>
↓
<script type="text/javascript">
    Beast.node('Browser', null, ...).render(document.body)
</script>
```

---

![](http://jing.yandex-team.ru/files/kovchiy/ME3050436531_2.jpg)

<a name="declaration"/>
## ДЕКЛАРАЦИЯ

Описывает развертку (expand) и поведение (domInit) компонента. Представляет собой метод `Beast.decl()` с двумя параметрами: селектор компонента (CSS-класс) и набор описаний.

```js
Beast.decl('my-block', {
    expand: function () {},
    domInit: function () {}

})
```

<a name="declaration-expand"/>
### Развертка

Входные данные блока не должны максимально подробно описывать результирующую структуру — следует указывать лишь изменяемые части. Например, блоке `tabs`:

```xml
<Tabs>
    <tab State="active">Yandex</tab>
    <tab State="release">Lenta.ru</tab>
    <newtab/>
</Tabs>
```

На самом же деле у каждого таба должен быть крестик, и раз его наличие обязательно, нет смысла это указывать каждый раз при разметке интерфейса. Тем не менее, чтобы крестик оказался в результирующем HTML-дереве, финальное BML-дерево должно быть соответствующим:

```xml
<Tabs>
    <tab State="active">
        <label>Yandex</label>
        <close/>
    </tab>
    <tab State="release">
        <label>Lenta.ru</label>
        <close/>
    </tab>
    <newtab/>
</Tabs>
```

Преобразование BML-дерева именуется _разверткой_. Правило развертывания описываются в декларации полем `expand`:

```js
Beast.decl('tabs__tab', {
    expand: function () {
        this.append(
            <label>{this.text()}</label>,
            <close/>
        )
    }
})
```

Функция `expand` выполняется в контексте объекта `BemNode`. C каждым компонентом интерфейса связывается такой объект, речь о котором пойдет в следующем разделе; а пока будут упоминаться лишь некоторые из его методов.

##### append
В последнем примере используется метод `append`, разобраться в механизме и мотивах появления которого важно для понимания сути и удобства развертывания. Поскольку развертывание — это преобразование BML-дерева, должны быть состояния дерева до изменений и после. Можно было бы преобразовывать одно и то же дерево, тогда какой-нибудь более сложный код функции `expand` с несколькими вызовами `append` выглядел бы так:

```xml
<Article>
    <title>...</title>
    <author>...<author>
    <text>...</text>
<Article>
```

```js
Beast.decl('article', {
    expand: function () {
        var title = this.get('title')
        var text = this.get('text')
        var author = this.get('author')

        this.empty()

        if (!this.mod('no-title')) {
            this.append(title)
        }

        this.append(text, author)
    }
})
```

Метод `mod` возвращает значение модификатора. В данном случае, если нет модификатора `no-title`, можно выводить заголовок. Метод `empty` очищает содержимое компонента перед началом присоединения дочерних элементов. Вне зависимости от порядка входных данных, имя автора должено стоять в конце статьи.

Из-за необходимости очищать дерево для перестановки его элементов, приходится делать множество предварительных сохранений этих самых элементов. Второй способ — складывать нужный порядок в массив и вызывать append единожды в конце:

```js
Beast.decl('article', {
    expand: function () {
        var content = []

        if (!this.mod('no-title')) {
            content.push(
                this.get('title')
            )
        }

        this.append(
            this.get('text'),
            this.get('author')
        )

        this.empty()
        this.append(content)
    }
})
```

Уже лучше. Теперь `content` играет роль временного массива дочерних элементов, который в конце работы метода заменяет старый. Но с таким подходом каждый метод `expand` будет традиционно начинаться с `var content = []` и заканчиваться методами `empty` и `append(content)`. От этой рутины можно избавиться, если метод `append` в контексте развертывания будет автоматически складывать свои аргументы в новый массив дочерних элементов, который после завершения метода `expand` заменит собой старый массив. Поэтому, с учетом вышесказанного, результирующий код выглядит так:

```js
Beast.decl('article', {
    expand: function () {
        if (!this.mod('no-title')) {
            this.append(
                this.get('title')
            )
        }

        this.append(
            this.get('text'),
            this.get('author')
        )
    }
})
```

##### Поля mod и param
Также на этапе развертывания можно определить модификаторы и параметры компонента с их значениями по умолчанию. Такие определения полезны для автоспецификации API.

```js
Beast.decl('tabs__tab', {
    mod: {
        state:'release'
    },
    param: {
        url:''
    },
    expand: function () {
    }
})
```

##### Направление обхода
Развертывание производится от родителя к ребенку. На примере с интерфейсом браузера:

```xml
<Browser>
    <head>
        <Tabs>...</Tabs>
        <Addressbar>...</Addressbar>
    </head>
    <content>
        <Webview/>
    </content>
</Browser>
```

Последовательность обхода: Browser, head, Tabs, Addressbar, content, Webview. Сделано это для того, чтобы всегда оставался шанс доуточнить содержимое и развернуть его тоже:

```js
Beast
.decl('browser', {
    expand: function () {
        this.append(
            this.get('head'),
            this.get('content'),
            <statusbar/>
        )
    }
})
.decl('browser__statusbar', {
    expand: function () {
        console.log('statusbar expand')
    }
})
```

При обратном обходе дерева добавленный элемент `statusbar` не раскроется — пришлось бы с его добавлением запускать новый обход в противоположную сторону.

<a name="declaration-dominit"/>
### Поведение

После процедуры развертывания запускается процедура генерации DOM-дерева и его инициализации — чаще всего навешивание обработчиков событий.

```js
Beast.decl('tabs__tab', {
    domInit: function () {
        this.on('click', function () {
            this.mod('state', 'active')
        })
    }
})
```

Методы обработки событий имеют свое поле в декларации:

```js
Beast.decl('tabs__tab', {
    on: {
        click: function () {
            this.mod('state', 'active')
        }
    }
})
```

DOM-инициализация производится от ребенка к родителю, в отличии от развертывания. Сделано это для того, чтобы родитель мог вызывать DOM-методы своих детей — наиболее частый сценарий работы на этом этапе. А при обратном обходе вложенные узлы будут инициализироваться первыми.

<a name="declaration-inheritance"/>
### Наследование деклараций

Одни компоненты могут расширять или доуточнять другие. Например, общий принцип работы табов — переключение между друг другом — можно отделить от внешнего вида и прочих частностей в отдельный блок abstract-tabs. Так все последующие реализации табов смогут наследовать это поведение и дополнять его своим: например, табы браузера могут не только переключаться, но и закрываться

```js
Beast

.decl('abstract-tabs__tab', {
    on: {
        click: function () {
            this.parentBlock().get('tab').forEach(function (tab) {
                tab.mod('state', 'release')
            })
            this.mod('state', 'active')
        }
    }
})

/* ... */

.decl('browser-tabs__tab', {
    inherits:'abstract-tabs__tab',
    expand: function () {
        this.append(this.text(), <close/>)
    },
    domInit: function () {
        this.get('close').on('click', function () {
            this.remove()
        }.bind(this))
    }
})
```

<a name="declaration-usermethods"/>
### Пользовательские методы

Помимо стандартного набора методов, полный список которых приведен в справочнике, в декларации можно указывать дополнительные. Например, клик по крестику вкладки браузера сначала должен проиграть анимацию закрытия, а только потом удалиться:

```js
.decl('browser-tabs__tab', {
    expand: function () {
        this.append(this.text(), <close/>)
    },
    domInit: function () {
        this.get('close').on('click', function () {
            this.close()
        }.bind(this))
    },
    close: function () {
        jQuery(this.domElem()).fadeOut(100, function () {
            this.remove()
        }.bind(this))
    }
})
```

---

![](http://jing.yandex-team.ru/files/kovchiy/lamp-234234234.jpg)

<a name="declaration-final"/>
## Итого

* Интерфейс представляется иерархией компонент двух типов: независимые блоки и зависимые элементы; иерархию описывает BML-разметка.
* Разметка компилируется в цепочку вложенных методов `Beast.node()`, которая и формирует дерево компонентов.
* Разметка должна иметь единственный корневой компонент.
* Структура компонентов преобразуется и дополняется поведением через декларации.
* Структуру компонентов повторяет соответствующее DOM-дерево, где каждый компонент получает DOM-узел.
* DOM-узел хранит ссылку на свой компонент в свойстве `bemNode`.
* Компоненты — это экземпляры класса BemNode.
* Функции деклараций выполняются в контексте соответствущего компонента.
* Модификация структуры компонентов производится только методами компонентов. На этапе инициализации и далее, когда за иерархией компонент закреплено DOM-дерево, изменения отражаются и на нем.

---

![](http://jing.yandex-team.ru/files/kovchiy/ME3050436521_2.jpg)

<a name="ref"/>
## СПРАВОЧНИК

<a name="ref-bml"/>
### BML
У BML-разметки есть зарезервированные атрибуты.

<a name="ref-bml-block"/>
#### block
Фиксирует родительский блок, чтобы складывать элементы одного блока внутрь другого.
```js
Beast.decl('tabs__tab', {
    expand: function () {
        this.append(
            <Button>
                <close block="{this}"/>
            </Button>
        )
    },
})
```

<a name="ref-bml-context"/>
#### context
По большей части служебный атрибут и проставляется автоматически. Но о наличии атрибута нужно знать хотя бы для того, чтобы его не занимать. Нужен для указания контекста создания элемента, чтобы закрепить его за блоком уже в момент создания. Например, в момент своего создания элемент close должен знать контекст, чтобы получить ссылку на родительский блок, получить полное имя `tabs__close`, найти свою декларацию и так далее.
```js
Beast.decl('tabs__tab', {
    expand: function () {
        this.append(
            <close/> // А на самом деле <close context="{this}"/>
        )
    },
})
```

<a name="ref-bml-mix"/>
#### mix
Дополнительные CSS-классы для DOM-элемента. Модификаторы компонента не распространяются на подмешанные классы.

```xml
<My-button mix="Button Button_type_action" State="release">Найти</My-button>
↓
<div mix="My-button My-button_state_release Button Button_type_action" m:state="release">Найти</div>
```

<a name="ref-bml-tag"/>
#### tag
Имя тега DOM-элемента.

```xml
<Link tag="a"></Link>
↓
<a class="link"></a>
```

<a name="ref-bml-id"/>
#### id
Идентификатор, который запишется и в объект компонента, и в его DOM-элемент.
```xml
<Link id="save"></Link>
```

---

<a name="ref-bemnode"/>
### BemNode

<a name="ref-bemnode-isblock"/>
#### isBlock ():boolean
Является ли компонент блоком.

<a name="ref-bemnode-iselem"/>
#### isElem ():boolean
Является ли компонент элементом.

<a name="ref-bemnode-selector"/>
#### selector ():string
Получить селектор элемента `block` или `block__elem`.

<a name="ref-bemnode-id"/>
#### id ([id:string]) [:string]
Получить или назначить идентификатор компонента.
```js
Beast.decl('button', {
    expand: function () {
        this.id('save')
        console.log(this.id) // save
    }
})
↓
<button class="button" id="save">Сохранить</button>
```

<a name="ref-bemnode-parentblock"/>
#### parentBlock ([node:BemNode]) [:BemNode]
Получить или назначить родительский блок. Если компонент является блоком, он сам себе родительский блок. Если элемент имплементируется блоком (см. метод `implementWith`), `parentBlock` для блока вернет родительский блок элемента.

<a name="ref-bemnode-parentnode"/>
#### parentNode ([node:BemNode]) [:BemNode]
Получить или назначить родительский компонент.

<a name="ref-bemnode-domnode"/>
#### domNode ():DOMElement
Получить соответствующий элемент DOM-дерева.

<a name="ref-bemnode-definemod"/>
#### defineMod (defaults:object)
Объявить модификаторы и их значения по умолчанию.

```js
this.defineMod({
    state:'release',
    type:'action',
    size:'M'
})
```

<a name="ref-bemnode-defineparam"/>
#### defineParam
Объявить параметры и их значения по умолчанию.

```js
this.defineParam({
    url:'',
    maxlength:20
})
```

<a name="ref-bemnode-mix"/>
#### mix (class:string...)
Добавить CSS-класс к компоненту.

<a name="ref-bemnode-mod"/>
#### mod (modName:string, [modValue:string|boolean], [data:anything]) [:string|boolean]
Получить или назначить модификатор. При установке модификатора третьим аргументом можно передать параметр `data` — некая дополнительная информация обработчику. Например, при таком способе установки модификатора, не будет вызываться событие окна:

```js
Beast.decl('popup', {
    onMod: {
        state: {
            active: function (isSilent) {
                if (!isSilent) this.triggerWin('active')
            }
        }
    },
    expand: function () {
        this.mod('state', 'active', true)
    }
})
```

То же самое, записанное иначе:

```js
Beast.decl('popup', {
    expand: function () {
        this.onMod('state', 'active', function (isSilent) {
                if (!isSilent) this.triggerWin('active')
            })
            .mod('state', 'active', true)
    }
})
```

Несколько за один вызов:
```js
.decl('tabs__tab', {
    expand: function () {
        this.mod({
                state:'release',
                theme:'normal'
            })
    }
})
```

<a name="ref-bemnode-param"/>
#### param (paramName:string, [paramValue:anything]) [:anything]
Получить или назначить параметр.

Несколько за один вызов:
```js
.decl('tabs__tab', {
    expand: function () {
        this.param({
                url:'#foo',
                num:1
            })
    }
})
```

<a name="ref-bemnode-domattr"/>
#### domAttr (attrName:string, [attrValue:string]) [:string]
Получить или назначить аттрибут DOM-узла.

Несколько за один вызов:
```js
.decl('tabs__tab', {
    expand: function () {
        this.domAttr({
                src: this.text(),
                width: 200
            })
    }
})
```

<a name="ref-bemnode-css"/>
#### css (property:string, value:string|number) [:string]
Назначить или получить CSS-правило DOM-узла.

Назначить несколько за один вызов:
```js
.decl('tabs__tab', {
    expand: function () {
        this.css({
                display:'block',
                cursor:'pointer'
            })
    }
})
```

<a name="ref-bemnode-on"/>
#### on (eventName:string, handler:function)
Устанавливает обработчик DOM-события. Можно перечислять несколько событий через пробел. Метод `trigger`, как и метод `mod`, может инициировать событие вместе с дополнительной информацией — обработки события примет эту информацию первым аргументом.

```js
Beast.decl('button', {
    domInit: function () {
        this.on('click', function () {})
            .on('mouseup mousedown', function (e, data) {})
    }
})
```

<a name="ref-bemnode-onwin"/>
#### onWin ()
Реакция компонента на события окна, которое играет роль общей шины событий в том числе. Обработчик события выполняется в контексте текущего компонента.

```js
Beast.decl('popup', {
    domInit: function () {
        this.onWin('resize', function () {
                this.updatePosition()
            })
            .onWin('popup:open', function (e) {
                if (!e.currentTarget.bemNode === this) {
                    this.hide()
                }
            })
    }
})
```

Названия событий общей шины от компонент автоматически предворяются селектором (родителького в случае с элементом) блока, чтобы исключить пересечение имен и сделать подписку более наглядной. В примере `popup` подписывается на событие открытия себеподобных и закрывается.

<a name="ref-bemnode-onmod"/>
#### onMod (modName:string, modValue:string, handler:function)
Реакция компонента на изменение модификатора.

```js
Beast.decl('popup', {
    expand: function () {
        this.onMod('state', 'active', function (isSilent) {
                if (!isSilent) this.triggerWin('active')
            })
            .mod('state', 'active', true)
    }
})
```

<a name="ref-bemnode-trigger"/>
#### trigger (eventName:string, data:anything)
Инициирует DOM-событие.

<a name="ref-bemnode-triggerwin"/>
#### triggerWin (eventName:string, data:anything)
Инициирует DOM-событие окна. К имени события окна автоматически добавляется префикс `селектор:`.

```js
Beast.decl('popup', {
    domInit: function () {
        this.onWin('popup:open', function () {...})
            .triggerWin('open')
    }
})
```

<a name="ref-bemnode-index"/>
#### index () :number
Порядковый номер компонента в массиве детей родительского узла. Отсчет с нуля.

<a name="ref-bemnode-empty"/>
#### empty ()
Удалить содержимое компонента.

<a name="ref-bemnode-remove"/>
#### remove ()
Удалить компонент.

<a name="ref-bemnode-append"/>
#### append (child:BemNode|string...)
Добавить содержимое в конец списка детей. В контексте развертки дети добавляются во временный массив, в контексте поведения — в основной.

```js
Beast.decl('button', {
    expand: function () {
        this.append('Найти')
            .append(
                <content>
                    <icon/>
                    <label>Найти</label>
                <content>
            )
            .append(
                'Найти',
                <label>Найти</label>,
                <content>
                    <icon/>
                    <label>Найти</label>
                <content>
            )
    },
    domInit: function () {
        this.append(
                'Найти',
                <label>Найти</label>,
                <content>
                    <icon/>
                    <label>Найти</label>
                <content>
            )
    }
})
```

<a name="ref-bemnode-appendto"/>
#### appendTo (parentNode:BemNode)
Присоединить или переместить текущий компонент к другому компоненту.

<a name="ref-bemnode-replacewith"/>
#### replaceWith (NewBemNode:BemNode)
Заменить текущую компоненту новым содержимым.

```js
Beast.decl('tabs__tab', {
    expand: function () {
        this.replaceWith(
                <Tab>{this.text()}</Tab>
            )
    }
})
```

<a name="ref-bemnode-implementwith"/>
#### implementWith (NewBemNode:BemNode)
Расширение метода replaceWith — к новому компоненту добавляются CSS-классы и инициализация текущего.

Полезно для раскрытия элементов через блоки с наследованием поведения первых:

```js
.decl('tab__close', {
    expand: function () {
        this.implementWith(
                <Button icon="/assets/icons/close.svg"/>
            )
    },
    on: {
        click: function () {
            console.log('Tab was closed')
        }
    }
})

/* ... */

.decl('button', {
    on: {
        click: function () {
            console.log('Button was clicked')
        }
    }
})
```

По нажатию на крестик таба в консоль выведется:
```
> Button was clicked
> Tab was closed
```

Имплементирующий компонент наследует не только поведение, но и пользовательские методы. Также имплементирующий откликается на имя имплементируемого в методе `get()`. Модификаторы тоже становятся общими.

<a name="ref-bemnode-text"/>
#### text () :string
Получить конкатенацию дочерних текстовых элементов. Другими словами, просто текстовое содержимое компонента.

<a name="ref-bemnode-get"/>
#### get (path:string...) :array|string
Получить массив дочерних компонентов, их текстовое содержимое или значение атрибутов.

```xml
<Browser>
    <head>
        <Tabs>
            <tab State="active">Yandex</tab>
            <tab State="release">Lenta.ru</tab>
            <newtab/>
        </Tabs>
        <Addressbar>https://yandex.ru</Addressbar>
    </head>
    <content>
        <Webview State="active" url="https://yandex.ru"/>
        <Webview State="release" url="http://lenta.ru"/>
    </content>
</Browser>
```

Метод использует имена узлов, а не их селекторы по той причине, что ему приходится нырять в списки детей на разную глубину. Дети на тот момент еще не развернуты и не инициализированы; и, значит, пока не знают ничего о родительском узле, из контекста развертки которого к ним обращаются и который еще может поменяться; а также не имеют содержимого, обещанного соответствующей декларацией.

Метод одинаково работает как в контексте развертывания, так и в инициализации. Результаты работы метода не кешируются.

```js
Beast.decl('browser', {
    expand: function () {
        this.get() // все дочерние элементы
        this.get('../Player')[0] // соседний компонент с именем Player
        this.get('head')[0] // компонент шапки
        this.get('head')[0].sayTrue() // true
        this.get('head/Tabs/tab') // массив табов
        this.get('head/Tabs/') // все дочерные компоненты Tabs
        this.get('head/Tabs/tab', 'content/Webview') // массив табов и страниц
        this.get('head/Tabs/tab')[0].mod('state') // значение атрибута State первого таба
        this.get('head/Addressbar')[0].text() // текстовое содержимое адресной строки
    },
    domInit: function () {
        this.get('head')[0].sayTrue() // true
    }
})

Beast.decl('head', {
    sayTrue: function () {
        return true
    }
})
```

<a name="ref-bemnode-getwithcontext"/>
#### getWithContext (path:string...) :array
Вариация метода `get()` с сохранением контекста текущего блока.

```xml
<Browser>
    <tabs>...</tabs>
<Browser>
```

```js
Beast.decl('browser', {
    expand: function () {
        this.append(
                <Head>{this.getWithContext('tabs')}</Head>
            )
    }
})
```
```xml
<div class="browser">
    <div class="head">
        <div class="browser__tabs">...</div>
    </div>
</div>
```

<a name="ref-bemnode-has"/>
#### has (path:string...) :boolean
Вариация метода `get()`. Проверяет наличие дочерних компонент по селектору.

<a name="ref-bemnode-afterDomInit"/>
#### afterDomInit (callback:function)
Функция `callback` выполнится только после DOM-инициализации компонента. Полезно, когда элементу требуется взаимодействовать с инициализарованным родительским блоком (а элементы инициализируются вперед).

```js
.decl('tabs', {
    onMod: {
        state: {
            uncommon: function () {...}
        }
    }
})
.decl('tabs__tab', {
    mod: {
        state:'release'
    },
    domInit: function () {
        var uncommonState = this.mod('state') !== 'release'

        this.parentBlock().afterDomInit(function () {
            if (uncommonState) {
                this.mod('state', 'uncommon')
            }
        })
    }
})
```

Обработчики onMod назначаются при создании DOM-узла компонента — на момент DOM-инициализации `tabs__tab` компонент `tab` еще не имел своего DOM-узла.

<a name="ref-bemnode-render"/>
#### render (domNode:DOMElement)
По большей части служебный метод. Инициирует рекурсивный процесс развертки и инициализации поведения компонента. В аргументе указывается родительский DOM-элемент для корневого компонента. Например, так выглядит создание компонента и привязка его к DOM дереву с последующей инициализацией.

```js
var button = <Button><label>Найти</label></Button>
button.render(document.body)
```

<a name="ref-bemnode-renderhtml"/>
#### renderHTML () :string
Генерация текстового HTML компонента и его дочерних элементов.

---

<a name="ref-decl"/>
### Beast.decl (selector:string, rules:object)

Создание декларации для компонентов, соответствующих селектору. Поля декларации:

<a name="ref-decl-inherits"/>
#### inherits
Наследование декларации. Пользовательские методы текущей декларации при совпадении имен с наследуемыми перекроют их.

```js
Beast.decl('browser-tabs', {
    inherits: 'abstract-tabs' | ['abstract-tabs', 'common-tabs']
})
```

<a name="ref-decl-expand"/>
#### expand
Контекст развертки компонента.

```js
Beast.decl('browser', {
    expand: function () {
        this.append(
                <head>{this.get('Tabs')}</head>,
                <content>{this.get('Webview')}</content>
            )
    }
})
```

Поля деклараций, описываемые ниже: mod, param, tag, mix — компилируется в методы, исполняемые в этом самом контексте.

```js
Beast.decl('browser', {
    mod: {
        state:'active'
    }
})
↓
Beast.decl('browser', {
    expand: function () {
        this.defineMod({state:'active'})
    }
})
```

<a name="ref-decl-mod"/>
#### mod
Декларативная форма метода BemNode::defineMod().

```js
Beast.decl('button', {
    mod: {
        state:'release',
        type:'normal'
    }
})
```

<a name="ref-decl-param"/>
#### param
Декларативная форма метода BemNode::defineParam().

```js
Beast.decl('button', {
    param: {
        href:'',
        maxlength:20
    }
})
```

<a name="ref-decl-mix"/>
#### mix
Декларативная форма метода BemNode::mix().

```js
Beast.decl('button', {
    mix: 'label' | ['label', 'control']
})
```

<a name="ref-decl-tag"/>
#### tag
Декларативная форма метода BemNode::tag().

```js
Beast.decl('link', {tag:'a'})
```

<a name="ref-decl-domattr"/>
#### domAttr
Декларативная форма метода BemNode::domAttr().

<a name="ref-decl-noelems"/>
#### noElems
Флаг, указывающий, может ли блок иметь дочерние элементы. Если нет — дочерние элементы в качестве родительского блока получают блок, следующий выше по иерархии.

```xml
<Button>
    <Link>
        <label>Найти</label>
    </Link>
<Button>
```

```js
Beast.decl('link', {noElems:true})
```

```xml
<div class="button">
    <div class="link">
        <div class="button__label">Найти</div>
    </div>
</div>
```

<a name="ref-decl-dominit"/>
#### domInit
Контекст инициализации поведения компонента.

```js
Beast.decl('tabs__tab', {
    domInit: function () {
        this.get('close')
            .on('click', this.onCloseClick.bind(this))
    }
})
```

В этом же контексте выполняются скомпилированные в методы поля: on, onWin, onMod.

<a name="ref-decl-on"/>
#### on
Декларативная форма метода BemNode::on().

```js
Beast.decl('tabs__tab', {
    on: {
        click: function () {
            this.mod('state', 'active')
        },
        'mouseover mouseout': function () {
            this.playMouseReaction()
        }
    }
})
```

<a name="ref-decl-onwin"/>
#### onWin
Декларативная форма метода BemNode::onWin().

```js
Beast.decl('popup', {
    onWin: {
        resize: function () {
            this.updatePosition()
        },
        'popup:open': function (e) {
            if (!e.currentTarget.bemNode === this) {
                this.hide()
            }
        }
    }
})
```

<a name="ref-decl-onmod"/>
#### onMod
Декларативная форма метода BemNode::onMod().

```js
Beast.decl('tabs__tab', {
    onMod: {
        state: {
            active: function () {
                this.parentBlock().get('tab').forEach(function (tab) {
                    if (tab !== this) {
                        tab.mod('state', 'release')
                    }
                }.bind(this))
            }
        }
    }
})
```
<a name="ref-beast"/>
### Прочие методы Beast

<a name="ref-beast-node"/>
#### node (name:string, attributes:object, child:string|BemNode...)

```js
<Button Size="M" href="#foo">Перейти</Button>
↓
Beast.node('Button', {'Size':'M', 'href':'#foo'}, 'Перейти')
```

Служебный метод. Создает экземпляр класса BemNode. Эквивалент BML-разметки.

<a name="ref-beast-findnodes"/>
#### findNodes (selector:string...)

Поиск компонента по CSS-селектору. Метод может быть полезен для организации связи один ко многим.

К примеру, нужно сделать, чтобы один блок подсказки всплывал при взаимодействии с разными компонентами браузера. Цели подсказки для наблюдения можно перечислить в параметре target:

```xml
<Browser>
    <Popup-helper target="Tabs__newtab Addressbar"></Popup-helper>
    <head>
        <Tabs>
            <tab State="active">Yandex</tab>
            <tab State="release">Lenta.ru</tab>
            <newtab/>
        </Tabs>
        <Addressbar>https://yandex.ru</Addressbar>
    </head>
    <content>
        <Webview State="active" url="https://yandex.ru"/>
        <Webview State="release" url="http://lenta.ru"/>
    </content>
</Browser>
```

```js
Beast.decl('popup', {
    domInit: function () {
        var targetNodes = Beast.findNodes.apply(
            this.param('target').split(' ')
        )
        for (var i = 0; i < targetNodes.length; i++) {
            targetNodes[i]
                .on('mouseover', this.show.bind(this))
                .on('mouseout', this.hide.bind(this))
        }
    },
    show: function () {...},
    hide: function () {...}
})
```

Сделать такое через общую шину событий не получится, потому что нет гарантии что целевые компоненты отдают ей нужные события — в данном случае компонентам `Tabs__newtab` и `Addressbar` пришлось генерировать события общей шины по наведению и уводу указателя мыши просто ради того, чтобы у `Popup-helper` была гипотетическая возможность подписаться именно на них.

Селекторы могут включать значение модификатора:
```js
Beast.findNodes('Tabs__tab_state_active')
```

Поиск происходит в цикле по плоскому списку компонент с предсохраненным списком соответствующих селекторов — метод настолько быстрый, насколько это возможно.

<a name="ref-beast-findnodebyid"/>
#### findNodeById (id:string)

Найти компонент с идентификатором `id`.

<a name="ref-beast-require"/>
#### require (url:string)

Служебный метод. Асинхронное подключение BML-файлов к текущей странице с синхронной инициализацией.

```js
Beast.require('/blocks/button/button.bml')
Beast.require('/blocks/select/select.bml')
Beast.require('/blocks/radio/radio.bml')
```

Вне зависимости от порядка реальной загрузки, инициализация скриптов произойдет в порядке вызова методов.

<a name="ref-beast-parsebml"/>
#### parseBML (text:string) :string

Служебный метод. Преобразует javascript с BML-вставками в чистый javascript.

---

![](http://jing.yandex-team.ru/files/kovchiy/ME3050275885_2.jpg)

<a name="recipes"/>
## РЕЦЕПТЫ
После теоретической вводной и справочника могли остатся вопросы практического характера. Эта часть попытается их закрыть.

<a name="recipes-helloworld"/>
### Hello, world

Чтобы запустить элементарный проект, к html-странице нужно подключить файл библиотеки `/src/beast-min.js`, подключить js-декларации блоков, CSS-стили и составить семантическое дерево интерфейса:

```xml
<html>
    <head>
        <meta charset="utf8">

        <!-- Инструмент -->
        <script src="beast-min.js"></script>

        <!-- Декларации -->
        <link type="bml" href="browser.bml"/>

        <!-- Стили -->
        <link type="text/css" rel="stylesheet" href="browser.css">

        <!-- Дерево интерфейса -->
        <script type="bml">
            <Browser>
                <head>
                    <Tabs>
                        <tab State="active">Yandex</tab>
                        <tab State="release">Lenta.ru</tab>
                        <newtab/>
                    </Tabs>
                    <Addressbar>https://yandex.ru</Addressbar>
                </head>
                <content>
                    <Webview State="active" url="https://yandex.ru"/>
                    <Webview State="release" url="http://lenta.ru"/>
                </content>
            </Browser>
        </script>
    </head>
</html>
```

Теги `html` и `head` писать необязательно. И следует помнить об атрибуте `type="bml"` для тегов `script` и `link`; в первом случае он сообщит Beast, что нужна прекомпиляция кода, а во втором еще и подгрузка самого файла. Политика безопасности браузеров не позволяет получать доступ к содержимому, загруженному через `<script src="...">` — поэтому используется универсальный тег `<link>`.

<a name="recipes-codestyle"/>
### Стиль кода
Методы класса BemNode, если не возвращают какое-то значение, возвращают ссылку на свой объект — так вызовы собираются в лаконичные цепочки ([chaining](https://en.wikipedia.org/wiki/Method_chaining)).

```js
Beast.decl('tabs__tab', {
    expand: function () {
        this.mod('state', 'releast')
            .param('url', this.text())
            .append(
                this.text().replace(/^https?:\/\/(www\.)?/gi, ''),
                <close/>
            )
    }
})
```

Если для метода существует декларация, использовать следует именно ее — ради единообразия и наглядности:

```js
Beast.decl('button', {
    mod: {
        state: 'release',
        theme: 'normal'
    },
    mix:'link'
})
```

вместо

```js
Beast.decl('button', {
    expand: function () {
        this.defineMod({
                state:'release',
                theme:'normal'
            })
            .mix('link')
    }
})
```

<a name="recipes-api"/>
### Строгое API компонента

Декларация позволяет однозначно и наглядно описывать все аспекты поведения компонента, в том числе и структуру входных данных и возможные значения модификаторов. Не для всех компонент может прилагаться документация с примерами, поэтому строгое API может служить ее частичным заменителем.

Следует перечислять модификаторы и их значения по умолчанию в декларации:

```js
Beast.decl('button', {
    mod: {
        state: 'release',
        theme: 'normal'
    }
})
```

То же самое с разверткой: желательно явно указывать какие компоненты и в каком порядке готов принимать в себя блок. Не стоит никогда полагаться на порядок входных данных.

```js
Beast.decl('letter', {
    expand: function () {
        this.append(
                this.get('title'),
                this.get('from'),
                this.get('to'),
                this.get('text')
            )
    }
})
```

Если известен состав, но порядок не важен, это тоже следует указать:

```js
Beast.decl('article', {
    expand: function () {
        this.append(
                this.get('text', 'image')
            )
    }
})
```

Принятие в себя чего угодно в любом порядке должно быть оправдано сутью компонента.

```js
Beast.decl('article__custom-part', {
    expand: function () {
        this.append(
                this.get()
            )
    }
})
```

<a name="recipes-interaction"/>
### Взаимодействие компонент

Код современных сложных веб-придожений на 90% состоит из описания взаимодействий компонентов интерфейса. Чтобы сложность поддержки такого кода не росла экспоненциально с добавлением новых взаимодействий, Beast предусматривает следующие механики:
* Связь блок-элемент
* Имплементация
* Общая шина событий
* Связь один ко многим

##### Связь блок-элемент

Блок имеет прямой доступ к элементам, а элементы к блоку. Например, по клику на опцию в радиогруппу передается событие, по которому та устанавливает модификаторы всем опциям.

```js
Beast
.decl('radiogroup', {
    on: {
        change: function (e, option) {
            var options = this.get('option')
            for (var i = 0; i < options.length; i++) {
                if (options[i] === option) {
                    options[i].mod('state', 'selected')
                } else {
                    options[i].mod('state', 'release')
                }
            }
        }
    }
})
.decl('radiogroup__option', {
    on: {
        click: function () {
            this.parentBlock().trigger('change', this)
        }
    }
})
```

##### Имплементация

Подробно ее механизм разобран в справке метода `BemNode.implementWith()`. Еще раз коротко: это способ повесить на блок поведение элемента. Например, в блоке `Radiogroup` элемент `option` можно реализовать через независимый блок кнопки:

```js
.decl('radiogroup__option', {
    expand: function () {
        this.implementWith(
                <Button>{this.text()}</Button>
            )
    },
    on: {
        click: function () {
            this.parentBlock().trigger('change', this)
        }
    }
})
```

Тогда это нужно учесть в родительском блоке:
```js
.decl('radiogroup', {
    on: {
        change: function (e, option) {
            var options = this.get('Button')
            for (var i = 0; i < options.length; i++) {
                if (options[i] === option) {
                    options[i].mod('state', 'selected')
                } else {
                    options[i].mod('state', 'release')
                }
            }
        }
    }
})
```

Само собой, кнопка должна научиться правильно отображать модификатор `state` (другими словами, западать).

##### Общая шина событий

Шина выступает посредником между объектом и субъектом взаимодействия. Роль шины играют DOM-события системного объекта window. Объект выбрасывает события на шину события в своем пространстве имен, а субъект может их слушать. Гарантированная ссылка на объект-посредник избавляет субъекта от проверок наличия и расположение объекта, генерирующего события.

```xml
<Form>
    ...
    <submit/>
</Form>
...
<Notification></Notification>
```

```js
Beast.decl('form__submit', {
    on: {
        click: function () {
            this.triggerWin('submit')
        }
    }
})

Beast.decl('notification', {
    onWin: {
        'form:submit': function () {
            console.log('Form submit')
        }
    }
})
```

Элемент блока `Form` отдает общей шине сигнал о том, что данные отправились. На этот сигнал реагирует блок `Notification`, который никак не связан с `Form`, но знает о возможности такого сообщения в принципе.

##### Связь один ко многим

Подробно механизм описан в документации метода `Beast.findNodes()`. Однако, это крайние меры — подход рождает обилие неявных связей, которые не закреплены ни в системе событий, ни в иерархии компонент. Подходит только к компонентам, суть которых в том и состоит, чтобы вступать в непредсказуемые связи с другими компонентами. Обычно это модальные окна, всплывающие подсказки и прочие блоки, чьё поведение зависит от неограниченного множества раздражителей: по наведению на любую ссылку, по нажатию на закопанные в разных местах кнопки.

Показывать модальное окно по клику на компонент с селектором триггера, а прятать по клику за пределами окна:

```js
.decl('modal', {
    domInit: function () {
        var targets = Beast.findNodes(this.param('target'))
        for (var i = 0; i < targets.length; i++) {
            targets[i].on(click, this.show.bind(this))
        }
    },
    onWin: {
        click: function () {
            this.close()
        }
    },
    on: {
        click: function (e) {
            e.stopPropagation()
        }
    },
    show: function () {...},
    close: function () {...}
})
```

<a name="recipes-css"/>
### Работа с CSS

Напрямую не относится к работе с инструментом, но с этим все равно придется регулярно сталкиваться: CSS и JS работают в связке. Препроцессоры (less, stylus) позволяют уменьшать количество повторяющегося кода, вложенностями подчеркивать структуру и выносить общие знаменатели за скобку (в константы).

Как облегчить себе жизнь:
* Селекторы модификаторов и элементов преобразовывать во вложенности.
* Повторяющиеся значения либо близкие значения выносить в переменные.
* Анимации в JS заменять на transitions в CSS — это и меньше нагружает процессор, и позволяет управлять изменением стилей из единого места; кроме того, для анимаций в JS придется подключать дополнительную библиотеку, без которой пока удавалось справляться.
* Изменения стилей следует по возможности связывать с измененеим модификатора, чтобы JS-код состоял в основном из переключения модификаторов компонент по разным событиям, а в CSS уже содержались все подробности, которые стоят за тем или иным модификатором — разделение логики от частностей реализации.

```less
.Tabs {
    color:@color-text;
    &__tab {
        transition: background .2s ease-in-out;
        &_state {
            &_release {
                background:rgba(0,0,0,0);
            }
            &_active {
                background:rgba(0,0,0,.2);
            }
        }
    }
}
```

<a name="recipes-expand"/>
### Сложное развертывание

Методология не ограничивает от перекрестных вложенностей: элемент одного блока иерархически может принадлежать другому блоку. Например, Блок ссылки может окутывать чужие элементы, делая их активными, но не делая своими:

```js
Beast
.decl('tabs__tab', {
    expand: function () {
        this.append(
            <Link>{this.getWithContext()}</Link>
        )
    }
})
```

Теоретически, то же самое можно сделать через наследование:

```js
Beast.decl('tabs__tab', {inherits:'link'})
```

Иногда нужно создать элемент внутри другого блока, не принадлежащий ему:

```js
Beast
.decl('tabs__tab', {
    expand: function () {
        this.append(
            <Link>
                {this.text()}
                <close block="{this}"/>
            </Link>
        )
    }
})
```

Можно вообще запретить блоку иметь дочерние элементы таким вот способом:

```js
Beast.decl('Link', {noElems:true})
```

Роль элементов зачастую играют дочерние блоки. Например, у блока модального окна обе кнопки «ОК» и «Отмена» с одной стороны являются элементами, с другой реализуются независимыми блоками кнопок. Как можно развернуть элемент до блока и назначить ему нужное поведение:

```js
Beast
.decl('modal', {
    expand: function () {
        this.append(
                <content>{this.get()}</content>,
                <cancel/>,
                <submit/>
            )
    },
    close: function () {...},
    submit: function () {
        ...
        this.close()
    },
    cancel: function () {
        ...
        this.close()
    }
})
.decl('modal__submit', {
    expand: function () {
        this.implementWith(
                <Button>OK</Button>
            )
    },
    on: function () {
        this.parentBlock().submit()
    }
})
.decl('modal__cancel', {
    expand: function () {
        this.implementWith(
                <Button>Отмена</Button>
            )
    },
    on: function () {
        this.parentBlock().cancel()
    }
})

```

<a name="examples"/>
## Примеры проектов
- https://github.yandex-team.ru/kovchiy/mediahome — проба пера: морда + поиск
- https://github.yandex-team.ru/kovchiy/kinopoisk — адаптивный интерфейс (блок grid)
- https://github.yandex-team.ru/kovchiy/searchapp — прекомпиляция Beast на сервере
