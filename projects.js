// API field selectors for optimization.
var project_fields = 'fields=id,name,webUrl,parentProjectId,projects(project),buildTypes(buildType(id,name,projectId,webUrl,builds))';
var buildType_fields = 'fields=build(id,buildTypeId,number,status,webUrl,finishOnAgentDate,statusText,failedToStart)';

/* Recursively add projects as JSON objects to array.
/
/  projects[]: Array to append projects to
/  projectId: (String) Project ID to recursively append
/
/  Note: Project IDs in exclude_projects[] are skipped
*/
async function append_projects_recursively(projects, projectId) {

    // Excluded projects are skipped entirely.
    if (exclude_projects.includes(projectId))
        return;

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
                throw 'Did not receive 200 OK.';
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
            projects.push(output);

            // Check for sub-projects to add
            if (output.projects.project) {
                Object.entries(output.projects.project).forEach(([key, value]) => {
                    append_projects_recursively(projects, value.id);
                });
            }

        })
        .catch(err => { console.log(err) })
}

function add_builds_to_buildtype(buildType) {
    fetch(`${teamcity_base_url}/app/rest/builds?locator=defaultFilter:false,state:(running:true,finished:true),buildType:(id:${buildType.id}),startDate:(date:${cutoffDateString},condition:after),count:${build_count}&${buildType_fields}`, {
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'include',
    })
        .then((result) => result.json())
        .then((output) => {
            buildType.builds = output;
            renderBuildType(buildType);
            if (buildType.builds.build) {
                Object.entries(buildType.builds.build).forEach(([key, build]) => {

                    if (build.finishOnAgentDate)
                        build.unixTime = tcTimeToUnix(build.finishOnAgentDate);

                    renderBuild(build);
                    
                })
            }
        })
        .catch(err => { console.log(err) })
}

// Convert TeamCity's weird time notation to Unix timestamp.
function tcTimeToUnix(tcTime) {
    split = tcTime.split('');
    year = split.slice(0, 4).join('');
    month = split.slice(4, 6).join('');
    day = split.slice(6, 8).join('');
    t = split.slice(8, 9).join('');
    hour = split.slice(9, 11).join('');
    minute = split.slice(11, 13).join('');
    second = split.slice(13, 15).join('');
    timezone = split.slice(15, 23).join('');
    var date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000${timezone}`);
    return date.getTime(); // Unix timestamp from Date object.
}

// Convert Date to TeamCity's weird time notation.
function DateToTcTime(date) {
    year = date.toISOString().substr(0, 4);
    month = date.toISOString().substr(5, 2);
    day = date.toISOString().substr(8, 2);
    hour = '00'; // Well... let's not get nitty gritty here.
    minute = '00';
    second = '00';
    timezone = '%2B0000';
    var tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}`; // 20221206T080035+0100
    return tcTime;
}

// Cut-off date in TeamCity's weird time notation.
var cutoffDateString = DateToTcTime(new Date(new Date().getDate() - build_cutoff_days));
