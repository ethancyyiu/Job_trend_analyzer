export function CategoryToggle({ activeCategories, setActiveCategories }) {
  const categories = [
    { label: "Software Engineer", value: "software engineer", color: "#FF0000" },
    { label: "Data Engineer", value: "data engineer", color: "#FFD700" },
    { label: "ML Engineer", value: "machine learning engineer", color: "#008000" },
    { label: "Data Scientist", value: "data scientist", color: "#0000FF" },
    { label: "Data Analyst", value: "data analyst", color: "#800080" },
    { label: "Other Categories", value: "others", color: "#000000" },
  ];

  const toggleCategory = (value) => {
    if (activeCategories.includes(value)) {
      setActiveCategories(activeCategories.filter(cat => cat !== value));
    } else {
      setActiveCategories([...activeCategories, value]);
    }
  };

  const handleSelectAll = () => {
    if (activeCategories.length === categories.length) {
      setActiveCategories([]);
    } else {
      setActiveCategories(categories.map(cat => cat.value));
    }
  };

  return (
    <div className="category-toggle">
      <div className="checkbox-group">
        {categories.map(category => (
          <label key={category.value} className="checkbox-label">
            <input
              type="checkbox"
              checked={activeCategories.includes(category.value)}
              onChange={() => toggleCategory(category.value)}
              className="checkbox-input"
            />
            <span 
              className="color-dot" 
              style={{ backgroundColor: category.color }}
            ></span>
            <span className="label-text">{category.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}