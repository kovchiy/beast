# Содержание

* [Beast](#beast)
* [BML-разметка](#bmlmarkup)
* [Компонент](#component)
* [Декларация](#declaration)
  * [Развертка](#declaration-expand)
  * [Поведение](#declaration-dominit)
  * [Наследование деклараций](#declaration-inheritance)
  * [Пользовательские методы](#declaration-usermethods)
* [Итого](#declaration-final)
* [Справочник](#ref)
  * [BemNode](#ref-bemnode)
    * [isBlock](#ref-bemnode-isblock)
    * [isElem](#ref-bemnode-iselem)
    * [selector](#ref-bemnode-selector)
    * [parentBlock](#ref-bemnode-parentblock)
    * [parentNode](#ref-bemnode-parentnode)
    * [domNode](#ref-bemnode-domnode)
    * [defineMod](#ref-bemnode-definemod)
    * [defineParam](#ref-bemnode-defineparam)
    * [mod](#ref-bemnode-mod)
    * [toggleMod](#ref-bemnode-togglemod)
    * [param](#ref-bemnode-param)
    * [domAttr](#ref-bemnode-domattr)
    * [css](#ref-bemnode-css)
    * [state](#ref-bemnode-state)
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
    * [prepend](#ref-bemnode-prepend)
    * [prependTo](#ref-bemnode-prependto)
    * [insertChild](#ref-bemnode-insertchild)
    * [replaceWith](#ref-bemnode-replacewith)
    * [implementWith](#ref-bemnode-implementwith)
    * [text](#ref-bemnode-text)
    * [elem](#ref-bemnode-elem)
    * [get](#ref-bemnode-get)
    * [has](#ref-bemnode-has)
    * [afterDomInit](#ref-bemnode-afterDomInit)
    * [clone](#ref-bemnode-clone)
    * [render](#ref-bemnode-render)
    * [renderHTML](#ref-bemnode-renderhtml)
    * [inherited](#ref-bemnode-inherited)
    * [isKindOf](#ref-bemnode-iskindof)
    * [expand](#ref-bemnode-expand)
  * [Beast.decl()](#ref-decl)
    * [inherits](#ref-decl-inherits)
    * [abstract](#ref-decl-abstract)
    * [expand](#ref-decl-expand)
    * [mod](#ref-decl-mod)
    * [param](#ref-decl-param)
    * [state](#ref-decl-state)
    * [tag](#ref-decl-tag)
    * [domAttr](#ref-decl-domattr)
    * [noElems](#ref-decl-noelems)
    * [domInit](#ref-decl-dominit)
    * [on](#ref-decl-on)
    * [onWin](#ref-decl-onwin)
    * [onMod](#ref-decl-onmod)
  * [Прочие методы Beast](#ref-beast)
    * [node](#ref-beast-node)
    * [onReady](#ref-beast-onready)
* [Hello, world](#helloworld)
* [Дальнейшая работа](#more)

<a name="beast"/>
# Beast

Инструмент создания интерфейса веб-приложений. Покрывает собой весь цикл разработки: от шаблонизации до взаимодействия компонент. Идейный наследник [БЭМ-методологии](//github.com/bem/bem-method) и инструментов [i-bem.js](https://ru.bem.info/technology/i-bem/v2/i-bem-js/), [bh](https://github.com/bem/bh), [React](http://facebook.github.io/react/); результат бесед с [Сергеем Бережным](https://events.yandex.ru/lib/people/34/), [Маратом Дулиным](https://events.yandex.ru/lib/people/143932/), [Антоном Шеиным](http://antonshein.ru/noise/) и [Артемом Шитовым](http://www.artlebedev.ru/search/?text=%D0%B0%D1%80%D1%82%D0%B5%D0%BC%20%D1%88%D0%B8%D1%82%D0%BE%D0%B2).

Основная идея: интерфейс делится на компоненты, каждый из которых характеризуется уникальным БЭМ-селектором, входными данными, правилами их преобразования в представление и описанием поведения.

В основе лежат три знания:
* BML-разметка компонента (Beast markup language, XML-подмножество)
* Методы компонента
* Декларация развертки и поведения компонента

---

<a name="bmlmarkup"/>
## BML-РАЗМЕТКА

Любой интерфейс — это семантическая иерархия. Одни компоненты включают в себя другие, некоторые зависят от контекста, некоторым всё равно. Для независимых компонент введен термин _блок_. Блоки могут иметь вспомогательные компоненты — _элементы_. И те, и другие могут обладать изменяющимися признаками — _модификаторами_ (состояния, типы поведения, темы внешнего вида).

Классический способ описания иерархий — XML. Его удобство в том, что он позволяет наглядно разделять содержимое сущности от ее признаков. Содержимое может быть текстом, другими сущностями или всем вперемешку. Пример иерархии интерфейса браузера:

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

Разные люди могут описывать одни и те же вещи по-разному, и каждый будет прав по-своему. Так и с выделением зависимых и независимых компонент интерфейса. В данном примере независимыми, иными словами, самодостаточными _блоками_, являются:
* Browser
* Tabs
* Addressbar
* Webview

И это не единственно верное разбиение интерфейса на главные и второстепенные компоненты. Можно было бы не выделять табы в отдельный блок, а сделать блоком каждый таб, и это была бы уже другая история:

```xml
<Browser>
    <head>
        <Tab State="active">Yandex</Tab>
        <Tab State="release">Lenta.ru</Tab>
        ...
    </head>
    ...
</Browser>
```

Так или иначе, названия независимых компонент (блоков) начинаются с заглавных, чтобы выделить начало нового смыслового куска. Названия подчиняемых _элементов_, не имеющих ценности в отсутствии своего родителя, начинаются со строчных.

Элементами, как правило, назначаются компоненты, которые вынуждены часто общаться с себеподобными и зависят от какого-то общего параметра (модификатора родительского блока, например). Им просто удобно быть рядом и образовывать изолированную систему частого обмена сообщениями. Границы такой группы обозначает родительский компонент — блок; он же хранит общие знаменатели группы.

В примере с разметкой браузера помимо узлов есть еще атрибуты. Они тоже бывают двух типов: _модификаторы_ и _параметры_. Модификаторы, как упоминалось ранее, описывают ограниченное (предвариательно описанное) подмножество признаков компонента: особенности внешнего вида, состояния вкл/выкл и тому подобное. К параметрам относят чаще всего неотображаемые атрибуты компонента, но влияющие на его работу или внешний вид; ими могут быть: счетчики, идентификаторы, URL-адреса для отображения документов и тому подобное. Названия модификаторов начинаются с заглавной буквы, а параметров — со строчной.

Для отображения BML-дерева в браузере, строится соответствующее HTML-дерево:
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

Несмотря на то, что HTML генерируется автоматически, логику генерации все равно следует понимать, чтобы писать CSS и селекторы для декларакций (о последних речь идет в следующей части). Итак, в HTML вся семантика из названий узлов ушла в их классы. Названия тоже частично поменялись: вместо `Browser` теперь `div class="browser"`, а вместо `tabs` `div class ="browser__tabs"`. Сделано это для того, чтобы каждый блок или элемент с модификатором или без можно было описать одним CSS-селектором:

```css
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

Такая нотация, во-первых, ускоряет время рендера стилей в браузере за счет сокращения количества селекторов для идентификации компонента и его модификации, а, во-вторых, страхует от персечений селекторов стилей при вложении одних компонент в другие. С использованием препроцессоров (например, Less) классы перестают пугать своей длиной:

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

<a name="ref"/>
## СПРАВОЧНИК

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

<a name="ref-bemnode-togglemod"/>
#### togglemod (modName:string, modValue1:string|boolean, modValue2:string|boolean)
Переключить модификатор: если не установлен ни один, установить первый; если установлен первый, установить второй и наоборот.

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

<a name="ref-bemnode-state"/>
#### state (stateName:string, [stateValue:string]) [:anything]
TODO: описать

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
Присоединить или переместить текущий компонент в конец списка детей другого компонента.

<a name="ref-bemnode-prepend"/>
#### prependTo (child:BemNode|string...)
Добавить содержимое в начало списка детей.

<a name="ref-bemnode-prependto"/>
#### prependTo (parentNode:BemNode)
Присоединить или переместить текущий компонент в начало списка детей другого компонента.

<a name="ref-bemnode-insertchild"/>
#### insertChild (child:BemNode|string|array, index)
Вставить компонент, строку или массив по индексу.

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

<a name="ref-bemnode-elem"/>
#### elem (name:string) :array
Получить массив элементов блока без учета уровня вложенности. Метод актуальнен только для блока. Крайне не рекомендуется использовать этот метод в паре с `append` — для этого потойдет метод `get()`, вынимающий только ближайших детей.

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
        this.get() // все дети включая текст
        this.get('/') // все дочерние компоненты
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

<a name="ref-bemnode-clone"/>
#### clone ()

Создает полную копию себя.

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

<a name="ref-bemnode-inherited"/>
#### inherited () :string
Вызов переопределенной функции из наследуемой декларации.

```js
Beast.decl({
    foo: {
        on: {
            click: function () {
                console.log('foo click')
            }
        }
    },
    bar: {        
        inherits: 'foo',        
        on: {
            click: function () {
                this.inherited()
                console.log('bar click')
            }
        }
    }
})

// foo click
// bar click
```

<a name="ref-bemnode-iskindof"/>
#### isKindOf () :string
Проверка, соответствует ли компонент или его предки (см. поле декларации inherits) селектору.

<a name="ref-bemnode-expand"/>
#### expand (child:BemNode|string...)
Повторная перерисовка блока с новыми входными данными, с размерткой и инициализацией. Текущие дети блока удалятся, но модификаторы и параметры останутся. 

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

<a name="ref-decl-abstract"/>
#### abstract
Объявляет декларацию абстрактной — это значит, что при наследовании ее селектор не попадет в классы DOM-узла. Такие декларации служат лишь для описания общего поведения.

```js
Beast.decl('Locale', {
    abstract:true,
    string: function () {
        ...
    }
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

Поля деклараций, описываемые ниже: mod, param, tag — компилируется в методы, исполняемые в этом самом контексте.

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

<a name="ref-decl-state"/>
#### state
TODO: описать

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

<a name="ref-beast-onready"/>
#### onReady (callback:function)

Выполнит callback-функцию, когда загрузятся все стили и скрипты.

---

<a name="helloworld"/>
## Hello, world

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

<a name="more"/>
## Дальнейшая работа

Практические советы, механизмы оптимальной организации сложных связей между компонентами, принятый codestyle, разработка проекта с чистого листа — всё это описывает учебник [Beast Practice](https://github.yandex-team.ru/kovchiy/beast-practice/blob/master/README.md). 

Welcome home, good hunter.
