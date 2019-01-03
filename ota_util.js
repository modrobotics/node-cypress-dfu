var crc = require('crc')

var OTAUtil = {
  swapEndian: function(word){
    return ((word & 0xFF) << 8)
       | ((word >> 8) & 0xFF);
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
