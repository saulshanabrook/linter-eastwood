'use babel'
/* global atom */

import path from 'path'
import { CompositeDisposable } from 'atom'
console.log('loading')
export default {
  config: {
    leinExecutablePath: {
      description: 'Path to the `lein` executable',
      type: 'string',
      default: 'lein'
    }
  },

  activate () {
    require('atom-package-deps').install()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(
      atom.config.observe('linter-eastwood.leinExecutablePath', leinExecutablePath => {
        this.leinPath = leinExecutablePath
      })
    )
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  provideLinter () {
    const helpers = require('atom-linter')
    return {
      name: 'eastwood',
      grammarScopes: ['source.clojure'],
      scope: 'project',
      lintOnFly: false,
      lint: textEditor => {
        console.log('calling linter3')

        const filePath = textEditor.getPath()
        const fileDir = path.dirname(filePath)
        const regex = new RegExp(/^([^/].+):(\d+):(\d+): (.+): (.*)$/)

        return helpers.exec(this.leinPath, ['eastwood'],
          { cwd: fileDir }
        ).then(eastwoodOut => eastwoodOut
          .split(/\n/)
          .map(l => regex.exec(l))
          .filter(v => v !== null)
          .map(m => ({
            file: m[1],
            line: m[2],
            col: m[3],
            linter: m[4],
            msg: m[5]
          }))
          .map(e => ({
            type: 'Error',
            text: e.msg,
            name: e.linter,
            filePath: e.file,
            range: helpers.rangeFromLineNumber(textEditor, e.line, e.col)
          }))
        )
      }
    }
  }
}
