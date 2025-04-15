import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function SearchImages({ onSelectImage }) {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiKey = import.meta.env.VITE_PIXABAY_API_KEY;
  const apiUrl = import.meta.env.VITE_PIXABAY_API_URL;

  const imageSearch = async (query) => {
    const response = await axios.get(apiUrl, {
      params: {
        key: apiKey,
        q: query,
        image_type: "photo",
        per_page: 10,
      },
    });
    return response.data.hits;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);

    try {
      const fetchedImages = await imageSearch(query);
      setImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Error fetching images");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for images..."
          />
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? "Searching.." : "Search"}
          </button>
        </form>

        <div className="results-container">
          {images.map((image) => (
            <div key={image.id} className="image-card">
              <img src={image.webformatURL} alt={image.tags} />
              <button onClick={() => onSelectImage(image)}>Add Captions</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
