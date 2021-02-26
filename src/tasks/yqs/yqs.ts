import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

declare module 'hideBin' {}

const argv = yargs(hideBin(process.argv))
  .options({
    schema: { alias: 's', type: 'string', demandOption: true },
    changes: { alias: 'c', type: 'array' },
  })
  .help().argv
