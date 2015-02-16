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

    }])
