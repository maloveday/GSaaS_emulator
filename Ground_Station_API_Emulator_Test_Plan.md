# ✅ Test Plan for Ground Station API Emulator

## 🛰️ Test Case 1: Create a New Satellite
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Navigate to "Manage Satellites" | Page loads successfully |
| 2 | Enter a new Satellite ID and Name | Fields accept input |
| 3 | Click "Create Satellite" | Satellite appears in list |
| 4 | Reload page | Satellite persists |
| 5 | Verify satellite in DB | Entry exists with matching data |

## 🛰️ Test Case 2: Delete a Satellite
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click "Delete" on a listed satellite | Confirmation appears |
| 2 | Confirm deletion | Satellite removed from list |
| 3 | Reload page | Satellite no longer appears |
| 4 | Verify in DB | Entry is removed |

## 🛰️ Test Case 3: Update Satellite Telemetry
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click "Edit Telemetry" on a satellite | JSON editor appears |
| 2 | Enter valid JSON payload | Editor accepts input |
| 3 | Click "Update Telemetry" | Update succeeds |
| 4 | Reload page | New payload appears correctly |
| 5 | Query DB | Payload stored in database |

## 📡 Test Case 4: Create a New Ground Station
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Navigate to "Manage Ground Stations" | Page loads successfully |
| 2 | Enter a new Ground Station ID and Name | Fields accept input |
| 3 | Click "Create Ground Station" | Station appears in list |
| 4 | Reload page | Station persists |
| 5 | Verify in DB | Entry exists with matching data |

## 📡 Test Case 5: Delete a Ground Station
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click "Delete" on a ground station | Confirmation appears |
| 2 | Confirm deletion | Station is removed |
| 3 | Reload page | Station no longer listed |
| 4 | Query DB | Entry removed from DB |

## 📡 Test Case 6: Update Ground Station Telemetry
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click "Edit Telemetry" | JSON editor appears |
| 2 | Input valid JSON | Accepted |
| 3 | Click "Update Telemetry" | Succeeds |
| 4 | Reload page | Payload retained |
| 5 | Verify in DB | Telemetry matches input |

## 🔁 Test Case 7: Assign Satellite to Ground Station
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Navigate to "Assign Satellite" page | Page loads with dropdowns |
| 2 | Select satellite and station | Dropdowns work |
| 3 | Click "Assign" | Success message appears |
| 4 | Fetch assignments | Station shows under satellite |
| 5 | Query DB | Record exists in assignment table |

## ❌ Test Case 8: Unassign Satellite from Ground Station
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | On "Assign Satellite" page, view assignments | Table displays assignments |
| 2 | Click "Unassign" | Satellite unassigned |
| 3 | Reload and recheck | Row is removed |
| 4 | Verify in DB | Assignment entry is gone |

## 📋 Test Case 9: View Assignment Overview
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Go to "Assignment Overview" page | Page loads |
| 2 | For each satellite, view list of assigned ground stations | Display is correct |
| 3 | Unassigned satellites show "No ground stations assigned" | ✅ |

## 🔍 Test Case 10: Reverse Lookup from Ground Station
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | On "Manage Ground Stations", click "View Assigned Satellites" | Assignment list appears |
| 2 | Check satellite IDs match expected | Correct relationships shown |

## 🔎 Test Case 11: View Assignments from Satellite Page
| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | On "Manage Satellites", click "View Assignments" | Ground stations listed |
| 2 | Unassigned → message shown | ✅ |
| 3 | Confirm with database | Matches actual assignments |