"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    departDate: "",
    returnDate: "",
    passengers: 1,
    cabinClass: "economy",
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [airports, setAirports] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const cabinClasses = {
    economy: "Economy",
    premium: "Premium Economy",
    business: "Business",
    first: "First Class",
  };

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/airports");
        if (!response.ok) throw new Error("Failed to fetch airports");
        const data = await response.json();
        setAirports(data);
      } catch (err) {
        console.error("Failed to load airports:", err);
      }
    };
    fetchAirports();
  }, []);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: price.currency || "GBP",
    }).format(price.amount);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSelectedFlight(null);

    try {
      console.log("🔍 Initiating flight search with params:", searchParams);

      const queryParams = new URLSearchParams({
        from: searchParams.from.toUpperCase(),
        to: searchParams.to.toUpperCase(),
        departDate: searchParams.departDate,
        returnDate: searchParams.returnDate,
        passengers: searchParams.passengers,
        cabinClass: searchParams.cabinClass,
      }).toString();

      const response = await fetch(
        `http://localhost:5000/api/search-flights?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Received flight data:", result);

      if (result.status === "success") {
        // Transform Duffel response into flights array
        const offers = result.data?.data?.offers || [];
        setFlights(
          offers.map((offer) => ({
            ...offer,
            displayData: {
              price: {
                amount: parseFloat(offer.total_amount),
                currency: offer.total_currency,
                baseAmount: parseFloat(offer.base_amount),
                taxAmount: parseFloat(offer.tax_amount || 0),
              },
              emissions: parseFloat(offer.total_emissions_kg || 0),
            },
          }))
        );
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("❌ Error searching flights:", err);
      setError(err.message || "Failed to search flights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-black">
          Flight Search
        </h1>

        <form
          onSubmit={handleSearch}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black">
                From
              </label>
              <input
                type="text"
                placeholder="Airport code (e.g., LHR)"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black uppercase"
                value={searchParams.from}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, from: e.target.value })
                }
                maxLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black">To</label>
              <input
                type="text"
                placeholder="Airport code (e.g., JFK)"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black uppercase"
                value={searchParams.to}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, to: e.target.value })
                }
                maxLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black">
                Cabin Class
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                value={searchParams.cabinClass}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    cabinClass: e.target.value,
                  })
                }
              >
                {Object.entries(cabinClasses).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">
                Departure Date
              </label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                value={searchParams.departDate}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    departDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black">
                Passengers
              </label>
              <input
                type="number"
                min="1"
                max="9"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                value={searchParams.passengers}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    passengers: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={
              loading ||
              !searchParams.from ||
              !searchParams.to ||
              !searchParams.departDate
            }
          >
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {flights.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Available Flights ({flights.length})
            </h2>
            <div className="space-y-4">
              {flights.map((offer) => (
                <div
                  key={offer.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setSelectedFlight(
                      offer.id === selectedFlight?.id ? null : offer
                    )
                  }
                >
                  {offer.slices.map((slice, sliceIndex) => (
                    <div key={slice.id} className="mb-4">
                      {slice.segments.map((segment, segmentIndex) => (
                        <div key={segment.id} className="mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-black">
                              {segment.origin.city_name} (
                              {segment.origin.iata_code})
                            </span>
                            →
                            <span className="font-semibold text-black">
                              {segment.destination.city_name} (
                              {segment.destination.iata_code})
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-1">
                            <img
                              src={segment.marketing_carrier.logo_symbol_url}
                              alt={segment.marketing_carrier.name}
                              className="h-6 w-auto"
                            />
                            <span className="text-sm text-black">
                              {segment.marketing_carrier.name}{" "}
                              {segment.marketing_carrier.iata_code}
                              {segment.marketing_carrier_flight_number}
                            </span>
                          </div>

                          <p className="text-sm text-black mt-1">
                            {formatDateTime(segment.departing_at)} -{" "}
                            {formatDateTime(segment.arriving_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="text-right">
                    <p className="text-lg font-bold text-black">
                      {new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: offer.total_currency,
                      }).format(offer.total_amount)}
                    </p>
                    <p className="text-sm text-black">
                      {cabinClasses[offer.cabin_class]}
                    </p>
                    {offer.total_emissions_kg && (
                      <p className="text-xs text-green-600">
                        CO₂: {offer.total_emissions_kg}kg
                        Time zone: {offer.slices[0].origin.time_zone}
                      </p>
                    )}
                  </div>

                  {selectedFlight?.id === offer.id && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-sm font-semibold text-black mb-2">
                        Additional Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-black">
                        <div>
                          <p>
                            Base fare:{" "}
                            {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: offer.total_currency,
                            }).format(offer.base_amount)}
                          </p>
                          <p>
                            Taxes & fees:{" "}
                            {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: offer.total_currency,
                            }).format(offer.tax_amount || 0)}
                          </p>
                        </div>
                        {offer.conditions?.change_before_departure && (
                          <div>
                            <p>
                              Change fee:{" "}
                              {new Intl.NumberFormat("en-GB", {
                                style: "currency",
                                currency:
                                  offer.conditions.change_before_departure
                                    .penalty_currency,
                              }).format(
                                offer.conditions.change_before_departure
                                  .penalty_amount
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && flights.length === 0 && searchParams.from && (
          <div className="text-center text-black mt-8">
            No flights found matching your criteria.
          </div>
        )}
      </main>
    </div>
  );
}
