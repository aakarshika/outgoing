import os
import json
import requests
import re
import argparse
from pathlib import Path
from bs4 import BeautifulSoup

# Configuration
DEFAULT_N = 5
BASE_DIR = Path(__file__).resolve().parent.parent.parent
JSON_FILE = BASE_DIR / "backend/apps/events/management/commands/seed-helper-data/event_categories.json"
ASSETS_DIR = BASE_DIR / "frontend/public/assets/google-downloaded"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

def download_images(slug, n):
    print(f"Searching images for: {slug}")
    query = f"Images for {slug} people"
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}&tbm=isch"
    
    headers = {"User-Agent": USER_AGENT}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching search results for {slug}: {e}")
        return

    soup = BeautifulSoup(response.text, "html.parser")
    
    # Google Images thumbnails are often in <img> tags. 
    # They can be base64 or links to gstatic.
    img_tags = soup.find_all("img")
    print(f"  Found {len(img_tags)} img tags total.")
    
    # Filter out small icons or transparent pixels usually found at the beginning
    # We want actual thumbnails
    count = 0
    folder_path = ASSETS_DIR / slug
    folder_path.mkdir(parents=True, exist_ok=True)

    for img in img_tags:
        if count >= n:
            break
            
        src = img.get("src") or img.get("data-src")
        if not src or "gstatic.com" not in src and not src.startswith("data:image"):
            continue

        try:
            if src.startswith("data:image"):
                # Handle base64
                header, data = src.split(",", 1)
                ext = header.split(";")[0].split("/")[-1]
                import base64
                img_data = base64.b64decode(data)
                file_name = f"{slug}_{count+1}.{ext}"
                with open(folder_path / file_name, "wb") as f:
                    f.write(img_data)
            else:
                # Handle URL
                img_res = requests.get(src, stream=True, timeout=5)
                img_res.raise_for_status()
                # Try to guess extension
                content_type = img_res.headers.get("content-type", "")
                ext = "jpg"
                if "png" in content_type: ext = "png"
                elif "gif" in content_type: ext = "gif"
                
                file_name = f"{slug}_{count+1}.{ext}"
                with open(folder_path / file_name, "wb") as f:
                    for chunk in img_res.iter_content(1024):
                        f.write(chunk)
            
            count += 1
            print(f"  Saved {file_name}")
        except Exception as e:
            print(f"  Failed to download an image for {slug}: {e}")

    if count == 0:
        print(f"  Warning: No images found for {slug}")

def main():
    parser = argparse.ArgumentParser(description="Download Google Image thumbnails for event categories.")
    parser.get_default("n")
    parser.add_argument("--n", type=int, default=DEFAULT_N, help="Number of images to download per category")
    args = parser.parse_args()

    if not JSON_FILE.exists():
        print(f"Error: JSON file not found at {JSON_FILE}")
        return

    with open(JSON_FILE, "r") as f:
        categories = json.load(f)

    print(f"Found {len(categories)} categories. Downloading {args.n} images each...")
    
    for cat in categories:
        slug = cat.get("slug")
        if slug:
            download_images(slug, args.n)

    print("\nDone! Images are saved in:", ASSETS_DIR)

if __name__ == "__main__":
    main()
