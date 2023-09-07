// API field selectors for optimization.
const project_fields         = 'fields=id,name,webUrl,parentProjectId,projects(project),buildTypes(buildType(id,name,projectId,webUrl,builds))'
const buildType_fields       = 'fields=build(id,state,buildTypeId,number,branchName,status,webUrl,finishOnAgentDate,finishEstimate,running-info(leftSeconds),statusText,failedToStart,problemOccurrences,testOccurrences(count,muted,ignored,passed,failed,newFailed))'
const message_fields         = 'fields=messages'
const buildDetails_fields    = 'fields=webUrl,count,passed,failed,muted,ignored,newFailed,testOccurrence(id,name,status,details,newFailure,muted,failed,ignored,test(id,name,parsedTestName,href,investigations(investigation(assignee))),build(id,buildTypeId),logAnchor)'
const change_fields          = 'fields=change:(date,version,user,comment,webUrl,files:(file:(file,relative-file)))'
const progressinfo_fields    = 'fields=estimatedTotalSeconds'

// Keep track of pending downloads.
let download_queue_length = 0

/* PROJECTS
/  
/  Recursively traverse (sub-)projects
/
/  projects[]: Array to append projects to
/  projectId: (String) Project ID to recursively append
/  parentProjectStats: keep track of cumulative stats of all projects
/  parentProjectIds: List of project ID's that are parents
/
/  Note: Project IDs in exclude_projects[] are skipped
*/
async function append_projects_recursively(projectId, order, parentProjectStats, parentProjectIds) {

    // Excluded projects are skipped entirely.
    if (selection.exclude_projects.includes(projectId))
        return

    // Should be array instead of undefined 
    if (!parentProjectStats) {
        parentProjectStats = []
        parentProjectIds = []
    }

    parentProjectIds.push(projectId)

    // Will enable/disable buttons when there are downloads in progress.
    checkFilterButtons(++download_queue_length)

    fetch(`${teamcity_base_url}/app/rest/projects/id:${projectId}?${project_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
        priority: 'high',
    }, this)
    .then((result) => {
        if (result.status == 200) {
            return result.json()
        } else {
            return Promise.reject('User not logged in.')
        }
    })
    .then((project) => {

        let projectStats = {}

        project.order = order // Consistent ordering of projects.

        projectStats.newFailed = 0
        projectStats.failedInvestigated = 0
        projectStats.failedNotInvestigated = 0
        projectStats.ignored = 0
        projectStats.muted = 0
        projectStats.passed = 0
        projectStats.count = 0
        parentProjectStats[project.id] = projectStats;

        // For quick reference, store the element with the project.
        project.div = renderProject(project)

        // Check for builds to add to project.
        if (project.buildTypes.buildType) {

            Object.entries(project.buildTypes.buildType).forEach(([key, buildType]) => {
                buildType.order = key // Consistent ordering of buildTypes.
                add_builds_to_buildtype(project.buildTypes.buildType[key], parentProjectStats, parentProjectIds)
            }, this)

        }
        
        // Check for sub-projects.
        if (project.projects.project) {
            Object.entries(project.projects.project).forEach(([key, subproject]) => {
                append_projects_recursively(subproject.id, project.buildTypes?project.buildTypes.buildType.length+key:key, parentProjectStats, [...parentProjectIds]) // Make sure that projects are below the buildTypes.
            }, this)
        }

    })
    .catch(err => { console.log(err) })
    .finally(() => {checkFilterButtons(--download_queue_length)})
}

/* BUILDTYPES & BUILDS
/
/  projects[]: Array to append projects to
/  projectId: (String) Project ID to recursively append
/  parentProjectStats: keep track of cumulative stats of all projects
/  parentProjectIds: List of project ID's that are parents
/
/  Note: Project IDs in exclude_projects[] are skipped
*/
async function add_builds_to_buildtype(buildType, parentProjectStats, parentProjectIds) {

    // Will enable/disable buttons when there are downloads in progress.
    checkFilterButtons(++download_queue_length)

    let time_boundries
    if (end_time) {
        time_boundries = `queuedDate:(date:${cutoffTcString(htmlDateTimeToDate(end_time))},condition:after),queuedDate:(date:${htmlDateTimeToTcTime(end_time)},condition:before)`
    } else {
        time_boundries = `queuedDate:(date:${cutoffTcString()},condition:after)`
    }

    fetch(`${teamcity_base_url}/app/rest/builds?locator=defaultFilter:false,branch:<default>,state:any,buildType:(id:${buildType.id}),${time_boundries},count:${build_count}&${buildType_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
        priority: 'high',
    },this)
    .then((result) => result.json())
    .then((output) => {

        buildType.builds = output

        // Check if the latest build result has changed.
        if (buildType.builds.build?.[0]?.problemOccurrences?.newFailed > 0) {
            buildType.statusChanged = true
        } else if (buildType.builds.build?.[0]?.status != buildType.builds.build[1]?.status) {
            buildType.statusChanged = true
        } else if (buildType.builds.build?.[0]?.testOccurrences?.passed != buildType.builds.build[1]?.testOccurrences?.passed) {
            buildType.statusChanged = true
        } else {
            buildType.statusChanged = false
        }

        // The last build determines the buildtype status.
        if (buildType.builds.build?.[0]?.status) {
            buildType.status = buildType.builds.build?.[0]?.status
        }

        renderBuildType(buildType)

        // Check for every build if the result has changed since the previous build.
        if (buildType.builds.build?.[0]) {

            let build = buildType.builds.build

            build.stats = add_tests_to_build(buildType.builds.build?.[0]?.id, parentProjectStats, parentProjectIds)

            for (i=0; i<build.length; i++) {

                if (build[i].testOccurrences?.passed != build[i+1]?.testOccurrences?.passed) {
                    build[i].statusChanged = true
                }

                // Add Unix timestamp for future functions.
                if (build[i].finishOnAgentDate) {
                    build[i].unixTime = tcTimeToUnix(build[i].finishOnAgentDate)
                }
                else if (build[i].finishEstimate) {
                    build[i].unixTime = tcTimeToUnix(build[i].finishEstimate)
                }
                else if (build[i]['running-info']) {
                    build[i].unixTime = (Date.now() + build[i]['running-info'].leftSeconds * 1000)
                    console.log(build[i].unixTime)
                }

                renderBuild(build[i])

            };

        }
    })
    .catch(err => { console.log(err) })
    .finally(() => {checkFilterButtons(--download_queue_length)})
}

// Display test results of buildId to the build type and (parent)projects.
async function add_tests_to_build(buildId, parentProjectStats, parentProjectIds) {
    //fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=build:(id:${buildId}),status:FAILURE,currentlyInvestigated:false`, {
    fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=build:(id:${buildId}),count:1000`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
        priority: 'low',
    },this)
    .then((result) => result.json())
    .then((output) => {
        if (output.testOccurrence) {
            let buildStats = Object();
            buildStats.buildId = buildId
            buildStats.testOccurrences = output
            renderBuildTypeStats(buildStats, parentProjectStats, parentProjectIds)
        }

    })
    .catch(err => { console.log(err) })
}

// On-demand information when a build is clicked.
async function get_build_details(buildId) {

    // MESSAGES
    let messagesRequest = await fetch(`${teamcity_base_url}/app/messages?buildId=${buildId}&filter=important&${message_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let messagesJSON = await messagesRequest.json()

    let messages = messagesJSON.messages

    // FAILED TESTS
    let testsRequestFailed = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(failure)&${buildDetails_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsFailedJSON = await testsRequestFailed.json()

    // ERROR TESTS
    let testsRequestError = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(error)&${buildDetails_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsErrorJSON = await testsRequestError.json()

    // WARNING TESTS
    let testsRequestWarning = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(warning)&${buildDetails_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsWarningJSON = await testsRequestWarning.json()

    // UNKNOWN TESTS
    let testsRequestUnknown = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(unknown)&${buildDetails_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsUnknownJSON = await testsRequestUnknown.json()

    let tests = []
    tests = tests.concat(testsFailedJSON.testOccurrence, testsErrorJSON.testOccurrence, testsWarningJSON.testOccurrence, testsUnknownJSON.testOccurrence)

    // CHANGES (svn commits)
    let changesRequest = await fetch(`${teamcity_base_url}/app/rest/changes?locator=build:(id:${buildId})&${change_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let changesJSON = await changesRequest.json()

    let changes = changesJSON.change

    renderBuildDetails(buildId, messages, tests, changes)
}

// RECURSIVE BUILD MESSAGES
async function get_more_messages(buildId,messageId) {

    let messagesRequest = await fetch(`${teamcity_base_url}/app/messages?buildId=${buildId}&filter=important&messageId=${messageId}&view=flowAware&_focus=${messageId}%23_state%3D0%2C${messageId}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let messagesJSON = await messagesRequest.json()

    let messages = messagesJSON.messages.filter((message) => {return message.parentId == messageId})

    return messages

}
