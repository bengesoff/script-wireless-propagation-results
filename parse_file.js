const fs = require('fs');

// Coordinates of the gateway
const starting_point = {lat: 50.93536, long: -1.39401};

// Coordinates of each reading
const locations = load_locations_coordinates('locations.txt');

// Once for each location
for (let i = 1; i < 12; i++) {
	// Load packets from file
	const location = load_packet_data(`location${i}.txt`);

	const spreading_factorA = [];
	const spreading_factorB = [];

	console.log(`Location ${i}, ${distance_across_spherical_globe(starting_point, locations[i-1])}km: `);
	location.forEach(packet => {
		const signal_data = packet.metadata.gateways
				.filter(g => g.gtw_id == 'eui-7276fffffe0103f0') // Only the gateway we want
				.map(g => {return {
					rssi: g.rssi,
					snr: g.snr,
					channel: g.channel
				}}); // Only grab the RSSI and SNR
			console.log(packet.metadata.data_rate, signal_data);
		if (signal_data.length > 0) {
			//if (packet.metadata.data_rate == "SF7BW768")

		}
	});
}

// Load JSON data from text file.
// Get each object into an array by splitting on curly braces at zero indent
function load_packet_data(file) {
	const strings = fs.readFileSync(file, 'utf-8').replace(/^{/gm, "elec6245wirelessnetworks{").split("elec6245wirelessnetworks");
	strings.shift(); // Remove initial blank element from first { 
	return strings.map(i => JSON.parse(i));
}

// Calculate the distance across the earth (assuming a sphere) using the haversine 
// formula. Points a and b are the two lat-long pairs to find the distance between 
// and should be objects with two fields: "lat" and "long".
function distance_across_spherical_globe(a, b) {
	// Constants
	const degrees_to_radians = (deg) => Math.PI * deg / 180;
	const earth_radius = 6371;

	// Radians between the two points
	const d_lat = degrees_to_radians(b.lat - a.lat);
	const d_long = degrees_to_radians(b.long - a.long);

	// Use inverse haversine to yield result
	const h = Math.sin(d_lat/2) ** 2 +
		Math.cos(degrees_to_radians(a.lat)) * Math.cos(degrees_to_radians(b.lat)) *
		Math.sin(d_long/2) ** 2;
	const x = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
	return x * earth_radius;
}

// Load coordinate pairs from text file
function load_locations_coordinates(file) {
	return fs.readFileSync(file, 'utf-8')
		.split('\n').filter(l => l != "") // iterate over lines
		.map(l => {
			const components = l.split(', '); if (components.length != 2) console.log("shit");
			return {
				lat: parseFloat(components[0]),
				long: parseFloat(components[1])
			};
		});
}

