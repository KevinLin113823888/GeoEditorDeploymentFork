import Button from '@mui/material/Button';
import MapEditor from './MapEditor';
import * as shapefile from "shapefile";
import na from './na.json'
import React, {useContext, useEffect, useState} from 'react';
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MapPropertySidebar from "./MapPropertySidebar";
import {CurrentModal, GlobalStoreContext, GlobalStoreContextProvider} from "../../store";
import ExportModal from "./MapViewerModal/ExportModal";
import MapClassificationModal from "./MapViewerModal/MapClassificationModal";
import MapColorwheelModal from "./MapViewerModal/MapColorwheelModal";
import MapMergeChangeRegionNameModal from "./MapViewerModal/MapMergeChangeRegionNameModal";
import MapAddRegionModal from "./MapViewerModal/MapAddRegionModal";
import {FormControl, InputAdornment} from "@mui/material";
import {Input} from "@mui/icons-material";
import ImportModal from "./MapViewerModal/ImportModal";
import MapLegendFooter from "./MapLegendFooter";
import {useParams} from 'react-router-dom';
import Box from "@mui/material/Box";

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as topoServer from 'topojson-server';
import * as topoClient from 'topojson-client';
import * as topoSimplify from 'topojson-simplify';


function MapViewerScreen(){

    const [fileExist, setFileExist] = useState(false);
    const [state, setState] = useState(true);
    const [data, setData] = useState([]);
    const [mapName,setMapChange] = useState("Untitled");
    const [keyid, setKeyid] = useState(0)
    // const [compressCount, setCompressCount] = useState(0.005);

    const { store } = useContext(GlobalStoreContext);
    const [GeoJson, setGeoJson] = [store.currentMapData,store.setCurrentMapData]
    const { id } = useParams();

    const names = [];
    let count = 0;
    let shpfile = null;
    let dbffile = null;

    useEffect(() => {
        setGeoJson(na)
    },[])


    useEffect(() => {
        console.log("ID of map", id);
        fetch(process.env.REACT_APP_API_URL + 'map/getMapById', {
            method: "post",
            credentials: 'include',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: id
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("new name", data);
            setMapChange(data.title);
        })
        .catch(err => console.log(err));
    },[])

    const sendImportReq = (geoJson) => {
        console.log("GEOJSON FILE UPLOADED", geoJson);
        fetch(process.env.REACT_APP_API_URL + 'map/importMapFileById', {
            method: "POST",
            credentials: 'include',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: id,
              geoJSONFile: geoJson
            }),
        })
        .then((res) => {
            res.json();
            if (res.status === 200) {
            console.log("LOGGED IN, going to your maps");
            }
        })
        .catch(err => console.log(err));
    }

    const handleSubmit = () => {
        setGeoJson({});
        console.log("shapefile.open")
        // console.log(shpfile)
        // console.log(dbffile)

        let geoJson = {
            type:"FeatureCollection",
            features: []
        }
        shapefile
            .open(
                shpfile,
                dbffile
            ).then(function (e){
            e.read().then(
                function next(result){
                    if(result.value) {
                        // console.log(result.value);
                        geoJson.features.push(result.value)
                    }
                    if(!result.done){
                        e.read().then(next)
                    }
                    else{

                        var temp = geoJson;

                        var topo = topoServer.topology({foo: temp});
                        topo = topoSimplify.presimplify(topo);
                        
                        topo = topoSimplify.simplify(topo, 0.005);
                        
                        temp = topoClient.feature(topo, topo.objects.foo);

                        setGeoJson(temp)
                        sendImportReq(temp);
                        setFileExist(true);
                        setKeyid(keyid => keyid+1)
                    }
                })
        })
    }

    const changeRegionName = (oldName, newName) =>{
        // console.log("newold", oldName, newName);
        let temp = GeoJson;
        temp.features.forEach((i) => {
            if (i.properties.name === oldName) {
                i.properties.name = newName;
                setGeoJson(temp);
            }
        })
        // console.log("features", GeoJson.features);
        setState(!state);
    }

    const upload = () => {
        // console.log("upload the stuff")
        // console.log(na)
        setGeoJson(na);
        setFileExist(true);
    }

    const Buttons = (Function,Text) => {
        const wrappedButton =

            <Grid item xs >
                <Button
                    style={{
                        width: "100%",
                        backgroundColor: "#3c7dc3",

                    }}
                    variant="contained"
                    onClick={Function}
                >
                    {Text}
                </Button>
            </Grid>

        return wrappedButton
    }

    const handleShpDbfFile = (e,type) => {
        {
            console.log("reading: "+ type);
            const reader = new FileReader();
            reader.readAsArrayBuffer(e.target.files[0]);
            reader.onload = async e => {
                if(type==="dbf")
                    dbffile = reader.result
                if(type==="shp")
                    shpfile = reader.result
                if(dbffile && shpfile){
                    console.log("done")
                    store.changeModal("NONE");
                    // setCompressCount(6);
                    handleSubmit()
                }
            }
        }
    }

    const handleGeoJson = (e) => {
        const reader = new FileReader();
        setGeoJson({});
        reader.readAsText(e.target.files[0]);
        reader.onload = e => {
            var temp = JSON.parse(e.target.result);

            var topo = topoServer.topology({foo: temp});
            topo = topoSimplify.presimplify(topo);
            
            topo = topoSimplify.simplify(topo, 0.005);
            console.log(topo)
            
            temp = topoClient.feature(topo, topo.objects.foo);

            setGeoJson(temp);
            sendImportReq(temp);
        }
        setFileExist(true);
        // store.changeModal("NONE");
        // setCompressCount(6);
    }

    function handleCompress(){
        // if(compressCount ==0){
        //     return;
        // }
        // setCompressCount(compressCount-1);
        const tempGeoJson = GeoJson;
        // const map = new Map();
        // let removePattern = "Even"
        // let featureInd2 =-1
        // let ind0 = -1
        // let ind1 = -1
        // let ind2 = -1
        // let featuresCopy=tempGeoJson.features

        // featuresCopy.forEach(feature => {
        //     let prevMatchIndex = -1
        //     let prevMatch = ""
        //     let prevFeatureInd=-1
        //     const map2 = new Map();
        //     featureInd2++
        //     if (feature.geometry.type === 'Polygon') {
        //         ind0 = -1
        //         ind1 = -1
        //         ind2 = -1
        //         feature.geometry.coordinates.forEach(coordinates => {
        //             ind0++;
        //             ind1 = -1;

        //             coordinates.forEach((coordinate, subInd) => {
        //                 ind1++;
        //                 if (!map.has(coordinate.toString())) {
        //                     map.set(coordinate.toString(), {position:"middle",featureInd:featureInd2});
        //                     if(prevMatchIndex==subInd-1){


        //                         if(map.has(prevMatch)){
        //                             let foundfeatureInd=map.get(prevMatch).featureInd;
        //                             map.set(prevMatch, {position:"last",featureInd:foundfeatureInd});


        //                         }
        //                     }
        //                 }else{
        //                     let foundfeatureInd=map.get(coordinate.toString()).featureInd;

        //                     if(!map2.has(foundfeatureInd.toString())){
        //                         map.set(coordinate.toString(), {position:"first",featureInd:foundfeatureInd});
        //                         map2.set(foundfeatureInd.toString(),1);

        //                     }
        //                     if(prevFeatureInd !==foundfeatureInd){
        //                         map.set(prevMatch, {position:"last",featureInd:foundfeatureInd});

        //                     }

        //                     prevMatch= coordinate.toString()
        //                     prevMatchIndex = subInd
        //                     prevFeatureInd = foundfeatureInd
        //                 }
        //             });

        //         });
        //     } else if (feature.geometry.type === 'MultiPolygon') {
        //         ind0 = -1
        //         ind1 = -1
        //         ind2 = -1
        //         feature.geometry.coordinates.forEach(polygon => {
        //             ind0++;
        //             ind1 = -1;
        //             ind2 = -1;
        //             polygon.forEach(coordinates => {
        //                 ind1++;
        //                 ind2 = -1;

        //                 coordinates.forEach((coordinate, subInd) => {
        //                     ind2++;
        //                     if (!map.has(coordinate.toString())) {
        //                         map.set(coordinate.toString(), {position:"middle",featureInd:featureInd2});
        //                         if(prevMatchIndex==subInd-1){


        //                             if(map.has(prevMatch)){
        //                                 let foundfeatureInd=map.get(prevMatch).featureInd;
        //                                 map.set(prevMatch, {position:"last",featureInd:foundfeatureInd});
        //                             }
        //                         }
        //                     }else{
        //                         let foundfeatureInd=map.get(coordinate.toString()).featureInd;

        //                         if(!map2.has(foundfeatureInd.toString())){
        //                             map.set(coordinate.toString(), {position:"first",featureInd:foundfeatureInd});
        //                             map2.set(foundfeatureInd.toString(),1);
        //                         }
        //                         if(prevFeatureInd !==foundfeatureInd){
        //                             map.set(prevMatch, {position:"last",featureInd:foundfeatureInd});

        //                         }

        //                         prevFeatureInd = foundfeatureInd
        //                         prevMatch= coordinate.toString()
        //                         prevMatchIndex = subInd
        //                     }
        //                 });
        //             });
        //         });
        //     }

        // });
        // featureInd2 = -1
        // const map3 = new Map();
        // featuresCopy.forEach(feature => {
        //     featureInd2++
        //     if (feature.geometry.type === 'Polygon') {
        //         ind0 = -1
        //         ind1 = -1
        //         ind2 = -1
        //         feature.geometry.coordinates.forEach(coordinates => {
        //             ind0++;
        //             ind1 = -1;

        //             coordinates.forEach((coordinate, subInd) => {
        //                 ind1++;

        //                 if (map3.has(coordinate.toString())) {

        //                     if (subInd % 2 === 0) {
        //                         removePattern = "Even"
        //                     } else {
        //                         removePattern = "Odd"

        //                     }
        //                 }

        //                 if (removePattern === "Even" && subInd % 2 === 0) {
        //                     if(map.get(coordinate.toString()).position !=="first" && map.get(coordinate.toString()).position !=="last")
        //                         tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1]=[]
        //                     map3.set(coordinate.toString(), true);
        //                 } else if (removePattern === "Odd" && subInd % 2 !== 0) {
        //                     if(map.get(coordinate.toString()).position !=="first" && map.get(coordinate.toString()).position !=="last")
        //                         tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1]=[]
        //                     map3.set(coordinate.toString(), true);
        //                 }
        //             });

        //         });
        //     } else if (feature.geometry.type === 'MultiPolygon') {
        //         ind0 = -1
        //         ind1 = -1
        //         ind2 = -1
        //         feature.geometry.coordinates.forEach(polygon => {
        //             ind0++;
        //             ind1 = -1;
        //             ind2 = -1;
        //             polygon.forEach(coordinates => {
        //                 ind1++;
        //                 ind2 = -1;

        //                 coordinates.forEach((coordinate, subInd) => {
        //                     ind2++;
        //                     if (map3.has(coordinate.toString())) {
        //                         if (subInd % 2 === 0) {
        //                             removePattern = "Even"
        //                         } else {
        //                             removePattern = "Odd"
        //                         }
        //                     }
        //                     if (removePattern === "Even" && subInd % 2 === 0) {
        //                         map3.set(coordinate.toString(), true);
        //                         if(map.get(coordinate.toString()).position !=="first" && map.get(coordinate.toString()).position !=="last"){
        //                             if(tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1].length>5)
        //                                 tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1][ind2]=[]
        //                         }
        //                     } else if (removePattern === "Odd" && subInd % 2 !== 0) {
        //                         map3.set(coordinate.toString(), true);
        //                         if(map.get(coordinate.toString()).position !=="first" && map.get(coordinate.toString()).position !=="last"){
        //                             if(tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1].length>5)
        //                                 tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1][ind2]=[]
        //                         }
        //                     }
        //                 });

        //             });
        //         });
        //     }

        // });

        // featureInd2 =-1
        // ind0 = -1
        // ind1 = -1
        // ind2 = -1
        // featuresCopy.forEach(feature => {
        //     featureInd2++
        //     if (feature.geometry.type === 'Polygon') {
        //         ind0 = -1
        //         ind1 = -1
        //         ind2 = -1
        //         feature.geometry.coordinates.forEach(coordinates => {
        //             ind0++;
        //             ind1 = -1;

        //             tempGeoJson.features[featureInd2].geometry.coordinates[ind0]=coordinates.filter(a=>a.length!==0)

        //             //tempGeoJson.features[featureInd2].geometry.coordinates=tempGeoJson.features[featureInd2].geometry.coordinates.filter(a=>a.length!==1)


        //         });
        //     } else if (feature.geometry.type === 'MultiPolygon') {
        //         ind0 = -1
        //         ind1 = -1
        //         ind2 = -1
        //         feature.geometry.coordinates.forEach(polygon => {
        //             ind0++;
        //             ind1 = -1;
        //             ind2 = -1;
        //             polygon.forEach(coordinates => {
        //                 ind1++;
        //                 ind2 = -1;

        //                 tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1]=coordinates.filter(a=>a.length!==0)
        //                 console.log(tempGeoJson.features[featureInd2].geometry.coordinates[ind0][ind1].length)
        //                 console.log(tempGeoJson.features[featureInd2].geometry.coordinates)
        //                 //console.log(tempGeoJson.features[featureInd2].geometry.coordinates[ind0]=tempGeoJson.features[featureInd2].geometry.coordinates[ind0].filter(a=>a.length<1))
        //                 //console.log(tempGeoJson.features[featureInd2].geometry.coordinates=tempGeoJson.features[featureInd2].geometry.coordinates .filter(a=>a.length<1))
        //                 //tempGeoJson.features[featureInd2].geometry.coordinates[ind0]=polygon.filter(a=>a.length!==1)

        //             });
        //         });
        //     }

        // });



        var temp = tempGeoJson;

        var topo = topoServer.topology({foo: temp});
        topo = topoSimplify.presimplify(topo);
        
        topo = topoSimplify.simplify(topo, 0.05);
        console.log(topo)
        
        temp = topoClient.feature(topo, topo.objects.foo);

        setGeoJson(temp);
        setKeyid(keyid => keyid+1)
    }

    const handleImport = () => {store.changeModal(CurrentModal.MAP_IMPORT)}
    const handleExport = () => {store.changeModal(CurrentModal.MAP_EXPORT)}

    const handleSave = () =>   {}

    const handlePublish = () => {
        fetch(process.env.REACT_APP_API_URL + 'map/publishMapById', {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log(data)
        })
        .catch(err => console.log(err));

    }

    const handleMapClassification = () => {store.changeModal(CurrentModal.MAP_CLASSIFICATION)}

    function handleUpdate(){

            setKeyid(keyid => keyid+1)
    }

    function handleChangeMapName(e){
        fetch(process.env.REACT_APP_API_URL + 'map/changeMapNameById', {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                newName: e.target.value
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("data of new name", data);
            setMapChange(data.name);
        })
        .catch(err => console.log(err));
    }

    function handleExportGeoJson(event) {
        store.changeModal("NONE");
        var json = JSON.stringify(GeoJson);

        var a = document.createElement("a")
        a.href = URL.createObjectURL(
            new Blob([json], {type:"application/json"})
        )
        a.download = "geoJson.geo.json"
        a.click()
    }

    async function handleExportShpDbf(event) {
        store.changeModal("NONE");  
    }

    const handleKeyPress = (e) => {
        console.log(e)
        if(e.key === 'z' && e.ctrlKey)
            store.jstps.undoTransaction()
        else if (e.key === 'y' && e.ctrlKey)
            store.jstps.doTransaction()
    }
    return (
        <div className="App" onKeyPress={handleKeyPress}>

            <ImportModal
                handleGeoJson={handleGeoJson}
                handleShpDbfFile={handleShpDbfFile}
                handleSubmit={handleSubmit}
            />
            <ExportModal
                handleExportGeoJson={handleExportGeoJson}
                handleExportShpDbf={handleExportShpDbf}
            />
            <MapClassificationModal id={id}/>
            <MapColorwheelModal/>
            <MapMergeChangeRegionNameModal/>
            <MapAddRegionModal/>


            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Box
                        sx={{
                            paddingLeft: "2%",
                            paddingTop: "1%",
                            maxWidth: '100%'}}>

            <InputGroup className="mb-3">
                <input type="text" className="form-control" 
                id="validationCustom01" value={mapName}
                       required />

            </InputGroup>

                        {/* <TextField
                            sx={{
                                fontSize: 100
                            }}
                            defaultValue={mapName}
                            hiddenLabel
                            variant="standard"


                            InputProps={{
                                style: {fontSize: 40,
                                    font: "Satisfy",
                                    fontWeight: "bold",
                                    fontFamily: "Satisfy"
                                },
                                disableUnderline: true
                            }}
                            // onChange={
                            //     (event)=>{
                            //         console.log("searching...", event.target.value);
                            //         setMapChange(event.target.value)}}
                            onBlur={(event) => handleChangeMapName(event)}
                            fullWidth  /> */}
                    </Box>
                </Grid>
                <Box item xs={6} sx={{
                    paddingTop: "2%"
                }}>
                    <Grid container spacing={2} >
                        {Buttons(handleCompress, "Compress")}
                        {Buttons(handleImport, "Import")}
                        {Buttons(handleExport, "Export")}
                        {Buttons(handlePublish, "Publish")}
                        {Buttons(handleMapClassification, "Classification")}
                        {Buttons(handleSave, "Save")}
                        {Buttons(() => {
                            setGeoJson(na)
                        }, "Demo")}

                    </Grid>
                </Box>
                <Grid container spacing={2} item xs={9.5}>
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                paddingLeft: "1.5%"
                            }}>
                            <MapEditor  changeName={changeRegionName} key={keyid} handleCompress={handleCompress} updateViewer={handleUpdate} />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <MapLegendFooter />
                    </Grid>
                </Grid>
                <Grid item xs={2.5}>
                    <MapPropertySidebar />
                </Grid>
                <Grid item xs={8}>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
            </Grid>
        </div>
    );
}

export default MapViewerScreen;