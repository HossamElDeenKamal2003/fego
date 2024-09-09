// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./flieger-technology-6a8b2-firebase-adminsdk-fvhxn-0d5c656aaf.json'); // Update this path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendNotification = (token, message) => {
    const payload = {
        notification: {
            title: message.title,
            body: message.body,
            sound: 'default'
        },
        token: token,
    };

    return admin.messaging().send(payload)
        .then(response => {
            console.log('Notification sent successfully:', response);
            return response;
        })
        .catch(error => {
            console.log('Error sending notification:', error);
            throw error;
        });
};

module.exports = sendNotification;
