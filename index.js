'use babel'
/* global atom */

import path from 'path'
import { CompositeDisposable } from 'atom'
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
      scope: 'file',
      lintOnFly: false,
      lint: textEditor => {
        const regex = new RegExp(/^([^/].+):(\d+):(\d+): (.+)$/)
        const filePath = textEditor.getPath()

        const firstLine = textEditor.getBuffer().getLines()[0]
        const nsRegex = new RegExp(/^\(ns\ (\S+)$/)
        const ns = nsRegex.exec(firstLine)[1]
        console.log("Linting namesapce '" + ns + "' with lein eastwood.")
        return helpers.exec(
          this.leinPath,
          ['trampoline', 'eastwood', "{:namespaces [" + ns + "]}"],
          {cwd: path.dirname(filePath)}
        ).then(eastwoodOut => eastwoodOut
          .split(/\n/)
          .map(l => regex.exec(l))
          .filter(v => v !== null)
          .map(m => ({
            file: m[1],
            line: m[2],
            col: m[3],
            msg: m[4]
          }))
          .map(e => ({
            type: 'Error',
            text: e.msg,
            filePath: filePath,
            range: helpers.rangeFromLineNumber(textEditor, e.line, e.col)
          }))
        )
      }
    }
  }
}
