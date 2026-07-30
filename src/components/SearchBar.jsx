import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 1) {
      const products = JSON.parse(localStorage.getItem("elvreProducts") || "[]");
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase()) ||
        p.description.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (product) => {
    navigate(`/product/${product.id}`);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((product) => (
            <div key={product.id} onClick={() => selectSuggestion(product)} className="suggestion-item">
              <img src={product.image || "/assets/jaggery.png"} alt={product.name} />
              <strong>{product.name}</strong>
              <span>{product.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;