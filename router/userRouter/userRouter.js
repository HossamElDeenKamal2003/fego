const express = require('express');
const router = express.Router();
const { signUp, login, updatePassword, patchBlock,handleToken,  patchAlerts, DeleteUser } = require('../../controller/userController/userController');
const upload = require('../../middlewares/fiels');
const {
    patchRole,
    deleteUser,
    getSupports,
    siginupSupport
} = require('../../controller/userController/support');
// Sign-up route
router.post('/signup',upload.single('profile_image'), signUp);
router.patch('/block/:id', patchBlock);
router.delete('/delete-user/:id', DeleteUser);
router.patch('/increament-alerts/:id', patchAlerts);
// Login route
router.post('/login', login);

// Update password route
router.patch('/updatepassword', updatePassword);
router.patch('/handle-token/:id', handleToken);
router.patch('/patchRole', patchRole);
router.delete('/delete-permission/:id', deleteUser);
router.get('/get_supports', getSupports);
router.post('/support_signup', siginupSupport)
module.exports = router;
