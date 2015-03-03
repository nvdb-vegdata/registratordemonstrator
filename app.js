var app = angular.module('registratordemonstrator', [
    'nvdbapi',
    'nvdbdata',
    'nvdbleaflet'
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
    
        // Nullstiller modellen
        $rootScope.resetObjekt();
        $rootScope.resetLayer('vegobjekter');
        $rootScope.egenskaper = {};
        
 
        if (!$rootScope.objekttype.hasOwnProperty($rootScope.aktivObjekttype)) {
            nvdbapi.objekttype($rootScope.aktivObjekttype).then(function(promise) {
                var data = nvdbdata.objekttype(promise.data);
                $rootScope.objekttype[$rootScope.aktivObjekttype] = data;
            });
        }
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

        nvdbapi.vegreferanseobjekter($rootScope.getBbox()).then(function(promise) { 
        
            var objekter = promise.data.resultater[0].vegObjekter;
            
            
            var vegrefdeler = {};
            for (var i = 0; i < objekter.length; i++) {
                if (objekter[i].lokasjon.hasOwnProperty('veglenker') && objekter[i].lokasjon.hasOwnProperty('vegReferanser')) {

                    var veglenke = objekter[i].lokasjon.veglenker[0];
                    var vegreferanse = objekter[i].lokasjon.vegReferanser[0];
                    var geometri = Terraformer.WKT.parse(objekter[i].lokasjon.geometriWgs84);
                    
                    var key = veglenke.id+'-'+vegreferanse.kategori+'-'+vegreferanse.status+'-'+vegreferanse.nummer+'-'+vegreferanse.hp;

                    var objekt = {
                        veglenke: veglenke,
                        vegreferanse: vegreferanse,
                        geometri: geometri
                    }
                    
                    if (!vegrefdeler.hasOwnProperty(key)) {
                        vegrefdeler[key] = [];
                    }
                    vegrefdeler[key].push(objekt);
                }
            }
            //console.log(vegrefdeler);
            
            for (key in vegrefdeler) {
                //console.log(key);
                if (vegrefdeler[key].length < 2) {
                    //console.log('Bare ett objekt');
                    //console.log(vegrefdeler[key][0].geometri);
                    $rootScope.addVegnett(vegrefdeler[key][0].geometri);
                } else {
                    for (var i = 1; i < vegrefdeler[key].length; i++) {
                        if (vegrefdeler[key][i-1].vegreferanse.tilMeter == vegrefdeler[key][i].vegreferanse.fraMeter) {
                            //console.log('Kan slås sammen');
                            var koordinater0 = vegrefdeler[key][i-1].geometri.coordinates;
                            //console.log(koordinater0);
                            var koordinater0ny = koordinater0.splice(0, koordinater0.length-1);
                            //console.log(koordinater0ny);
                            var koordinater1 = vegrefdeler[key][i].geometri.coordinates;
                            //console.log(koordinater1);
                            var koordinater1ny = koordinater0ny.concat(koordinater1);
                            //console.log(koordinater1ny)
                            vegrefdeler[key][i].geometri.coordinates = koordinater1ny;
                        } else {
                            $rootScope.addVegnett(vegrefdeler[key][i-1].geometri);
                        }
                        if (i == vegrefdeler[key].length-1) {
                            $rootScope.addVegnett(vegrefdeler[key][i].geometri);
                        }
                        //console.log(vegrefdeler[key][i].vegreferanse.fraMeter+'-'+vegrefdeler[key][i].vegreferanse.tilMeter);
                    }
                }

            }
            
            
            //var geojson = nvdbdata.geojson(objekter);
            
            //$rootScope.addVegnett(geojson);

        });
    };
    
    
    $rootScope.registrerObjekt = function () {
        var output = '';
        output += 'Egengeometri: \n'+$rootScope.egengeometri+'\n\n';
        output += 'Lokasjon: \n'+$rootScope.lokasjon+'\n\n';
        
        var egenskapstyper = $rootScope.objekttype[$rootScope.aktivObjekttype].egenskapsTyper;
        for (var i = 0; i < egenskapstyper.length; i++) {
            if ($rootScope.egenskaper[egenskapstyper[i].id]) {
                output += egenskapstyper[i].navn+': \n'+$rootScope.egenskaper[egenskapstyper[i].id]+'\n\n';
            }
            
        }
        alert(output);
    };
    
    
    
    // Variabler som lagrer verdier fra registreringsskjema
    $rootScope.egenskaper = {};
    $rootScope.egengeometri = '';
    $rootScope.lokasjon = '';

    // Funksjoner for å nullestille modellen
    $rootScope.resetEgenskaper = function () {
        for (nr in $rootScope.egenskaper) {
            $rootScope.egenskaper[nr] = '';
        }
    };
    $rootScope.resetEgengeometri = function () {
        $rootScope.egengeometri = '';
        $rootScope.resetLayer('egengeometri');
        $rootScope.resetLokasjon();
    };
    $rootScope.resetLokasjon = function () {
        $rootScope.lokasjon = '';
        $rootScope.resetLayer('lokasjon');
    };
    $rootScope.resetObjekt = function () {
        $rootScope.resetEgenskaper();
        $rootScope.resetEgengeometri();
    };
    
    
    
    // Denne kan kanskje fjernes?
    $rootScope.stedfester = false;

    
    $rootScope.finnVegreferanse = function (lon, lat) {
        $rootScope.lokasjon = 'Henter vegreferanse ...';
        nvdbapi.vegreferanse(lon, lat).then(function(promise) {
            $rootScope.lokasjon = promise.data.visningsNavn;
            
            var lokasjon = Terraformer.WKT.parse(promise.data.punktPaVegReferanseLinjeWGS84);
            
            console.log(lokasjon);
            
            $rootScope.resetLayer('lokasjon');
            $rootScope.addLokasjon(lokasjon);

            
        });
    };
    

    
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
    
    // Test av malkonsept
    $rootScope.mal = {};
    $rootScope.mal[470] = {
        "Maltittel": {
            navn: "Maltittel",
            egenskaper: [
                {
                    id: 3779,
                    verdi: "Mobiltelefon"
                },
                {
                    id: 4072,
                    verdi: 1986
                },
                {
                    id: 3874,
                    verdi: 3
                }
            ]
        },
        "Maltittel2": {
            navn: "Maltittel2",
            egenskaper: [
                {
                    id: 3779,
                    verdi: "Radio"
                },
                {
                    id: 4072,
                    verdi: 2010
                },
                {
                    id: 3874,
                    verdi: 78
                },
                {
                    id: 3518,
                    verdi: "Telenor"
                }
            ]
        }
    };
    
    $rootScope.aktivMal = '';
    $rootScope.setMal = function () {
        $rootScope.resetEgenskaper();
        
        var egenskaper = $rootScope.mal[$rootScope.aktivObjekttype][$rootScope.aktivMal].egenskaper
        for (var i = 0; i < egenskaper.length; i++) {
            var egenskap = egenskaper[i];
            $rootScope.egenskaper[egenskap.id] = egenskap.verdi;
        }
    };
        
}]);