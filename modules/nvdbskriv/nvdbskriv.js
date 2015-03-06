angular.module('nvdbskriv', [])

    .factory('nvdbskriv', ['$http', function($http) {
        var api = 'http://svvunvdbpoc09.vegvesen.no:9090/nvdb/apiskriv/api';
        
        return {
            getJobber: function() {
                
                var request = {
                    method: 'GET',
                    url: api+'/jobber'
                }
                
                return $http(request);
            }
        };
        
    }])
