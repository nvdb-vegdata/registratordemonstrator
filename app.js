var app = angular.module('registratordemonstrator', [
    'nvdbles',
    'regskjema',
    'nvdbleaflet'
]);

app.run(['$rootScope', function($rootScope) {

    $rootScope.aktivObjekttype = 0;

}]);