//
//    ISS Photo Explorer Flat
//    Callum & "Bean" Prentice - callum@gmail.com
//
//    Base app autogenerated from templates
//      ./template.generic/
//

var latLngTable = 0;

function onEarthResize(entries) {
    var width = entries[0].contentRect.width;
    var height = entries[0].contentRect.height;
    var earth_img_elem = document.getElementById('earth_img');

    var requested_width = earth_img_elem.naturalWidth;
    var requested_height = earth_img_elem.naturalHeight;

    if (requested_width > width) {
        requested_width = width;
        requested_height = width * 0.5;
    }

    if (requested_height > height) {
        requested_height = height;
        requested_width = height * 2;
    }

    earth_img_elem.style.width = requested_width + 'px';
    earth_img_elem.style.height = requested_height + 'px';

    if (width >= requested_width) {
        earth_img_elem.style.left = (width - requested_width) / 2 + 'px';
    }
    if (height >= requested_height) {
        earth_img_elem.style.top = (height - requested_height) / 2 + 'px';
    }

    positionMarker(0, 0, true);
}

function earthImgClick(event) {
    var earth_elem = document.getElementById('earth');
    var earth_img_elem = document.getElementById('earth_img');

    var scale_x = earth_img_elem.clientWidth / earth_img_elem.naturalWidth;
    var scale_y = earth_img_elem.clientHeight / earth_img_elem.naturalHeight;

    var offset_x = (earth_elem.clientWidth - earth_img_elem.clientWidth) / 2;
    var offset_y = (earth_elem.clientHeight - earth_img_elem.clientHeight) / 2;

    var click_x = (event.x - offset_x) / scale_x / earth_img_elem.naturalWidth;
    var click_y = (event.y - offset_y) / scale_y / earth_img_elem.naturalHeight;

    var lat = (click_y - 0.5) * -180.0;
    var lng = (click_x - 0.5) * 360.0;

    setQueryParam('lat', lat);
    setQueryParam('lng', lng);
    setQueryParam('pn', 0);

    buildThumbs();
}

function buildThumbs() {
    var lat = parseInt(getQueryParam('lat'));
    var lng = parseInt(getQueryParam('lng'));

    var llidx = latLngToLLIdx(lat, lng);
    var photo_id_list = latLngTable[llidx];

    var photo_thumbs_elem = document.getElementById('photo_thumbs');

    if (typeof photo_id_list !== 'undefined') {
        var photo_ids = photo_id_list.split(',');
        var thumbs_html = '';

        var img_width = photo_thumbs_elem.clientWidth / 10;
        var img_height = img_width;

        var ph = getQueryParam('ph');

        photo_ids.forEach(function (pid) {
            var url = '';
            if (ph == '1') {
                url = 'img/placeholder.jpg';
            } else {
                url = buildPhotoURL(pid, 'small');
            }

            var photo_html =
                `<img class="img_fit" ` +
                `src="${url}" ` +
                `onclick="viewPhoto('${pid}')" ` +
                `onerror="this.onerror=null;this.src='img/missing-img.jpg'" ` +
                `style="width:${img_width}px;height:${img_height}px">`;

            thumbs_html += photo_html;
        });

        photo_thumbs_elem.innerHTML = thumbs_html;

        var photo_thumbs_html =
            `Found ${photo_ids.length} images within 1 degree of ` +
            `${lat.toFixed(0)},${lng.toFixed(0)}<br>` +
            `<input type="checkbox" id="ph_img" onclick="setPlaceholder()"> Use placeholder for thumbnails`;

        if (photo_thumbs_elem.clientWidth < 250) {
            photo_thumbs_html =
                `${photo_ids.length} / ${lat.toFixed(0)},${lng.toFixed(0)}<br>` +
                `<input type="checkbox" id="ph_img" onclick="setPlaceholder()"> Placeholders`;
        }
        document.getElementById('photo_thumbs_title').innerHTML = photo_thumbs_html;

        document.getElementById('ph_img').checked = parseFloat(ph);

        var pn = getQueryParam('pn');
        if (pn != null) {
            viewPhoto(photo_ids[parseInt(pn)]);
        } else {
            viewPhoto(photo_ids[0]);
        }

        positionMarker(lat, lng, false);
    } else {
        var str = `No photos found for ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
        console.warn(str);
    }
}

function viewPhoto(pid) {
    setFromPid(pid);

    var photo_carousel_elem = document.getElementById('photo_carousel');
    photo_carousel_elem.setAttribute('pid', pid);

    var url = buildPhotoURL(pid, 'small');

    var photo_html =
        `<img loading="eager" class="img_fit" src="${url}" ` +
        `onclick="viewFullSize('${pid}')" ` +
        `onerror="viewLoadError('${pid}')" ` +
        `style="width: 100%;height: 100%">`;

    photo_carousel_elem.innerHTML = photo_html;

    var title_html =
        `Image ID: ISS 0${pid} - click photo for full screen<br>` + `or click arrows to move through sequence`;

    var title_elem = document.getElementById('photo_carousel_title');
    if (title_elem.clientWidth < 250) {
        title_html = `ISS 0${pid}<br>Click photo/arrows`;

        document.getElementById('photo_carousel_prev').style.setProperty('--next-prev-size', '36px');
        document.getElementById('photo_carousel_next').style.setProperty('--next-prev-size', '36px');
    }
    title_elem.innerHTML = title_html;
}

function viewFullSize(pid) {
    var url = buildPhotoURL(pid, 'large');

    window.open(url);
}

function viewLoadError(pid) {
    console.error('error loading image');
    var url = buildPhotoURL(pid, 'small');

    var load_error_html =
        `<p id="photo_not_found">` + `Unable to load ` + `<a href="${url}" target="_new">this</a> image` + `</p>`;

    document.getElementById('photo_carousel').innerHTML = load_error_html;
}

function setPlaceholder() {
    var checked = document.getElementById('ph_img').checked;
    if (checked) {
        setQueryParam('ph', 1);
    } else {
        setQueryParam('ph', 0);
    }
    buildThumbs();
}

function setQueryParam(name, value) {
    var url = new URL(document.location);
    var params = url.searchParams;

    params.set(name, value);

    url.search = params.toString();
    window.history.replaceState({}, '', url.toString());
}

function getQueryParam(name) {
    var params = new URL(document.location).searchParams;

    return params.get(name);
}

function gotoRandomLatLng() {
    var rand_index = Math.floor(Math.random() * Object.keys(latLngTable).length);
    var ll_index = Object.keys(latLngTable)[rand_index];
    var lat = parseFloat(ll_index.split('_')[0]) - 90.0;
    var lng = parseFloat(ll_index.split('_')[1]) - 180.0;

    setQueryParam('lat', lat);
    setQueryParam('lng', lng);
    setQueryParam('pn', 0);

    buildThumbs();
}

function latLngToLLIdx(lat, lng) {
    return parseInt(lat) + 90 + '_' + (parseInt(lng) + 180);
}

function buildPhotoURL(photo_id, size) {
    var full_id = 'ISS0' + photo_id.substring(0, 2);
    var photo_url = `https://eol.jsc.nasa.gov/DatabaseImages/ESC/${size}/${full_id}/ISS0${photo_id}.jpg`;
    return photo_url;
}

function modifyPhotoId(pid, offset) {
    var parts = pid.split('-');
    var mission_num = parseInt(parts[2]);
    if (!isNaN(mission_num)) {
        mission_num = mission_num + offset;
        var new_id = parts[0] + '-' + parts[1] + '-' + mission_num;

        viewPhoto(new_id);
    }
}

function positionMarker(lat, lng, move_only) {
    var map_marker_elem = document.getElementById('map_marker');

    if (move_only) {
        lat = parseFloat(map_marker_elem.getAttribute('lat'));
        lng = parseFloat(map_marker_elem.getAttribute('lng'));
    } else {
        map_marker_elem.setAttribute('lat', lat);
        map_marker_elem.setAttribute('lng', lng);
    }

    var earth_img_elem = document.getElementById('earth_img');
    var cur_width = earth_img_elem.width;
    var cur_height = earth_img_elem.height;
    var offset_left = earth_img_elem.offsetLeft;
    var offset_top = earth_img_elem.offsetTop;
    var lng_x = (lng + 180.0) / 360.0;
    var lat_y = 1.0 - (lat + 90.0) / 180.0;

    var marker_x = cur_width * lng_x + offset_left;
    var marker_y = cur_height * lat_y + offset_top;

    var marker_width = document.getElementById('map_marker').clientWidth;
    var marker_height = document.getElementById('map_marker').clientHeight;

    map_marker_elem.style.left = parseInt(marker_x - marker_width / 2) + 'px';
    map_marker_elem.style.top = parseInt(marker_y - marker_height / 2) + 'px';
}

function onCarouselPrev() {
    var selected_pid = document.getElementById('photo_carousel').getAttribute('pid');
    modifyPhotoId(selected_pid, -1);
}

function onCarouselNext() {
    var selected_pid = document.getElementById('photo_carousel').getAttribute('pid');
    modifyPhotoId(selected_pid, 1);
}

function zlibDecompress(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onload = function (event) {
        var reader = new window.FileReader();
        reader.readAsDataURL(xhr.response);
        reader.onloadend = function () {
            var char_data = atob(reader.result.split(',')[1])
                .split('')
                .map(function (x) {
                    return x.charCodeAt(0);
                });
            var bin_data = new Uint8Array(char_data);
            var data = pako.inflate(bin_data, {to: 'string'});
            callback(JSON.parse(data));
        };
    };

    xhr.onError = function (event) {
        console.error('ERROR:', event);
    };

    xhr.send();
}

function app() {
    showLoading(true);

    var down_event = 0;
    var splitter_elem = document.getElementById('splitter');
    var earth_elem = document.getElementById('earth');
    var earth_img_elem = document.getElementById('earth_img');
    var photo_elem = document.getElementById('photos');
    var photo_prev_elem = document.getElementById('photo_carousel_prev');
    var photo_next_elem = document.getElementById('photo_carousel_next');

    zlibDecompress('data/lookup.json.gz', function (data) {
        latLngTable = data;

        new ResizeObserver(onEarthResize).observe(earth_elem);

        earth_img_elem.addEventListener('click', earthImgClick);

        splitter_elem.addEventListener('mousedown', mouseDown);
        splitter_elem.addEventListener('touchstart', touchStart);

        photo_prev_elem.addEventListener('click', onCarouselPrev);
        photo_next_elem.addEventListener('click', onCarouselNext);

        showLoading(false);

        if (getQueryParam('lat') != null && getQueryParam('lng') != null) {
            buildThumbs();
        } else {
            gotoRandomLatLng();
        }
    });

    function mouseDown(event) {
        down_event = {
            event,
            splitterTop: splitter_elem.offsetTop,
            earthHeight: earth_elem.offsetHeight,
            photoHeight: photo_elem.offsetHeight,
        };
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
    }

    function mouseMove(event) {
        var delta = Math.min(
            Math.max(event.clientY - down_event.event.y, -down_event.earthHeight),
            down_event.photoHeight
        );

        splitter_elem.style.top = down_event.splitterTop + delta + 'px';
        earth_elem.style.height = down_event.earthHeight + delta + 'px';
        photo_elem.style.height = down_event.photoHeight - delta + 'px';
    }

    function mouseUp(event) {
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
    }

    function touchStart(event) {
        event.preventDefault();
        if (event.touches.length == 1) {
            down_event = {
                event,
                splitterTop: splitter_elem.offsetTop,
                earthHeight: earth_elem.offsetHeight,
                photoHeight: photo_elem.offsetHeight,
            };
            document.addEventListener('touchmove', touchMove);
            document.addEventListener('touchend', touchEnd);
            document.addEventListener('touchcancel', touchCancel);
        }
    }

    function touchMove(event) {
        event.preventDefault();
        var delta = Math.min(
            Math.max(event.touches[0].pageY - down_event.event.touches[0].pageY, -down_event.earthHeight),
            down_event.photoHeight
        );

        splitter_elem.style.top = down_event.splitterTop + delta + 'px';
        earth_elem.style.height = down_event.earthHeight + delta + 'px';
        photo_elem.style.height = down_event.photoHeight - delta + 'px';
    }

    function touchEnd(event) {
        event.preventDefault();
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', touchEnd);
        document.removeEventListener('touchcancel', touchCancel);
    }

    function touchCancel(event) {
        event.preventDefault();
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', touchEnd);
        document.removeEventListener('touchcancel', touchCancel);
    }
}

function showLoading(visible) {
    if (visible) {
        document.getElementById('loading_overlay').className = 'show';
        document.getElementById('loading_overlay').style.pointerEvents = 'all';
    } else {
        document.getElementById('loading_overlay').className = 'hide';
        document.getElementById('loading_overlay').style.pointerEvents = 'none';
    }
}

function setFromPid(pid) {
    for (var key in latLngTable) {
        if (latLngTable.hasOwnProperty(key)) {
            var search_pid = pid + ',';

            var text_position = latLngTable[key].indexOf(search_pid);
            if (text_position != -1) {
                var latlng = key.split('_');
                var lat = parseFloat(latlng[0]) - 90.0;
                var lng = parseFloat(latlng[1]) - 180.0;
                setQueryParam('lat', lat);
                setQueryParam('lng', lng);

                var photo_ids = latLngTable[key].split(',');
                var index = photo_ids.indexOf(pid);

                setQueryParam('pn', index);
            }
        }
    }
}
