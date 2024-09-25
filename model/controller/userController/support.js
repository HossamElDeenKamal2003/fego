const User = require('../../model/regestration/userModel');

const patchRole = async function(req, res) {
    const { userId, role } = req.body;
    try {
        const userRole = await User.findOneAndUpdate(
            { _id: userId },
            { role: role },
            { new: true }
        );
        if (!userRole) {
            return res.status(400).json({ message: "Error When Patching Role for This User" });
        }
        res.status(200).json({ message: "Role Updated Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async function(req, res) {
    const { userId } = req.body;
    try {
        const deletePermission = await User.findOneAndUpdate(
            { _id: userId },
            { role: "" },
            { new: true }
        );
        if (!deletePermission) {
            return res.status(400).json({ message: "Error When Deleting Role for This User" });
        }
        res.status(200).json({ message: "Role Deleted Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getSupports = async function(req, res) {
    try {
        const users = await User.find({ role: { $ne: "", $exists: true } });
        res.status(200).json({users: users});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    patchRole,
    deleteUser,
    getSupports
};
