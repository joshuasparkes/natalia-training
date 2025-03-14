from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Get Duffel API token from environment variable
DUFFEL_API_TOKEN = "duffel_test_O6axsBfPB1YFwLk2tVJaNYXiFhITUnItVS8FJEtfpRp"
DUFFEL_API_URL = "https://api.duffel.com/air/offer_requests"
DUFFEL_HEADERS = {
    "Accept-Encoding": "gzip",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Duffel-Version": "v2",
    "Authorization": f"Bearer {DUFFEL_API_TOKEN}",
}


@app.route("/api/search-flights", methods=["GET"])
def search_flights():
    try:
        from_city = request.args.get("from", "").upper()
        to_city = request.args.get("to", "").upper()
        depart_date = request.args.get("departDate")
        passengers = int(request.args.get("passengers", 1))
        cabin_class = request.args.get("cabinClass", "economy")

        print(f"🔍 Searching flights from {from_city} to {to_city}")

        payload = {
            "data": {
                "slices": [
                    {
                        "origin": from_city,
                        "destination": to_city,
                        "departure_date": depart_date,
                    }
                ],
                "passengers": [{"type": "adult"} for _ in range(passengers)],
                "cabin_class": cabin_class,
            }
        }

        print("📡 Sending request to Duffel API...")
        response = requests.post(
            f"{DUFFEL_API_URL}?return_offers=true", headers=DUFFEL_HEADERS, json=payload
        )

        if not response.ok:
            print(f"❌ Duffel API error: {response.status_code}")
            return (
                jsonify({"status": "error", "message": "Failed to fetch flights"}),
                response.status_code,
            )

        # Simply forward Duffel's response
        duffel_response = response.json()
        print("✅ Received response from Duffel")

        return jsonify({"status": "success", "data": duffel_response})

    except Exception as e:
        print(f"❌ Error processing request: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
