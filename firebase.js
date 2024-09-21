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

        // Handle invalid FCM token or invalid argument errors gracefully
        if (error.errorInfo && error.errorInfo.code === 'messaging/invalid-argument') {
            console.log(`The token ${token} is invalid or not a valid FCM registration token.`);
            // Do not throw an error, silently skip the invalid token
            return { success: false, message: 'Invalid FCM registration token' };
        }

        // Handle token not registered
        if (error.errorInfo && error.errorInfo.code === 'messaging/registration-token-not-registered') {
            console.log(`The token ${token} is no longer valid.`);
            // Do not throw an error, silently skip the invalid token
            return { success: false, message: 'Token is no longer valid' };
        }

        // Retry for internal server errors
        if (error.code === 'messaging/internal-error' && retries > 0) {
            console.log(`Retrying... (${3 - retries + 1})`);

            // Wait for a short delay before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Retry sending the notification
            return sendNotification(token, message, retries - 1);
        }

        // For all other errors, throw the error
        throw error;
    }
};

module.exports = sendNotification;
