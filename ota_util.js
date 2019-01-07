var crc = require('crc')

var OTAUtil = {
  swapEndian: function(word){
    return ((word & 0xFF) << 8)
       | ((word >> 8) & 0xFF);
  },
  swap: function(value){
    var b1 = (value >> 0) & 0xff;
    var b2 = (value >> 8) & 0xff;
    var b3 = (value >> 16) & 0xff;
    var b4 = (value >> 24) & 0xff;

    return (b1 << 24 | b2 << 16 | b3 << 8 | b4 << 0)>>>0;
  },
  calculateCheckSum: function (checkSumType, data){
    var datalen = data.length
    var checkSum = 0;
    if (checkSumType == 0) {
      while (datalen-- > 0) {
        /**
         * AND each value with 0xFF to remove the negative value for summation
         */
        checkSum += (data[datalen] & 0xFF);
      }
    } else {
      return crc.crc16(data);
    }
    return (1 + (~checkSum)) & 0xFFFF;
  },
  calculateCheckSumVerifyRow: function (data){
    var checkSum = 0;
    var datalen = data.length
    while (datalen-- > 0) {
      /**
       * AND each value with 0xFF to remove the negative value for summation
       */
      checkSum += (data[datalen] & 0xFF);
    }
    return checkSum;
  }
}

module.exports = OTAUtil
