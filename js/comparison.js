import { computeCameraPosition } from "./util.js";

const animatePath = async ({
    map,
    duration,
    path,
    startBearing,
    startAltitude,
    pitch,
    smooth
}) => {
    return new Promise(async (resolve) => {
        const pathDistance = turf.lineDistance(path);
        let startTime;

        let previousCameraPosition

        const frame = async (currentTime) => {
            if (!startTime) startTime = currentTime;
            const animationPhase = (currentTime - startTime) / duration;

            // when the duration is complete, resolve the promise and stop iterating
            if (animationPhase > 1) {
                resolve();
                return;
            }

            // calculate the distance along the path based on the animationPhase
            const alongPath = turf.along(path, pathDistance * animationPhase).geometry
                .coordinates;

            const lngLat = {
                lng: alongPath[0],
                lat: alongPath[1],
            };

            // Reduce the visible length of the line by using a line-gradient to cutoff the line
            // animationPhase is a value between 0 and 1 that reprents the progress of the animation
            map.setPaintProperty(
                "track-line",
                "line-gradient",
                [
                    "step",
                    ["line-progress"],
                    "yellow",
                    animationPhase,
                    "rgba(0, 0, 0, 0)",
                ]
            );

            // slowly rotate the map at a constant rate
            const bearing = startBearing - animationPhase * 400;

            // compute corrected camera ground position, so that he leading edge of the path is in view
            var correctedPosition = computeCameraPosition(
                previousCameraPosition,
                pitch,
                bearing,
                lngLat,
                startAltitude,
                smooth // smooth
            );

            previousCameraPosition = correctedPosition

            // set the pitch and bearing of the camera
            const camera = map.getFreeCameraOptions();
            camera.setPitchBearing(pitch, bearing);

            // set the position and altitude of the camera
            camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                correctedPosition,
                startAltitude
            );

            // apply the new camera options
            map.setFreeCameraOptions(camera);

            // repeat!
            await window.requestAnimationFrame(frame);
        };

        await window.requestAnimationFrame(frame);
    });
};

const add3D = (map) => {
    // add map 3d terrain and sky layer and fog
    // Add some fog in the background
    map.setFog({
      range: [0.5, 10],
      color: "white",
      "horizon-blend": 0.2,
    });
  
    // Add a sky layer over the horizon
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-color": "rgba(85, 151, 210, 0.5)",
      },
    });
  
    // Add terrain source, with slight exaggeration
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  };
  

const PITCH = 50

mapboxgl.accessToken =
    "pk.eyJ1IjoiY2hyaXN3aG9uZ21hcGJveCIsImEiOiJjbDR5OTNyY2cxZGg1M2luejcxZmJpaG1yIn0.mUZ2xk8CLeBFotkPvPJHGg";

const trackGeojson = await fetch(`./data/male-stage-10.geojson`).then((d) =>
    d.json()
);

const center = trackGeojson.geometry.coordinates[0]


const leftMap = new mapboxgl.Map({
    container: "left-map",
    projection: "globe",
    style: "mapbox://styles/mapbox/dark-v10",
    zoom: 10,
    center,
    pitch: PITCH,
    bearing: 0,
});

const rightMap = new mapboxgl.Map({
    container: "right-map",
    projection: "globe",
    style: "mapbox://styles/mapbox/dark-v10",
    zoom: 10,
    center,
    pitch: PITCH,
    bearing: 0,
});

const addPathSourceAndLayer = (map, trackGeojson) => {
    map.addSource('track', {
        type: 'geojson',
        data: trackGeojson,
        lineMetrics: true
    })

    map.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        paint: {
            "line-color": "rgba(0,0,0,0)",
            "line-width": 9,
            "line-opacity": 0.8,
        },
        layout: {
            "line-cap": "round",
            "line-join": "round",
        }
    })
}

const ANIMATION_DURATION = 60000
const ALTITUDE = 8000

leftMap.on('load', () => {
    add3D(leftMap)
    addPathSourceAndLayer(leftMap, trackGeojson) 
    animatePath({
        map: leftMap,
        duration: ANIMATION_DURATION,
        path: trackGeojson,
        startBearing: 0,
        startAltitude: ALTITUDE,
        pitch: PITCH,
        smooth: false
    })
})

rightMap.on('load', () => {
    add3D(rightMap)
    addPathSourceAndLayer(rightMap, trackGeojson)
    animatePath({
        map: rightMap,
        duration: ANIMATION_DURATION,
        path: trackGeojson,
        startBearing: 0,
        startAltitude: ALTITUDE,
        pitch: PITCH,
        smooth: true
    })
})
