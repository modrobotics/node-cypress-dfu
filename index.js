var PayloadProcessor = require('./payloadProcessor.js')
var OTAUpdater = require('./otaUpdater.js')
var events = require('events')
var util = require('util')

var CypressDFU = function () {
  var cypressDFU = this

  this.startUpdate = function (payload, writeMethod) {
    this.otaUpdater = new OTAUpdater(writeMethod)
    this.onData = this.otaUpdater.onData
    this.attachEventListeners()

    var payloadProcessor = new PayloadProcessor(payload)
    payloadProcessor.analyzeHeader()
    payloadProcessor.readDataLines()

    this.otaUpdater.start(payloadProcessor)

    return this.otaUpdater
  }

  this.attachEventListeners = function () {
    this.otaUpdater.on('progress', function (percentage) {
      cypressDFU.emit('progress', percentage)
    })
    this.otaUpdater.on('flashStart', function () {
      cypressDFU.emit('flashStart')
    })
    this.otaUpdater.on('flashFinished', function () {
      cypressDFU.emit('flashFinished')
    })
    this.otaUpdater.on('error', function (err, code, message) {
      cypressDFU.emit('error', err, code, message)
    })
  }
}

util.inherits(CypressDFU, events.EventEmitter)
module.exports = new CypressDFU()
