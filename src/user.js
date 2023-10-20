/* User
/  
/  Manage teamcity user credentials for login
/
/  Add a login field if the user is not logged in in teamcity
/  Handle cookies and favorite projects
*/

class user {

    async getCurrentUser() {

        if (!await Query.userLoggedIn()) {

            // Show login button if the user is not logged in.
            Render.loginElement('waiting for login.', false)

            do {
                debug("waiting for TeamCity login ...", false)
                await new Promise(resolve => setTimeout(resolve, 1000))
            } while (! await Query.userLoggedIn())

        }
        Render.loginElement(Query.tcUser.username, true)
        
    }

    // Get favorite projects from TeamCity API.
    async getFavoriteProjects() {

        // Assume that things work, now that the user is logged in.
        const projects = await Query.getFavoriteTcProjects()

        const all_project_ids = projects.project.map(x => x.id) // Only need IDs to (array-)filter on.

        // Only projects whose parent projects are not in the list, to avoid redundancy.
        const favoriteProjectObjects = projects.project.filter( project => {
            return !all_project_ids.includes(project.parentProjectId)
        })

        const favorite_projects = favoriteProjectObjects.map(x => x.id) // Only need IDs for selection.

        // Selection JSON structure.
        let api_selection = {
            include_projects: favorite_projects,
            exclude_projects: [],
        }
        return api_selection
    }

    // Create 'named project selection' to switch between.
    storeNamedSelection(name) {

        if (!named_selection[name]) {
            Render.addNameDropdown(name)
        }

        named_selection[name] = selection
        
        setCookie('tcNamedSelection',JSON.stringify(named_selection),365)

    }

    // Remove 'named project selection'.
    removeNamedSelection(name) {

        if (name == 'none') {
            return
        }

        Render.removeNameDropdown(name)

        delete named_selection[`${name}`]

        debug(JSON.stringify(named_selection, undefined, 2), false)
        
        setCookie('tcNamedSelection',JSON.stringify(named_selection),365)

    }

    setCookie(cname, cvalue, exdays) {
        const d = new Date()
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
        const expires = "expires="+d.toUTCString()
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=None;Secure"
    }
    
    getCookie(cname) {
        const name = cname + '='
        const ca = document.cookie.split(';')
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i]
            while (c.charAt(0) == ' ') {
                c = c.substring(1)
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length)
            }
        }
        return ''
    }
}