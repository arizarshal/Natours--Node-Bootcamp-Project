/* eslint-disable*/

export const displayMap = locations => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJpemFyc2hhbCIsImEiOiJjbGQ0cjZpM2EwZm0xM29rYnBkMDBrbnduIn0.Z1hiCWQ9TtPTZeuLd4kkcg';
    
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/arizarshal/cld4rdiga000001pmfx5sgtn9',
        scrollZome: false,
        // center: [-118.113491, 34.111745],
        // zoom: 9,
        // interactive: false
    })

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker 
        const el = document.createElement('div')
        el.className = 'marker'

        // Add marker for every location 
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
        .setLngLat(loc.coordiates)
        .addTo(map)

        // Add popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Dat ${loc.day}: ${loc.description}</p>`)
            .addTo(map)

        // Extends map bounds to include current location
        bounds.extend(loc.coordiates)

        })


    // all the location points in the map will fit the screen
    map.fitBounds(bounds, {
        padding: {     
            top: 200,
            bottom:150,
            left: 100,
            right: 100
        }
    })
}
