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
            
        var bakgrunnskart = new L.tileLayer('http://m{s}.nvdbcache.geodataonline.no/arcgis/rest/services/Trafikkportalen/GeocacheTrafikkJPG/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16,
            minZoom: 3,	
            subdomains: '123456789',
            continuousWorld: true,
            attribution: 'Registratordemonstrator'
        });
        
        var nvdblayer = L.markerClusterGroup(); // For objekter hentet fra NVDB
        var vegnettlayer = L.layerGroup(); // For stedfesting på vegnett
        var egengeometrilayer = L.layerGroup(); // For egengeometri

        $rootScope.map = new L.map('map', {
            crs: crs, 
            continuousWorld: true,
            worldCopyJump: false,
            layers: [
                bakgrunnskart, 
                nvdblayer, 
                vegnettlayer, 
                egengeometrilayer
            ],
            center: [63.43,10.40],
            zoom: 13,
            editable: true,
            editOptions: {
                featuresLayer: egengeometrilayer
            }
        });
        
        $rootScope.fjernEgengeometriLayer = function () {
            egengeometrilayer.clearLayers();
        };


        $rootScope.getBbox = function () {

            var northEast = $rootScope.map.getBounds()._northEast;
            var southWest = $rootScope.map.getBounds()._southWest;

            var bbox = northEast.lng+','+northEast.lat+','+southWest.lng+','+southWest.lat;
            
            return bbox;
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
            
            nvdblayer.addLayer(layer);

        };
        
        var control = new L.Control.LineStringSelect({});
        $rootScope.map.addControl(control);
        
        control.on('selection', function() {
            
            console.log('test');
            console.log(control);
            console.log(control._startMarker._latlng.lat+' '+control._startMarker._latlng.lng);
            //control.disable();
            
            

        });
        
        $rootScope.tegnVegnett = function (geojson) {
            var layer = L.geoJson(geojson, {
                style: function (feature) {
                    return {
                        color: "#f00",
                        opacity: 0.5,
                        weight: 10
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
                            color: "#f00"
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
            vegnettlayer.addLayer(layer);

        };


        
        $rootScope.map.on('editable:drawing:commit', function (e) {
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
        
        
        $rootScope.map.on('editable:vertex:dragend', function (e) {
            $rootScope.oppdaterEgengeometri(e.layer);
            console.log('vertex-dragend');
        });
        
        $rootScope.map.on('editable:vertex:deleted', function (e) {
            $rootScope.oppdaterEgengeometri(e.layer);
            console.log('vertex-deleted');
        });
        
        $rootScope.oppdaterEgengeometri = function (layer) {
            var geometri = layer.toGeoJSON().geometry;
            var wkt = Terraformer.WKT.convert(geometri);
            
            //$rootScope.$apply(function () {
                $rootScope.stedfesting.egengeometri = wkt;
                $rootScope.harEgengeometri = true;
            //});
        };
        
        
        $rootScope.startMarker = function () {
            $rootScope.map.editTools.startMarker();
            
        };
        $rootScope.startPolyline = function () {
            $rootScope.map.editTools.startPolyline();
        };
        $rootScope.startPolygon = function () {
            $rootScope.map.editTools.startPolygon();
        };
        
        

        
        
    }])