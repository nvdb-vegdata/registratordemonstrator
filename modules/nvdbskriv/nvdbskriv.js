angular.module('nvdbskriv', ['base64'])




    .factory('nvdbskriv', ['$http', '$base64', function($http, $base64) {
        var api = 'http://localhost:9292/svvunvdbpoc09.vegvesen.no:9090/nvdb/apiskriv/api';
        
        
        function auth () {
            var auth = $base64.encode('maghau:test');
            $http.defaults.headers.common['Authorization'] = 'Basic '+auth;
        }
        
        
        
        
        
        return {
            getJobber: function() {
            
                var auth = $base64.encode('maghau:test');

                var request = {
                    method: 'GET',
                    url: api+'/jobber',
                    headers: {
                        Accept: 'application/json',
                        Authorization: 'Basic '+auth
                    }
                }
                
                return $http(request);
            },
            
            registrerJobb: function(data) {
            
                var auth = $base64.encode('maghau:test');
            

                var request = {
                    method: 'POST',
                    url: api+'/jobber',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-nvdb-dryrun': true,
                        Authorization: 'Basic '+auth
                    },
                    data: data
                }
                
                return $http(request);
            },
            
            startJobb: function(jobbid) {
            
                var auth = $base64.encode('maghau:test');

                var request = {
                    method: 'POST',
                    url: api+'/jobber/'+jobbid+'/start',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-nvdb-dryrun': true,
                        Authorization: 'Basic '+auth
                    }
                }
                
                return $http(request);
            },
            
            statusJobb: function(jobbid) {
            
                var auth = $base64.encode('maghau:test');

                var request = {
                    method: 'GET',
                    url: api+'/jobber/'+jobbid+'/status',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-nvdb-dryrun': true,
                        Authorization: 'Basic '+auth
                    }
                }
                
                return $http(request);
            }
            
            

        };
        
    }])
