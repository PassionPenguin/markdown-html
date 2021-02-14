const { program } = require('commander')
const pkgJson = require('../package.json')
const render = require('./md').render
const defaults = require('./defaults')

program.usage('mdFile [options]')
program.option('mdfile', 'Path of the markdown file to convert')
program.option('-o --out <path>', 'path where save the html', defaults.out)
program.option('--cwd <path>', 'current working directory', defaults.cwd)
program.option(
  '-no-hf --no-html-fragment',
  'do not generate html fragment',
  defaults['htmlFragment']
)
program.version(pkgJson.version)

program.parse(process.argv)

if (program.args.length === 0) {
  program.help()
}

render(Object.assign(program.opts(), { mdFile: program.args[0] }))
