/* Main
/ 
/  run function to setup all the functions
/  create global variables for fields
/  setup the connections to fetch data by query and then send to interpret by data.js
/  load in configuration cookies and selections.
*/

const render    = new HtmlRender()
const query     = new QueryHelper()
const data      = new ApiDataInterpreter()
const user      = new UserHandler()

class Main {

    constructor() {

        this.end_time
        this.build_count      
        this.build_cutoff_days

        this.queueCount      = 0
        this.edit_selection  = null
        this.api_selection   = null
        this.selection
        this.named_selection = []

        this.projectFields
        this.importantFields
        this.buildTypeFields
        this.messageFields
        this.changeFields
        this.testOccurrencesFields
        this.buildDetailsFields
    }

    debug(message, priority) {

        // Priority debugs are giving an html alert
        if (priority) {
            alert(message)
            console.error(message)
        } else {
            console.log(message)
        }
    }

    initialize() {

        // Initialize dropdown for named selection with named selections from cookie
        this.initNamedSelection()

        // Initialize fields to get from rest API
        this.getFields()

        // Set time element to now
        this.timeSelectReset(false)
    }

    initNamedSelection() {

        //Fill dropdown with named selections from Cookie
        if (this.named_selection && user.getCookie('tcNamedSelection')!= "") {
            this.named_selection = JSON.parse(user.getCookie('tcNamedSelection'))
            for (let name in this.named_selection) {
                render.addNameDropdown(name)
            }
        }
    }

    run() {

        //Login to the teamcity server
        user.getCurrentUser().then(userTmp => {

            //initialize the selection to grab from API by current, cookie or named selections
            this.initializeSelection().then(selection => {

                //Clean up elements to append data to.
                render.cleanDataWrapper(selection.important_buildtypes)

                //Add the include projects wrapper elements
                render.addParentProjectElements(selection.include_projects)

                //Grab all projects by selection
                this.doProjects(selection)

                //Grab all Important BuildTypes
                this.doImportant(selection)

            })

        })

    }

    async doProjects(selection) {

        //Iterate over give projects from selection and handle them asynchronous
        for (let project of selection.include_projects) {
            let parentProjectData = []
            this.projectHandler(project, null, parentProjectData)
        }
    }

    async doImportant(selection) {

        render.updateQueue(true, 1)

        // Create an important container in the project container style to append buildtypes to
        let projectData = {}
        projectData.important       = true
        projectData.id              = 'importantBuildTypes'
        projectData.name            = 'Important'
        projectData.order           = 0
        projectData.parentProjectId = 'important_wrapper'
        data.interpretProject(projectData)

        // Iterate over all specified buildtypes in the important selection with consistent order
        let order = 0
        for (let buildTypeId of selection.important_buildtypes) {
            order++
            render.updateQueue(true, 1)

            // Query name data for containers from teamcity add some other specific data and send to handler.
            let importantBuildType       = await query.getImportantBuildType(buildTypeId)
            importantBuildType.projectId = 'importantBuildTypes'
            importantBuildType.order     = order
            importantBuildType.suffix    = '_important'
            this.buildTypeHandler(importantBuildType)

            render.updateQueue(false, 1)
        }
    }

    async projectHandler(project, order, parentProjectData) {

        render.updateQueue(true, 1)

        //fetch data of the project with give Id
        let projectData = await query.getProject(project)

        projectData.order = order

        parentProjectData.push({'id': project, 'testSuccess': 0, 'testTotal': 0})

        data.interpretProject(projectData)

        //If there are buildTypes send them to handler
        if (projectData.buildTypes.buildType) {
            Object.entries(projectData.buildTypes.buildType).forEach(([key, buildType]) =>{
                buildType.order  = key
                buildType.suffix = '' 
                this.buildTypeHandler(buildType, parentProjectData)
            })
        }

        //If project has subprojects go through all
        if (projectData.projects.project) {
            //Place projects under buildTypes
            let suborder = projectData.buildTypes?projectData.buildTypes.buildType.length:0

            Object.entries(projectData.projects.project).forEach(([key, subProject]) => {
                subProject.parentProjectData = [ ...parentProjectData ]
                this.projectHandler(subProject.id, suborder+key, subProject.parentProjectData)
            }) 
        }

    }

    //Handle specified buildType
    async buildTypeHandler(buildType, parentProjectData) {

        render.updateQueue(true, 1)

        //get builds of buildType
        buildType.builds = await query.getBuilds(buildType.id)

        if (!buildType.builds.build[0]){
            render.updateQueue(false, 1)
            return
        }

        //interpret and render details of the buildType
        data.interpretBuildType(buildType)

        let builds = buildType.builds.build

        //iterate over all the builds
        for (let i = 0; i < builds.length; i++){

            render.updateQueue(true, 1)

            if (i+1 < builds.length && builds[i]?.testOccurrences?.passed != builds[i+1]?.testOccurrences?.passed) {
                builds[i].statusChanged = true
            }
            if (builds[i]['running-info']) {
                builds[i].runningInfo = builds[i]['running-info']
            }

            // Get a build date to show in details
            builds[i] = data.getBuildDate(builds[i])

            //get suffix to prevent duplicates for buildtypes in important selection and project selection
            builds[i].suffix = buildType.suffix

            //interpret and render build
            data.interpretBuild(builds[i])
        }

        data.interpretMisc(builds[0])

        this.doBuildStats(builds[0].id, buildType.id, buildType.suffix, parentProjectData)
    }

    //Add statistics of last builds to buildTypes and projects
    async doBuildStats(buildId, buildTypeId, suffix, parentProjectData) {
        
        render.updateQueue(true, 1)

        let testOccurrences = await query.getTestOccurrences(buildId)

        data.interpretBuildStats(buildTypeId, suffix, testOccurrences, parentProjectData)
    }

    async getBuildDetails(buildId, buildTypeId, suffix) {

        render.updateQueue(true, 5)

        //Create container for build details
        let container = render.setupBuildDetails(buildId, buildTypeId, suffix)

        //Get data for testOccurrences with more detail
        let testOccurrences = {}
        testOccurrences.failure = await query.getTestOccurrencesDetailed(buildId, "failure")
        testOccurrences.error   = await query.getTestOccurrencesDetailed(buildId, "error")
        testOccurrences.warning = await query.getTestOccurrencesDetailed(buildId, "warning")
        testOccurrences.unknown = await query.getTestOccurrencesDetailed(buildId, "unknown")
        
        data.interpretTests(testOccurrences, buildTypeId, buildId, container.tests)

        //Get messages for buildId
        let mainMessages = await query.getMessages(buildId)
        Object.entries(mainMessages.messages).forEach(async ([key, mainMessage]) => {

            render.updateQueue(true, 1)
            
            let messageDiv = data.interpretMessage(mainMessage, container.message)

            //Iterate over all messages that are from buildId with a message parent
            this.messageRecursively(buildId, mainMessage, messageDiv)
        })

        //Get changes for buildId
        let changes = await query.getChanges(buildId)
        data.interpretChanges(changes, container.changes)
    }

    //Get messages that are placed under other messages.
    async messageRecursively(buildId, message, messageDiv) {

        //Check if message has sub message
        if (message.containsMessages && message.id != 0) {

            //Get submessages
            let moreMessages = await query.getMoreMessages(buildId, message.id)

            //iterate over submessages render them and check if these also contain submessages
            Object.entries(moreMessages.messages).forEach(([key, subMessage]) => {

                //Filter on messages that are submessages of the parent
                if (subMessage.parentId == message.id) {

                    render.updateQueue(true, 1)

                    let subMessageDiv = data.interpretMessage(subMessage, messageDiv)

                    //Iterate over all messages that are from buildId with this submessage as parent
                    this.messageRecursively(buildId, subMessage, subMessageDiv)
                }
            })
        }
    }

    async initializeSelection() {

        //Check teamcity if user has favorite projects
        await user.getFavoriteProjects().then((response_selection) => {
            this.api_selection = response_selection

            if (this.edit_selection) {
                this.selection = this.edit_selection
            } else if (user.getCookie('tcSelection')!= "") {       
                this.edit_selection = this.selection = JSON.parse(user.getCookie('tcSelection'))
            } else if (api_selection.include_projects?.length == 0) {
                this.edit_selection = this.selection = this.default_selection
            } else {
                this.edit_selection = this.selection = this.api_selection
            }
        })

        render.updateSelectionForm(this.selection, this.edit_selection)

        return this.selection
    }

    selectFavorite() {
        user.getFavoriteProjects()
            .then((favorite_projects) => {
                edit_selection = favorite_projects
                render.updateSelectionForm(null, edit_selection)
            })
    }

    //Make a string of the fields that are placed in a json variable declared in fields.js
    getFields() {

        let Fields = JSON.parse(ApiTcFields.fields)

        this.projectFields         = `fields=${this.getFieldsRecursively(Fields.project_fields)}`
        this.importantFields       = `fields=${this.getFieldsRecursively(Fields.important_fields)}`
        this.buildTypeFields       = `fields=${this.getFieldsRecursively(Fields.buildType_fields)}`
        this.messageFields         = `fields=${this.getFieldsRecursively(Fields.message_fields)}`
        this.changeFields          = `fields=${this.getFieldsRecursively(Fields.change_fields)}`
        this.testOccurrencesFields = `fields=${this.getFieldsRecursively(Fields.testOccurrences_fields)}`
        this.buildDetailsFields    = `fields=${this.getFieldsRecursively(Fields.buildDetails_fields)}`

    }

    //add the fields key to string and check if it has an object as value rerun function if it does.
    getFieldsRecursively(objFields) {

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
                    fieldsString += '('+this.getFieldsRecursively(element)+')'

                //Check if entry is last element if not add a ','
                if (index < fieldEntries.length)
                    fieldsString += ','
            })
        }
        else {
            this.debug('no fields sepicified in fields.js', true)
        }

        return fieldsString
    }

    // Select a file to save selection data to
    selectFile() {

        const link = document.createElement("a")
        link.download = "tcBuildViewer_selection.json"
        const blob = new Blob([JSON.stringify(selection, undefined, 2)], { type: "text/plain" })
        link.href=window.URL.createObjectURL(blob)
        link.click()

    }

    // Select a file to load selection data from
    selectRunFile() {

        const selectionFile = document.createElement("input")
        selectionFile.type = "file"

        selectionFile.onchange = e => {
            const file = e.target.files[0]
            const reader = new FileReader()

            reader.readAsBinaryString(file)

            reader.onload = readerEvent => {
                edit_selection = JSON.parse(readerEvent.target.result)
                console.log(edit_selection)
                render.updateSelectionForm()
            }
        }    

        selectionFile.click()

    }

    //Reset the time for the build selection to now
    timeSelectReset(run) {

        this.build_count       = 14
        this.build_cutoff_days = 14
        this.end_time          = new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString().split('.')[0]
        
        render.timeElementSet({'build_count':build_count, 'build_cutoff_days':build_cutoff_days, 'end_time':end_time})
        this.end_time = null

        if(run) {
            run()
        }
    }

    //Apply values set in time selection on the webpage to used variables
    applyTimeSelect() {

        this.build_count       = document.getElementById('build_count').value
        this.build_cutoff_days = document.getElementById('build_cutoff_days').value
        this.end_time          = document.getElementById('end_time').value
        
        run()
    }
}