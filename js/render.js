// Will enable/disable buttons when there are downloads in progress.
function checkFilterButtons(downloadQueueLength) {

    document.getElementById('queue_number').innerHTML = downloadQueueLength

    if (downloadQueueLength > 1) {
        return // Action is only necessary when the queue is 0 or 1.
    }
    else if (downloadQueueLength == 1) {
        document.querySelectorAll('.filter_button').forEach(button => {button.disabled = true; button.classList.remove('active')})
    }
    else {
        document.querySelectorAll('.filter_button').forEach(button => {button.disabled = false})
    }

}

/*  Input: array of project IDs to render. */
function initiateProjectElements(include_projects) {

    document.getElementById('_projects').innerHTML = '' // Clean slate.

    // Prepare wrapper elements for your included projects.
    // This is necessary for consistent ordering.
    for (project of include_projects) {
        let projectWrapper = document.createElement("div")
        projectWrapper.setAttribute('id', `${project}_wrapper`)
        projectWrapper.classList.add('project_wrapper')
        document.getElementById('_projects').appendChild(projectWrapper)
    };

}

function renderProject(project) {

    // Add project to parent project.
    let projectDiv = document.createElement("div")
    let parentElement = document.getElementById(project.parentProjectId)
    if (parentElement) {
        projectDiv.style.order = project.order
        parentElement.appendChild(projectDiv)
    } else {
        document.getElementById(`${project.id}_wrapper`).appendChild(projectDiv)
    }

    // Create projectDiv.
    projectDiv.setAttribute('id', project.id)
    projectDiv.classList.add('project')
    projectDiv.classList.add(project.parentProjectId)
    projectDiv.setAttribute('title', `Project ID: ${project.id}`)

    // Wrapper for project collapse button and title.
    let projectWrapperDiv = document.createElement("div")
    projectDiv.appendChild(projectWrapperDiv)

    // Collapse button.
    let collapseDiv = document.createElement("div")
    collapseDiv.classList.add('collapse_button')
    collapseDiv.setAttribute('title','collapse')
    collapseDiv.setAttribute('onclick', `this.parentElement.parentElement.classList.toggle('collapsed');this.innerHTML=this.innerHTML=='▼'?'▶':'▼'`)
    projectWrapperDiv.appendChild(collapseDiv)

    // Collapse button text.
    let collapseDivText = document.createTextNode('▼')
    collapseDiv.appendChild(collapseDivText)

    // Link to TeamCity project page.
    let projectLink = document.createElement("a")
    projectLink.classList.add('project_title')
    projectLink.setAttribute('href', project.webUrl)
    projectLink.setAttribute('target', '_blank')
    projectWrapperDiv.appendChild(projectLink)

    // Text for TeamCity project link.
    let projectText = document.createTextNode(`${project.name}`)
    projectLink.appendChild(projectText)

    // Icon ⧉ for the TeamCity project link.
    let projectLinkIconText = document.createTextNode('⧉')
    let projectLinkIcon = document.createElement("div")
    projectLinkIcon.appendChild(projectLinkIconText)
    projectLinkIcon.classList.add('linkIcon')
    projectLink.appendChild(projectLinkIcon)

    return projectDiv

}

function renderProjectTestStatistics(project) {
    if(project.testCount) {
        project.testPercentage = Sumber((project.testPassed/project.testCount)*100).toFixed(2)
        let testStatisticsSumText = document.createTextNode(`${project.testNewFailed?'('+project.testNewFailed+' new) ':''}${project.testMuted?'('+project.testMuted+' muted) ':''}[${project.testPassed?project.testPassed:0}/${project.testCount}] = ${project.testPercentage}%`)
        project.div.getElementsByClassName('project_title')[0].append(testStatisticsSumText)
    }
}

// Add buildType to project.
function renderBuildType(buildType) {

    // Skip build types with no builds.
    if (!buildType.builds.build[0])
        return

    // Add buildType to project.
    let buildTypeDiv = document.createElement("div")
    let parentElement = document.getElementById(buildType.projectId)
    buildTypeDiv.style.order = buildType.order
    parentElement.appendChild(buildTypeDiv)

    // Create buildTextDiv.
    buildTypeDiv.setAttribute('id', buildType.id)
    buildTypeDiv.setAttribute('title',`BuildType ID: ${buildType.id}`)
    buildTypeDiv.classList.add('buildType')
    buildTypeDiv.classList.add(buildType.projectId)

    // Add status of last build as class.
    buildTypeDiv.classList.add(buildType.builds.build[0].status)

    // Add statusChanged when the last build status is different.
    if (buildType.statusChanged) {
        buildTypeDiv.classList.add('statusChanged')
    }

    // Link to TeamCity build type page.
    let buildTypeLink = document.createElement("a")
    buildTypeLink.setAttribute('href', buildType.webUrl)
    buildTypeLink.setAttribute('target', '_blank')
    buildTypeDiv.appendChild(buildTypeLink)

    // Text for the buildType.
    let buildTypeText = document.createTextNode(buildType.name)
    buildTypeLink.appendChild(buildTypeText)

    // Icon ⧉ for the TeamCity build type link.
    let buildTypeLinkIconText = document.createTextNode('⧉')
    let buildTypeLinkIcon = document.createElement("div")
    buildTypeLinkIcon.appendChild(buildTypeLinkIconText)
    buildTypeLinkIcon.classList.add('linkIcon')
    buildTypeLink.appendChild(buildTypeLinkIcon)

    // Test statistics
    if (buildType.builds.build[0].testOccurrences) {
        let testOccurrences = buildType.builds.build[0].testOccurrences
        //console.log(testOccurrences)
        let newFailed = testOccurrences.newFailed?testOccurrences.newFailed:0
        let muted = testOccurrences.muted?testOccurrences.muted:0
        let passed = testOccurrences.passed?testOccurrences.passed:0
        let count = testOccurrences.count
        let percentage = Number((passed/count)*100).toFixed(2)
        let testStatisticsText = document.createTextNode(`${newFailed?'('+newFailed+' new) ':''}${muted?'('+muted+' muted) ':''}[${passed?passed:0}/${count}] = ${percentage}%`)
        buildTypeDiv.appendChild(testStatisticsText)
    }

    // Investigations
    if (buildType.investigations?.investigation?.length > 0) {
        //console.log(buildType.investigations.investigation)
        for (investigation in buildType.investigations.investigation) {
            //buildTypeDiv.appendChild(document.createTextNode(investigation))
        }
    }

    // Element to hold the list of builds.
    let buildListDiv = document.createElement("div")
    buildListDiv.setAttribute('id', buildType.id + '_buildList')
    buildListDiv.classList.add('buildList')
    buildTypeDiv.appendChild(buildListDiv)

    let buildStepsText = document.createTextNode('🚧 Will fetch and display the (status of) individual build steps.')
    let buildSteps = document.createElement("div")
    buildSteps.appendChild(buildStepsText)
    buildSteps.classList.add('buildSteps')
    buildSteps.classList.add('hidden')
    buildTypeDiv.appendChild(buildSteps)

}

// Add build to buildList.
function renderBuild(build) {

    // Add build to buildList.
    let buildDiv = document.createElement("div")
    let parentElement = document.getElementById(build.buildTypeId + '_buildList')
    parentElement.prepend(buildDiv)

    // Create buildDiv.
    buildDiv.setAttribute('id', build.id)
    buildDiv.classList.add('build')
    buildDiv.classList.add(build.buildTypeId)
    buildDiv.classList.add(build.status)
    if (build.statusChanged || (build.problemOccurrences && build.problemOccurrences.newFailed > 0)) {
        buildDiv.classList.add('newFailed')
    }

    // Link to TeamCity build page.
    let buildLink = document.createElement("a")
    buildLink.setAttribute('onclick', `get_build_details(${build.id})`)
    buildLink.setAttribute('target', '_blank')
    buildLink.setAttribute('title', `Branch: ${build.branchName?build.branchName:'unknown'}\nStatus: ${build.status}\nID ${build.id}\n# ${build.number}\nFinished ${new Date(build.unixTime).toLocaleString()}\n${build.statusText}`)
    if(build.branchName) {
        buildLink.classList.add(`branch_${build.branchName}`)
        buildLink.setAttribute('onmouseenter','Array.from(this.parentElement.parentElement.parentElement.parentElement.getElementsByClassName(this.className)).forEach(element => {element.classList.add(\'branch_selected\')})')
        buildLink.setAttribute('onmouseout','Array.from(this.parentElement.parentElement.parentElement.parentElement.getElementsByClassName(this.className)).forEach(element => {element.classList.remove(\'branch_selected\')})')
    }
    buildDiv.appendChild(buildLink)

    // Text for TeamCity build link.
    let buildText = document.createTextNode('⬤')
    buildLink.appendChild(buildText)

}

function renderBuildDetails(buildId,messages,changes) {
    let parentElementId = document.getElementById(buildId).parentElement.parentElement.id
    let buildDetails = document.querySelectorAll(`#${parentElementId} > .buildSteps`)[0]
    buildDetails.innerHTML = ""
    buildDetails.classList.remove('hidden')

    // Build button-bar
    let buildButtonBar = document.createElement('div')
    buildButtonBar.classList.add('header')
    buildButtonBar.classList.add('buildButtonBar')
    buildDetails.appendChild(buildButtonBar)

    // Show logs
    let buildMessagesButton = document.createElement('button')
    buildMessagesButton.classList.add('toggle')
    buildMessagesButton.classList.add('active')
    buildMessagesButton.setAttribute('onclick',
        `this.parentElement.getElementsByClassName('active')[0].classList.remove('active')
        this.classList.add('active')
        this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.remove('hidden')
        this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.add('hidden')`)
    buildMessagesButton.appendChild(document.createTextNode('Logs'))
    buildButtonBar.appendChild(buildMessagesButton)

    // Show changes
    let buildChangesButton = document.createElement('button')
    buildChangesButton.classList.add('toggle')
    buildChangesButton.setAttribute('onclick',
    `this.parentElement.getElementsByClassName('active')[0].classList.remove('active')
    this.classList.add('active')
    this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.add('hidden')
    this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.remove('hidden')`)
    buildChangesButton.appendChild(document.createTextNode('Blame'))
    buildButtonBar.appendChild(buildChangesButton)

    // Open build in TeamCity
    let buildLink = document.createElement('button')
    buildLink.setAttribute('onclick',`window.open('${teamcity_base_url}/viewLog.html?buildId=${buildId}&buildTypeId=${parentElementId};','build_${buildId}','fullscreen=yes')`)
    buildLink.appendChild(document.createTextNode(`Open in TeamCity ⧉`))
    buildButtonBar.appendChild(buildLink)

    // Close build details
    let buildCloseButton = document.createElement('button')
    buildCloseButton.setAttribute('onclick',`document.querySelectorAll('#${parentElementId} > .buildSteps')[0].classList.add('hidden')`)
    buildCloseButton.appendChild(document.createTextNode('Close'))
    buildButtonBar.appendChild(buildCloseButton)

    // Messages DIV
    let messagesDiv = document.createElement('div')
    messagesDiv.classList.add('messages')
    buildDetails.appendChild(messagesDiv)

    // Changes DIV
    let changesDiv = document.createElement('div')
    changesDiv.classList.add('changes')
    changesDiv.classList.add('hidden')
    buildDetails.appendChild(changesDiv)

    Object.entries(messages).forEach(([key, message]) => {

        let messageP = document.createElement('p')
        messageP.classList.add('message')
        if (message.status == 2)
            messageP.classList.add('warning')
        if (message.status == 4)
            messageP.classList.add('error')
        let messageText = JSON.stringify(message.text)
        messageP.innerText = messageText
        messagesDiv.appendChild(messageP)

    })

    if (changes.length == 0) {
        changesDiv.innerHTML = 'Nobody to blame... 😭'
    }

    Object.entries(changes).forEach(([key, change]) => {

        let versionDiv = document.createElement('div')
        let linkDiv = document.createElement('div')
        let userDiv = document.createElement('div')
        let timeDiv = document.createElement('div')
        userDiv.classList.add('build_user')
        //let filesDiv = document.createElement('div')
        versionDiv.innerHTML = `#${change.version}`
        let fileList = change.files.file.map(file => file['relative-file']).join('\n')
        linkDiv.innerHTML = `<a href='${change.webUrl}' title='${fileList}'>#${change.comment}</a>`
        userDiv.innerHTML = `<span class='build_user_name'>${change.user?change.user.name:'🤖'}</span>`
        timeDiv.innerHTML = `<span class='build_time smaller'>${new Date(tcTimeToUnix(change.date)).toLocaleString()}</span>`
        changesDiv.appendChild(versionDiv)
        changesDiv.appendChild(linkDiv)
        changesDiv.appendChild(userDiv)
        changesDiv.appendChild(timeDiv)

    })

}

// Show or hide all build types of which the last build was successful.
function toggleGreen() {

    let greenBuildTypes = document.querySelectorAll('#_projects div.buildType.SUCCESS')

    for (item of greenBuildTypes) {
        item.classList.toggle('hidden')
    }

}

// Show or hide all build types of which the last build was successful.
function toggleUnchangedBuildTypes() {

    let unchangedBuildTypes = document.querySelectorAll('#_projects div.buildType:not(.statusChanged)')

    for (item of unchangedBuildTypes) {
        item.classList.toggle('hidden_statusChanged')
    }

}