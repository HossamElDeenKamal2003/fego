const paytabsModel = require('../../../model/banking/paytabs');
const PayTabs = require('paytabs_pt2');

// PayTabs Configuration
let profileID = "STJ9NJNMKN-JJWL2MDDHK-KZDJJG9JGT CKK2M9-2P9766-VBMNDD-QNR6DD";
let serverKey = "SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZBCBK2M9-2P9966-VBMN2N-BQDDBH";
let region = "EGY";

PayTabs.setConfig(profileID, serverKey, region);

// Payment Details
let paymentMethods = ["all"];
let transaction = {
    type: "sale", // Transaction type
    class: "ecom" // Transaction class
};
let cart = {
    id: "12345", // Replace with actual cart ID
    currency: "EGP", // Currency code
    amount: 100.00, // Amount to charge
    description: "Order description" // Description of the order
};

// Customer Details
let customer = {
    name: "John Doe", // Customer's name
    email: "john@example.com", // Customer's email
    phone: "+201234567890", // Customer's phone number
    street: "123 Main St", // Customer's street
    city: "Cairo", // Customer's city
    state: "Cairo", // Customer's state
    country: "EGY", // Customer's country
    zip: "12345", // Customer's ZIP code
    IP: "192.168.1.1" // Customer's IP address
};

// Shipping Address (if different from customer details)
let shipping_address = [
    customer.street,
    customer.city,
    customer.state,
    customer.country,
    customer.zip
];

// Response URLs
let response_URLs = [
    "https://yourdomain.com/response", // URL to handle response
    "https://yourdomain.com/callback"  // URL for asynchronous callback
];

// Language setting
let lang = "ar"; // Arabic language

// Callback for payment page creation
function paymentPageCreated($results) {
    console.log($results);
}

// Create Payment Page
PayTabs.createPaymentPage(
    paymentMethods,
    [transaction.type, transaction.class], // Transaction details as array
    [cart.id, cart.currency, cart.amount, cart.description], // Cart details as array
    [customer.name, customer.email, customer.phone, customer.street, customer.city, customer.state, customer.country, customer.zip, customer.IP], // Customer details as array
    shipping_address, // Shipping address
    response_URLs, // Response URLs
    lang, // Language
    paymentPageCreated // Callback function
);
