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

        // Handle invalid token error (token is no longer valid)
        if (error.errorInfo.code === 'messaging/registration-token-not-registered') {
            console.log(`The token ${token} is invalid. Skipping notification without error.`);
            // Do not throw error, silently skip the invalid token
            return { success: false, message: 'Token is no longer valid' };
        }

        // Retry if it's a 503 (Service Unavailable) error
        if (error.code === 'messaging/internal-error' && retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);

            // Wait for a short delay before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Retry sending the notification
            return sendNotification(token, message, retries - 1);
        }

        // If retries are exhausted or the error is not recoverable, throw the error
        throw error;
    }
};

module.exports = sendNotification;
