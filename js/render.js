function checkFilterButtons(downloadQueueLength) {
    document.getElementById('queue_number').innerHTML = downloadQueueLength;
    if (downloadQueueLength > 1) {
        return;
    }
    else if (downloadQueueLength == 1) {
        document.querySelectorAll('.filter_button').forEach(button => {button.disabled = true; button.classList.remove('active')});
    }
    else {
        document.querySelectorAll('.filter_button').forEach(button => {button.disabled = false;});
    }
}

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
        projectDiv.style.order = project.order;
        parentElement.appendChild(projectDiv);
    } else {
        document.getElementById(`${project.id}_wrapper`).appendChild(projectDiv);
    }

    // Create projectDiv.
    projectDiv.setAttribute('id', project.id);
    projectDiv.classList.add('project');
    projectDiv.classList.add(project.parentProjectId);
    projectDiv.setAttribute('title', `Project ID: ${project.id}`);

    // Wrapper for project collapse button and title.
    var projectWrapperDiv = document.createElement("div");
    projectDiv.appendChild(projectWrapperDiv);

    // Collapse button.
    var collapseDiv = document.createElement("div");
    collapseDiv.classList.add('collapse_button');
    collapseDiv.setAttribute('title','collapse');
    collapseDiv.setAttribute('onclick', `this.parentElement.parentElement.classList.toggle('collapsed');this.innerHTML=this.innerHTML=='▼'?'▶':'▼';`);
    projectWrapperDiv.appendChild(collapseDiv);

    // Collapse button text.
    var collapseDivText = document.createTextNode('▼');
    collapseDiv.appendChild(collapseDivText);

    // Link to TeamCity project page.
    var projectLink = document.createElement("a");
    projectLink.classList.add('project_title');
    projectLink.setAttribute('href', project.webUrl);
    projectLink.setAttribute('target', '_blank');
    projectWrapperDiv.appendChild(projectLink);

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
    buildTypeDiv.style.order = buildType.order;
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
    if (build.statusChanged || (build.problemOccurrences && build.problemOccurrences.newFailed > 0)) {
        buildDiv.classList.add('newFailed');
    }

    // Link to TeamCity build page.
    var buildLink = document.createElement("a");
    if(build.branchName) {console.log(build.branchName)};
    buildLink.setAttribute('onclick', `get_build_details(${build.id});`);
    buildLink.setAttribute('target', '_blank');
    buildLink.setAttribute('title', `Branch: ${build.branchName}\nStatus: ${build.status}\nID ${build.id}\n# ${build.number}\nFinished ${new Date(build.unixTime).toLocaleString()}\n${build.statusText}`);
    buildDiv.appendChild(buildLink);

    // Text for TeamCity build link.
    var buildText = document.createTextNode('⬤');
    buildLink.appendChild(buildText);

}

function renderBuildDetails(buildId,messages,changes) {
    var parentElementId = document.getElementById(buildId).parentElement.parentElement.id;
    var buildDetails = document.querySelectorAll(`#${parentElementId} > .buildSteps`)[0];
    buildDetails.innerHTML = "";
    buildDetails.classList.remove('hidden');

    // Build button-bar
    var buildButtonBar = document.createElement('div');
    buildButtonBar.classList.add('header');
    buildButtonBar.classList.add('buildButtonBar');
    buildDetails.appendChild(buildButtonBar);

    // Show logs
    var buildMessagesButton = document.createElement('button');
    buildMessagesButton.classList.add('toggle');
    buildMessagesButton.classList.add('active');
    buildMessagesButton.setAttribute('onclick',
        `this.parentElement.getElementsByClassName('active')[0].classList.remove('active');
        this.classList.add('active');
        this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.remove('hidden');
        this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.add('hidden');`);
    buildMessagesButton.appendChild(document.createTextNode('Logs'));
    buildButtonBar.appendChild(buildMessagesButton);

    // Show changes
    var buildChangesButton = document.createElement('button');
    buildChangesButton.classList.add('toggle');
    buildChangesButton.setAttribute('onclick',
    `this.parentElement.getElementsByClassName('active')[0].classList.remove('active');
    this.classList.add('active');
    this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.add('hidden');
    this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.remove('hidden');`);
    buildChangesButton.appendChild(document.createTextNode('Blame'));
    buildButtonBar.appendChild(buildChangesButton);

    // Open build in TeamCity
    var buildLink = document.createElement('button');
    buildLink.setAttribute('onclick',`window.open('${teamcity_base_url}/viewLog.html?buildId=${buildId}&buildTypeId=${parentElementId};','build_${buildId}','fullscreen=yes');`)
    buildLink.appendChild(document.createTextNode(`Open in TeamCity ⧉`));
    buildButtonBar.appendChild(buildLink);

    // Close build details
    var buildCloseButton = document.createElement('button');
    buildCloseButton.setAttribute('onclick',`document.querySelectorAll('#${parentElementId} > .buildSteps')[0].classList.add('hidden');`)
    buildCloseButton.appendChild(document.createTextNode('Close'));
    buildButtonBar.appendChild(buildCloseButton);

    // Messages DIV
    var messagesDiv = document.createElement('div');
    messagesDiv.classList.add('messages');
    buildDetails.appendChild(messagesDiv);

    // Changes DIV
    var changesDiv = document.createElement('div');
    changesDiv.classList.add('changes');
    changesDiv.classList.add('hidden');
    buildDetails.appendChild(changesDiv);  

    Object.entries(messages).forEach(([key, message]) => {

        var messageP = document.createElement('p');
        messageP.classList.add('message');
        if (message.status == 2)
            messageP.classList.add('warning');
        if (message.status == 4)
            messageP.classList.add('error');
        var messageText = JSON.stringify(message.text);
        messageP.innerText = messageText;
        messagesDiv.appendChild(messageP);

    });

    if (changes.length == 0) {
        changesDiv.innerHTML = 'Nobody to blame... 😭';
    }

    Object.entries(changes).forEach(([key, change]) => {

        var versionDiv = document.createElement('div');
        var linkDiv = document.createElement('div');
        var userDiv = document.createElement('div');
        var timeDiv = document.createElement('div');
        userDiv.classList.add('build_user');
        //var filesDiv = document.createElement('div');
        versionDiv.innerHTML = `#${change.version}`;
        var fileList = change.files.file.map(file => file['relative-file']).join('\n');
        linkDiv.innerHTML = `<a href='${change.webUrl}' title='${fileList}'>#${change.comment}</a>`;
        userDiv.innerHTML = `<span class='build_user_name'>${change.user?change.user.name:'🤖'}</span>`;
        timeDiv.innerHTML = `<span class='build_time smaller'>${new Date(tcTimeToUnix(change.date)).toLocaleString()}</span>`;
        changesDiv.appendChild(versionDiv);
        changesDiv.appendChild(linkDiv);
        changesDiv.appendChild(userDiv);
        changesDiv.appendChild(timeDiv);

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