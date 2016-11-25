/* Elasticsearch HTTP call to search prescriptions */

    app.get('/api/search-prescription', function(request, response) {
        elastic_client.search({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            body: {
                query: {
                    "match_all" : {}
                }
                }
            }).then(function (resp) {
            var hits = resp.hits.hits[0]._source.content.Schedule;
            console.log("I HAVE GOT SOME HITS : " + hits)
            response.jsonp(hits);

        }, function (err) {
            console.trace(err.message);
            response.send(err);
        });
    });

/* Elasticsearch HTTP call to add prescription */

    app.get('/api/add-prescription', function(request, response) {
        console.log(request);
        var url_parts = url.parse(request.url, true);
        var values = JSON.parse(url_parts.query.models);
        console.log("################ This should be new #######################" + JSON.stringify(values[0]))
        elastic_client.search({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            body: {
                query: {
                    "match_all" : {}
                }
                }
            }).then(function (resp) {
                console.log("AND THE REPLY IS ############" + resp[0])//.hits.hits[0]._source.content)
            var addData;
            var counter;
            //if (resp[0] != undefined || resp[0] != null){
                addData=resp.hits.hits[0]._source.content;
                counter = addData.TaskIDCounter;
                counter++;
            /*}
            //else {
                addData ={"TaskIDCounter": 0, "Schedule": []};
                addData.Schedule = []
                counter = 0;
            }*/
            addData.TaskIDCounter = counter;
            var temp_val = values[0];
            temp_val.TaskID = counter;
            addData.Schedule.push(temp_val);
            addData.TaskIDCounter = counter;
            //addData = {"TaskIDCounter": 0, "Schedule": []}
            console.log("ADD DATA ============> " + JSON.stringify(addData));
            elastic_client.update({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            
            body: {
                        "doc" : {"content" : addData},
                        "doc_as_upsert" : true
                }
            }, function(err, res) {

            if (err) {
                console.error(err.message);
                response.send(err.message);
            } else {
                console.log("Response : " + JSON.stringify(res));
                response.jsonp([]);
            }
            });
        }, function (err) {
            console.trace(err);
            addData = {"ERROR": err};
            response.jsonp({"ERROR": err});
        });
    });

/* Elasticsearch HTTP call to update prescriptions */
app.get('/api/update-prescription', function(request, response) {
        var updateData;
        var url_parts_update = url.parse(request.url, true);
        var values_update = JSON.parse(url_parts_update.query.models);
        console.log("Delete request coming: " + JSON.stringify(values_update[0]));
        var updateTaskID = values_update[0].TaskID;

         elastic_client.search({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            body: {
                query: {
                    "match_all" : {}
                }
                }
            }).then(function (resp) {
            updateData = resp.hits.hits[0]._source.content;
            for(var i = 0; i<updateData.Schedule.length; i++){
                if(updateData.Schedule[i].TaskID == updateTaskID){
                    updateData.Schedule.splice(i, 1);
                    updateData.Schedule.push(values_update[0]);
                    break;
                }
            }

            elastic_client.update({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            
            body: {                      
                        "doc" : {"content" : updateData},
                        "doc_as_upsert" : true
                }
            }, function(err, res) {

            if (err) {
                console.error(err.message);
                response.send(err.message);
            } else {
                console.log("Response : " + JSON.stringify(res));
                response.jsonp([]);
            }
            });   
            //var hits = resp.hits.hits[0]._source.content.Schedule;
            //response.jsonp(hits);

        }, function (err) {
            console.trace(err.message);
            updateData = {"ERROR": err.message};
            response.jsonp({"ERROR": err.message});
        });
    });

/* Elasticsearch HTTP call to delete prescription */

    app.get('/api/delete-prescription', function(request, response) {
        var deleteData;
        var url_parts_delete = url.parse(request.url, true);
        var values_delete = JSON.parse(url_parts_delete.query.models);
        console.log("Delete request coming: " + JSON.stringify(values_delete[0]));
        var deleteTaskID = values_delete[0].TaskID;
        console.log("DELETE ATSK ID IS ===>>>>>>" + deleteTaskID)
        elastic_client.search({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            body: {
                query: {
                    "match_all" : {}
                }
                }
            }).then(function (resp) {
            deleteData = resp.hits.hits[0]._source.content;
            for(var i = 0; i<deleteData.Schedule.length; i++){
                if(deleteData.Schedule[i].TaskID == deleteTaskID){
                    deleteData.Schedule.splice(i, 1);
                    break;
                }
            }

            elastic_client.update({
            index: 'prescription',
            type: 'test',
            id: 'AVSTq65UE6WR6MLDpwU3',
            
            body: {
                        "doc" : {"content" : addData},
                        "doc_as_upsert" : true
                }
            }, function(err, res) {

            if (err) {
                console.error(err.message);
                response.send(err.message);
            } else {
                console.log("Response : " + JSON.stringify(res));
                response.jsonp([]);
            }
            });
        }, function (err) {
            console.trace(err);
            addData = {"ERROR": err};
            response.jsonp({"ERROR": err});
        });
    });