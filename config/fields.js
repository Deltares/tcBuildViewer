/* Fields
/  
/ set all field variables to get from the api.
*/

class ApiTcFields {

    //constructor() {
        
        static fields = `{
            "project_fields":{
                "id": "id",
                "name": "name",
                "parentProjectId": "parentProjectId",
                "projects": {
                    "project": {
                        "id": "id"
                    }
                },
                "buildTypes": {
                    "buildType": {
                        "id": "id",
                        "name": "name",
                        "projectId": "projectId"
                    }
                }
            },
            "important_fields":{
                "id": "id",
                "name": "name"
            },
            "buildType_fields":{
                "build": {
                    "id": "id",
                    "state": "state",
                    "buildTypeId": "buildTypeId",
                    "number": "number",
                    "branchName": "branchName",
                    "status": "status",
                    "tags": {
                        "tag": "tag"
                    },
                    "agent": {
                        "id": "id",
                        "name": "name"
                    },
                    "plannedAgent": {
                        "id": "id",
                        "name": "name"
                    },
                    "finishOnAgentDate": "finishOnAgentDate",
                    "finishEstimate": "finishEstimate",
                    "running-info": {
                        "leftSeconds": "leftSeconds"
                    },
                    "statusText": "statusText",
                    "failedToStart": "failedToStart",
                    "problemOccurrences": "problemOccurrences",
                    "testOccurrences": {
                        "count": "count",
                        "muted": "muted",
                        "ignored": "ignored",
                        "passed": "passed",
                        "failed": "failed",
                        "newFailed": "newFailed"
                    }
                }
            },
            "message_fields": {
                "messages": "messages"
            },
            "buildDetails_fields": {
                "count": "count",
                "passed": "passed",
                "failed": "failed",
                "muted": "muted",
                "ignored": "ignored",
                "newFailed": "newFailed",
                "testOccurrence": {
                    "id": "id",
                    "name": "name",
                    "status": "status",
                    "details": "details",
                    "newFailure": "newFailure",
                    "muted": "muted",
                    "failed": "failed",
                    "ignored": "ignored",
                    "test": {
                        "id": "id",
                        "name": "name",
                        "parsedTestName": "parsedTestName",
                        "investigations": {
                            "investigation": {
                                "assignee": "assignee"
                            }
                        }
                    },
                    "logAnchor": "logAnchor"
                }
            },
            "change_fields": {
                "change": {
                    "id": "id",
                    "date": "date",
                    "version": "version",
                    "user": "user",
                    "username": "username",
                    "comment": "comment",
                    "files": {
                        "file": {
                            "file": "file",
                            "relative-file": "relative-file"
                        }
                    }
                }
            },
            "testOccurrences_fields": {
                "newFailed": "newFailed",
                "testOccurrence": {
                    "status": "status",
                    "currentlyInvestigated": "currentlyInvestigated"
                },
                "ignored": "ignored",
                "muted": "muted",
                "passed": "passed",
                "count": "count"
            },
            "progressinfo_fields": {
                "estimatedTotalSeconds": "estimatedTotalSeconds"
            }
        }`
    //}
}