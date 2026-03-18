import requests
from bs4 import BeautifulSoup

def test_google_images():
    query = "test people"
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}&tbm=isch"
    
    # Extremely old User-Agent for fallback
    headers = {"User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        soup = BeautifulSoup(response.text, "html.parser")
        img_tags = soup.find_all("img")
        print(f"Found {len(img_tags)} img tags.")
        for i, img in enumerate(img_tags[:5]):
            print(f"  Img {i+1}: {img.get('src') or img.get('data-src')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_google_images()
