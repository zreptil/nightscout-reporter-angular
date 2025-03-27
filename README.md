# Nightscout Reporter

A web app based on Angular to create PDF documents from nightscout data.

It uses the api from cgm-remote-monitor to access the nightscout data and
creates PDFs for handing out to diabetes doctors or coaches.

This is the transfer from Dart to Angular which was neccessary, since Dart is no longer maintained by the creators and the community-version of dart is not good enough with handling the dependencies of the framework. Hopefully Angular support will last longer than that of Dart.

Online version available at: https://nightrep.zreptil.de/  
Compiled project avaialbe at: https://nightrep.zreptil.de/nightscout-reporter_local.zip

## Getting started

Initial steps to compile, deploy, and run nightscout reporter on your own infrastructure.

### Preparation

* Download or git clone the repository
* Download and install node.js from https://nodejs.org
* Install Angular using "npm install -g @angular/cli"

### Build

* Call build.bat from the repository folder in cmd
* Result will be avaialbe in directory _dist/nightrep/browser_

### Deploy

* Get a web server (or online webspace)
* Copy content of _dist/nightrep/browser_ to the content folder of your web server (or any subfolder)

You can run your own nightscout-reporter instance by calling the URL of your web-server in a browser.

### IIS Hosting

#### Web.config

A web.config file is provided in the root-directory of the deployment.

#### external datasources

For using data from external datasources in the reports you need to set up PHP at your website.
This is necessary since many webservices that use OAUTH2 don't allow access from webapps
in the browser but have no problem when accessing the same using any other client than a browser.

The php-part of the website is placed in folder _backend_ at the website. The sources for this
folder can be found in _src/\_php/src_. You have to place the variables needed to
access a certain webservice in the given file in the subfolder _config/apps_.

During the buildprocess the files from folder _build-replacements/\_php/config/apps_ will
be copied to the destination.

So you can place your configuration in the files there. These files will not be available in
github at this place, since they have to contain the configuration depending on the
apps that were set up for access via oauth2 at the desired destinations.

If the configuration for a datasource is missing, it will not be available in Nightscout
Reporter for use in reports.

## Installation with Docker

### Build

* git clone the repository
* Run the docker build command in the root directory of the project. This will create a docker image with the name "nightscout-reporter".

```
docker build . -t nightscout-reporter
```

### Run

* Run the docker image with the following command. This will start a container with the name "nightscout-reporter" and expose the port 8088 to the host.

```
docker run --name some-nginx -d -p 8088:80 nightscout-reporter
```

> you can choose any port you want to expose to the host. Just replace the 8088 with the port you want to use.

## Internationalization

#### (i18n is short for i-nternationalizatio-n - i followed by 18 letters and the letter n)

Every text in nightscout reporter can be translated. For this purpose Angular Internationalization is used: https://angular.io/guide/i18n-overview. The source
language for nightscout reporter is german. I decided this, since this is my mother tongue and creating the program needed focus on the programming and not on
the translation. So the first source of the translation is german. The translation itself takes place in https://crowdin.com/ and is mainly done by the community.
I (zreptil) provide german and english as source for translations. The process of creating the translation follows these steps:

1. Extract all texts from code
2. Upload the created file with german language to crowdin

- Translate all texts from german to the given target languages
- Download the files for the target languages

3. Create the target language file for english as a source language file
4. Upload the created file with english language to crowdin

- Translate all texts from english to the given target languages
- Download the files for the target languages

5. Create the file assets/messages.json for use in the application

As you can see, the process is extensive and has some specialities since I decided to use german as source language. To make this tasks easier and reduce the source
for problems, I created some helper-programs to go through the tasks. The tasks can be executed by going through the package.json and run the commands that start
with "i18n-" and the number in the list above.

This works on a windows installation. I think the scripts have to be changed, when running in another environment. But since I am the only one who can upload the
files to this crowdin projects and do the management of the languages there, I wrote this only to have a documentation of the concept. Everyone is invited to adapt this for his
own purposes, but I cannot provide support for systems I do not run by myself.

## Updates

for updating angular to a newer version use this line in the terminal (windows powershell):

_$v=xxx ; ng update @angular/core@$v @angular/cli@$v @angular/material@$v_

xxx is the version number to update to.
