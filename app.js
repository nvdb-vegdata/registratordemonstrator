var app = angular.module('registratordemonstrator', [
    'nvdbles',
    'regskjema'
]);

app.run(['$rootScope', function($rootScope) {

    $rootScope.aktivObjekttype = 0;

}]);