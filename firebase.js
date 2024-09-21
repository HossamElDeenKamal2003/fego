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
        data: message.data || {}, // Optional custom data
        token: token,
    };

    try {
        const response = await admin.messaging().send(payload);
        console.log('Notification sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error);

        // Retry on internal error
        if (error.code === 'messaging/internal-error' && retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));

            return sendNotification(token, message, retries - 1);
        }

        // Re-throw the error if retries are exhausted or if it's not a recoverable error
        throw error;
    }
};

module.exports = sendNotification;
