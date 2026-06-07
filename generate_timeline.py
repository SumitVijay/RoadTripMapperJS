import os
import json
import time
from datetime import datetime
import urllib.request
from exif import Image

PHOTOS_DIR = "./static/photos"
ROUTE_JSON = "./data/route_geometry.json"
BUNDLE_JSON = "./data/bundled_trip.json"

def decimal_coords(coords, ref):
    """Converts raw EXIF degrees/minutes/seconds to standard decimal GPS mapping format"""
    decimal = coords[0] + (coords[1] / 60.0) + (coords[2] / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def extract_photo_metadata():
    """Loops through your photo folder and extracts names, locations, and times"""
    photo_data = []
    
    if not os.path.exists(PHOTOS_DIR):
        print(f"❌ Error: The directory {PHOTOS_DIR} does not exist.")
        return []

    for filename in sorted(os.listdir(PHOTOS_DIR)):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            filepath = os.path.join(PHOTOS_DIR, filename)
            
            with open(filepath, 'rb') as img_file:
                try:
                    img = Image(img_file)
                    if img.has_exif and hasattr(img, 'gps_latitude') and hasattr(img, 'datetime'):
                        # Parse Coordinates
                        lat = decimal_coords(img.gps_latitude, img.gps_latitude_ref)
                        lon = decimal_coords(img.gps_longitude, img.gps_longitude_ref)
                        
                        # Parse Timestamp
                        dt = datetime.strptime(img.datetime, '%Y:%m:%d %H:%M:%S')
                        
                        photo_data.append({
                            "timestamp": dt.strftime('%Y-%m-%d %H:%M:%S'),
                            "filepath": f"static/photos/{filename}",
                            "lat": lat,
                            "lon": lon,
                            "datetime_obj": dt
                        })
                except Exception as e:
                    print(f"⚠️ Skipped {filename}: Could not parse metadata ({e})")
                    
    # Sort chronologically by when the picture was snapped
    photo_data.sort(key=lambda x: x['datetime_obj'])
    return photo_data

def bundle_photos(photos, time_threshold_hours=4):
    """Bundles photos taken within 4 hours of each other into a single map stop event"""
    if not photos:
        return []
        
    bundles = []
    current_bundle = [photos[0]]
    
    for next_photo in photos[1:]:
        time_delta = (next_photo['datetime_obj'] - current_bundle[-1]['datetime_obj']).total_seconds() / 3600.0
        
        if time_delta <= time_threshold_hours:
            current_bundle.append(next_photo)
        else:
            bundles.append(current_bundle)
            current_bundle = [next_photo]
            
    bundles.append(current_bundle)
    return bundles

def fetch_osrm_route(waypoints):
    """Queries free OSRM servers to connect your map stops with actual driving road coordinates"""
    if len(waypoints) < 2:
        return waypoints
        
    coord_string = ";".join([f"{lon},{lat}" for lat, lon in waypoints])
    url = f"http://router.project-osrm.org/route/v1/driving/{coord_string}?overview=full&geometries=geojson"
    
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            if data['code'] == 'Ok':
                # OSRM returns coordinates as [lon, lat], flip to standard [lat, lon] for Leaflet
                flipped_coords = [[coord[1], coord[0]] for coord in data['routes'][0]['geometry']['coordinates']]
                return flipped_coords
    except Exception as e:
        print(f"⚠️ OSRM routing failed ({e}). Falling back to simple straight lines.")
    
    return waypoints


def get_clean_location_name(lat, lon):
    """Queries OpenStreetMap and automatically maps municipal names to custom landmarks"""
    
    # 🌍 1. FETCH THE OFFICIAL MUNICIPAL TOWN NAME
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=en"
    req = urllib.request.Request(url, headers={'User-Agent': 'RoadTripMapperVideoEngine/1.0'})
    
    try:
        # Mandatory pause to respect OpenStreetMap's usage conditions
        time.sleep(1.2) 
        
        with urllib.request.urlopen(req) as response:
            raw_body = response.read().decode()
            data = json.loads(raw_body)
            
            if "error" in data:
                print(f"⚠️ Nominatim API error for coordinates ({lat}, {lon}): {data['error']}")
                return "Scenic Route"
                
            address = data.get('address', {})
            
            # Extract the raw town or city identifier from the API payload
            raw_town_name = (
                address.get('city') or 
                address.get('town') or 
                address.get('village') or 
                address.get('municipality') or
                "Scenic Route"
            )
            
            # 🗺️ 2. THE LANDMARK OVERRIDE DICTIONARY
            # Simply match the raw town name on the left with your custom label on the right!
            town_overrides = {
                "Chessy": "Disneyland Paris 🏰",
                "Engelberg": "Mt. Titlis (Engelberg) 🏔️",
                "Neuenkirch": "Lucerne Lake Region 🇨🇭",
                "Bologna": "Bologna Food District 🍝",
                "Pisa": "Leaning Tower of Pisa 🇮🇹",
                "Courmayeur": "Mont Blanc Valley ⛰️",
                "Grindelwald": "Jungfraujoch Top of Europe 🏔️"
            }
            
            # 💡 3. TRANSLATION CHECK
            # If the town exists in our dictionary, swap it! Otherwise, use the official name.
            if raw_town_name in town_overrides:
                return town_overrides[raw_town_name]
                
            return raw_town_name
            
    except Exception as e:
        print(f"💥 Network / Parsing Crash for coordinates {lat}, {lon}: {e}")
        return "Travel Destination"
    
def main():
    print("📸 Phase 1: Scanning photo library metadata structures...")
    raw_photos = extract_photo_metadata()
    if not raw_photos:
        print("❌ No photos found containing GPS metadata headers. Check your images!")
        return
        
    print(f"📦 Phase 2: Clustering {len(raw_photos)} timeline events into geographical stops...")
    bundled_stops = bundle_photos(raw_photos)
    
    # Extract core waypoints from the first photo of every clustered group
    stop_waypoints = [[stop_group[0]['lat'], stop_group[0]['lon']] for stop_group in bundled_stops]
    
    print("🛣️ Phase 3: Fetching street track arrays from OSRM engine pipelines...")
    route_geometry = fetch_osrm_route(stop_waypoints)
    
    print("🌍 Phase 4: Resolving GPS coordinates and mapping precisely to road indices...")
    final_bundles = []
    
    for idx, stop_group in enumerate(bundled_stops):
        first_photo = stop_group[0]
        p_lat, p_lon = first_photo['lat'], first_photo['lon']
        
        # Turn numeric coordinates into readable human text strings via Nominatim
        real_town_name = get_clean_location_name(p_lat, p_lon)
        
        # --- PRECISION DISTANCE ALIGNMENT ALGORITHM ---
        # Find the exact coordinate node index along the OSRM route track that is closest to the photo location
        closest_idx = 0
        min_distance = float('inf')
        
        for r_idx, (r_lat, r_lon) in enumerate(route_geometry):
            # Euclidean distance approximation to pinpoint proximity mapping elements
            dist = (r_lat - p_lat)**2 + (r_lon - p_lon)**2
            if dist < min_distance:
                min_distance = dist
                closest_idx = r_idx
                
        print(f"📍 Anchored Stop #{idx + 1} -> {real_town_name} (Mapped to Route Node Index: {closest_idx})")
        
        cleaned_group = []
        for photo in stop_group:
            cleaned_group.append({
                "location_name": real_town_name,
                "timestamp": photo['timestamp'],
                "filepath": photo['filepath'],
                "route_index_marker": closest_idx 
            })
        final_bundles.append(cleaned_group)

    # Save output data configurations
    os.makedirs("./data", exist_ok=True)
    
    with open(ROUTE_JSON, 'w') as f:
        json.dump(route_geometry, f, indent=2)
        
    with open(BUNDLE_JSON, 'w') as f:
        json.dump(final_bundles, f, indent=2)

    print(f"\n🎉 SUCCESS: Data files populated perfectly with strict road bindings!")
    print(f"💾 Saved {len(route_geometry)} route track nodes -> {ROUTE_JSON}")
    print(f"💾 Saved {len(final_bundles)} timeline event clusters -> {BUNDLE_JSON}")

if __name__ == "__main__":
    main()