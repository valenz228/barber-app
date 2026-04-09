export function TabBar({ tabs, currentTab, onChange }) {
  return (
    <nav className="tabbar" aria-label="Navegacion principal">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tabbar-item ${currentTab === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="tabbar-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tabbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
