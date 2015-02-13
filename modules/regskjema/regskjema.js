angular.module('regskjema', [])

    .controller("regskjemaCtrl", ['$scope', 'nvdbles', function ($scope, nvdbles) {

        nvdbles.objekttyper().then(function(promise) {
            $scope.objekttyper = promise.data.vegObjektTyper;
        });
        
        $scope.aktivObjekttype = '5';
        
        $scope.objekttype = {};

        nvdbles.objekttype($scope.aktivObjekttype).then(function(promise) {
            $scope.objekttype[$scope.aktivObjekttype] = promise.data;
        });
        
        $scope.byttObjekttype = function () {
            nvdbles.objekttype($scope.aktivObjekttype).then(function(promise) {
                $scope.objekttype[$scope.aktivObjekttype] = promise.data;
            });
        };
    
    }])
        