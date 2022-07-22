# mapboxgl.js freeCamera API Lerp Example

Shows two mapboxGL maps side by side following a geojson linestring with the [freeCamera API](https://docs.mapbox.com/mapbox-gl-js/api/properties/#freecameraoptions)

Both maps are using custom camera controls, but the map on the right makes use of linear interpolation (aka 'lerp') when calculating the position of the camera for each frame.  This creates a "smoothing" effect and ensures that the camera is never moving too abruptly from its previous position.

View the site on [github pages](chriswhong.github.io/mapboxgl-freecamera-lerp)

The route shown in this example is stage 10 of the 2022 Tour de France