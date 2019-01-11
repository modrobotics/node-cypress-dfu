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
