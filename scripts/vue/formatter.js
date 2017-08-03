const jsdom = require('jsdom')
const esformatter = require('esformatter')
const cssBeautify = require('js-beautify').css
const htmlBeautify = require('js-beautify').html
const Entities = require('html-entities').AllHtmlEntities;

const entities = new Entities();

function matchTemplate(html) {
  let startReg = /<template[^>]*>/
  let endReg = /<\/template>/
  html = html.split(startReg)[1]
  html = html.split(endReg)[0]

  return html
}

function createDom(html) {
  let dom = new jsdom.JSDOM('<body>' + html + '</body>')

  return dom.window.document.body
}

function getElementWrapper(elem) {
  let outer = elem.outerHTML

  return outer.split(elem.innerHTML)
}

function trim(code) {
  code = '\n' + code + '\n'
  code = code.replace(/(^\s*[\r\n])+/gim, '\n')

  return code
}

module.exports = function(code, options) {
  code = code.replace(/\<style/g, '<stylesheet')
  code = code.replace(/\<\/style\>/g, '<\/stylesheet\>')
  let body = createDom(code)
  let results = []

  for (let i = 0; i < body.children.length; i++) {
    let elem = body.children[i]
    let wrapper = getElementWrapper(elem)

    switch (elem.tagName) {
      case 'TEMPLATE':
        results.push([
          wrapper[0],
          trim(htmlBeautify(matchTemplate(code), options.html)),
          wrapper[1]
        ].join(''))
        break

      case 'STYLESHEET':
      case 'STYLE':
        let lang = elem.getAttribute('lang') || 'css'
        results.push([
          wrapper[0].replace(/<stylesheet/g, '<style'),
          trim(cssBeautify(entities.decode(elem.innerHTML), options.css)),
          wrapper[1].replace(/<\/stylesheet>/g, '</style>')
        ].join(''))
        break

      case 'SCRIPT':
        results.push([
          wrapper[0],
          trim(esformatter.format(elem.innerHTML, options.es)),
          wrapper[1]
        ].join(''))
        break;
    }
  }

  return results.join('\n\n')
}
