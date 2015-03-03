angular.module('nvdbleaflet', [])

    .controller("nvdbleafletCtrl", ['$rootScope', 'nvdbapi', 'nvdbdata', function ($rootScope, nvdbapi, nvdbdata) {
    
        var _crs = new L.Proj.CRS('EPSG:25833',
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
        
        var _kartcache = 'http://m{s}.nvdbcache.geodataonline.no/arcgis/rest/services/Trafikkportalen/GeocacheTrafikkJPG/MapServer/tile/{z}/{y}/{x}';
            
        var layers = {};
        layers.bakgrunnskart = new L.tileLayer(_kartcache, {
            maxZoom: 16,
            minZoom: 3,	
            subdomains: '123456789',
            continuousWorld: true,
            attribution: 'Registratordemonstrator'
        });
        layers.vegobjekter = L.markerClusterGroup();  // For objekter hentet fra NVDB
        layers.vegnett = L.layerGroup();              // For stedfesting på vegnett
        layers.egengeometri = L.layerGroup();         // For egengeometri
        layers.lokasjon = L.layerGroup();             // For symbol som viser vegnettstilknytning

        var map = new L.map('map', {
            crs: _crs, 
            continuousWorld: true,
            worldCopyJump: false,
            layers: [
                layers.bakgrunnskart, 
                layers.vegobjekter, 
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
        
        // Legger til vegobjekter
        $rootScope.addVegobjekter = function (geojson) {
            $rootScope.resetLayer('vegobjekter');
            var layer = L.geoJson(geojson, {
                style: function (feature) {
                    return {
                        color: "#d53e4f",
                        fillColor: "#d53e4f",
                        opacity: 1,
                        weight: 3
                    };
                },
                onEachFeature: function (feature, layer) {
                    layer.on('click', function (e) {
                        
                        // e.target.enableEdit();

                        $rootScope.resetObjekt();
                        
                        var nvdbid = e.target.feature.properties.id;

                        nvdbapi.objekt(nvdbid).then(function(promise) {

                            var egenskaper = promise.data.egenskaper;
                            
                            for (var i = 0; i < egenskaper.length; i++) {
                                $rootScope.egenskaper[egenskaper[i].id] = egenskaper[i].verdi;
                            }
                            
                            $rootScope.lokasjon = nvdbdata.vegreferanse(promise.data.lokasjon.vegReferanser[0]);
                            
                            if (promise.data.lokasjon.egengeometri) {
                                $rootScope.egengeometri = promise.data.lokasjon.geometriWgs84;
                            }
                            
                        });
                        
                    });
                }
            });
            layers.vegobjekter.addLayer(layer);
        };
        
        // Legger til symbol som viser objektets stedfesting til vegnettet
        $rootScope.addLokasjon = function (lokasjon) {
            var layer = L.geoJson(lokasjon, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: "blue",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }
            });
            layers.lokasjon.addLayer(layer);
        };
        
        // Legger til vegnett som strekningsobjekter skal stedfestes på
        $rootScope.addVegnett = function (geojson) {
            var layer = L.geoJson(geojson, {
                style: function (feature) {
                    return {
                        color: "#000",
                        lineCap: "butt",
                        opacity: 1,
                        weight: 5
                    };
                },
                onEachFeature: function (feature, layer) {
                    layer.on('mouseover', function (e) {
                        e.target.setStyle({
                            opacity: 0.5
                        });
                    });
                    layer.on('mouseout', function (e) {
                        e.target.setStyle({
                            opacity: 1
                        });
                    });
                    layer.on('click', function (e) {

                        if (!control._startMarker) {

                            e.target.setStyle({
                                color: "#00f"
                            });

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

        
        var control = new L.Control.LineStringSelect({});
        map.addControl(control);
        
        // Ved stedfesting av to punkt på en veglenke
        control.on('selection', function() {

            var lat1 = control._startMarker._latlng.lat;
            var lon1 = control._startMarker._latlng.lng;
            var lat2 = control._endMarker._latlng.lat;
            var lon2 = control._endMarker._latlng.lng;

            var linje = control.e._latlngs;
            
            // Legger til lokasjonslinje
            var lokasjon = L.polyline(linje, {
                color: "blue",
                opacity: 1,
                weight: 3,
                dashArray: "5, 5"
            });
            layers.lokasjon.addLayer(lokasjon);          
                   
            control.disable();
            layers.vegnett.clearLayers();
            
            $rootScope.lokasjon = 'Henter vegreferanse ...';
            
            nvdbapi.vegreferanse(lon1, lat1).then(function(promise) {
                var vegreferanse1 = promise.data.visningsNavn;
                var meter1 = promise.data.meterVerdi;
                nvdbapi.vegreferanse(lon2, lat2).then(function(promise) {
                    var vegreferanse2 = promise.data.visningsNavn;
                    var meter2 = promise.data.meterVerdi;
                    if (meter1 < meter2) {
                        $rootScope.lokasjon = vegreferanse1+'–'+meter2;
                    } else {
                        $rootScope.lokasjon = vegreferanse2+'–'+meter1;
                    }
                });
            });
        });
        


        
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
        });
        
        map.on('editable:vertex:deleted', function (e) {
            $rootScope.oppdaterEgengeometri(e.layer);
        });
        
        $rootScope.oppdaterEgengeometri = function (layer) {
            var geometri = layer.toGeoJSON().geometry;
            var wkt = Terraformer.WKT.convert(geometri);
            
            $rootScope.$apply(function () {
                $rootScope.egengeometri = wkt;
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