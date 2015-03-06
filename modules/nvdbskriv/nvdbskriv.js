angular.module('nvdbskriv', ['base64'])




    .factory('nvdbskriv', ['$http', '$base64', function($http, $base64) {
        var api = 'http://localhost:9292/svvunvdbpoc09.vegvesen.no:9090/nvdb/apiskriv/api';
        
        
        return {
            getJobber: function() {
            
                var auth = $base64.encode('maghau:test');
                $http.defaults.headers.common['Authorization'] = 'Basic '+auth;
                
                var request = {
                    method: 'GET',
                    url: api+'/jobber',
                    headers: {
                        Accept: 'application/json'
                    }
                }
                
                return $http(request);
            },
            
            registrerJobb: function(data) {
            
                var auth = $base64.encode('maghau:test');
                $http.defaults.headers.common['Authorization'] = 'Basic '+auth;
                
                var request = {
                    method: 'POST',
                    url: api+'/jobber',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-nvdb-dryrun': true
                    },
                    data: data
                }
                
                return $http(request);
            }
        };
        
    }])
