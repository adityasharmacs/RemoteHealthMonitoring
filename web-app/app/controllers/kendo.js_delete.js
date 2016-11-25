    /* Kendo Scheduler for prescriptions*/
            $scope.schedulerOptions = {
            date: new Date("2016/1/1"),
            startTime: new Date("2016/1/1 07:00 AM"),
            height: 600,
            views: [
                "day",
                { type: "workWeek", selected: true },
                "week",
                "month",
            ],
            timezone: "Etc/UTC",
            dataSource: {
                batch: true,
                transport: {
                    read: {
                        url: "http://localhost:5000/api/search-prescription",
                        //url: "demos.telerik.com/kendo-ui/service/tasks",
                        dataType: "jsonp"
                    },
                    update: {
                        url: "http://localhost:5000/api/update-prescription",
                        dataType: "jsonp"
                    },
                    create: {
                        url: "http://localhost:5000/api/add-prescription",
                        dataType: "jsonp"
                    },
                    destroy: {
                        url: "http://localhost:5000/api/delete-prescription",
                        dataType: "jsonp"
                    },
                    parameterMap: function(options, operation) {
                        if (operation !== "read" && options.models) {
                            return {models: kendo.stringify(options.models)};
                        }
                    }
                },
                schema: {
                    model: {
                        id: "taskId",
                        fields: {
                            taskId: { from: "TaskID", type: "number" },
                            title: { from: "Title", defaultValue: "No title", validation: { required: true } },
                            start: { type: "date", from: "Start" },
                            end: { type: "date", from: "End" },
                            startTimezone: { from: "StartTimezone" },
                            endTimezone: { from: "EndTimezone" },
                            description: { from: "Description" },
                            recurrenceId: { from: "RecurrenceID" },
                            recurrenceRule: { from: "RecurrenceRule" },
                            recurrenceException: { from: "RecurrenceException" },
                            ownerId: { from: "OwnerID", defaultValue: 1 },
                            isAllDay: { type: "boolean", from: "IsAllDay" }
                        }
                    }
                },
                filter: {
                    logic: "or",
                    filters: [
                        { field: "ownerId", operator: "eq", value: 1 },
                        { field: "ownerId", operator: "eq", value: 2 }
                    ]
                }
            },
            resources: [
                {
                    field: "ownerId",
                    title: "Owner",
                    dataSource: [
                        { text: "Bob", value: 2, color: "#51a0ed" },
                    ]
                }
            ]
        };