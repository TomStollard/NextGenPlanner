# NextGenPlanner
NextGen Planner is an online school planner built by the next generation, for the next generation. It includes a number of features, including:
- Support for complex tometables, both week and day based, with options for setting school days
- Homework adding system uses tometable data, allowing data to be entered quickly and easily
- API that exposes all functionality
- Almost completely client-side, allowing for good performance and use offline*
- Support for adding notes for days or weeks  
\* Not yet implemented

##Live Demo
A live version of this project can be found at <http://app.nextgenplanner.co.uk/>, and you can use this to store all of your homework and notes with no limitations. Alternative, if you'd like to store data on your own server, continue reading to find out how you can set this up.

##Installation
1. First, you'll need to have Node.JS installed, along with NPM. You'll also need to have a MongoDB server available.
2. Download a copy of the project and enter the directory:  

    ```
    git clone https://github.com/TomStollard/NextGenPlanner.git
    cd NextGenPlanner
    ```
3. Download all of the depencencies. Once this is complete, this will automatically trigger the downloading of front-end dependencies through bower, and will start the build process through gulp:

    ```
    npm install
    ```
    
    If you want to re-download dependencies or re-build at a later date without running npm install again, you can also do:
    ```
    npm run build
    npm run bower install
    ```
    
    `npm run build watch` is also available to continually re-build when files are modified - this is very useful in development, especially when combined with a tool like nodemon.
4. You'll then need to set your environment variables.  
    If you just want to run it on your local machine during development:
      - Copy .env.example to .env
      - Add your MongoDB URL as the value of the DBURL variable
    
    If you want to run it as a server, using pm2 is advised. You can also configure environment variables through it:
      - Copy processes.json.example to processes.json
      - Add your MongoDB URL to the DBURL parameter, under the env section.
5. You can then start up the server.  
    - If you're running it for development:
      - Intall node-foreman: `npm install -g foreman`
      - Start the server: `nf run npm start`

    - If you're using pm2:
      - Run `pm2 start processes.json`
      - You can then manage the process using the name "NextGenPlanner", eg `pm2 restart NextGenPlanner`
    
