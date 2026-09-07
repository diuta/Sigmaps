import json
import os
from dotenv import load_dotenv
from supabase import create_client

# 1. Setup Koneksi Supabase
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)
print(url)

# 2. Baca file hasil script ETL sebelumnya
print("Membaca data cisauk-propertigo.geojson...")
with open("./etl/cisauk-propertigo.geojson", "r") as file:
    data = json.load(file)

features = data["features"]
records_to_insert = []

# 3. Ekstrak data yang dibutuhkan (Transform)
for f in features:
    lng = f["geometry"]["coordinates"][0]
    lat = f["geometry"]["coordinates"][1]
    
    props = f["properties"]
    
    row = {
        "id": f["_id"],
        "kategori_properti": props.get("kategori_properti"),
        "jenis_properti": props.get("jenis_properti"),
        "alamat": props.get("alamat"),
        "foto_tampak_depan": props.get("foto_tampak_depan"),
        "foto_spanduk": props.get("foto_spanduk"),
        "lat": lat,
        "lng": lng
    }
    records_to_insert.append(row)

# 4. Insert ke Supabase (Load)
print(f"Menyimpan {len(records_to_insert)} data ke Supabase...")
try:
    # Lakukan upsert (update jika ID sudah ada, insert jika baru)
    response = supabase.table("properti_go").upsert(records_to_insert).execute()
    print("Berhasil!")
except Exception as e:
    print(f"Terjadi error saat insert: {e}")