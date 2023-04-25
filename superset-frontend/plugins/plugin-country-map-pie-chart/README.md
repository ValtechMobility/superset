# plugin-country-map-pie-chart

This plugin provides a visualization of pie charts per country. 

## Usage

### In dev mode with hot reload:

#### 1. Start the superset backend by running

```shell
cd ../../..
docker-compose -f docker-compose-non-dev.yml pull
```

```shell
cd ../../..
docker-compose -f docker-compose-non-dev.yml up  
```
Now, superset is already running.

#### 2. To start hot reload and view live updates in the superset FE run

```shell
cd ..
npm run dev-server
```

Got to localhost:9000 and login with username admin and password admin.


### Only build the plugin

Build required dependencies in `/superset/superset-frontend/packages/superset-ui-core`
and `/superset/superset-frontend/packages/superset-ui-chart-controls` 

```shell
cd ../../packages/superset-ui-core
npm install -g
cd ../superset-ui-chart-controls
npm install -g
```

check if installation was successful

```shell
npm list -g --depth=0
```


To build the plugin, run the following commands:

```shell
npm ci
npm run build
```
