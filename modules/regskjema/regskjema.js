angular.module('regskjema', [])

    .controller("regskjemaCtrl", ['$scope', 'nvdbles', function ($scope, nvdbles) {
    
        $scope.aktivObjekttype = 0;
        $scope.objekttype = {};

        // Henter liste med objekttyper
        nvdbles.objekttyper().then(function(promise) {
            $scope.objekttyper = promise.data.vegObjektTyper;
        });
                
        // Henter detaljert info om aktiv objekttype 
        $scope.hentObjekttype = function () {
            nvdbles.objekttype($scope.aktivObjekttype).then(function(promise) {
                $scope.objekttype[$scope.aktivObjekttype] = promise.data;
                
            });
        };
        
        $scope.hentObjekter = function () {
        
            console.log('Henter data ...'); // Aktiver loading-ikon

            var srid = 'WGS84';
            
            var northEast = map.getBounds()._northEast;
            var southWest = map.getBounds()._southWest;

            var bbox = northEast.lng+','+northEast.lat+','+southWest.lng+','+southWest.lat;
            
            var objekttype = $scope.aktivObjekttype;
            
            var sokeobjekt = {
                lokasjon: {
                    srid: srid,
                    bbox: bbox
                },
                objektTyper: [{
                    id: objekttype,
                    antall: 10000
                }]
            }
            
            
            nvdbles.sok(sokeobjekt).then(function(promise) { 
                console.log('Data hentet. Tegner opp ...'); // Deaktiver loading-ikon

                var objekter = promise.data.resultater[0].vegObjekter;
                
                var markers = L.markerClusterGroup();
                //var myLayer = L.geoJson().addTo(map);
                var myLayer = L.geoJson();

                
                for (var i = 0; i < objekter.length ;i++) {
                

                    var geometri = objekter[i].lokasjon.geometriWgs84;
                    geometri = geometri.replace('POINT (', '');
                    geometri = geometri.substring(0, geometri.length-1);
                    var koordinater = geometri.split(' ');
                    
                    var geojsonFeature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: koordinater
                        }
                    };
                    
                    myLayer.addData(geojsonFeature);
                }
                
                markers.addLayer(myLayer);
                map.addLayer(markers);
                       
            });
            
        }

    }])
