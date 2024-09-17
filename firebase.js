const admin = require('firebase-admin');
const serviceAccount = require('./flieger-technology-6a8b2-firebase-adminsdk-fvhxn-0d5c656aaf.json'); // Update this path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (token, message, retries = 3) => {
    const payload = {
        notification: {
            title: message.title,
            body: message.body,
        },
        token: token,
    };

    try {
        const response = await admin.messaging().send(payload);
        console.log('Notification sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error);

        // Check if the error is a 503 (Service Unavailable)
        if (error.code === 'messaging/internal-error' && retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);

            // Wait for a short delay before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Retry sending the notification
            return sendNotification(token, message, retries - 1);
        }

        // If retries are exhausted or it's not a 503 error, throw the error
        throw error;
    }
};

module.exports = sendNotification;
