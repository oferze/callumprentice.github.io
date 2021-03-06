//
//    ISS Photo Explorer 2
//    Callum Prentice - callum@gmail.com
//
//    Base app autogenerated from templates
//      ./template.threejs/
//      ./template.generic/
//
var camera, scene, renderer, controls;
var zoomMinDist = 11.0;
var zoomMaxDist = 30.0;
var earthRadius = 10.0;  //10.62657
var issRadius = earthRadius + earthRadius * 248/3958
var earthMesh = 0;
var helperMesh = 0;
var raycaster = 0;
var mouse = 0;
var latLngTable = 0;
var downClientX = Infinity;
var downClientY = Infinity;
var clickTouchMoveThreshold = 4;
var selectedMid = 0;

function app() {
    show_loading(true);

    var div_size = get_div_size('webgl');

    camera = new THREE.PerspectiveCamera(50, div_size.width / div_size.height, 0.01, 1000);
    camera.position.x = 10.0;
    scene = new THREE.Scene();

    var earth_texture = new THREE.TextureLoader().load('img/earth.jpg');
    var earth_geometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    earth_geometry.computeBoundingSphere();
    var earth_material = new THREE.MeshBasicMaterial({ map: earth_texture });
    earthMesh = new THREE.Mesh(earth_geometry, earth_material);
    scene.add(earthMesh);

    var tracks_texture = new THREE.TextureLoader().load('img/tracks.png');
    var tracks_geometry = new THREE.SphereGeometry(issRadius, 64, 64);
    var tracks_material = new THREE.MeshBasicMaterial({ map: tracks_texture, transparent: true, opacity: 1.0 });
    var tracks_mesh = new THREE.Mesh(tracks_geometry, tracks_material);
    scene.add(tracks_mesh);

    position_camera();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(div_size.width, div_size.height);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = (48 * Math.PI) / 180.0;
    controls.maxPolarAngle = (132 * Math.PI) / 180.0;
    controls.enablePan = false;
    controls.minDistance = zoomMinDist;
    controls.maxDistance = zoomMaxDist;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(1, 1);

    document.getElementById('webgl').appendChild(renderer.domElement);
    window.addEventListener('resize', on_window_resize, false);

    document.getElementById('webgl').addEventListener('mousedown', on_mouse_down, false);
    document.getElementById('webgl').addEventListener('mouseup', on_mouse_up, false);

    document.getElementById('webgl').addEventListener('touchstart', on_touch_start, false);
    document.getElementById('webgl').addEventListener('touchend', on_touch_end, false);

    document.getElementById('photo_carousel_prev').addEventListener('click', on_carousel_prev);
    document.getElementById('photo_carousel_next').addEventListener('click', on_carousel_next);

    new ResizeObserver(on_window_resize).observe(document.getElementById('webgl'));

    var helper_geometry = new THREE.SphereGeometry(0.1, 32, 32);
    helperMesh = new THREE.Mesh(helper_geometry, new THREE.MeshNormalMaterial());
    scene.add(helperMesh);

    toggle_settings();

    zlibDecompress('data/lookup.json.gz', function (data) {
        latLngTable = data;
        animate();

        var latlng_url = lat_lng_from_url();
        if (latlng_url.found == true) {
            display_photos_for_lat_lng(latlng_url.lat, latlng_url.lng);
        } else {
            goto_random_lat_lng();
        }

        show_loading(false);

        show_help(false);
    });
}

function position_camera() {
    var div_size = get_div_size('webgl');
    var aspect = div_size.height / div_size.width;
    var fudge_factor = 1.1;
    var radius = earthMesh.geometry.boundingSphere.radius;
    if (aspect > 1) radius = radius * aspect;
    var dist = radius / Math.sin((camera.fov * (Math.PI / 180.0)) / 2);
    dist *= fudge_factor;
    camera.position.set(0.0, 0.0, -dist);
}

function on_window_resize() {
    var div_size = get_div_size('webgl');

    camera.aspect = div_size.width / div_size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(div_size.width, div_size.height);

    position_camera();

    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    controls.rotateSpeed =
        ((controls.object.position.length() - zoomMinDist) / (zoomMaxDist - zoomMinDist)) * 0.8 + 0.01;

    TWEEN.update();

    renderer.render(scene, camera);
}

function get_div_size(div_name) {
    return {
        width: document.getElementById(div_name).clientWidth,
        height: document.getElementById(div_name).clientHeight,
    };
}

function show_loading(visible) {
    if (visible) {
        document.getElementById('loading_overlay').className = 'show';
        document.getElementById('loading_overlay').style.pointerEvents = 'all';
    } else {
        document.getElementById('loading_overlay').className = 'hide';
        document.getElementById('loading_overlay').style.pointerEvents = 'none';
    }
}

function create_index(lat, lng) {
    return parseInt(lat) + 90 + '_' + (parseInt(lng) + 180);
}

function build_photo_url(photo_id, size) {
    var mission = 'ISS0' + photo_id.substring(0, 2);
    var photo_thumb_url =
        'https://eol.jsc.nasa.gov/DatabaseImages/ESC/' + size + '/' + mission + '/ISS0' + photo_id + '.jpg';
    return photo_thumb_url;
}

function toggle_settings() {
    if (typeof toggle_settings.status == 'undefined') {
        toggle_settings.status = true;
    }

    document.getElementById('webgl').classList.toggle('expanded');
    document.getElementById('settings').classList.toggle('expanded');

    toggle_settings.status = !toggle_settings.status;
}

function zlibDecompress(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onload = function (oEvent) {
        var reader = new window.FileReader();
        reader.readAsDataURL(xhr.response);
        reader.onloadend = function () {
            var base64data = reader.result;
            var base64 = base64data.split(',')[1];
            var strData = atob(base64);
            var charData = strData.split('').map(function (x) {
                return x.charCodeAt(0);
            });
            var binData = new Uint8Array(charData);
            var data = pako.inflate(binData, { to: 'string' });
            callback(JSON.parse(data));
        };
    };

    xhr.onError = function (oEvent) {
        console.error('ERROR:', oEvent);
    };

    xhr.send();
}

function xyz_from_lat_lng(lat, lng, radius) {
    var phi = ((90.0 - lat) * Math.PI) / 180.0;
    var theta = ((360.0 - lng) * Math.PI) / 180.0;

    return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function view_photo(mid) {
    for (let el of Object.keys(latLngTable)) {
        if (latLngTable[el].indexOf(mid) != -1) {
            var lat = parseFloat(el.split('_')[0]) - 90.0;
            var lng = parseFloat(el.split('_')[1]) - 180.0;
            move_camera_to_lat_lng(lat, lng);
            break;
        }
    }

    var photo_carousel_div_width = document.getElementById('photo_carousel').clientWidth;
    var photo_carousel_div_height = document.getElementById('photo_carousel').clientHeight;
    var url = build_photo_url(mid, 'small');
    var photo_html =
        `<img loading="eager" class="img_fit" src="${url}" ` +
        `onclick="view_full_size('${mid}')" ` +
        `onerror="view_photo_error('${mid}')" ` +
        `style="width:${photo_carousel_div_width}px;height:${photo_carousel_div_height}px">`;

    document.getElementById('photo_carousel').innerHTML = photo_html;
    var carousel_img_title = 'Image ID: ISS 0' + mid + ' - click to open full size image';
    document.getElementById('photo_carousel_title').innerHTML = carousel_img_title;

    selectedMid = mid;
}

function view_full_size(mid) {
    var url = build_photo_url(mid, 'large');

    window.open(url);
}

function view_photo_error(mid) {
    document.getElementById('photo_carousel').innerHTML = "<p id='not_found'>Photo not found</>";
}

function on_mouse_down(event) {
    event.preventDefault();

    downClientX = event.clientX;
    downClientY = event.clientY;
}

function on_mouse_up(event) {
    event.preventDefault();

    var up_client_x = event.clientX;
    var up_client_y = event.clientY;

    var dist = Math.sqrt(
        (downClientX - up_client_x) * (downClientX - up_client_x) +
            (downClientY - up_client_y) * (downClientY - up_client_y)
    );

    if (dist < clickTouchMoveThreshold) {
        on_click(event.clientX, event.clientY);
    }
}

function on_touch_start(event) {
    event.preventDefault();

    downClientX = event.touches[0].pageX;
    downClientY = event.touches[0].pageY;
}

function on_touch_end(event) {
    var touches = event.changedTouches;

    if (touches.length == 1) {
        var up_client_x = touches[0].pageX;
        var up_client_y = touches[0].pageY;

        var dist = Math.sqrt(
            (downClientX - up_client_x) * (downClientX - up_client_x) +
                (downClientY - up_client_y) * (downClientY - up_client_y)
        );

        if (dist < clickTouchMoveThreshold) {
            on_click(up_client_x, up_client_y);
        }
    }
}

function on_click(click_x, click_y) {
    var div_size = get_div_size('webgl');
    mouse.x = (click_x / div_size.width) * 2 - 1;
    mouse.y = -(click_y / div_size.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersection = raycaster.intersectObject(earthMesh);

    if (intersection.length > 0) {
        var lat =
            90.0 - (Math.acos(intersection[0].point.y / earthMesh.geometry.boundingSphere.radius) * 180.0) / Math.PI;
        var lng = -((Math.atan2(intersection[0].point.z, intersection[0].point.x) * 180.0) / Math.PI);

        helperMesh.position.copy(intersection[0].point);

        display_photos_for_lat_lng(lat, lng);
    }
}

function display_photos_for_lat_lng(lat, lng) {
    var index = create_index(lat, lng);
    var missions = latLngTable[index];

    if (typeof missions !== 'undefined') {
        var url = `index.html?lat=${lat}&lng=${lng}`;
        window.history.pushState({}, '', url);

        var all_images = '';

        var photo_list_div_width = document.getElementById('photo_list').clientWidth;
        var img_width = photo_list_div_width / 4;
        var img_height = img_width;

        var each_mission = missions.split(',');

        each_mission.forEach(function (mid) {
            var url = build_photo_url(mid, 'small');

            var photo_html =
                `<img class="img_fit" src="${url}" ` +
                `onclick="view_photo('${mid}')" ` +
                `style="width:${img_width}px;height:${img_height}px">`;

            all_images += photo_html;
        });

        view_photo(each_mission[0]);

        document.getElementById('photo_list').innerHTML = all_images;

        var photo_list_title = `Found ${each_mission.length} images within 1 degree of ${lat.toFixed(3)},${lng.toFixed(
            3
        )}`;
        document.getElementById('photo_list_title').innerHTML = photo_list_title;
    }
}

function modify_mission_id(id, offset) {
    var parts = id.split('-');
    var mission_num = parseInt(parts[2]);
    if (!isNaN(mission_num)) {
        mission_num = mission_num + offset;
        var new_id = parts[0] + '-' + parts[1] + '-' + mission_num;
        view_photo(new_id);
    }
}

function on_carousel_prev() {
    modify_mission_id(selectedMid, -1);
}

function on_carousel_next() {
    modify_mission_id(selectedMid, 1);
}

function lat_lng_from_url() {
    var params = new URL(document.location).searchParams;
    var lat = parseFloat(params.get('lat'));
    var lng = parseFloat(params.get('lng'));
    if (!isNaN(lat) && !isNaN(lng)) {
        return {
            found: true,
            lat: lat,
            lng: lng,
        };
    }

    return {
        found: false,
        lat: Infinity,
        lng: Infinity,
    };
}

function goto_random_lat_lng() {
    var rand_index = Math.floor(Math.random() * Object.keys(latLngTable).length);
    var ll_index = Object.keys(latLngTable)[rand_index];
    var lat = parseFloat(ll_index.split('_')[0]) - 90.0;
    var lng = parseFloat(ll_index.split('_')[1]) - 180.0;
    display_photos_for_lat_lng(lat, lng);
}

function distance_between_lat_lngs(lat1, lon1, lat2, lon2) {
    var dLat = (lat2 - lat1) * (Math.PI / 180);
    var dLon = (lon2 - lon1) * (Math.PI / 180);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthMesh.geometry.boundingSphere.radius * c;
}

function move_camera_to_lat_lng(lat, lng) {
    helperMesh.position.copy(xyz_from_lat_lng(lat, lng, earthMesh.geometry.boundingSphere.radius));

    var start_phi = controls.getPolarAngle();
    var start_theta = controls.getAzimuthalAngle();
    var start_lat = 90.0 - (180 * start_phi) / Math.PI;
    var start_lng = (180.0 * start_theta) / Math.PI - 90.0;
    if (start_lng < -180.0) start_lng += 360.0;

    var latlng_dist = distance_between_lat_lngs(start_lat, start_lng, lat, lng);
    var latlng_max_dist = Math.PI * earthMesh.geometry.boundingSphere.radius;
    var travel_time_ms = (latlng_dist / latlng_max_dist) * 4000;

    var radius = camera.position.length();

    new TWEEN.Tween({
        lat: start_lat,
        lng: start_lng,
    })
        .to(
            {
                lat: lat,
                lng: lng,
            },
            travel_time_ms
        )
        .easing(TWEEN.Easing.Quartic.InOut)
        .onUpdate(function () {
            var phi = Math.PI - ((this.lat + 90.0) / 180.0) * Math.PI;
            var theta = ((this.lng + 180.0) / 360.0) * 2 * Math.PI - Math.PI / 2;
            controls.object.position.setFromSphericalCoords(radius, phi, theta);
            controls.update();
        })
        .onStart(function () {
            controls.enabled = false;
        })
        .onComplete(function () {
            controls.enabled = true;
        })
        .start();
}

function show_help(visible) {
    if (visible) {
        document.getElementById('help_box_bkg').onmouseup = function () {
            show_help(false);
            return true;
        };
        document.getElementById('help_box').onmouseup = function () {
            show_help(false);
            return true;
        };
    }

    if (visible) {
        document.getElementById('help_box_bkg').className = 'show';
        document.getElementById('help_box').className = 'show';
        document.getElementById('help_box_bkg').style.pointerEvents = 'all';
        document.getElementById('help_box').style.pointerEvents = 'all';
    } else {
        document.getElementById('help_box_bkg').className = 'hide';
        document.getElementById('help_box').className = 'hide';
        document.getElementById('help_box_bkg').style.pointerEvents = 'none';
        document.getElementById('help_box').style.pointerEvents = 'none';
    }
}
