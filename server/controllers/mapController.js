var mongoose = require('mongoose');
const User = require('../models/userInfoModel');
const MapCard = require('../models/mapCardModel')
const MapData = require('../models/mapDataModel')
const CommunityPreview = require('../models/communityPreviewModel')

class mapController {
    static async createMap(req, res) {
        try {
            var { title } = req.body;
            let session = req.cookies.values;

            var owner = await User.findOne({username: session.username});
            var newMapData = new MapData({
                type: " ", 
                feature: []
            })
            await newMapData.save();

            var newMapCard = new MapCard({
                title: title,
                owner: owner._id,
                published: false, 
                mapData: newMapData._id
            })
            await newMapCard.save();

            owner.ownedMapCards.push(newMapCard._id);
            await owner.save();
            
            return res.status(200).json({status: 'OK', title: title, mapCardId: newMapCard._id.toString()});
        }
        catch(e){
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async getMapById(req, res) {
        try {
            var { id } = req.body;

            var currentMapCard = await MapCard.findOne({ _id: new mongoose.Types.ObjectId(id) });
            var currentMapData = await MapData.findOne({ _id: currentMapCard.mapData });

            return res.status(200).json({status: 'OK', title: currentMapCard.title, type: currentMapData.type, feature: JSON.stringify(currentMapData.feature) });
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async deleteMapById(req, res) {
        try {
            var { id } = req.body;

            var id = new mongoose.Types.ObjectId(id);
            var mapCard = await MapCard.findOneAndDelete({ _id: id });
            var user = await User.findOneAndUpdate({ _id: mapCard.owner }, { $pull: {ownedMapCards: new mongoose.Types.ObjectId(mapCard._id)} });
            await user.save();
            await MapData.findOneAndDelete({ _id: mapCard.mapData });

            if (mapCard.published) {
                await CommunityPreview.findOneAndDelete({ mapCard: id })
            }

            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }
    
    static async duplicateMapById(req, res) {
        try {
            var { id, newName } = req.body;

            var currentMapCard = await MapCard.findOne({ _id: new mongoose.Types.ObjectId(id) });
            var currentMapData = await MapData.findOne({ _id: new mongoose.Types.ObjectId(currentMapCard.mapData) });
            let mapCardObjId = new mongoose.Types.ObjectId();
            let mapDataObjId = new mongoose.Types.ObjectId();

            let mapDataObj = currentMapData.toObject();
            delete mapDataObj._id;
            mapDataObj._id = mapDataObjId
            var mapDataClone = new MapData(mapDataObj);
            await mapDataClone.save();

            let mapCardObj = currentMapCard.toObject();
            delete mapCardObj._id;
            mapCardObj._id = mapCardObjId;
            mapCardObj.title = newName;
            mapCardObj.mapData = mapDataObjId;
            mapCardObj.published = false;
            var mapCardClone = new MapCard(mapCardObj);
            await mapCardClone.save();

            var user = await User.findOneAndUpdate({ _id: currentMapCard.owner }, { $push: { ownedMapCards: mapCardObjId } })
            await user.save();

            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async changeMapNameById(req, res) {
        try {
            var { id, newName } = req.body;

            var currentMapCard = await MapCard.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, { title: newName });
            await currentMapCard.save();

            return res.status(200).json({status: 'OK', name: newName});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async publishMapById(req, res) {
        try {
            var { id } = req.body;
            var currentMapCard = await MapCard.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, { published: true });
            var newCommunityPreview = new CommunityPreview({
                title: currentMapCard.title,
                mapCard: currentMapCard._id,
                mapData: currentMapCard.mapData,
                comments: [], 
                likes: [], 
                dislikes: [], 
                reports: []
            });
            await newCommunityPreview.save();

            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async mapClassificationById(req, res) {
        try {
            var { id, classifications } = req.body;

            let listOfClass = classifications.split(", ");
            var currentMapCard = await MapCard.findOneAndUpdate({ map: new mongoose.Types.ObjectId(id) }, { classification: listOfClass });
            await currentMapCard.save();

            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async importMapFileById(req, res) {
        try {
            var { id, geoJSONFile } = req.body;

            var currentMapCard = await MapCard.findOne({ _id: new mongoose.Types.ObjectId(id) });
            var currentMapData = await MapData.findOneAndUpdate({ _id: currentMapCard.mapData }, { type: geoJSONFile.type, feature: geoJSONFile.features });
            await currentMapData.save();

            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async saveMapById(req, res) {
        try {
            var { id, map } = req.body;
            var currentMapCard = await MapCard.findOne({ _id: new mongoose.Types.ObjectId(id) });
            var currentMapData = await MapData.findOneAndUpdate({ _id: currentMapCard.mapData }, { type: map.type, feature: map.features });
            await currentMapData.save();

            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async getMapImageById(req, res) {
        try {
            var { id } = req.body;
            var currentMapCard = await MapCard.findOne({ _id: new mongoose.Types.ObjectId(id) });
            return res.status(200).json({status: 'OK', image: currentMapCard.mapImages});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }

    static async setMapImagebyId(req, res) {
        try {
            var { id, image } = req.body;
            var currentMapCard = await MapCard.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, { mapImages: image });
            await currentMapCard.save();
            return res.status(200).json({status: 'OK'});
        }
        catch(e){
            console.log(e.toString())
            return res.status(400).json({error: true, message: e.toString() });
        }
    }
}



module.exports = mapController;