var page = null
var sidebar = null
var sidebar_toggle = null
var active_item = null
var log = console.log

window.onload = function () {
    blog_data.sort(function (a, b) {
        return a.publish_date - b.publish_date
    })

    blog_data.sort(function (a, b) {
        var a = a.category
        var b = b.category
        if (a < b) {
            return -1
        }
        if (a > b) {
            return 1
        }
        return 0
    })

    sidebar = getElement('.sidebar')
    page = getElement('.page')
    sidebar_toggle = getElement('.sidebar-toggle')

    // 填充sidebar内容
    getSidebarContent(blog_data)
    // 改进一下，如何判断一个变量是否存在

    // 根据地址栏中的 url 显示正确的页面
    showPage()

    // 根据地址栏中的 url 正确显示 sidebar
    showSubItems()

    // 事件监听
    sidebar.addEventListener('click', sidebarClick)
    page.addEventListener('click', stateChange)
    window.addEventListener('popstate', stateChange)
    sidebar_toggle.addEventListener('click', function (event) {
        toggleClass(sidebar, 'show')
    })
}

function getSidebarContent(data) {
    var content = createElement('div', { className: 'sub_items' })
    for (var i = 0; i < data.length; i++) {
        var article = data[i]
        var item = createElement('a', {
            className: 'item',
            href: article.path,
            innerHTML: article.title,
            dataset_publish: article.publish_date,
            dataset_update: article.update_date
        })

        var category = article.category
        if (!category) {
            content.appendChild(item)
            continue
        }

        if (!content[category]) {
            var ls = category.split('-')
            var len = ls.length
            var parent = content
            for (var j = 0; j < len; j++) {
                var index = nthStr(category, '-', j + 1)
                if (index === -1) {
                    var cg = category
                } else {
                    var cg = category.substring(0, index)
                }

                if (!content[cg]) {
                    var a = createElement('a', {
                        className: 'item',
                        href: `/articles/${cg.replace(/-/g, '/')}/`,
                        dataset_category: cg,
                        innerHTML: `<span></span>${ls[j]}`
                    })
                    var sub_items = createElement('div', { className: 'sub_items' })
                    parent.appendChild(a)
                    parent.appendChild(sub_items)
                    parent = sub_items
                    content[cg] = sub_items
                } else {
                    parent = content[cg]
                }
            }
        }
        content[category].appendChild(item)
    }
    sidebar.appendChild(content)
}

function showPage() {
    var location = window.location
    var href = location.href
    var path = location.pathname

    if (isArticle(href)) {
        getHtml(href)
    } else {
        var _ = path.split('/').join('-')
        var category = _.substring(10, _.length - 1)
        getSubItems(category)
    }
}

// page 显示 sub
function getSubItems(category) {
    var text = createElement('div')
    blog_data.forEach(function (item) {
        if (category === item.category) {
            var elem = createElement('a', {
                href: item.path,
                className: 'item',
                innerHTML: item.title,
                dataset_modified: item.modified
            })
            text.appendChild(elem)
        }
    })
    page.innerHTML = text.innerHTML
}

// sidebar 显示 sub
function showSubItems() {
    var item = findSidebarElem()
    activeItem(item)
    while (item) {
        addClass(item, 'open')
        item = item.parentNode.parent_item
    }
}

function sidebarClick(event) {
    // 取消默认行为
    event.preventDefault()
    var item = event.target
    if (item === sidebar) {
        return
    }

    if (isSideBarArrow(item)) {
        item = item.parentNode
        toggleClass(item, 'open')
        return
    }

    if (item.href !== location.href) {
        addClass(item, 'open')
        pushState(item.href)
        toggleClass(sidebar, 'show')
    } else {
        toggleClass(item, 'open')
    }

    showPage()
    activeItem(item)
}

function stateChange(event) {
    var location = window.location
    var path = location.pathname
    if (!path.endsWith('/')) {
        return
    }
    if (event.target !== window) {
        if (isSideBarItem(event.target)) {
            event.preventDefault()
            pushState(event.target.href)
        }
    }
    showPage()
    var item = findSidebarElem()
    activeItem(item)
}

function findSidebarElem() {
    var location = window.location
    var pathname = location.pathname
    var item = null
    if (pathname === '/') {
        item = sidebar
        return item
    }
    if (pathname.endsWith('/')) {
        var end = pathname.length - 1
        var category = pathname.split('/').join('-').substring(10, end)
        item = sidebar.querySelector(`[data-category='${category}']`)
        return item
    }
    item = sidebar.querySelector(`[href='${location.pathname}']`)
    return item
}



function activeItem(item) {
    if (active_item) {
        active_item.classList.remove('active')
    }
    item.classList.add('active')
    active_item = item
}

function addClass(elem, classname) {
    elem.classList.add(classname)
}

function toggleClass(elem, classname) {
    if (elem.classList.contains(classname)) {
        elem.classList.remove(classname)
    } else {
        elem.classList.add(classname)
    }
}





// 判断是否是 sidebar 中的 a 标签
function isSideBarItem(elem) {
    return elem.classList.contains('item')
}

// 判断是否是 sidebar 中的三角
function isSideBarArrow(elem) {
    return elem.parentNode.classList.contains('item')
}

// ajax 获取 html 片段
function getHtml(href) {
    var xhr = new XMLHttpRequest()
    var page = document.getElementsByClassName('page')[0]
    xhr.open('GET', href + '.html')
    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = xhr.responseText
            page.innerHTML = data
        } else {
            console.log('error')
        }
    }
    xhr.setRequestHeader('X-REQUESTED-WITH', 'XMLHttpRequest')
    xhr.send()
}

// 更改url
function pushState(url) {
    var state = {
        url: url
    }
    history.pushState(state, null, url)
}


function getElement(selector) {
    return document.querySelector(selector)
}

function getElements(selector) {
    return document.querySelectorAll(selector)
}

function createElement(tag, attrs) {
    var tag = document.createElement(tag)
    for (var attr in attrs) {
        if (attr.startsWith('dataset')) {
            tag.dataset[attr.substring(8)] = attrs[attr]
        } else {
            tag[attr] = attrs[attr]
        }
    }
    return tag
}

// 站内链接
function inStation(href) {
    return href.includes(window.location.origin)
}

// 文章链接
function isArticle(href) {
    if (inStation(href)) {
        return !href.endsWith('/')
    }
    return false
}

// 查找字符串在字符串中第 n 次出现的位置
function nthStr(str, s, n) {
    var index = 0
    for (var i = 0; i < n; i++) {
        index = str.indexOf(s, index + 1)
    }
    return index
}