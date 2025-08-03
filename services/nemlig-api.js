export class NemligAPIService {
    constructor() {
        this.baseUrl = 'https://www.nemlig.com/webapi';
        this.searchUrl = 'https://webapi.prod.knl.nemlig.it/searchgateway/api/search';
    }

    async getBearerToken() {
        try {
            console.log('Requesting bearer token from Nemlig.com...');
            const response = await fetch(`${this.baseUrl}/Token`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            console.log('Token response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Token request failed:', response.status, errorText);
                throw new Error(`Token request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Token response received:', {
                upgraded: data.upgraded,
                token_type: data.token_type,
                expires_in: data.expires_in,
                has_access_token: !!data.access_token
            });

            if (!data.access_token) {
                console.error('No access_token in response:', data);
                throw new Error('No access_token found in response');
            }

            return data.access_token;
        } catch (error) {
            console.error('Failed to get bearer token:', error);
            throw error;
        }
    }

    async addToBasket(token, productId) {
        try {
            console.log(`Adding product ${productId} to basket...`);
            
            const payload = {
                ProductId: productId,
                quantity: 1,
                AffectPartialQuantity: false,
                disableQuantityValidation: false
            };

            const response = await fetch(`${this.baseUrl}/basket/AddToBasket`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': 'https://www.nemlig.com',
                    'Referer': 'https://www.nemlig.com/',
                },
                body: JSON.stringify(payload)
            });

            console.log(`AddToBasket response status for product ${productId}:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to add product ${productId} to basket:`, response.status, errorText);
                throw new Error(`Kunne ikke tilføje til kurv: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Product ${productId} successfully added to basket:`, data);
            
            return { success: true, data };
        } catch (error) {
            console.error(`Error adding product ${productId} to basket:`, error);
            return { success: false, error: error.message };
        }
    }

    async searchProduct(token, item, timestamp, timeslotUtc) {
        try {
            const params = new URLSearchParams({
                query: item.trim(),
                take: '20',
                skip: '0',
                recipeCount: '0',
                timestamp: timestamp,
                timeslotUtc: timeslotUtc,
                deliveryZoneId: '1'
            });

            const url = `${this.searchUrl}?${params.toString()}`;

            console.log(`Searching for "${item}" with URL:`, url);
            console.log('Using token (first 20 chars):', token.substring(0, 20) + '...');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9,da;q=0.8',
                    'Origin': 'https://www.nemlig.com',
                    'Referer': 'https://www.nemlig.com/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                },
            });

            console.log(`Search response status for "${item}":`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Search failed for "${item}":`, response.status, errorText);
                throw new Error(`Search failed for "${item}": ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`Search successful for "${item}":`, data?.Products?.Products?.length || 0, 'products found');

            return data;
        } catch (error) {
            console.error(`Failed to search for "${item}":`, error);
            throw error;
        }
    }
}