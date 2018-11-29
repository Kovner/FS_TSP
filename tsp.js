$(document).ready(function () {
    var scale = 1;
    var g = null;
    var projection = null;
    var modelUri;
    var citydata = null;
    var div = null;
    var map = null;
    var features = null;
    var selectedCities = [];
    var selectClick = null;
    var vectorLineLayer = null;
    var circleLayer = null;

    var rasonModel = {
        comment: "traveling salesman problem",

        engineSettings: {
            engine: "Evolutionary",
            MaxTimeNoImp: 3
        },

        data: [{
            name: "dist",
            value: [
                [0, 3.21, 4.86, 3.55, 2.89, 3.95, 6.56, 4.47, 4.89, 2.42, 1.15, 4.63, 2.25, 3.41, 6.18],
                [3.21, 0, 4.94, 3.21, 1.63, 7.03, 8.15, 6.14, 6.79, 2.75, 3.59, 1.43, 5.38, 6.32, 9.35],
                [4.86, 4.94, 0, 1.74, 6.19, 6.06, 3.87, 9.32, 3.34, 6.65, 6, 5.73, 5.29, 7.84, 8.34],
                [3.55, 3.21, 1.74, 0, 4.47, 5.84, 5.18, 7.92, 4.13, 5.02, 4.63, 4.11, 4.64, 6.84, 8.25],
                [2.89, 1.63, 6.19, 4.47, 0, 6.82, 8.94, 4.63, 7.41, 1.28, 2.72, 2.5, 5.12, 5.32, 8.95],
                [3.95, 7.03, 6.06, 5.84, 6.82, 0, 5.06, 6.28, 3.58, 6.09, 4.32, 8.45, 1.7, 3.49, 2.43],
                [6.56, 8.15, 3.87, 5.18, 8.94, 5.06, 0, 10.58, 1.72, 8.92, 7.6, 9.24, 5.48, 8.21, 6.53],
                [4.47, 6.14, 9.32, 7.92, 4.63, 6.28, 10.58, 0, 8.86, 3.39, 3.32, 7.12, 5.16, 2.89, 7.31],
                [4.89, 6.79, 3.34, 4.13, 7.41, 3.58, 1.72, 8.86, 0, 7.28, 5.89, 8, 3.78, 6.53, 5.43],
                [2.42, 2.75, 6.65, 5.02, 1.28, 6.09, 8.92, 3.39, 7.28, 0, 1.77, 3.78, 4.43, 4.14, 8.04],
                [1.15, 3.59, 6, 4.63, 2.72, 4.32, 7.6, 3.32, 5.89, 1.77, 0, 4.93, 2.69, 2.73, 6.28],
                [4.63, 1.43, 5.73, 4.11, 2.5, 8.45, 9.24, 7.12, 8, 3.78, 4.93, 0, 6.81, 7.65, 10.78],
                [2.25, 5.38, 5.29, 4.64, 5.12, 1.7, 5.48, 5.16, 3.78, 4.43, 2.69, 6.81, 0, 2.78, 3.97],
                [3.41, 6.32, 7.84, 6.84, 5.32, 3.49, 8.21, 2.89, 6.53, 4.14, 2.73, 7.65, 2.78, 0, 4.46],
                [6.18, 9.35, 8.34, 8.25, 8.95, 2.43, 6.53, 7.31, 5.43, 8.04, 6.28, 10.78, 3.97, 4.46, 0]
            ]
        }, {
            name: "cities",
            value: 15
        }
        ],

        formulas: {
            s: {
                dimensions: ["cities"]
            },

            "s[1]": {
                formula: "INDEX(dist, x[cities], x[1])"
            },

            "for(i in 2..cities)": {
                "s[i]": {
                    formula: "INDEX(dist, x[i-1], x[i])"
                }
            }
        },

        variables: {
            x: {
                dimensions: ["cities"],
                type: 'allDif',
                lower: 1,
                finalValue: []
            },
            visitingdates: {
                dimensions: ["cities"],
                type: 'int',
                finalValue: []
            }
        },

        constraints: {

        },

        objective: {
            len: {
                type: "min",
                formula: "SUM(s)",
                finalValue: []
            }
        }
    };

    $('#solve').click(function () {
        $('#solve').hide();
        $('#solving').show();
        try {
            // map.removeLayer(vectorLineLayer);
            vectorLineLayer = null;
            $('#objective').html("");
            $('#resultBox').html("");
            // $('#itTable').empty();

            var distances = [];
            for (var i = 0; i < selectedCities.length; i++) {
                distances[i] = [];
                for (var j = 0; j < selectedCities.length; j++) {
                    if (i === j) {
                        distances[i][j] = 0;
                    } else {
                        distances[i][j] = Math.sqrt((selectedCities[i].lon - selectedCities[j].lon) * (selectedCities[i].lon - selectedCities[j].lon) +
                            (selectedCities[i].lat - selectedCities[j].lat) * (selectedCities[i].lat - selectedCities[j].lat));
                    }
                }
            }
            var startDate = lowestToDate(selectedCities);
            startDate.setDate(startDate.getDate() - 1); // since the variables will be 1-based
            var constraints = [];
            /*
            for (var i = 0; i < selectedCities.length; i++) {
                if (selectedCities[i].from == selectedCities[i].to) {
                    var fromDate = new Date(selectedCities[i].from);
                    constraints.push({
                        name: 'e' + i,
                        formula: 'x[' + (i + 1) + ']',
                        equal: daysBetween(startDate, fromDate)
                    });
                } else {
                    var fromDate = new Date(selectedCities[i].from);
                    constraints.push({
                        name: 'l' + i,
                        formula: 'x[' + (i + 1) + ']',
                        lower: daysBetween(startDate, fromDate)
                    });
                    var toDate = new Date(selectedCities[i].to);
                    constraints.push({
                        name: 'u' + i,
                        formula: 'x[' + (i + 1) + ']',
                        upper: daysBetween(startDate, toDate)
                    });
                }

            }*/
            var lowerbound = [];
            var upperbound = [];
            for (var i = 0; i < selectedCities.length; i++) {
                lowerbound.push(dateToInteger(selectedCities[i].from));
                upperbound.push(dateToInteger(selectedCities[i].to));
            }
            for (var i = 1; i < selectedCities.length; i++) {
                constraints.push({
                    name: 'order' + i,
                    formula: 'visitingdates[x[' + (i + 1) + ']] - visitingdates[x[' + i + ']]',
		    // Edwin's improved formulation...
		    // formula: 'INDEX(visitingdates, x[' + (i + 1) + ']) - INDEX(visitingdates, x[' + i + '])',
                    lower: 1
                });
            }
            rasonModel.variables.visitingdates["lower"] = lowerbound;
            rasonModel.variables.visitingdates["upper"] = upperbound;
            rasonModel.constraints = constraints;
            rasonModel.data[0].value = distances;
            rasonModel.data[1].value = selectedCities.length;
            
            postModel();
        } catch (e) {
            alert(e);
        }
    });

    function daysBetween(date1, date2) {
        var one_day = 1000 * 60 * 60 * 24;    // Convert both dates to milliseconds
        var date1_ms = date1.getTime();
        var date2_ms = date2.getTime();    // Calculate the difference in milliseconds  
        var difference_ms = date2_ms - date1_ms;        // Convert back to days and return   
        return Math.round(difference_ms / one_day);
    }

    function dateToInteger(date1) {
        var d = new Date(date1);
        var one_day = 1000 * 60 * 60 * 24; 
        return Math.round(d.getTime() / one_day);
    }

    function lowestToDate(cities) {
        var mindate = new Date("2020-01-01");
        for (var i = 0; i < cities.length; i++) {
            var date = new Date(cities[i].to);
            if (date < mindate) {
                mindate = date;
            }
        }
        return mindate;
    }

    function selectionChangedEvent(marksEvent) {
        try {
            // map.removeLayer(vectorLineLayer);
            // vectorLineLayer = null;
            // map.removeLayer(circleLayer);
            // circleLayer = null;
            // $('#itTable').empty();
             const sheetName = marksEvent.worksheet.name;
             marksEvent.getMarksAsync().then((selectedMarks) => {
                 try {
                     const dataTable = selectedMarks.data[0];
                     const rows = dataTable.data;
                     let newDestArr = [];
                     if (rows.length > 0) {
                        // if ( $("#mainContainer").is(":hidden") ) {
                        //     $("#mainContainer").show();
                        //     $("#welcomeScreen").hide();
                        // }
                        $("#selectMsg").hide();
                        $("#solve").prop('disabled', false);
                        
                        var cityIndex = dataTable.columns.find(col => col.fieldName == 'ATTR(City1)').index;
                        var latIndex = dataTable.columns.find(col => col.fieldName == 'MIN(Latitude)').index;
                        var lonIndex = dataTable.columns.find(col => col.fieldName == 'MIN(Longitude)').index;
                        var fromIndex = dataTable.columns.find(col => col.fieldName == 'ATTR(Available From)').index;
                        var toIndex = dataTable.columns.find(col => col.fieldName == 'ATTR(Available Until)').index;
                        var custIndex = dataTable.columns.find(col => col.fieldName == 'Customer Name1').index;
                        for (var i = 0; i < rows.length; i++) {
                            var newDest = {
                                 'city': rows[i][cityIndex].value,
                                 'lat': rows[i][latIndex].value,
                                 'lon': rows[i][lonIndex].value,
                                 'from': rows[i][fromIndex].value,
                                 'to': rows[i][toIndex].value,
                                 'customer': rows[i][custIndex].value,
                            }
                            newDestArr.push(newDest);
                            var row = "<tr>" + 
                                "<td>" + newDest['customer'] + "</td>" +
                                "<td>" + newDest['city'] + "</td>" +
                                "<td>" + newDest['from'] + "</td>" +
                                "<td>" + newDest['to'] + "</td>" +
                                "</tr>"
                            
                            $("#customersTable > tbody").append(row)    
                        }
                        selectedCities = selectedCities.concat(newDestArr);
                        let newRoutes = newDestArr.map( dest => dest['city'] + '-' + dest['city'])
                        let dashboard = tableau.extensions.dashboardContent.dashboard;
                        let routesSheet = dashboard.worksheets.find( sheet => sheet.name == "Routes")
                        routesSheet.applyFilterAsync('Path ID', newRoutes, tableau.FilterUpdateType.Add);
                    }
                    
                 } catch (e) {
                     alert(e);
                 }
        });
        } catch (e) {
            alert(e);
        }
    }
    
    tableau.extensions.initializeAsync().then(function() {
        citydata = [];
        var chartData = [];
        // drawChart();

        let oppSheet = tableau.extensions.dashboardContent.dashboard.worksheets.find( sheet => sheet.name == "Opportunities and Time of Contact");
        oppSheet.addEventListener('mark-selection-changed', selectionChangedEvent);
        let routesSheet = tableau.extensions.dashboardContent.dashboard.worksheets.find( sheet => sheet.name == "Routes");
        routesSheet.applyFilterAsync('Path ID', ["North Las Vegas-North Las Vegas"], tableau.FilterUpdateType.Replace);
        //TODO: Select 0 marks on scatterplot
        
    });
    
    function postModel() {
        try {
            var d = JSON.stringify(rasonModel,null, 3);
            chartData = null;
            $.ajax('https://rason.net/api/model'/* 'https://127.0.0.1:444/api/model'*/, {
                method: 'POST',
                data: d,
                cache: false,
                context: this,
                headers: {
                    'Authorization': 'Bearer ' + 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInRpbWUiOiI2MCIsIm1vbnRoIjoiMTQ0MDAiLCJ2YXJpYWJsZXMiOiIyMDAiLCJsaW5lYXJfdmFycyI6IjIwMCIsIm5vbmxpbmVhcl92YXJzIjoiMTAwIiwidW5jZXJ0YWluX3ZhcnMiOiIyNCIsInVuY2VydGFpbl9mY25zIjoiMTIiLCJmdW5jdGlvbnMiOiIxMDAiLCJpbnRlZ2VycyI6IjIwMCIsImVuZ2luZXMiOiIwMDAwMDAwIiwibWF4VHJpYWxzIjoiMTAwMCIsInVzZXJpZCI6IjE3MzMiLCJ1c2VybmFtZSI6ImVkd2luQHNvbHZlci5jb20iLCJwbGFuIjoiTm9uZSIsImlhdCI6IjE0OTI0NTgxOTMuNDcwNDEiLCJqdGkiOiI1MzE2OGM4Nzg2M2Q2Y2Y1MTI5NGY5MzYzNzU1NjgwMCJ9.GS4Qi82eTq-uA7dnWsRXVGQ3jxp5ns4bLY3n-o-qgbE',
                    'Content-Type': 'application/json'
                }
            }).done(startSolve).fail(solveFailed);

            //this.svgRoot.innerHTML = '<p>Solving...</p>';
        } catch (ex) {
            $('#resultBox').html('<p>' + ex + '</p>');
        }
    }

    function startSolve(data, textStatus, jqXHR) {
        try {
            // get the model location
            modelUri = jqXHR.getResponseHeader('location');
            $.ajax(modelUri + '/optimize', {
                method: 'GET',
                cache: false,
                context: this,
                headers: {
                    'Authorization': 'Bearer ' + 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInRpbWUiOiI2MCIsIm1vbnRoIjoiMTQ0MDAiLCJ2YXJpYWJsZXMiOiIyMDAiLCJsaW5lYXJfdmFycyI6IjIwMCIsIm5vbmxpbmVhcl92YXJzIjoiMTAwIiwidW5jZXJ0YWluX3ZhcnMiOiIyNCIsInVuY2VydGFpbl9mY25zIjoiMTIiLCJmdW5jdGlvbnMiOiIxMDAiLCJpbnRlZ2VycyI6IjIwMCIsImVuZ2luZXMiOiIwMDAwMDAwIiwibWF4VHJpYWxzIjoiMTAwMCIsInVzZXJpZCI6IjE3MzMiLCJ1c2VybmFtZSI6ImVkd2luQHNvbHZlci5jb20iLCJwbGFuIjoiTm9uZSIsImlhdCI6IjE0OTI0NTgxOTMuNDcwNDEiLCJqdGkiOiI1MzE2OGM4Nzg2M2Q2Y2Y1MTI5NGY5MzYzNzU1NjgwMCJ9.GS4Qi82eTq-uA7dnWsRXVGQ3jxp5ns4bLY3n-o-qgbE',
                    'Content-Type': 'application/json'
                }
            }).done(getSolveStatus).fail(solveFailed);
        } catch (ex) {
            $('#resultBox').html('<p>' + ex + '</p>');
        }
    }


    function getSolveStatus(data, textStatus, jqXHR) {
        try {
            $.ajax(modelUri + '/status', {
                method: 'GET',
                cache: false,
                context: this,
                headers: {
                    'Authorization': 'Bearer ' + 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInRpbWUiOiI2MCIsIm1vbnRoIjoiMTQ0MDAiLCJ2YXJpYWJsZXMiOiIyMDAiLCJsaW5lYXJfdmFycyI6IjIwMCIsIm5vbmxpbmVhcl92YXJzIjoiMTAwIiwidW5jZXJ0YWluX3ZhcnMiOiIyNCIsInVuY2VydGFpbl9mY25zIjoiMTIiLCJmdW5jdGlvbnMiOiIxMDAiLCJpbnRlZ2VycyI6IjIwMCIsImVuZ2luZXMiOiIwMDAwMDAwIiwibWF4VHJpYWxzIjoiMTAwMCIsInVzZXJpZCI6IjE3MzMiLCJ1c2VybmFtZSI6ImVkd2luQHNvbHZlci5jb20iLCJwbGFuIjoiTm9uZSIsImlhdCI6IjE0OTI0NTgxOTMuNDcwNDEiLCJqdGkiOiI1MzE2OGM4Nzg2M2Q2Y2Y1MTI5NGY5MzYzNzU1NjgwMCJ9.GS4Qi82eTq-uA7dnWsRXVGQ3jxp5ns4bLY3n-o-qgbE',
                    'Content-Type': 'application/json'
                }
            }).done(checkStatus).fail(solveFailed);
        } catch (ex) {
            $('#resultBox').html('<p>' + ex + '</p>');
        }
    }

    function checkStatus(data, textStatus, jqXHR) {
        try {
            // if (data.Objective) {
            //     $('#objective').html("Current distance: " + data.Objective);

            // }
            if (data.status == "Complete") {
                getResults();
            } else {
                setTimeout(getSolveStatus, 250);
            }
        } catch (ex) {
            $('#resultBox').html('<p>' + ex + '</p>');
        }
    }

    function getResults() {
        $.ajax(modelUri + '/result', {
            method: 'GET',
            cache: false,
            context: this,
            headers: {
                'Authorization': 'Bearer ' + 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInRpbWUiOiI2MCIsIm1vbnRoIjoiMTQ0MDAiLCJ2YXJpYWJsZXMiOiIyMDAiLCJsaW5lYXJfdmFycyI6IjIwMCIsIm5vbmxpbmVhcl92YXJzIjoiMTAwIiwidW5jZXJ0YWluX3ZhcnMiOiIyNCIsInVuY2VydGFpbl9mY25zIjoiMTIiLCJmdW5jdGlvbnMiOiIxMDAiLCJpbnRlZ2VycyI6IjIwMCIsImVuZ2luZXMiOiIwMDAwMDAwIiwibWF4VHJpYWxzIjoiMTAwMCIsInVzZXJpZCI6IjE3MzMiLCJ1c2VybmFtZSI6ImVkd2luQHNvbHZlci5jb20iLCJwbGFuIjoiTm9uZSIsImlhdCI6IjE0OTI0NTgxOTMuNDcwNDEiLCJqdGkiOiI1MzE2OGM4Nzg2M2Q2Y2Y1MTI5NGY5MzYzNzU1NjgwMCJ9.GS4Qi82eTq-uA7dnWsRXVGQ3jxp5ns4bLY3n-o-qgbE',
                'Content-Type': 'application/json'
            }
        }).done(solveDone).fail(solveFailed);
    }


    function solveDone(data, textStatus, jqXHR) {
        try {
            $("#solving").hide();
            $("#solveContainer").hide();
            $("#itTable").show();
            //$("#map").show()
            // drawChart();
            // drawCircles(selectedCities);
            // $('#objective').html("Final distance: " + data.objective.len.finalValue);
            deleteModel();
            chartData = [];
            if (data.status && data.status.code == 5) {
                $("#dialog").dialog();
                return;
            }
            for (var i = 0; i < data.variables.x.finalValue.length; i++) {
                chartData.push(data.variables.x.finalValue[i]);
            }
            var one_day = 1000 * 60 * 60 * 24;
            for (var i = 0; i < data.variables.visitingdates.finalValue.length; i++) {
                var d = new Date();
                d.setTime(data.variables.visitingdates.finalValue[data.variables.x.finalValue[i] - 1] * one_day);

                var row = $("<tr/>");
                var cell = $("<td/>");

                cell.text((i+1) + '. Visit ' + selectedCities[data.variables.x.finalValue[i]-1].customer + ' in ' + selectedCities[data.variables.x.finalValue[i]-1].city + ' on ' +
                    d.toDateString() + '.');
                row.append(cell);
                $('#itTable > tbody').append(row);
            }

            drawLines(data.variables.x.finalValue);
        } catch (ex) {
            alert(ex);
        }
    }

    function solveFailed(jqXHR, textStatus, errorThrown) {
        $('#objective').html('<p>Error: <em>' + textStatus + '</em> <em>' + jqXHR.status + '</em></p>');
        deleteModel();
    }

    function deleteModel() {
        if (modelUri != null) {
            $.ajax(modelUri + '/delete', {
                method: 'DELETE',
                cache: false,
                //context: this,
                headers: {
                    'Authorization': 'Bearer ' + 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInRpbWUiOiI2MCIsIm1vbnRoIjoiMTQ0MDAiLCJ2YXJpYWJsZXMiOiIyMDAiLCJsaW5lYXJfdmFycyI6IjIwMCIsIm5vbmxpbmVhcl92YXJzIjoiMTAwIiwidW5jZXJ0YWluX3ZhcnMiOiIyNCIsInVuY2VydGFpbl9mY25zIjoiMTIiLCJmdW5jdGlvbnMiOiIxMDAiLCJpbnRlZ2VycyI6IjIwMCIsImVuZ2luZXMiOiIwMDAwMDAwIiwibWF4VHJpYWxzIjoiMTAwMCIsInVzZXJpZCI6IjE3MzMiLCJ1c2VybmFtZSI6ImVkd2luQHNvbHZlci5jb20iLCJwbGFuIjoiTm9uZSIsImlhdCI6IjE0OTI0NTgxOTMuNDcwNDEiLCJqdGkiOiI1MzE2OGM4Nzg2M2Q2Y2Y1MTI5NGY5MzYzNzU1NjgwMCJ9.GS4Qi82eTq-uA7dnWsRXVGQ3jxp5ns4bLY3n-o-qgbE',
                    'Content-Type': 'application/json'
                }
            });
        }
    }
          
    // function drawCircles(data) {
       
    //     var points = new Array();
    //     var vectorSource = new ol.source.Vector({
    //         projection: 'EPSG:4326',
    //     });
    //     circleLayer = new ol.layer.Vector({
    //         source: vectorSource,
    //         style: [
    //             new ol.style.Style({
    //                 stroke: new ol.style.Stroke({
    //                     color: '#4F78A8',
    //                     width: 3
    //                 }),
    //                 fill: new ol.style.Fill({
    //                     color: '#4F78A8'
    //                 })
    //             })]
    //     });
    //     map.addLayer(circleLayer);

    //     features = [];
    //     for (var i = 0; i < data.length; i++) {
    //         var feat = new ol.Feature(new ol.geom.Circle(ol.proj.transform([+data[i].lon, +data[i].lat], 'EPSG:4326', 'EPSG:3857'), 100000));
    //         feat.city = data[i].city;
    //         feat.lat = data[i].lat;
    //         feat.lon = data[i].lon;
    //         features.push(feat);
    //         vectorSource.addFeature(feat);
    //     }
    // }

    function drawLines(finalValue) {
        // connect the dots...
        // var points = [];
        
        // for (var i = 0; i < selectedCities.length; i++) {
        //     points.push(ol.proj.transform([+selectedCities[finalValue[i] - 1].lon, +selectedCities[finalValue[i] - 1].lat], 'EPSG:4326', 'EPSG:3857'));
        // }
        // points.push(points[0]);

        // var featureLine = new ol.Feature({
        //     geometry: new ol.geom.LineString(points)
        // });

        // var vectorLine = new ol.source.Vector({});
        // vectorLine.addFeature(featureLine);

        // if (vectorLineLayer) {
        //     map.removeLayer(vectorLineLayer);
        // }
        // vectorLineLayer = new ol.layer.Vector({
        //     source: vectorLine,
        //     style: new ol.style.Style({
        //         fill: new ol.style.Fill({ color: 'red', weight: 4 }),
        //         stroke: new ol.style.Stroke({ color: 'red', width: 2 })
        //     })
        // });

        // map.addLayer(vectorLineLayer);

        let routes = [] 
        for (let i = 0; i < finalValue.length - 1; i++) {
            routes.push(selectedCities[finalValue[i]-1]["city"] + "-" + selectedCities[finalValue[i+1]-1]["city"])
        }
        routes.push(selectedCities[finalValue[finalValue.length - 1]-1]["city"] + "-" + selectedCities[finalValue[0]-1]["city"])
        let dashboard = tableau.extensions.dashboardContent.dashboard;
        let routesSheet = dashboard.worksheets.find( sheet => sheet.name == "Routes")
        routesSheet.applyFilterAsync('Path ID', routes, tableau.FilterUpdateType.Add);
    }

    // function drawChart() {
    //     var raster = new ol.layer.Tile({
    //         source: new ol.source.OSM()
    //     });

    //     var source = new ol.source.Vector({ wrapX: false });

    //     var vector = new ol.layer.Vector({
    //         source: source
    //     });

    //     map = new ol.Map({
    //         layers: [raster, vector],
    //         target: 'map',
    //         view: new ol.View({
    //             center: [-13000000, 4950000],
    //             //center: [0, 0],
    //             zoom: 4
    //         })
    //     });
      
    //     map.on("click", function (e) {
    //         map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
    //             //do something
    //         })
    //     });
    // }   
});