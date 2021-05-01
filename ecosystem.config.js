/* eslint @typescript-eslint/no-var-requires: "off" */
const os = require('os')

const cpus = os.cpus().length

module.exports = [
  {
    script: 'src/index.js',
    name: 'app',
    exec_mode: 'cluster',
    instances: cpus
  }
]
