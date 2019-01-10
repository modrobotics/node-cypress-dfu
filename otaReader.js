var OTAUtil = require('./otaUtil.js')
var debug = require('debug')('cypressDFU:otaReader')

var OTAResponseReceiver = function () {
  // Substring Constants
  var RESPONSE_START = 2
  var RESPONSE_END = 4

  var STATUS_START = 4
  var STATUS_END = 6
  var CHECKSUM_START = 4
  var CHECKSUM_END = 6

  var SILICON_ID_START = 8
  var SILICON_ID_END = 16
  var SILICON_REV_START = 16
  var SILICON_REV_END = 18

  var START_ROW_START = 8
  var START_ROW_END = 12
  var END_ROW_START = 12
  var END_ROW_END = 16

  var DATA_START = 8
  var DATA_END = 10

  var RADIX = 16

  var CASE_SUCCESS = 0
  // var CASE_ERR_FILE = 1
  // var CASE_ERR_EOF = 2
  // var CASE_ERR_LENGTH = 3
  // var CASE_ERR_DATA = 4
  // var CASE_ERR_CMD = 5
  // var CASE_ERR_DEVICE = 6
  // var CASE_ERR_VERSION = 7
  // var CASE_ERR_CHECKSUM = 8
  // var CASE_ERR_ARRAY = 9
  // var CASE_ERR_ROW = 10
  // var CASE_BTLDR = 11
  // var CASE_ERR_APP = 12
  // var CASE_ERR_ACTIVE = 13
  // var CASE_ERR_UNK = 14
  // var CASE_ABORT = 15
  //
  // // Error Constants
  // var CYRET_ERR_FILE = 'CYRET_ERR_FILE'
  // var CYRET_ERR_EOF = 'CYRET_ERR_EOF'
  // var CYRET_ERR_LENGTH = 'CYRET_ERR_LENGTH'
  // var CYRET_ERR_DATA = 'CYRET_ERR_DATA'
  // var CYRET_ERR_CMD = 'CYRET_ERR_CMD'
  // var CYRET_ERR_DEVICE = 'CYRET_ERR_DEVICE'
  // var CYRET_ERR_VERSION = 'CYRET_ERR_VERSION'
  // var CYRET_ERR_CHECKSUM = 'CYRET_ERR_CHECKSUM'
  // var CYRET_ERR_ARRAY = 'CYRET_ERR_ARRAY'
  // var CYRET_BTLDR = 'CYRET_BTLDR'
  // var CYRET_ERR_APP = 'CYRET_ERR_APP'
  // var CYRET_ERR_ACTIVE = 'CYRET_ERR_ACTIVE'
  // var CYRET_ERR_UNK = 'CYRET_ERR_UNK'
  // var CYRET_ERR_ROW = 'CYRET_ERR_ROW'
  // var CYRET_ABORT = 'CYRET_ABORT'

  this.parseParseSendDataAcknowledgement = function (hexValue, callback) {
    var result = hexValue.trim().replace(' ', '')
    var response = result.substring(RESPONSE_START, RESPONSE_END)
    var status = result.substring(STATUS_START, STATUS_END)
    var responseBytes = parseInt(response, RADIX)
    switch (responseBytes) {
      case CASE_SUCCESS:
        debug('CYRET_SUCCESS')
        callback(null, status)
        break
      default:
        debug('CYRET ERROR')
        callback(responseBytes)
        break
    }
  }

  this.parseEnterBootLoaderAcknowledgement = function (parse, callback) {
    var result = parse.trim().replace(' ', '')
    var response = result.substring(RESPONSE_START, RESPONSE_END)
    debug('Response>>>>>' + result)
    var responseBytes = parseInt(response, RADIX)
    switch (responseBytes) {
      case CASE_SUCCESS:
        debug('CYRET_SUCCESS')
        var siliconID = result.substring(SILICON_ID_START, SILICON_ID_END).toUpperCase()
        var siliconRev = result.substring(SILICON_REV_START, SILICON_REV_END).toUpperCase()
        callback(null, siliconID, siliconRev)
        break
      default:
        debug('CYRET ERROR')
        callback(responseBytes)
        break
    }
  }

  this.parseGetFlashSizeAcknowledgement = function (parse, callback) {
    var result = parse.trim().replace(' ', '')
    var response = result.substring(RESPONSE_START, RESPONSE_END)
    debug('Get flash size Response>>>>>' + result)
    var responseBytes = parseInt(response, RADIX)
    switch (responseBytes) {
      case CASE_SUCCESS:
        debug('CYRET_SUCCESS')
        var startRow = OTAUtil.swap(parseInt(result.substring(START_ROW_START, START_ROW_END), RADIX))
        var endRow = OTAUtil.swap(parseInt(result.substring(END_ROW_START, END_ROW_END), RADIX))
        callback(null, startRow, endRow)
        break
      default:
        debug('CYRET ERROR')
        callback(responseBytes)
        break
    }
  }

  this.parseParseRowAcknowledgement = function (parse, callback) {
    var result = parse.trim().replace(' ', '')
    var response = result.substring(RESPONSE_START, RESPONSE_END)
    var status = result.substring(STATUS_START, STATUS_END)
    var responseBytes = parseInt(response, RADIX)
    switch (responseBytes) {
      case CASE_SUCCESS:
        debug('CYRET_SUCCESS')
        callback(null, status)
        break
      default:
        debug('CYRET ERROR')
        callback(responseBytes)
        break
    }
  }

  this.parseVerifyRowAcknowledgement = function (parse, callback) {
    var result = parse.trim().replace(' ', '')
    var response = result.substring(RESPONSE_START, RESPONSE_END)
    var data = result.substring(DATA_START, DATA_END)
    var responseBytes = parseInt(response, RADIX)
    switch (responseBytes) {
      case CASE_SUCCESS:
        debug('CYRET_SUCCESS')
        callback(null, response, data)// VERIFY_ROW_STATUS, VERIFY_ROW_CHECKSUM
        break
      default:
        debug('CYRET ERROR')
        callback(responseBytes)
        break
    }
  }

  this.parseVerifyCheckSum = function (parse, callback) {
    var result = parse.trim().replace(' ', '')
    var response = result.substring(RESPONSE_START, RESPONSE_END)
    var checkSumStatus = result.substring(CHECKSUM_START, CHECKSUM_END)
    var responseBytes = parseInt(response, RADIX)
    switch (responseBytes) {
      case CASE_SUCCESS:
        debug('CYRET_SUCCESS')
        callback(null, checkSumStatus)
        break
      default:
        debug('CYRET ERROR')
        callback(responseBytes)
        break
    }
  }

  this.parseExitBootloader = function (parse, callback) {
    var response = parse.trim().replace(' ', '')
    debug('Reponse Byte Exit>>' + response)
    callback(null, response)
  }
}

module.exports = OTAResponseReceiver
