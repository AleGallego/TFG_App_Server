const sendMailPassword = require("../utils/nodeMailer.js")


function createUserPassword(toData,subjectData,textData,htmlData){

    // Se verifican los datos y demas


    sendMailPassword(toData,subjectData,textData,htmlData)


}
module.exports = createUserPassword