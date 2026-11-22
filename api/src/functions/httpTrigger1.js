
const { app } = require('@azure/functions');

app.http('httpTrigger1', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'gps-data',

    handler: async (request, context) => {
        try {
            const containerUrl = (
                process.env.BLOB_CONTAINER_URL || ''
            ).replace(/\/+$/, '');

            const sasToken = (
                process.env.BLOB_SAS_TOKEN || ''
            ).replace(/^\?/, '');

            if (!containerUrl || !sasToken) {
                return {
                    status: 500,
                    jsonBody: {
                        error: 'Missing Blob Storage configuration'
                    }
                };
            }

            // 1. Get the list of GPS JSON files
            const listUrl =
                `${containerUrl}?restype=container&comp=list&${sasToken}`;

            const listResponse = await fetch(listUrl);

            if (!listResponse.ok) {
                throw new Error(
                    `Blob listing failed: HTTP ${listResponse.status}`
                );
            }

            const xml = await listResponse.text();

            // 2. Extract blob names from Azure XML
            const names = [
                ...xml.matchAll(/<Name>([\s\S]*?)<\/Name>/g)
            ].map(match => match[1]);

            context.log(`GPS files found: ${names.length}`);

            // 3. Download GPS data and create GeoJSON features
            const features = [];
            let nextIndex = 0;

            const worker = async () => {
                while (nextIndex < names.length) {
                    const name = names[nextIndex++];

                    try {
                        const blobUrl =
                            `${containerUrl}/${encodeURIComponent(name)}?${sasToken}`;

                        const response = await fetch(blobUrl);

                        if (!response.ok) {
                            context.warn(`Cannot read blob: ${name}`);
                            continue;
                        }

                        const gps = await response.json();

                        const lat = Number(gps.gps?.latitude);
                        const lon = Number(gps.gps?.longitude);

                        if (
                            !Number.isFinite(lat) ||
                            !Number.isFinite(lon) ||
                            lat < -90 || lat > 90 ||
                            lon < -180 || lon > 180
                        ) {
                            context.warn(`Invalid GPS data: ${name}`);
                            continue;
                        }

                        features.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [lon, lat]
                            },
                            properties: {
                                blobName: name
                            }
                        });

                    } catch (error) {
                        context.warn(`Failed to process: ${name}`);
                    }
                }
            };

            // Process up to 10 files concurrently
            const workerCount = Math.min(10, names.length);

            await Promise.all(
                Array.from({ length: workerCount }, () => worker())
            );

            context.log(`GPS points loaded: ${features.length}`);

            // 4. Return GeoJSON FeatureCollection
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/geo+json'
                },
                jsonBody: {
                    type: 'FeatureCollection',
                    features: features
                }
            };

        } catch (error) {
            context.error('GPS API failed:', error.message);

            return {
                status: 500,
                jsonBody: {
                    error: 'Unable to load GPS data. Check API settings and SAS token.'
                }
            };
        }
    }
});
