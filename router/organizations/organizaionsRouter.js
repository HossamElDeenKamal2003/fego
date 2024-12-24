const express = require('express');
const router = express.Router();

const {
    getOrganization,
    addFav,
    myFavoriteOrganizations,
    updateWorkDays,
    patchProfileImage
} = require('../../controller/findOrganization');

router.get('/get-all-org', getOrganization);
router.post('/add-fav', addFav);
router.get('/get-fav-org/:id', myFavoriteOrganizations);
router.patch('/updateWorkDays', updateWorkDays);

module.exports = router