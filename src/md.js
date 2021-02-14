const MarkdownIt = require('markdown-it')
const hljs = require('highlight.js')
const axios = require('axios')
const fse = require('fs-extra')
const path = require('path')
const base64Img = require('base64-img')
const DOMParser = require('xmldom').DOMParser

const to = (p) => {
  if (p.then) {
    return p.then((e) => [ null, e ]).catch((e) => [ e || 'unknown error' ])
  }
  return Promise.resolve([ null, p ])
}

const md = new MarkdownIt({
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs" v-pre><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>'
        )
      } catch (__) {
      }
    }
    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    )
  }
})

const httpReg = /^https?:/
const absReg = /^\//
const localCssReg = /^[\w-]+$/
const mdImgReg = /(!\[.*\]\()([^)]+)/g
const htmlImgReg = /(<img.*src\s*=[^'"]*['"])([^'"]*)/g

const getCss = (cssPath) => {
  if (cssPath.match(httpReg)) {
    return axios(cssPath).then((response) => response.data)
  } else if (cssPath.match(absReg)) {
    return fse.readFileSync(cssPath, 'utf-8')
  } else {
    return Promise.reject(`${cssPath} format not correct`)
  }
}

exports.render = async (config) => {
  const mdFilePath = path.resolve(config.cwd, config['mdFile'])
  let renderContent = md.render(fse.readFileSync(mdFilePath, 'utf-8'))
  let parser = new DOMParser()
  let document = parser.parseFromString(renderContent, 'text/html')
  let title = document.getElementsByTagName('h1')[0].textContent
  let html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${title} - Hoarfroster</title>
    <link rel="stylesheet" href="/assets/styles/post.css">
    <link rel="stylesheet"
      href="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.5.0/build/styles/atom-one-light.min.css">
</head>
<body>
<div class="container post markdown-body">${renderContent}</div>
<div class="footer"></div>
</body>
<script src="/assets/scripts/index.js"></script>
<script>init()</script>
</html>
`
  // directly transform image src in html
  if (config['transformImage']) {
    html = html.replace(htmlImgReg, ($0, $1, $2) => {
      const base64 = base64Img.base64Sync(path.resolve(mdFilePath, '..', $2))
      return $1 + base64
    })
  }
  config.out = path.resolve(config.cwd, config.out)
  const fileReg = /([^/\\]*)\.[^/\\]+$/
  if (!config.out.match(fileReg)) {
    // if no file suffix, use the same as markdown file
    config.out = path.resolve(
      config.out,
      mdFilePath.match(fileReg)[1] + '.html'
    )
  }
  fse.writeFileSync(config.out, html)
}
