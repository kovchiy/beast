# Работа с живыми данными

На этом этапе рекомендуются переключить работу компонента в реактивный режим — начать хранить входные данные в `state`, при изменении которого будет происходить полная перерисовка компонента. С точки зрения DOM, перерисуются только измененные области — это полезно как для производительности, так и для анимаций (можно повесить transition на CSS-свойство, изменяемое при перерисовке).

Впрочем, из этого вовсе не следует, что придется переписать всю декларацию. Разберем пример с карточкой новостей:

```xml
<NewsCard>
    <item href="...">
        <thumb>...</thumb>
        <rubric>...</rubric>
        <title>...</title>
        <text>...</text>
        <date>...</date>
    </item>
    ...
</NewsCard>
```

Декларация до последнего момента выглядела бы так:

```js
Beast.decl({
    NewsCard: {
        expand: function () {
            this.append(
                this.get('item')
            )
        }
    },
    NewsCard__item: {
        inherits: 'Link',
        expand: function () {
            this.append(
                this.get('thumb', 'rubric', 'title', 'text', 'date')
            )
        }
    }
})
```

Когда дело дойдет до подключения к API с реальными данными, рекомендуется поступать так:

```js
// Ответ API:
{
    items: [
        {
            thumb: {
                url: '...',
                width: 300,
                height: 200
            },
            rubric: {
                name: '...',
                id: '...'
            },
            doc_title: '...',
            doc_lead: '...',
            doc_url: '...',
            date: 1234543
        },
        ...
    ]
}

// Шаблон блока
Beast.decl({
    NewsCard: {
        state: function () {
            return {
                items: []
            }
        },
        expand: function () {
            if (this.state('items').length === 0) {
                this.append(
                    this.get('item')
                )
            } else {
                this.append(
                    this.state('items').map(function (item) {
                        return (
                            <item href="{item.doc_url}">
                                <thumb>{item.thumb.url}</thumb>
                                <rubric>{item.rubric.name}</rubric>
                                <title>{item.doc_title}</title>
                                <text>{item.doc_lead}</text>
                                <date>{Typo.secondsToTimeAgo(item.date)}</date>
                            </item>
                        )
                    })
                )
            }
        }
    },
    NewsCard__item: {
        inherits: 'Link',
        expand: function () {
            this.append(
                this.get('thumb', 'rubric', 'title', 'text', 'date')
            )
        }
    }
})
```

Такой подход оставляет возможность использовать компонент в рамках классической модели, без состояний: все еще можно собирать статические примеры или позволить родителю заполнить этот блок содержимым.

Далее может возникнуть желание отказаться от навязанного API «грязного» формата для state — тогда нужно написать адаптер из API-данных в state:

```js
Beast.decl({
    NewsCard: {
        requestApiYandexNewsV2: function (path, data) {
            Ajax({
                url: 'https://news.yandex.ru/api/v2' + path,
                data: data,
                success: function (data) {
                    if (path === '/main-news') {
                        this.state(
                            'items',
                            data.items.map(function (item) {
                                return {
                                    url: item.doc_url,
                                    thumb: item.thumb.url,
                                    rubric: item.rubric.name,
                                    title: item.doc_title,
                                    text: item.doc_lead,
                                    date: Typo.secondsToTimeAgo(item.date)
                                }
                            })
                        )
                    }
                }
            })
        },
        param: {
            liveData: false
        },
        state: function () {
            // Оставлять напоминания о формате данных — хороший тон:
            return {
                items: [] // [{url, thumb, rubric, title, text, date}]
            }
        },
        expand: function () {
            if (this.state('items').length === 0) {
                this.append(
                    this.get('item')
                )

                // Если блок должен сам при создании заполнить себя данными,
                // можно создать специальный флаг
                if (this.param('liveData')) {
                    this.requestApiYandexNewsV2('/main-news', {rubric: 'any'})
                }
            } else {
                this.append(
                    this.state('items').map(function (item) {
                        return (
                            <item href="{item.url}">
                                <thumb>{item.thumb}</thumb>
                                <rubric>{item.rubric}</rubric>
                                <title>{item.title}</title>
                                <text>{item.text}</text>
                                <date>{item.date}</date>
                            </item>
                        )
                    })
                )
            }
        }
    }
})
```

Если требуется передать в компонент state при его создании, на помощь приходят параметры:

```js
Beast.decl({
    NewsCard: {
        param: {
            items: [] // [{url, thumb, rubric, title, text, date}]
        },
        state: function () {
            return {
                items: this.param('items')
            }
        },
        ...
    }
})

/* ... */
var items = [
    {url:'...', thumb:'...', rubric:'...', title:'...', text:'...', date:'...'},
    ...
]

someKindIfParentNode.append(
    <NewsCard items="{items}"/>
)
```

## Асинхронный сбор данных

Иногда блок требует данные сразу от нескольких API-ручек. Представим ситуацию: ручка `/main-news` отдает только финальную рубрику, а мы захотели выводить весь путь: «Спорт / Футбол» вместо «Футбол», но полная иерархия рубрик возвращается отдельной ручкой `/rubrics`.

Один из способов решения этой задачи, не подключая серверную разработку — обратиться из блока сразу к двум ручкам, дождаться ответа от каждой и собрать финальное состояние. Поскольку данные приходят асинхронно, введем параметр «счетчик запросов», который увеличивается при отправке запроса и уменьшается при получении ответа.

```js
Beast.decl({
    NewsCard: {
        param: {
            requestNum: 0,
        },
        state: function () {
            return {
                items: []
            }
        },
        requestApiYandexNewsV2: function (path, data) {
            // Увеличиваем счетчик
            this.param('requestNum', this.param('requestNum') + 1)

            Ajax({
                url: 'https://news.yandex.ru/api/v2/' + path,
                data: data,
                success: function (data) {
                    // Уменьшаем счетчик
                    this.param('requestNum', this.param('requestNum') - 1)

                    if (path === '/main-news') {
                        // ВАЖНО: теперь порции данных складываем в param,
                        // а не в state, чтобы не вызывать преждевременную
                        // перерисовку компонента
                        this.param(
                            'items',
                            data.items.map(function (item) {
                                return {
                                    url: item.doc_url,
                                    thumb: item.thumb.url,
                                    rubric: item.rubric.name,
                                    title: item.doc_title,
                                    text: item.doc_lead,
                                    date: Typo.secondsToTimeAgo(item.date)
                                }
                            })
                        )
                    }
                    else if (path === '/rubrics') {
                        this.param(
                            'rubrics',
                            data.rubrics.map(function (rubric) {
                                return {
                                    name: rubric.name,
                                    id: rubric.id,
                                    parentId: rubric.parent_rubric_id
                                }
                            })
                        )
                    }

                    // Если счетчик = 0, значит, все запросы вернулись с данными,
                    // и можно начинать сборку финального дерева данных
                    if (this.param('requestNum') === 0) {
                        this.param('items').forEach(function (item) {
                            this.param('rubrics').forEach(function (rubric) {
                                if (item.rubric === rubric.name && rubric.parentId !== undefined) {
                                    item.parentRubric = this.param('rubrics')
                                        .filter(function (parentRubric) {
                                            if (parentRubric.id === rubric.parentId) {
                                                return parentRubric.name
                                            }
                                        })
                                        .pop()
                                }
                            }.bind(this))
                        }.bind(this))

                        // Все данные собрали, запускаем перерисовку
                        this.state('items', this.param('items'))
                    }
                }
            })
        },
        expand: function () {
            if (this.state('items').length === 0) {
                this.requestApiYandexNewsV2('/main-news', {rubric: 'any'})
                this.requestApiYandexNewsV2('/rubrics')
            } else {
                ...
            }
        }
        ...
    }
})
```

## Кому хранить state

Вовсе необязательно (и даже вредно) каждый блок наделять своим состоянием. Но это и не значит, что состояние нужно хранить только в корневом компоненте. Правило такое же, как при слабом связывании: состояние хранит ближайший общий родитель, начиная с которого данные используются при выводе.

И второй момент: состояние одного компонента не должно дублироваться полностью или частично в состоянии другого комопнента. К примеру, если список новостных рубрик используется сразу в двух комопонентах на странице — состояние, из которого этот список извлекается, должен хранить ближайший общий родитель, он же передает рубрики в целевые компоненты уже как входные данные, но не как состояния:

```js
Beast.decl({
    NewsPage: {
        state: function () {
            return {
                rubrics: [...],
                items: [...]
            }
        },
        expand: function () {
            this.append(
                <NewsMenu>.append(
                    this.state('rubrics').map(function (rubric) {
                        return <item href="{rubric.url}">{rubric.name}</item>
                    })
                ),
                <NewsList/>.append(
                    this.state('items').map(function (item) {
                        var rubric = this.param('rubrics').filter(function (rubric) {
                            if (rubric.id === item.rubricId) {
                                return rubric.name
                            }
                        })[0]

                        return (
                            <item>
                                <rubric>{rubric}</rubric>
                                ...
                            </item>
                        )
                    })
                )
            )
        }
    }
})
```

## Безопасный доступ к грязным данным

Как правило, структура данных API ведет себя непредсказуемо и нестабильно. Почувствовать это можно при взаимодействи с данными поискового репорта. Для безопасного взаимодействия (защита от обращения к undefined-полям) был создан [инструмент Dig](https://github.yandex-team.ru/kovchiy/dig) (см. детали в документации по ссылке).
