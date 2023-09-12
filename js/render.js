// Will enable/disable buttons when there are downloads in progress.
async function checkFilterButtons(downloadQueueLength) {

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

async function renderProject(project) {

    // Add project to parent project.
    let projectDiv = document.createElement("div")
    let parentElement = document.getElementById(project.parentProjectId)
    if (parentElement) {
        projectDiv.style.order = project.order+2
        parentElement.appendChild(projectDiv)
    } else {
        document.getElementById(`${project.id}_wrapper`).appendChild(projectDiv)
    }

    let projectBuildTypesDiv = document.createElement("div")
    projectBuildTypesDiv.classList.add('projectBuildTypesDiv')
    projectBuildTypesDiv.style.order = '1';
    projectDiv.appendChild(projectBuildTypesDiv)

    // Create projectDiv.
    projectDiv.setAttribute('id', project.id)
    projectDiv.classList.add('project')
    projectDiv.classList.add(project.parentProjectId)
    projectDiv.setAttribute('title', `Project ID: ${project.id}`)

    // Wrapper for project collapse button and title.
    let projectHeaderWrapperDiv = document.createElement("div")
    projectHeaderWrapperDiv.classList.add('project_header_wrapper')
    projectHeaderWrapperDiv.style.order = '0';
    projectDiv.appendChild(projectHeaderWrapperDiv)

    // Collapse button.
    let collapseDiv = document.createElement("div")
    collapseDiv.classList.add('collapse_button')
    collapseDiv.setAttribute('title','collapse')
    collapseDiv.setAttribute('onclick', `this.parentElement.parentElement.classList.toggle('collapsed');this.innerHTML=this.innerHTML=='▼'?'▶':'▼'`)
    projectHeaderWrapperDiv.appendChild(collapseDiv)

    // Collapse button text.
    let collapseDivText = document.createTextNode('▼')
    collapseDiv.appendChild(collapseDivText)

    // Link to TeamCity project page.
    let projectLink = document.createElement("a")
    projectLink.classList.add('project_title')
    projectLink.setAttribute('href', project.webUrl)
    projectLink.setAttribute('target', '_blank')
    projectHeaderWrapperDiv.appendChild(projectLink)

    // Text for TeamCity project link.
    let projectText = document.createTextNode(`${project.name}`)
    projectLink.appendChild(projectText)

    // Icon ⧉ for the TeamCity project link.
    let projectLinkIconText = document.createTextNode('⧉')
    let projectLinkIcon = document.createElement("div")
    projectLinkIcon.appendChild(projectLinkIconText)
    projectLinkIcon.classList.add('linkIcon')
    projectLink.appendChild(projectLinkIcon)

    let projectStats = document.createElement("div")
    projectStats.setAttribute('id',`${project.id}_stats`)
    projectStats.classList.add('projectStats')
    projectHeaderWrapperDiv.appendChild(projectStats)

    return projectDiv

}
/*
function renderProjectTestStatistics(project) {
    if(project.testCount) {
        project.testPercentage = Number((project.testPassed/project.testCount)*100).toFixed(2)
        let testStatisticsSumText = document.createTextNode(`${project.testNewFailed?'('+project.testNewFailed+' new failed) ':''}${project.failedNotInvestigated?'['+project.failedNotInvestigated+'×🙈] ':''}${project.testIgnored?'['+project.testIgnored+'×🙉] ':''}${project.testMuted?'['+project.testMuted+'×🙊] ':''}[${project.testPassed?project.testPassed:0}/${project.testCount}] = ${project.testPercentage}%`)
        let testStatisticsSumDiv = document.createElement('div')
        testStatisticsSumDiv.style.textAlign = 'right'
        testStatisticsSumDiv.style.display = 'inline-block'
        testStatisticsSumDiv.appendChild(testStatisticsSumText)
        project.div.getElementsByClassName('project_title')[0].after(testStatisticsSumDiv)
    }
}
*/
// Add buildType to project.
async function renderBuildType(buildType) {

    // Skip build types with no builds.
    if (!buildType.builds.build[0])
        return

    // Add buildType to project.
    //let buildTypeDiv = document.createElement("div")
    let parentElement = document.getElementById(buildType.projectId).getElementsByClassName('projectBuildTypesDiv')[0]
    //buildTypeDiv.style.order = buildType.order
    //parentElement.appendChild(buildTypeDiv)

    let buildTypeLink = document.createElement("a")

    // Create buildTextDiv.
    buildTypeLink.setAttribute('id', buildType.id)
    buildTypeLink.setAttribute('title',`BuildType ID: ${buildType.id}`)
    buildTypeLink.classList.add('buildType')
    buildTypeLink.classList.add('buildTypePart')
    buildTypeLink.classList.add(buildType.projectId)
    buildTypeLink.style.gridRow = buildType.order*2+1
    buildTypeLink.style.gridColumn = 1
    parentElement.appendChild(buildTypeLink)
    // Add status of last build as class.
    buildTypeLink.classList.add(buildType.builds.build[0].status)

    // Link to TeamCity build type page.
    buildTypeLink.setAttribute('href', buildType.webUrl)
    buildTypeLink.classList.add('buildTypeLink');
    buildTypeLink.setAttribute('id', `buildTypeLink_${buildType.id}`)
    buildTypeLink.setAttribute('target', '_blank')

    // Text for the buildType.
    let buildTypeText = document.createTextNode(buildType.name)
    buildTypeLink.appendChild(buildTypeText)

    // Icon ⧉ for the TeamCity build type link.
    let buildTypeLinkIconText = document.createTextNode('⧉')
    let buildTypeLinkIcon = document.createElement("div")
    buildTypeLinkIcon.appendChild(buildTypeLinkIconText)
    buildTypeLinkIcon.classList.add('linkIcon')
    buildTypeLink.appendChild(buildTypeLinkIcon)

    let testStatisticsDiv = document.createElement('div')
    testStatisticsDiv.classList.add('test_statistics_text')
    testStatisticsDiv.setAttribute('id', buildType.id + '_test_statistics')
    testStatisticsDiv.classList.add('buildTypePart')
    testStatisticsDiv.style.gridRow = buildType.order*2+1
    testStatisticsDiv.style.gridColumn = 2
    parentElement.appendChild(testStatisticsDiv)

    let finishTimeDiv = document.createElement('div')
    finishTimeDiv.setAttribute('id', buildType.id + '_finish') 
    finishTimeDiv.classList.add('finish_time_text')
    finishTimeDiv.classList.add('buildTypePart')
    finishTimeDiv.style.gridRow = buildType.order*2+1
    finishTimeDiv.style.gridColumn = 3
    parentElement.appendChild(finishTimeDiv)
/*
    // Test statistics
    if (buildType.builds.build[0].testOccurrences) {
        let testOccurrences = buildType.builds.build[0].testOccurrences
        let newFailed = testOccurrences.newFailed?testOccurrences.newFailed:0
        let muted = testOccurrences.muted?testOccurrences.muted:0
        let ignored = testOccurrences.ignored?testOccurrences.ignored:0
        let passed = testOccurrences.passed?testOccurrences.passed:0
        let count = testOccurrences.count
        let percentage = Number((passed/count)*100).toFixed(2)
        let failedNotInvestigated = buildType.failedNotInvestigated

        let testStatisticsText = document.createTextNode(` ${newFailed?'('+newFailed+' new failed) ':''}${failedNotInvestigated?'('+failedNotInvestigated+'×🙈) ':''}${ignored?'('+ignored+'×🙉) ':''}${muted?'('+muted+'×🙊) ':''}[${passed?passed:0}/${count}] = ${percentage}%`)
        testStatisticsDiv.appendChild(testStatisticsText)
    }
*/
    // Investigations
    /*
    if (buildType.investigations?.investigation?.length > 0) {
        for (investigation in buildType.investigations.investigation) {
            console.log(buildType.investigations.investigation[investigation].assignee.name)
            testStatisticsDiv.prepend(document.createTextNode(buildType.investigations.investigation[investigation].assignee.name))
        }
    }
    */

    // Element to hold the list of builds.
    let buildListDiv = document.createElement("div")
    buildListDiv.setAttribute('id', buildType.id + '_buildList')
    buildListDiv.classList.add('buildList')
    buildListDiv.classList.add('buildTypePart')
    buildListDiv.style.gridRow = buildType.order*2+1
    buildListDiv.style.gridColumn = 4
    parentElement.appendChild(buildListDiv)

    let buildStepsText = document.createTextNode('🚧 Will fetch and display the (status of) individual build steps.')
    let buildSteps = document.createElement("div")
    buildSteps.appendChild(buildStepsText)
    buildSteps.classList.add('buildSteps')
    buildSteps.classList.add('hidden')
    buildSteps.style.gridRow = buildType.order*2+2
    parentElement.appendChild(buildSteps)

    // Add statusChanged when the last build status is different.
    if (buildType.statusChanged) {
        buildTypeLink.classList.add('statusChanged')
        testStatisticsDiv.classList.add('statusChanged')
        buildListDiv.classList.add('statusChanged')
        finishTimeDiv.classList.add('statusChanged')
    }

    if (buildType.status) {
        buildTypeLink.classList.add(buildType.status)
        testStatisticsDiv.classList.add(buildType.status)
        buildListDiv.classList.add(buildType.status)
        finishTimeDiv.classList.add(buildType.status)
    }

}

// Add build to buildList.
async function renderBuild(build) {

    // Add build to buildList.
    let buildDiv = document.createElement("div")
    let parentElement = document.getElementById(build.buildTypeId + '_buildList')
    parentElement.prepend(buildDiv)

    // Create buildDiv.
    buildDiv.setAttribute('id', build.id)
    buildDiv.classList.add('build')
    buildDiv.classList.add(build.buildTypeId)
    buildDiv.classList.add(build.state)
    if (build.status){
        buildDiv.classList.add(build.status)
    }
    else{
        buildDiv.classList.add('NORESULT')
    }
    if (build.statusChanged || (build.problemOccurrences && build.problemOccurrences.newFailed > 0)) {
        buildDiv.classList.add('newFailed')
    }

    // Link to TeamCity build page.
    let buildLink = document.createElement("a")
    buildLink.setAttribute('onclick', `get_build_details(${build.id})`)
    buildLink.setAttribute('target', '_blank')
    let buildFinishTime = (build.state=='finished' ? 'Finished: ' : 'Estimated finish: ') + new Date(build.unixTime).toLocaleString()
    buildLink.setAttribute('title', `Branch: ${build.branchName?build.branchName:'unknown'}\nState: ${build.state}\nStatus: ${build.status}\nID: ${build.id}\nBuild Number: # ${build.number}\n${buildFinishTime}\nStatus message: ${build.statusText}`)
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

async function renderBuildTypeStats(buildStats, parentProjectStats, parentProjectIds) {

    let newFailed = buildStats.testOccurrences.newFailed?buildStats.newFailed:0
    let failedInvestigated = buildStats.testOccurrences.testOccurrence.filter((testOccurrence) => {return testOccurrence.status!='SUCCESS' && testOccurrence.currentlyInvestigated}).length
    let failedNotInvestigated = buildStats.testOccurrences.testOccurrence.filter((testOccurrence) => {return testOccurrence.status!='SUCCESS' && !testOccurrence.currentlyInvestigated}).length
    let ignored = buildStats.testOccurrences.ignored?buildStats.testOccurrences.ignored:0
    let muted = buildStats.testOccurrences.muted?buildStats.testOccurrences.muted:0
    let passed = buildStats.testOccurrences.passed?buildStats.testOccurrences.passed:0
    let count = buildStats.testOccurrences.count?buildStats.testOccurrences.count:0
    let percentage = Number((passed/count)*100).toFixed(2)

    
    Object.entries(parentProjectIds).forEach(([key,projectId]) => {
        parentProjectStats[projectId].newFailed += newFailed
        parentProjectStats[projectId].failedInvestigated += failedInvestigated
        parentProjectStats[projectId].failedNotInvestigated += failedNotInvestigated
        parentProjectStats[projectId].ignored += ignored
        parentProjectStats[projectId].muted += muted
        parentProjectStats[projectId].passed += passed
        parentProjectStats[projectId].count += count
        parentProjectStats[projectId].percentage = Number((parentProjectStats[projectId].passed/parentProjectStats[projectId].count)*100).toFixed(2)
    }, this)
    renderProjectStats(parentProjectStats, parentProjectIds)

    let element = document.getElementById(buildStats.buildTypeId + '_test_statistics')
    let testStatisticsText = document.createTextNode(` ${newFailed?'('+newFailed+'×🚩) ':''}${failedInvestigated?'('+failedInvestigated+'×🕵) ':''}${failedNotInvestigated?'('+failedNotInvestigated+'×🙈) ':''}${ignored?'('+ignored+'×🙉) ':''}${muted?'('+muted+'×🙊) ':''}[${passed?passed:0}/${count}] = ${percentage}%`)
    element.appendChild(testStatisticsText)
}

async function renderFinishTime(build) {
    if (build.state == 'finished') {
        return
    }
    let element = document.getElementById(build.buildTypeId + '_finish')
    let finishTimeText = document.createTextNode(`${build.unixTime ? '⏰' : ''}${new Date(build.unixTime).toLocaleTimeString()}`)
    element.appendChild(finishTimeText)
}

async function renderProjectStats(parentProjectStats, parentProjectIds) {
    Object.entries(parentProjectIds).forEach(([key,projectId]) => {
        //console.log(projectStats)
        let element = document.getElementById(`${projectId}_stats`)
        //let testStatisticsText = document.createTextNode(` ${parentProjectStats[projectId].newFailed?'('+parentProjectStats[projectId].newFailed+'×🚩) ':''}${parentProjectStats[projectId].failedInvestigated?'('+parentProjectStats[projectId].failedInvestigated+'×🕵) ':''}${parentProjectStats[projectId].failedNotInvestigated?'('+parentProjectStats[projectId].failedNotInvestigated+'×🙈) ':''}${parentProjectStats[projectId].ignored?'('+parentProjectStats[projectId].ignored+'×🙉) ':''}${parentProjectStats[projectId].muted?'('+parentProjectStats[projectId].muted+'×🙊) ':''}[${parentProjectStats[projectId].passed?parentProjectStats[projectId].passed:0}/${parentProjectStats[projectId].count}] = ${parentProjectStats[projectId].percentage}%`)
        let testStatisticsText = document.createTextNode(` [${parentProjectStats[projectId].passed?parentProjectStats[projectId].passed:0}/${parentProjectStats[projectId].count}] = ${parentProjectStats[projectId].percentage}%`)
        element.replaceChildren(testStatisticsText)    
    }, this)
/*
    for ([projectId,projectStats] of parentProjectStats) {
        let element = document.getElementById(`${projectId}_stats`)
        let testStatisticsText = document.createTextNode(` ${projectStats.newFailed?'('+projectStats.newFailed+'×🚩) ':''}${projectStats.failedInvestigated?'('+projectStats.failedInvestigated+'×🕵) ':''}${projectStats.failedNotInvestigated?'('+projectStats.failedNotInvestigated+'×🙈) ':''}${projectStats.ignored?'('+projectStats.ignored+'×🙉) ':''}${projectStats.muted?'('+projectStats.muted+'×🙊) ':''}[${projectStats.passed?projectStats.passed:0}/${projectStats.count}] = ${projectStats.percentage}%`)
        element.replaceChildren(testStatisticsText)    
    }
*/
}

async function renderBuildDetails(buildId,messages,tests,changes) {
    let parentElementId = document.getElementById(buildId).parentElement.id
    let buildDetails = document.querySelectorAll(`#${parentElementId}`)[0].nextSibling
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
        this.parentElement.parentElement.getElementsByClassName('tests')[0].classList.add('hidden')
        this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.add('hidden')`)
    buildMessagesButton.appendChild(document.createTextNode('Important logs'))
    buildButtonBar.appendChild(buildMessagesButton)

    // Show tests
    let buildStepsButton = document.createElement('button')
    buildStepsButton.classList.add('toggle')
    buildStepsButton.setAttribute('onclick',
    `this.parentElement.getElementsByClassName('active')[0].classList.remove('active')
    this.classList.add('active')
    this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.add('hidden')
    this.parentElement.parentElement.getElementsByClassName('tests')[0].classList.remove('hidden')
    this.parentElement.parentElement.getElementsByClassName('changes')[0].classList.add('hidden')`)
    buildStepsButton.appendChild(document.createTextNode('Tests'))
    buildButtonBar.appendChild(buildStepsButton)

    // Show changes
    let buildChangesButton = document.createElement('button')
    buildChangesButton.classList.add('toggle')
    buildChangesButton.setAttribute('onclick',
    `this.parentElement.getElementsByClassName('active')[0].classList.remove('active')
    this.classList.add('active')
    this.parentElement.parentElement.getElementsByClassName('messages')[0].classList.add('hidden')
    this.parentElement.parentElement.getElementsByClassName('tests')[0].classList.add('hidden')
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
    buildCloseButton.setAttribute('onclick',`document.querySelectorAll('#${parentElementId}')[0].nextSibling.classList.add('hidden')`)
    buildCloseButton.appendChild(document.createTextNode('Close'))
    buildButtonBar.appendChild(buildCloseButton)

    // Messages DIV
    let messagesDiv = document.createElement('div')
    messagesDiv.classList.add('messages')
    buildDetails.appendChild(messagesDiv)

    // Steps DIV
    let testsDiv = document.createElement('div')
    testsDiv.classList.add('tests')
    testsDiv.classList.add('hidden')
    buildDetails.appendChild(testsDiv)

    // Changes DIV
    let changesDiv = document.createElement('div')
    changesDiv.classList.add('changes')
    changesDiv.classList.add('hidden')
    buildDetails.appendChild(changesDiv)

    function addMessagesToElement(messages, element) {
        Object.entries(messages).forEach(async ([key, message]) => {

            let messageP = document.createElement('div')
            messageP.classList.add('message')
            if (message.status == 2)
                messageP.classList.add('warning')
            else if (message.status == 4)
                messageP.classList.add('error')
            else {
                messageP.classList.add('normal')
            }
            let messageSpan = document.createElement('span')
            messageSpan.innerText = message.text
            messageP.appendChild(messageSpan)
            element.appendChild(messageP)

            if (message.containsMessages && message.id != 0) {

                let moreMessages = get_more_messages(buildId,message.id)

                messageP.style.display = 'flex'
                messageP.style.flexDirection = 'column'

                let subMessagesCollapse = document.createElement('span')
                messageSpan.prepend(subMessagesCollapse)
                subMessagesCollapse.storeText = message.text
                subMessagesCollapse.innerText = `▶ ${subMessagesCollapse.storeText}`
                subMessagesCollapse.classList.add('collapse_message_button')
                subMessagesCollapse.style.display = 'inline-block'
                subMessagesCollapse.setAttribute('onclick',`this.innerText=this.innerText.startsWith('▼')?'▶ '+this.storeText:'▼ '+this.storeText;this.classList.toggle('active');this.nextSibling.classList.toggle("hidden")`)
                messageSpan.style.display = 'none'
                messageP.appendChild(subMessagesCollapse)

                let subMessages = document.createElement('div')
                messageP.appendChild(subMessages)
                subMessages.style.borderLeft = '2px solid black'
                subMessages.classList.add('hidden')

                addMessagesToElement(await moreMessages, subMessages)
            }
    
        })
    }

    addMessagesToElement(messages, messagesDiv)

    if (changes.length == 0) {
        changesDiv.innerHTML = 'Nobody to blame... 😭'
    }

    Object.entries(tests).forEach(([key, test]) => {

        let testP = document.createElement('p')
        let testA = document.createElement('a')
        testA.classList.add('message')
        testA.setAttribute('target','_blank')
        testA.setAttribute('href',`${teamcity_base_url}/buildConfiguration/${test.build.buildTypeId}/${test.build.id}?showLog=${test.build.id}_${test.logAnchor}`)

        if (test.status == 'WARNING')
            testA.classList.add('warning')
        if (test.status == 'FAILURE')
            testA.classList.add('error')
        if (test.status == 'UNKNOWN') {
            testA.classList.add('unknown')
        }

        let tags = ''
        let investigation_names = ''

        if (test.test?.investigations?.investigation?.length == 0)
            tags += '🙈'
        else {
            investigation_names = test.test.investigations.investigation.map((investigation) => {return investigation.assignee.name})
            tags += '🕵'
            testP.style.color = 'var(--deltares-blue)'
        }
        if (test.ignored)
            tags += '🙉'
        if (test.muted)
            tags += '🙊'

        testP.innerText = `${tags} ${investigation_names?'('+investigation_names+')':''} ${test.test.parsedTestName.testShortName}\n⇾ ${test.details}`
        testA.appendChild(testP)

        if (investigation_names)
            testsDiv.insertBefore(testA, testsDiv.firstChild)
        else
            testsDiv.appendChild(testA)

    })

    if (tests.length == 0) {
        testsDiv.innerHTML = 'No failed tests!'
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
        linkDiv.innerHTML = `<a href='${change.webUrl}' title='${fileList}' target='_blank'>#${change.comment}</a>`
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

    let greenBuildTypes = document.querySelectorAll('#_projects .buildTypePart.SUCCESS')

    for (item of greenBuildTypes) {
        item.classList.toggle('hidden')
    }

}

// Show or hide all build types of which the last build was successful.
function toggleUnchangedBuildTypes() {

    let unchangedBuildTypes = document.querySelectorAll('#_projects .buildTypePart:not(.statusChanged)')

    for (item of unchangedBuildTypes) {
        item.classList.toggle('hidden_statusChanged')
    }

}
