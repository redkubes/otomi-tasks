import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv))
  .options({
    s: { type: 'string', alias: 'schema', demandOption: true },
  })
  .help().argv
