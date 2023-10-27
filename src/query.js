/* Query
/  
/  Establish connection with user.js and communicate with teamcity rest api
/  
/  Send api requests and pass data to function in main to data.js
*/

class QueryHelper {

    //Fetch data from teamcity rest api with specified locater_url
    apiQuery(locaterUrl)
    {

        let result = fetch(`${teamcity_base_url}/app/${locaterUrl}`, {
            headers: {
                "Accept": "application/json"
            },
            credentials: 'include',
            priority: 'high'
        }, this)
        .then((result) => {
            if (result.status == 200) {
                return result.json()
            } else if (result.status == 404){
                return Promise.reject('Page not found.')
            } else {
                return Promise.reject('User not logged in.')
            }
        })
        .then((output) => {
            return output
        })
        .catch(error => main.debug(error, true))

        return result

    }

    //Check in api if user is logged in and return result
    async userLoggedIn() {

        try {

            const promise = await fetch(`${teamcity_base_url}/app/rest/users/current`, {
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            })

            if (promise?.ok) {
                this.tcUser = await promise.json()
                return true
            } else {
                return false
            }
            
        } catch (err) {
            main.debug(err, true)
            return false
        }

    }

    async getImportantBuildType(buildTypeId) {
        let locatorUrl = `rest/buildTypes/id:${buildTypeId}?${main.importantFields}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Setup url to get projects with specified fields and return fetched data
    async getProject(projectId)
    {
        let locatorUrl = `rest/projects/id:${projectId}?${main.projectFields}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Setup url to get builds with specified fields and return fetched data
    async getBuilds(buildTypeId) {
        let queuedBoundries  = ''
        if (main.end_time){
            queuedBoundries += `queuedDate:(date:${TimeUtilities.cutoffTcString(TimeUtilities.htmlDateTimeToDate(main.end_time))},condition:after),`
            queuedBoundries += `queuedDate:(date:${TimeUtilities.htmlDateTimeToTcTime(main.end_time)},condition:before)`
        } else {
            queuedBoundries += `queuedDate:(date:${TimeUtilities.cutoffTcString()},condition:after)`
        }
        let constantvars     = 'locator=defaultFilter:false,branch:default:true,state:any,'
        let flexiblevars     = `buildType:(id:${buildTypeId}),${queuedBoundries},count:${main.build_count}&${main.buildTypeFields}`
        let locatorUrl       = `rest/builds?${constantvars}${flexiblevars}`
        let output           = await this.apiQuery(locatorUrl)
        return output
    }

    //Get all test results with only result.
    async getTestOccurrences(buildId) {
        
        let locatorUrl = `rest/testOccurrences?locator=build:(id:${buildId}),count:-1&${main.testOccurrencesFields}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Get test results with specified status in more detail.
    async getTestOccurrencesDetailed(buildId, testStatus) {

        let locatorUrl = `rest/testOccurrences?locator=build:(id:${buildId}),count:-1,status:(${testStatus})&${main.buildDetailsFields}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Get messages of a build by the build id
    async getMessages(buildId) {

        let locatorUrl = `messages?buildId=${buildId}&filter=important&${main.messageFields}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Get submessages of a build by the build id and the message id.
    async getMoreMessages(buildId, messageId) {
        //%23 is a #
        let locatorUrl = `messages?buildId=${buildId}&filter=important&messageId=${messageId}&view=flowAware&_focus=${messageId}%23_state=0,${messageId}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Get changes made if newfailed is true
    async getChanges(buildId) {

        let locatorUrl = `rest/changes?locator=build:(id:${buildId})&${main.changeFields}`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }

    //Get favorite projects from teamcity of user that is logged in
    async getFavoriteTcProjects() {

        let locatorUrl = `rest/projects?locator=archived:false,selectedByUser:(user:(current),mode:selected)&fields=project(id,parentProjectId)`
        let output     = await this.apiQuery(locatorUrl)
        return output
    }
}