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

To add the package to Superset, go to the `superset-frontend` subdirectory in your Superset source folder (assuming both the `plugin-country-map-pie-chart`
plugin and `superset` repos are in the same root directory) and run

```
npm i -S ../../../Aspice_DLCM_Control_Center/aspice/software_units/superset_custom_auth/charts/plugin-country-map-pie-chart
```

After this edit the `superset-frontend/src/visualizations/presets/MainPreset.js` and make the following changes:

```js
import {PluginCountryMapPieChart} from 'plugin-country-map-pie-chart';
```

to import the plugin and later add the following to the array that's passed to the `plugins` property:

```js
new PluginCountryMapPieChart().configure({key: 'plugin-country-map-pie-chart'}),
```

After that the plugin should show up when you run Superset, e.g. the development server:

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
