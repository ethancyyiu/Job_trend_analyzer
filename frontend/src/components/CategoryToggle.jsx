export function CategoryToggle({ activeCategories, setActiveCategories }) {
  const categories = [
    { label: "Software Engineer", value: "software engineer", color: "#0EA5E9" },
    { label: "Data Engineer", value: "data engineer", color: "#22C55E" },
    { label: "ML Engineer", value: "machine learning engineer", color: "#16A34A" },
    { label: "Data Scientist", value: "data scientist", color: "#F59E0B" },
    { label: "Data Analyst", value: "data analyst", color: "#D97706" },
    { label: "Other Categories", value: "others", color: "#334155" },
  ];

  const toggleCategory = (value) => {
    if (activeCategories.includes(value)) {
      setActiveCategories(activeCategories.filter(cat => cat !== value));
    } else {
      setActiveCategories([...activeCategories, value]);
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
