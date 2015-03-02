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
        $rootScope.resetLayer('egengeometri');
        $rootScope.resetLayer('lokasjon');
        $rootScope.resetLayer('vegobjekter');
        $rootScope.egenskaper = {};
    
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
            
            $rootScope.addVegobjekter(geojson);

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
            
            $rootScope.addVegnett(geojson);

        });
    };
    
    $rootScope.fjernEgengeometri = function () {
        $rootScope.harEgengeometri = false;
        $rootScope.stedfesting.egengeometri = '';
        $rootScope.resetLayer('egengeometri');
        $rootScope.fjernVegnettstilknytning();
    };
    
    $rootScope.fjernVegnettstilknytning = function () {
        $rootScope.harVegnettstilknytning = false;
        $rootScope.stedfesting.vegnettstilknytning = '';
        $rootScope.resetLayer('lokasjon');
    };
    
    $rootScope.registrerObjekt = function () {
        var output = '';
        output += 'Egengeometri: \n'+$rootScope.stedfesting.egengeometri+'\n\n';
        output += 'Lokasjon: \n'+$rootScope.stedfesting.vegnettstilknytning+'\n\n';
        
        var egenskapstyper = $rootScope.objekttype[$rootScope.aktivObjekttype].egenskapsTyper;
        for (var i = 0; i < egenskapstyper.length; i++) {
            if ($rootScope.egenskaper[egenskapstyper[i].id]) {
                output += egenskapstyper[i].navn+': \n'+$rootScope.egenskaper[egenskapstyper[i].id]+'\n\n';
            }
            
        }
        alert(output);
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
            
            var lokasjon = Terraformer.WKT.parse(promise.data.punktPaVegReferanseLinjeWGS84);
            
            console.log(lokasjon);
            
            $rootScope.resetLayer('lokasjon');
            $rootScope.addLokasjon(lokasjon);

            
        });
    };
    
    // Lagrer verdier fra registreringsskjema
    $rootScope.egenskaper = {};
    
    // Beskrivelse av viktighetsparametere
    
    $rootScope.viktighet = {
        1: "Egenskapen må ha verdi for at objektet skal bli registrert",
        2: "Egenskapen må ha verdi for at objektet skal bli registrert",
        3: "Egenskapen må ha verdi under visse betingelser",
        4: "Egenskapen er valgfri",
        7: "Egenskapen er valgfri",
        9: "Egenskapen skal fjernes, og eventuelle verdier slettes",
        999: "Det er ikke tatt stilling til om egenskapen skal ha verdi"
    };
    
    
    
}]);