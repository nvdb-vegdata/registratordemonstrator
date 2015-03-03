angular.module('nvdbdata', [])

    .factory('nvdbdata', ['nvdbapi', function(nvdbapi) {


        return {
            objekttype: function(objekttype) {
                var egenskapstyper = objekttype.egenskapsTyper;
                objekttype.egenskapsTyper = [];
                objekttype.geometri = [];
                objekttype.egengeometri = false;
                
                var viktighet = {
                    "P\u00C5KREVD_ABSOLUTT": 1,
                    "P\u00C5KREVD": 2,
                    "BETINGET": 3,
                    "OPSJONELL": 4,
                    "MINDRE_VIKTIG": 7,
                    "HISTORISK": 9,
                    "IKKE_SATT": 999
                }
                
                // Filtrer vekk irrelevante egenskapstyper
                for (var i = 0; i < egenskapstyper.length; i++) {
                    var egenskapstype = egenskapstyper[i];
                    
                    switch (egenskapstype.navn) {
                        case 'PunktTilknytning':
                            break;
                        case 'StrekningTilknytning':
                            break;
                        case 'Geometri, punkt':
                            objekttype.geometri.push(egenskapstype);
                            objekttype.egengeometri = true;
                            break;
                        case 'Geometri, linje':
                            objekttype.geometri.push(egenskapstype);
                            objekttype.egengeometri = true;
                            break;
                        case 'Geometri, flate':
                            objekttype.geometri.push(egenskapstype);
                            objekttype.egengeometri = true;
                            break;
                        default:
                            egenskapstype.viktighetnr = viktighet[egenskapstype.viktighet];
                            objekttype.egenskapsTyper.push(egenskapstype);
                    }
                }
                          
                return objekttype;
            },
            
            geojson: function(objekter) {
                var geojson = [];
                
                for (var i = 0; i < objekter.length; i++) {
                    var geometri = Terraformer.WKT.parse(objekter[i].lokasjon.geometriWgs84);
                    var geojsonFeature = {
                        type: 'Feature',
                        properties: {
                            id: objekter[i].objektId
                        },
                        geometry: geometri
                    };
                    geojson.push(geojsonFeature);
                }
                return geojson;
            },
            
            vegreferanse: function(v) {
                var vegreferanse = v.kategori+v.status+' '+v.nummer+' HP'+v.hp+' m'+v.fraMeter;
                
                if (v.hasOwnProperty('tilMeter')) {
                    vegreferanse += '–'+v.tilMeter;
                }
                
                return vegreferanse;
            }
            
        };
        
    }])
