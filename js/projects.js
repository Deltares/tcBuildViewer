// API field selectors for optimization.
var project_fields = 'fields=id,name,webUrl,parentProjectId,projects(project),buildTypes(buildType(id,name,projectId,webUrl,builds))';
var buildType_fields = 'fields=build(id,buildTypeId,number,status,webUrl,finishOnAgentDate,statusText,failedToStart,problemOccurrences,testOccurrences)';
var build_fields = 'fields=buildType(steps(step))';
var message_fields = 'fields=messages';
var change_fields = 'fields=change:(date,version,username,comment,webUrl,files)';

// Keep track of pending downloads.
var download_queue_length = 0;

/* Recursively add projects as JSON objects to array.
/
/  projects[]: Array to append projects to
/  projectId: (String) Project ID to recursively append
/
/  Note: Project IDs in exclude_projects[] are skipped
*/
async function append_projects_recursively(projectId) {

    // Excluded projects are skipped entirely.
    if (selection.exclude_projects.includes(projectId))
        return;
    
    checkFilterButtons(++download_queue_length);

    fetch(`${teamcity_base_url}/app/rest/projects/id:${projectId}?${project_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
        .then((result) => {
            if (result.status == 200) {
                return result.json();
            } else {
                return Promise.reject('User not logged in.');
            }
        })
        .then((output) => {

            // Check for builds to add to project
            if (output.buildTypes.buildType) {
                Object.entries(output.buildTypes.buildType).forEach(([key, value]) => {
                    add_builds_to_buildtype(output.buildTypes.buildType[key], value.id);
                });
            }

            renderProject(output);

            // Check for sub-projects to add
            if (output.projects.project) {
                Object.entries(output.projects.project).forEach(([key, value]) => {
                    append_projects_recursively(value.id);
                });
            }
        })
        .catch(err => { console.log(err) })
        .finally(() => {checkFilterButtons(--download_queue_length);});
}

function add_builds_to_buildtype(buildType) {

    checkFilterButtons(++download_queue_length);

    fetch(`${teamcity_base_url}/app/rest/builds?locator=defaultFilter:false,state:(finished:true),buildType:(id:${buildType.id}),startDate:(date:${cutoffTcString()},condition:after),count:${build_count}&${buildType_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
        .then((result) => result.json())
        .then((output) => {
            buildType.builds = output;
            // Check if the build result is changed with the last build.
            
            if (buildType.builds.build && buildType.builds.build.length > 0 && buildType.builds.build[0].problemOccurrences && buildType.builds.build[0].problemOccurrences.newFailed && buildType.builds.build[0].problemOccurrences.newFailed > 0) {
                buildType.statusChanged = true;
                
            } else if (buildType.builds.build && buildType.builds.build.length > 1 && buildType.builds.build[0].status != buildType.builds.build[1].status) {
                buildType.statusChanged = true;
            } else if (buildType.builds.build && buildType.builds.build.length > 1 && buildType.builds.build[0].testOccurrences && buildType.builds.build[0].testOccurrences.passed != buildType.builds.build[1].testOccurrences.passed) {
                buildType.statusChanged = true;
            } else {
                buildType.statusChanged = false;
            }
            renderBuildType(buildType);
            if (buildType.builds.build) {
                
                for (i=0; i<buildType.builds.build.length; i++) {

                    if (buildType.builds.build[i+1]) {
                        
                        if (buildType.builds.build[i].testOccurrences && buildType.builds.build[i+1].testOccurrences &&
                            buildType.builds.build[i].testOccurrences.passed != buildType.builds.build[i+1].testOccurrences.passed) {
                            buildType.builds.build[i].statusChanged = true;
                        }
                    }

                    if (buildType.builds.build[i].finishOnAgentDate) {
                        buildType.builds.build[i].unixTime = tcTimeToUnix(buildType.builds.build[i].finishOnAgentDate);
                    }

                    renderBuild(buildType.builds.build[i]);

                };

            }
        })
        .catch(err => { console.log(err) })
        .finally(() => {checkFilterButtons(--download_queue_length);});
}

async function get_build_details(buildId) {

    let messagesRequest = await fetch(`${teamcity_base_url}/app/messages?buildId=${buildId}&${message_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    });

    let messagesJSON = await messagesRequest.json();

    var messages = messagesJSON.messages;

    let changesRequest = await fetch(`${teamcity_base_url}/app/rest/changes?locator=build:(id:${buildId})&${change_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    });

    let changesJSON = await changesRequest.json();

    var changes = changesJSON.change;

    renderBuildDetails(buildId, await messages, await changes);
}

// Convert TeamCity's weird time notation to Unix timestamp.
function tcTimeToUnix(tcTime) {
    split    = tcTime.split('');
    year     = split.slice(0, 4).join('');
    month    = split.slice(4, 6).join('');
    day      = split.slice(6, 8).join('');
    t        = split.slice(8, 9).join('');
    hour     = split.slice(9, 11).join('');
    minute   = split.slice(11, 13).join('');
    second   = split.slice(13, 15).join('');
    timezone = split.slice(15, 23).join('');
    var date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000${timezone}`);
    return date.getTime(); // Unix timestamp from Date object.
}

// Convert Date to TeamCity's weird time notation.
function DateToTcTime(date) {
    year     = date.toISOString().substr(0, 4);
    month    = date.toISOString().substr(5, 2);
    day      = date.toISOString().substr(8, 2);
    hour     = '00'; // Well... let's not get nitty gritty here.
    minute   = '00';
    second   = '00';
    timezone = '%2B0000'; // +0000
    var tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}`; // TeamCity time format: 20221206T080035+0100
    return tcTime;
}

// Cut-off date in TeamCity's weird time notation.
var cutoffTcString = function () {
    var d = new Date();
    d.setDate(d.getDate()-build_cutoff_days);
    return DateToTcTime(d)
}

// Ol' reliable Unix-time.
var cutoffUnixTime = function () {
    var d = new Date();
    d.setDate(d.getDate()-build_cutoff_days);
    return d.getTime()
};