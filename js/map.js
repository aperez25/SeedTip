
$(document).ready(function() {

	let marketId = [],
	allLatlng = [],
	allMarkers = [],
	marketName = [],
	infowindow = null,
	pos,
	userCords,
	temMarketHolder = [];

	// Start geolocation
	if (navigator.geolocation) {
		function error(err) {
			console.warn('ERROR(' + err.code + '): ' + err.message);
		}
		// on sucess assins the coords to the userCords var
		function success(pos) {
			userCords = pos.coords;
		}

		// get the user's current position
		navigator.geolocation.getCurrentPosition(success, error);
	} else {
		alert('Geolocation is not supported in your browser');
	}
	// end geolcoation

	//Google map options
	const mapOptions = {
		zoom: 5,
		center: new google.maps.LatLng(37.09024, -100.712891),
		panControl: false,
		panControlOptions: {
			position: google.maps.ControlPosition.BOTTOM_LEFT
		},
		zoomControl: true,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.LARGE,
			position: google.maps.ControlPosition.RIGHT_CENTER
		},
		scaleControl: false
	};

	// adding infowindow option
	infowindow = new google.maps.InfoWindow({
		content: "holding..."
	});

	// Fire up Google maps and place inside the map-canvas div
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

	// grab form data
	$('#chooseZip').submit(function() {
		let userZip = $('#textZip').val(),
		accessURL;

		// check to see if the user enterd a zip or not. Use URL based on input
		if (userZip) {
			// missing error handling for invalid zip
			accessURL = "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + userZip;
		} else {
			accessURL = "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + userCords.latitude + "&lng=" + userCords.longitude;
		}

		// use the zip code and return all market ids in area
		$.ajax({
			type: 'GET',
			contentType: 'application/json; charset=utf-8',
			url: accessURL,
			dataType: 'jsonp',
			success: function(data) {
				$.each(data.results, function(i, val){
					//loop through each returned item and push into marketId
					marketId.push(val.id);
					// loop through each returned item and push marketName o
					marketName.push(val.marketname);
				});

			var counter = 0;
			// use the id to get query the API again, to return ind market info
			$.each(marketId, function(k, v) {
				$.ajax({
					type: "GET",
					contentType: "application/json; charset=utf-8",
					// submit a GET request to the restful service mktDetail
					url: 'http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=' + v,
					dataType: 'jsonp',
					success: function(data) {

						for (var key in data) {
							// contains a google map link, but just want lat & long
							var results = data[key];

							var googleLink = results['GoogleLink'];
							var latLong = decodeURIComponent(googleLink.substring(googleLink.indexOf('=')+1, googleLink.lastIndexOf('(')));

							// both the lat and long are retuned as one string
							var split = latLong.split(',');
							var latitude = split[0];
							var longitude = split[1];

							// set the markets
							myLatlng = new google.maps.LatLng(latitude, longitude)
							// sets marker parameters
							allMarkers = new google.maps.Marker({
								position: myLatlng,
								// renders the features on the map
								map: map,
								// title on mouseover
								title: marketName[counter],
								// styling of info window when clicked
								html: "<div class='markerPop'>" + '<h1>' + marketName[counter].substring(4) +
								'</h1>' + '<h3>' + results['Address'] + '</h3>' + '<p>' + 'Products: ' + results['Products'].split(';') + '</p>' + '<p>' + 'Schedule: ' + results['Schedule'] + '</p>' + '</div>'
							});

							// put all lat long in array. Need this to create a viewport
							allLatlng.push(myLatlng);

							counter++;

					};

					// using paramerts set above, adding a click listener to the markers
					google.maps.event.addListener(allMarkers, 'click', function(){
						infowindow.setContent(this.html);
						infowindow.open(map, this);
					});
					// from the allLatlng array, show the markers in a new viewpoint bound
					var bounds = new google.maps.LatLngBounds();
					// go through each...
					for(var i = 0, LtLgLen = allLatlng.length; i < LtLgLen; i++) {
						// increase the bound to take this point
						bounds.extend(allLatlng[i]);
					}
						// fit thes bounds to the map
						map.fitBounds(bounds);


				}
				});
			});
		}
	});

		return false; // prevent the form from submitting
	});







});


