# plugin-country-map-pie-chart

This is the Plugin Country Map Pie Chart Superset Chart Plugin.

### Install required dependencies from superset

Clone superset from `https://github.com/ValtechMobility/superset.git` and in `/superset/superset-frontend/packages/superset-ui-core`
and `/superset/superset-frontend/packages/superset-ui-chart-controls` run

```
npm install -g
```

check if installation was successful

```
npm list -g --depth=0
```

### Usage

To build the plugin, run the following commands:

```
npm ci
npm run build
```

Alternatively, to run the plugin in development mode (=rebuilding whenever changes are made), start the dev server with the following command:

```
npm run dev
```

```
npm run dev-server
```

### for superset backend

```
docker-compose -f docker-compose-non-dev.yml pull
```

```
docker-compose -f docker-compose-non-dev.yml up  
```
