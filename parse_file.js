const fs = require('fs');

// Coordinates of the gateway
const starting_point = {lat: 50.93536, long: -1.39401};

// Coordinates of each reading
const locations = load_locations_coordinates('locations.txt');

// Once for each location
for (let i = 1; i < 12; i++) {
	console.log(`Location ${i}, ${distance_across_spherical_globe(starting_point, locations[i-1])}km: `);

	// Load packets from file
	const packets = load_packet_data(`location${i}.txt`);

	// Filter packets for signal info at this gateway ID and sort by spreading factor
	const signal_data = extract_signal_data(packets, 'eui-7276fffffe0103f0');
	
	const sf7_rssi = average_values(signal_data.spreading_factor7.map(d => d.rssi));
	const sf12_rssi = average_values(signal_data.spreading_factor12.map(d => d.rssi));
	const sf7_snr = average_values(signal_data.spreading_factor7.map(d => d.snr));
	const sf12_snr = average_values(signal_data.spreading_factor12.map(d => d.snr));

	console.log("Average RSSI: SF7", sf7_rssi, "SF12", sf12_rssi);
	console.log("Average SNR: SF7", sf7_snr, "SF12", sf12_snr);
}

// Load JSON data from text file.
// Get each object into an array by splitting on curly braces at zero indent
function load_packet_data(file) {
	const strings = fs.readFileSync(file, 'utf-8').replace(/^{/gm, "elec6245wirelessnetworks{").split("elec6245wirelessnetworks");
	strings.shift(); // Remove initial blank element from first { 
	return strings.map(i => JSON.parse(i));
}

// Filter relevant info from packets
// Gets only packets received at the target gateway ID
// Ignores all data other than RSSI, SNR and channel
// Ignores packets that were received at all
// Sorts them by spreading factor
function extract_signal_data(packets, gateway_id) {
	let spreading_factorA = [];
	let spreading_factorB = [];

	// For each packet in location
	packets.forEach(packet => {
		// Loop through all gateways the packet was received at
		const signal_data = packet.metadata.gateways
			.filter(g => g.gtw_id == gateway_id) // Only the gateway we want
			.map(g => {return {
				rssi: g.rssi,
				snr: g.snr,
				channel: g.channel
			}}) // Only grab the RSSI and SNR and channel
			.filter(g => g.rssi != 0); // RSSI == 0 is an anomaly in our data
		// Sort into relevant spreading factors
		if (signal_data.length > 0) {
			if (packet.metadata.data_rate == "SF7BW125") {
				// Sort by SNR
				const best_channel = signal_data.sort((a,b) => a.snr - b.snr)[0];
				spreading_factorA.push(best_channel);
			} else if (packet.metadata.data_rate == "SF12BW125") {
				// Sort by SNR
				const best_channel = signal_data.sort((a,b) => a.snr - b.snr)[0];
				spreading_factorB.push(best_channel);
			} else
				console.log("oops");
		}
	});
	return {
		spreading_factor7: spreading_factorA,
		spreading_factor12: spreading_factorB
	};
}

// Average values in array
function average_values(values) {
	return values.reduce((acc, value) => acc += value, 0) / values.length;
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
			const components = l.split(', '); if (components.length != 2) console.log("oops");
			return {
				lat: parseFloat(components[0]),
				long: parseFloat(components[1])
			};
		});
}

