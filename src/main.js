/* Main
/ 
/  run function to setup all the functions
/  create global variables for fields
/  setup the connections to fetch data by query and then send to interpret by data.js
/  load in configuration cookies and selections.
*/

function debug(message, priority) {

    // Priority debugs are giving an html alert
    if (priority) {
        alert(message)
        console.error(message)
    } else {
        console.log(message)
    }
}

function initialize() {

    // Render -> render.js
    Render = new render()
    // Query -> query.js
    Query  = new query()
    // Data -> data.js
    Data   = new data()
    // Time -> time.js
    Time   = new time()
    // User -> user.js
    User   = new user()

    // Initialize the count for queue
    queueCount = 0

    edit_selection = null
    api_selection  = null

    // Initialize dropdown for named selection with named selections from cookie
    initNamedSelection()

    // Initialize fields to get from rest API
    getFields()

    // Set time element to now
    timeSelectReset(false)
}

function initNamedSelection() {

    //Fill dropdown with named selections from Cookie
    if (named_selection && User.getCookie('tcNamedSelection')!= "") {
        named_selection = JSON.parse(User.getCookie('tcNamedSelection'))
        for (let name in named_selection) {
            Render.addNameDropdown(name)
        }
    }
}

function run() {

    //Login to the teamcity server
    User.getCurrentUser().then(user => {

        //initialize the selection to grab from API by current, cookie or named selections
        initializeSelection().then(selection => {

            //Clean up elements to append data to.
            Render.cleanDataWrapper(selection.important_buildtypes)

            //Add the include projects wrapper elements
            Render.addParentProjectElements(selection.include_projects)

            //Grab all projects by selection
            doProjects(selection)

            //Grab all Important BuildTypes
            doImportant(selection)

        })

    })

}

async function doProjects(selection) {

    //Iterate over give projects from selection and handle them asynchronous
    for (let project of selection.include_projects) {
        let parentProjectData = []
        projectHandler(project, null, parentProjectData)
    }
}

async function doImportant(selection) {

    Render.updateQueue(true, 1)

    // Create an important container in the project container style to append buildtypes to
    let projectData = {}
    projectData.important       = true
    projectData.id              = 'importantBuildTypes'
    projectData.name            = 'Important'
    projectData.order           = 0
    projectData.parentProjectId = 'important_wrapper'
    Data.interpretProject(projectData)

    // Iterate over all specified buildtypes in the important selection with consistent order
    let order = 0
    for (let buildTypeId of selection.important_buildtypes) {
        order++
        Render.updateQueue(true, 1)

        // Query name data for containers from teamcity add some other specific data and send to handler.
        let importantBuildType       = await Query.getImportantBuildType(buildTypeId)
        importantBuildType.projectId = 'importantBuildTypes'
        importantBuildType.order     = order
        importantBuildType.suffix    = '_important'
        buildTypeHandler(importantBuildType)

        Render.updateQueue(false, 1)
    }
}

async function projectHandler(project, order, parentProjectData) {

    Render.updateQueue(true, 1)

    //fetch data of the project with give Id
    projectData = await Query.getProject(project)

    projectData.order = order

    parentProjectData.push({'id': project, 'testSuccess': 0, 'testTotal': 0})

    Data.interpretProject(projectData)

    //If there are buildTypes send them to handler
    if (projectData.buildTypes.buildType) {
        Object.entries(projectData.buildTypes.buildType).forEach(([key, buildType]) =>{
            buildType.order  = key
            buildType.suffix = '' 
            buildTypeHandler(buildType, parentProjectData)
        })
    }

    //If project has subprojects go through all
    if (projectData.projects.project) {
        //Place projects under buildTypes
        let suborder = projectData.buildTypes?projectData.buildTypes.buildType.length:0

        Object.entries(projectData.projects.project).forEach(([key, subProject]) => {
            subProject.parentProjectData = [ ...parentProjectData ]
            projectHandler(subProject.id, suborder+key, subProject.parentProjectData)
        }) 
    }

}

//Handle specified buildType
async function buildTypeHandler(buildType, parentProjectData) {

    Render.updateQueue(true, 1)

    //get builds of buildType
    buildType.builds = await Query.getBuilds(buildType.id)

    if (!buildType.builds.build[0]){
        Render.updateQueue(false, 1)
        return
    }

    //interpret and render details of the buildType
    Data.interpretBuildType(buildType)

    let builds = buildType.builds.build

    //iterate over all the builds
    for (i = 0; i < builds.length; i++){

        Render.updateQueue(true, 1)

        if (i+1 < builds.length && builds[i]?.testOccurrences?.passed != builds[i+1]?.testOccurrences?.passed) {
            builds[i].statusChanged = true
        }
        if (builds[i]['running-info']) {
            builds[i].runningInfo = builds[i]['running-info']
        }

        // Get a build date to show in details
        builds[i] = Data.getBuildDate(builds[i])

        //get suffix to prevent duplicates for buildtypes in important selection and project selection
        builds[i].suffix = buildType.suffix

        //interpret and render build
        Data.interpretBuild(builds[i])
    }

    Data.interpretMisc(builds[0])

    doBuildStats(builds[0].id, buildType.id, buildType.suffix, parentProjectData)
}

//Add statistics of last builds to buildTypes and projects
async function doBuildStats(buildId, buildTypeId, suffix, parentProjectData) {
    
    Render.updateQueue(true, 1)

    let testOccurrences = await Query.getTestOccurrences(buildId)

    Data.interpretBuildStats(buildTypeId, suffix, testOccurrences, parentProjectData)
}

async function getBuildDetails(buildId, buildTypeId, suffix) {

    Render.updateQueue(true, 5)

    //Create container for build details
    let container = Render.setupBuildDetails(buildId, buildTypeId, suffix)

    //Get data for testOccurrences with more detail
    let testOccurrences = {}
    testOccurrences.failure = await Query.getTestOccurrencesDetailed(buildId, "failure")
    testOccurrences.error   = await Query.getTestOccurrencesDetailed(buildId, "error")
    testOccurrences.warning = await Query.getTestOccurrencesDetailed(buildId, "warning")
    testOccurrences.unknown = await Query.getTestOccurrencesDetailed(buildId, "unknown")
    
    Data.interpretTests(testOccurrences, buildTypeId, buildId, container.tests)

    //Get messages for buildId
    let mainMessages = await Query.getMessages(buildId)
    Object.entries(mainMessages.messages).forEach(async ([key, mainMessage]) => {

        Render.updateQueue(true, 1)
        
        let messageDiv = Data.interpretMessage(mainMessage, container.message)

        //Iterate over all messages that are from buildId with a message parent
        messageRecursively(buildId, mainMessage, messageDiv)
    })

    //Get changes for buildId
    let changes = await Query.getChanges(buildId)
    Data.interpretChanges(changes, container.changes)
}

//Get messages that are placed under other messages.
async function messageRecursively(buildId, message, messageDiv) {

    //Check if message has sub message
    if (message.containsMessages && message.id != 0) {

        //Get submessages
        let moreMessages = await Query.getMoreMessages(buildId, message.id)

        //iterate over submessages render them and check if these also contain submessages
        Object.entries(moreMessages.messages).forEach(([key, subMessage]) => {

            //Filter on messages that are submessages of the parent
            if (subMessage.parentId == message.id) {

                Render.updateQueue(true, 1)

                let subMessageDiv = Data.interpretMessage(subMessage, messageDiv)

                //Iterate over all messages that are from buildId with this submessage as parent
                messageRecursively(buildId, subMessage, subMessageDiv)
            }
        })
    }
}

async function initializeSelection() {

    selection
    named_selection
    edit_selection
    api_selection

    //Check teamcity if user has favorite projects
    await User.getFavoriteProjects().then((response_selection) => {
        api_selection = response_selection

        if (edit_selection) {
            selection = edit_selection
        } else if (User.getCookie('tcSelection')!= "") {       
            edit_selection = selection = JSON.parse(User.getCookie('tcSelection'))
        } else if (api_selection.include_projects?.length == 0) {
            edit_selection = selection = default_selection
        } else {
            edit_selection = selection = api_selection
        }
    })

    Render.updateSelectionForm(selection, edit_selection)

    return selection
}

function selectFavorite() {
    User.getFavoriteProjects()
        .then((favorite_projects) => {
            edit_selection = favorite_projects
            Render.updateSelectionForm(null, edit_selection)
        })
}

//Make a string of the fields that are placed in a json variable declared in fields.js
function getFields() {

    Fields = JSON.parse(fields)

    projectFields         = `fields=${getFieldsRecursively(Fields.project_fields)}`
    importantFields       = `fields=${getFieldsRecursively(Fields.important_fields)}`
    buildTypeFields       = `fields=${getFieldsRecursively(Fields.buildType_fields)}`
    messageFields         = `fields=${getFieldsRecursively(Fields.message_fields)}`
    changeFields          = `fields=${getFieldsRecursively(Fields.change_fields)}`
    testOccurrencesFields = `fields=${getFieldsRecursively(Fields.testOccurrences_fields)}`
    buildDetailsFields    = `fields=${getFieldsRecursively(Fields.buildDetails_fields)}`

}

//add the fields key to string and check if it has an object as value rerun function if it does.
function getFieldsRecursively(objFields) {

    //Initialize some variables for iteration
    let fieldsString = ''
    let index        = 0
    let fieldEntries = Object.entries(objFields)

    //Check if objFields is declared
    if (objFields){

        //Iterate over the object.
        fieldEntries.forEach(([key, element]) => {
            index++

            //Add key value of the object to string
            if (key)
                fieldsString += key

            //check if element is an object and if it is iterate over it
            if (typeof element == 'object')
                fieldsString += '('+getFieldsRecursively(element)+')'

            //Check if entry is last element if not add a ','
            if (index < fieldEntries.length)
                fieldsString += ','
        })
    }
    else {
        debug('no fields sepicified in fields.js', true)
    }

    return fieldsString
}

// Select a file to save selection data to
function selectFile() {

    const link = document.createElement("a")
    link.download = "tcBuildViewer_selection.json"
    const blob = new Blob([JSON.stringify(selection, undefined, 2)], { type: "text/plain" })
    link.href=window.URL.createObjectURL(blob)
    link.click()

}

// Select a file to load selection data from
function selectRunFile() {

    const selectionFile = document.createElement("input")
    selectionFile.type = "file"

    selectionFile.onchange = e => {
        const file = e.target.files[0]
        const reader = new FileReader()

        reader.readAsBinaryString(file)

        reader.onload = readerEvent => {
            edit_selection = JSON.parse(readerEvent.target.result)
            console.log(edit_selection)
            Render.updateSelectionForm()
        }
    }    

    selectionFile.click()

}

//Reset the time for the build selection to now
function timeSelectReset(run) {

    build_count       = 14
    build_cutoff_days = 14
    end_time          = new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString().split('.')[0]
    
    Render.timeElementSet({'build_count':build_count, 'build_cutoff_days':build_cutoff_days, 'end_time':end_time})
    end_time = null

    if(run) {
        run()
    }
}

//Apply values set in time selection on the webpage to used variables
function applyTimeSelect() {

    build_count       = document.getElementById('build_count').value
    build_cutoff_days = document.getElementById('build_cutoff_days').value
    end_time          = document.getElementById('end_time').value
    
    run()
}