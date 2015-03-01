var app = angular.module('registratordemonstrator', [
    'nvdbapi',
    'nvdbdata',
    'nvdbleaflet',
    'regskjema'
]);

app.run(['$rootScope', 'nvdbapi', 'nvdbdata', function($rootScope, nvdbapi, nvdbdata) {

    $rootScope.aktivObjekttype = 0;
    $rootScope.objekttype = {};

    // Henter liste med objekttyper
    nvdbapi.objekttyper().then(function(promise) {
        $rootScope.objekttyper = promise.data.vegObjektTyper;
    });
    
    // Henter egenskapstyper for aktiv objekttype
    $rootScope.hentObjekttype = function () {
    
        // Fjerner gammel egengeometri. Puttes i egen reset-funksjon etter hvert
        $rootScope.harEgengeometri = false;
        $rootScope.harVegnettstilknytning = false;
        $rootScope.stedfesting.egengeometri = '';
        $rootScope.stedfesting.vegnettstilknytning = '';
        $rootScope.fjernEgengeometriLayer();
    
        // TODO: Legg til sjekk om informasjon allerede er hentet
        nvdbapi.objekttype($rootScope.aktivObjekttype).then(function(promise) {
            var data = nvdbdata.objekttype(promise.data);
            $rootScope.objekttype[$rootScope.aktivObjekttype] = data;
        });
    };
 
    
    $rootScope.hentObjekter = function () {
    
        console.log('Henter data ...'); // Aktiver loading-ikon

        var sokeobjekt = {
            lokasjon: {
                srid: 'WGS84',
                bbox: $rootScope.getBbox()
            },
            objektTyper: [{
                id: $rootScope.aktivObjekttype,
                antall: 100000
            }]
        }
        
        nvdbapi.sok(sokeobjekt).then(function(promise) { 
            console.log('Data hentet. Tegner opp ...'); // Deaktiver loading-ikon

            var objekter = promise.data.resultater[0].vegObjekter;
            var geojson = nvdbdata.geojson(objekter);
            
            $rootScope.lagGeojson(geojson);

        });
        
    };
    
    $rootScope.hentVegnett = function () {
        console.log('hest');
        
        var sokeobjekt = {
            lokasjon: {
                srid: 'WGS84',
                bbox: $rootScope.getBbox()
            },
            objektTyper: [{
                id: 532,
                antall: 100000
            }]
        }
        
        nvdbapi.sok(sokeobjekt).then(function(promise) { 
            var objekter = promise.data.resultater[0].vegObjekter;
            var geojson = nvdbdata.geojson(objekter);
            
            $rootScope.tegnVegnett(geojson);

        });
    };
    
    $rootScope.fjernEgengeometri = function () {
        $rootScope.harEgengeometri = false;
        $rootScope.stedfesting.egengeometri = '';
        $rootScope.fjernEgengeometriLayer();
    };
    
    $rootScope.fjernVegnettstilknytning = function () {
        $rootScope.harVegnettstilknytning = false;
        $rootScope.stedfesting.vegnettstilknytning = '';
    };
    
    $rootScope.harEgengeometri = false;
    $rootScope.harVegnettstilknytning = false;
    $rootScope.stedfester = false;
    $rootScope.stedfesting = {};
    $rootScope.stedfesting.egengeometri = '';
    $rootScope.stedfesting.vegnettstilknytning = '';
    
    $rootScope.finnVegreferanse = function (lon, lat) {
        $rootScope.stedfesting.vegnettstilknytning = 'Henter vegreferanse ...';
        nvdbapi.vegreferanse(lon, lat).then(function(promise) {
            $rootScope.stedfesting.vegnettstilknytning = promise.data.visningsNavn;
            $rootScope.harVegnettstilknytning = true;
        });
    };
    
    
}]);