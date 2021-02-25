import yargs = require('yargs/yargs')

const argv = yargs(process.argv.slice(2))
  .options({
    s: { type: 'string', alias: 'schema', demandOption: true },
  })
  .help().argv
