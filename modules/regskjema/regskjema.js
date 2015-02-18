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

            var sokeobjekt = {
                lokasjon: {
                    srid: 'WGS84',
                    bbox: getBbox()
                },
                objektTyper: [{
                    id: $scope.aktivObjekttype,
                    antall: 100000
                }]
            }
            
            nvdbles.sok(sokeobjekt).then(function(promise) { 
                console.log('Data hentet. Tegner opp ...'); // Deaktiver loading-ikon

                var objekter = promise.data.resultater[0].vegObjekter;
                
                // Fra NVDB-objekt til geojson-objekt
                var geojson = [];
                for (var i = 0; i < objekter.length; i++) {
                    var geometri = Terraformer.WKT.parse(objekter[i].lokasjon.geometriWgs84);
                    var geojsonFeature = {
                        type: 'Feature',
                        properties: {
                            id: objekter[i].objektId
                        },
                        geometry: geometri
                    };
                    geojson.push(geojsonFeature);
                }
                
                var geojsonMarkerOptions = {
                    radius: 8,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                };
                
                // Opprett markercluster-lag i Leaflet
                var myLayer = L.geoJson(geojson, {
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions);
                    }
                });
                var markers = L.markerClusterGroup();
                markers.addLayer(myLayer);
                map.addLayer(markers);
                       
            });
            
        }

    }])
