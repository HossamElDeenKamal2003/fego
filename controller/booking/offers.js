const offerModel = require('../../model/booking/offers');

const addOffer = async function(req, res){
    const {tripId, driverId, offer} = req.body;
    try{
        if(!tripId || !driverId){
            res.status(400).json({message: 'tripId and driverId are required'});
        }
        const newOffer = new offerModel({
            tripId,
            driverId,
            offer
        })
        await newOffer.save();
        res.status(200).json({message: 'offer created successfully'});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
    }
}

const getOffer = async function(req,res){
    const {tripId} = req.body
    try{
        if(!tripId){
            res.status(4000).json({message: 'tripId is required'});
        }
        const offer = await offerModel.find({tripId: tripId});
        res.status(200).json({offer});
    }
    catch(error){
        console.log(error);
        res.status(500).json(error.message);
    }
}


module.exports = {
    addOffer,
    getOffer
}