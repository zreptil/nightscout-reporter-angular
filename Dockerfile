FROM node:20.16.0 AS build

WORKDIR /opt/app
ADD . /opt/app
 
#### install angular cli
RUN npm install -g @angular/cli

#### install project dependencies
RUN npm install

#### generate build
RUN npm run build
 

FROM nginx:latest
#### copy nginx conf
#COPY ./nginx.conf /etc/nginx/conf.d/default.conf

#### copy artifact build from the 'build environment'
COPY --from=build /opt/app/dist/nightrep /usr/share/nginx/html

