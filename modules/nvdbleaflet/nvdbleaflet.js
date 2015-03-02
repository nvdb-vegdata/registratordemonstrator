angular.module('nvdbleaflet', [])

    .controller("nvdbleafletCtrl", ['$rootScope', 'nvdbapi', function ($rootScope, nvdbapi) {

        var crs = new L.Proj.CRS('EPSG:25833',
            '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs ',
            {
                origin: [-2500000.0, 9045984.0],
                resolutions: [
                    21674.7100160867, 
                    10837.35500804335, 
                    5418.677504021675, 
                    2709.3387520108377, 
                    1354.6693760054188, 
                    677.3346880027094, 
                    338.6673440013547, 
                    169.33367200067735, 
                    84.66683600033868, 
                    42.33341800016934, 
                    21.16670900008467, 
                    10.583354500042335, 
                    5.291677250021167, 
                    2.6458386250105836, 
                    1.3229193125052918, 
                    0.6614596562526459, 
                    0.33072982812632296
                ]
            }
        );
            
        var layers = {};
        layers.bakgrunnskart = new L.tileLayer('http://m{s}.nvdbcache.geodataonline.no/arcgis/rest/services/Trafikkportalen/GeocacheTrafikkJPG/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16,
            minZoom: 3,	
            subdomains: '123456789',
            continuousWorld: true,
            attribution: 'Registratordemonstrator'
        });
        layers.nvdbdata = L.markerClusterGroup(); // For objekter hentet fra NVDB
        layers.vegnett = L.layerGroup(); // For stedfesting på vegnett
        layers.egengeometri = L.layerGroup(); // For egengeometri
        layers.lokasjon = L.layerGroup(); // For symbol som viser vegnettstilknytning

        var map = new L.map('map', {
            crs: crs, 
            continuousWorld: true,
            worldCopyJump: false,
            layers: [
                layers.bakgrunnskart, 
                layers.nvdbdata, 
                layers.vegnett, 
                layers.egengeometri,
                layers.lokasjon
            ],
            center: [63.43,10.40],
            zoom: 13,
            editable: true,
            editOptions: {
                featuresLayer: layers.egengeometri
            }
        });
        
        // Fjerner alle layers fra en gitt layergroup
        $rootScope.resetLayer = function (layer) {
            layers[layer].clearLayers();
        };
        
        // Leverer boundingbox som en streng, for bruk i kall mot API
        $rootScope.getBbox = function () {
            return map.getBounds().toBBoxString();
        };
        
                
        $rootScope.lagGeojson = function (geojson) {
            var layer = L.geoJson(geojson, {
                style: function (feature) {
                    return {
                        color: "#d53e4f",
                        fillColor: "#d53e4f",
                        opacity: 1,
                        weight: 3
                    };

                }
            });
            
            layers.nvdbdata.addLayer(layer);

        };
        
        $rootScope.lagLokasjon = function (lokasjon) {
        
            var geojsonMarkerOptions = {
                radius: 5,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
        
            var layer = L.geoJson(lokasjon, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            });
            layers.lokasjon.addLayer(layer);

        };
        
        var control = new L.Control.LineStringSelect({});
        map.addControl(control);
        
        control.on('selection', function() {
            
            console.log(control);
            console.log(control._startMarker._latlng.lat+' '+control._startMarker._latlng.lng);

            
            var lat1 = control._startMarker._latlng.lat;
            var lon1 = control._startMarker._latlng.lng;
            var lat2 = control._endMarker._latlng.lat;
            var lon2 = control._endMarker._latlng.lng;
            
            var lokasjon = L.polyline([control._startMarker._latlng, control._endMarker._latlng]);
            
            $rootScope.harVegnettstilknytning = true;
            layers.lokasjon.addLayer(lokasjon);
                   
            
            control.disable();
            $rootScope.stedfester = false;
            layers.vegnett.clearLayers();
            
            $rootScope.stedfesting.vegnettstilknytning = 'Henter vegreferanse ...';
            
            nvdbapi.vegreferanse(lon1, lat1).then(function(promise) {
            
                var vegreferanse1 = promise.data.visningsNavn;
                var meter1 = promise.data.meterVerdi;
                
                console.log(vegreferanse1);
                
                nvdbapi.vegreferanse(lon2, lat2).then(function(promise) {
                
                    var vegreferanse2 = promise.data.visningsNavn;
                    var meter2 = promise.data.meterVerdi;
                    
                    console.log(vegreferanse2);
                    
                    if (meter1 < meter2) {
                        $rootScope.stedfesting.vegnettstilknytning = vegreferanse1+'-'+meter2;
                    } else {
                        $rootScope.stedfesting.vegnettstilknytning = vegreferanse2+'-'+meter1;
                    }
                    
                    console.log($rootScope.stedfesting.vegnettstilknytning);
                    

                    
                });

                
            });
            

        });
        
        $rootScope.tegnVegnett = function (geojson) {
            var layer = L.geoJson(geojson, {
                style: function (feature) {
                    return {
                        color: "#f0f",
                        opacity: 0.4,
                        weight: 15
                    };
                },
                onEachFeature: function (feature, layer) {
                    //console.log(layer);
                    //console.log(feature);
                    layer.on('mouseover', function (e) {
                        e.target.setStyle({
                            color: "#0f0"
                        });
                    });
                    layer.on('mouseout', function (e) {
                        e.target.setStyle({
                            color: "#f0f"
                        });
                    });
                    layer.on('click', function (e) {
                        if ($rootScope.stedfester) {
                            console.log('Stedfester allerede');
                        } else {
                            console.log('Starter stedfesting');
                            $rootScope.stedfester = true;
                            control.enable({
                                feature: e.target.feature,
                                layer: e.target
                            });
                        }
                    });
                }
            });
            layers.vegnett.addLayer(layer);

        };


        
        map.on('editable:drawing:commit', function (e) {
            console.log(e);
            
            $rootScope.oppdaterEgengeometri(e.layer);
                        

            
            if (e.layer.toGeoJSON().geometry.type == 'Point') {
                var lon = e.layer._latlng.lng;
                var lat = e.layer._latlng.lat;
                $rootScope.finnVegreferanse(lon, lat);
                
                // Dette skjer når punktet endres
                e.layer.on('dragend', function (e) {
                    console.log('Endret');
                    console.log(e);
                    
                    $rootScope.oppdaterEgengeometri(e.target);
                                        
                    var lon = e.target._latlng.lng;
                    var lat = e.target._latlng.lat;
                    $rootScope.finnVegreferanse(lon, lat);
                });
            }
        });
        
        
        map.on('editable:vertex:dragend', function (e) {
            $rootScope.oppdaterEgengeometri(e.layer);
            console.log('vertex-dragend');
        });
        
        map.on('editable:vertex:deleted', function (e) {
            $rootScope.oppdaterEgengeometri(e.layer);
            console.log('vertex-deleted');
        });
        
        $rootScope.oppdaterEgengeometri = function (layer) {
            var geometri = layer.toGeoJSON().geometry;
            var wkt = Terraformer.WKT.convert(geometri);
            
            $rootScope.$apply(function () {
                $rootScope.stedfesting.egengeometri = wkt;
                $rootScope.harEgengeometri = true;
            });
        };
        
        
        $rootScope.startMarker = function () {
            map.editTools.startMarker();
            
        };
        $rootScope.startPolyline = function () {
            map.editTools.startPolyline();
        };
        $rootScope.startPolygon = function () {
            map.editTools.startPolygon();
        };
        
        

        
        
    }])