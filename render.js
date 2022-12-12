/*  Input: array of project IDs to render. */
function initiateProjectElements(include_projects) {

    document.getElementById('_projects').innerHTML = ''; // Clean slate.

    // Prepare wrapper elements for your included projects.
    // This is necessary for consistent ordering.
    for (project of include_projects) {
        var projectWrapper = document.createElement("div");
        projectWrapper.setAttribute('id', `${project}_wrapper`)
        projectWrapper.classList.add('project_wrapper');
        document.getElementById('_projects').appendChild(projectWrapper);
    };

}

function renderProject(project) {

    // Add project to parent project.
    var projectDiv = document.createElement("div");
    var parentElement = document.getElementById(project.parentProjectId);
    if (parentElement) {
        parentElement.appendChild(projectDiv);
    } else {
        document.getElementById(`${project.id}_wrapper`).appendChild(projectDiv);
    }

    // Create projectDiv.
    projectDiv.setAttribute('id', project.id);
    projectDiv.classList.add('project');
    projectDiv.classList.add(project.parentProjectId);
    projectDiv.setAttribute('title', `Project ID: ${project.id}`);

    // Link to TeamCity project page.
    var projectLink = document.createElement("a");
    projectLink.setAttribute('href', project.webUrl);
    projectLink.setAttribute('target', '_blank');
    projectDiv.appendChild(projectLink);

    // Text for TeamCity project link.
    var projectText = document.createTextNode(`${project.name}`);
    projectLink.appendChild(projectText);

    // Icon ⧉ for the TeamCity project link.
    var projectLinkIconText = document.createTextNode('⧉');
    var projectLinkIcon = document.createElement("div");
    projectLinkIcon.appendChild(projectLinkIconText);
    projectLinkIcon.classList.add('linkIcon');
    projectLink.appendChild(projectLinkIcon);

}

// Add buildType to project.
function renderBuildType(buildType) {

    // Skip build types with no builds.
    if (!buildType.builds.build[0])
        return;

    // Add buildType to project.
    var buildTypeDiv = document.createElement("div");
    var parentElement = document.getElementById(buildType.projectId);
    parentElement.appendChild(buildTypeDiv);

    // Create buildTextDiv.
    buildTypeDiv.setAttribute('id', buildType.id);
    buildTypeDiv.setAttribute('title',`BuildType ID: ${buildType.id}`);
    buildTypeDiv.classList.add('buildType');
    buildTypeDiv.classList.add(buildType.projectId);

    // Add status of last build as class.
    buildTypeDiv.classList.add(buildType.builds.build[0].status);

    // Add statusChanged when the last build status is different.
    if (buildType.statusChanged) {
        buildTypeDiv.classList.add('statusChanged');
    }

    // Link to TeamCity build type page.
    var buildTypeLink = document.createElement("a");
    buildTypeLink.setAttribute('href', buildType.webUrl);
    buildTypeLink.setAttribute('target', '_blank');
    buildTypeDiv.appendChild(buildTypeLink);

    // Text for the buildType.
    var buildTypeText = document.createTextNode(buildType.name);
    buildTypeLink.appendChild(buildTypeText);

    // Icon ⧉ for the TeamCity build type link.
    var buildTypeLinkIconText = document.createTextNode('⧉');
    var buildTypeLinkIcon = document.createElement("div");
    buildTypeLinkIcon.appendChild(buildTypeLinkIconText);
    buildTypeLinkIcon.classList.add('linkIcon');
    buildTypeLink.appendChild(buildTypeLinkIcon);

    // Element to hold the list of builds.
    var buildListDiv = document.createElement("div");
    buildListDiv.setAttribute('id', buildType.id + '_buildList');
    buildListDiv.classList.add('buildList');
    buildTypeDiv.appendChild(buildListDiv);

    var buildStepsText = document.createTextNode('🚧 Will fetch and display the (status of) individual build steps.');
    var buildSteps = document.createElement("div");
    buildSteps.appendChild(buildStepsText);
    buildSteps.classList.add('buildSteps');
    buildSteps.classList.add('hidden');
    buildTypeDiv.appendChild(buildSteps);

}

// Add build to buildList.
function renderBuild(build) {

    // Add build to buildList.
    var buildDiv = document.createElement("div");
    var parentElement = document.getElementById(build.buildTypeId + '_buildList');
    parentElement.prepend(buildDiv);

    // Create buildDiv.
    buildDiv.setAttribute('id', build.id);
    buildDiv.classList.add('build');
    buildDiv.classList.add(build.buildTypeId);
    buildDiv.classList.add(build.status);
    if (build.problemOccurrences && build.problemOccurrences.newFailed > 0)
        buildDiv.classList.add('newFailed');

    // Link to TeamCity build page.
    var buildLink = document.createElement("a");
    //buildLink.setAttribute('href', build.webUrl);
    
    buildLink.setAttribute('onclick', `get_messages_for_build(${build.id})`);
    buildLink.setAttribute('target', '_blank');
    buildLink.setAttribute('title', `Status: ${build.status}\nID ${build.id}\n# ${build.number}\nFinished ${new Date(build.unixTime).toLocaleString()}\n${build.statusText}`);
    buildDiv.appendChild(buildLink);

    // Text for TeamCity build link.
    //var buildText = document.createTextNode(build.status=='UNKNOWN'?'⚠':'⬤');
    var buildText = document.createTextNode('⬤');
    buildLink.appendChild(buildText);

}


function renderMessages(buildId,messages) {
    var parentElementId = document.getElementById(buildId).parentElement.parentElement.id;
    var buildSteps = document.querySelectorAll(`#${parentElementId} > .buildSteps`)[0];
    buildSteps.innerHTML = "";
    buildSteps.classList.remove('hidden');
    //buildStepsText.classList.add('code');
    Object.entries(messages).forEach(([key, message]) => {

        var messageP = document.createElement('p');
        messageP.classList.add('message');
        if (message.status == 2)
            messageP.classList.add('warning');
        if (message.status == 4)
            messageP.classList.add('error');
        var messageText = JSON.stringify(message.text);
        messageP.innerText = messageText;
        buildSteps.appendChild(messageP);

    });

}

// Show or hide all build types of which the last build was successful.
function toggleGreen() {

    var greenBuildTypes = document.querySelectorAll('#_projects div.buildType.SUCCESS');

    for (item of greenBuildTypes) {
        item.classList.toggle('hidden');
    };

};

// Show or hide all build types of which the last build was successful.
function toggleUnchangedBuildTypes() {

    var unchangedBuildTypes = document.querySelectorAll('#_projects div.buildType:not(.statusChanged)');

    for (item of unchangedBuildTypes) {
        item.classList.toggle('hidden_statusChanged');
    };

};