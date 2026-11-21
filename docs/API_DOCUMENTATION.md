# CivicResolve — REST API Specification & Endpoint Documentation

> **Complete OpenAPI / REST Reference for the CivicResolve Municipal Redressal API**  
> *Base Production URL:* `https://civicresolve-m93a.onrender.com/api`  
> *Local Development URL:* `http://localhost:5000/api`

---

## 1. Authentication & Headers

All private citizen and administrative endpoints require a valid Firebase ID Token passed in the `Authorization` HTTP header:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### Common Headers
| Header Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `Authorization` | String | Bearer token obtained from Firebase Auth client SDK | Conditional (Protected routes) |
| `Content-Type` | String | `application/json` (or `multipart/form-data` for file uploads) | Yes |
| `Accept` | String | `application/json` | Yes |

---

## 2. API Endpoints Directory

### 2.1 System & Health

#### `GET /health`
Returns the operational status, current uptime, memory metrics, and active timestamp of the API gateway.
- **Auth Required:** No (Public)
- **Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "CivicResolve API",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 1420.5,
  "timestamp": "2026-11-21T11:45:00.000Z"
}
```

---

### 2.2 Public Transparency Endpoints

#### `GET /complaints/public-stats`
Retrieves aggregated municipal transparency metrics (total complaints, resolution count, active grievances, department workload).
- **Auth Required:** No (Public)
- **Response `200 OK`:**
```json
{
  "success": true,
  "stats": {
    "totalComplaints": 128,
    "resolvedComplaints": 98,
    "inProgressComplaints": 24,
    "resolutionRate": 76.5,
    "averageResolutionHours": 18.4,
    "departmentCounts": {
      "Roads & Highways": 45,
      "Water Supply & Sewerage": 32,
      "Electricity Board": 28,
      "Solid Waste Management": 23
    }
  }
}
```

#### `GET /complaints/public-feed`
Retrieves a paginated list of public grievances with all citizen PII automatically stripped.
- **Auth Required:** No (Public)
- **Query Parameters:**
  - `limit` (optional, default: 20, max: 100): Number of records to return.
  - `category` (optional): Filter by municipal category.
- **Response `200 OK`:**
```json
{
  "success": true,
  "complaints": [
    {
      "id": "comp_1732185600000_a1b2",
      "publicId": "CR-2026-001252",
      "title": "Severe Pothole Cluster on MG Road",
      "category": "Roads & Footpaths",
      "status": "IN_PROGRESS",
      "statusLabel": "In Progress (Work Assigned)",
      "priority": { "level": "high", "score": 82 },
      "location": {
        "addressText": "MG Road, Near Central Bus Stand",
        "city": "Coimbatore",
        "ward": "Ward 24",
        "fuzzedLat": 11.0168,
        "fuzzedLng": 76.9558
      },
      "createdAt": "2026-11-21T09:15:00.000Z"
    }
  ]
}
```

#### `GET /complaints/track/:publicId`
Tracks a grievance by its public reference identifier (e.g., `CR-2026-001252`).
- **Auth Required:** No (Public)
- **Parameters:** `publicId` in URL path.
- **Response `200 OK`:**
```json
{
  "success": true,
  "complaint": {
    "publicId": "CR-2026-001252",
    "title": "Severe Pothole Cluster on MG Road",
    "category": "Roads & Footpaths",
    "status": "IN_PROGRESS",
    "sla": {
      "targetHours": 48,
      "deadline": "2026-11-23T09:15:00.000Z",
      "isOverdue": false
    },
    "history": [
      {
        "to": "REPORTED",
        "createdAt": "2026-11-21T09:15:00.000Z",
        "publicNote": "Complaint logged and classified via Gemini AI"
      },
      {
        "to": "IN_PROGRESS",
        "createdAt": "2026-11-21T10:30:00.000Z",
        "publicNote": "Work order dispatched to Roads Division"
      }
    ]
  }
}
```

---

### 2.3 Citizen Grievance Endpoints

#### `POST /complaints`
Files a new citizen grievance report with optional photo evidence.
- **Auth Required:** Yes (Citizen / Admin)
- **Content-Type:** `multipart/form-data` or `application/json`
- **Request Body:**
```json
{
  "title": "Water pipeline burst causing street flooding",
  "description": "Clean water is gushing out of an underground supply line near the primary school gate. Impeding pedestrian access.",
  "userCategory": "Water Supply & Sewerage",
  "location": {
    "lat": 11.0168,
    "lng": 76.9558,
    "addressText": "School Road, Near Primary School, Ward 12",
    "ward": "Ward 12",
    "city": "Coimbatore"
  }
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Grievance registered and dispatched successfully.",
  "complaint": {
    "id": "comp_1732185600000_9f8e",
    "publicId": "CR-2026-001253",
    "status": "REPORTED",
    "priority": { "level": "critical", "score": 92 },
    "recommendedDepartment": "Water Supply & Sewerage Department",
    "sla": { "targetHours": 12, "deadline": "2026-11-21T21:15:00.000Z" }
  },
  "receipt": {
    "receiptId": "REC-CR-2026-001253-A8F2",
    "verificationHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "officialSeal": "CIVICRESOLVE CRYPTOGRAPHIC MUNICIPAL PROOF"
  }
}
```

#### `GET /complaints/mine`
Retrieves all complaints filed by the currently authenticated citizen.
- **Auth Required:** Yes (Citizen)
- **Response `200 OK`:**
```json
{
  "success": true,
  "complaints": [ /* Array of citizen's owned grievances */ ]
}
```

#### `POST /complaints/:id/verify-resolution`
Citizen confirms that municipal authorities have genuinely rectified the issue.
- **Auth Required:** Yes (Owner Citizen)
- **Request Body:**
```json
{
  "rating": 5,
  "feedback": "Work completed cleanly. Road patched and water drained."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Resolution verified successfully. Thank you for making our city better!",
  "status": "CITIZEN_VERIFIED"
}
```

#### `POST /complaints/:id/reopen`
Citizen reopens an issue if the resolution was incomplete or defective.
- **Auth Required:** Yes (Owner Citizen)
- **Request Body:**
```json
{
  "reopenReason": "The pothole was merely filled with loose gravel and washed away after the rain."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Grievance reopened with expedited high priority.",
  "newStatus": "REOPENED",
  "expeditedSlaHours": 24
}
```

---

### 2.4 Administrative Endpoints

#### `GET /admin/complaints`
Retrieves all complaints across all municipal departments with full triage metadata.
- **Auth Required:** Yes (Admin role)
- **Query Parameters:** `status`, `department`, `priority`, `page`, `limit`
- **Response `200 OK`:** List of full grievance records.

#### `PATCH /admin/complaints/:id/status`
Updates grievance status (`IN_PROGRESS`, `RESOLVED`, `REJECTED`) and records municipal notes.
- **Auth Required:** Yes (Admin role)
- **Request Body:**
```json
{
  "status": "RESOLVED",
  "resolutionNote": "Drainage pipeline unblocked using municipal high-pressure jetting unit.",
  "department": "Water Supply & Sewerage"
}
```
- **Response `200 OK`:** Updated grievance record with history log.

---

### 2.5 Artificial Intelligence & Civic Assistant Endpoints

#### `POST /ai/chat`
Conversational civic grievance guide powered by Google Gemini supporting English, Tamil, Hindi, Telugu, and Kannada.
- **Auth Required:** No (Rate limited to 60 req/15 min)
- **Request Body:**
```json
{
  "message": "தெரு விளக்கு எரியவில்லை, நான் எங்கே புகார் செய்வது?",
  "language": "ta"
}
```
- **Response `200 OK`:**
```json
{
  "reply": "தெரு விளக்கு எரியாத புகார்களை 'Street Lighting & Electrical' பிரிவில் பதிவு செய்யலாம். நமது மின்சார வாரியம் 24 மணி நேரத்திற்குள் சரிசெய்யும்.",
  "suggestedCategory": "Street Lighting & Electrical",
  "suggestedPriority": "medium",
  "provider": "gemini"
}
```
