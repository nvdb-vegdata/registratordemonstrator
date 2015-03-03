angular.module('nvdbapi', [])

    .factory('nvdbapi', ['$http', function($http) {
        var api = 'https://www.vegvesen.no/nvdb/api';
        
        return {
            objekt: function(nvdbid) {
                return $http.get(api+'/vegobjekter/objekt/'+nvdbid+'.json');
            },
            objekttyper: function() {
                return $http.get(api+'/datakatalog/objekttyper.json');
            },
            objekttype: function(id) {
                return $http.get(api+'/datakatalog/objekttyper/'+id+'.json');
            },
            egenskapstype: function(id) {
                return $http.get(api+'/datakatalog/egenskapstype/'+id+'.json');
            },
            sok: function(sokeobjekt) {
                return $http.get(api+'/sok.json?kriterie='+angular.toJson(sokeobjekt)+'&select=objektId%2CobjektTypeId%2CvegObjektLokasjon%2FgeometriWgs84');
            },
            vegreferanse: function(lon, lat) {
                return $http.get(api+'/vegreferanse/koordinat.json?lon='+lon+'&lat='+lat);
            },
            vegreferanseobjekter: function(bbox) {
                var sokeobjekt = {
                    lokasjon: {
                        srid: 'WGS84',
                        bbox: bbox
                    },
                    objektTyper: [{
                        id: 532,
                        antall: 100000
                    }]
                }
            
                return $http.get(api+'/sok.json?kriterie='+angular.toJson(sokeobjekt)+'&geometri=WGS84&egenskaper=false');
            },
        };
        
    }])
