import urllib.request
import urllib.parse
import json

url = "https://pontine-harris-damoda.ngrok-free.dev/webhooks/whatsapp"

data = urllib.parse.urlencode({
    "From": "whatsapp:+923001234567",
    "Body": "Hello test message",
    "MessageSid": "SM123test",
    "ProfileName": "Test User"
}).encode()

req = urllib.request.Request(
    url,
    data=data,
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    print("SUCCESS:", result)
except Exception as e:
    print("ERROR:", e)
