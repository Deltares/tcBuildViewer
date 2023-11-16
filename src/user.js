/* User
/  
/  Manage teamcity user credentials for login
/
/  Add a login field if the user is not logged in in teamcity
/  Handle cookies and favorite projects
*/

class UserHandler {

    async getCurrentUser() {

        if (!await query.userLoggedIn()) {

            // Show login button if the user is not logged in.
            render.loginElement('waiting for login.', false)

            do {
                main.debug("waiting for TeamCity login ...", false)
                await new Promise(resolve => setTimeout(resolve, 1000))
            } while (! await query.userLoggedIn())

        }
        render.loginElement(query.tcUser.username, true)
        
    }

    // Get favorite projects from TeamCity API.
    async getFavoriteProjects() {

        // Assume that things work, now that the user is logged in.
        const projects = await query.getFavoriteTcProjects()

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

        if (!main.named_selection[name]) {
            render.addNameDropdown(name)
        }

        main.named_selection[name] = main.selection

        main.debug(main.named_selection, false)
        
        this.setCookie('tcNamedSelection',JSON.stringify(main.named_selection),365)

    }

    // Remove 'named project selection'.
    removeNamedSelection(name) {

        if (name == 'none') {
            return
        }

        render.removeNameDropdown(name)

        delete main.named_selection[`${name}`]

        main.debug(JSON.stringify(main.named_selection, undefined, 2), false)
        
        this.setCookie('tcNamedSelection',JSON.stringify(main.named_selection),365)

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
        for(let element of ca) { 
          while (element.startsWith(' ')) { 
            element = element.substring(1) 
          } 
          if (element.startsWith(name)) { 
            return element.substring(name.length, element.length) 
          } 
        } 
        return '' 
      }
}