import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("MAPID_API_KEY")

HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

POLYGON_COORDINATES = [] #ambil data dari polygons.json

def fetchApi(url):
    offset = 0
    all_features = []
    
    print(f"\nMulai menarik data dari: {url.split('/')[-1]}...")
    
    while True:
        body = {
            "feature": {
                "type": "Polygon",
                "coordinates": POLYGON_COORDINATES
            },
            "offset": offset
        }
        
        response = requests.post(url, headers=HEADERS, json=body)
        
        if response.status_code != 200:
            print(f"Error {response.status_code} pada offset {offset}: {response.text}")
            break
            
        result = response.json()
        
        if "features" in result: #mission
            all_features.extend(result["features"])
            
            pagination = result.get("pagination", {})
            if not pagination.get("hasMore", False):
                break
                
            offset += pagination.get("limit", 100)
        
        elif "data" in result and "activities" in result["data"]: #activity
            items = result["data"]["activities"]
            
            for item in items:
                all_features.append({
                    "type": "Feature",
                    "geometry": item.get("geometry"),
                    "properties": {k: v for k, v in item.items() if k != "geometry"}
                })
            
            total_data = result.get("meta", {}).get("total", 0)
            
            if len(items) == 0 or offset + len(items) >= total_data:
                break
                
            offset += len(items)
        
    print(f"Berhasil mendapat {len(all_features)} data.")
    return {
        "type": "FeatureCollection",
        "features": all_features
    }


print("=== MEMULAI PROSES ETL ===")

# Properti Go
properti_data = fetchApi("https://server.mapid.io/web/competition/propertigo")
with open("./etl/cisauk-propertigo.geojson", "w") as file:
    json.dump(properti_data, file, indent=2)

# Struk Go
struk_data = fetchApi("https://server.mapid.io/web/competition/struckgo")
with open("./etl/isauk-strukgo.geojson", "w") as file:
    json.dump(struk_data, file, indent=2)

# Menu Go
menu_data = fetchApi("https://server.mapid.io/web/competition/menugo")
with open("./etl/cisauk-menugo.geojson", "w") as file:
    json.dump(menu_data, file, indent=2)

# Activities
activity_data = fetchApi("https://server.mapid.io/web/competition/activities")
with open("./etl/cisauk-activity.geojson", "w") as file:
    json.dump(activity_data, file, indent=2)
