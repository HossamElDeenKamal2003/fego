const User = require('../../model/regestration/userModel');

const updateemail = async function(req,res){
    const id = req.params.id;
    const updatedEmail = req.body;
    try{
        const valid = await User.findByIdAndUpdate({_id:id},{
            email: updatedEmail,
        });
        if(!valid){
            return res.status(404).json({message: 'User Not Found'});
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

module.exports = updateemail;