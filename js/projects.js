// API field selectors for optimization.
//const project_fields       = 'fields=id,name,webUrl,parentProjectId,projects(project),buildTypes(buildType(id,name,projectId,webUrl,builds,investigations(investigation(id,state,assignee,assignment,scope,target))))'
const project_fields         = 'fields=id,name,webUrl,parentProjectId,projects(project),buildTypes(buildType(id,name,projectId,webUrl,builds))'
const buildType_fields       = 'fields=build(id,buildTypeId,number,branchName,status,webUrl,finishOnAgentDate,statusText,failedToStart,problemOccurrences,testOccurrences(count,muted,ignored,passed,newFailed))'
const buildType_tests_fields = 'fields=testOccurrences(count,muted,ignored,passed,newFailed,testOccurrence(status,currentlyInvestigated))'
//const build_fields         = 'fields=buildType(steps(step))'
const message_fields         = 'fields=messages'
const tests_fields           = 'fields=webUrl,count,passed,failed,muted,ignored,newFailed,testOccurrence(id,name,status,details,newFailure,muted,failed,ignored,test(id,name,parsedTestName,href,investigations(investigation(assignee))),build(id,buildTypeId),logAnchor)'
const change_fields          = 'fields=change:(date,version,user,comment,webUrl,files:(file:(file,relative-file)))'
const investigation_fields   = ''

// Keep track of pending downloads.
let download_queue_length = 0

/* Recursively add projects as JSON objects to array.
/
/  projects[]: Array to append projects to
/  projectId: (String) Project ID to recursively append
/
/  Note: Project IDs in exclude_projects[] are skipped
*/
async function append_projects_recursively(projectId, order) {

    // Excluded projects are skipped entirely.
    if (selection.exclude_projects.includes(projectId))
        return
    
    // Will enable/disable buttons when there are downloads in progress.
    checkFilterButtons(++download_queue_length)

    fetch(`${teamcity_base_url}/app/rest/projects/id:${projectId}?${project_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
        priority: 'high',
    })
        .then((result) => {
            if (result.status == 200) {
                return result.json()
            } else {
                return Promise.reject('User not logged in.')
            }
        })
        .then((project) => {

            project.order = order // Consistent ordering of projects.

            project.testNewFailed = 0
            project.testMuted     = 0
            project.testIgnored   = 0
            project.testPassed    = 0
            project.testCount     = 0
            project.failedNotInvestigated = 0

            project.div = renderProject(project)

            // Check for builds to add to project
            if (project.buildTypes.buildType) {
                project.buildTypes.buildType = project.buildTypes.buildType.filter((buildType) => {console.log(buildType)})
                let promiseList = []
                Object.entries(project.buildTypes.buildType).forEach(([key, buildType]) => {
                    buildType.order = key // Consistent ordering of buildTypes.
                    promiseList.push(add_builds_to_buildtype(project.buildTypes.buildType[key], project))
                })
                let start = new Date()
                Promise.all(promiseList).then(() => {/*renderProjectTestStatistics(project)*/})
            }
            
            // Check for sub-projects to add
            if (project.projects.project) {
                Object.entries(project.projects.project).forEach(([key, subproject]) => {
                    append_projects_recursively(subproject.id, project.buildTypes?project.buildTypes.buildType.length+key:key) // Make sure that projects are below the buildTypes.
                })
            }

        })
        .catch(err => { console.log(err) })
        .finally(() => {checkFilterButtons(--download_queue_length)})
}

async function add_builds_to_buildtype(buildType, project) {

    // Will enable/disable buttons when there are downloads in progress.
    checkFilterButtons(++download_queue_length)

    let promise = fetch(`${teamcity_base_url}/app/rest/builds?locator=defaultFilter:false,state:(finished:true),buildType:(id:${buildType.id}),startDate:(date:${cutoffTcString()},condition:after),count:${build_count}&${buildType_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
        priority: 'high',
    },this)
        .then((result) => result.json())
        .then((output) => {

            buildType.builds = output

            buildType.failedNotInvestigated = 0

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

            if (buildType.builds.build?.[0]?.status) {
                buildType.status = buildType.builds.build?.[0]?.status
            }

            renderBuildType(buildType)

            // Check for every build if the result has changed since the previous build.
            if (buildType.builds.build?.[0]) {

                let build = buildType.builds.build

                build.stats = add_tests_to_build(buildType.builds.build?.[0]?.id)
/*
                // Add cumulative test statistics to project.
                if (build[0].testOccurrences) {
                    project.testNewFailed += build[0].testOccurrences.newFailed?build[0].testOccurrences.newFailed:0
                    project.testMuted     += build[0].testOccurrences.muted?build[0].testOccurrences.muted:0
                    project.testIgnored   += build[0].testOccurrences.ignored?build[0].testOccurrences.ignored:0
                    project.testPassed    += build[0].testOccurrences.passed?build[0].testOccurrences.passed:0
                    project.testCount     += build[0].testOccurrences.count?build[0].testOccurrences.count:0
                    project.failedNotInvestigated += buildType.failedNotInvestigated
                }
*/
                for (i=0; i<build.length; i++) {

                    if (build[i].testOccurrences?.passed != build[i+1]?.testOccurrences?.passed) {
                        build[i].statusChanged = true
                    }

                    // Add Unix timestamp for future functions.
                    if (build[i].finishOnAgentDate) {
                        build[i].unixTime = tcTimeToUnix(build[i].finishOnAgentDate)
                    }

                    renderBuild(build[i])

                };

            }
        })
        .catch(err => { console.log(err) })
        .finally(() => {checkFilterButtons(--download_queue_length)})

    return promise
}

async function add_tests_to_build(buildId) {

    let promise = fetch(`${teamcity_base_url}/app/rest/builds/id:${buildId}?${buildType_tests_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
        priority: 'low',
    },this)
        .then((result) => result.json())
        .then((output) => {

            if (output.testOccurrences) {
                let buildStats = Object();
                buildStats.buildId = buildId
                buildStats.testOccurrences = output.testOccurrences
                renderBuildTypeStats(buildStats)
            }

        })
        .catch(err => { console.log(err) })

    return promise
}

// On-demand information when a build is clicked.
async function get_build_details(buildId) {

    let messagesRequest = await fetch(`${teamcity_base_url}/app/messages?buildId=${buildId}&${message_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let messagesJSON = await messagesRequest.json()

    let messages = messagesJSON.messages

    let testsRequestFailed = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(failure)&${tests_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsFailedJSON = await testsRequestFailed.json()

    let testsRequestError = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(error)&${tests_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsErrorJSON = await testsRequestError.json()

    let testsRequestWarning = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(warning)&${tests_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsWarningJSON = await testsRequestWarning.json()

    let testsRequestUnknown = await fetch(`${teamcity_base_url}/app/rest/testOccurrences?locator=count:-1,build:(id:${buildId}),status:(unknown)&${tests_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let testsUnknownJSON = await testsRequestUnknown.json()

    let tests = []
    tests = tests.concat(testsFailedJSON.testOccurrence, testsErrorJSON.testOccurrence, testsWarningJSON.testOccurrence, testsUnknownJSON.testOccurrence)

    let changesRequest = await fetch(`${teamcity_base_url}/app/rest/changes?locator=build:(id:${buildId})&${change_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })

    let changesJSON = await changesRequest.json()

    let changes = changesJSON.change

    renderBuildDetails(buildId, await messages, await tests, await changes)
}

// Convert TeamCity's weird time notation to Unix timestamp.
function tcTimeToUnix(tcTime) {
    split    = tcTime.split('')
    year     = split.slice(0, 4).join('')
    month    = split.slice(4, 6).join('')
    day      = split.slice(6, 8).join('')
    t        = split.slice(8, 9).join('')
    hour     = split.slice(9, 11).join('')
    minute   = split.slice(11, 13).join('')
    second   = split.slice(13, 15).join('')
    timezone = split.slice(15, 23).join('')
    let date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000${timezone}`)
    return date.getTime() // Unix timestamp from Date object.
}

// Convert Date to TeamCity's weird time notation.
function DateToTcTime(date) {
    year     = date.toISOString().substr(0, 4)
    month    = date.toISOString().substr(5, 2)
    day      = date.toISOString().substr(8, 2)
    hour     = '00' // Well... let's not get nitty gritty here.
    minute   = '00'
    second   = '00'
    timezone = '%2B0000' // +0000
    let tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}` // TeamCity time format: 20221206T080035+0100
    return tcTime
}

// Cut-off date in TeamCity's weird time notation, used for API calls.
const cutoffTcString = function () {
    let d = new Date()
    d.setDate(d.getDate()-build_cutoff_days)
    return DateToTcTime(d)
}

// Ol' reliable Unix-time.
const cutoffUnixTime = function () {
    let d = new Date()
    d.setDate(d.getDate()-build_cutoff_days)
    return d.getTime()
};