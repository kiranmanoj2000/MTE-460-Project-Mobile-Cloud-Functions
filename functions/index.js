/* eslint-disable max-len */
const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const admin = require("firebase-admin");
admin.initializeApp();

// listener method
exports.sendListenerPushNotification = functions.database.ref("/fallenPackageEvents/{fallenPackageEventId}/").onWrite( async (data, context) =>{
  const fallenPackageEventId = context.params.fallenPackageEventId;
  const packageData = data.after.val();

  const fallenDate = new Date(packageData.createdDate).toLocaleString('en-US', {timeZone: 'America/New_York'});
  const conveyorBeltId = packageData.conveyorBeltId;
  const companyId = packageData.companyId;

  const tokens = Object.keys((await admin.database().ref(`/companies/${companyId}/tokens`).once("value")).val());
  const conveyorBeltName = (await admin.database().ref(`/conveyorBelts/${conveyorBeltId}/name`).once("value")).val();
  const jsonData = {conveyorBeltName: conveyorBeltName, fallenDate: fallenDate, fallenPackageEventId: fallenPackageEventId};

  const payload = {
    tokens: tokens,
    notification: {
      title: conveyorBeltName + " - package fallen",
      body: fallenDate,
    },
    data: {
      body: JSON.stringify(jsonData),
    },
    android: {
      priority: "high",
    },
  };

  admin.messaging().sendMulticast(payload).then((response) => {
    // Response is a message ID string.
    console.log("Successfully sent message:", response);
    return {success: true};
  }).catch((error) => {
    return {error: error.code};
  });
  return true;
});
