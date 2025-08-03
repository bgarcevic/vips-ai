export function generateTimestamp() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let timestamp = 'AAAAAAAA-';
    for (let i = 0; i < 8; i++) {
        timestamp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return timestamp;
}

export function generateTimeslotUtc() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `${year}${month}${day}${hour}-120-600`;
}

export function filterProductData(apiResponse) {
    if (!apiResponse.Products || !apiResponse.Products.Products) {
        return {
            Products: { Products: [], NumFound: 0 },
            ProductsNumFound: 0
        };
    }

    const filteredProducts = apiResponse.Products.Products
        .map(product => {
            const filtered = {
                Id: product.Id,
                Name: product.Name,
                Description: product.Description,
                Availability: {
                    IsAvailableInStock: product.Availability?.IsAvailableInStock || false
                },
                Price: product.Price,
                UnitPriceCalc: product.UnitPriceCalc,
                UnitPriceLabel: product.UnitPriceLabel,
                Labels: product.Labels || []
            };

            if (product.Campaign) {
                filtered.Campaign = {
                    MinQuantity: product.Campaign.MinQuantity,
                    TotalPrice: product.Campaign.TotalPrice,
                    CampaignPrice: product.Campaign.CampaignPrice,
                    Type: product.Campaign.Type,
                    DiscountSavings: product.Campaign.DiscountSavings
                };
            }

            return filtered;
        });

    return {
        Products: {
            Products: filteredProducts,
            NumFound: filteredProducts.length
        },
        ProductsNumFound: filteredProducts.length
    };
}

export function createMinimalResults(searchResults) {
    return searchResults.map(result => ({
        item: result.item,
        llmRecommendation: result.llmRecommendation,
        error: result.error,
        productCount: result.data?.ProductsNumFound || 0
    }));
}

export function generateStatusMessage(searchResults) {
    const successCount = searchResults.filter(r => !r.error).length;
    const basketSuccessCount = searchResults.filter(r => 
        r.llmRecommendation && r.llmRecommendation.includes('Tilføjet til kurv')
    ).length;
    
    let statusMessage = `Søgning færdig! ${successCount} varer analyseret, ${basketSuccessCount} tilføjet til kurv\n\nResultater:\n`;

    searchResults.forEach(result => {
        if (result.llmRecommendation) {
            statusMessage += `• ${result.llmRecommendation}\n`;
        } else if (result.error) {
            statusMessage += `• Fejl for "${result.item}": ${result.error}\n`;
        }
    });

    return statusMessage;
}