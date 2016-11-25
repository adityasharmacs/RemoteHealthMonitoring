# Codenet UI with AngularJS

## Why use Angular

AngularJS is a structural framework for dynamic web apps. It lets you use HTML as your template language and lets you extend HTML's syntax to express your application's components clearly and succinctly. Angular's data binding and dependency injection eliminate much of the code you would otherwise have to write. And it all happens within the browser, making it an ideal partner with any server technology.

## Work So Far
Frontend code previously in `frontend` directory in codenet project has been migrated to `codenet-ui`. So far we have the following pages:

	* HomePage
	* User Registration Page
	* User Login Page
	* User Profile Page
	* Codebot Profile Page

##Installation Steps:

Once the repository is cloned, you can go in to the ```codenet-ui``` directory. From there dependencies can be installed using:

```npm install```

**Note.** node.js and npm needs to be installed to be able to run the frontend application.

You can install front-end packages using bower by running:

```bower install```

Once the dependencies are installed, you can run the application using:

```gulp build --server production```

This will generate all the Javascript and CSS files and save in the ```public``` folder. You can then start the application by executing:

```npm start```

Or, you can also start the server using one single gulp command:

```gulp start --server production```

**Note** You can give --server argument as ```development``` or ```production```. This loads the server URL dynamically from configuration files in ```config``` folder. The default server is ```development```.

##Development

In order to make front-end development easy, we have gulp watchers that keep an eye on changes in .js or .less files and reboots the server automatically when a new change to any of the files is saved.

```gulp develop```

This will automatically generate all the Javascript and CSS files and save in the ```public``` folder and start the server in port 4000. And, will restart anytime a new change is detected in any .js and .less files.

##Test

Protractor is an end-to-end test framework for AngularJS applications. Protractor is a Node.js program built on top of WebDriverJS. Protractor runs tests against your application running in a real browser, interacting with it as a user would.

```gulp test```

**Note** Selenium Server should be running at http://localhost:4444/wd/hub for the tests to pass.

You can have the Selenium Server up and running using the below commands:

```gulp webdriver_update```

```gulp webdriver_standalone```
