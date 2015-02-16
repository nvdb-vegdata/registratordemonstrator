angular.module('nvdbles', [])

    .factory('nvdbles', ['$http', function($http) {
        var api = 'https://www.vegvesen.no/nvdb/api';
        
        return {
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
                return $http.get(api+'/sok.json?kriterie='+angular.toJson(sokeobjekt)+'&geometri=WGS84');
            }
            
        };
        
    }])
