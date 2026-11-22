export const incidentTypes = [
  { id: "accident", label: "Accident", color: "#ef4444" },
  { id: "heavy_traffic", label: "Heavy traffic", color: "#f59e0b" },
  { id: "flooding", label: "Flooding", color: "#2563eb" },
  { id: "road_obstruction", label: "Road obstruction", color: "#a16207" },
  { id: "police_security", label: "Police or security", color: "#8b5cf6" },
  { id: "road_damage", label: "Road damage", color: "#94a3b8" },
  { id: "vehicle_breakdown", label: "Vehicle breakdown", color: "#0891b2" },
] as const;

export type IncidentType = (typeof incidentTypes)[number]["id"];

export const sampleReports = [
  {
    id: "demo-1",
    type: "flooding",
    location: "Ozumba Mbadiwe Avenue",
    description: "Example flooding incident",
    confirmations: 3,
  },
  {
    id: "demo-2",
    type: "accident",
    location: "Lekki–Epe Expressway",
    description: "Example road accident",
    confirmations: 5,
  },
  {
    id: "demo-3",
    type: "road_obstruction",
    location: "Admiralty Way",
    description: "Example lane closure",
    confirmations: 0,
  },
] as const;
