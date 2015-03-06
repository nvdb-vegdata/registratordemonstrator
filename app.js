var app = angular.module('registratordemonstrator', [
    'nvdbapi',
    'nvdbskriv',
    'nvdbdata',
    'nvdbleaflet'
]);

app.run(['$rootScope', 'nvdbapi', 'nvdbdata', 'nvdbskriv', function($rootScope, nvdbapi, nvdbdata, nvdbskriv) {

    $rootScope.aktivObjekttype = 0;
    $rootScope.objekttype = {};

    // Henter liste med objekttyper
    nvdbapi.objekttyper().then(function(promise) {
        $rootScope.objekttyper = promise.data.vegObjektTyper;
    });
    
    
    // Funksjon som kjøres når det settes en ny aktiv objekttype i applikasjonen
    $rootScope.setObjekttype = function () {
    
        // Modellen nullstilles
        $rootScope.resetObjekt();
        $rootScope.resetLayer('vegobjekter');
        $rootScope.egenskaper = {};
        
        // Henter detaljert informasjon om aktiv objekttype
        if (!$rootScope.objekttype.hasOwnProperty($rootScope.aktivObjekttype)) {
            nvdbapi.objekttype($rootScope.aktivObjekttype).then(function(promise) {
                var data = nvdbdata.objekttype(promise.data);
                $rootScope.objekttype[$rootScope.aktivObjekttype] = data;
            });
        }
    };
 
    
    // Henter objekter fra NVDB og legger dem til kart
    $rootScope.hentObjekter = function () {
    
        $rootScope.loading = true;  // Aktiverer loading-ikon
        // http://stackoverflow.com/questions/23316532/angularjs-how-to-show-a-loading-indicator-when-loading-the-app-at-the-first-time
        
        nvdbapi.sok($rootScope.aktivObjekttype, $rootScope.getBbox()).then(function(promise) { 
            $rootScope.loading = false;  // Deaktiverer loading-ikon

            // Henter objekter fra APIet, og transformerer til geojson
            var objekter = promise.data.resultater[0].vegObjekter;
            var geojson = nvdbdata.geojson(objekter);
            
            // Legger til objektene til kart
            $rootScope.addVegobjekter(geojson);

        });
        
    };
    
    
    // Henter vegnett og legger dem til som et kartlag for stedfesting av strekningsobjekter
    $rootScope.hentVegnett = function () {

        $rootScope.loading = true;  // Aktiverer loading-ikon
        nvdbapi.vegreferanseobjekter($rootScope.getBbox()).then(function(promise) { 
            $rootScope.loading = false;  // Deaktiverer loading-ikon
        
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
    
    
    // Finner lokasjon for punkt
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
    

    // Dette skjer når et objekt skal registreres
    $rootScope.registrerObjekt = function () {
    
        var jobb = {
            effektDato: "2015-03-06",
            datakatalogversjon: "2.01",
            registrer: {
                vegObjekter: []
            }
        };
        
        var vegobjekt = {};
        
        vegobjekt.typeId = $rootScope.aktivObjekttype;
        vegobjekt.tempId = "-1";
        vegobjekt.egenskaper = [];
        
    
        var output = '';
        output += 'Egengeometri: \n'+$rootScope.egengeometri+'\n\n';
        output += 'Lokasjon: \n'+$rootScope.lokasjon+'\n\n';

        var egenskapstyper = $rootScope.objekttype[$rootScope.aktivObjekttype].egenskapsTyper;
        for (var i = 0; i < egenskapstyper.length; i++) {
            if ($rootScope.egenskaper[egenskapstyper[i].id]) {
                output += egenskapstyper[i].navn+': \n'+$rootScope.egenskaper[egenskapstyper[i].id]+'\n\n';
                vegobjekt.egenskaper.push({
                    typeId:  egenskapstyper[i].id,
                    verdi: [$rootScope.egenskaper[egenskapstyper[i].id]]
                });
            }

        }
        
        jobb.registrer.vegObjekter.push(vegobjekt);
        
        console.log(output);
        console.log(angular.toJson(jobb));
        
        nvdbskriv.getJobber().then(function(promise) {
            console.log(promise);
        });
        
        nvdbskriv.registrerJobb(jobb).then(function(promise) {
            console.log(promise);
        });
        
    };
        
}]);