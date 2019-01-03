var fs = require('fs');
var OTAFlashRow = require('./models/OTAFlashRow')

var PayloadProcessor = function(path){
  var processor = this
  processor.filePath = path
  processor.siliconID = null
  processor.siliconRev = null
  processor.checkSumType = null
  processor.header = null
  processor.flashDataLines = [];

  // fs.readFile(processor.filePath, 'utf8', function(err, contents) {
  //   if(err){
  //     throw err
  //     return
  //   }
  //   console.log(contents)
  //   processor.file = contents
  // });
  processor.file = fs.readFileSync(processor.filePath, 'utf8')
  processor.file = processor.file.trim()//Remove surrounding whitespace

  processor.analyzeHeader = function(){
    processor.header = processor._getMSBString(processor._getTheHeaderString())
    processor.siliconID = processor._getSiliconID()
    processor.siliconRev = processor._getSiliconRev()
    processor.checkSumType = processor._getCheckSumType()
  }

  processor.readDataLines = function(){
    processor.flashDataLines = [];
    var lines = processor.file.split(/\r?\n/);

    //For each line (except the header)
    for(var i = 1; i < lines.length; i++){
      //[1-byte ArrayID][2-byte RowNumber][2-byte DataLength][N-byte Data][1byte Checksum]
      //create data model
      var model = new OTAFlashRow();
      model.arrayID = parseInt(lines[i].substring(1, 3), 16);//01
      model.rowNumber = processor._getMSBString(lines[i].substring(3, 7));//D500
      model.dataLength = parseInt(lines[i].substring(7, 11), 16);//0080
      model.checksum = parseInt(lines[i].substring(lines[i].length - 3, lines[i].length), 16);//88

      //00400020916A0100F1CB0100F1CB010080B500AF024B83F3088806F0DBF8C0460040002080B500AF374B12221A6007F03FFD364B180007F077FF012007F048FD302007F053FB324B324A1A60324B8022D2051A60314B314A126802210A431A602F4B304A1A60304B00221A602F4B2F4A126808218A431A60FA23DB00180007F08
      var dataCharacters = lines[i].substring(11, lines[i].length - 2)
      var b = 0;
      var dataArray = []//TODO: Byte array
      for (var a = 0; a < model.dataLength; a++) {
        dataArray[a] = parseInt(dataCharacters.substring(b, b + 2), 16);
        b += 2
      }
      model.data = dataArray;
      processor.flashDataLines.push(model)
    }
  }

  processor.getTotalLines = function(){

  }

  processor._getTheHeaderString = function(){
    return processor.file.substring(0, 12)
  }

  processor._getSiliconID = function(){
    return processor.header.substring(4, 12)
  }

  processor._getSiliconRev = function(){
    return processor.header.substring(2, 4)
  }

  processor._getCheckSumType = function(){
    return processor.header.substring(0, 2)
  }

  processor._getMSBString = function(string){
    var retVal = ""
    for (var i = string.length; i > 0; i -= 2) {
      retVal += string.substring(i - 2, i);
    }
    return retVal;
  }
}

module.exports = PayloadProcessor

//
// class CustomFileReader {
//     private String mSiliconID;
//     private final String mHeader;
//     private final File mFile;
//     private int mReadingLine = 0;
//
//     //File read status updater
//     private FileReadStatusUpdater mFileReadStatusUpdaterUpdater;
//
//     //Constructor
//     public CustomFileReader(String filepath) {
//         mFile = new File(filepath);
//         mHeader = getTheHeaderString(mFile);
//         Logger.e("PATH>>>"+filepath);
//     }
//
//     public void setFileReadStatusUpdater(FileReadStatusUpdater fileReadStatusUpdater) {
//         this.mFileReadStatusUpdaterUpdater = fileReadStatusUpdater;
//     }
//
//     /**
//      * Analysing the header file and extracting the silicon ID,Check Sum Type and Silicon rev
//      */
//     public String[] analyseFileHeader() {
//         String[] headerData = new String[3];
//         String MSBString = Utils.getMSB(mHeader);
//         mSiliconID = getSiliconID(MSBString);
//         String mSiliconRev = getSiliconRev(MSBString);
//         String mCheckSumType = getCheckSumType(MSBString);
//         headerData[0] = mSiliconID;
//         headerData[1] = mSiliconRev;
//         headerData[2] = mCheckSumType;
//         return headerData;
//     }
//
//
//     /**
//      * Method to parse the file a read each line and put the line to a data model
//      *
//      * @return
//      */
//     public ArrayList<OTAFlashRowModel> readDataLines() {
//         ArrayList<OTAFlashRowModel> flashDataLines = new ArrayList<OTAFlashRowModel>();
//         String dataLine = null;
//         try {
//             BufferedReader bufferedReader = new BufferedReader(new FileReader(mFile));
//             while ((dataLine = bufferedReader.readLine()) != null) {
//                 mReadingLine++;
//                 mFileReadStatusUpdaterUpdater.onFileReadProgressUpdate(mReadingLine);
//                 byte[] data;
//
//                 OTAFlashRowModel model = new OTAFlashRowModel();
//                 if (mReadingLine != 1) {
//                     StringBuilder dataBuilder = new StringBuilder(dataLine);
//                     dataBuilder.deleteCharAt(0);
//                     model.mArrayId = Integer.parseInt(dataBuilder.substring(0, 2), 16);
//                     model.mRowNo = Utils.getMSB(dataBuilder.substring(2, 6));
//                     model.mDataLength = Integer.parseInt(dataBuilder.
//                             substring(6, 10), 16);
//                     model.mRowCheckSum = Integer.parseInt(dataBuilder.
//                             substring(dataLine.length() - 3, dataLine.length() - 1), 16);
//                     String datacharacters = dataBuilder.
//                             substring(10, dataLine.length() - 2);
//                     data = new byte[model.mDataLength];
//                     for (int i = 0, j = 0; i < model.mDataLength; i++, j += 2) {
//                         data[i] = (byte) Integer.parseInt(datacharacters.substring(j, j + 2), 16);
//                     }
//                     model.mData = data;
//                     flashDataLines.add(model);
//                 }
//             }
//         } catch (FileNotFoundException e) {
//             e.printStackTrace();
//         } catch (IOException e) {
//             e.printStackTrace();
//         }
//         return flashDataLines;
//     }
//
//     /**
//      * Method to count the total lines in the selected file
//      *
//      * @return totalLines
//      */
//     public int getTotalLines() {
//         int totalLines = 0;
//         String dataLine = "";
//         try {
//             BufferedReader bufferedReader = new BufferedReader(new FileReader(mFile));
//             while ((dataLine = bufferedReader.readLine()) != null) {
//                 totalLines++;
//             }
//         } catch (FileNotFoundException e) {
//             e.printStackTrace();
//         } catch (IOException e) {
//             e.printStackTrace();
//         }
//         return totalLines;
//     }
//
//     /**
//      * Reading the first line from the file
//      *
//      * @param file
//      * @return
//      */
//     private String getTheHeaderString(File file) {
//         String header = "";
//         try {
//             BufferedReader bufferedReader = new BufferedReader(new FileReader(file));
//             header = bufferedReader.readLine();
//             bufferedReader.close();
//         } catch (FileNotFoundException e) {
//             e.printStackTrace();
//         } catch (IOException e) {
//             e.printStackTrace();
//         }
//         return header;
//     }
//
//     private String getSiliconID(String header) {
//         String siliconID = header.substring(4, 12);
//         return siliconID;
//     }
//
//     private String getSiliconRev(String header) {
//         String siliconRev = header.substring(2, 4);
//         return siliconRev;
//     }
//
//     private String getCheckSumType(String header) {
//         String checkSumType = header.substring(0, 2);
//         return checkSumType;
//     }
//
// }
