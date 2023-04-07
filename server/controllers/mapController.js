var mongoose = require('mongoose');
const Map = require('../models/mapModel')
const User = require('../models/userInfoModel');
const MapCard = require('../models/mapCardModel')
const MapData = require('../models/mapDataModel')
const CommunityPreview = require('../models/communityPreviewModel')

class mapController {
    static async createMap(req, res) {
        try{
            var { title } = req.body;
            let session = req.cookies.values;
            var owner = await User.findOne({username: session.username});
            var newMap = new Map({
                title: title,
                owner: owner._id
            });
            
            await newMap.save();

            console.log(title);
            
            var newMapCard = new MapCard({
                title: title,
                map: newMap._id
            })
            
            await newMapCard.save();
            
            owner.ownedMaps.push(newMap._id);
            
            owner.ownedMapCards.push(newMapCard._id);

            await owner.save()
            console.log(newMap._id.toString());
            return res.status(200).json({status: 'OK', title: title, mapId: newMap._id.toString()});
        }
        catch(e){
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async deleteMapById(req, res) {
        var { id } = req.body;

        var id = mongoose.Types.ObjectId(id);
        var mapCard = MapCard.findOneAndDelete({ _id: id });
        var map = Map.findOneAndDelete({ _id: mapCard._id });
        var mapData = MapData.findOneAndDelete({ _id: map._id });

        User.findOneAndUpdate({_id: id}, { $pull: {ownedMapCards: mapCards._id, ownedMaps: map._id} });

        return res.status(400).json({status: 'OK'});
    }

    static async duplicateMapById(req, res) {

    }

    static async changeMapNameById(req, res) {
        
    }
}

module.exports = mapController;