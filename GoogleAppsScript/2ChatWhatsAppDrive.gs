// .d888b.  .o88b. db   db  .d8b.  d888888b     .o88b.  .d88b.  
// VP  `8D d8P  Y8 88   88 d8' `8b `~~88~~'    d8P  Y8 .8P  Y8. 
//    odD' 8P      88ooo88 88ooo88    88  .     8P      88    88 
//  .88'   8b      88~~~88 88~~~88    88       8b      88    88 
// j88.    Y8b  d8 88   88 88   88    88    db Y8b  d8 `8b  d8' 
// 888888D  `Y88P' YP   YP YP   YP    YP    VP  `Y88P'  `Y88P'  
                                                             
                                                                                                                                                                                                     
                                                    
/**
 * Main function receiving post requests
 * @e {object} Body send as a POST request
 *
*/
function doPost(e){

  // Parse the JSON content from the POST request body
  var o = JSON.parse(e.postData.contents);

//   var o ={
//   "message": "test",
//   "remote_phone_number": "+573206800124",
//   "destinationFolder": "2ChatFiles",
//   "allowedfiles": "pdf,xlsx,docx",
//   "saveYearMonth":0,
//   "fileURL": "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf"
// }

  //Logger.log(o)
  try{
    // Extract data from the parsed JSON object
    var message = o.message
    var phone = o.remote_phone_number
    var destinationFolder = o.destinationFolder
    var allowedfiles= o.allowedfiles
    var fileURL=o.fileURL
    var saveYearMonth = o.saveYearMonth

    // Extract the filename from the provided URL
    var fileNameChat = extractFilename(fileURL)

    // Get the file extension from the URL
    var extension=fileURL.split(".").pop()
    // Check if the file extension is allowed
    if (allowedfiles.includes(extension)){
      // Construct a unique filename
      var fileName = phone.replace('+','') + "_"+ f_s_ymd_hms() + "_" +fileNameChat

      // Call the function to fetch and save the file
      getFile(fileURL,destinationFolder,fileName,phone.replace('+',''),saveYearMonth)
    }
    // Set success message
    var responseMessage="file saved"
  } catch(e){
    // Set error message if an exception occurs
    var responseMessage=e.message
  }
  // Return a JSON response with the message
  return ContentService.createTextOutput(responseMessage).setMimeType(ContentService.MimeType.JSON);

}

/**
 * Extracts the filename from a given URL.
 * @param {string} url The URL from which to extract the filename.
 * @returns {string} The extracted filename.
 */
function extractFilename(url) {
    // Split the URL by '/' to get parts
    const parts = url.split('/');
    // Get the last part, which contains the filename and possibly query parameters
    const lastPart = parts[parts.length - 1];
    // Split the last part by '?' to remove query parameters and get the pure filename
    const filename = lastPart.split('?')[0];
    return filename;
}

/**
 * Generates a formatted date and time string (YYYY-MM-DD_HH-MM-SS).
 * @returns {string} The formatted date and time string.
 */
function f_s_ymd_hms(){
  // Create a new Date object
  var o_date = new Date();
  // Format the date and time into a string
  var s_hms_ymd = `${o_date.getFullYear().toString().padStart(2,'0')}-${(o_date.getMonth()+1).toString().padStart(2,'0')}-${o_date.getDate().toString().padStart(2,'0')}_${o_date.getHours().toString().padStart(2,'0')}-${o_date.getMinutes().toString().padStart(2,'0')}-${o_date.getSeconds().toString().padStart(2,'0')}`
  return s_hms_ymd
}

/**
 * Gets or creates year and month subfolders within a base folder.
 * @param {GoogleAppsScript.Drive.Folder} baseFolder The parent folder.
 * @returns {GoogleAppsScript.Drive.Folder} The created or existing month folder.
 */
function getFolderYYYYMM(baseFolder){
  // Create a new Date object
  var o_date = new Date();
  // Get current year and month as strings
  var folderYearName = o_date.getFullYear().toString()
  var folderMonthName = o_date.getMonth().toString()
  // Look for the year folder
  var yearFolders = baseFolder.getFoldersByName(folderYearName)
  if (yearFolders.hasNext()) {
    // If found, get the existing year folder
    var yearFolder=yearFolders.next()
  }else{
    // If not found, create a new year folder
    var yearFolder = baseFolder.createFolder(folderYearName)
  }
  // Look for the month folder within the year folder
  var monthFolders = yearFolder.getFoldersByName(folderMonthName)
  if (monthFolders.hasNext()) {
    // If found, get the existing month folder
    var monthFolder = monthFolders.next()
  }else{
    // If not found, create a new month folder
    var monthFolder = yearFolder.createFolder(folderMonthName)
  }
  return monthFolder
}

/**
 * Fetches a file from a URL and saves it to Google Drive.
 * @param {string} fileURL The URL of the file to fetch.
 * @param {string} destinationFolder The name of the main destination folder in Drive.
 * @param {string} fileName The desired name for the saved file.
 * @param {string} phoneNumber The phone number to create a subfolder.
 * @param {number} saveYearMonth Flag to determine if year/month subfolders should be used.
 */
function getFile(fileURL,destinationFolder,fileName,phoneNumber,saveYearMonth) {
  // see https://developers.google.com/apps-script/class_urlfetchapp
  // Fetch the file from the URL
  var response = UrlFetchApp.fetch(fileURL);
  // Get the file content as a blob
  var fileBlob = response.getBlob()

  // Search for the main destination folder by name
  var folders = DriveApp.getFoldersByName(destinationFolder);

  if (folders.hasNext()) {
    // If found, get the existing folder
    var folder = folders.next();
  }else{
    // If not found, use the root folder
    var folder = DriveApp.getRootFolder();
  }
  try{
    // Search for a subfolder named after the phone number
    var subfolders =folder.getFoldersByName(phoneNumber)
    if (subfolders.hasNext()) {
      // If found, get the existing subfolder
      var subfolder = subfolders.next();
    }else{
      // If not found, create a new subfolder
      var subfolder=folder.createFolder(phoneNumber)
    }
  } catch (e){
    // In case of error, create the subfolder
    var subfolder=folder.createFolder(phoneNumber)
  }

  // Determine the final folder to save the file
  if (saveYearMonth==1) { // Changed = to == for comparison
    // If saveYearMonth is 1, use year and month subfolders
    var finalFolder = getFolderYYYYMM(subfolder)
  }else{
    // Otherwise, use the phone number subfolder directly
    var finalFolder = subfolder
  }
  // Create the file in the final destination folder
  var file = finalFolder.createFile(fileBlob);
  // Get the file extension (though not used after this line)
  var extension=fileURL.split(".").pop()
  // Set the name of the created file
  file.setName(fileName)
  //debugger;  // Stop to observe if in debugger
}
