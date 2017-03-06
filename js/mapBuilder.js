var countriesFileExt = 'wp-content/themes/DEV-wander/data/countriesSouthAmerica.geo.json'
var pathsFileExt = 'wp-content/themes/DEV-wander/data/myMapsURLs.txt';
var extArray = ["category", "gallery"];
var map;
var dataLayerCountries;
var dataLayerPaths;
function initMap() {
   map = new google.maps.Map(document.getElementById('map'), {   
      center: {lat: -10, lng: -60},   
      zoom: 6,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      disableDoubleClickZoom: true,
      draggable: false,
      keyboardShortcuts: false,
      scrollwheel: false,
      styles: [
         {featureType: 'administrative', stylers: [{visibility: 'off'}]},
         {featureType: 'administrative.country', stylers: [{visibility: 'on'}]},
         {
            //gets rid of country borders
            featureType: 'administrative',
            elementType: 'geometry.stroke',
            stylers: [{visibility: 'off'}]
         },
         {featureType: 'landscape', stylers: [{color: '#bfefb8'}]},
         {featureType: 'landscape.man_made', stylers: [{visibility: 'off'}]},
         {featureType: 'landscape.natural.terrain', stylers: [{color: '#e3e9dd'}]},
         {featureType: 'poi', stylers: [{visibility: 'off'}]},
         {
            featureType: 'road', stylers: [{visibility: 'off'}]
         },
         {featureType: 'transit', stylers: [{visibility: 'off'}]},
         {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{color: '#78b7cc'}]
         }
      ]
   });
   map.panToBounds({west: -87, north: 14, east: -80, north: 14, south: 0, });
   dataLayerCountries = new google.maps.Data({map: map});
   dataLayerCountries.loadGeoJson(countriesFileExt,
      {idPropertyName : 'countryID'},
      function(featureArray) {
         var countries = {
            all: [],
            visited: [],
            current: [],
            never: []
         };
         fillCountryArrays(featureArray, countries);
         dataLayerCountries.setStyle(function(feature) {
            return styleCountries(feature, countries);
         });
      }
   );
   dataLayerCountries.addListener('click', clickCountry);
   dataLayerCountries.addListener('mouseover', mouseInCountry);
   dataLayerCountries.addListener('mouseout', mouseOutCountry);
   dataLayerPaths = new google.maps.Data({map: map});
   addFiles(document.URL + pathsFileExt);	
   dataLayerPaths.setStyle(stylePaths);
   dataLayerPaths.addListener('click', clickPath);
   dataLayerPaths.addListener('mouseover', mouseInPath);
   dataLayerPaths.addListener('mouseout', mouseOutPath);
}
function fillCountryArrays(featureArray, countries) {
   for (i=0; i<featureArray.length; i++) {
   var feature = featureArray[i];
   var countryName = feature.getProperty('name');
      countries.all.push(countryName);
      if (feature.getProperty('visited') == 'yes') {
         countries.visited.push(countryName);
         if (countries.current.length == 0 && feature.getProperty('current') == 'yes') {
            countries.current.push(countryName);
            document.getElementById('weAreHere').innerHTML = "We're in " + countryName + "!!!";
         }
      } else if (feature.getProperty('never') == 'yes') {
         countries.never.push(countryName);
      }
   }
}
function styleCountries(feature, countries) {
   var zIndexVal = 10;
   var clickBool = false;
   var sColor = '#424242';
   var sOpacity = 1;
   var sWeight = 0;
   //var fColor = 'green';
   var fOpacity = 0;
   for (i=0; i<countries.visited.length; i++) {
      if (feature.getProperty('name') == countries.visited[i]) {
         zIndexVal = 20;
         sWeight = 2;
         clickBool = true;
         //fColor = 'red';
      }
   }
   if (feature.getProperty('name') == countries.current[0]) {
      zIndexVal = 30;
      //sColor = 'yellow';
   }
   for (i=0; i<countries.never.length; i++) {
      if (feature.getProperty('name') == countries.never[i]) {
         zIndexVal = 0;
         sWeight = 0;
         //fColor = 'gray';
      }
   }
   return {
      zIndex: zIndexVal,
      clickable: clickBool,
      strokeColor: sColor,
      strokeOpacity: sOpacity,
      strokeWeight: sWeight,
      //fillColor: fColor,
      fillOpacity: fOpacity
   };
}
function mouseInCountry(event) {
   this.revertStyle();
   this.overrideStyle(event.feature , {
      zIndex: 100,
      strokeWeight: 4
   });
}
function mouseOutCountry(event) {
   this.revertStyle();
}
function clickCountry(event) {
   if (event.feature.getProperty('clicked') != 'yes') {
      event.feature.setProperty('clicked', 'yes');
      var index = 0;
      var countryName = event.feature.getProperty('name');
      testURL(index, countryName);
   }
}
function testURL(index, countryName) {
   var url = location.href + "/" + extArray[index] + "/" + countryName.toLowerCase() + "/";
   var xhr = new XMLHttpRequest();
   xhr.open('HEAD', url);
   xhr.onreadystatechange = function () {
      if(xhr.readyState === XMLHttpRequest.DONE) {
         if (xhr.status === 200) {
            location = url;
         } else {
            index++;
            if (index < extArray.length) {
               testURL(index, countryName);
            }
         }
      }
   };
   xhr.send();
}
function addFiles(url) {
   //NOTE: server settings must be updated for this to work. Add a User-Defined MIME Type:
   //MIME Type = "application/javascript" and Extension = "jsonp"
   var xhr = new XMLHttpRequest();
   xhr.open('GET', url);
   xhr.onreadystatechange = function () {
      if(xhr.readyState === XMLHttpRequest.DONE) {
         if (xhr.status === 200) {
            makeUrlArray(xhr.response);
         }
      }
   };
   xhr.send();
}
function makeUrlArray(fileContent) {
   var urlArray = fileContent.split(/\r?\n|\r/g);
   urlArray = urlArray.filter(function(value) {
      return value != "";
   });
   for (i=0; i<urlArray.length; i++) {
      getKML(urlArray[i]);
   }
}
function getKML(url) {
   $.ajax({
      crossOrigin: true,
      url: url,
      success: function(result){
            kmlCallback(result)
         }
   });
}
function kmlCallback(result) {
   var kmlDoc = $.parseXML(result);
   var geoJsonData =  toGeoJSON.kml(kmlDoc);
   dataLayerPaths.addGeoJson(geoJsonData);
}
function stylePaths(feature) {
   var geoType = getGeoType(feature);
   if (geoType == "LineString") {
      return styleLineString(feature);
   } else if (geoType == "Point") {
      return stylePoint(feature);
   }
}
function getGeoType(feature) {
   var geoType = feature.getGeometry().getType();
   if ((geoType == "LineString") || (geoType == "Point")) {
      return geoType;
   } else {
      console.log("Unsupported Geometry Type = " + geoType);
   }
}
function styleLineString(feature) {
   var zIndexVal = 1000;
   var clickBool = false;
   var sColor = '#009688';//'#f44336';
   var sOpacity = 1;
   var sWeight = 3;
   if (notUndefined(feature.getProperty('description')) && feature.getProperty('description').includes('flight')) {
      sOpacity = .7;
   }
   return {
      zIndex: zIndexVal,
      clickable: clickBool,
      strokeColor: sColor,
      strokeOpacity: sOpacity,
      strokeWeight: sWeight,
   };
}
function notUndefined(val) {
   if (typeof(val) == "undefined") {
      return false;
   } else {
      return true;
   }
}
function stylePoint(feature) {
   if ((feature.getProperty('description') == 'major') || (feature.getProperty('description') == 'minor')) {
      addMarkers(feature);
   }
   return {
      visible: false,
      clickable: false,
   };
}
function addMarkers(feature) {
   var iconObject;
   var zIndexVal;
   var majorCenter = new google.maps.Point(12, 12);
   var minorCenter = new google.maps.Point(24, 24);
   var majorUrl = 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1498-shape_default_4x.png&highlight=f57c00,ff000000&scale=1.0';
   var minorUrl = 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-measle-container_4x.png,icons/onion/1739-blank-measle_4x.png&highlight=ffd600,ff000000&scale=2.0';
   if (feature.getProperty('description') == 'major') {
      iconObject = {anchor: majorCenter, url: majorUrl};
      zIndexVal = 10000;
   } else if (feature.getProperty('description') == 'minor') {
      iconObject = {anchor: minorCenter, url: minorUrl};
      zIndexVal = 11000;
   }
   var marker = new google.maps.Marker({
      position: feature.getGeometry().get(),
      map: map,
      title: feature.getProperty('name'),
      icon: iconObject,
      zIndex: zIndexVal
   });
}
function mouseInPath(event) {
   this.revertStyle();
   var geoType = getGeoType(event.feature);
   if (geoType == "LineString") {
      this.overrideStyle(event.feature , {
         //strokeWeight: 6
      });
   }
}
function mouseOutPath(event) {
   this.revertStyle();
}
function clickPath(event) {
   var geoType = getGeoType(event.feature);
   if (geoType == "LineString") {
     console.log("clicked LineString");
   }
}
