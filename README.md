
# Visualize Location Data

## 1. Project Overview

This project visualizes GPS location data collected from an IoT device using Microsoft Azure Maps.

GPS data is stored as JSON files in Azure Blob Storage. The web application retrieves this data through an Azure Functions backend API and displays the GPS coordinates as markers on an interactive map.

## 2. Technologies Used

- HTML
- JavaScript
- Microsoft Azure Maps
- Azure Blob Storage
- Azure Functions
- Azure Static Web Apps

## 3. Application Architecture

1. GPS data is stored in the `gps-data` Blob Storage container.
2. Azure Functions retrieves GPS JSON files from Blob Storage.
3. The API converts GPS coordinates into GeoJSON features.
4. The frontend requests GPS data from `/api/gps-data`.
5. Azure Maps displays the GPS locations as bubble markers.

## 4. Project Structure

```text
Visualize-Location-Data/
├── api/
│   ├── src/
│   │   └── functions/
│   │       └── httpTrigger1.js
│   ├── host.json
│   └── package.json
├── index.html
├── README.md
└── .gitignore
```

## 5. Local Configuration

The backend requires the following environment variables:

- `BLOB_CONTAINER_URL`
- `BLOB_SAS_TOKEN`

Azure Maps uses the `subscriptionKey` JavaScript variable in the frontend.

Local secrets are configured in `api/local.settings.json` and excluded from Git.

## 6. Running the Application Locally

Start the Azure Functions backend:

```bash
cd api
func start
```

Start the frontend development server:

```bash
npx http-server -p 8080
```

Start the Static Web Apps emulator:

```bash
npx @azure/static-web-apps-cli start http://localhost:8080 --api-devserver-url http://localhost:7071
```

Open:

```text
http://localhost:4280
```

## 7. Deployment

The application is deployed using Azure Static Web Apps with a GitHub repository as the source.

The deployed application retrieves GPS data through the backend API and visualizes the locations using Azure Maps.

## 8. Result

The application successfully retrieves and visualizes GPS location data stored in Azure Blob Storage.

During local testing, 88 GPS files were retrieved and converted into GeoJSON features.
