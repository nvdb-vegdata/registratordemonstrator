var app = angular.module('registratordemonstrator', [
    'nvdbles'
]);


app.run(['$rootScope', 'nvdbles', function($rootScope, nvdbles) {
    nvdbles.objekttyper().then(function(promise) {
        $rootScope.objekttyper = promise.data.vegObjektTyper;
    });
    
    $rootScope

}]);