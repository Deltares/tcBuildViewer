/* Data
/  
/  Interpret API data fetched by query.js
/  
/  Direct link to render() functions 
*/

// Interprete and render project using parentProjectId, id and name
class ApiDataInterpreter {

    async interpretProject(project) {

        // Create main element
        let elementClass = ['project', project.parentProjectId]
        let attributes   = {'id':`${project.id}`, 'title':`Project ID: ${project.id}`}
        let element      = document.getElementById(project.parentProjectId)
        let order        = null

        // Check if parent project exists and add order or create a parent project under the main element.
        if (element) {
            order = project.order+2
        } else {
            element = document.getElementById(`${project.id}_wrapper`)
        }
        let parentElement = render.createElement('div', elementClass, attributes, null, element, order)

        // Create BuildTypes container
        render.createElement('div',['buildTypesContainer'], null, null, parentElement, 2)

        // Create title Wrapper
        let titleWrapper = render.createElement('div', ['projectTitleWrapper'], null, null, parentElement, 1)

        // Create collapse option for project
        attributes = {'title':'collapse',
            'onclick':`this.parentElement.parentElement.classList.toggle('collapsed');this.classList.toggle('collapsed')`}
        render.createElement('div', ['collapseButton'], attributes, '▼', titleWrapper, null)

        // Add the title and create a link except for important container don't add a link
        if (project.important) {
            render.createElement('p', ['projectTitle'], null, project.name, titleWrapper, null)
        } else {
            attributes = {'href':`${teamcity_base_url}/project.html?projectId=${project.id}`,'target':'_blank'}
            let projectLink = render.createElement('a', ['projectTitle'], attributes, project.name, titleWrapper, null)
            render.createElement('div', ['linkIcon'], null, '⧉', projectLink, null)
        }

        render.createElement('div', ['projectStats'], {'id':`${project.id}_stats`}, null, titleWrapper, null)

        // Remove finished project interpretation from queue
        render.updateQueue(false, 1)
    }

    async interpretBuildType(buildType) {

        // Prepare some variables to show changes in the buildType div for quick overview
        buildType = this.prepBuildType(buildType)

        // Start Render calls
        let parentElement = document.getElementById(buildType.projectId).getElementsByClassName('buildTypesContainer')[0]

        // Create buildType title with link
        let elementClass  = ['buildTypeTitle','buildTypePart', buildType.projectId, buildType.status]
        if (buildType.statusChanged)
            elementClass.push('statusChanged')
        let attributes    = {   
                                'id':`buildTypeLink_${buildType.id}${buildType.suffix}`,
                                'title':`BuildType ID: ${buildType.id}`,
                                'href':`${teamcity_base_url}/viewType.html?buildTypeId=${buildType.id}`,
                                'target':'_blank'
                            }
        let buildTypeLink = render.createElement('a', elementClass, attributes, buildType.name, parentElement, (buildType.order * 2 + 1))
        render.createElement('div', ['linkIcon'], null, '⧉', buildTypeLink, null)

        // Create test statistics box for buildType
        attributes   = {'id': `${buildType.id}_test_statistics${buildType.suffix}`}
        elementClass = ['testStatisticsText', 'buildTypePart', buildType.status]
        if (buildType.statusChanged)
            elementClass.push('statusChanged')
        render.createElement('div', elementClass, attributes, null, parentElement, (buildType.order * 2 + 1))

        // Create Miscellaneous box for tags, time for the buildType
        attributes      = {'id': `${buildType.id}_misc${buildType.suffix}`}
        elementClass[0] = 'miscellaneous'
        render.createElement('div', elementClass, attributes, null, parentElement, (buildType.order * 2 + 1))

        // Create builds container for buildType
        attributes   = {'id': `${buildType.id}_buildList${buildType.suffix}`}
        elementClass[0] = 'buildList'
        render.createElement('div', elementClass, attributes, null, parentElement, (buildType.order * 2 + 1))

        // Create buildSteps container for buildType
        attributes   = {'id': `${buildType.id}_buildSteps${buildType.suffix}`}
        elementClass = ['buildSteps','hidden']
        let text = '🚧 Will display build details like important logs, blame and test!'
        render.createElement('div', elementClass, attributes, text, parentElement, (buildType.order * 2 + 2))

        // Remove finished buildType interpretation from queue
        render.updateQueue(false, 1)
    }

    prepBuildType(buildType) {

        let build    = buildType.builds.build[0]
        let buildTwo = buildType.builds.build?.[1]

        // Check if buildType should be highlighted as changed
        if (build?.problemOccurrences?.newfailed > 0) {
            buildType.statusChanged = true
        } else if (build?.status != buildTwo?.status) {
            buildType.statusChanged = true
        } else if (build?.testOccurrences?.passed != buildTwo?.testOccurrences?.passed) {
            buildType.statusChanged = true
        } else {
            buildType.statusChanged = false
        }

        // Set status of buildType if it is finished or has failed for latest build
        if (build?.status && (build?.state == 'finished' || build?.status=='FAILURE')) {
            buildType.status = build.status
        }

        return buildType
    }

    async interpretBuild(build) {

        let parentElement = document.getElementById(`${build.buildTypeId}_buildList${build.suffix}`)

        // Add build container with link and title elements.
        let elementClass = ['build', build.buildTypeId, build.state, build.status]
        let buildFinishTime = (build.state=='finished' ? 'Finished ' : 'Estimated finish: ') + new Date(build.unixTime).toLocaleString()
        let branch = build.branchName ? build.branchName : 'unknown'
        let tags = ''
        if (build.tags.tag.length > 0) {
            tags = 'Tags: '
            for (let element of build.tags.tag) {
                tags += element.name + ' | '
            }
            tags = tags.substring(0, tags.length - 3)
        }
        let agent = build.agent ? build.agent?.name : `${build.plannedAgent?.name} (planned)`;
        let buildTitle = `${tags}\nBranch: ${branch}\nID: ${build.id}\nBuild Number: ${build.number}\nState: ${build.state}\nStatus: ${build.status}\nAgent: ${agent}\n${buildFinishTime}\nStatus Message: ${build.statusText}`
        let attributes = {  
                        'id': build.id,
                        'onclick': `main.getBuildDetails('${build.id}','${build.buildTypeId}','${build.suffix}')`,
                        'target': '_blank',
                        'title': `${buildTitle}`
                    }
        let buildDiv = render.createElement('div', elementClass, attributes, null, parentElement, null)

        // add icon border
        let buildClass = [`testBorder${build.state!='queued' ? build.status : build.state}`]
        render.createElement('div', buildClass, null, null, buildDiv, null)

        // add test icon
        buildClass = [`testIcon${build.state=='finished' ? build.status : build.state}`]
        if (build.state=='finished' && (build.statusChanged || (build.problemOccurrences && build.problemOccurrences.newFailed > 0))) {
            buildClass = ['testIconchanged']
        }
        render.createElement('div', buildClass, null, null, buildDiv, null)

        render.addClearElement(buildDiv)

        // Remove finished build interpretation from queue
        render.updateQueue(false, 1)
    }

    getBuildDate(build){

        // Get time to display for build and add it to the object.
        if (build.finishOnAgentDate) {
            build.unixTime = TimeUtilities.tcTimeToUnix(build.finishOnAgentDate)
        } else if (build.finishEstimate) {
            build.unixTime = TimeUtilities.tcTimeToUnix(build.finishEstimate)
        } else if (build.runningInfo) {
            build.unixTime = (Date.now() + build.runningInfo.leftSeconds * 1000)
        }

        return build
    }

    async interpretMisc(build) {

        // select miscellaneous element to add elements to with data for latest build
        let parentElement = document.getElementById(`${build.buildTypeId}_misc${build.suffix}`)

        // If latest build is state running then add the finish time in miscellaneous container
        if (build.state != 'finished') {

            let buildDate    = build.unixTime ? new Date(build.unixTime).toLocaleString() : 'calculating'
            let finishOnText = `⏰ ${buildDate}`
            render.createElement('div', null, null, finishOnText, parentElement, null)

        }

        // If build has tags iterate over them and place them in an element
        if (build.tags.tag.length > 0) {

            let tagsTitle = ''
            for (let tag of build.tags.tag) {
                tagsTitle += tag.name + '\n'
            }
            render.createElement('div', null, {'title': tagsTitle}, '📌', parentElement, null)
        }
    }

    async interpretBuildStats(buildTypeId, suffix, testOccurrences, parentProjectData) {

        let parentElement = document.getElementById(`${buildTypeId}_test_statistics${suffix}`)

        // Loop through testcases to find investigated failed tests
        let investigation = 0
        for (let i = 0; i < testOccurrences.testOccurrence.length; i++) {
            if (testOccurrences.testOccurrence[i].currentlyInvestigated){
                investigation++
            }
        }

        // Create text for testdata: investigated, newfailed, ignored, muted and calculate percentages
        let currentUninvestigated = testOccurrences.count - testOccurrences.passed - investigation
        let newFailed      = testOccurrences.newFailed > 0 ? `(${testOccurrences.newFailed}x🚩)` : ''
        let investigated   = investigation > 0 ? `(${investigation}x🕵)` : ''
        let unInvestigated = currentUninvestigated > 0 ? `(${currentUninvestigated}x🙈)` : ''
        let ignored        = testOccurrences.ignored > 0 ? `(${testOccurrences.ignored}x🙉)` : ''
        let muted          = testOccurrences.muted > 0 ? `(${testOccurrences.muted}x🙊)` : ''
        let percentage     = Number((testOccurrences.passed/testOccurrences.count)*100).toFixed(2)
        let percentData    = testOccurrences.count > 0 ? `[${testOccurrences.passed}/${testOccurrences.count}] = ${percentage}%` : ''
        let text           = `${newFailed} ${investigated} ${unInvestigated} ${ignored} ${muted} ${percentData}`

        // Add test text to element
        render.createElement('div', null, null, text, parentElement, null)

        // If testOccurrences changed update all parentProjects with the new statistics totals
        if (testOccurrences.count > 0 ) {
            for (let i = 0; i < parentProjectData.length; i++) {

                parentProjectData[i].testSuccess += testOccurrences.passed
                parentProjectData[i].testTotal   += testOccurrences.count
                let percentage  = Number((parentProjectData[i].testSuccess/parentProjectData[i].testTotal)*100).toFixed(2)
                let text        = `[${parentProjectData[i].testSuccess}/${parentProjectData[i].testTotal}] = ${percentage}%`

                render.updateProjectStats(parentProjectData[i].id, suffix, text)
            }
        }

        // Remove finished build statistics interpretation from queue
        render.updateQueue(false, 1)
    }

    async interpretChanges(changes, changesDiv) {

        // Iterate over all changes and add data to the element from changes: Version, Link, User, Time
        Object.entries(changes.change).forEach(([key, change]) => {

            render.createElement('div', ['changeVersion'], null, `#${change.version}`, changesDiv, null)

            // Create a link to view the change made and build the url for it
            let fileList = change.files.file.map(file => file['relative-file']).join('\n')
            let linkText = `#${change.comment}`
            let attributes = {'href': `'${teamcity_base_url}/viewModification.html?modId=${change.id}&personal=false' title='${fileList}'`,
                        'target': '_blank'}
            render.createElement('div', ['changeLink'], attributes, linkText, changesDiv, null)

            // Add a username to the change use the email if this is a svn repo
            let userText = `${change.user?change.user.name:change.username}`
            render.createElement('div', ['changeUser'], null, userText, changesDiv, null)

            // Get the date this change was made and add it to the fields with a locale time
            let timeText = `${new Date(TimeUtilities.tcTimeToUnix(change.date)).toLocaleString()}`
            render.createElement('div', ['changeTime'], null, timeText, changesDiv, null)
        })

        if (!changes.change || changes.change.length == 0) {
            render.createElement('p', ['emptyChanges'], null, 'Nobody to blame... 😭', changesDiv, null)
        }

        // Remove finished changes interpretation from queue
        render.updateQueue(false, 1)
    }

    async interpretTests(testOccurrences, buildTypeId, buildId, testsDiv) {

        // Make an array to iterate over only Occurrence
        let testsData = []
        testsData = testsData.concat(testOccurrences.failure.testOccurrence, testOccurrences.error.testOccurrence, 
                                        testOccurrences.warning.testOccurrence, testOccurrences.unknown.testOccurrence)
        
        // Iterate over tests
        Object.entries(testsData).forEach(([key, test]) => {

            // Setup element variables
            let elementClass = ['message']
            let tags = ''
            let investigationNames = ''
            let attributes = {'target': '_blank',
                        'href': `${teamcity_base_url}/buildConfiguration/${buildTypeId}/${buildId}?showLog=${buildId}_${test.logAnchor}`}

            // Check if investigation is active on failed test
            if (test.test?.investigations?.investigation?.length == 0) {
                tags += '🙈'
            } else {
                investigationNames = test.test.investigations.investigation.map((investigation) => {return investigation.assignee.name})
                elementClass.push('testInvestigated')
                tags += '🕵'
            }

            if (test.ignored) {
                tags += '🙉'
            }
            if (test.muted) {
                tags += '🙊'
            }

            // Add element class for make up of test statusses.
            if (test.status == 'WARNING'){
                elementClass.push('warning')
            }
            if (test.status == 'FAILURE'){
                elementClass.push('error')
            }
            if (test.status == 'UNKNOWN'){
                elementClass.push('unknown')
            }

            // Create text for tests to display and add a hyperlink to the teamcity tests page
            let text = `${tags} ${investigationNames?'('+investigationNames+')': ''} ${test.test.parsedTestName.testShortName}\n → ${test.details}`
            let testsLink = render.createElement('a', elementClass, attributes, null, testsDiv, null)
            render.createElement('p', ['testsText'], null, text, testsLink, null)

            // If a failed test is investigated move it to the top of the container
            if (investigationNames) {
                render.moveElementToTop(testsLink, testsDiv)
            }
        })

        if (testsData.length == 0) (
            render.createElement('p', ['testsText'], null, 'No failed tests!', testsDiv, null)
        )

        // Remove finished tests interpretation from queue
        render.updateQueue(false, 4)
    }

    interpretMessage(message, messageDiv) {

        // Add status of messages as class to element
        let elementClasses = ['message']
        if (message.status == 2) {
            elementClasses.push('warning')
        } else if (message.status == 4) {
            elementClasses.push('error')
        } else {
            elementClasses.push('normal')
        }

        // Create a container for the message
        let messageParent = render.createElement('div', elementClasses, null, null, messageDiv, null)
        let subMessageDiv

        if (message.containsMessages && message.id != 0) {

            // Create a collapse button for submessages of message.
            let attributes  = {'onclick':`this.parentElement.getElementsByTagName('div')[0].classList.toggle('hidden');
            this.parentElement.getElementsByTagName('span')[0].classList.toggle('collapsed')`}
            render.createElement('span', ['collapseButton', 'collapsed'], attributes, '▼', messageParent, null)

            // Create a span to show the text of the message
            render.createElement('span', ['messageText'], attributes, message.text, messageParent, null)

            // Create a container for submessages to be placed under
            subMessageDiv   = render.createElement('div', ['messageSub', 'hidden'], null, null, messageParent, null)
        } else {

            // Create a span to show the text of the message if it doesn't have submessages.
            render.createElement('span', ['messageText'], null, message.text, messageParent, null)
        }

        // Remove finished message interpretation from queue
        render.updateQueue(false, 1)
        
        return subMessageDiv
    }
}